/**
 * Owner-side completion-layer helpers for the agreements flow.
 *
 * - getSigningProgress: read-only snapshot of signing state for a session
 * - reissueAgreementSignToken: burn old token + create fresh one + re-send
 * - completeIfAllSigned: advance COMPENSATION_CONFIGURED -> COMPLETED
 */
import { Resend } from 'resend';
import type { TenantContext } from '@/lib/tenant/context';
import { withTenantScope } from '@/lib/tenant/db-scope';
import { withAdminTx } from '@/lib/admin/withAdminTx';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { transitionTo, getSessionById } from './sessions';
import { OnboardingError } from './types';
import { auditLogCreateOp, AuditAction } from '@/lib/audit/write';
import { renderEmploymentAgreementPDF } from './agreement-pdf';
import { uploadAgreementPDF } from './agreement-storage';
import {
  generateRawAgreementToken,
  hashAgreementToken,
  SIGN_TOKEN_TTL_MS,
} from './agreement-tokens';
import { renderAgreementSignEmail, buildCompensationSummary } from './emails/agreement-sign';

import type { prisma as _tenantPrisma } from '@/lib/prisma';
type TenantPrisma = typeof _tenantPrisma;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = 'Kasse <onboarding@kasseapp.com>';

const BASE_URL = (() => {
  const url = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    console.warn(
      '[agreement-completion] Neither NEXTAUTH_URL nor NEXT_PUBLIC_APP_URL is set — ' +
      'falling back to https://portal.kasseapp.com.'
    );
    return 'https://portal.kasseapp.com';
  }
  return url;
})();

function getResendClient(): Resend {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(RESEND_API_KEY);
}

// ============================================================
// getSigningProgress
// ============================================================

export interface AgreementSigningProgress {
  total: number;
  signedCount: number;
  sentNotSignedCount: number;
  draftCount: number;
  agreements: Array<{
    id: string;
    staffId: string;
    staffName: string | null;
    staffEmail: string | null;
    status: string;
    sentAt: Date | null;
    viewedAt: Date | null;
    signedAt: Date | null;
    expiresAt: Date | null;
    tokenConsumedButNotSigned: boolean;
  }>;
}

export async function getSigningProgress(args: {
  prisma: TenantPrisma;
  ctx: TenantContext;
  input: { sessionId: string; organizationId: string; locationId: string };
  authenticatedUserId: string;
}): Promise<AgreementSigningProgress> {
  const session = await getSessionById(args.input.sessionId);
  if (!session) throw new OnboardingError('SESSION_NOT_FOUND', 'session not found');
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session does not belong to authenticated user');
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session organization mismatch');
  }
  if (session.locationId !== args.input.locationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session location mismatch');
  }

  const result = await withTenantScope(args.prisma, args.ctx, async (tx) => {
    const agreements = await tx.employmentAgreement.findMany({
      where: {
        organizationId: args.input.organizationId,
        staff: { locationId: args.input.locationId, softDeletedAt: null },
      },
      include: {
        staff: { select: { id: true, name: true, email: true } },
        agreementSignToken: { select: { consumedAt: true } },
      },
    });

    return agreements.map((a) => ({
      id: a.id,
      staffId: a.staffId,
      staffName: a.staff.name,
      staffEmail: a.staff.email,
      status: a.status,
      sentAt: a.sentAt,
      viewedAt: a.viewedAt,
      signedAt: a.signedAt,
      expiresAt: a.expiresAt,
      tokenConsumedButNotSigned:
        a.status === 'SENT' && a.agreementSignToken?.consumedAt != null,
    }));
  });

  return {
    total: result.length,
    signedCount: result.filter((a) => a.status === 'SIGNED').length,
    sentNotSignedCount: result.filter((a) => a.status === 'SENT').length,
    draftCount: result.filter((a) => a.status === 'DRAFT').length,
    agreements: result,
  };
}

// ============================================================
// reissueAgreementSignToken
// ============================================================

