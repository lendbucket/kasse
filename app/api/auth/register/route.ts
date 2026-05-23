import { NextRequest, NextResponse } from "next/server"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prismaAdmin } from "@/lib/prismaAdmin"
import { getCurrentTermsVersion } from "@/lib/terms/current-version"
import { Resend } from "resend"
import crypto from "crypto"
import { getVerificationEmailHtml } from "@/lib/emails/verification"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, businessName, acceptedTerms } = await req.json()

    if (!name || !email || !password || !businessName) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }

    if (!acceptedTerms) {
      return NextResponse.json({ error: "You must accept the Terms of Service and Privacy Policy" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existing = await prismaAdmin.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verifyToken = crypto.randomBytes(32).toString("hex")
    const verifyExp = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Date.now()

    // P1.A.10: fetch current terms version for acceptance recording
    const currentTermsVersion = await getCurrentTermsVersion()

    const org = await prismaAdmin.organization.create({
      data: {
        name: businessName,
        slug,
        plan: "trial",
        planStatus: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })

    const newUser = await prismaAdmin.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: Role.OWNER,
        organizationId: org.id,
        emailVerifyToken: verifyToken,
        emailVerifyExp: verifyExp,
      },
    })

    await prismaAdmin.businessSettings.create({
      data: { organizationId: org.id },
    })

    // P1.A.10: record terms acceptance atomically with registration
    if (currentTermsVersion) {
      const ipAddress = (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) || null
      const userAgent = req.headers.get("user-agent") || null
      await prismaAdmin.termsAcceptance.create({
        data: {
          userId: newUser.id,
          termsVersionId: currentTermsVersion.id,
          ipAddress,
          userAgent,
        },
      })
    }

    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verifyToken}`

    await resend.emails.send({
      from: "Kasse <onboarding@kasseapp.com>",
      to: email,
      subject: "Verify your email — Welcome to Kasse",
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
      },
      html: getVerificationEmailHtml({ name, businessName, verifyUrl }),
    })

    return NextResponse.json({ success: true, message: "Check your email to verify your account" })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
