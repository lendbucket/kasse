import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExp: { gt: new Date() } },
  })

  if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExp: null },
  })

  return NextResponse.json({ success: true })
}
