import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import BottomNav from "@/components/layout/BottomNav"
import { evaluateFlags } from "@/lib/feature-flags/evaluate"
import { FlagProvider } from "@/lib/feature-flags/context"
import { prisma } from "@/lib/prisma"
import { withTenantScope } from "@/lib/tenant/db-scope"
import { Role } from "@prisma/client"
import { cookies } from "next/headers"
import { LocationProvider } from "@/lib/locations/context"

// Known flag keys — centralize this list to avoid typos.
// Add as flags are created. Keep this list small for v1.
const KNOWN_FLAG_KEYS: string[] = [
  // Example: 'new-booking-flow',
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session
  try {
    session = await getServerSession(authOptions)
  } catch {
    redirect("/login")
  }
  if (!session) redirect("/login")

  // FeatureFlag read policy is USING (true) — any authenticated user can read all
  // flags. We use the tenant-scoped client + session tenant context to keep the
  // pattern consistent with the rest of the dashboard. No admin elevation needed.
  let flagResults: Record<string, import("@/lib/feature-flags/types").FlagEvaluationResult> = {}
  if (KNOWN_FLAG_KEYS.length > 0 && session.user.organizationId) {
    try {
      flagResults = await withTenantScope(
        prisma,
        {
          userId: session.user.id,
          email: session.user.email ?? "",
          name: session.user.name ?? null,
          role: (session.user.role as Role) ?? Role.STAFF,
          organizationId: session.user.organizationId,
          locationId: session.user.locationId ?? null,
          isSuperadmin: session.user.role === Role.SUPERADMIN,
        },
        (tx) => evaluateFlags(tx, {
          keys: KNOWN_FLAG_KEYS,
          context: {
            organizationId: session!.user.organizationId ?? null,
            userId: session!.user.id,
          },
        }),
      )
    } catch {
      // Fail-soft: if flag evaluation fails, continue with empty flags
    }
  }

  // Active-location context: fetch org locations server-side (no client race),
  // resolve active from cookie -> user's home location -> first location.
  let locations: { id: string; name: string }[] = []
  if (session.user.organizationId) {
    try {
      locations = await withTenantScope(
        prisma,
        {
          userId: session.user.id, email: session.user.email ?? "", name: session.user.name ?? null,
          role: (session.user.role as Role) ?? Role.STAFF, organizationId: session.user.organizationId,
          locationId: session.user.locationId ?? null, isSuperadmin: session.user.role === Role.SUPERADMIN,
        },
        (tx) => tx.location.findMany({ where: { organizationId: session!.user.organizationId! }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      )
    } catch { locations = [] }
  }
  const cookieLoc = (await cookies()).get("kasse_active_location")?.value
  const initialActiveId =
    (cookieLoc && locations.some((l) => l.id === cookieLoc) ? cookieLoc : "") ||
    (session.user.locationId && locations.some((l) => l.id === session.user.locationId) ? session.user.locationId : "") ||
    locations[0]?.id || ""

  return (
    <FlagProvider flags={flagResults}>
      <LocationProvider locations={locations} initialActiveId={initialActiveId}>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f7f8fa" }}>
        <div className="hidden md:block" style={{ flexShrink: 0 }}>
          <Sidebar user={session.user} />
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }} className="md:pb-0">
          {children}
        </div>
        <div className="md:hidden"><BottomNav /></div>
      </div>
      </LocationProvider>
    </FlagProvider>
  )
}
