/**
 * P1.A.14: Server-side Turnstile token verification.
 *
 * Verifies the cf-turnstile-response token submitted by the client against
 * Cloudflare's /siteverify endpoint. Returns true if valid, false otherwise.
 *
 * Fail-open behavior: when TURNSTILE_SECRET_KEY is missing or Cloudflare
 * siteverify is unreachable, returns `{ ok: true }` (allow request) and logs a
 * console.warn. Auth flows must NEVER be blocked by Turnstile
 * infrastructure failures.
 *
 * Required env var (Vercel):
 * - TURNSTILE_SECRET_KEY (production: from Cloudflare dashboard;
 *                        dev/preview: 1x0000000000000000000000000000000AA test key)
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

/**
 * Cloudflare's siteverify response shape.
 * See: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#error-codes
 */
interface SiteverifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  "error-codes"?: string[]
  action?: string
  cdata?: string
}

export interface VerifyResult {
  ok: boolean
  reason?: string  // populated only when ok=false; null/undefined otherwise
}

let hasWarnedAboutMissingSecret = false

/**
 * Verify a Turnstile token against Cloudflare's siteverify API.
 *
 * @param token - The cf-turnstile-response token from the client form
 * @param remoteip - Optional client IP (improves verification accuracy)
 * @returns VerifyResult with ok=true on success or on fail-open paths
 */
export async function verifyTurnstileToken(
  token: string | null,
  remoteip: string | null,
): Promise<VerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  // Fail-open when env var missing — same philosophy as rate limiting.
  if (!secret) {
    if (!hasWarnedAboutMissingSecret) {
      console.warn(
        "[turnstile] TURNSTILE_SECRET_KEY missing — verification disabled. " +
        "Set TURNSTILE_SECRET_KEY in Vercel.",
      )
      hasWarnedAboutMissingSecret = true
    }
    return { ok: true }
  }

  // Reset the warning flag in case env vars were missing earlier and are
  // now present — useful for dev where env vars get added mid-session.
  hasWarnedAboutMissingSecret = false

  if (!token) {
    return { ok: false, reason: "missing-token" }
  }

  try {
    const params = new URLSearchParams()
    params.append("secret", secret)
    params.append("response", token)
    if (remoteip) params.append("remoteip", remoteip)

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: params,
      // Timeout via AbortController — Cloudflare's siteverify is usually
      // <50ms but defending against worst case ensures the user isn't
      // stuck waiting if Cloudflare is having issues.
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      console.warn(
        `[turnstile] siteverify returned non-2xx status ${res.status} — failing open`,
      )
      return { ok: true }  // FAIL-OPEN on infrastructure error
    }

    const data: SiteverifyResponse = await res.json()

    if (data.success) {
      return { ok: true }
    }

    // Token rejected — return the first error code as the reason.
    const errorCode = data["error-codes"]?.[0] ?? "unknown"
    return { ok: false, reason: errorCode }
  } catch (err) {
    console.warn(
      "[turnstile] siteverify request failed — failing open. " +
      `err=${(err as Error).message}`,
    )
    return { ok: true }  // FAIL-OPEN on network/timeout error
  }
}
