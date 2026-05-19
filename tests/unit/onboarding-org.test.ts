import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateOrgName } from "@/lib/onboarding/org";
import { V1_LAUNCH_PLAN_TIERS } from "@/lib/onboarding/types";

describe("validateOrgName (P1.A.3)", () => {
  it("rejects empty string", () => {
    const result = validateOrgName("");
    assert.ok(result !== null);
  });

  it("rejects single character", () => {
    const result = validateOrgName("A");
    assert.ok(result !== null);
    assert.ok(result!.includes("2"));
  });

  it("rejects string over 100 characters", () => {
    const result = validateOrgName("a".repeat(101));
    assert.ok(result !== null);
    assert.ok(result!.includes("100"));
  });

  it("accepts 2-character name", () => {
    assert.equal(validateOrgName("AB"), null);
  });

  it("accepts 100-character name", () => {
    assert.equal(validateOrgName("a".repeat(100)), null);
  });

  it("accepts typical salon name", () => {
    assert.equal(validateOrgName("Bella's Hair Studio"), null);
  });

  it("trims whitespace before validating", () => {
    assert.equal(validateOrgName("  AB  "), null);
  });

  it("rejects whitespace-only string (trimmed to empty)", () => {
    assert.ok(validateOrgName("   ") !== null);
  });
});

describe("V1 launch plan tiers (P1.A.3)", () => {
  it("includes FREE and PREMIUM", () => {
    assert.ok(V1_LAUNCH_PLAN_TIERS.includes("FREE"));
    assert.ok(V1_LAUNCH_PLAN_TIERS.includes("PREMIUM"));
  });

  it("has exactly 2 tiers", () => {
    assert.equal(V1_LAUNCH_PLAN_TIERS.length, 2);
  });

  it("does not include ENTERPRISE (concierge path per SD-K-019)", () => {
    assert.ok(!(V1_LAUNCH_PLAN_TIERS as readonly string[]).includes("ENTERPRISE"));
  });

  it("does not include PLUS", () => {
    assert.ok(!(V1_LAUNCH_PLAN_TIERS as readonly string[]).includes("PLUS"));
  });
});
