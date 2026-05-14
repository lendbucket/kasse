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

  it("non-SUPERADMIN roles return false (stub state)", () => {
    const roles = [
      Role.OWNER,
      Role.MANAGER,
      Role.STAFF,
      Role.STAFF_VIEW_ONLY,
      Role.CLIENT,
      Role.FRANCHISE_OWNER,
      Role.ACCOUNTANT,
      Role.BUSINESS_PARTNER,
    ];

    for (const role of roles) {
      const session = makeSession(role);
      assert.equal(
        can(session, Permissions.POS.OPEN_CHECKOUT),
        false,
        `Expected can() to return false for ${role} (stub state)`,
      );
    }
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

  it("resource context parameter accepted but not yet enforced (passes through cleanly)", () => {
    const session = makeSession(Role.SUPERADMIN);
    const resource = {
      ownerId: "user-123",
      organizationId: "org-456",
      staffId: "staff-789",
      locationId: "loc-abc",
    };

    // Should not throw — SUPERADMIN bypasses, resource is accepted but ignored
    assert.equal(can(session, Permissions.APPOINTMENTS.VIEW_OWN, resource), true);
    assert.doesNotThrow(() =>
      requirePermission(session, Permissions.APPOINTMENTS.VIEW_OWN, resource),
    );

    // Non-SUPERADMIN with resource — still false in stub, but no crash
    const staff = makeSession(Role.STAFF, { staffId: "staff-789" });
    assert.equal(can(staff, Permissions.APPOINTMENTS.VIEW_OWN, resource), false);

    // requirePermission captures resource in the error
    assert.throws(
      () => requirePermission(staff, Permissions.APPOINTMENTS.VIEW_OWN, resource),
      (err: unknown) => {
        assert.ok(err instanceof PermissionError);
        assert.deepEqual(err.resource, resource);
        return true;
      },
    );
  });
});
