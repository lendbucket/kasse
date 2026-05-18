/**
 * Next.js middleware — request ID propagation (P0.H.1) + route-tree
 * permission guards (P0.A.7).
 *
 * 1. Every request gets a UUID v4 in the X-Request-Id header (or preserves
 *    an upstream-provided one). The ID is echoed back in the response.
 * 2. checkRouteAccess() evaluates the path against the routeMap.
 *    Unauthenticated users are redirected to /login; forbidden users get 403.
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Request ID propagation (P0.H.1) ---
  const requestId = getRequestId(req);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

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

  if (result.ok) {
    return withRequestId(
      NextResponse.next({ request: { headers: requestHeaders } }),
    );
  }

  if (result.reason === "unauthenticated") {
    // Redirect to login for page requests; 401 JSON for API routes
    if (pathname.startsWith("/api/")) {
      return withRequestId(
        NextResponse.json(
          { error: "Unauthorized", code: 401 },
          { status: 401 },
        ),
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withRequestId(NextResponse.redirect(loginUrl));
  }

  // Forbidden
  if (pathname.startsWith("/api/")) {
    return withRequestId(
      NextResponse.json(
        { error: "Forbidden", code: 403 },
        { status: 403 },
      ),
    );
  }
  return withRequestId(NextResponse.redirect(new URL("/dashboard", req.url)));
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
