/**
 * P1.A.13: Rate limit check for auth-adjacent routes.
 *
 * Sliding window: 10 attempts per 10 minutes per (IP, endpoint, identifier).
 *
 * 3-axis key: `kasse:rl:{endpoint}:{ip}:{identifier}` — limits each combo
 * independently. Defeats both "1 IP, many emails" and "1 email, many IPs"
 * attacks.
 *
 * Fail-open behavior: when Upstash is unreachable or env vars are missing,
 * returns `{ ok: true, remaining: -1, limit: -1, reset: 0 }`. A structured
 * console.warn surfaces the failure in Vercel logs.
 */
import { Ratelimit } from "@upstash/ratelimit"
import { getRedisClient } from "./client"

export interface RateLimitResult {
  ok: boolean
  remaining: number
  limit: number
  reset: number  // epoch ms of window reset
}

const FAIL_OPEN_RESULT: RateLimitResult = {
  ok: true,
  remaining: -1,
  limit: -1,
  reset: 0,
}

// Module-level cached limiter — Ratelimit instances are cheap but caching
// avoids redundant config parsing on every check.
let cachedLimiter: Ratelimit | null = null

function getLimiter(): Ratelimit | null {
  if (cachedLimiter) return cachedLimiter

  const redis = getRedisClient()
  if (!redis) return null

  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"),  // 10 attempts per 10 minutes
    prefix: "kasse:rl",
    analytics: false,  // skip analytics writes — saves Upstash command count
  })

  return cachedLimiter
}

/**
 * Check whether the (ip, endpoint, identifier) combo has exceeded the limit.
 *
 * @param endpoint - logical name, e.g. "register" or "signin-credentials"
 * @param ip - client IP from x-real-ip (preferred) or last-hop x-forwarded-for
 * @param identifier - email if present, otherwise fall back to ip itself
 *                    (so unauthenticated requests still get IP-only limiting)
 */
export async function checkRateLimit(
  endpoint: string,
  ip: string | null,
  identifier: string | null,
): Promise<RateLimitResult> {
  const limiter = getLimiter()
  if (!limiter) return FAIL_OPEN_RESULT

  // Normalize: lowercase email, strip whitespace, fall back to ip
  const normalizedIp = (ip ?? "unknown-ip").trim().toLowerCase()
  const normalizedIdentifier = (identifier ?? normalizedIp).trim().toLowerCase()
  const key = `${endpoint}:${normalizedIp}:${normalizedIdentifier}`

  try {
    const result = await limiter.limit(key)
    return {
      ok: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset,
    }
  } catch (err) {
    console.warn(
      "[rate-limit] Upstash check failed — failing open. " +
      `endpoint=${endpoint} err=${(err as Error).message}`,
    )
    return FAIL_OPEN_RESULT
  }
}

/**
 * Helper to extract trustworthy IP from a NextRequest. Mirrors the
 * x-real-ip + x-forwarded-for last-hop pattern used elsewhere.
 */
export function getClientIp(headers: Headers): string | null {
  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    null
  )
}
