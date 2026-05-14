"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { Role } from "@prisma/client";
import { Permissions, type PermissionKey } from "./types";
import { roleDefaults } from "./defaults";

/**
 * Resource context for permission checks — same shape as the server-side
 * ResourceContext from lib/permissions/check.ts. Components pass this when
 * a permission has _own semantics tied to a specific resource.
 */
export type UIResourceContext = {
  ownerId?: string;
  organizationId?: string;
  staffId?: string;
  locationId?: string;
};

export type PermissionsAPI = {
  /** True if the current session has the given permission, false otherwise. */
  can: (action: PermissionKey, resource?: UIResourceContext) => boolean;
  /** True if the current session has the given role exactly. */
  hasRole: (role: Role) => boolean;
  /** True if the current session has any of the given roles. */
  hasAnyRole: (roles: Role[]) => boolean;
  /** True if the session has loaded (useful for skeleton states). */
  isReady: boolean;
  /** True if the user is signed in. */
  isAuthenticated: boolean;
  /** Current role, or null if not authenticated or session not ready. */
  role: Role | null;
  /** Current organizationId, or null if not authenticated/SUPERADMIN. */
  organizationId: string | null;
  /** Current staffId, or null if not set (e.g. SUPERADMIN, OWNER). */
  staffId: string | null;
  /** All permissions available to this user (memoized array). */
  permissions: PermissionKey[];
  /** The convenient Permissions object literal for inline checks. */
  P: typeof Permissions;
};

/**
 * Pure permission-check logic extracted for testability (P0.A.9).
 *
 * Mirrors the server-side can() from lib/permissions/check.ts:
 * 1. SUPERADMIN bypass
 * 2. roleDefaults lookup
 * 3. Resource constraint enforcement for _own keys (staffId match)
 *
 * Exported for unit tests — UI consumers should use usePermissions().
 */
export function checkPermission(
  role: Role | null,
  staffId: string | null,
  permissions: PermissionKey[],
  action: PermissionKey,
  resource?: UIResourceContext,
): boolean {
  if (!role) return false;
  // SUPERADMIN bypass — matches server-side can()
  if (role === Role.SUPERADMIN) return true;
  if (!permissions.includes(action)) return false;
  // Resource constraint enforcement for _own keys — matches server logic
  if (action.endsWith("_own") && resource !== undefined) {
    if (!resource.staffId) return false;
    if (staffId !== resource.staffId) return false;
  }
  return true;
}

/**
 * Client-side hook returning a memoized PermissionsAPI for the current session.
 * Mirrors the server-side can() logic from lib/permissions/check.ts so client
 * gates match server enforcement.
 *
 * SECURITY NOTE: Permission checks via this hook are for UI affordances only —
 * showing/hiding buttons, gating UI flows. The server-side equivalent in API
 * routes and middleware is the only source of truth. Never assume a hidden
 * button means the action is impossible — the server must always validate.
 */
export function usePermissions(): PermissionsAPI {
  const { data: session, status } = useSession();

  return useMemo<PermissionsAPI>(() => {
    const isReady = status !== "loading";
    const isAuthenticated = status === "authenticated" && !!session?.user;
    const role = (session?.user as { role?: Role } | undefined)?.role ?? null;
    const organizationId = (session?.user as { organizationId?: string | null } | undefined)?.organizationId ?? null;
    const staffId = (session?.user as { staffId?: string | null } | undefined)?.staffId ?? null;
    const customRolePermissions = (session?.user as { customRolePermissions?: PermissionKey[] } | undefined)?.customRolePermissions;

    // P0.A.11: customRolePermissions (from User.customRoleId → PermissionSet) override roleDefaults
    const permissions: PermissionKey[] = customRolePermissions ?? (role ? roleDefaults[role] ?? [] : []);

    const can = (action: PermissionKey, resource?: UIResourceContext): boolean => {
      if (!isAuthenticated) return false;
      return checkPermission(role, staffId, permissions, action, resource);
    };

    const hasRole = (target: Role): boolean => isAuthenticated && role === target;
    const hasAnyRole = (targets: Role[]): boolean => isAuthenticated && role !== null && targets.includes(role);

    return {
      can,
      hasRole,
      hasAnyRole,
      isReady,
      isAuthenticated,
      role,
      organizationId,
      staffId,
      permissions,
      P: Permissions,
    };
  }, [session, status]);
}
