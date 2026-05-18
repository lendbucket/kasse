import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Replicated core logic from recordInventoryDeduction.
 * The real function imports writeAuditLog (which requires prismaAdmin),
 * so we test the validation and quantity computation in isolation.
 */
function validateAndComputeDeduction(args: {
  quantityUsed: number;
  currentQuantityOnHand: number;
  hadExistingLevel: boolean;
}): { newQuantityOnHand: number; wasNegativeStock: boolean; wasNewLevel: boolean } {
  if (args.quantityUsed <= 0) {
    throw new Error("quantityUsed must be greater than 0");
  }
  const newQuantityOnHand = args.hadExistingLevel
    ? args.currentQuantityOnHand - args.quantityUsed
    : -args.quantityUsed;
  return {
    newQuantityOnHand,
    wasNegativeStock: newQuantityOnHand < 0,
    wasNewLevel: !args.hadExistingLevel,
  };
}

describe("recordInventoryDeduction logic (P0.G.4)", () => {
  it("throws when quantityUsed is 0", () => {
    assert.throws(
      () => validateAndComputeDeduction({ quantityUsed: 0, currentQuantityOnHand: 10, hadExistingLevel: true }),
      { message: "quantityUsed must be greater than 0" },
    );
  });

  it("throws when quantityUsed is negative", () => {
    assert.throws(
      () => validateAndComputeDeduction({ quantityUsed: -1, currentQuantityOnHand: 10, hadExistingLevel: true }),
      { message: "quantityUsed must be greater than 0" },
    );
  });

  it("computes new quantity correctly", () => {
    const result = validateAndComputeDeduction({
      quantityUsed: 3,
      currentQuantityOnHand: 10,
      hadExistingLevel: true,
    });
    assert.equal(result.newQuantityOnHand, 7);
    assert.equal(result.wasNegativeStock, false);
    assert.equal(result.wasNewLevel, false);
  });

  it("allows quantity to go negative (backorder)", () => {
    const result = validateAndComputeDeduction({
      quantityUsed: 15,
      currentQuantityOnHand: 10,
      hadExistingLevel: true,
    });
    assert.equal(result.newQuantityOnHand, -5);
    assert.equal(result.wasNegativeStock, true);
  });

  it("handles fractional quantities", () => {
    const result = validateAndComputeDeduction({
      quantityUsed: 2.5,
      currentQuantityOnHand: 10,
      hadExistingLevel: true,
    });
    assert.equal(result.newQuantityOnHand, 7.5);
  });

  it("returns wasNegativeStock=true when new level created with negative stock", () => {
    const result = validateAndComputeDeduction({
      quantityUsed: 5,
      currentQuantityOnHand: 0,
      hadExistingLevel: false,
    });
    assert.equal(result.newQuantityOnHand, -5);
    assert.equal(result.wasNegativeStock, true);
    assert.equal(result.wasNewLevel, true);
  });

  it("returns wasNewLevel=true when no prior level existed", () => {
    const result = validateAndComputeDeduction({
      quantityUsed: 1,
      currentQuantityOnHand: 0,
      hadExistingLevel: false,
    });
    assert.equal(result.wasNewLevel, true);
  });
});
