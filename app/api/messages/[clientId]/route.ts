import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clientId } = await params

  const messages = await prisma.message.findMany({
    where: { organizationId: session.user.organizationId, clientId },
    orderBy: { sentAt: "asc" },
  })

  // Mark unread messages as read
  await prisma.message.updateMany({
    where: { organizationId: session.user.organizationId, clientId, isRead: false, direction: "inbound" },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json({ messages })
}
