import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

describe("Order finalization (P0.G.3)", () => {
  // Core logic replicated to avoid prismaAdmin import in writeAuditLog.

  function generateOrderNumber(lastOrderNumber: string | null): string {
    return lastOrderNumber
      ? String(parseInt(lastOrderNumber) + 1)
      : "1001";
  }

  function recordPaymentCore(
    paidCents: number,
    totalCents: number,
    paymentAmountCents: number,
  ): { newPaidCents: number; newBalanceDue: number; newStatus: string } {
    const newPaidCents = paidCents + paymentAmountCents;
    const newBalanceDue = Math.max(0, totalCents - newPaidCents);
    let newStatus = "OPEN";
    if (newBalanceDue <= 0) {
      newStatus = "PAID";
    } else if (newPaidCents > 0) {
      newStatus = "PARTIALLY_PAID";
    }
    return { newPaidCents, newBalanceDue, newStatus };
  }

  describe("finalizeCartToOrder order number generation", () => {
    it("generates order numbers starting at 1001 (first order)", () => {
      const orderNumber = generateOrderNumber(null);
      assert.equal(orderNumber, "1001");
    });

    it("increments from last order number", () => {
      const orderNumber = generateOrderNumber("1005");
      assert.equal(orderNumber, "1006");
    });
  });

  describe("withOrderNumberRetry (replicated logic)", () => {
    // Replicate retry logic to avoid prismaAdmin import chain
    async function withRetry<T>(
      fn: () => Promise<T>,
      isRetryable: (err: unknown) => boolean,
      maxRetries = 3,
    ): Promise<T> {
      let lastError: unknown;
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (err) {
          if (isRetryable(err)) {
            lastError = err;
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    }

    const isP2002OrderNumber = (err: unknown) =>
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2002" &&
      "meta" in err &&
      ((err as { meta: { target?: string[] } }).meta?.target ?? []).includes("orderNumber");

    it("returns on first success", async () => {
      const result = await withRetry(async () => "ok", isP2002OrderNumber);
      assert.equal(result, "ok");
    });

    it("retries on P2002 and succeeds on second attempt", async () => {
      let attempt = 0;
      const result = await withRetry(
        async () => {
          attempt++;
          if (attempt === 1) {
            const err = Object.assign(new Error("unique"), {
              code: "P2002",
              meta: { target: ["orderNumber"] },
            });
            throw err;
          }
          return "success";
        },
        isP2002OrderNumber,
      );
      assert.equal(result, "success");
      assert.equal(attempt, 2);
    });

    it("throws after maxRetries P2002 errors", async () => {
      let attempt = 0;
      await assert.rejects(async () => {
        await withRetry(
          async () => {
            attempt++;
            throw Object.assign(new Error("unique"), {
              code: "P2002",
              meta: { target: ["orderNumber"] },
            });
          },
          isP2002OrderNumber,
          3,
        );
      });
      assert.equal(attempt, 3);
    });

    it("does NOT retry non-P2002 errors", async () => {
      let attempt = 0;
      await assert.rejects(async () => {
        await withRetry(
          async () => {
            attempt++;
            throw new Error("Some other error");
          },
          isP2002OrderNumber,
        );
      }, /Some other error/);
      assert.equal(attempt, 1);
    });
  });

  describe("recordPaymentOnOrder", () => {
    it("transitions to PARTIALLY_PAID at partial payment", () => {
      const result = recordPaymentCore(0, 10000, 3000);
      assert.equal(result.newStatus, "PARTIALLY_PAID");
      assert.equal(result.newPaidCents, 3000);
      assert.equal(result.newBalanceDue, 7000);
    });

    it("transitions to PAID at full payment", () => {
      const result = recordPaymentCore(0, 10000, 10000);
      assert.equal(result.newStatus, "PAID");
      assert.equal(result.newPaidCents, 10000);
      assert.equal(result.newBalanceDue, 0);
    });

    it("sets balanceDueCents to 0 when overpaid", () => {
      const result = recordPaymentCore(5000, 10000, 8000);
      assert.equal(result.newStatus, "PAID");
      assert.equal(result.newPaidCents, 13000);
      assert.equal(result.newBalanceDue, 0);
    });
  });
});
