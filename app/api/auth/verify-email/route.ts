import { NextRequest, NextResponse } from "next/server"
import { prismaAdmin } from "@/lib/prismaAdmin"

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    // Fail loud rather than silently using a request-derived base, which can
    // be host-header-spoofed behind a misconfigured proxy.
    return NextResponse.json(
      { error: "Server configuration error: NEXTAUTH_URL not set" },
      { status: 500 },
    );
  }

  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.redirect(new URL("/login?error=invalid_token", baseUrl))

  const user = await prismaAdmin.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExp: { gt: new Date() },
    },
  })

  if (!user) return NextResponse.redirect(new URL("/login?error=expired_token", baseUrl))

  await prismaAdmin.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExp: null,
    },
  })

  return NextResponse.redirect(new URL("/onboarding?verified=true", baseUrl))
}
