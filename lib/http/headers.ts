/**
 * Shared HTTP header extraction utilities.
 *
 * Currently contains two IP extraction helpers with intentionally different
 * trust requirements. See each function's JSDoc for the rationale.
 *
 * Originally added in P1.A.13 (rate limiting via Upstash). Moved here from
 * lib/rate-limit/check.ts in the follow-up PR because legal-record IP
 * extraction has nothing to do with rate limiting and shouldn't import from
 * that module.
 */

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
