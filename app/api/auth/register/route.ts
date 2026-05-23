import { NextRequest, NextResponse } from "next/server"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prismaAdmin } from "@/lib/prismaAdmin"
import { getCurrentTermsVersion } from "@/lib/terms/current-version"
import { readUtmFromCookies, hasAnyUtm } from "@/lib/utm/read"
import { checkRateLimit } from "@/lib/rate-limit/check"
import { getRateLimitIp, getLegalRecordIp } from "@/lib/http/headers"
import { readVisitorIdFromCookies } from "@/lib/experiments/visitor"
import { withAdminTx } from "@/lib/admin/withAdminTx"
import { Resend } from "resend"
import crypto from "crypto"
import { getVerificationEmailHtml } from "@/lib/emails/verification"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, businessName, acceptedTerms } = await req.json()

    // P1.A.13: Rate limit by IP + endpoint + email. Returns 429 if exceeded.
    // Fail-open on infrastructure errors — logged via console.warn.
    const clientIp = getRateLimitIp(req.headers)
    // Defensive: req.json() returns any. Email might be undefined, empty string,
    // number, or object if the client sends malformed JSON. Only pass to
    // rate-limit when it's a non-empty string; otherwise fall back to IP-only.
    const rateLimitIdentifier = typeof email === "string" && email ? email : null
    const rl = await checkRateLimit("register", clientIp, rateLimitIdentifier)
    if (!rl.ok) {
      const retryAfterSec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again in a few minutes.",
          retryAfter: retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "X-RateLimit-Reset": String(Math.ceil(rl.reset / 1000)),
          },
        },
      )
    }

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
    const orgId = crypto.randomUUID()
    const userId = crypto.randomUUID()

    // Read current terms version BEFORE the batch (read, not part of batch)
    const currentTermsVersion = await getCurrentTermsVersion()

    // P1.A.11: read UTM cookie for attribution
    const utm = await readUtmFromCookies()

    // P1.A.12: read visitor ID for A/B attribution
    const visitorId = await readVisitorIdFromCookies()

    // Use getLegalRecordIp for legal records — different trust requirements from
    // rate-limit IP extraction. See lib/rate-limit/check.ts for the full rationale.
    const ipAddress = getLegalRecordIp(req.headers)
    const userAgent = req.headers.get("user-agent") || null

    // Atomic batch: Org + User + BusinessSettings + TermsAcceptance
    // Mirrors the withAdminTx pattern from P1.A.7-d / P1.A.8 / P1.A.9.
    // Uses client-side ID generation so the batch can reference orgId/userId
    // without intermediate results.
    await withAdminTx((p) => [
      p.organization.create({
        data: {
          id: orgId,
          name: businessName,
          slug,
          plan: "trial",
          planStatus: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      }),
      p.user.create({
        data: {
          id: userId,
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: Role.OWNER,
          organizationId: orgId,
          emailVerifyToken: verifyToken,
          emailVerifyExp: verifyExp,
          // P1.A.11: UTM attribution from cookie
          ...(hasAnyUtm(utm) ? {
            utmSource: utm.utmSource,
            utmMedium: utm.utmMedium,
            utmCampaign: utm.utmCampaign,
            utmTerm: utm.utmTerm,
            utmContent: utm.utmContent,
          } : {}),
          // P1.A.12: visitor ID for A/B attribution
          ...(visitorId ? { visitorId } : {}),
        },
      }),
      p.businessSettings.create({
        data: { organizationId: orgId },
      }),
      ...(currentTermsVersion
        ? [p.termsAcceptance.create({
            data: {
              userId,
              termsVersionId: currentTermsVersion.id,
              ipAddress,
              userAgent,
            },
          })]
        : []),
    ])

    // Verification email sent AFTER the batch commits — best-effort, fail-soft.
    // If the email fails, the user record still exists and can re-trigger
    // via the resend flow on /login.
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
