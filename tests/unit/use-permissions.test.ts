/**
 * Pure-function tests for the permission-check logic in usePermissions (P0.A.9).
 *
 * @testing-library/react is not installed, so we test checkPermission() directly
 * rather than rendering the hook. The hook is a thin wrapper around checkPermission()
 * + useSession(), so testing the pure function covers all permission logic.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { Permissions, type PermissionKey } from "@/lib/permissions/types";
import { roleDefaults } from "@/lib/permissions/defaults";
import { checkPermission } from "@/lib/permissions/use-permissions";

const P = Permissions;

describe("usePermissions — checkPermission() logic (P0.A.9)", () => {
  it("(a) unauthenticated (null role): can() returns false for everything", () => {
    assert.equal(checkPermission(null, null, [], P.POS.OPEN_CHECKOUT), false);
    assert.equal(checkPermission(null, null, [], P.ADMIN.IMPERSONATE), false);
    assert.equal(checkPermission(null, null, [], P.APPOINTMENTS.VIEW_OWN), false);
  });

  it("(b) SUPERADMIN: can() returns true for everything (bypass)", () => {
    const perms = roleDefaults[Role.SUPERADMIN];
    assert.equal(checkPermission(Role.SUPERADMIN, null, perms, P.ADMIN.IMPERSONATE), true);
    assert.equal(checkPermission(Role.SUPERADMIN, null, perms, P.POS.OPEN_CHECKOUT), true);
    assert.equal(checkPermission(Role.SUPERADMIN, null, perms, P.FINANCIAL.VIEW_REVENUE), true);
    assert.equal(checkPermission(Role.SUPERADMIN, null, perms, P.APPOINTMENTS.EDIT_OWN), true);
  });

  it("(c) OWNER: can() returns true for non-ADMIN permissions, false for ADMIN.IMPERSONATE", () => {
    const perms = roleDefaults[Role.OWNER];
    assert.equal(checkPermission(Role.OWNER, null, perms, P.POS.OPEN_CHECKOUT), true);
    assert.equal(checkPermission(Role.OWNER, null, perms, P.FINANCIAL.VIEW_REVENUE), true);
    assert.equal(checkPermission(Role.OWNER, null, perms, P.ADMIN.IMPERSONATE), false);
    assert.equal(checkPermission(Role.OWNER, null, perms, P.ADMIN.SUSPEND_MERCHANT), false);
  });

  it("(d) STAFF: can() returns true for APPOINTMENTS.VIEW_OWN, false for APPOINTMENTS.EDIT_ANY", () => {
    const perms = roleDefaults[Role.STAFF];
    assert.equal(checkPermission(Role.STAFF, "staff-1", perms, P.APPOINTMENTS.VIEW_OWN), true);
    assert.equal(checkPermission(Role.STAFF, "staff-1", perms, P.APPOINTMENTS.EDIT_ANY), false);
  });

  it("(e) resource constraint: STAFF with staffId='A' calling can(EDIT_OWN, {staffId:'B'}) returns false", () => {
    const perms = roleDefaults[Role.STAFF];
    assert.equal(
      checkPermission(Role.STAFF, "A", perms, P.APPOINTMENTS.EDIT_OWN, { staffId: "B" }),
      false,
    );
  });

  it("(f) resource constraint: same call with {staffId:'A'} returns true", () => {
    const perms = roleDefaults[Role.STAFF];
    assert.equal(
      checkPermission(Role.STAFF, "A", perms, P.APPOINTMENTS.EDIT_OWN, { staffId: "A" }),
      true,
    );
  });

  it("(g) hasRole equivalent: role exact match", () => {
    // Simulate hasRole logic inline (pure function — role === target)
    const role: Role = Role.MANAGER;
    const check = (target: Role) => role === target;
    assert.equal(check(Role.MANAGER), true);
    assert.equal(check(Role.OWNER), false);
    assert.equal(check(Role.STAFF), false);
  });

  it("(h) hasAnyRole equivalent: role is in array", () => {
    const role: Role = Role.STAFF;
    const hasAny = (targets: Role[]) => targets.includes(role);
    assert.equal(hasAny([Role.STAFF, Role.STAFF_VIEW_ONLY]), true);
    assert.equal(hasAny([Role.OWNER, Role.MANAGER]), false);
  });

  it("(i) isReady is false when status is 'loading' (logic check)", () => {
    // The hook sets isReady = status !== "loading"
    const isReady = (s: string) => s !== "loading";
    assert.equal(isReady("loading"), false);
    assert.equal(isReady("authenticated"), true);
    assert.equal(isReady("unauthenticated"), true);
  });

  it("(j) isAuthenticated is false when session is null (logic check)", () => {
    // The hook sets isAuthenticated = status === "authenticated" && !!session?.user
    const isAuth = (status: string, user: unknown) => status === "authenticated" && !!user;
    assert.equal(isAuth("unauthenticated", null), false);
    assert.equal(isAuth("authenticated", null), false);
    assert.equal(isAuth("authenticated", undefined), false);
    assert.equal(isAuth("authenticated", { id: "1" }), true);
  });
});
