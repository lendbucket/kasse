import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

const VISITOR_COOKIE_NAME = "kasse_visitor_id"

/**
 * P1.A.12: Read visitor ID from cookies in App Router contexts.
 * Returns null if missing or invalid.
 */
export async function readVisitorIdFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(VISITOR_COOKIE_NAME)?.value
    return raw && isValidUuid(raw) ? raw : null
  } catch {
    return null
  }
}

/**
 * P1.A.12: Read visitor ID from NextRequest contexts (middleware,
 * credentials authorize). Returns null if missing or invalid.
 */
export function readVisitorIdFromRequest(req: NextRequest): string | null {
  try {
    if (!req || !req.cookies || typeof req.cookies.get !== "function") {
      return null
    }
    const raw = req.cookies.get(VISITOR_COOKIE_NAME)?.value
    return raw && isValidUuid(raw) ? raw : null
  } catch {
    return null
  }
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
