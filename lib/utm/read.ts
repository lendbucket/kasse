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
    const parsed = JSON.parse(rawValue) as Record<string, string>
    return {
      utmSource: parsed.utm_source ?? null,
      utmMedium: parsed.utm_medium ?? null,
      utmCampaign: parsed.utm_campaign ?? null,
      utmTerm: parsed.utm_term ?? null,
      utmContent: parsed.utm_content ?? null,
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
  const raw = req.cookies.get("kasse_utm")?.value
  return parseUtmCookie(raw)
}

/**
 * Returns true if any field in the params is non-null. Used as a precondition
 * for writes (don't overwrite User row with all-null payload).
 */
export function hasAnyUtm(params: UtmParams | null): boolean {
  if (!params) return false
  return !!(params.utmSource || params.utmMedium || params.utmCampaign || params.utmTerm || params.utmContent)
}
