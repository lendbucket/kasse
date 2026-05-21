/**
 * Orchestrator: send all DRAFT EmploymentAgreements for an onboarding session.
 *
 * Per-agreement flow:
 *   a. Validate staff has email (skip if missing)
 *   b. Render PDF (agreement-pdf.ts)
 *   c. Upload PDF to Supabase Storage (agreement-storage.ts)
 *   d. Generate signing token (agreement-tokens.ts)
 *   e. Atomic DB write via withAdminTx: EmploymentAgreement.update +
 *      AgreementSignToken.create + audit log
 *   f. Send signing email via Resend (best-effort)
 *
 * Steps a-e are per-recipient: if any throws, the agreement stays at
 * DRAFT and the failure is recorded in the response. Step f (email) is
 * best-effort — DB rows are authoritative.
 *
 * RESULT COUNTS (mutually exclusive, sum to total processed):
 *   - deliveredCount: DB committed AND email delivered. Fully sent.
 *   - degradedCount: DB committed but email failed. Token/PDF exist;
 *     staff didn't get notified. Owner must follow up (P1.A.7-d).
 *   - failedCount: DB not committed. Agreement stays at DRAFT, retryable.
 *
 * ORDERING RATIONALE: PDF upload BEFORE DB write so documentUrl points
 * to a real storage path (not a placeholder). DB write BEFORE email so
 * that a delivered email always points to an existing token. Email last
 * because it's the least critical and most recoverable. This mirrors
 * magic-link.ts (lines 88-97).
 *
 * READS: agreement + org lookups run inside withTenantScope (RLS-enforced).
 * WRITES: the multi-table atomic batch uses withAdminTx because
 * EmploymentAgreement and AgreementSignToken have different RLS policies
 * and the batch needs superadmin context (same as #95 transitionTo).
 * getSessionById stays as prismaAdmin — OnboardingSession is
 * SUPERADMIN_PROTECTED, and session ownership is enforced immediately.
 */
import { Resend } from 'resend';
import { withAdminTx } from '@/lib/admin/withAdminTx';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { withTenantScope } from '@/lib/tenant/db-scope';
import type { TenantContext } from '@/lib/tenant/context';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import { auditLogCreateOp, AuditAction } from '@/lib/audit/write';
import { renderEmploymentAgreementPDF } from './agreement-pdf';
import {
  uploadAgreementPDF,
  buildStoragePathMarker,
} from './agreement-storage';
import {
  generateRawAgreementToken,
  hashAgreementToken,
  SIGN_TOKEN_TTL_MS,
} from './agreement-tokens';
import { renderAgreementSignEmail, buildCompensationSummary } from './emails/agreement-sign';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = 'Kasse <onboarding@kasseapp.com>';

const BASE_URL = (() => {
  const url = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    console.warn(
      '[agreement-send] Neither NEXTAUTH_URL nor NEXT_PUBLIC_APP_URL is set — ' +
      'falling back to hardcoded https://portal.kasseapp.com. ' +
      'Set NEXTAUTH_URL in Vercel for staging/preview deploys.'
    );
    return 'https://portal.kasseapp.com';
  }
  return url;
})();

function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(RESEND_API_KEY);
}

/**
 * Classify an error into a stable code for client response. Raw error
 * messages can contain PII (staff emails from Resend errors, paths
 * from Storage errors). Only stable codes are returned to the client;
 * detail is logged server-side.
 */
function classifyAgreementSendError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  // Order matters: check our own prefixed error messages first, before
  // broad substring matches that could false-positive on DB error text.
  if (msg.startsWith('[agreement-pdf]')) return 'PDF_RENDER_FAILED';
  if (msg.startsWith('[agreement-storage] upload failed')) return 'STORAGE_UPLOAD_FAILED';
  if (msg.startsWith('[agreement-storage] signed URL')) return 'SIGNED_URL_FAILED';

  // Resend-specific patterns — match the domain or constructor prefix,
  // not the generic word "email" which appears in constraint errors.
  if (msg.includes('resend.com') || msg.startsWith('Resend ')) return 'EMAIL_SEND_FAILED';

  // Prisma constraint errors (P200x family = unique/FK violations)
  if (msg.startsWith('P200') || msg.startsWith('P201')) return 'TOKEN_CREATE_FAILED';

  return 'UNKNOWN_ERROR';
}

