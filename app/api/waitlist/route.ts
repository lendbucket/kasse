import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  })

  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()
  const location = await prisma.location.findFirst({
    where: { organizationId: session.user.organizationId },
  })

  if (!location) {
    return NextResponse.json({ error: "No location found" }, { status: 400 })
  }

  const entry = await prisma.waitlistEntry.create({
    data: {
      organizationId: session.user.organizationId,
      locationId: location.id,
      clientId: data.clientId || null,
      clientName: data.clientName || null,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      serviceName: data.serviceName || null,
      preferredStaffId: data.preferredStaffId || null,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
      flexibleDates: data.flexibleDates !== false,
      notes: data.notes || null,
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}
