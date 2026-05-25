import { NextRequest, NextResponse } from "next/server"
import { prismaAdmin } from "@/lib/prismaAdmin"
import { Resend } from "resend"
import crypto from "crypto"
import { getPasswordResetEmailHtml } from "@/lib/emails/password-reset"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const user = await prismaAdmin.user.findUnique({ where: { email: email.toLowerCase() } })

  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true })

  const resetToken = crypto.randomBytes(32).toString("hex")
  const resetExp = new Date(Date.now() + 60 * 60 * 1000)

  await prismaAdmin.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExp: resetExp },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://portal.kasseapp.com"
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

  // PR #119: Fault-isolate the Resend send. The user row was already
  // updated with passwordResetToken + passwordResetExp above; if Resend
  // fails (rate limit, downtime, bounce), we must NOT return 500 to the
  // user — they would retry, invalidating the first token with a new
  // one, OR just see a confusing error. Same fault-isolation pattern
  // as register/route.ts post-PR #115.
  //
  // Note: even on Resend failure, we still return success to the user
  // to preserve the email-enumeration-prevention semantic established
  // by the upstream `if (!user) return success` check. A user who hits
  // this path with a real account just gets no email (and can retry
  // later); a user who hits with a fake account also gets no email.
  // Both look identical from outside, preserving the privacy invariant.
  let emailSent = true
  try {
    await resend.emails.send({
      from: "Kasse <onboarding@kasseapp.com>",
      to: email,
      subject: "Reset your Kasse password",
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
      },
      html: getPasswordResetEmailHtml({ resetUrl, baseUrl }),
    })
  } catch (err) {
    emailSent = false
    console.warn(
      `[forgot-password] password reset email send failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // Always return success (preserves email enumeration prevention).
  // emailSent flag is for log-level observability only — not exposed
  // to the client.
  return NextResponse.json({ success: true })
}
