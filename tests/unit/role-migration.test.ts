/**
 * P0.A.1: Role enum migration test
 *
 * Uses Node's built-in test runner (node --test).
 * Run: npx tsx --test tests/unit/role-migration.test.ts
 *
 * These tests validate the Prisma schema definition, not database
 * state. Database-level assertions (all rows have valid roles,
 * no NULLs) are verified by the migration SQL itself (NOT NULL
 * constraint + CASE with ELSE default).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Import the generated Prisma enum — this validates the enum exists
// and has the expected values at the TypeScript level.
import { Role } from "@prisma/client";

describe("Role enum (P0.A.1)", () => {
  const EXPECTED_ROLES = [
    "SUPERADMIN",
    "OWNER",
    "MANAGER",
    "STAFF",
    "STAFF_VIEW_ONLY",
    "CLIENT",
    "FRANCHISE_OWNER",
    "ACCOUNTANT",
    "BUSINESS_PARTNER",
  ] as const;

  it("has exactly 9 values", () => {
    const roleValues = Object.values(Role);
    assert.equal(roleValues.length, 9, `Expected 9 Role values, got ${roleValues.length}: ${roleValues.join(", ")}`);
  });

  it("contains all expected values", () => {
    const roleValues = Object.values(Role);
    for (const expected of EXPECTED_ROLES) {
      assert.ok(
        roleValues.includes(expected as Role),
        `Missing Role value: ${expected}`,
      );
    }
  });

  it("values match the expected set exactly (no extras)", () => {
    const roleValues = new Set(Object.values(Role));
    const expectedSet = new Set(EXPECTED_ROLES as readonly string[]);
    assert.deepEqual(roleValues, expectedSet);
  });

  it("STAFF is a valid default value", () => {
    // Prisma schema has @default(STAFF) — validate the value exists
    assert.equal(Role.STAFF, "STAFF");
  });

  it("enum values are uppercase strings matching their key names", () => {
    for (const [key, value] of Object.entries(Role)) {
      assert.equal(key, value, `Role.${key} should equal "${key}" but got "${value}"`);
    }
  });
});
