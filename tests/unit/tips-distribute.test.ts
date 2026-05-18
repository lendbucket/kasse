import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeSplit } from "@/lib/tips/compute";
import type { AppointmentItemForSplit } from "@/lib/tips/types";

describe("computeSplit (P0.G.4)", () => {
  const makeItem = (
    staffId: string,
    opts: Partial<AppointmentItemForSplit> = {},
  ): AppointmentItemForSplit => ({
    staffId,
    durationMinutes: 60,
    revenueCents: 10000,
    isPrimary: false,
    ...opts,
  });

  describe("PRIMARY_ONLY", () => {
    it("gives all tip to the primary staff", () => {
      const items = [
        makeItem("s1", { isPrimary: true }),
        makeItem("s2"),
      ];
      const result = computeSplit("PRIMARY_ONLY", 2000, items);
      const s1 = result.find((r) => r.staffId === "s1")!;
      const s2 = result.find((r) => r.staffId === "s2")!;
      assert.equal(s1.amountCents, 2000);
      assert.equal(s2.amountCents, 0);
    });

    it("falls back to first staff when no primary", () => {
      const items = [makeItem("s1"), makeItem("s2")];
      const result = computeSplit("PRIMARY_ONLY", 1500, items);
      assert.equal(result[0].amountCents, 1500);
      assert.equal(result[1].amountCents, 0);
    });
  });

  describe("TIME_BASED", () => {
    it("splits proportionally by duration", () => {
      const items = [
        makeItem("s1", { durationMinutes: 30 }),
        makeItem("s2", { durationMinutes: 90 }),
      ];
      const result = computeSplit("TIME_BASED", 1200, items);
      const s1 = result.find((r) => r.staffId === "s1")!;
      const s2 = result.find((r) => r.staffId === "s2")!;
      assert.equal(s1.amountCents, 300);
      assert.equal(s2.amountCents, 900);
    });
  });

  describe("REVENUE_RATIO", () => {
    it("splits proportionally by revenue", () => {
      const items = [
        makeItem("s1", { revenueCents: 20000 }),
        makeItem("s2", { revenueCents: 80000 }),
      ];
      const result = computeSplit("REVENUE_RATIO", 1000, items);
      const s1 = result.find((r) => r.staffId === "s1")!;
      const s2 = result.find((r) => r.staffId === "s2")!;
      assert.equal(s1.amountCents, 200);
      assert.equal(s2.amountCents, 800);
    });
  });

  describe("single staff", () => {
    it("gives full tip to the only staff member", () => {
      const items = [makeItem("s1", { isPrimary: true })];
      const result = computeSplit("TIME_BASED", 500, items);
      assert.equal(result.length, 1);
      assert.equal(result[0].amountCents, 500);
    });
  });

  describe("rounding / no leak", () => {
    it("total always equals tipCents with 3 staff (1000 cents)", () => {
      const items = [
        makeItem("s1", { durationMinutes: 33 }),
        makeItem("s2", { durationMinutes: 33 }),
        makeItem("s3", { durationMinutes: 34 }),
      ];
      const result = computeSplit("TIME_BASED", 1000, items);
      const total = result.reduce((s, r) => s + r.amountCents, 0);
      assert.equal(total, 1000, `Expected total 1000, got ${total}`);
    });

    it("total equals tipCents for revenue ratio with 3 staff (1000 cents)", () => {
      const items = [
        makeItem("s1", { revenueCents: 3333 }),
        makeItem("s2", { revenueCents: 3333 }),
        makeItem("s3", { revenueCents: 3334 }),
      ];
      const result = computeSplit("REVENUE_RATIO", 1000, items);
      const total = result.reduce((s, r) => s + r.amountCents, 0);
      assert.equal(total, 1000, `Expected total 1000, got ${total}`);
    });
  });

  describe("EXPLICIT_PERCENT", () => {
    it("throws Error (requires explicit config via distributeTipForAppointment)", () => {
      const items = [makeItem("s1", { isPrimary: true })];
      assert.throws(
        () => computeSplit("EXPLICIT_PERCENT", 1000, items),
        /EXPLICIT_PERCENT split method requires explicit config/,
      );
    });
  });

  describe("remainder allocation", () => {
    it("allocates rounding remainder to highest-weight recipient", () => {
      // s2 has 90min, s1 has 30min -> s2 gets remainder
      const items = [
        makeItem("s1", { durationMinutes: 30 }),
        makeItem("s2", { durationMinutes: 90 }),
      ];
      // 999 cents: s1 gets floor(999*0.25)=249, s2 gets floor(999*0.75)=749, remainder=1 -> s2
      const result = computeSplit("TIME_BASED", 999, items);
      const s2 = result.find((r) => r.staffId === "s2")!;
      assert.equal(s2.amountCents, 750); // 749 + 1 remainder
      const total = result.reduce((s, r) => s + r.amountCents, 0);
      assert.equal(total, 999);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for no items", () => {
      const result = computeSplit("PRIMARY_ONLY", 1000, []);
      assert.equal(result.length, 0);
    });

    it("returns zero amounts for zero tip", () => {
      const items = [makeItem("s1", { isPrimary: true })];
      const result = computeSplit("PRIMARY_ONLY", 0, items);
      assert.equal(result[0].amountCents, 0);
    });
  });
});
