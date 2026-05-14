/**
 * P0.A.7: Route map tests.
 *
 * Run: npx tsx --test tests/unit/route-map.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRouteGuard, routeMap } from "../../lib/permissions/route-map";
import { Permissions } from "../../lib/permissions/types";

describe("Route map (P0.A.7)", () => {
  it("exact route match wins", () => {
    const guard = getRouteGuard("/login");
    assert.ok(guard);
    assert.equal(guard.type, "public");
  });

  it("longest-prefix match for nested routes", () => {
    // /dashboard/settings/roles is more specific than /dashboard/settings
    const guard = getRouteGuard("/dashboard/settings/roles");
    assert.ok(guard);
    assert.equal(guard.type, "permission");
    if (guard.type === "permission") {
      assert.equal(guard.permission, "settings.edit_roles");
    }

    // /dashboard/settings/general has no exact match — falls back to /dashboard/settings
    const general = getRouteGuard("/dashboard/settings/general");
    assert.ok(general);
    assert.equal(general.type, "permission");
    if (general.type === "permission") {
      assert.equal(general.permission, "settings.view_general");
    }
  });

  it("unmapped route returns null", () => {
    const guard = getRouteGuard("/some/unknown/route");
    assert.equal(guard, null);
  });

  it("public routes correctly identified", () => {
    const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
    for (const route of publicRoutes) {
      const guard = getRouteGuard(route);
      assert.ok(guard, `Expected guard for ${route}`);
      assert.equal(guard.type, "public", `Expected ${route} to be public`);
    }
  });

  it("/api/auth sub-routes match /api/auth prefix (NextAuth)", () => {
    const guard = getRouteGuard("/api/auth/callback/credentials");
    assert.ok(guard);
    assert.equal(guard.type, "public");
  });

  it("routeMap has at least 30 entries (floor — grows as routes are added)", () => {
    const count = Object.keys(routeMap).length;
    assert.ok(
      count >= 30,
      `Expected at least 30 entries in routeMap, got ${count}`,
    );
  });

  it("every permission-gated route maps to a real PermissionKey value", () => {
    // Collect all permission values from the Permissions object
    function collectValues(obj: Record<string, unknown>): Set<string> {
      const values = new Set<string>();
      for (const v of Object.values(obj)) {
        if (typeof v === "string") values.add(v);
        else if (typeof v === "object" && v !== null) {
          for (const s of collectValues(v as Record<string, unknown>)) values.add(s);
        }
      }
      return values;
    }
    const allKeys = collectValues(Permissions);

    for (const [route, guard] of Object.entries(routeMap)) {
      if (guard.type === "permission") {
        assert.ok(
          allKeys.has(guard.permission),
          `Route "${route}" maps to unknown permission "${guard.permission}"`,
        );
      }
    }
  });
});
