import { createHash } from "crypto"
import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import jwt from "jsonwebtoken"
import { prismaAdmin } from "./prismaAdmin"
import bcrypt from "bcryptjs"
import { Prisma, Role } from "@prisma/client"
import { resolveEffectivePermissions } from "@/lib/permissions/resolve-hierarchy"
import { roleDefaults } from "@/lib/permissions/defaults"
import { withAdminTx } from "@/lib/admin/withAdminTx"
import { getCurrentTermsVersion } from "@/lib/terms/current-version"
import type { NextRequest } from "next/server"
import { readUtmFromCookies, readUtmFromRequest, hasAnyUtm } from "@/lib/utm/read"
import { checkRateLimit } from "@/lib/rate-limit/check"
import type { UtmParams } from "@/lib/utm/read"
import { readVisitorIdFromCookies, readVisitorIdFromRequest } from "@/lib/experiments/visitor"
import { Resend } from "resend"
import { getOauthWelcomeEmailHtml } from "@/lib/emails/oauth-welcome"

// P1.A.15: Resend client for OAuth welcome emails. Module-scoped so
// successive cold starts don't re-construct it.
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Extract client IP from NextAuth's authorize() req.headers.
 *
 * NextAuth v4's `authorize(credentials, req)` types `req.headers` as
 * `Record<string, string | string[] | undefined>` — a plain object, NOT a
 * WHATWG Headers instance. Using `getRateLimitIp(req.headers as Headers)`
 * would call `.get()` on a plain object and return undefined for every
 * lookup, silently degrading rate-limit to email-only.
 *
 * This function reads via plain-object indexing and normalizes string-array
 * values (multi-header case) to a single string by taking the first element.
 *
 * Mirrors getRateLimitIp's strategy: prefer x-real-ip, fall back to first
 * hop of x-forwarded-for. Same trust requirements as getRateLimitIp (this
 * is rate-limit use, not legal-record use).
 */
function getRateLimitIpFromNextAuthReq(reqHeaders: unknown): string | null {
  if (!reqHeaders || typeof reqHeaders !== "object") return null
  const h = reqHeaders as Record<string, string | string[] | undefined>

  const realIpRaw = h["x-real-ip"]
  const realIp = Array.isArray(realIpRaw) ? realIpRaw[0] : realIpRaw
  if (realIp) return realIp

  const xffRaw = h["x-forwarded-for"]
  const xff = Array.isArray(xffRaw) ? xffRaw[0] : xffRaw
  if (xff) {
    const firstHop = xff.split(",")[0]?.trim()
    if (firstHop) return firstHop
  }

  return null
}

// Generate Apple client secret JWT once at module load. Apple's spec allows
// up to 6 months validity; we use 90 days as a balance between rotation
// pressure and operational stability. In serverless (Vercel), each cold start
// re-runs this code path and gets a fresh JWT, so 90 days is comfortably
// longer than any single function instance's lifetime.
//
// If any env var is missing, generateAppleClientSecret returns null and the
// provider is excluded from the providers array entirely — the Apple button
// on /login will fail gracefully at the signIn call (returns error inline
// because redirect: false) rather than silently breaking after a deployment.
function generateAppleClientSecret(): string | null {
  const clientId = process.env.APPLE_CLIENT_ID
  const teamId = process.env.APPLE_TEAM_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY

  if (!clientId || !teamId || !keyId || !privateKey) {
    return null
  }

  // Vercel stores multi-line private keys with literal \n escapes;
  // normalize to real newlines before signing.
  const normalizedKey = privateKey.replace(/\\n/g, "\n")

  try {
    return jwt.sign(
      {},
      normalizedKey,
      {
        algorithm: "ES256",
        expiresIn: "90d",
        audience: "https://appleid.apple.com",
        issuer: teamId,
        subject: clientId,
        keyid: keyId,
      }
    )
  } catch (err) {
    console.error("[auth] failed to generate Apple client secret JWT:", err)
    return null
  }
}

