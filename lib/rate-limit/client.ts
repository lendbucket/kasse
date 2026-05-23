/**
 * P1.A.13: Upstash Redis client for rate limiting.
 *
 * Lazy singleton — only instantiated when env vars are present. Detection
 * happens once at module load and is cached. When env vars are missing,
 * `getRedisClient()` returns null and the consumer should fail-open.
 *
 * Required env vars (Vercel):
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * NOTE FOR LOCAL DEV: The cached Redis instance persists across Next.js HMR
 * cycles. After adding/changing UPSTASH_REDIS_REST_* env vars, the client
 * will pick them up on the next call (the "not configured" state is NOT
 * cached). Constructor failures ARE cached — restart the dev server if the
 * credentials themselves are wrong.
 */
import { Redis } from "@upstash/redis"

// Three-state sentinel:
//   undefined = not yet attempted
//   null      = attempted, constructor failed (cached — don't retry)
//   Redis     = live, cached for process lifetime
//
// The "not configured" state (missing env vars) is NOT cached — env vars
// added mid-session are picked up on the next call.
//
// NOTE ON CREDENTIAL ROTATION: Once a Redis client is successfully
// constructed, it is permanently cached for the process lifetime. If
// UPSTASH_REDIS_REST_TOKEN is rotated (e.g. via Upstash console), the
// new token is NOT picked up by running Vercel instances until they
// cold-start (typically on next deploy or after idle timeout). To force
// pickup, trigger a redeploy of the Kasse project on Vercel.
let cachedClient: Redis | null | undefined = undefined
let hasWarnedAboutMissingEnvVars = false

export function getRedisClient(): Redis | null {
  // Return cached instance if we have one
  if (cachedClient !== undefined) return cachedClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // INTENTIONAL: do NOT cache null here. If env vars are added later
    // (e.g. Vercel deploy with newly-set secrets), the next call should
    // pick them up without requiring a process restart. The warning is
    // gated by a separate flag so we don't spam logs.
    if (!hasWarnedAboutMissingEnvVars) {
      console.warn(
        "[rate-limit] Upstash env vars missing — rate limiting disabled. " +
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.",
      )
      hasWarnedAboutMissingEnvVars = true
    }
    return null
  }

  // Reset the warning flag in case env vars were missing earlier and are
  // now present — useful for dev where env vars get added mid-session.
  hasWarnedAboutMissingEnvVars = false

  try {
    cachedClient = new Redis({ url, token })
    return cachedClient
  } catch (err) {
    // Constructor failure IS cached — if Upstash credentials are invalid,
    // every subsequent call would throw the same error. Don't retry
    // on every request.
    console.warn("[rate-limit] failed to instantiate Upstash Redis client:", err)
    cachedClient = null
    return null
  }
}

/**
 * @internal — test use only. Resets the cached Redis client and warning
 * flag so subsequent calls re-attempt initialization. Not intended for
 * production code paths.
 */
export function _resetRedisClient(): void {
  cachedClient = undefined
  hasWarnedAboutMissingEnvVars = false
}