export async function reissueAgreementSignToken(args: {
  prisma: TenantPrisma;
  ctx: TenantContext;
  input: { sessionId: string; agreementId: string; organizationId: string; locationId: string };
  authenticatedUserId: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<{ result: 'reissued' | 'email_failed'; expiresAt: Date }> {
  const session = await getSessionById(args.input.sessionId);
  if (!session) throw new OnboardingError('SESSION_NOT_FOUND', 'session not found');
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session ownership mismatch');
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session org mismatch');
  }
  if (session.locationId !== args.input.locationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session location mismatch');
  }

  const data = await withTenantScope(args.prisma, args.ctx, async (tx) => {
    const agreement = await tx.employmentAgreement.findFirst({
      where: {
        id: args.input.agreementId,
        organizationId: args.input.organizationId,
        staff: { locationId: args.input.locationId, softDeletedAt: null },
      },
      include: {
        staff: { include: { compensation: true } },
      },
    });

    const org = await tx.organization.findUnique({
      where: { id: args.input.organizationId },
      select: { name: true },
    });

    return { agreement, orgName: org?.name ?? 'Your Employer' };
  });

  if (!data.agreement) {
    throw new OnboardingError('SESSION_NOT_FOUND', 'agreement not found');
  }
  if (data.agreement.status !== 'SENT') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot reissue agreement in '${data.agreement.status}' state — only SENT agreements can be re-issued`
    );
  }

  const staff = data.agreement.staff;
  const compensation = staff.compensation;

  if (!staff.email) {
    throw new OnboardingError('INVITE_EMAIL_REQUIRED', 'staff member has no email');
  }

  // Regenerate PDF
  const pdfBytes = await renderEmploymentAgreementPDF({
    agreement: {
      id: data.agreement.id,
      templateType: data.agreement.templateType,
      documentTitle: data.agreement.documentTitle,
      notes: data.agreement.notes,
    },
    staff: { id: staff.id, name: staff.name, email: staff.email },
    organization: { name: data.orgName },
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

  // Upload (overwrites existing via x-upsert: true)
  await uploadAgreementPDF({
    organizationId: args.input.organizationId,
    agreementId: args.input.agreementId,
    filename: 'unsigned.pdf',
    pdfBytes,
  });

  // Generate fresh token
  const rawToken = generateRawAgreementToken();
  const tokenHash = hashAgreementToken(rawToken);
  const expiresAt = new Date(Date.now() + SIGN_TOKEN_TTL_MS);
  const now = new Date();

  // Atomic burn-and-create
  await withAdminTx((p) => [
    p.agreementSignToken.deleteMany({
      where: { agreementId: args.input.agreementId },
    }),
    p.agreementSignToken.create({
      data: {
        organizationId: args.input.organizationId,
        agreementId: args.input.agreementId,
        staffId: staff.id,
        tokenHash,
        expiresAt,
        sentAt: now,
        ipAddressIssued: args.ipAddress,
        userAgentIssued: args.userAgent,
      },
    }),
    p.employmentAgreement.update({
      where: { id: args.input.agreementId },
      data: { sentAt: now, expiresAt },
    }),
    auditLogCreateOp(p, {
      userId: args.authenticatedUserId,
      organizationId: args.input.organizationId,
      action: AuditAction.ONBOARDING_AGREEMENT_SENT,
      entity: 'EmploymentAgreement',
      entityId: args.input.agreementId,
      after: { status: 'SENT', staffId: staff.id, staffName: staff.name, reissued: true },
      metadata: {
        reissue: true,
        tokenExpiresAt: expiresAt.toISOString(),
      },
    }),
  ]);

  // Send email (best-effort)
  const signingUrl = `${BASE_URL}/agreements/sign/${rawToken}`;
  const compSummary = compensation
    ? buildCompensationSummary(compensation)
    : 'See attached agreement';
  const effectiveStart = compensation
    ? compensation.effectiveStartDate.toISOString().slice(0, 10)
    : 'TBD';

  const emailContent = renderAgreementSignEmail({
    staffName: staff.name ?? 'Team Member',
    organizationName: data.orgName,
    templateType: data.agreement.templateType ?? 'Employment',
    compensationSummary: compSummary,
    effectiveStartDate: effectiveStart,
    signingUrl,
    expiresAt,
  });

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: RESEND_FROM,
      to: staff.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
    return { result: 'reissued', expiresAt };
  } catch (emailErr) {
    console.error('[AGREEMENT_REISSUE_EMAIL_FAILED] reissue saved but email failed', {
      agreementId: args.input.agreementId,
      staffId: staff.id,
      errorName: emailErr instanceof Error ? emailErr.name : 'unknown',
    });
    return { result: 'email_failed', expiresAt };
  }
}

// ============================================================
// completeIfAllSigned
// ============================================================

export async function completeIfAllSigned(args: {
  prisma: TenantPrisma;
  ctx: TenantContext;
  input: {
    sessionId: string;
    organizationId: string;
    locationId: string;
    force?: boolean;
  };
  authenticatedUserId: string;
}): Promise<{
  advanced: boolean;
  reason: 'completed' | 'already_completed' | 'not_all_signed' | 'forced';
  signedCount: number;
  total: number;
}> {
  const session = await getSessionById(args.input.sessionId);
  if (!session) throw new OnboardingError('SESSION_NOT_FOUND', 'session not found');
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session ownership mismatch');
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session org mismatch');
  }
  if (session.locationId !== args.input.locationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session location mismatch');
  }

  if (session.state === 'COMPLETED') {
    return { advanced: false, reason: 'already_completed', signedCount: 0, total: 0 };
  }

  if (session.state !== 'COMPENSATION_CONFIGURED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot complete from state '${session.state}' — must be COMPENSATION_CONFIGURED`
    );
  }

  const counts = await withTenantScope(args.prisma, args.ctx, async (tx) => {
    const agreements = await tx.employmentAgreement.findMany({
      where: {
        organizationId: args.input.organizationId,
        staff: { locationId: args.input.locationId, softDeletedAt: null },
      },
      select: { status: true },
    });
    return {
      total: agreements.length,
      signed: agreements.filter((a) => a.status === 'SIGNED').length,
    };
  });

  if (args.input.force) {
    await transitionTo({
      sessionId: args.input.sessionId,
      toState: 'COMPLETED',
      triggeredByUserId: args.authenticatedUserId,
      metadata: {
        forced: true,
        signedCount: counts.signed,
        totalCount: counts.total,
        unsignedCount: counts.total - counts.signed,
      },
    });
    // Set the authoritative done-flag so the dashboard gate stops
    // routing the owner back into the wizard.
    await prismaAdmin.organization.update({
      where: { id: args.input.organizationId },
      data: { onboardingCompleted: true },
    });
    return { advanced: true, reason: 'forced', signedCount: counts.signed, total: counts.total };
  }

  if (counts.total === 0 || counts.signed === counts.total) {
    await transitionTo({
      sessionId: args.input.sessionId,
      toState: 'COMPLETED',
      triggeredByUserId: args.authenticatedUserId,
      metadata: {
        forced: false,
        allSigned: counts.total > 0,
        noAgreements: counts.total === 0,
        signedCount: counts.signed,
        totalCount: counts.total,
      },
    });
    await prismaAdmin.organization.update({
      where: { id: args.input.organizationId },
      data: { onboardingCompleted: true },
    });
    return { advanced: true, reason: 'completed', signedCount: counts.signed, total: counts.total };
  }

  return { advanced: false, reason: 'not_all_signed', signedCount: counts.signed, total: counts.total };
}
