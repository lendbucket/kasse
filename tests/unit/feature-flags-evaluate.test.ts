import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { evaluateFlag, evaluateFlags } from "@/lib/feature-flags/evaluate";

// Minimal mock tx that returns flags from an in-memory map.
function makeMockTx(flagsByKey: Map<string, {
  key: string; defaultValue: boolean; rolloutPct: number;
  overrides: Record<string, boolean>; isActive: boolean;
}>) {
  return {
    featureFlag: {
      findUnique: async ({ where }: { where: { key: string } }) => {
        return flagsByKey.get(where.key) ?? null;
      },
      findMany: async ({ where }: { where: { key: { in: string[] } } }) => {
        return where.key.in
          .map((k: string) => flagsByKey.get(k))
          .filter(Boolean);
      },
    },
  } as any;
}

describe("evaluateFlag (P0.H.2)", () => {
  it("returns MISSING when flag not in DB", async () => {
    const tx = makeMockTx(new Map());
    const result = await evaluateFlag(tx, {
      key: "nonexistent",
      context: { organizationId: "org-1", userId: "user-1" },
    });
    assert.equal(result.source, "MISSING");
    assert.equal(result.enabled, false);
  });

  it("returns INACTIVE when flag.isActive=false (returns defaultValue)", async () => {
    const tx = makeMockTx(new Map([
      ["my-flag", { key: "my-flag", defaultValue: true, rolloutPct: 100, overrides: {}, isActive: false }],
    ]));
    const result = await evaluateFlag(tx, {
      key: "my-flag",
      context: { organizationId: "org-1", userId: "user-1" },
    });
    assert.equal(result.source, "INACTIVE");
    assert.equal(result.enabled, true); // defaultValue is true
  });

  it("returns OVERRIDE when per-org override exists", async () => {
    const tx = makeMockTx(new Map([
      ["my-flag", { key: "my-flag", defaultValue: false, rolloutPct: 0, overrides: { "org-1": true }, isActive: true }],
    ]));
    const result = await evaluateFlag(tx, {
      key: "my-flag",
      context: { organizationId: "org-1", userId: "user-1" },
    });
    assert.equal(result.source, "OVERRIDE");
    assert.equal(result.enabled, true);
  });

  it("returns ROLLOUT when bucket < rolloutPct", async () => {
    // rolloutPct=100 means all orgs get it
    const tx = makeMockTx(new Map([
      ["my-flag", { key: "my-flag", defaultValue: false, rolloutPct: 100, overrides: {}, isActive: true }],
    ]));
    const result = await evaluateFlag(tx, {
      key: "my-flag",
      context: { organizationId: "org-1", userId: "user-1" },
    });
    assert.equal(result.source, "ROLLOUT");
    assert.equal(result.enabled, true);
  });

  it("returns DEFAULT when no override + bucket >= rolloutPct", async () => {
    // rolloutPct=0 means no orgs get it through rollout
    const tx = makeMockTx(new Map([
      ["my-flag", { key: "my-flag", defaultValue: false, rolloutPct: 0, overrides: {}, isActive: true }],
    ]));
    const result = await evaluateFlag(tx, {
      key: "my-flag",
      context: { organizationId: "org-1", userId: "user-1" },
    });
    assert.equal(result.source, "DEFAULT");
    assert.equal(result.enabled, false);
  });

  it("returns DEFAULT for null organizationId (override not applicable)", async () => {
    const tx = makeMockTx(new Map([
      ["my-flag", { key: "my-flag", defaultValue: true, rolloutPct: 50, overrides: {}, isActive: true }],
    ]));
    const result = await evaluateFlag(tx, {
      key: "my-flag",
      context: { organizationId: null, userId: "user-1" },
    });
    assert.equal(result.source, "DEFAULT");
    assert.equal(result.enabled, true);
  });
});

describe("evaluateFlags (P0.H.2)", () => {
  it("handles empty keys array", async () => {
    const tx = makeMockTx(new Map());
    const results = await evaluateFlags(tx, {
      keys: [],
      context: { organizationId: "org-1", userId: "user-1" },
    });
    assert.deepEqual(results, {});
  });

  it("returns one entry per key, even if some are MISSING", async () => {
    const tx = makeMockTx(new Map([
      ["exists", { key: "exists", defaultValue: true, rolloutPct: 0, overrides: {}, isActive: true }],
    ]));
    const results = await evaluateFlags(tx, {
      keys: ["exists", "missing-flag"],
      context: { organizationId: "org-1", userId: "user-1" },
    });
    assert.equal(Object.keys(results).length, 2);
    assert.equal(results["exists"].source, "DEFAULT");
    assert.equal(results["exists"].enabled, true);
    assert.equal(results["missing-flag"].source, "MISSING");
    assert.equal(results["missing-flag"].enabled, false);
  });
});
