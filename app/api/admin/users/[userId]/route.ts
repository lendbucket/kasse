import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params
  const data = await req.json()
  const updateData: Record<string, any> = {}

  if (typeof data.isActive === "boolean") updateData.isActive = data.isActive
  if (data.resetPassword) {
    updateData.password = await bcrypt.hash(data.resetPassword, 12)
    updateData.passwordResetToken = null
    updateData.passwordResetExp = null
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  return NextResponse.json({ user: { id: user.id, isActive: user.isActive } })
}
