/**
 * Next.js middleware — route-tree permission guards (P0.A.7).
 *
 * Every request passes through checkRouteAccess() which evaluates the
 * path against the routeMap. Unauthenticated users are redirected to
 * /login; forbidden users get 403.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.7
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { checkRouteAccess } from "@/lib/permissions/middleware-check";
import type { PermissionSession } from "@/lib/permissions/check";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  if (result.ok) return NextResponse.next();

  if (result.reason === "unauthenticated") {
    // Redirect to login for page requests; 401 JSON for API routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized", code: 401 },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Forbidden
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Forbidden", code: 403 },
      { status: 403 },
    );
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
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
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)",
  ],
};
