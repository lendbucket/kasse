/**
 * P0.A.13: Validation for OrganizationGroup create/update inputs.
 *
 * Pure function — no I/O, no Prisma. Safe for unit tests.
 */

export type OrganizationGroupInput = {
  name: unknown;
  level: unknown;
  parentGroupId: unknown;
  permissionSetId: unknown;
};

export type GroupValidationResult = { ok: true } | { ok: false; error: string };

const VALID_LEVELS = new Set<string>(["REGION", "BRAND", "CONCEPT"]);

export function validateOrganizationGroupInput(input: OrganizationGroupInput): GroupValidationResult {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return { ok: false, error: "name is required and must be non-empty string" };
  }
  if (input.name.length > 100) {
    return { ok: false, error: "name must be 100 characters or less" };
  }
  if (typeof input.level !== "string" || !VALID_LEVELS.has(input.level)) {
    return { ok: false, error: `level must be one of: ${[...VALID_LEVELS].join(", ")}` };
  }
  if (input.parentGroupId !== null && input.parentGroupId !== undefined) {
    if (typeof input.parentGroupId !== "string" || input.parentGroupId.length === 0) {
      return { ok: false, error: "parentGroupId must be a non-empty string or null" };
    }
  }
  if (input.permissionSetId !== null && input.permissionSetId !== undefined) {
    if (typeof input.permissionSetId !== "string" || input.permissionSetId.length === 0) {
      return { ok: false, error: "permissionSetId must be a non-empty string or null" };
    }
  }
  return { ok: true };
}
