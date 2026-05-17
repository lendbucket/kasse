import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLAN_LIMITS,
  getPlanLimits,
  calculateMonthlyCost,
  canAddLocation,
  canAddStaff,
} from "@/lib/plans/limits";

describe("Plan Tier limits (P0.D.1)", () => {
  it("(a) PLAN_LIMITS has entries for all 4 tiers", () => {
    const keys = Object.keys(PLAN_LIMITS).sort();
    assert.deepEqual(keys, ['ENTERPRISE', 'FREE', 'PLUS', 'PREMIUM']);
  });

  it("(b) FREE has maxLocations=1 and $0/mo", () => {
    const free = getPlanLimits('FREE');
    assert.equal(free.maxLocations, 1);
    assert.equal(free.monthlyPriceCentsPerLocation, 0);
  });

  it("(c) PLUS matches Square Plus: unlimited locations, $29/mo per location", () => {
    const plus = getPlanLimits('PLUS');
    assert.equal(plus.maxLocations, null);
    assert.equal(plus.monthlyPriceCentsPerLocation, 2900);
  });

  it("(d) PREMIUM matches Square Premium: unlimited locations, $69/mo per location", () => {
    const premium = getPlanLimits('PREMIUM');
    assert.equal(premium.maxLocations, null);
    assert.equal(premium.monthlyPriceCentsPerLocation, 6900);
  });

  it("(e) ENTERPRISE has null pricing (contract-based)", () => {
    const ent = getPlanLimits('ENTERPRISE');
    assert.equal(ent.monthlyPriceCentsPerLocation, null);
    assert.equal(ent.maxLocations, null);
  });

  it("(f) calculateMonthlyCost: PLUS × 3 locations = $87", () => {
    assert.equal(calculateMonthlyCost('PLUS', 3), 8700);
  });

  it("(g) calculateMonthlyCost: PREMIUM × 5 locations = $345", () => {
    assert.equal(calculateMonthlyCost('PREMIUM', 5), 34500);
  });

  it("(h) calculateMonthlyCost: ENTERPRISE returns null (contract-based)", () => {
    assert.equal(calculateMonthlyCost('ENTERPRISE', 10), null);
  });

  it("(i) calculateMonthlyCost: FREE × 1 = $0", () => {
    assert.equal(calculateMonthlyCost('FREE', 1), 0);
  });

  it("(j) calculateMonthlyCost throws on negative location count", () => {
    assert.throws(() => calculateMonthlyCost('PLUS', -1), /cannot be negative/);
  });

  it("(k) canAddLocation: FREE blocks at 1, PLUS allows unlimited", () => {
    assert.equal(canAddLocation('FREE', 0), true);
    assert.equal(canAddLocation('FREE', 1), false);
    assert.equal(canAddLocation('PLUS', 99), true);
    assert.equal(canAddLocation('PLUS', 999), true);
  });

  it("(l) canAddStaff: all tiers currently allow unlimited (launch policy)", () => {
    assert.equal(canAddStaff('FREE', 0), true);
    assert.equal(canAddStaff('FREE', 999), true);
    assert.equal(canAddStaff('PLUS', 999), true);
    assert.equal(canAddStaff('PREMIUM', 9999), true);
    assert.equal(canAddStaff('ENTERPRISE', 99999), true);
  });
});
