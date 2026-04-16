import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const merchants = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { take: 1, where: { role: "owner" }, select: { email: true, name: true } },
      _count: { select: { locations: true, users: true } },
    },
  })

  return NextResponse.json({ merchants })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()
  const slug = (data.name || "org").toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now()

  const org = await prisma.organization.create({
    data: { name: data.name, slug, plan: data.plan || "starter", planStatus: data.planStatus || "trial" },
  })

  return NextResponse.json({ organization: org })
}
