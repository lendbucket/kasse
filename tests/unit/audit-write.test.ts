import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diffChangedFields, AuditAction } from "@/lib/audit/helpers";

describe("diffChangedFields (P0.A.14)", () => {
  it("returns empty array when objects are identical", () => {
    assert.deepEqual(diffChangedFields({ a: 1, b: 2 }, { a: 1, b: 2 }), []);
  });

  it("returns changed primitive fields", () => {
    assert.deepEqual(diffChangedFields({ a: 1, b: 2 }, { a: 1, b: 3 }), ["b"]);
  });

  it("returns added fields", () => {
    const result = diffChangedFields({ a: 1 }, { a: 1, b: 2 });
    assert.deepEqual(result, ["b"]);
  });

  it("returns removed fields", () => {
    const result = diffChangedFields({ a: 1, b: 2 }, { a: 1 });
    assert.deepEqual(result, ["b"]);
  });

  it("detects changes in array fields", () => {
    assert.deepEqual(
      diffChangedFields({ permissions: ["a", "b"] }, { permissions: ["a", "c"] }),
      ["permissions"]
    );
  });

  it("ignores identical arrays even in different reference", () => {
    const a = { perms: ["x", "y"] };
    const b = { perms: ["x", "y"] };
    assert.deepEqual(diffChangedFields(a, b), []);
  });

  it("array order matters (intentional — order changes count as changed)", () => {
    assert.deepEqual(
      diffChangedFields({ perms: ["a", "b"] }, { perms: ["b", "a"] }),
      ["perms"]
    );
  });
});

describe("AuditAction enum (P0.A.14)", () => {
  it("contains all 35 canonical actions", () => {
    const expected = [
      "permission_set.create",
      "permission_set.update",
      "permission_set.delete",
      "user.custom_role.assign",
      "user.custom_role.unassign",
      "organization_group.create",
      "organization_group.update",
      "organization_group.delete",
      "client.soft_delete",
      "appointment.create",
      "appointment.status_change",
      "appointment.create_recurring",
      "cart.create",
      "cart.void",
      "order.create",
      "custom_field_definition.create",
      "custom_field_definition.update",
      "custom_field_definition.delete",
      "tag.create",
      "tag.update",
      "tag.delete",
      "tag.attach",
      "tag.detach",
      "audit_retention.completed",
      "onboarding_session.created",
      "onboarding_session.transitioned",
      "onboarding_session.skipped_step",
      "onboarding_session.completed",
      "onboarding_session.resume_link_sent",
      "user.created",
      "onboarding_token.issued",
      "onboarding_token.consumed",
      "organization.bootstrapped",
      "location.created",
      "session.refreshed",
    ];
    const actual = Object.values(AuditAction).sort();
    assert.deepEqual(actual.sort(), expected.sort());
  });
});
