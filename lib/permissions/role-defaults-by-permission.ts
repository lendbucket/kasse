import { Role } from "@prisma/client";
import type { PermissionKey } from "./types";
import { roleDefaults } from "./defaults";

/**
 * Reverse index of roleDefaults: for each PermissionKey, lists which
 * built-in roles include it in their defaults (P0.A.12).
 *
 * Used by the custom roles editor UI to show inline badges like
 * "OWNER, MANAGER" next to each permission checkbox.
 */
export const ROLE_DEFAULTS_BY_PERMISSION: Record<PermissionKey, Role[]> = (() => {
  const result: Record<string, Role[]> = {};
  for (const [role, perms] of Object.entries(roleDefaults)) {
    for (const perm of perms) {
      if (!result[perm]) result[perm] = [];
      result[perm].push(role as Role);
    }
  }
  return result as Record<PermissionKey, Role[]>;
})();
