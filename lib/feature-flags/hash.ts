import { createHash } from 'crypto';

/**
 * Compute a stable hash bucket (0-99) for a flag+org pair.
 * Same flag + same org always produces the same bucket. This makes rollout
 * decisions deterministic across requests.
 */
export function computeFlagBucket(flagKey: string, orgId: string): number {
  const hash = createHash('sha256').update(`${flagKey}:${orgId}`).digest();
  // Take first 4 bytes as a 32-bit unsigned int, mod 100
  const value = hash.readUInt32BE(0);
  return value % 100;
}
