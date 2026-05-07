import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
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
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { organization: true },
        })
        if (!user || !user.password) return null
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED")
        if (!user.isActive) throw new Error("ACCOUNT_DISABLED")
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        await prisma.user.update({
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
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.locationId = token.locationId as string | null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
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
      role: string
      organizationId?: string | null
      locationId?: string | null
    }
  }
}

export default authOptions
