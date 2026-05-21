/**
 * Atomic consumption of an AgreementSignToken + signature recording.
 *
 * Race-safe via updateMany + count check (same pattern as
 * lib/onboarding/verification-tokens.ts consumeToken and
 * lib/onboarding/staff-invites.ts acceptStaffInvitation).
 *
 * Flow:
 *   1. Pre-check: load token + agreement + staff for validation
 *   2. Name match (case-insensitive, soft block)
 *   3. Atomic consume: updateMany WHERE consumedAt IS NULL AND expiresAt > now()
 *   4. withAdminTx: EmploymentAgreement → SIGNED + audit log
 *
 * Window between (3) and (4): token is consumed but agreement isn't yet
 * SIGNED. If (4) fails, the token is burned and the owner must re-issue
 * via P1.A.7-d. Logged as AGREEMENT_SIGN_COMMIT_FAILED for visibility.
 */
import { prismaAdmin } from '@/lib/prismaAdmin';
import { withAdminTx } from '@/lib/admin/withAdminTx';
import { auditLogCreateOp, AuditAction } from '@/lib/audit/write';
import { hashAgreementToken } from './agreement-tokens';

export class AgreementSignError extends Error {
  constructor(
    public code:
      | 'INVALID_TOKEN'
      | 'TOKEN_ALREADY_CONSUMED'
      | 'SESSION_EXPIRED'
      | 'NAME_MISMATCH'
      | 'STATE_MISMATCH',
    message: string
  ) {
    super(message);
    this.name = 'AgreementSignError';
  }
}

export async function consumeAgreementSignToken(args: {
  rawToken: string;
  typedName: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<{ signedAt: Date; agreementId: string }> {
  const tokenHash = hashAgreementToken(args.rawToken);
  const now = new Date();

  // 1. Pre-check: load the token + agreement + staff for validation.
  // Uses prismaAdmin because this is a public route with no tenant context.
  // Same pattern as /api/onboarding/verify (PRE_SESSION route).
  const tokenRow = await prismaAdmin.agreementSignToken.findUnique({
    where: { tokenHash },
    include: {
      agreement: {
        select: { id: true, status: true, organizationId: true },
      },
      staff: {
        select: { id: true, name: true },
      },
    },
  });

  if (!tokenRow) {
    throw new AgreementSignError('INVALID_TOKEN', 'no matching token');
  }
  if (tokenRow.consumedAt) {
    throw new AgreementSignError('TOKEN_ALREADY_CONSUMED', 'token has already been used');
  }
  if (tokenRow.expiresAt < now) {
    throw new AgreementSignError('SESSION_EXPIRED', 'signing link expired');
  }
  if (tokenRow.agreement.status !== 'SENT') {
    throw new AgreementSignError(
      'STATE_MISMATCH',
      `agreement is in '${tokenRow.agreement.status}' state, expected SENT`
    );
  }

  // 2. Name match check (case-insensitive, trim-tolerant).
  // Intentional fraud friction — not a hard block if staff.name is empty.
  const onFileName = (tokenRow.staff.name ?? '').trim().toLowerCase();
  const typedNameLower = args.typedName.trim().toLowerCase();
  if (onFileName && onFileName !== typedNameLower) {
    throw new AgreementSignError(
      'NAME_MISMATCH',
      'typed name does not match the name on file'
    );
  }

  // 3. Atomic consume: race-safe single-use enforcement.
  // If another concurrent request won, count = 0 -> throw.
  const consumeResult = await prismaAdmin.agreementSignToken.updateMany({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      consumedAt: now,
      ipAddressConsumed: args.ipAddress,
      userAgentConsumed: args.userAgent,
    },
  });

  if (consumeResult.count === 0) {
    throw new AgreementSignError(
      'TOKEN_ALREADY_CONSUMED',
      'token consumed by concurrent request'
    );
  }

  // 4. Token is consumed. Commit the signature evidence on the agreement
  // and write the audit log atomically via withAdminTx.
  try {
    await withAdminTx((p) => [
      p.employmentAgreement.update({
        where: { id: tokenRow.agreementId },
        data: {
          status: 'SIGNED',
          signedAt: now,
          signatureDataUrl: args.typedName,
          signatureIpAddress: args.ipAddress,
          signatureUserAgent: args.userAgent,
        },
      }),
      auditLogCreateOp(p, {
        userId: null,
        organizationId: tokenRow.agreement.organizationId,
        action: AuditAction.ONBOARDING_AGREEMENT_SIGNED,
        entity: 'EmploymentAgreement',
        entityId: tokenRow.agreementId,
        after: {
          status: 'SIGNED',
          staffId: tokenRow.staff.id,
          signedAt: now.toISOString(),
        },
        metadata: {
          ipAddressConsumed: args.ipAddress,
          userAgentConsumed: args.userAgent,
          tokenHashShort: tokenHash.slice(0, 8),
        },
      }),
    ]);
  } catch (writeErr) {
    // Token was consumed but signature didn't commit. Log loudly.
    // Owner can recover via re-issue in P1.A.7-d.
    console.error(
      '[AGREEMENT_SIGN_COMMIT_FAILED] token consumed but agreement update failed',
      {
        agreementId: tokenRow.agreementId,
        staffId: tokenRow.staff.id,
        tokenHashShort: tokenHash.slice(0, 8),
        errorName: writeErr instanceof Error ? writeErr.name : 'unknown',
      }
    );
    throw writeErr;
  }

  return {
    signedAt: now,
    agreementId: tokenRow.agreementId,
  };
}
