import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateTaxCents } from "@/lib/tax/calculate";

describe("calculateTaxCents (P0.G.4)", () => {
  it("returns 0 for 0 subtotal", () => {
    assert.equal(calculateTaxCents({ subtotalCents: 0, ratePercent: 8.25 }), 0);
  });

  it("returns 0 for 0 rate", () => {
    assert.equal(calculateTaxCents({ subtotalCents: 10000, ratePercent: 0 }), 0);
  });

  it("calculates $100 @ 8.25% = 825 cents", () => {
    assert.equal(calculateTaxCents({ subtotalCents: 10000, ratePercent: 8.25 }), 825);
  });

  it("rounds to nearest cent", () => {
    // 999 * 8.25% = 82.4175 → 82
    assert.equal(calculateTaxCents({ subtotalCents: 999, ratePercent: 8.25 }), 82);
  });

  it("rounds 0.5 up (banker's rounding via Math.round)", () => {
    // 1000 * 7.5% = 75.0 → 75
    assert.equal(calculateTaxCents({ subtotalCents: 1000, ratePercent: 7.5 }), 75);
  });

  it("returns 0 for negative subtotal", () => {
    assert.equal(calculateTaxCents({ subtotalCents: -500, ratePercent: 8.25 }), 0);
  });

  it("returns 0 for negative rate", () => {
    assert.equal(calculateTaxCents({ subtotalCents: 10000, ratePercent: -5 }), 0);
  });
});
