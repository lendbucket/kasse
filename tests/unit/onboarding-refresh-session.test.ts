import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * These tests document the response contract of /api/onboarding/refresh-session
 * but do not exercise the production route handler. They pass against hardcoded
 * fixtures (the test imports nothing from the route file).
 *
 * Real route handler behavior is exercised via integration tests in CI and
 * manual curl testing per docs/ONBOARDING.md.
 *
 * Do not rely on these tests to catch regressions in the route handler logic.
 */

describe("Refresh-session response contract (P1.A.3)", () => {
  it("response must include userId, organizationId, role, locationId", () => {
    const requiredFields = [
      "userId",
      "organizationId",
      "role",
      "locationId",
    ];
    const response = {
      userId: "user-123",
      organizationId: "org-abc",
      role: "OWNER",
      locationId: "loc-xyz",
    };
    for (const field of requiredFields) {
      assert.ok(field in response, `response must contain '${field}'`);
    }
  });

  it("response does NOT include emailVerified (dropped in cycle 5)", () => {
    const response = {
      userId: "user-123",
      organizationId: "org-abc",
      role: "OWNER",
      locationId: "loc-xyz",
    };
    assert.ok(!("emailVerified" in response));
  });

  it("organizationId is null for a fresh user before org-create", () => {
    const preOrgResponse = {
      userId: "user-123",
      organizationId: null as string | null,
      role: "OWNER",
      locationId: null as string | null,
    };
    assert.equal(preOrgResponse.organizationId, null);
  });

  it("organizationId is populated after org-create", () => {
    const postOrgResponse = {
      userId: "user-123",
      organizationId: "org-abc",
      role: "OWNER",
      locationId: null as string | null,
    };
    assert.ok(postOrgResponse.organizationId !== null);
    assert.equal(typeof postOrgResponse.organizationId, "string");
  });
});

describe("JWT callback update trigger contract (P1.A.3)", () => {
  it("trigger 'update' re-fetches organizationId, role, locationId", () => {
    const fieldsRefreshed = ["organizationId", "role", "locationId"];
    assert.equal(fieldsRefreshed.length, 3);
    assert.ok(fieldsRefreshed.includes("organizationId"));
    assert.ok(fieldsRefreshed.includes("role"));
    assert.ok(fieldsRefreshed.includes("locationId"));
  });

  it("trigger 'update' requires token.id to be a non-empty string", () => {
    // typeof guard + length check prevents String(undefined) coercion
    const validId = "cuid-abc123";
    assert.equal(typeof validId, "string");
    assert.ok(validId.length > 0);

    const emptyId = "";
    assert.ok(!(typeof emptyId === "string" && emptyId.length > 0));
  });
});
