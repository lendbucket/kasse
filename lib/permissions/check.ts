/**
 * Permission check engine (P0.A.4).
 *
 * Runtime helpers used by every API route and UI gate to enforce
 * role-based and permission-based access control.
 *
 * STUB STATE: In this PR, can() returns true for SUPERADMIN and false
 * for all other roles. The full role-to-permission mapping lands in
 * P0.A.5 (lib/permissions/defaults.ts). This intentional split keeps
 * PRs atomic.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.4
 */
import { Role } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions/types";

// ── Types ────────────────────────────────────────────────────────────────

/** Minimal session shape required by permission checks. */
export type PermissionSession = {
  user: {
    id: string;
    role: Role;
    organizationId: string;
    staffId?: string;
  };
};

/** Optional resource context for ownership / location scoping. */
export type ResourceContext = {
  ownerId?: string;
  organizationId?: string;
  staffId?: string;
  locationId?: string;
};

// ── PermissionError ──────────────────────────────────────────────────────

export class PermissionError extends Error {
  readonly status = 403 as const;
  readonly code = "forbidden" as const;
  readonly permission?: PermissionKey;
  readonly role?: Role;
  readonly resource?: ResourceContext;

  constructor(
    message: string,
    opts?: {
      permission?: PermissionKey;
      role?: Role;
      resource?: ResourceContext;
    },
  ) {
    super(message);
    this.name = "PermissionError";
    this.permission = opts?.permission;
    this.role = opts?.role;
    this.resource = opts?.resource;
  }
}

// ── Role guards ──────────────────────────────────────────────────────────

/**
 * Throws PermissionError if the session user's role does not match
 * the required role exactly.
 */
export function requireRole(
  session: PermissionSession,
  role: Role,
): void {
  if (session.user.role !== role) {
    throw new PermissionError(
      `Required role ${role}, got ${session.user.role}`,
      { role: session.user.role },
    );
  }
}

/**
 * Throws PermissionError if the session user's role is not in the
 * provided array.
 */
export function requireAnyRole(
  session: PermissionSession,
  roles: Role[],
): void {
  if (!roles.includes(session.user.role)) {
    throw new PermissionError(
      `Required one of [${roles.join(", ")}], got ${session.user.role}`,
      { role: session.user.role },
    );
  }
}

// ── Permission checks ────────────────────────────────────────────────────

/**
 * Pure permission check — returns boolean, never throws.
 *
 * Evaluation order (per P0.A.4 spec):
 *   1. SUPERADMIN → always true
 *   2. Check denyList on user       (P0.A.5+)
 *   3. Check user-level grant       (P0.A.5+)
 *   4. Check role default           (P0.A.5 — STUBBED false here)
 *   5. Apply resource constraints   (P0.A.5+)
 *   6. Return false
 *
 * STUB: Steps 2-5 are not yet implemented. Only SUPERADMIN bypass
 * is active. Full mapping ships in P0.A.5.
 */
export function can(
  session: PermissionSession,
  action: PermissionKey,
  _resource?: ResourceContext,
): boolean {
  // Step 1: SUPERADMIN bypass
  if (session.user.role === Role.SUPERADMIN) return true;

  // Steps 2-5: STUBBED — P0.A.5 will wire role defaults here
  return false;
}

/**
 * Throwing variant of can(). Throws PermissionError with status 403
 * if the permission check fails.
 */
export function requirePermission(
  session: PermissionSession,
  action: PermissionKey,
  resource?: ResourceContext,
): void {
  if (!can(session, action, resource)) {
    throw new PermissionError(
      `Permission denied: ${action}`,
      {
        permission: action,
        role: session.user.role,
        resource,
      },
    );
  }
}
