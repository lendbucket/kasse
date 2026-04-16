import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"

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
    from: "Kasse <noreply@kasseapp.com>",
    to: email,
    subject: "Reset your Kasse password",
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
            <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 12px">Reset your password</h2>
            <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 24px">Click the button below to reset your password. This link expires in 1 hour.</p>
            <div style="text-align:center;margin:32px 0">
              <a href="${resetUrl}" style="background:#606E74;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Reset Password</a>
            </div>
            <p style="font-size:13px;color:#9ca3af;margin:24px 0 0">If you didn't request this, ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })

  return NextResponse.json({ success: true })
}
