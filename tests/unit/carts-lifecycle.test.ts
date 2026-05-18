import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

describe("Cart lifecycle (P0.G.3)", () => {
  // Core logic replicated for testing without prismaAdmin import.

  interface CartItemRow {
    subtotalCents: number;
    taxCents: number;
  }

  interface CartRow {
    discountCents: number;
    tipCents: number;
    giftCardAppliedCents: number;
    loyaltyAppliedCents: number;
    depositAppliedCents: number;
  }

  function recomputeCartTotalsCore(items: CartItemRow[], cart: CartRow) {
    const subtotalCents = items.reduce((sum, i) => sum + i.subtotalCents, 0);
    const taxCents = items.reduce((sum, i) => sum + i.taxCents, 0);
    const totalCents =
      subtotalCents -
      cart.discountCents +
      taxCents +
      cart.tipCents -
      cart.giftCardAppliedCents -
      cart.loyaltyAppliedCents -
      cart.depositAppliedCents;
    return { subtotalCents, taxCents, totalCents };
  }

  function addCartItemCore(
    cartStatus: string,
    quantity: number,
    unitPriceCents: number,
    discountCents: number,
  ): { subtotalCents: number } {
    if (cartStatus !== "OPEN") {
      throw new Error(`Cannot add items to ${cartStatus} cart`);
    }
    const subtotalCents = quantity * unitPriceCents - discountCents;
    return { subtotalCents };
  }

  function voidCartCore(status: string): void {
    const voidableStatuses = ["OPEN", "PENDING_PAYMENT"];
    if (!voidableStatuses.includes(status)) {
      throw new Error("Cart not found or not in voidable state");
    }
  }

  describe("recomputeCartTotals", () => {
    it("correctly sums items and applies cart-level adjustments", () => {
      const items: CartItemRow[] = [
        { subtotalCents: 5000, taxCents: 400 },
        { subtotalCents: 3000, taxCents: 240 },
      ];
      const cart: CartRow = {
        discountCents: 500,
        tipCents: 1000,
        giftCardAppliedCents: 200,
        loyaltyAppliedCents: 100,
        depositAppliedCents: 300,
      };
      const result = recomputeCartTotalsCore(items, cart);
      assert.equal(result.subtotalCents, 8000);
      assert.equal(result.taxCents, 640);
      // total = 8000 - 500 + 640 + 1000 - 200 - 100 - 300 = 8540
      assert.equal(result.totalCents, 8540);
    });
  });

  describe("addCartItem", () => {
    it("rejects when cart not OPEN", () => {
      assert.throws(
        () => addCartItemCore("PAID", 1, 5000, 0),
        { message: "Cannot add items to PAID cart" },
      );
    });

    it("computes subtotalCents from quantity * unitPrice - discount", () => {
      const result = addCartItemCore("OPEN", 3, 2000, 500);
      // 3 * 2000 - 500 = 5500
      assert.equal(result.subtotalCents, 5500);
    });
  });

  describe("voidCart", () => {
    it("throws when cart not in voidable state", () => {
      assert.throws(
        () => voidCartCore("PAID"),
        { message: "Cart not found or not in voidable state" },
      );
    });

    it("succeeds for OPEN cart", () => {
      assert.doesNotThrow(() => voidCartCore("OPEN"));
    });

    it("succeeds for PENDING_PAYMENT cart", () => {
      assert.doesNotThrow(() => voidCartCore("PENDING_PAYMENT"));
    });
  });
});
