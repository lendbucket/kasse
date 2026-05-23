import { prismaAdmin } from "@/lib/prismaAdmin"

// Module-level cache. Vercel-specific: each function instance has its own
// cache, so multiple warm instances may briefly return stale data after a
// TermsVersion update. The 60s TTL bounds staleness to be much shorter than
// the operational meaning of a TermsVersion change (months-apart events).
//
// NOT SAFE for multi-instance persistent Node processes (Docker, self-host)
// where a single update needs to invalidate all instances atomically. If
// Kasse ever moves off Vercel, replace with a Redis-backed cache or a
// per-request fetch with explicit invalidation on TermsVersion writes.
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
  // INTENTIONAL FAIL-OPEN: when no current TermsVersion exists, return true
  // (don't block users). This is the right default for dev/staging where the
  // seed migration may not have run. In production, the migration seeds
  // v1.0.0 with effectiveAt=NOW(), so this branch should never fire there.
  // The middleware gate logs a warning via injectTermsVersionIntoToken
  // when this state is observed.
  if (!current) return true

  const acceptance = await prismaAdmin.termsAcceptance.findUnique({
    where: { userId_termsVersionId: { userId, termsVersionId: current.id } },
  })

  return acceptance !== null
}
