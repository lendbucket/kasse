import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const config = await prisma.aiReceptionistConfig.findUnique({
    where: { organizationId: session.user.organizationId },
  })

  return NextResponse.json({ config })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()

  const config = await prisma.aiReceptionistConfig.upsert({
    where: { organizationId: session.user.organizationId },
    update: data,
    create: { organizationId: session.user.organizationId, ...data },
  })

  return NextResponse.json({ config })
}
