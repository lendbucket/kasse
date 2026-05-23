import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prismaAdmin } from "@/lib/prismaAdmin"
import { getCurrentTermsVersion } from "@/lib/terms/current-version"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const current = await getCurrentTermsVersion()
  if (!current) {
    return NextResponse.json({ error: "No terms version available" }, { status: 500 })
  }

  // Use the trustworthy Vercel edge-observed IP for legal records, not the
  // client-supplied x-forwarded-for first hop (which is spoofable). Order of
  // preference: x-real-ip (set by Vercel edge), then last value of
  // x-forwarded-for (last hop is the edge, also trustworthy), then null.
  const ipAddress =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    null
  const userAgent = req.headers.get("user-agent") || null

  try {
    await prismaAdmin.termsAcceptance.create({
      data: {
        userId: session.user.id,
        termsVersionId: current.id,
        ipAddress,
        userAgent,
      },
    })
  } catch (err: any) {
    // P2002 means user already accepted this version — idempotent, return success
    if (err?.code === "P2002") {
      return NextResponse.json({ ok: true, alreadyAccepted: true })
    }
    throw err
  }

  return NextResponse.json({ ok: true })
}
