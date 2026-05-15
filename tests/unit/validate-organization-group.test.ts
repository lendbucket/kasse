/**
 * P0.A.13: OrganizationGroup input validation tests.
 *
 * Run: npx tsx --test tests/unit/validate-organization-group.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateOrganizationGroupInput } from "../../lib/permissions/validate-organization-group";

describe("validateOrganizationGroupInput (P0.A.13)", () => {
  it("(a) valid input with REGION level returns ok", () => {
    const result = validateOrganizationGroupInput({
      name: "West Coast",
      level: "REGION",
      parentGroupId: null,
      permissionSetId: null,
    });
    assert.deepEqual(result, { ok: true });
  });

  it("(b) valid input with BRAND level returns ok", () => {
    const result = validateOrganizationGroupInput({
      name: "Premium Brand",
      level: "BRAND",
      parentGroupId: "parent-123",
      permissionSetId: "ps-456",
    });
    assert.deepEqual(result, { ok: true });
  });

  it("(c) valid input with CONCEPT level returns ok", () => {
    const result = validateOrganizationGroupInput({
      name: "Express Concept",
      level: "CONCEPT",
      parentGroupId: undefined,
      permissionSetId: undefined,
    });
    assert.deepEqual(result, { ok: true });
  });

  it("(d) empty name returns error", () => {
    const result = validateOrganizationGroupInput({
      name: "",
      level: "REGION",
      parentGroupId: null,
      permissionSetId: null,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /name/i);
  });

  it("(e) name over 100 chars returns error", () => {
    const result = validateOrganizationGroupInput({
      name: "x".repeat(101),
      level: "REGION",
      parentGroupId: null,
      permissionSetId: null,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /100/);
  });

  it('(f) invalid level "INVALID" returns error', () => {
    const result = validateOrganizationGroupInput({
      name: "Test",
      level: "INVALID",
      parentGroupId: null,
      permissionSetId: null,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /level/i);
  });

  it("(g) non-string parentGroupId returns error", () => {
    const result = validateOrganizationGroupInput({
      name: "Test",
      level: "REGION",
      parentGroupId: 123,
      permissionSetId: null,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /parentGroupId/i);
  });

  it("(h) empty-string parentGroupId returns error", () => {
    const result = validateOrganizationGroupInput({
      name: "Test",
      level: "REGION",
      parentGroupId: "",
      permissionSetId: null,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /parentGroupId/i);
  });

  it("(i) empty-string permissionSetId returns error", () => {
    const result = validateOrganizationGroupInput({
      name: "Test",
      level: "REGION",
      parentGroupId: null,
      permissionSetId: "",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /permissionSetId/i);
  });
});
