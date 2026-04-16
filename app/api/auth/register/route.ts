import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"
import { getVerificationEmailHtml } from "@/lib/emails/verification"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, businessName } = await req.json()

    if (!name || !email || !password || !businessName) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const verifyToken = crypto.randomBytes(32).toString("hex")
    const verifyExp = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Date.now()

    const org = await prisma.organization.create({
      data: {
        name: businessName,
        slug,
        plan: "trial",
        planStatus: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "owner",
        organizationId: org.id,
        emailVerifyToken: verifyToken,
        emailVerifyExp: verifyExp,
      },
    })

    await prisma.businessSettings.create({
      data: { organizationId: org.id },
    })

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
