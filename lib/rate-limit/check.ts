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

// Frozen to prevent accidental mutation by callers. checkRateLimit returns
// this reference directly when failing open; if a caller did
// `const r = await checkRateLimit(...); r.remaining = 0;` they would
// otherwise corrupt every subsequent fail-open response.
const FAIL_OPEN_RESULT: RateLimitResult = Object.freeze({
  ok: true,
  remaining: -1,
  limit: -1,
  reset: 0,
})

// Module-level cached limiter — Ratelimit instances are cheap but caching
// avoids redundant config parsing on every check. The "not configured"
// state is NOT cached so env vars added mid-session are picked up.
let cachedLimiter: Ratelimit | null = null

function getLimiter(): Ratelimit | null {
  if (cachedLimiter) return cachedLimiter

  const redis = getRedisClient()
  if (!redis) {
    // Don't cache null — if Redis becomes available on a later call,
    // we want getLimiter to pick it up without process restart.
    return null
  }

  cachedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    prefix: "kasse:rl",
    analytics: false,
  })

  return cachedLimiter
}

/**
 * Check whether the (ip, endpoint, identifier) combo has exceeded the limit.
 *
 * @param endpoint - logical name, e.g. "register" or "signin-credentials"
 * @param ip - client IP from `getRateLimitIp` in `@/lib/http/headers`
 *             (x-real-ip preferred, first-hop x-forwarded-for fallback) or
 *             getRateLimitIpFromNextAuthReq() in lib/auth.ts
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

  // Degenerate case: if ip is null, both normalizedIp and normalizedIdentifier
  // collapse to "unknown-ip", making the key `endpoint:unknown-ip:unknown-ip`.
  // All null-IP traffic shares one rate-limit bucket. This is intentional —
  // we still want SOME limiting on null-IP requests (e.g. tests, server-to-
  // server probes that don't set forwarded headers), but at low priority
  // since legitimate users always have an IP from Vercel's edge.
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