// args.prisma must be the tenant-scoped prisma instance from @/lib/prisma.
// The type `typeof prisma` captures the specific PrismaClient shape from
// that module — prismaAdmin has a different $extends wrapper (rolbypassrls)
// so passing it here will produce a compile error if the wrappers diverge.
// See docs/RLS_AUDIT.md "P1.A.7-b — Supabase Storage Integration".
import type { prisma as _tenantPrisma } from '@/lib/prisma';
type TenantPrisma = typeof _tenantPrisma;

export async function sendAllAgreementsForSession(args: {
  prisma: TenantPrisma;
  ctx: TenantContext;
  input: {
    sessionId: string;
    organizationId: string;
    locationId: string;
    isTest?: boolean;
  };
  authenticatedUserId: string;
  authenticatedUserEmail: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{
  deliveredCount: number;
  failedCount: number;
  degradedCount: number;
  failures: Array<{ agreementId: string; staffName: string | null; error: string }>;
  degraded: Array<{ agreementId: string; staffName: string | null; reason: string }>;
}> {
  const { input } = args;

  // 1. Session validation via prismaAdmin (OnboardingSession is SUPERADMIN_PROTECTED)
  const session = await getSessionById(input.sessionId);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', 'session not found');
  }
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session does not belong to authenticated user');
  }
  if (session.organizationId !== input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session organization does not match input');
  }
  if (session.locationId !== input.locationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session location does not match input');
  }
  if (session.state !== 'COMPENSATION_CONFIGURED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot send agreements from state '${session.state}' — must be COMPENSATION_CONFIGURED`
    );
  }

  // 2. Load DRAFT agreements + org via withTenantScope (RLS-enforced reads)
  const { agreements, orgName } = await withTenantScope(args.prisma, args.ctx, async (tx) => {
    const agreements = await tx.employmentAgreement.findMany({
      where: {
        organizationId: input.organizationId,
        status: 'DRAFT',
        staff: { locationId: input.locationId, softDeletedAt: null },
      },
      include: {
        staff: {
          include: { compensation: true },
        },
      },
    });

    const org = await tx.organization.findUnique({
      where: { id: input.organizationId },
      select: { name: true },
    });

    return { agreements, orgName: org?.name ?? 'Your Employer' };
  });

  // 3. If no agreements, return empty (handles skip-agreements path)
  if (agreements.length === 0) {
    return { deliveredCount: 0, failedCount: 0, degradedCount: 0, failures: [], degraded: [] };
  }

  const resend = getResendClient();
  const results = {
    deliveredCount: 0,
    failedCount: 0,
    degradedCount: 0,
    failures: [] as Array<{ agreementId: string; staffName: string | null; error: string }>,
    degraded: [] as Array<{ agreementId: string; staffName: string | null; reason: string }>,
  };

  // 4. Per-agreement loop — isolated failures
  for (const agreement of agreements) {
    const staff = agreement.staff;
    const compensation = staff.compensation;

    // Pre-batch: validate recipient email exists
    const recipientEmail = input.isTest
      ? args.authenticatedUserEmail
      : staff.email;

    if (!recipientEmail) {
      results.failedCount++;
      results.failures.push({
        agreementId: agreement.id,
        staffName: staff.name,
        error: 'STAFF_EMAIL_MISSING',
      });
      console.error(
        '[AGREEMENT_SEND_SKIPPED] staff has no email — cannot send agreement',
        { agreementId: agreement.id, staffId: staff.id }
      );
      continue;
    }

    try {
      // a. Render PDF
      const pdfBytes = await renderEmploymentAgreementPDF({
        agreement: {
          id: agreement.id,
          templateType: agreement.templateType,
          documentTitle: agreement.documentTitle,
          notes: agreement.notes,
        },
        staff: { id: staff.id, name: staff.name, email: staff.email },
        organization: { name: orgName },
        compensation: compensation
          ? {
              modelType: compensation.modelType,
              baseHourlyRateCents: compensation.baseHourlyRateCents,
              baseCommissionPct: compensation.baseCommissionPct,
              boothRentCents: compensation.boothRentCents,
              boothRentFrequency: compensation.boothRentFrequency,
              overtimeMultiplier: compensation.overtimeMultiplier,
              overtimeThresholdHours: compensation.overtimeThresholdHours,
              retailCommissionPct: compensation.retailCommissionPct,
              includeTipsInCommission: compensation.includeTipsInCommission,
              productDeductionEnabled: compensation.productDeductionEnabled,
              effectiveStartDate: compensation.effectiveStartDate,
              effectiveEndDate: compensation.effectiveEndDate,
              notes: compensation.notes,
            }
          : null,
      });

      // b. Upload PDF
      const { path } = await uploadAgreementPDF({
        organizationId: input.organizationId,
        agreementId: agreement.id,
        filename: 'unsigned.pdf',
        pdfBytes,
      });

      // Store a stable path marker in documentUrl (not a signed URL that expires).
      // Signed URLs are minted on demand by the signing flow (P1.A.7-c) — the
      // email itself only contains the signing link, not a direct PDF preview.
      const storagePath = buildStoragePathMarker({
        organizationId: input.organizationId,
        agreementId: agreement.id,
        filename: 'unsigned.pdf',
      });

      // c. Generate signing token
      const rawToken = generateRawAgreementToken();
      const tokenHash = hashAgreementToken(rawToken);
      const expiresAt = new Date(Date.now() + SIGN_TOKEN_TTL_MS);
      const now = new Date();

      // d. Atomic DB write: update agreement + create token + audit
      await withAdminTx((p) => [
        p.employmentAgreement.update({
          where: { id: agreement.id },
          data: {
            status: 'SENT',
            sentAt: now,
            documentUrl: storagePath,
            expiresAt,
          },
        }),
        p.agreementSignToken.create({
          data: {
            organizationId: input.organizationId,
            agreementId: agreement.id,
            staffId: staff.id,
            tokenHash,
            expiresAt,
            sentAt: now,
            ipAddressIssued: args.ipAddress ?? null,
            userAgentIssued: args.userAgent ?? null,
          },
        }),
        auditLogCreateOp(p, {
          userId: args.authenticatedUserId,
          organizationId: input.organizationId,
          action: AuditAction.ONBOARDING_AGREEMENT_SENT,
          entity: 'EmploymentAgreement',
          entityId: agreement.id,
          after: { status: 'SENT', staffId: staff.id, staffName: staff.name },
          metadata: {
            isTest: input.isTest ?? false,
            tokenExpiresAt: expiresAt.toISOString(),
          },
        }),
      ]);

      // e. Send email (best-effort — DB rows are authoritative)
      const signingUrl = `${BASE_URL}/agreements/sign/${rawToken}`;

      const compSummary = compensation
        ? buildCompensationSummary(compensation)
        : 'See attached agreement';

      const effectiveStart = compensation
        ? compensation.effectiveStartDate.toISOString().slice(0, 10)
        : 'TBD';

      const emailContent = renderAgreementSignEmail({
        staffName: staff.name ?? 'Team Member',
        organizationName: orgName,
        templateType: agreement.templateType ?? 'Employment',
        compensationSummary: compSummary,
        effectiveStartDate: effectiveStart,
        signingUrl,
        expiresAt,
      });

      try {
        await resend.emails.send({
          from: RESEND_FROM,
          to: recipientEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        results.deliveredCount++;
      } catch (emailErr) {
        // DEGRADED: DB rows committed at SENT but email didn't go out.
        // Recovery: owner re-triggers send for this agreement (P1.A.7-d).
        const errCode = classifyAgreementSendError(emailErr);
        results.degradedCount++;
        results.degraded.push({
          agreementId: agreement.id,
          staffName: staff.name,
          reason: errCode,
        });
        console.error(
          '[DEGRADED_AGREEMENT_SEND] agreement marked SENT but email failed',
          {
            agreementId: agreement.id,
            staffId: staff.id,
            errorCode: errCode,
            errorName: emailErr instanceof Error ? emailErr.name : 'unknown',
            // errorDetail intentionally omitted — Resend error messages embed
            // recipient email addresses (PII). errCode + errorName is sufficient
            // for debugging; raw message retrievable from Resend's own logs.
          }
        );
      }
    } catch (err) {
      results.failedCount++;
      const errCode = classifyAgreementSendError(err);
      results.failures.push({
        agreementId: agreement.id,
        staffName: staff.name,
        error: errCode,
      });
      console.error(
        '[AGREEMENT_SEND_FAILED] failed to process agreement',
        {
          agreementId: agreement.id,
          staffId: staff.id,
          errorCode: errCode,
          errorName: err instanceof Error ? err.name : 'unknown',
          // errorDetail intentionally omitted — error messages may embed PII
          // (e.g., Resend recipient address). errCode + errorName is sufficient
          // for debugging via agreementId + staffId correlation.
        }
      );
    }
  }

  return results;
}
