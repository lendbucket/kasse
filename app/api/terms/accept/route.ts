import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prismaAdmin } from "@/lib/prismaAdmin"
import { getCurrentTermsVersion } from "@/lib/terms/current-version"
import { getLegalRecordIp } from "@/lib/http/headers"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const current = await getCurrentTermsVersion()
  if (!current) {
    return NextResponse.json({ error: "No terms version available" }, { status: 500 })
  }

  const ipAddress = getLegalRecordIp(req.headers)
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