// Long-lived process caveat: this JWT is computed once at module load. In a
// persistent Node process (Docker, self-host) the JWT would expire after 90
// days and signing would silently fail at Apple's token endpoint. Kasse's
// current deployment is 100% Vercel serverless, so cold starts re-mint the
// JWT well within the 90-day window. If Kasse ever moves to a persistent
// runtime, add a startup health check that warns when the JWT is >60 days
// old, or refactor clientSecret to be regenerated per-request (NextAuth v4
// does not natively support function-typed clientSecret, so a workaround
// would be needed).
const appleClientSecret = generateAppleClientSecret()

// Lifted to module scope to avoid reconstructing on every signIn invocation.
const OAUTH_PROVIDERS = new Set(["google", "apple"])

// P1.A.10: Inject currentTermsVersionId + acceptedTermsVersionId into the JWT.
// Called at sign-in and on explicit session refresh (useSession().update()).
// Middleware compares these two values on every authenticated request to gate
// access without a DB call per request.
async function injectTermsVersionIntoToken(token: any, userId: string) {
  const currentVersion = await getCurrentTermsVersion()
  token.currentTermsVersionId = currentVersion?.id ?? null

  // Visibility: if no current version exists, the middleware gate
  // short-circuits (currentVersionId is falsy in the comparison). Users
  // signing up during a null-version window are silently exempt UNTIL the
  // next sign-in WITH a version present. In production this branch should
  // never fire (v1.0.0 is seeded in the migration), but dev/staging
  // environments may hit it if the seed didn't run.
  if (!currentVersion) {
    console.warn("[auth] injectTermsVersionIntoToken: no current TermsVersion exists; user", userId, "will not be gated by terms middleware until a version is configured.")
  }

  if (currentVersion && userId) {
    const acceptance = await prismaAdmin.termsAcceptance.findUnique({
      where: { userId_termsVersionId: { userId, termsVersionId: currentVersion.id } },
      select: { termsVersionId: true },
    })
    token.acceptedTermsVersionId = acceptance?.termsVersionId ?? null
  } else {
    token.acceptedTermsVersionId = null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaAdmin) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // P1.A.13: Rate limit fires BEFORE input validation, matching the
        // register-route philosophy documented in RLS_AUDIT.md. A bot probing
        // empty credentials would otherwise bypass rate limiting on this path.
        // Type-guard the email so non-string values fall back to IP-only.
        const clientIp = getRateLimitIpFromNextAuthReq(req?.headers)
        const credEmail = typeof credentials?.email === "string" && credentials.email
          ? credentials.email
          : null
        const rl = await checkRateLimit("signin-credentials", clientIp, credEmail)
        if (!rl.ok) {
          throw new Error("RATE_LIMITED")
        }

        if (!credentials?.email || !credentials?.password) return null

        const user = await prismaAdmin.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { organization: true },
        })
        if (!user || !user.password) return null
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED")
        if (!user.isActive) throw new Error("ACCOUNT_DISABLED")
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        // P1.A.11: Read UTM cookie via the request passed to authorize.
        // Safer than next/headers cookies() in this context — req is always populated.
        let utm: UtmParams | null = null
        try {
          if (req) utm = readUtmFromRequest(req as unknown as NextRequest)
        } catch (err) {
          console.warn("[auth] failed to read UTM from credentials authorize req:", err)
        }
        // P1.A.12: read visitor ID for one-time bind
        let visitorId: string | null = null
        try {
          if (req) visitorId = readVisitorIdFromRequest(req as unknown as NextRequest)
        } catch (err) {
          console.warn("[auth] failed to read visitor ID from credentials authorize req:", err)
        }
        const shouldBindVisitor = visitorId && !user.visitorId
        await prismaAdmin.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            ...(hasAnyUtm(utm) ? {
              utmSource: utm.utmSource,
              utmMedium: utm.utmMedium,
              utmCampaign: utm.utmCampaign,
              utmTerm: utm.utmTerm,
              utmContent: utm.utmContent,
            } : {}),
            ...(shouldBindVisitor ? { visitorId } : {}),
          },
        })
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          locationId: user.locationId,
        }
      },
    }),
    // P1.A.8: Google OAuth signup. Skips password + email verification.
    // First-time Google users get full account bootstrap (User + Org + BusinessSettings)
    // via the signIn callback below. Existing-email collisions link the Google Account
    // to the existing User via PrismaAdapter (allowDangerousEmailAccountLinking).
    //
    // Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env. Without them, the
    // provider exists but returns "OAuth client error" — graceful degradation.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    // P1.A.9: Apple Sign-In. Only registers if all four required env vars are
    // present (APPLE_CLIENT_ID + APPLE_TEAM_ID + APPLE_KEY_ID + APPLE_PRIVATE_KEY)
    // AND JWT generation succeeds. If credentials are missing, the provider is
    // excluded entirely — preventing the broken-button trap where /login shows
    // a Continue with Apple option that always fails at the OAuth redirect.
    //
    // The clientSecret here is a pre-signed JWT (ES256, 90-day validity, generated
    // at module load via generateAppleClientSecret above). Apple's spec requires
    // this format — passing raw PEM key would result in invalid_client errors at
    // the token exchange step.
    ...(appleClientSecret
      ? [
          AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: appleClientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Credentials provider: pass through (existing logic handles validation)
      if (!account?.provider || account.provider === "credentials") return true

      // Non-OAuth providers (credentials) short-circuit here BEFORE the
      // Apple-specific relay log below — intentional ordering. The relay log
      // only fires for first-time bootstrap of an Apple Hide-My-Email address.
      if (!OAUTH_PROVIDERS.has(account.provider)) return true

      // Provider-specific email verification:
      // - Google: explicit email_verified check (defense-in-depth; Google's OAuth flow is primary protection)
      // - Apple: skip — Apple-issued JWTs always have verified emails baked into the spec
      if (account.provider === "google") {
        if (!(profile as any)?.email_verified) {
          return false
        }
      }

      if (!user.email) return false

      const email = user.email.toLowerCase()

      const existingUser = await prismaAdmin.user.findUnique({
        where: { email },
        include: { accounts: true },
      })

      if (existingUser) {
        if (!existingUser.isActive) {
          throw new Error("ACCOUNT_DISABLED")
        }
        // Parity with credentials provider: never let OAuth silently claim an
        // unverified credentials account. The credentials provider throws
        // EMAIL_NOT_VERIFIED for null emailVerified — match that here so an
        // attacker who creates a real OAuth identity for a victim's email
        // can't bypass the verification flow that protects unverified accounts.
        // Apple JWTs and Google's email_verified guarantee the OAuth side is
        // verified; this check guards the EXISTING Kasse account side.
        if (!existingUser.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED")
        }
        // P1.A.11: overwrite UTM attribution on every sign-in if cookie present
        let utm: UtmParams | null = null
        try {
          utm = await readUtmFromCookies()
        } catch (err) {
          console.warn("[auth] failed to read UTM cookie via next/headers in OAuth signIn:", err)
        }
        // P1.A.12: one-time visitor ID bind
        let visitorId: string | null = null
        try {
          visitorId = await readVisitorIdFromCookies()
        } catch (err) {
          console.warn("[auth] failed to read visitor ID from OAuth existingUser cookies:", err)
        }
        const shouldBindVisitor = visitorId && !existingUser.visitorId
        await prismaAdmin.user.update({
          where: { id: existingUser.id },
          data: {
            lastLoginAt: new Date(),
            ...(hasAnyUtm(utm) ? {
              utmSource: utm.utmSource,
              utmMedium: utm.utmMedium,
              utmCampaign: utm.utmCampaign,
              utmTerm: utm.utmTerm,
              utmContent: utm.utmContent,
            } : {}),
            ...(shouldBindVisitor ? { visitorId } : {}),
          },
        })
        return true
      }

      // First-time OAuth user — bootstrap full account (mirrors /api/auth/register).
      // All three creates are atomic via withAdminTx. Uses client-side ID generation
      // so the batch form can reference orgId without intermediate results.
      //
      // Apple Private Email Relay: emails ending in @privaterelay.appleid.com are
      // accepted as legitimate. The user's chosen display name comes from Apple's
      // first-time consent screen; on subsequent sign-ins Apple does NOT re-send
      // the name. The fallback to email.split("@")[0] handles missing names.

      // Apple Private Email Relay UX trap: if user picked "Hide My Email", their
      // relay address differs from any real email they may have used previously
      // in a credentials or Google account. Account linking is by email — so a
      // user with an existing real-email account silently gets a second account
      // when they sign in with Apple+Hide. This is expected and correct per
      // Apple's spec, but we log it so Robert can track frequency and address
      // via merchant-facing UI if needed.
      // Track frequency of Hide My Email signups without leaking the pseudonymous
      // relay address. Apple relay addresses are privacy-preserving by design;
      // logging them verbatim defeats that intent. The hash is short and stable
      // per-address so frequency tracking is still possible without exposing the value.
      if (account?.provider === "apple" && email.endsWith("@privaterelay.appleid.com")) {
        const hashedEmail = createHash("sha256").update(email).digest("hex").slice(0, 8)
        console.warn("[auth] Apple Private Email Relay used for new account bootstrap (hash:", hashedEmail + ")")
      }

      const name = user.name || (profile as any)?.name || email.split("@")[0]
      const businessName = `${name}'s Business`
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Date.now()
      const orgId = crypto.randomUUID()

      // P1.A.11: read UTM cookie for new-user bootstrap attribution
      let utmForBootstrap: UtmParams | null = null
      try {
        utmForBootstrap = await readUtmFromCookies()
      } catch (err) {
        console.warn("[auth] failed to read UTM cookie via next/headers in OAuth signIn:", err)
      }

      // P1.A.12: read visitor ID for new-user bootstrap attribution
      let visitorIdForBootstrap: string | null = null
      try {
        visitorIdForBootstrap = await readVisitorIdFromCookies()
      } catch (err) {
        console.warn("[auth] failed to read visitor ID from OAuth bootstrap cookies:", err)
      }

      try {
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
              name,
              email,
              password: null,
              image: user.image || null,
              emailVerified: new Date(),
              role: Role.OWNER,
              organizationId: orgId,
              lastLoginAt: new Date(),
              // P1.A.11: UTM attribution from cookie
              ...(hasAnyUtm(utmForBootstrap) ? {
                utmSource: utmForBootstrap.utmSource,
                utmMedium: utmForBootstrap.utmMedium,
                utmCampaign: utmForBootstrap.utmCampaign,
                utmTerm: utmForBootstrap.utmTerm,
                utmContent: utmForBootstrap.utmContent,
              } : {}),
              // P1.A.12: visitor ID for A/B attribution
              ...(visitorIdForBootstrap ? { visitorId: visitorIdForBootstrap } : {}),
            },
          }),
          p.businessSettings.create({
            data: { organizationId: orgId },
          }),
        ])
      } catch (err) {
        // Only retry on User.email collisions (real concurrent sign-in race).
        // Other P2002 targets (e.g., Organization.slug) get re-thrown immediately;
        // the user retries with a fresh Date.now() and gets a different slug.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          const target = (err.meta as { target?: string[] } | null)?.target
          const isEmailCollision = Array.isArray(target) && target.includes("email")
          if (isEmailCollision) {
            const raceWinner = await prismaAdmin.user.findUnique({
              where: { email },
            })
            if (raceWinner) {
              if (!raceWinner.isActive) throw new Error("ACCOUNT_DISABLED")
              if (!raceWinner.emailVerified) throw new Error("EMAIL_NOT_VERIFIED")
              // P1.A.11: UTM attribution on race-winner path
              let utmRace: UtmParams | null = null
              try {
                utmRace = await readUtmFromCookies()
              } catch (err) {
                console.warn("[auth] failed to read UTM cookie via next/headers in OAuth signIn:", err)
              }
              // P1.A.12: one-time visitor ID bind on race-winner path
              let visitorIdRace: string | null = null
              try {
                visitorIdRace = await readVisitorIdFromCookies()
              } catch (err) {
                console.warn("[auth] failed to read visitor ID from OAuth race-winner cookies:", err)
              }
              const shouldBindVisitorRace = visitorIdRace && !raceWinner.visitorId
              await prismaAdmin.user.update({
                where: { id: raceWinner.id },
                data: {
                  lastLoginAt: new Date(),
                  ...(hasAnyUtm(utmRace) ? {
                    utmSource: utmRace.utmSource,
                    utmMedium: utmRace.utmMedium,
                    utmCampaign: utmRace.utmCampaign,
                    utmTerm: utmRace.utmTerm,
                    utmContent: utmRace.utmContent,
                  } : {}),
                  ...(shouldBindVisitorRace ? { visitorId: visitorIdRace } : {}),
                },
              })
              return true
            }
          }
        }
        throw err
      }

      // P1.A.15: Send OAuth welcome email. Fault-isolated — a Resend
      // failure must not block sign-in success. User record is already
      // committed by withAdminTx above. Same fail-open philosophy as
      // /api/auth/register.
      //
      // Defensive email guard. The bootstrap branch earlier in this
      // signIn callback gates on `if (!user.email) return false`, so email
      // should be a string here. Belt-and-suspenders: skip the send if email
      // is somehow nullish, and use a safeEmail variable in the catch so a
      // secondary exception doesn't escape the fault-isolation.
      if (typeof email !== "string" || !email) {
        console.warn(
          `[auth] OAuth welcome email skipped — email is nullish (provider: ${account.provider})`,
        )
      } else {
        // P1.A.15 cycle 3: Apple Hide-My-Email re-auth flows may omit user.name.
        // Even with the upstream fallback chain (user.name || profile?.name ||
        // email.split("@")[0]), defensive guards ensure no "Welcome to Kasse,
        // undefined!" subjects reach users. The email-local-part fallback for
        // Apple Hide-My-Email relay addresses (e.g. "abc123xyz") is ugly but
        // functional. The "there" fallback is the floor of last resort.
        const safeName = typeof name === "string" && name ? name : "there"
        const safeBusinessName = typeof businessName === "string" && businessName
          ? businessName
          : "your business"

        try {
          const baseUrl = process.env.NEXTAUTH_URL ?? "https://portal.kasseapp.com"
          const dashboardUrl = `${baseUrl}/dashboard`
          const providerLabel = account.provider === "google" ? "Google" : "Apple"
          await resend.emails.send({
            from: "Kasse <onboarding@kasseapp.com>",
            to: email,
            subject: `Welcome to Kasse, ${safeName}!`,
            headers: {
              "X-Entity-Ref-ID": crypto.randomUUID(),
            },
            html: getOauthWelcomeEmailHtml({
              name: safeName,
              businessName: safeBusinessName,
              provider: providerLabel,
              dashboardUrl,
              baseUrl,
            }),
          })
        } catch (err) {
          // Defensive: safeEmail handles even the impossible case where email
          // became nullish between the guard above and the catch. A TypeError
          // in the catch would escape our fault-isolation and break sign-in.
          const safeEmail = typeof email === "string" ? `${email.slice(0, 3)}***` : "(unknown)"
          console.warn(
            `[auth] OAuth welcome email send failed for ${account.provider} signup (${safeEmail}): ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      }

      // PrismaAdapter creates the Account row after signIn returns true — don't create it here.
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // For OAuth sign-ins (Google or Apple), we look up by email rather than id
        // because at this point in the NextAuth flow, user.id is the OAuth
        // providerAccountId, NOT the Kasse User.id. PrismaAdapter sets user.id to
        // Kasse User.id ONLY after creating the Account row, which happens AFTER
        // signIn returns true. Email is the only stable join key between the
        // OAuth profile and the just-created/found User row at this exact callback
        // boundary. Do not "fix" this to lookup by id.
        if (!(user as any).role && user.email) {
          const dbUser = await prismaAdmin.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { id: true, role: true, organizationId: true, locationId: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.organizationId = dbUser.organizationId
            token.locationId = dbUser.locationId
          }
          // P1.A.10: inject terms version metadata into JWT for middleware gate
          await injectTermsVersionIntoToken(token, token.id as string)
          return token
        }

        // For credentials sign-in, user object has everything (existing path)
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        token.locationId = (user as any).locationId
        // P1.A.10: inject terms version metadata into JWT for middleware gate
        await injectTermsVersionIntoToken(token, user.id)
        return token
      }

      // Refresh trigger — re-fetch from DB to reflect latest user state.
      // Used by useSession().update() after org-create assigns the user to
      // a newly-created org (the JWT from sign-in still says organizationId: null).
      // Rate limiting is handled by /api/onboarding/refresh-session (30s per
      // user via in-memory map). We always re-fetch here on explicit update
      // trigger — a prior debounce in the callback caused silent refresh
      // failures within 30s of sign-in.
      if (trigger === "update" && typeof token.id === "string" && token.id.length > 0) {
        try {
          const freshUser = await prismaAdmin.user.findUnique({
            where: { id: token.id },
            select: {
              organizationId: true,
              role: true,
              locationId: true,
            },
          })
          if (freshUser) {
            token.organizationId = freshUser.organizationId
            token.role = freshUser.role
            token.locationId = freshUser.locationId
          }
          // P1.A.10: refresh terms acceptance state in JWT
          await injectTermsVersionIntoToken(token, token.id as string)
        } catch (err) {
          // The 'update' trigger is an explicit client signal — useSession().update()
          // was called and the caller expects fresh data. Silent swallow would leave
          // the token stale without notifying the client. Re-throw so NextAuth
          // surfaces 500; client should retry via /api/onboarding/refresh-session.
          console.error("jwt callback update branch failed:", err)
          throw err
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // Validate role against current Role enum — defensive against stale JWTs
        // minted before P0.A.1 (which had lowercase string roles).
        const rawRole = token.role as string | undefined;
        const validRole = rawRole && Object.values(Role).includes(rawRole as Role)
          ? (rawRole as Role)
          : Role.STAFF;
        session.user.role = validRole
        session.user.organizationId = token.organizationId as string
        session.user.locationId = token.locationId as string | null

        // P0.A.13: resolve effective permissions through the hierarchy chain.
        // Walks User.customRoleId → Location.group → parent groups → role defaults.
        try {
          const effective = await resolveEffectivePermissions({
            userId: token.id as string,
            role: validRole,
            organizationId: token.organizationId as string,
            locationId: token.locationId as string | null,
          });
          // Only set customRolePermissions if the resolved set DIFFERS from
          // roleDefaults — otherwise leave undefined so can() falls back naturally
          // (saves a serialization pass through the JWT and an unnecessary array
          // comparison in checkPermission).
          const defaults = roleDefaults[validRole] ?? [];
          const effectiveSet = new Set(effective);
          const defaultsSet = new Set(defaults);
          // Set equality: same size AND every element of effective is in defaults
          // implies the symmetric (defaults ⊆ effective) because |A| == |B|
          // and A ⊆ B implies A = B. Single-direction check is sufficient.
          const isOverride = effectiveSet.size !== defaultsSet.size
            || [...effectiveSet].some(p => !defaultsSet.has(p));
          session.user.customRolePermissions = isOverride ? (effective as string[]) : undefined;
        } catch (e) {
          console.error("[auth] failed to resolve effective permissions — failing closed to roleDefaults", e);
          session.user.customRolePermissions = undefined;
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allow explicit callback URLs that point inside the app
      // (e.g. ?callbackUrl=/dashboard/staff from a middleware redirect).
      if (url.startsWith(baseUrl) && !url.endsWith("/login")) return url
      // Otherwise, fall back to /dashboard. Role-based routing happens
      // server-side in app/dashboard/page.tsx (P0.A.8).
      return baseUrl + "/dashboard"
    },
  },
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
      organizationId?: string | null
      locationId?: string | null
      customRolePermissions?: string[]
    }
  }
}

export default authOptions
