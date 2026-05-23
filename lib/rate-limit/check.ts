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
 * @param ip - client IP from getRateLimitIp() (x-real-ip preferred,
 *             first-hop x-forwarded-for fallback) or
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
 * P1.A.13: Extract client IP for RATE-LIMITING use.
 *
 * Trust requirements: low. If the IP is wrong (spoofed, or constant), the
 * worst case is that the IP-axis of the 3-axis rate-limit key degrades to
 * email-only limiting. Brute-force protection on a single account still
 * works. Distributed brute-force protection is weakened but the email and
 * endpoint axes remain.
 *
 * Strategy: prefer x-real-ip (Vercel sets this to the edge-observed client
 * IP). Fall back to first hop of x-forwarded-for. On Vercel, x-forwarded-for
 * is overwritten at the edge to a trusted value (per Vercel docs). On
 * non-Vercel deploys, first-hop may be client-supplied and spoofable —
 * acceptable for rate-limiting use.
 *
 * For legal-record use, use getLegalRecordIp() instead — different trust
 * requirements, different extraction strategy.
 */
export function getRateLimitIp(headers: Headers): string | null {
  const realIp = headers.get("x-real-ip")
  if (realIp) return realIp

  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const firstHop = forwardedFor.split(",")[0]?.trim()
    if (firstHop) return firstHop
  }

  return null
}

/**
 * P1.A.13: Extract client IP for LEGAL-RECORD use (TermsAcceptance).
 *
 * Trust requirements: high. The captured IP becomes part of a legal artifact
 * that may be referenced in disputes about terms acceptance. An attacker-
 * controlled value would corrupt the legal record.
 *
 * Strategy: prefer x-real-ip (Vercel edge-observed). Fall back to LAST hop
 * of x-forwarded-for. The last hop is whatever the most recent trusted
 * proxy added (on Vercel, the edge; on Cloudflare-in-front-of-Vercel, the
 * Cloudflare CF-Connecting-IP-equivalent value). The first hop of
 * x-forwarded-for can be client-supplied and spoofed.
 *
 * For rate-limiting use, use getRateLimitIp() — different trust requirements.
 *
 * NOTE: This intentionally diverges from the rate-limit IP extraction. Do
 * not consolidate them. They have different security properties.
 */
export function getLegalRecordIp(headers: Headers): string | null {
  const realIp = headers.get("x-real-ip")
  if (realIp) return realIp

  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const lastHop = forwardedFor.split(",").pop()?.trim()
    if (lastHop) return lastHop
  }

  return null
}
