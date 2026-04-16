import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"

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
      from: "Kasse <noreply@kasseapp.com>",
      to: email,
      subject: "Verify your email — Welcome to Kasse",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f7f8fa;font-family:'Plus Jakarta Sans',sans-serif">
          <div style="max-width:560px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
            <div style="background:#0a0c0e;padding:32px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:white;letter-spacing:0.15em">kasse.</div>
            </div>
            <div style="padding:40px">
              <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px">Welcome to Kasse, ${name}!</h1>
              <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 24px">
                You're almost ready to start. Please verify your email address to activate your account for <strong>${businessName}</strong>.
              </p>
              <div style="text-align:center;margin:32px 0">
                <a href="${verifyUrl}" style="background:#606E74;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">
                  Verify Email Address
                </a>
              </div>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-top:24px">
                <p style="font-size:13px;color:#6b7280;margin:0">
                  This link expires in 24 hours. If you didn't create a Kasse account, you can safely ignore this email.
                </p>
              </div>
            </div>
            <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
              <p style="font-size:12px;color:#9ca3af;margin:0">Kasse by Reyna Tech LLC &middot; Powered by SalonTransact</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, message: "Check your email to verify your account" })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
