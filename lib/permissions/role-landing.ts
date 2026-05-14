import { Role } from "@prisma/client";

/**
 * Per-role landing routes used by NextAuth's redirect callback (P0.A.8).
 *
 * After a successful sign-in, the user is sent to the route returned by
 * getLandingForRole(). Routes are chosen to put the role in front of the
 * surface they most often need:
 * - SUPERADMIN → /admin (Command Center)
 * - OWNER / FRANCHISE_OWNER → /dashboard (full ops view)
 * - MANAGER → /dashboard
 * - STAFF, STAFF_VIEW_ONLY → /dashboard/appointments (their daily work)
 * - ACCOUNTANT → /dashboard (Financial-specific landing lands when /dashboard/financial ships)
 * - BUSINESS_PARTNER → /dashboard (read-only across portal)
 * - CLIENT → /dashboard (Client Portal lands in P11; until then, dashboard)
 *
 * Centralizing this map means redirect logic is testable, and adding a new
 * role doesn't require touching lib/auth.ts.
 */
export const ROLE_LANDING: Record<Role, string> = {
  [Role.SUPERADMIN]: "/admin",
  [Role.OWNER]: "/dashboard",
  [Role.MANAGER]: "/dashboard",
  [Role.STAFF]: "/dashboard/appointments",
  [Role.STAFF_VIEW_ONLY]: "/dashboard/appointments",
  [Role.CLIENT]: "/dashboard",
  [Role.FRANCHISE_OWNER]: "/dashboard",
  [Role.ACCOUNTANT]: "/dashboard",
  [Role.BUSINESS_PARTNER]: "/dashboard",
};

/**
 * Returns the landing route for a given role. Defaults to /dashboard for
 * any future role added to the enum that doesn't have a mapping yet,
 * preventing redirect failures during enum expansion.
 */
export function getLandingForRole(role: Role): string {
  return ROLE_LANDING[role] ?? "/dashboard";
}
