/**
 * ROUTE MAP — every authenticated route in the app must be listed here.
 * Default-deny: unmapped routes return 403.
 *
 * Adding a route: when shipping a new app/* or app/api/* path in any future PR,
 * add the corresponding entry here. PR #48 (P0.A.7) introduced the default-deny
 * behavior. Forgetting to add a route guard will silently break the new route.
 *
 * Method-specific guards (GET vs POST etc.) are NOT yet supported — P0.A.8 adds
 * per-method route guards. For now, gate on the READ permission and trust
 * route handlers to enforce write permissions at the call site.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.7
 */
import { Permissions, type PermissionKey } from "./types";
import { Role } from "@prisma/client";

export type RouteGuard =
  | { type: "public" }
  | { type: "authenticated" }
  | { type: "role"; roles: Role[] }
  | { type: "permission"; permission: PermissionKey };

export const routeMap: Record<string, RouteGuard> = {
  // ── Public (no auth required) ────────────────────────────────────────
  "/": { type: "public" },
  "/login": { type: "public" },
  "/register": { type: "public" },
  "/forgot-password": { type: "public" },
  "/reset-password": { type: "public" },
  "/api/health": { type: "public" },
  "/api/auth": { type: "public" },
  // Cron routes are middleware-public; the route handler enforces
  // `Authorization: Bearer ${CRON_SECRET}` itself. This mirrors how
  // /api/auth (NextAuth handlers do their own validation) and
  // /api/health (intentionally open) are configured. The longest-prefix
  // match covers /api/cron/* without per-route entries.
  "/api/cron": { type: "public" },

  // ── Authenticated (any role) ─────────────────────────────────────────
  "/dashboard": { type: "authenticated" },
  "/onboarding": { type: "authenticated" },
  "/api/onboarding": { type: "authenticated" },
  "/api/me": { type: "authenticated" },

  // ── Role-gated ───────────────────────────────────────────────────────
  "/admin": { type: "role", roles: [Role.SUPERADMIN] },
  "/api/admin": { type: "role", roles: [Role.SUPERADMIN] },

  // ── Permission-gated UI routes ───────────────────────────────────────
  // TODO(P0.A.8): refactor to per-method guards (GET=read, POST=write).
  // For now, gate on READ permission; route handlers enforce write checks.
  "/dashboard/appointments": { type: "permission", permission: Permissions.APPOINTMENTS.VIEW_OWN },
  "/dashboard/clients": { type: "permission", permission: Permissions.CLIENTS.VIEW_LIST },
  "/dashboard/services": { type: "permission", permission: Permissions.SERVICES.VIEW },
  "/dashboard/pos": { type: "permission", permission: Permissions.POS.OPEN_CHECKOUT },
  "/dashboard/reports": { type: "permission", permission: Permissions.REPORTS.VIEW_OWN },
  "/dashboard/staff": { type: "permission", permission: Permissions.STAFF.VIEW_LIST },
  "/dashboard/reputation": { type: "permission", permission: Permissions.MARKETING.RESPOND_REVIEWS },
  "/dashboard/marketing": { type: "permission", permission: Permissions.MARKETING.VIEW_CAMPAIGNS },
  "/dashboard/messages": { type: "permission", permission: Permissions.CLIENTS.MESSAGE },
  "/dashboard/waitlist": { type: "permission", permission: Permissions.APPOINTMENTS.VIEW_OWN },
  "/dashboard/ai-receptionist": { type: "permission", permission: Permissions.AI.VIEW_RECEPTIONIST },
  "/dashboard/payroll": { type: "permission", permission: Permissions.PAYROLL.VIEW_OWN },
  "/dashboard/banking": { type: "permission", permission: Permissions.FINANCIAL.VIEW_REVENUE },
  "/dashboard/bill-pay": { type: "permission", permission: Permissions.FINANCIAL.VIEW_REVENUE },
  "/dashboard/profit-loss": { type: "permission", permission: Permissions.FINANCIAL.VIEW_REVENUE },
  "/dashboard/billing": { type: "permission", permission: Permissions.BILLING.VIEW_PLAN },
  "/dashboard/settings": { type: "permission", permission: Permissions.SETTINGS.VIEW_GENERAL },
  "/dashboard/settings/roles": { type: "permission", permission: Permissions.SETTINGS.EDIT_ROLES },

  // ── Permission-gated API routes ──────────────────────────────────────
  // TODO(P0.A.8): refactor to per-method guards (GET=read, POST=write).
  // For now, gate on READ permission; route handlers enforce write checks.
  "/api/appointments": { type: "permission", permission: Permissions.APPOINTMENTS.VIEW_OWN },
  "/api/clients": { type: "permission", permission: Permissions.CLIENTS.VIEW_LIST },
  "/api/services": { type: "permission", permission: Permissions.SERVICES.VIEW },
  "/api/staff": { type: "permission", permission: Permissions.STAFF.VIEW_LIST },
  "/api/transactions": { type: "permission", permission: Permissions.POS.OPEN_CHECKOUT },
  "/api/waitlist": { type: "permission", permission: Permissions.APPOINTMENTS.VIEW_OWN },
  "/api/messages": { type: "permission", permission: Permissions.CLIENTS.MESSAGE },
  "/api/locations": { type: "permission", permission: Permissions.SETTINGS.EDIT_LOCATIONS },
  "/api/settings": { type: "permission", permission: Permissions.SETTINGS.VIEW_GENERAL },
  "/api/ai-receptionist": { type: "permission", permission: Permissions.AI.VIEW_RECEPTIONIST },
  "/api/permission-sets": { type: "permission", permission: Permissions.SETTINGS.EDIT_ROLES },
  "/api/permission-sets/[id]": { type: "permission", permission: Permissions.SETTINGS.EDIT_ROLES },
  "/api/users": { type: "permission", permission: Permissions.SETTINGS.EDIT_ROLES },
  "/api/users/[id]": { type: "permission", permission: Permissions.SETTINGS.EDIT_ROLES },
  "/dashboard/settings/roles/[id]": { type: "permission", permission: Permissions.SETTINGS.EDIT_ROLES },

  // ── P0.A.13: Organization group hierarchy ──────────────────────────────
  "/api/organization-groups": { type: "permission", permission: Permissions.SETTINGS.EDIT_LOCATIONS },
  "/api/organization-groups/[id]": { type: "permission", permission: Permissions.SETTINGS.EDIT_LOCATIONS },
};

/**
 * Find the most specific matching route guard for a pathname.
 * Exact match wins, then longest-prefix match.
 * Returns null if no route matches (caller should default-deny).
 */
export function getRouteGuard(pathname: string): RouteGuard | null {
  // Exact match first
  if (routeMap[pathname]) return routeMap[pathname];

  // Longest-prefix match
  const matches = Object.keys(routeMap)
    .filter((route) => pathname.startsWith(route + "/") || pathname === route)
    .sort((a, b) => b.length - a.length);

  return matches[0] ? routeMap[matches[0]] : null;
}
