import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get unique conversations (latest message per client)
  const messages = await prisma.message.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { sentAt: "desc" },
    include: { client: { select: { id: true, name: true, phone: true, email: true } } },
  })

  // Group by client
  const conversationMap = new Map<string, typeof messages[0]>()
  for (const msg of messages) {
    if (!conversationMap.has(msg.clientId)) {
      conversationMap.set(msg.clientId, msg)
    }
  }

  const conversations = Array.from(conversationMap.values()).map((msg) => ({
    clientId: msg.clientId,
    clientName: msg.client.name,
    clientPhone: msg.client.phone,
    lastMessage: msg.content,
    lastMessageAt: msg.sentAt,
    direction: msg.direction,
    isRead: msg.isRead,
  }))

  return NextResponse.json({ conversations })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clientId, content, channel } = await req.json()
  if (!clientId || !content) {
    return NextResponse.json({ error: "Client and content required" }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      organizationId: session.user.organizationId,
      clientId,
      direction: "outbound",
      channel: channel || "sms",
      content,
      status: "sent",
      staffId: session.user.id,
    },
  })

  return NextResponse.json({ message })
}
