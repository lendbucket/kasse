import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  getClientFormulaHistory,
  nextFormulaVersionForClient,
} from "@/lib/formulas/history";

describe("getClientFormulaHistory (P0.G.1)", () => {
  it("returns formulas ordered newest first", async () => {
    const formulas = [
      {
        id: "f2",
        clientId: "c1",
        appointmentId: null,
        staffId: "s1",
        formulaVersion: 2,
        formulaIngredients: [{ productName: "Wella Koleston", brand: "Wella", quantityOz: 2, quantityGrams: null, developerVolume: 20, productId: null, notes: null }],
        processingMinutes: 35,
        resultNotes: "Good coverage",
        beforePhotoUrl: null,
        afterPhotoUrl: null,
        allergyChecked: true,
        createdAt: new Date("2026-05-18"),
        updatedAt: new Date("2026-05-18"),
      },
      {
        id: "f1",
        clientId: "c1",
        appointmentId: "a1",
        staffId: "s1",
        formulaVersion: 1,
        formulaIngredients: [{ productName: "Redken", brand: "Redken", quantityOz: 1.5, quantityGrams: null, developerVolume: 30, productId: null, notes: null }],
        processingMinutes: 30,
        resultNotes: null,
        beforePhotoUrl: null,
        afterPhotoUrl: null,
        allergyChecked: false,
        createdAt: new Date("2026-05-10"),
        updatedAt: new Date("2026-05-10"),
      },
    ];

    const tx = {
      colorFormula: {
        findMany: mock.fn(async () => formulas),
      },
    } as unknown as Parameters<typeof getClientFormulaHistory>[0];

    const result = await getClientFormulaHistory(tx, { clientId: "c1", organizationId: "org1" });
    assert.equal(result.length, 2);
    assert.equal(result[0].formulaVersion, 2);
    assert.equal(result[1].formulaVersion, 1);
    assert.equal(result[0].formulaIngredients[0].productName, "Wella Koleston");
  });

  it("respects custom limit", async () => {
    const tx = {
      colorFormula: {
        findMany: mock.fn(async (args: { take: number }) => {
          assert.equal(args.take, 5);
          return [];
        }),
      },
    } as unknown as Parameters<typeof getClientFormulaHistory>[0];

    await getClientFormulaHistory(tx, { clientId: "c1", organizationId: "org1", limit: 5 });
  });

  it("default limit is 50", async () => {
    const tx = {
      colorFormula: {
        findMany: mock.fn(async (args: { take: number }) => {
          assert.equal(args.take, 50);
          return [];
        }),
      },
    } as unknown as Parameters<typeof getClientFormulaHistory>[0];

    await getClientFormulaHistory(tx, { clientId: "c1", organizationId: "org1" });
  });
});

describe("nextFormulaVersionForClient (P0.G.1)", () => {
  it("returns 1 for first formula", async () => {
    const tx = {
      colorFormula: {
        findFirst: mock.fn(async () => null),
      },
    } as unknown as Parameters<typeof nextFormulaVersionForClient>[0];

    const version = await nextFormulaVersionForClient(tx, { clientId: "c1", organizationId: "org1" });
    assert.equal(version, 1);
  });

  it("returns N+1 after N formulas", async () => {
    const tx = {
      colorFormula: {
        findFirst: mock.fn(async () => ({ formulaVersion: 7 })),
      },
    } as unknown as Parameters<typeof nextFormulaVersionForClient>[0];

    const version = await nextFormulaVersionForClient(tx, { clientId: "c1", organizationId: "org1" });
    assert.equal(version, 8);
  });
});
