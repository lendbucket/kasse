import { NextRequest, NextResponse } from "next/server"
import { prismaAdmin } from "@/lib/prismaAdmin"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.redirect(new URL("/login?error=invalid_token", req.url))

  const user = await prismaAdmin.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExp: { gt: new Date() },
    },
  })

  if (!user) return NextResponse.redirect(new URL("/login?error=expired_token", req.url))

  await prismaAdmin.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExp: null,
    },
  })

  return NextResponse.redirect(new URL("/onboarding?verified=true", req.url))
}
