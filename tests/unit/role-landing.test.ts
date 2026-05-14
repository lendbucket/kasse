import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";
import { ROLE_LANDING, getLandingForRole } from "@/lib/permissions/role-landing";

describe("Role landing routes (P0.A.8)", () => {
  it("every Role enum value has a landing route", () => {
    for (const role of Object.values(Role)) {
      assert.ok(ROLE_LANDING[role], `Role ${role} has no landing route`);
    }
  });

  it("SUPERADMIN lands at /admin", () => {
    assert.equal(getLandingForRole(Role.SUPERADMIN), "/admin");
  });

  it("STAFF lands at /dashboard/appointments", () => {
    assert.equal(getLandingForRole(Role.STAFF), "/dashboard/appointments");
  });

  it("OWNER lands at /dashboard", () => {
    assert.equal(getLandingForRole(Role.OWNER), "/dashboard");
  });

  it("ACCOUNTANT lands at /dashboard (financial-specific surface lands later)", () => {
    assert.equal(getLandingForRole(Role.ACCOUNTANT), "/dashboard");
  });

  it("falls back to /dashboard for unknown role values", () => {
    assert.equal(getLandingForRole("FUTURE_ROLE" as Role), "/dashboard");
  });
});
