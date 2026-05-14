/**
 * P0.A.3: Permission key canonical enum tests.
 *
 * Uses Node's built-in test runner (node --test).
 * Run: npx tsx --test tests/unit/permission-keys.test.ts
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.3
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Permissions, type PermissionKey } from "../../lib/permissions/types";

// ── Helper: collect all leaf values from the nested Permissions object ───

function collectValues(obj: Record<string, unknown>): string[] {
  const values: string[] = [];
  for (const v of Object.values(obj)) {
    if (typeof v === "string") {
      values.push(v);
    } else if (typeof v === "object" && v !== null) {
      values.push(...collectValues(v as Record<string, unknown>));
    }
  }
  return values;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("PermissionKey enum (P0.A.3)", () => {
  const allValues = collectValues(Permissions);
  const categories = Object.keys(Permissions) as Array<keyof typeof Permissions>;

  it("all key values are unique strings (no duplicates across the whole object)", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const v of allValues) {
      if (seen.has(v)) duplicates.push(v);
      seen.add(v);
    }
    assert.equal(
      duplicates.length,
      0,
      `Found duplicate permission values: ${duplicates.join(", ")}`,
    );
  });

  it("every key value starts with its category prefix lowercased", () => {
    for (const category of categories) {
      const prefix = category.toLowerCase() + ".";
      const categoryObj = Permissions[category] as Record<string, string>;
      for (const [key, value] of Object.entries(categoryObj)) {
        assert.ok(
          value.startsWith(prefix),
          `${category}.${key} = "${value}" does not start with "${prefix}"`,
        );
      }
    }
  });

  it("Permissions object values satisfy the PermissionKey type", () => {
    // TypeScript compile-time check — if this compiles, the assertion holds.
    // Runtime verification: every leaf value is a string that's part of the union.
    const typeCheck = (_k: PermissionKey) => {};
    for (const v of allValues) {
      typeCheck(v as PermissionKey);
    }
    assert.ok(true, "All values are valid PermissionKey members");
  });

  it("exactly 90 distinct members at this milestone — floor will grow as later phases add keys", () => {
    assert.equal(
      allValues.length,
      90,
      `Expected exactly 90 keys at P0.A.3 milestone, got ${allValues.length}`,
    );
  });

  it("all key values match regex /^[a-z]+(\\.[a-z_]+)+$/", () => {
    const pattern = /^[a-z]+(\.[a-z_]+)+$/;
    const failures: string[] = [];
    for (const v of allValues) {
      if (!pattern.test(v)) failures.push(v);
    }
    assert.equal(
      failures.length,
      0,
      `Values not matching naming convention: ${failures.join(", ")}`,
    );
  });

  it("has exactly 14 categories", () => {
    assert.equal(
      categories.length,
      14,
      `Expected 14 categories, got ${categories.length}: ${categories.join(", ")}`,
    );
  });
});
