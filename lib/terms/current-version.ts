import { prismaAdmin } from "@/lib/prismaAdmin"

// Module-level cache: TermsVersion changes maybe twice a year. 60s staleness
// is irrelevant for the practical case. Reduces DB hits in the jwt callback
// (called on every sign-in and useSession().update()) by ~100% steady-state.
//
// Vercel serverless: cache lives only within a function instance. Cold start
// re-fetches. This is fine — TermsVersion changes are version-bumps, not
// frequent edits. If a TermsVersion update needs to take effect immediately
// (rare), restart Vercel instances by triggering a redeploy.
let cached: { version: Awaited<ReturnType<typeof fetchCurrent>>; expiresAt: number } | null = null
const CACHE_TTL_MS = 60_000

async function fetchCurrent() {
  return await prismaAdmin.termsVersion.findFirst({
    where: { effectiveAt: { lte: new Date() } },
    orderBy: { effectiveAt: "desc" },
  })
}

export async function getCurrentTermsVersion() {
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.version
  }
  const version = await fetchCurrent()
  cached = { version, expiresAt: now + CACHE_TTL_MS }
  return version
}

export async function userHasAcceptedCurrentTerms(userId: string): Promise<boolean> {
  const current = await getCurrentTermsVersion()
  if (!current) return true  // No terms exist yet — don't block

  const acceptance = await prismaAdmin.termsAcceptance.findUnique({
    where: { userId_termsVersionId: { userId, termsVersionId: current.id } },
  })

  return acceptance !== null
}
