import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { magicLinkEmail } from "./email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
        secure: true,
      },
      from: "Kasse <noreply@kasseapp.com>",
      sendVerificationRequest: async ({ identifier, url }) => {
        await resend.emails.send({
          from: "Kasse <noreply@kasseapp.com>",
          to: identifier,
          subject: "Sign in to Kasse",
          html: magicLinkEmail(url),
        });
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id?: string }).id = user.id;
        (session.user as { role?: string }).role = (user as { role?: string }).role ?? "stylist";
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl + "/dashboard";
    },
  },
};
