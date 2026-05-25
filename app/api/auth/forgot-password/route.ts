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
    // Fault-isolated: a Resend failure here must NOT propagate. The
    // User row was already updated with passwordResetToken +
    // passwordResetExp above; if we returned 500, the user would
    // retry (invalidating the first token with a new one) OR see a
    // confusing error. We log server-side via console.warn and still
    // return success to the user.
    //
    // Note: success response is unconditional even on Resend failure.
    // This preserves the email-enumeration-prevention semantic
    // established by the upstream `if (!user) return success` check —
    // both the "real user with Resend failure" case AND the "unknown
    // user" case must return identical JSON. PII discipline: log line
    // uses user.id (UUID), not email.
    console.warn(
      `[forgot-password] password reset email send failed for user ${user.id}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // Always return success (preserves email enumeration prevention).
  return NextResponse.json({ success: true })
}
