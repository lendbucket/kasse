/**
 * Canonical audit action names. New actions should be added here so the
 * vocabulary stays consistent across routes and surfaces.
 */
export const AuditAction = {
  PERMISSION_SET_CREATE: "permission_set.create",
  PERMISSION_SET_UPDATE: "permission_set.update",
  PERMISSION_SET_DELETE: "permission_set.delete",
  USER_CUSTOM_ROLE_ASSIGN: "user.custom_role.assign",
  USER_CUSTOM_ROLE_UNASSIGN: "user.custom_role.unassign",
  ORGANIZATION_GROUP_CREATE: "organization_group.create",
  ORGANIZATION_GROUP_UPDATE: "organization_group.update",
  ORGANIZATION_GROUP_DELETE: "organization_group.delete",
  CLIENT_SOFT_DELETE: "client.soft_delete",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * Diffs two objects and returns the list of field names that changed.
 * Used to populate AuditLog.changedFields without manually tracking
 * which fields the route updated.
 */
export function diffChangedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed;
}
