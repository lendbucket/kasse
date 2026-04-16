import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [totalMerchants, activeTrials, totalLocations, recentOrgs] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { planStatus: "trial" } }),
    prisma.location.count(),
    prisma.organization.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { users: { take: 1, where: { role: "owner" }, select: { email: true } } },
    }),
  ])

  return NextResponse.json({
    totalMerchants,
    activeTrials,
    mrr: 0, // calculated from stripe in production
    totalLocations,
    recentSignups: recentOrgs.map(o => ({
      id: o.id,
      name: o.name,
      email: o.users[0]?.email || "",
      plan: o.plan,
      createdAt: o.createdAt.toISOString(),
    })),
  })
}
