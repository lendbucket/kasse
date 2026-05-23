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
 */
import { Redis } from "@upstash/redis"

let cachedClient: Redis | null | undefined = undefined  // undefined = not yet attempted

export function getRedisClient(): Redis | null {
  if (cachedClient !== undefined) return cachedClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn(
      "[rate-limit] Upstash env vars missing — rate limiting disabled. " +
      "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.",
    )
    cachedClient = null
    return null
  }

  try {
    cachedClient = new Redis({ url, token })
    return cachedClient
  } catch (err) {
    console.warn("[rate-limit] failed to instantiate Upstash Redis client:", err)
    cachedClient = null
    return null
  }
}

/**
 * Test helper: reset the cached client. Only use in tests.
 */
export function _resetRedisClient(): void {
  cachedClient = undefined
}
