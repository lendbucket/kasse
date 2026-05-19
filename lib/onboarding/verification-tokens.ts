import { randomBytes, createHash } from 'crypto';
import { prismaAdmin } from '@/lib/prismaAdmin';
import {
  type VerificationTokenPurpose,
  type VerificationTokenRecord,
  OnboardingError,
} from './types';

const RAW_TOKEN_BYTES = 32; // 64 hex chars
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateRawToken(): string {
  return randomBytes(RAW_TOKEN_BYTES).toString('hex');
}

/**
 * Issue a new verification token for a session. Stores ONLY the hash; the
 * raw token is returned once and never recoverable from the DB.
 */
export async function issueToken(args: {
  sessionId: string;
  purpose: VerificationTokenPurpose;
  ttlMs?: number;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const ttl = args.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);

  await prismaAdmin.onboardingVerificationToken.create({
    data: {
      sessionId: args.sessionId,
      tokenHash,
      purpose: args.purpose,
      expiresAt,
      ipAddressIssued: args.ipAddress ?? null,
      userAgentIssued: args.userAgent ?? null,
    },
  });

  return { rawToken, expiresAt };
}

/**
 * Consume a token. Single-use semantics enforced via atomic update:
 * UPDATE ... SET consumedAt = now() WHERE tokenHash = ? AND consumedAt IS NULL
 * AND expiresAt > now() AND purpose = ?
 *
 * Returns the consumed token record on success. Throws on:
 * - INVALID_TOKEN — no matching hash
 * - TOKEN_ALREADY_CONSUMED — found but consumedAt is set
 * - SESSION_EXPIRED — found but expiresAt past
 * - WRONG_TOKEN_PURPOSE — found but purpose doesn't match
 */
export async function consumeToken(args: {
  rawToken: string;
  expectedPurpose: VerificationTokenPurpose;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<VerificationTokenRecord> {
  const tokenHash = hashToken(args.rawToken);
  const now = new Date();

  // Atomic consumption via updateMany — returns count which tells us if
  // the conditions held at the time of the update.
  const result = await prismaAdmin.onboardingVerificationToken.updateMany({
    where: {
      tokenHash,
      purpose: args.expectedPurpose,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: {
      consumedAt: now,
      ipAddressConsumed: args.ipAddress ?? null,
      userAgentConsumed: args.userAgent ?? null,
    },
  });

  if (result.count === 0) {
    // Re-fetch to distinguish which condition failed for better error reporting.
    const existing = await prismaAdmin.onboardingVerificationToken.findUnique({
      where: { tokenHash },
    });
    if (!existing) {
      throw new OnboardingError('INVALID_TOKEN', 'no matching token');
    }
    if (existing.consumedAt) {
      throw new OnboardingError(
        'TOKEN_ALREADY_CONSUMED',
        'token has already been used'
      );
    }
    if (existing.expiresAt < now) {
      throw new OnboardingError('SESSION_EXPIRED', 'verification token expired');
    }
    if (existing.purpose !== args.expectedPurpose) {
      throw new OnboardingError(
        'WRONG_TOKEN_PURPOSE',
        `token is for '${existing.purpose}', expected '${args.expectedPurpose}'`
      );
    }
    // Race: another concurrent consume won. Treat as already-consumed.
    throw new OnboardingError(
      'TOKEN_ALREADY_CONSUMED',
      'token consumed by concurrent request'
    );
  }

  // Return the consumed row
  const consumed = await prismaAdmin.onboardingVerificationToken.findUnique({
    where: { tokenHash },
  });
  if (!consumed) {
    throw new OnboardingError('INVALID_TOKEN', 'consumed token not found on re-read');
  }
  return consumed as unknown as VerificationTokenRecord;
}

export { DEFAULT_TTL_MS };
