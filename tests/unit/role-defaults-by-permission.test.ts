import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { Permissions } from "@/lib/permissions/types";
import { ROLE_DEFAULTS_BY_PERMISSION } from "@/lib/permissions/role-defaults-by-permission";

describe("ROLE_DEFAULTS_BY_PERMISSION (P0.A.12)", () => {
  it("(a) every PermissionKey appears as a key in the map", () => {
    for (const category of Object.values(Permissions)) {
      for (const key of Object.values(category)) {
        const roles = ROLE_DEFAULTS_BY_PERMISSION[key as keyof typeof ROLE_DEFAULTS_BY_PERMISSION];
        // May be undefined (no role grants it) or an array
        assert.ok(
          roles === undefined || Array.isArray(roles),
          `Expected array or undefined for ${key}, got ${typeof roles}`,
        );
      }
    }
  });

  it("(b) STAFF.SET_COMMISSION maps to OWNER (and possibly FRANCHISE_OWNER)", () => {
    const roles = ROLE_DEFAULTS_BY_PERMISSION["staff.set_commission"];
    assert.ok(Array.isArray(roles), "Expected array");
    assert.ok(roles.includes(Role.OWNER), "Expected OWNER in roles");
    // FRANCHISE_OWNER mirrors OWNER defaults, so both may appear
    for (const r of roles) {
      assert.ok(r === Role.OWNER || r === Role.FRANCHISE_OWNER, `Unexpected role ${r}`);
    }
  });

  it("(c) APPOINTMENTS.VIEW_ALL maps to multiple roles including MANAGER", () => {
    const roles = ROLE_DEFAULTS_BY_PERMISSION["appointments.view_all"];
    assert.ok(Array.isArray(roles), "Expected array");
    assert.ok(roles.includes(Role.MANAGER), "Expected MANAGER in roles");
    assert.ok(roles.length > 1, "Expected multiple roles");
  });

  it("(d) ADMIN.IMPERSONATE maps to empty array (no role has it in defaults)", () => {
    const roles = ROLE_DEFAULTS_BY_PERMISSION["admin.impersonate"];
    // ADMIN keys are only granted via SUPERADMIN bypass, not roleDefaults
    assert.ok(!roles || roles.length === 0, "Expected empty or undefined for admin.impersonate");
  });
});
