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
  APPOINTMENT_CREATE: "appointment.create",
  APPOINTMENT_STATUS_CHANGE: "appointment.status_change",
  APPOINTMENT_CREATE_RECURRING: "appointment.create_recurring",
  CART_CREATE: "cart.create",
  CART_VOID: "cart.void",
  ORDER_CREATE: "order.create",
  CUSTOM_FIELD_DEFINITION_CREATE: "custom_field_definition.create",
  CUSTOM_FIELD_DEFINITION_UPDATE: "custom_field_definition.update",
  CUSTOM_FIELD_DEFINITION_DELETE: "custom_field_definition.delete",
  TAG_CREATE: "tag.create",
  TAG_UPDATE: "tag.update",
  TAG_DELETE: "tag.delete",
  TAG_ATTACH: "tag.attach",
  TAG_DETACH: "tag.detach",
  AUDIT_RETENTION_COMPLETED: "audit_retention.completed",
  ONBOARDING_SESSION_CREATED: "onboarding_session.created",
  ONBOARDING_SESSION_TRANSITIONED: "onboarding_session.transitioned",
  ONBOARDING_SESSION_SKIPPED_STEP: "onboarding_session.skipped_step",
  ONBOARDING_SESSION_COMPLETED: "onboarding_session.completed",
  ONBOARDING_RESUME_LINK_SENT: "onboarding_session.resume_link_sent",
  USER_CREATED: "user.created",
  ONBOARDING_TOKEN_ISSUED: "onboarding_token.issued",
  ONBOARDING_TOKEN_CONSUMED: "onboarding_token.consumed",
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
