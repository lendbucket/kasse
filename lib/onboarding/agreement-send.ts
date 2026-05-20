/**
 * Orchestrator: send all DRAFT EmploymentAgreements for an onboarding session.
 *
 * Per-agreement flow:
 *   1. Render PDF (agreement-pdf.ts)
 *   2. Upload to Supabase Storage (agreement-storage.ts)
 *   3. Generate signing token (agreement-tokens.ts)
 *   4. Atomic DB write via withAdminTx: EmploymentAgreement.update +
 *      AgreementSignToken.create + audit log
 *   5. Send signing email via Resend
 *
 * Steps 1-4 are per-recipient atomic: if any throws, the agreement
 * stays at DRAFT and the failure is recorded in the response. Step 5
 * (email) is best-effort — DB rows are authoritative.
 *
 * ORDERING RATIONALE: DB writes first, then upload, then email. This
 * mirrors magic-link.ts (lines 88-97): an orphaned SENT row without
 * a delivered email is recoverable (owner re-triggers); a delivered
 * email linking to a nonexistent token is not.
 *
 * Actually, we reverse the PDF upload to BEFORE the DB write so the
 * documentUrl is a real signed URL, not a placeholder. Sequence:
 *   a. Render PDF
 *   b. Upload PDF → get signed download URL
 *   c. Generate token
 *   d. withAdminTx: update agreement (status=SENT, documentUrl=signedUrl)
 *      + create token + audit log
 *   e. Send email (best-effort)
 *
 * If (d) fails after (b), an orphaned PDF in Storage is harmless
 * (no token was created, so no one can access it via the signing flow).
 */
import { Resend } from 'resend';
import { withAdminTx } from '@/lib/admin/withAdminTx';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import { auditLogCreateOp, AuditAction } from '@/lib/audit/write';
import { renderEmploymentAgreementPDF } from './agreement-pdf';
import { uploadAgreementPDF, createSignedDownloadUrl } from './agreement-storage';
import {
  generateRawAgreementToken,
  hashAgreementToken,
  SIGN_TOKEN_TTL_MS,
} from './agreement-tokens';
import { renderAgreementSignEmail, buildCompensationSummary } from './emails/agreement-sign';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = 'Kasse <onboarding@kasseapp.com>';
const BASE_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.kasseapp.com';

function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(RESEND_API_KEY);
}

export async function sendAllAgreementsForSession(args: {
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
  sentCount: number;
  failedCount: number;
  failures: Array<{ agreementId: string; staffName: string | null; error: string }>;
}> {
  const { input } = args;

  // 1. Session validation (mirrors compensation.ts pattern)
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

  // 2. Load all DRAFT EmploymentAgreements at this org+location
  const agreements = await prismaAdmin.employmentAgreement.findMany({
    where: {
      organizationId: input.organizationId,
      status: 'DRAFT',
      staff: { locationId: input.locationId, softDeletedAt: null },
    },
    include: {
      staff: {
        include: {
          compensation: true,
        },
      },
    },
  });

  // Also load the org name for the email/PDF
  const org = await prismaAdmin.organization.findUnique({
    where: { id: input.organizationId },
    select: { name: true },
  });
  const orgName = org?.name ?? 'Your Employer';

  // 3. If no agreements, return empty (handles skip-agreements path)
  if (agreements.length === 0) {
    return { sentCount: 0, failedCount: 0, failures: [] };
  }

  const resend = getResendClient();
  const results: {
    sentCount: number;
    failedCount: number;
    failures: Array<{ agreementId: string; staffName: string | null; error: string }>;
  } = { sentCount: 0, failedCount: 0, failures: [] };

  // 4. Per-agreement loop — isolated failures
  for (const agreement of agreements) {
    const staff = agreement.staff;
    const compensation = staff.compensation;

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

      // b. Upload PDF + get signed URL
      const { path } = await uploadAgreementPDF({
        organizationId: input.organizationId,
        agreementId: agreement.id,
        filename: 'unsigned.pdf',
        pdfBytes,
      });

      const signedUrlTtlSec = Math.floor(SIGN_TOKEN_TTL_MS / 1000);
      const { signedUrl } = await createSignedDownloadUrl({
        path,
        expiresInSec: signedUrlTtlSec,
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
            documentUrl: signedUrl,
            expiresAt,
          },
        }),
        // AgreementSignToken model was added to schema.prisma in this PR.
        // Prisma client types are regenerated at build time via `prisma generate`.
        // The cast is needed until the next `npx prisma generate` or `prisma db pull`.
        (p as any).agreementSignToken.create({
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

      // e. Send email (best-effort)
      const signingUrl = `${BASE_URL}/agreements/sign/${rawToken}`;
      const recipientEmail = input.isTest
        ? args.authenticatedUserEmail
        : staff.email;

      if (recipientEmail) {
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
        } catch (emailErr) {
          // DEGRADED: DB rows committed at SENT but email didn't go out.
          // Recovery: owner re-triggers send for this agreement (P1.A.7-d).
          console.error(
            '[DEGRADED_AGREEMENT_SEND] agreement marked SENT but email failed',
            {
              agreementId: agreement.id,
              staffId: staff.id,
              error: emailErr instanceof Error ? emailErr.message : String(emailErr),
            }
          );
        }
      }

      results.sentCount++;
    } catch (err) {
      results.failedCount++;
      results.failures.push({
        agreementId: agreement.id,
        staffName: staff.name,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(
        '[AGREEMENT_SEND_FAILED] failed to process agreement',
        {
          agreementId: agreement.id,
          staffId: staff.id,
          error: err instanceof Error ? err.message : String(err),
        }
      );
    }
  }

  return results;
}
