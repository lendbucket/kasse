import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Permissions } from "@/lib/permissions/types";
import { PERMISSION_DESCRIPTIONS } from "@/lib/permissions/descriptions";

describe("PERMISSION_DESCRIPTIONS (P0.A.12)", () => {
  const allKeys: string[] = [];
  for (const category of Object.values(Permissions)) {
    for (const key of Object.values(category)) {
      allKeys.push(key);
    }
  }

  it("(a) every PermissionKey has a description", () => {
    for (const key of allKeys) {
      const desc = PERMISSION_DESCRIPTIONS[key as keyof typeof PERMISSION_DESCRIPTIONS];
      assert.ok(desc, `Missing description for ${key}`);
    }
  });

  it("(b) every description is between 1 and 200 chars", () => {
    for (const key of allKeys) {
      const desc = PERMISSION_DESCRIPTIONS[key as keyof typeof PERMISSION_DESCRIPTIONS];
      assert.ok(desc.length >= 1, `Description for ${key} is empty`);
      assert.ok(desc.length <= 200, `Description for ${key} exceeds 200 chars (${desc.length})`);
    }
  });

  it("(c) no description is exactly the PermissionKey value", () => {
    for (const key of allKeys) {
      const desc = PERMISSION_DESCRIPTIONS[key as keyof typeof PERMISSION_DESCRIPTIONS];
      assert.notEqual(desc, key, `Description for ${key} is just the key itself`);
    }
  });
});
