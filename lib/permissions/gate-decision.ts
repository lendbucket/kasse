import { Role } from "@prisma/client";
import type { PermissionKey } from "./types";
import type { UIResourceContext } from "./use-permissions";
import { checkPermission } from "./use-permissions";
import { roleDefaults } from "./defaults";

export type GateDecisionInput = {
  permission?: PermissionKey;
  role?: Role;
  anyRole?: Role[];
  resource?: UIResourceContext;
  currentRole: Role | null;
  currentStaffId: string | null;
};

/**
 * Pure gate-decision logic for PermissionGate (P0.A.10).
 *
 * Evaluates permission/role/anyRole gates with AND semantics.
 * Extracted as a pure function for unit-testing without React rendering.
 */
export function shouldGatePass(input: GateDecisionInput): boolean {
  const { permission, role, anyRole, resource, currentRole, currentStaffId } = input;

  // No gates specified → defensive pass
  if (permission === undefined && role === undefined && anyRole === undefined) {
    return true;
  }

  let pass = true;

  if (permission !== undefined) {
    const permissions: PermissionKey[] = currentRole ? roleDefaults[currentRole] ?? [] : [];
    pass = pass && checkPermission(currentRole, currentStaffId, permissions, permission, resource);
  }
  if (role !== undefined) {
    pass = pass && currentRole === role;
  }
  if (anyRole !== undefined) {
    pass = pass && currentRole !== null && anyRole.includes(currentRole);
  }

  return pass;
}
