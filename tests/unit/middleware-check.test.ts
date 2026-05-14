/**
 * P0.A.7: Middleware route-access check tests.
 *
 * Run: npx tsx --test tests/unit/middleware-check.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { checkRouteAccess } from "../../lib/permissions/middleware-check";
import type { PermissionSession } from "../../lib/permissions/check";

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

describe("Middleware route-access check (P0.A.7)", () => {
  it("public route + no session → ok", () => {
    const result = checkRouteAccess("/login", null);
    assert.deepEqual(result, { ok: true });
  });

  it("public route + valid session → ok", () => {
    const result = checkRouteAccess("/login", makeSession(Role.STAFF));
    assert.deepEqual(result, { ok: true });
  });

  it("authenticated route + no session → unauthenticated 401", () => {
    const result = checkRouteAccess("/dashboard", null);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "unauthenticated");
      assert.equal(result.status, 401);
    }
  });

  it("authenticated route + valid session → ok", () => {
    const result = checkRouteAccess("/dashboard", makeSession(Role.STAFF));
    assert.deepEqual(result, { ok: true });
  });

  it("role route (SUPERADMIN) + STAFF session → forbidden 403", () => {
    const result = checkRouteAccess("/admin", makeSession(Role.STAFF));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "forbidden");
      assert.equal(result.status, 403);
    }
  });

  it("role route (SUPERADMIN) + SUPERADMIN session → ok", () => {
    const result = checkRouteAccess("/admin", makeSession(Role.SUPERADMIN));
    assert.deepEqual(result, { ok: true });
  });

  it("permission route + role lacking permission → forbidden 403", () => {
    // CLIENT has no permissions in roleDefaults
    const result = checkRouteAccess("/dashboard/staff", makeSession(Role.CLIENT));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "forbidden");
      assert.equal(result.status, 403);
    }
  });

  it("permission route + role with permission → ok", () => {
    // OWNER has STAFF.VIEW_LIST
    const result = checkRouteAccess("/dashboard/staff", makeSession(Role.OWNER));
    assert.deepEqual(result, { ok: true });
  });

  it("SUPERADMIN bypass: permission route + SUPERADMIN session → ok", () => {
    const result = checkRouteAccess("/dashboard/payroll", makeSession(Role.SUPERADMIN));
    assert.deepEqual(result, { ok: true });
  });

  it("unmapped route + valid session → forbidden 403 (default-deny)", () => {
    const result = checkRouteAccess("/some/unknown/path", makeSession(Role.OWNER));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "forbidden");
      assert.equal(result.status, 403);
    }
  });

  it("nested route prefix match: /dashboard/settings/general uses /dashboard/settings guard", () => {
    // STAFF_VIEW_ONLY does NOT have SETTINGS.VIEW_GENERAL
    const result = checkRouteAccess("/dashboard/settings/general", makeSession(Role.STAFF_VIEW_ONLY));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "forbidden");
      assert.equal(result.status, 403);
    }

    // OWNER has SETTINGS.VIEW_GENERAL
    const ownerResult = checkRouteAccess("/dashboard/settings/general", makeSession(Role.OWNER));
    assert.deepEqual(ownerResult, { ok: true });
  });
});
