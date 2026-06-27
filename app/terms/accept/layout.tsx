"use client"

import { SessionProvider } from "next-auth/react"

/**
 * The terms-acceptance page calls useSession().update() to refresh the JWT
 * after recording acceptance (lib/auth.ts re-reads TermsAcceptance on the
 * "update" trigger). That hook requires a SessionProvider ancestor. The rest
 * of the app reads the session server-side (getServerSession) and mounts no
 * client provider, so we scope one to just this route instead of wrapping the
 * whole app. Without it, useSession() is undefined and the page 500s on render
 * ("Cannot destructure property 'update' of useSession(...)").
 */
export default function TermsAcceptLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
