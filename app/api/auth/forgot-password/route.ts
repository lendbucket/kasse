import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"
import { getPasswordResetEmailHtml } from "@/lib/emails/password-reset"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true })

  const resetToken = crypto.randomBytes(32).toString("hex")
  const resetExp = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExp: resetExp },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

  await resend.emails.send({
    from: "Kasse <onboarding@kasseapp.com>",
    to: email,
    subject: "Reset your Kasse password",
    headers: {
      "X-Entity-Ref-ID": crypto.randomUUID(),
    },
    html: getPasswordResetEmailHtml({ resetUrl }),
  })

  return NextResponse.json({ success: true })
}
