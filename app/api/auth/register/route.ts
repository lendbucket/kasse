import { NextRequest, NextResponse } from "next/server"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prismaAdmin } from "@/lib/prismaAdmin"
import { getCurrentTermsVersion } from "@/lib/terms/current-version"
import { readUtmFromCookies, hasAnyUtm } from "@/lib/utm/read"
import { checkRateLimit } from "@/lib/rate-limit/check"
import { getRateLimitIp, getLegalRecordIp } from "@/lib/http/headers"
import { verifyTurnstileToken } from "@/lib/turnstile/verify"
import { readVisitorIdFromCookies } from "@/lib/experiments/visitor"
import { withAdminTx } from "@/lib/admin/withAdminTx"
import { auditLogCreateOp, AuditAction } from "@/lib/audit/write"
import { Resend } from "resend"
import crypto from "crypto"
import { getVerificationEmailHtml } from "@/lib/emails/verification"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, businessName, acceptedTerms, turnstileToken } = await req.json()

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

    // P1.A.14: Verify Turnstile token before any business logic.
    // Reuses the rate-limit IP helper (clientIp computed above). The
    // token comes from the cf-turnstile-response widget callback on the
    // client form. Defensive: typeof guard against malformed input.
    const tokenToVerify = typeof turnstileToken === "string" ? turnstileToken : null
    const turnstileResult = await verifyTurnstileToken(tokenToVerify, clientIp)
    if (!turnstileResult.ok) {
      // Log the Cloudflare error code server-side for debugging but DON'T
      // surface it in the response — bot operators can use detailed error
      // codes ("timeout-or-duplicate", "invalid-input-response") as an
      // oracle to refine their tooling. The user-facing message is enough.
      console.warn(
        `[turnstile] verification failed for ${clientIp ?? "unknown-ip"}: ${turnstileResult.reason ?? "no reason"}`,
      )
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 },
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
    const sessionId = crypto.randomUUID()
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

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

    // Pre-check: if an active (non-COMPLETED, non-expired) OnboardingSession
    // already exists for this email, skip session creation to avoid P2002 on
    // the email-active unique index (idx_onboarding_session_email_active).
    const existingSession = await prismaAdmin.onboardingSession.findFirst({
      where: { email: email.toLowerCase(), state: { not: 'COMPLETED' }, expiresAt: { gt: new Date() } },
    })

    // Atomic batch: Org + User + BusinessSettings + TermsAcceptance + OnboardingSession
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
      ...(!existingSession ? [
        p.onboardingSession.create({
          data: {
            id: sessionId,
            email: email.toLowerCase(),
            state: 'ORG_CREATED',
            vertical: 'SALON',
            userId,
            organizationId: orgId,
            data: {},
            skippedSteps: [],
            expiresAt: sessionExpiresAt,
          },
        }),
        p.onboardingStateTransition.create({
          data: {
            sessionId,
            fromState: 'NEW',
            toState: 'ORG_CREATED',
            triggeredByUserId: userId,
            metadata: { via: 'register' },
          },
        }),
        auditLogCreateOp(p, {
          userId,
          organizationId: orgId,
          action: AuditAction.ONBOARDING_SESSION_CREATED,
          entity: 'OnboardingSession',
          entityId: sessionId,
          metadata: { via: 'register', state: 'ORG_CREATED' },
        }),
      ] : []),
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
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://portal.kasseapp.com"
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verifyToken}`

    // P1.A.15: Fault-isolate the Resend send. The user record is already
    // committed by withAdminTx above; if Resend fails (rate limit, downtime,
    // invalid API key), we must NOT fail the registration response. The user
    // can re-trigger via the resend flow on /login. The failure is logged
    // server-side via console.warn for monitoring (same pattern as
    // Turnstile/rate-limit fail-open philosophy).
    let emailSent = true
    try {
      await resend.emails.send({
        from: "Kasse <onboarding@kasseapp.com>",
        to: email,
        subject: "Verify your email — Welcome to Kasse",
        headers: {
          "X-Entity-Ref-ID": crypto.randomUUID(),
        },
        html: getVerificationEmailHtml({ name, businessName, verifyUrl, baseUrl }),
      })
    } catch (err) {
      emailSent = false
      console.warn(
        `[register] verification email send failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Check your email to verify your account"
        : "Your account was created. We're sending your verification email now — check your inbox in a few minutes.",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
