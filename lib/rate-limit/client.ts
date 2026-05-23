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

let cachedClient: Redis | null | undefined = undefined  // undefined = not yet attempted
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
 * Test helper: reset the cached client AND warning flag. Only use in tests.
 */
export function _resetRedisClient(): void {
  cachedClient = undefined
  hasWarnedAboutMissingEnvVars = false
}
