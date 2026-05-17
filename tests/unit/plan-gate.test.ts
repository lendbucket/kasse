import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tierMeetsMinimum } from "@/components/plan/PlanGate";

describe("tierMeetsMinimum (P0.D.2)", () => {
  it("(a) FREE meets FREE", () => {
    assert.equal(tierMeetsMinimum('FREE', 'FREE'), true);
  });
  it("(b) FREE does NOT meet PLUS", () => {
    assert.equal(tierMeetsMinimum('FREE', 'PLUS'), false);
  });
  it("(c) PLUS meets FREE (higher tier sees lower content)", () => {
    assert.equal(tierMeetsMinimum('PLUS', 'FREE'), true);
  });
  it("(d) PLUS meets PLUS", () => {
    assert.equal(tierMeetsMinimum('PLUS', 'PLUS'), true);
  });
  it("(e) PLUS does NOT meet PREMIUM", () => {
    assert.equal(tierMeetsMinimum('PLUS', 'PREMIUM'), false);
  });
  it("(f) PREMIUM meets PLUS", () => {
    assert.equal(tierMeetsMinimum('PREMIUM', 'PLUS'), true);
  });
  it("(g) ENTERPRISE meets everything", () => {
    assert.equal(tierMeetsMinimum('ENTERPRISE', 'FREE'), true);
    assert.equal(tierMeetsMinimum('ENTERPRISE', 'PLUS'), true);
    assert.equal(tierMeetsMinimum('ENTERPRISE', 'PREMIUM'), true);
    assert.equal(tierMeetsMinimum('ENTERPRISE', 'ENTERPRISE'), true);
  });
  it("(h) ENTERPRISE not met by FREE/PLUS/PREMIUM", () => {
    assert.equal(tierMeetsMinimum('FREE', 'ENTERPRISE'), false);
    assert.equal(tierMeetsMinimum('PLUS', 'ENTERPRISE'), false);
    assert.equal(tierMeetsMinimum('PREMIUM', 'ENTERPRISE'), false);
  });
});
