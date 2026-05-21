import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prismaAdmin } from "./prismaAdmin"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { resolveEffectivePermissions } from "@/lib/permissions/resolve-hierarchy"
import { roleDefaults } from "@/lib/permissions/defaults"

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
      async authorize(credentials) {
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
        await prismaAdmin.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true

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
        await prismaAdmin.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date() },
        })
        return true
      }

      // First-time Google user — bootstrap full account (mirrors /api/auth/register)
      const name = user.name || profile?.name || email.split("@")[0]
      const businessName = `${name}'s Business`
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Date.now()

      const org = await prismaAdmin.organization.create({
        data: {
          name: businessName,
          slug,
          plan: "trial",
          planStatus: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      })

      await prismaAdmin.user.create({
        data: {
          name,
          email,
          password: null,
          image: user.image || null,
          emailVerified: new Date(),
          role: Role.OWNER,
          organizationId: org.id,
          lastLoginAt: new Date(),
        },
      })

      await prismaAdmin.businessSettings.create({
        data: { organizationId: org.id },
      })

      // PrismaAdapter creates the Account row after signIn returns true — don't create it here.
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        // For Google OAuth, user object doesn't include role/org — fetch from DB
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
          return token
        }

        // For credentials sign-in, user object has everything (existing path)
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        token.locationId = (user as any).locationId
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
