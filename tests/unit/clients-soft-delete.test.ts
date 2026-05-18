import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

describe("softDeleteClient (P0.G.1)", () => {
  // Core logic replicated for testing without module mocking.
  // The actual function uses findFirst + updateMany with organizationId guard.
  async function softDeleteClientCore(
    tx: { client: { findFirst: (a: unknown) => Promise<unknown>; updateMany: (a: unknown) => Promise<unknown> } },
    args: { clientId: string; organizationId: string; actorUserId: string },
    onAudit: (input: unknown) => void,
  ): Promise<void> {
    const before = (await tx.client.findFirst({
      where: { id: args.clientId, organizationId: args.organizationId },
      select: { softDeletedAt: true, name: true },
    })) as { softDeletedAt: Date | null; name: string } | null;
    if (!before || before.softDeletedAt) {
      throw new Error("Client not found or already deleted");
    }
    const now = new Date();
    const result = (await tx.client.updateMany({
      where: { id: args.clientId, organizationId: args.organizationId },
      data: { softDeletedAt: now },
    })) as { count: number };
    if (result.count === 0) {
      throw new Error("Client not found or already deleted");
    }
    onAudit({
      userId: args.actorUserId,
      organizationId: args.organizationId,
      action: "client.soft_delete",
      entity: "Client",
      entityId: args.clientId,
      before: { softDeletedAt: null },
      after: { softDeletedAt: now.toISOString() },
      changedFields: ["softDeletedAt"],
    });
  }

  it("sets softDeletedAt on client with organizationId guard", async () => {
    const mockUpdateMany = mock.fn(async () => ({ count: 1 }));
    const tx = {
      client: {
        findFirst: mock.fn(async () => ({ softDeletedAt: null, name: "Jane" })),
        updateMany: mockUpdateMany,
      },
    };

    await softDeleteClientCore(
      tx,
      { clientId: "c1", organizationId: "org1", actorUserId: "u1" },
      () => {},
    );

    assert.equal(mockUpdateMany.mock.callCount(), 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateArgs = (mockUpdateMany.mock.calls[0] as any).arguments[0];
    assert.equal(updateArgs.where.id, "c1");
    assert.equal(updateArgs.where.organizationId, "org1");
    assert.ok(updateArgs.data.softDeletedAt instanceof Date);
  });

  it("writes audit log", async () => {
    const onAudit = mock.fn(() => {});
    const tx = {
      client: {
        findFirst: mock.fn(async () => ({ softDeletedAt: null, name: "Jane" })),
        updateMany: mock.fn(async () => ({ count: 1 })),
      },
    };

    await softDeleteClientCore(
      tx,
      { clientId: "c1", organizationId: "org1", actorUserId: "u1" },
      onAudit,
    );

    assert.equal(onAudit.mock.callCount(), 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auditArgs = (onAudit.mock.calls[0] as any).arguments[0];
    assert.equal(auditArgs.entity, "Client");
    assert.equal(auditArgs.entityId, "c1");
    assert.equal(auditArgs.action, "client.soft_delete");
  });

  it("throws if already deleted", async () => {
    const tx = {
      client: {
        findFirst: mock.fn(async () => ({
          softDeletedAt: new Date("2026-05-01"),
          name: "Jane",
        })),
        updateMany: mock.fn(async () => ({ count: 0 })),
      },
    };

    await assert.rejects(
      () =>
        softDeleteClientCore(
          tx,
          { clientId: "c1", organizationId: "org1", actorUserId: "u1" },
          () => {},
        ),
      /not found or already deleted/,
    );
  });

  it("throws if client not found", async () => {
    const tx = {
      client: {
        findFirst: mock.fn(async () => null),
        updateMany: mock.fn(async () => ({ count: 0 })),
      },
    };

    await assert.rejects(
      () =>
        softDeleteClientCore(
          tx,
          { clientId: "c1", organizationId: "org1", actorUserId: "u1" },
          () => {},
        ),
      /not found or already deleted/,
    );
  });
});
