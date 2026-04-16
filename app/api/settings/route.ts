import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [org, settings] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.user.organizationId }, include: { locations: true } }),
    prisma.businessSettings.findUnique({ where: { organizationId: session.user.organizationId } }),
  ])

  return NextResponse.json({ organization: org, settings })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()
  const { organizationUpdates, settingsUpdates } = data

  if (organizationUpdates) {
    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: organizationUpdates,
    })
  }

  if (settingsUpdates) {
    await prisma.businessSettings.upsert({
      where: { organizationId: session.user.organizationId },
      update: settingsUpdates,
      create: { organizationId: session.user.organizationId, ...settingsUpdates },
    })
  }

  return NextResponse.json({ success: true })
}
