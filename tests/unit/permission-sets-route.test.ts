/**
 * Pure-function tests for PermissionSet validation logic (P0.A.11).
 *
 * Tests validatePermissionSetInput() — the validation extracted from
 * the API routes for unit testing without HTTP/DB.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Permissions } from "@/lib/permissions/types";
import {
  validatePermissionSetInput,
  validPermissionCount,
} from "@/lib/permissions/validate-permission-set";

const P = Permissions;

describe("validatePermissionSetInput (P0.A.11)", () => {
  it("(a) valid input returns ok", () => {
    const result = validatePermissionSetInput({
      name: "Front Desk Staff",
      permissions: [P.POS.OPEN_CHECKOUT, P.APPOINTMENTS.VIEW_OWN],
    });
    assert.deepEqual(result, { ok: true });
  });

  it("(b) empty name returns error", () => {
    const result = validatePermissionSetInput({
      name: "",
      permissions: [P.POS.OPEN_CHECKOUT],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /name/);
  });

  it("(c) non-string name returns error", () => {
    const result = validatePermissionSetInput({
      name: 42,
      permissions: [P.POS.OPEN_CHECKOUT],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /name/);
  });

  it("(d) name over 100 chars returns error", () => {
    const result = validatePermissionSetInput({
      name: "x".repeat(101),
      permissions: [],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /100/);
  });

  it("(e) non-array permissions returns error", () => {
    const result = validatePermissionSetInput({
      name: "Test",
      permissions: "not-an-array",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /array/);
  });

  it("(f) unknown permission key in array returns error", () => {
    const result = validatePermissionSetInput({
      name: "Test",
      permissions: [P.POS.OPEN_CHECKOUT, "fake.permission"],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /unknown permission key/);
  });

  it("(g) all PermissionKey values are accepted (count derived at runtime)", () => {
    const allKeys: string[] = [];
    for (const category of Object.values(Permissions)) {
      for (const key of Object.values(category)) {
        allKeys.push(key);
      }
    }
    assert.equal(allKeys.length, validPermissionCount);
    const result = validatePermissionSetInput({
      name: "Full Access",
      permissions: allKeys,
    });
    assert.deepEqual(result, { ok: true });
  });

  it("(h) empty permissions array is accepted", () => {
    const result = validatePermissionSetInput({
      name: "No Permissions",
      permissions: [],
    });
    assert.deepEqual(result, { ok: true });
  });
});
