import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

export interface UtmParams {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmTerm?: string | null
  utmContent?: string | null
}

/**
 * Parse the kasse_utm cookie value into typed UTM params.
 * Maps from URL param names (utm_source) to User column names (utmSource).
 */
function parseUtmCookie(rawValue: string | undefined): UtmParams | null {
  if (!rawValue) return null
  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>
    // Defensive: validate that values are strings before passing to Prisma.
    // Even with HttpOnly, sanity-check against malformed cookie data.
    const asString = (v: unknown): string | null =>
      typeof v === "string" ? v.slice(0, 500) : null
    return {
      utmSource: asString(parsed.utm_source),
      utmMedium: asString(parsed.utm_medium),
      utmCampaign: asString(parsed.utm_campaign),
      utmTerm: asString(parsed.utm_term),
      utmContent: asString(parsed.utm_content),
    }
  } catch {
    return null
  }
}

/**
 * For use inside API route handlers (App Router) — reads from cookies() helper.
 */
export async function readUtmFromCookies(): Promise<UtmParams | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get("kasse_utm")?.value
  return parseUtmCookie(raw)
}

/**
 * For use inside NextRequest contexts (middleware or NextRequest-typed handlers).
 */
export function readUtmFromRequest(req: NextRequest): UtmParams | null {
  // Defensive: NextRequest.cookies should always be defined, but the
  // credentials authorize() path uses `as unknown as NextRequest` casting
  // from NextAuth's req which is typed as standard Request (no .cookies).
  // Production usage works because NextAuth in App Router actually passes
  // NextRequest, but a NextAuth version change could break that assumption.
  if (!req || !req.cookies || typeof req.cookies.get !== "function") {
    return null
  }
  const raw = req.cookies.get("kasse_utm")?.value
  return parseUtmCookie(raw)
}

/**
 * Returns true if any field in the params is non-null. Used as a precondition
 * for writes (don't overwrite User row with all-null payload).
 */
export function hasAnyUtm(params: UtmParams | null): params is UtmParams {
  if (!params) return false
  return !!(params.utmSource || params.utmMedium || params.utmCampaign || params.utmTerm || params.utmContent)
}
