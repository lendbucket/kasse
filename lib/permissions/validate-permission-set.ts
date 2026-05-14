import { Permissions } from "./types";

export type ValidationResult = { ok: true } | { ok: false; error: string };

const allValidPermissions = new Set<string>();
for (const category of Object.values(Permissions)) {
  for (const key of Object.values(category)) {
    allValidPermissions.add(key);
  }
}

/** Exported for tests — the count of valid permission keys. */
export const validPermissionCount = allValidPermissions.size;

/**
 * Validates input for creating or updating a PermissionSet (P0.A.11).
 * Pure function — no DB access. Extracted for unit testing.
 */
export function validatePermissionSetInput(input: {
  name: unknown;
  permissions: unknown;
}): ValidationResult {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return { ok: false, error: "name is required and must be non-empty string" };
  }
  if (input.name.length > 100) {
    return { ok: false, error: "name must be 100 characters or less" };
  }
  if (!Array.isArray(input.permissions)) {
    return { ok: false, error: "permissions must be an array" };
  }
  for (const p of input.permissions) {
    if (typeof p !== "string") {
      return { ok: false, error: "permissions must be strings" };
    }
    if (!allValidPermissions.has(p)) {
      return { ok: false, error: `unknown permission key: ${p}` };
    }
  }
  return { ok: true };
}
