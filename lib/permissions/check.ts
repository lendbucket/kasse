/**
 * Permission check engine (P0.A.4, wired in P0.A.5).
 *
 * Runtime helpers used by every API route and UI gate to enforce
 * role-based and permission-based access control.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.4, P0.A.5
 */
import { Role } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions/types";
import { roleDefaults } from "@/lib/permissions/defaults";

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
 * IDENTITY CHECK: Throws PermissionError if the session user's role
 * does not match the required role exactly.
 *
 * This is an identity check ("is the user this exact role?"), NOT a
 * capability check ("can the user do X?"). For capability checks,
 * use can() or requirePermission() which consult the role-to-permission
 * mapping and apply resource constraints.
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
 * IDENTITY CHECK: Throws PermissionError if the session user's role
 * is not in the provided array.
 *
 * Same identity-vs-capability distinction as requireRole() above.
 * Use requirePermission() for capability checks.
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
 * CAPABILITY CHECK: Pure permission check — returns boolean, never throws.
 *
 * Evaluation order:
 *   1. SUPERADMIN → always true
 *   2. Check denyList on user       (future — per-user deny overrides)
 *   3. Check user-level grant       (future — per-user grant overrides)
 *   4. Check role default from roleDefaults map
 *   5. Apply resource constraints (actions ending in '_own' require
 *      resource.staffId === session.user.staffId)
 *   6. Return false
 *
 * Steps 2-3 (per-user deny/grant) are not yet implemented — they land
 * when CustomRole (P0.A.11) ships. Steps 1, 4, 5 are active.
 */
export function can(
  session: PermissionSession,
  action: PermissionKey,
  resource?: ResourceContext,
): boolean {
  // Step 1: SUPERADMIN bypass
  if (session.user.role === Role.SUPERADMIN) return true;

  // Step 4: Check role defaults
  const defaults = roleDefaults[session.user.role] ?? [];
  if (!defaults.includes(action)) return false;

  // Step 5: Resource constraints — actions ending in "_own" require staffId match
  if (action.endsWith("_own")) {
    // _own actions require a resource with staffId. Partial resources
    // (resource provided without staffId) are treated as a constraint
    // violation — fail closed to prevent privilege escalation when
    // callers forget to pass staffId. Callers that genuinely need to
    // bypass the constraint should pass no resource at all (signals
    // "permission-level check only, no resource scoping").
    if (resource !== undefined) {
      if (!resource.staffId) return false;
      if (session.user.staffId !== resource.staffId) return false;
    }
    // No resource passed → permission-level check only, role default applies
  }

  return true;
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
