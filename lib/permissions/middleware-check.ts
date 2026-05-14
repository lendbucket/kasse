/**
 * Middleware route-access check (P0.A.7).
 *
 * Pure function that evaluates a pathname + session against the
 * routeMap. Used by Next.js middleware to gate every request.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.7
 */
import { type PermissionSession } from "./check";
import { can } from "./check";
import { getRouteGuard } from "./route-map";

export type RouteCheckResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "forbidden"; status: 401 | 403 };

export function checkRouteAccess(
  pathname: string,
  session: PermissionSession | null,
): RouteCheckResult {
  const guard = getRouteGuard(pathname);

  // No guard = default deny for safety. Routes must be explicitly opted in.
  if (!guard) return { ok: false, reason: "forbidden", status: 403 };

  if (guard.type === "public") return { ok: true };

  if (!session) return { ok: false, reason: "unauthenticated", status: 401 };

  if (guard.type === "authenticated") return { ok: true };

  if (guard.type === "role") {
    if (!guard.roles.includes(session.user.role)) {
      return { ok: false, reason: "forbidden", status: 403 };
    }
    return { ok: true };
  }

  if (guard.type === "permission") {
    if (!can(session, guard.permission)) {
      return { ok: false, reason: "forbidden", status: 403 };
    }
    return { ok: true };
  }

  return { ok: false, reason: "forbidden", status: 403 };
}
