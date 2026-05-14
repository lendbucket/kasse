/**
 * Pure-function tests for the gate-decision logic in PermissionGate (P0.A.10).
 *
 * @testing-library/react is not installed, so we test shouldGatePass() directly
 * rather than rendering the component. The component is a thin wrapper around
 * shouldGatePass() + usePermissions(), so testing the pure function covers all
 * gate-decision logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { Permissions } from "@/lib/permissions/types";
import { shouldGatePass } from "@/lib/permissions/gate-decision";

const P = Permissions;

describe("PermissionGate — shouldGatePass() logic (P0.A.10)", () => {
  it("(a) no gates specified: returns true (defensive default)", () => {
    assert.equal(
      shouldGatePass({ currentRole: Role.STAFF, currentStaffId: "s1" }),
      true,
    );
  });

  it("(b) permission gate: OWNER + STAFF.INVITE → true", () => {
    assert.equal(
      shouldGatePass({
        permission: P.STAFF.INVITE,
        currentRole: Role.OWNER,
        currentStaffId: null,
      }),
      true,
    );
  });

  it("(c) permission gate: STAFF + STAFF.INVITE → false", () => {
    assert.equal(
      shouldGatePass({
        permission: P.STAFF.INVITE,
        currentRole: Role.STAFF,
        currentStaffId: "s1",
      }),
      false,
    );
  });

  it("(d) role gate: STAFF + role=STAFF → true", () => {
    assert.equal(
      shouldGatePass({
        role: Role.STAFF,
        currentRole: Role.STAFF,
        currentStaffId: "s1",
      }),
      true,
    );
  });

  it("(e) role gate: STAFF + role=OWNER → false", () => {
    assert.equal(
      shouldGatePass({
        role: Role.OWNER,
        currentRole: Role.STAFF,
        currentStaffId: "s1",
      }),
      false,
    );
  });

  it("(f) anyRole gate: STAFF + anyRole=[STAFF, MANAGER] → true", () => {
    assert.equal(
      shouldGatePass({
        anyRole: [Role.STAFF, Role.MANAGER],
        currentRole: Role.STAFF,
        currentStaffId: "s1",
      }),
      true,
    );
  });

  it("(g) anyRole gate: STAFF + anyRole=[OWNER, MANAGER] → false", () => {
    assert.equal(
      shouldGatePass({
        anyRole: [Role.OWNER, Role.MANAGER],
        currentRole: Role.STAFF,
        currentStaffId: "s1",
      }),
      false,
    );
  });

  it("(h) AND logic: permission AND role both required, both pass → true", () => {
    assert.equal(
      shouldGatePass({
        permission: P.POS.OPEN_CHECKOUT,
        role: Role.OWNER,
        currentRole: Role.OWNER,
        currentStaffId: null,
      }),
      true,
    );
  });

  it("(i) AND logic: permission AND role both required, one fails → false", () => {
    // OWNER has POS.OPEN_CHECKOUT, but role gate requires MANAGER
    assert.equal(
      shouldGatePass({
        permission: P.POS.OPEN_CHECKOUT,
        role: Role.MANAGER,
        currentRole: Role.OWNER,
        currentStaffId: null,
      }),
      false,
    );
  });

  it("(j) resource constraint: STAFF staffId='A' + EDIT_OWN + resource={staffId:'B'} → false", () => {
    assert.equal(
      shouldGatePass({
        permission: P.APPOINTMENTS.EDIT_OWN,
        resource: { staffId: "B" },
        currentRole: Role.STAFF,
        currentStaffId: "A",
      }),
      false,
    );
  });

  it("(k) unauthenticated (currentRole=null) with any gate → false", () => {
    assert.equal(
      shouldGatePass({
        permission: P.POS.OPEN_CHECKOUT,
        currentRole: null,
        currentStaffId: null,
      }),
      false,
    );
    assert.equal(
      shouldGatePass({
        role: Role.STAFF,
        currentRole: null,
        currentStaffId: null,
      }),
      false,
    );
    assert.equal(
      shouldGatePass({
        anyRole: [Role.STAFF, Role.OWNER],
        currentRole: null,
        currentStaffId: null,
      }),
      false,
    );
    // But no-gates case still returns true even when unauthenticated
    assert.equal(
      shouldGatePass({ currentRole: null, currentStaffId: null }),
      true,
    );
  });
});
