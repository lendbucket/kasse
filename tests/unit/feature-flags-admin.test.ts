import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createFlag, updateFlag, setFlagOverride } from "@/lib/feature-flags/admin";

// In-memory store that simulates Prisma tx for testing admin functions.
function makeMockTx() {
  const flags = new Map<string, any>();
  const audits: any[] = [];
  let idCounter = 0;

  return {
    _flags: flags,
    _audits: audits,
    featureFlag: {
      create: async ({ data }: any) => {
        const id = `flag-${++idCounter}`;
        const record = { id, ...data };
        flags.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        if (where.id) return flags.get(where.id) ?? null;
        if (where.key) {
          for (const f of flags.values()) {
            if (f.key === where.key) return f;
          }
        }
        return null;
      },
      update: async ({ where, data }: any) => {
        const existing = flags.get(where.id);
        if (!existing) throw new Error("not found");
        const updated = { ...existing, ...data };
        flags.set(where.id, updated);
        return updated;
      },
    },
    featureFlagAudit: {
      create: async ({ data }: any) => {
        const id = `audit-${++idCounter}`;
        const record = { id, ...data };
        audits.push(record);
        return record;
      },
    },
  } as any;
}

describe("createFlag (P0.H.2)", () => {
  it("throws on invalid key", async () => {
    const tx = makeMockTx();
    await assert.rejects(
      () => createFlag(tx, {
        key: "INVALID_KEY!!",
        description: "test",
        defaultValue: false,
        rolloutPct: 0,
        overrides: {},
        isActive: true,
        actorUserId: "user-1",
      }),
      /Invalid flag key/,
    );
  });

  it("throws on rolloutPct < 0", async () => {
    const tx = makeMockTx();
    await assert.rejects(
      () => createFlag(tx, {
        key: "valid-key",
        description: "test",
        defaultValue: false,
        rolloutPct: -1,
        overrides: {},
        isActive: true,
        actorUserId: "user-1",
      }),
      /rolloutPct must be integer 0-100/,
    );
  });

  it("throws on rolloutPct > 100", async () => {
    const tx = makeMockTx();
    await assert.rejects(
      () => createFlag(tx, {
        key: "valid-key",
        description: "test",
        defaultValue: false,
        rolloutPct: 101,
        overrides: {},
        isActive: true,
        actorUserId: "user-1",
      }),
      /rolloutPct must be integer 0-100/,
    );
  });

  it("creates flag + audit entry", async () => {
    const tx = makeMockTx();
    const result = await createFlag(tx, {
      key: "new-feature",
      description: "A new feature",
      defaultValue: false,
      rolloutPct: 25,
      overrides: {},
      isActive: true,
      actorUserId: "user-1",
    });
    assert.ok(result.flagId);
    assert.equal(tx._flags.size, 1);
    assert.equal(tx._audits.length, 1);
    assert.equal(tx._audits[0].changeType, "CREATE");
  });
});

describe("updateFlag (P0.H.2)", () => {
  it("captures before/after in audit", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "update-test",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: {},
      isActive: true,
      actorUserId: "user-1",
    });

    await updateFlag(tx, {
      flagId,
      changes: { defaultValue: true },
      reason: "enabling by default",
      actorUserId: "user-1",
    });

    assert.equal(tx._audits.length, 2); // CREATE + UPDATE
    const updateAudit = tx._audits[1];
    assert.equal(updateAudit.changeType, "UPDATE_DEFAULT");
    assert.ok(updateAudit.before);
    assert.ok(updateAudit.after);
    assert.equal(updateAudit.reason, "enabling by default");
  });

  it("determines correct changeType for rollout changes", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "rollout-test",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: {},
      isActive: true,
      actorUserId: "user-1",
    });

    await updateFlag(tx, {
      flagId,
      changes: { rolloutPct: 50 },
      reason: null,
      actorUserId: "user-1",
    });

    assert.equal(tx._audits[1].changeType, "UPDATE_ROLLOUT");
  });

  it("determines correct changeType for isActive toggle", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "toggle-test",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: {},
      isActive: true,
      actorUserId: "user-1",
    });

    await updateFlag(tx, {
      flagId,
      changes: { isActive: false },
      reason: null,
      actorUserId: "user-1",
    });

    assert.equal(tx._audits[1].changeType, "TOGGLE_ACTIVE");
  });

  it("determines correct changeType for description-only change", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "desc-test",
      description: "old description",
      defaultValue: false,
      rolloutPct: 0,
      overrides: {},
      isActive: true,
      actorUserId: "user-1",
    });

    await updateFlag(tx, {
      flagId,
      changes: { description: "new description" },
      reason: null,
      actorUserId: "user-1",
    });

    assert.equal(tx._audits[1].changeType, "UPDATE_DESCRIPTION");
  });

  it("uses UPDATE catch-all for multi-field changes", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "multi-test",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: {},
      isActive: true,
      actorUserId: "user-1",
    });

    await updateFlag(tx, {
      flagId,
      changes: { defaultValue: true, rolloutPct: 50 },
      reason: "changing both at once",
      actorUserId: "user-1",
    });

    assert.equal(tx._audits[1].changeType, "UPDATE");
  });
});

describe("setFlagOverride (P0.H.2)", () => {
  it("adds new override", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "override-test",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: {},
      isActive: true,
      actorUserId: "user-1",
    });

    await setFlagOverride(tx, {
      flagId,
      organizationId: "org-abc",
      value: true,
      reason: "testing for org-abc",
      actorUserId: "user-1",
    });

    const flag = tx._flags.get(flagId);
    assert.equal(flag.overrides["org-abc"], true);
  });

  it("updates existing override", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "override-update",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: { "org-abc": true },
      isActive: true,
      actorUserId: "user-1",
    });

    await setFlagOverride(tx, {
      flagId,
      organizationId: "org-abc",
      value: false,
      reason: null,
      actorUserId: "user-1",
    });

    const flag = tx._flags.get(flagId);
    assert.equal(flag.overrides["org-abc"], false);
  });

  it("removes override when value=null", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "override-remove",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: { "org-abc": true },
      isActive: true,
      actorUserId: "user-1",
    });

    await setFlagOverride(tx, {
      flagId,
      organizationId: "org-abc",
      value: null,
      reason: "removing override",
      actorUserId: "user-1",
    });

    const flag = tx._flags.get(flagId);
    assert.equal(Object.prototype.hasOwnProperty.call(flag.overrides, "org-abc"), false);
  });

  it("writes audit with before/after overrides JSON", async () => {
    const tx = makeMockTx();
    const { flagId } = await createFlag(tx, {
      key: "audit-override",
      description: "test",
      defaultValue: false,
      rolloutPct: 0,
      overrides: { "org-existing": true },
      isActive: true,
      actorUserId: "user-1",
    });

    await setFlagOverride(tx, {
      flagId,
      organizationId: "org-new",
      value: true,
      reason: null,
      actorUserId: "user-1",
    });

    const auditEntry = tx._audits[tx._audits.length - 1];
    assert.equal(auditEntry.changeType, "UPDATE_OVERRIDE");
    assert.deepEqual(auditEntry.before, { overrides: { "org-existing": true } });
    assert.equal(auditEntry.after.overrides["org-new"], true);
    assert.equal(auditEntry.after.overrides["org-existing"], true);
  });
});
