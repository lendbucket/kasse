import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prismaAdmin } from "./prismaAdmin"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        token.locationId = (user as any).locationId
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

        // P0.A.11: re-read customRoleId FROM DB on every session lookup,
        // so admin assignment changes (assign/unassign/edit) are reflected
        // immediately without users needing to log out and back in.
        // Two DB reads per authenticated request — acceptable cost for
        // correctness.
        try {
          const userRow = await prismaAdmin.user.findUnique({
            where: { id: token.id as string },
            select: { customRoleId: true },
          })
          if (userRow?.customRoleId) {
            const customRole = await prismaAdmin.permissionSet.findUnique({
              where: { id: userRow.customRoleId },
              select: { permissions: true },
            })
            if (customRole) {
              session.user.customRolePermissions = customRole.permissions as string[]
            } else {
              // The custom role was deleted between login and now; fall back
              // to roleDefaults by clearing the override.
              session.user.customRolePermissions = undefined
            }
          } else {
            // The user's customRoleId was removed; clear the override.
            session.user.customRolePermissions = undefined
          }
        } catch (e) {
          console.error("[auth] failed to re-load customRolePermissions in session — failing closed (clearing custom permissions to fall back to roleDefaults for this request)", e)
          session.user.customRolePermissions = undefined
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
