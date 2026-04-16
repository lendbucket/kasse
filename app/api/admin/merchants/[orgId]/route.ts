import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { orgId } = await params
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      locations: true,
      users: { select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true } },
    },
  })

  if (!organization) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ organization })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { orgId } = await params
  const data = await req.json()
  const organization = await prisma.organization.update({
    where: { id: orgId },
    data,
  })

  return NextResponse.json({ organization })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { orgId } = await params
  await prisma.organization.delete({ where: { id: orgId } })
  return NextResponse.json({ success: true })
}
