import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { pairCustomerDisplayToChair, getActiveCustomerDisplay } from "@/lib/devices/pairing";

describe("Device pairing (P0.G.3)", () => {
  describe("pairCustomerDisplayToChair", () => {
    it("throws if device role isn't CUSTOMER_DISPLAY", async () => {
      const tx = {
        chair: {
          findFirst: mock.fn(async () => ({ id: "chair-1" })),
        },
        device: {
          findFirst: mock.fn(async () => ({ id: "dev-1", role: "STANDALONE_POS" })),
          update: mock.fn(async () => ({})),
        },
        devicePairing: {
          updateMany: mock.fn(async () => ({ count: 0 })),
          create: mock.fn(async () => ({ id: "pair-1" })),
        },
      } as unknown as Parameters<typeof pairCustomerDisplayToChair>[0];

      await assert.rejects(
        () => pairCustomerDisplayToChair(tx, {
          organizationId: "org-1",
          chairId: "chair-1",
          deviceId: "dev-1",
        }),
        { message: "Device role must be CUSTOMER_DISPLAY, got STANDALONE_POS" },
      );
    });

    it("deactivates existing pairing", async () => {
      const mockUpdateMany = mock.fn(async () => ({ count: 1 }));
      const tx = {
        chair: {
          findFirst: mock.fn(async () => ({ id: "chair-1" })),
        },
        device: {
          findFirst: mock.fn(async () => ({ id: "dev-1", role: "CUSTOMER_DISPLAY" })),
          updateMany: mock.fn(async () => ({ count: 1 })),
        },
        devicePairing: {
          updateMany: mockUpdateMany,
          create: mock.fn(async () => ({ id: "pair-new" })),
        },
      } as unknown as Parameters<typeof pairCustomerDisplayToChair>[0];

      await pairCustomerDisplayToChair(tx, {
        organizationId: "org-1",
        chairId: "chair-1",
        deviceId: "dev-1",
      });

      assert.equal(mockUpdateMany.mock.calls.length, 1);
      const call = (mockUpdateMany.mock.calls[0] as unknown as { arguments: [{ where: { chairId: string; isActive: boolean }; data: { isActive: boolean } }] }).arguments[0];
      assert.equal(call.where.chairId, "chair-1");
      assert.equal(call.where.isActive, true);
      assert.equal(call.data.isActive, false);
    });
  });

  describe("getActiveCustomerDisplay", () => {
    it("returns null when no pairing", async () => {
      const tx = {
        devicePairing: {
          findFirst: mock.fn(async () => null),
        },
        device: {
          findUnique: mock.fn(async () => null),
        },
      } as unknown as Parameters<typeof getActiveCustomerDisplay>[0];

      const result = await getActiveCustomerDisplay(tx, {
        organizationId: "org-1",
        chairId: "chair-1",
      });
      assert.equal(result, null);
    });
  });
});
