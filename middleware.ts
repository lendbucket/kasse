/**
 * Next.js middleware — request ID propagation (P0.H.1) + route-tree
 * permission guards (P0.A.7) + UTM capture (P1.A.11).
 *
 * 1. Every request gets a UUID v4 in the X-Request-Id header (or preserves
 *    an upstream-provided one). The ID is echoed back in the response.
 * 2. checkRouteAccess() evaluates the path against the routeMap.
 *    Unauthenticated users are redirected to /login; forbidden users get 403.
 * 3. UTM params from URL search params are captured into a 30-day cookie
 *    (kasse_utm) on every response.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.7, P0.H.1
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { checkRouteAccess } from "@/lib/permissions/middleware-check";
import type { PermissionSession } from "@/lib/permissions/check";
import {
  getRequestId,
  REQUEST_ID_HEADER,
} from "@/lib/observability/request-id";

// P1.A.11: UTM capture constants
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const UTM_COOKIE_NAME = "kasse_utm";
const UTM_COOKIE_TTL_DAYS = 30;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Request ID propagation (P0.H.1) ---
  const requestId = getRequestId(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  // --- P1.A.11: Capture UTM params from URL into cookie ---
  // Captures on every page request so attribution survives navigation from
  // landing → other pages → /login. Cookie persists for 30 days and is read
  // at sign-in / registration to populate User row attribution fields.
  const utmFromUrl: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = req.nextUrl.searchParams.get(key);
    if (value) {
      // Trim + clamp at 500 chars (defensive against absurd-length UTM values)
      utmFromUrl[key] = value.slice(0, 500).trim();
    }
  }
  const hasUtmInUrl = Object.keys(utmFromUrl).length > 0;

  // Build session shape from JWT token (NextAuth stores role + org in JWT)
  const token = await getToken({ req });

  let session: PermissionSession | null = null;
  if (token && token.role && token.id) {
    session = {
      user: {
        id: token.id as string,
        role: token.role as Role,
        organizationId: (token.organizationId as string) ?? "",
        staffId: token.staffId as string | undefined,
      },
    };
  }

  const result = checkRouteAccess(pathname, session);

  // Helper to build responses with request ID headers attached
  const withRequestId = (response: NextResponse): NextResponse => {
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  };

  // P1.A.11: Helper to attach UTM cookie to ANY response (next, redirect, json)
  // P1.A.11: Helper to attach UTM cookie to page responses only.
  // API clients don't navigate with UTM params, so setting a cookie on a
  // JSON error response achieves nothing.
  const withUtmCookie = (response: NextResponse): NextResponse => {
    if (hasUtmInUrl && !pathname.startsWith("/api/")) {
      const cookieValue = JSON.stringify(utmFromUrl);
      response.cookies.set(UTM_COOKIE_NAME, cookieValue, {
        maxAge: UTM_COOKIE_TTL_DAYS * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  };

  if (result.ok) {
    // P1.A.10: Terms acceptance gate. Redirect authenticated users who haven't
    // accepted the current TermsVersion to /terms/accept. Compares JWT fields
    // injected by lib/auth.ts — no DB call per request.
    const isTermsExempt =
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname === "/login" ||
      pathname === "/logout" ||
      pathname === "/terms" ||
      pathname === "/privacy" ||
      pathname.startsWith("/terms/accept");

    if (session && !isTermsExempt) {
      const currentVersionId = token?.currentTermsVersionId as string | undefined;
      const acceptedVersionId = token?.acceptedTermsVersionId as string | null | undefined;

      if (currentVersionId && acceptedVersionId !== currentVersionId) {
        return withUtmCookie(withRequestId(NextResponse.redirect(new URL("/terms/accept", req.url))));
      }
    }

    return withUtmCookie(withRequestId(
      NextResponse.next({ request: { headers: requestHeaders } }),
    ));
  }

  if (result.reason === "unauthenticated") {
    // Redirect to login for page requests; 401 JSON for API routes
    if (pathname.startsWith("/api/")) {
      return withUtmCookie(withRequestId(
        NextResponse.json(
          { error: "Unauthorized", code: 401 },
          { status: 401 },
        ),
      ));
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withUtmCookie(withRequestId(NextResponse.redirect(loginUrl)));
  }

  // Forbidden
  if (pathname.startsWith("/api/")) {
    return withUtmCookie(withRequestId(
      NextResponse.json(
        { error: "Forbidden", code: 403 },
        { status: 403 },
      ),
    ));
  }
  return withUtmCookie(withRequestId(NextResponse.redirect(new URL("/dashboard", req.url))));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
