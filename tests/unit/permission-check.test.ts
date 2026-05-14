/**
 * P0.A.4: Permission check engine tests.
 *
 * Uses Node's built-in test runner (node --test).
 * Run: npx tsx --test tests/unit/permission-check.test.ts
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.4
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { Permissions } from "../../lib/permissions/types";
import {
  can,
  requireRole,
  requireAnyRole,
  requirePermission,
  PermissionError,
  type PermissionSession,
} from "../../lib/permissions/check";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeSession(role: Role, overrides?: Partial<PermissionSession["user"]>): PermissionSession {
  return {
    user: {
      id: "user-test-1",
      role,
      organizationId: "org-test-1",
      ...overrides,
    },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("Permission check engine (P0.A.4)", () => {
  it("SUPERADMIN can() returns true for any PermissionKey", () => {
    const session = makeSession(Role.SUPERADMIN);

    assert.equal(can(session, Permissions.POS.OPEN_CHECKOUT), true);
    assert.equal(can(session, Permissions.FINANCIAL.VIEW_REVENUE), true);
    assert.equal(can(session, Permissions.ADMIN.IMPERSONATE), true);
    assert.equal(can(session, Permissions.SETTINGS.EDIT_ROLES), true);
    assert.equal(can(session, Permissions.PAYROLL.RUN_PAYROLL), true);
  });

  it("non-SUPERADMIN roles return correct results based on roleDefaults", () => {
    // OWNER has POS.OPEN_CHECKOUT
    assert.equal(can(makeSession(Role.OWNER), Permissions.POS.OPEN_CHECKOUT), true);
    // OWNER does NOT have ADMIN.IMPERSONATE
    assert.equal(can(makeSession(Role.OWNER), Permissions.ADMIN.IMPERSONATE), false);
    // MANAGER has POS.OPEN_CHECKOUT
    assert.equal(can(makeSession(Role.MANAGER), Permissions.POS.OPEN_CHECKOUT), true);
    // MANAGER does NOT have FINANCIAL.VIEW_REVENUE
    assert.equal(can(makeSession(Role.MANAGER), Permissions.FINANCIAL.VIEW_REVENUE), false);
    // STAFF has POS.OPEN_CHECKOUT but not POS.OVERRIDE_PRICE
    assert.equal(can(makeSession(Role.STAFF), Permissions.POS.OPEN_CHECKOUT), true);
    assert.equal(can(makeSession(Role.STAFF), Permissions.POS.OVERRIDE_PRICE), false);
    // CLIENT has nothing
    assert.equal(can(makeSession(Role.CLIENT), Permissions.POS.OPEN_CHECKOUT), false);
  });

  it("requireRole throws PermissionError when role mismatched", () => {
    const session = makeSession(Role.STAFF);

    // Should not throw for matching role
    assert.doesNotThrow(() => requireRole(session, Role.STAFF));

    // Should throw for mismatched role
    assert.throws(
      () => requireRole(session, Role.OWNER),
      (err: unknown) => {
        assert.ok(err instanceof PermissionError);
        assert.equal(err.status, 403);
        assert.equal(err.code, "forbidden");
        assert.equal(err.role, Role.STAFF);
        assert.match(err.message, /Required role OWNER, got STAFF/);
        return true;
      },
    );
  });

  it("requireAnyRole accepts array, throws when no match", () => {
    const session = makeSession(Role.MANAGER);

    // Should not throw when role is in array
    assert.doesNotThrow(() =>
      requireAnyRole(session, [Role.OWNER, Role.MANAGER]),
    );

    // Should throw when role is not in array
    assert.throws(
      () => requireAnyRole(session, [Role.SUPERADMIN, Role.OWNER]),
      (err: unknown) => {
        assert.ok(err instanceof PermissionError);
        assert.equal(err.status, 403);
        assert.equal(err.code, "forbidden");
        assert.match(err.message, /Required one of/);
        return true;
      },
    );
  });

  it("requirePermission throws with status: 403 and code: 'forbidden'", () => {
    const session = makeSession(Role.STAFF);

    assert.throws(
      () => requirePermission(session, Permissions.FINANCIAL.VIEW_REVENUE),
      (err: unknown) => {
        assert.ok(err instanceof PermissionError);
        assert.equal(err.status, 403);
        assert.equal(err.code, "forbidden");
        assert.equal(err.permission, "financial.view_revenue");
        assert.equal(err.role, Role.STAFF);
        assert.match(err.message, /Permission denied: financial\.view_revenue/);
        return true;
      },
    );

    // SUPERADMIN should not throw
    const admin = makeSession(Role.SUPERADMIN);
    assert.doesNotThrow(() =>
      requirePermission(admin, Permissions.FINANCIAL.VIEW_REVENUE),
    );
  });

  it("resource context enforces _own staffId constraint", () => {
    const ownResource = { staffId: "staff-A" };
    const otherResource = { staffId: "staff-B" };

    // SUPERADMIN bypasses resource constraints
    const admin = makeSession(Role.SUPERADMIN);
    assert.equal(can(admin, Permissions.APPOINTMENTS.VIEW_OWN, otherResource), true);

    // STAFF with matching staffId → allowed
    const staffA = makeSession(Role.STAFF, { staffId: "staff-A" });
    assert.equal(can(staffA, Permissions.APPOINTMENTS.VIEW_OWN, ownResource), true);
    assert.equal(can(staffA, Permissions.APPOINTMENTS.EDIT_OWN, ownResource), true);

    // STAFF with mismatched staffId → denied
    assert.equal(can(staffA, Permissions.APPOINTMENTS.VIEW_OWN, otherResource), false);
    assert.equal(can(staffA, Permissions.APPOINTMENTS.EDIT_OWN, otherResource), false);

    // No resource context → allowed (no constraint to apply)
    assert.equal(can(staffA, Permissions.APPOINTMENTS.VIEW_OWN), true);

    // requirePermission throws with resource in error
    assert.throws(
      () => requirePermission(staffA, Permissions.APPOINTMENTS.EDIT_OWN, otherResource),
      (err: unknown) => {
        assert.ok(err instanceof PermissionError);
        assert.deepEqual(err.resource, otherResource);
        return true;
      },
    );
  });

  it("_own constraint fails closed when partial resource is passed without staffId", () => {
    const session = makeSession(Role.STAFF, { staffId: "staff-A" });
    // Passing resource without staffId — should return false (fail closed)
    const result = can(session, Permissions.APPOINTMENTS.EDIT_OWN, { organizationId: "org-1" });
    assert.equal(result, false);
  });

  it("(l) customRolePermissions overrides roleDefaults — grants permission STAFF normally lacks", () => {
    // STAFF normally can't access FINANCIAL.VIEW_REVENUE, but a custom role grants it
    const session = makeSession(Role.STAFF, {
      customRolePermissions: [Permissions.FINANCIAL.VIEW_REVENUE],
    });
    assert.equal(can(session, Permissions.FINANCIAL.VIEW_REVENUE), true);
  });

  it("(m) customRolePermissions replaces (not unions) roleDefaults", () => {
    // STAFF normally has APPOINTMENTS.VIEW_OWN, but custom role doesn't include it
    const session = makeSession(Role.STAFF, {
      customRolePermissions: [Permissions.FINANCIAL.VIEW_REVENUE],
    });
    assert.equal(can(session, Permissions.APPOINTMENTS.VIEW_OWN), false);
  });
});
