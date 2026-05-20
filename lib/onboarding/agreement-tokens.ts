/**
 * Token generation + hashing for AgreementSignTokens.
 * Mirrors the StaffInvitation token pattern in staff-invites.ts.
 *
 * Raw token is returned to the caller ONCE (for email). Only the
 * SHA-256 hash is stored in the database. Single-use consumption
 * via updateMany at acceptance time (P1.A.7-c).
 */
import { randomBytes, createHash } from 'crypto';

const RAW_TOKEN_BYTES = 32;

/** 7 days in ms — matches StaffInvitation TTL. */
export const SIGN_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashAgreementToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateRawAgreementToken(): string {
  return randomBytes(RAW_TOKEN_BYTES).toString('hex');
}
