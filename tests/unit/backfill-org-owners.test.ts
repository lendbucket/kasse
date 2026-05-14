/**
 * P0.A.2: Backfill org-owners script unit tests.
 *
 * Uses Node's built-in test runner (node --test) with mocked Prisma client.
 * No real database hit.
 *
 * Run: npx tsx --test tests/unit/backfill-org-owners.test.ts
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.2
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";

// ── Mock types matching Prisma shapes ────────────────────────────────────

type MockUser = {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
};

type MockOrg = {
  id: string;
  name: string;
  users: MockUser[];
};

// ── Backfill logic extracted for testability ─────────────────────────────
// This mirrors the logic in scripts/backfill-org-owners.ts without the
// PrismaClient setup, production guard, or disconnect handling.

type BackfillResult = {
  promoted: number;
  skippedHasOwner: number;
  skippedNoUsers: number;
  promotions: Array<{ userId: string; orgId: string }>;
};

async function runBackfill(
  orgs: MockOrg[],
  updateFn: (userId: string, role: Role) => Promise<void>,
): Promise<BackfillResult> {
  let promoted = 0;
  let skippedHasOwner = 0;
  let skippedNoUsers = 0;
  const promotions: Array<{ userId: string; orgId: string }> = [];

  for (const org of orgs) {
    if (org.users.length === 0) {
      skippedNoUsers++;
      continue;
    }

    const hasOwner = org.users.some((u) => u.role === Role.OWNER);
    if (hasOwner) {
      skippedHasOwner++;
      continue;
    }

    // users are pre-sorted by createdAt asc (matching the Prisma query)
    const earliest = org.users[0];
    await updateFn(earliest.id, Role.OWNER);
    promotions.push({ userId: earliest.id, orgId: org.id });
    promoted++;
  }

  return { promoted, skippedHasOwner, skippedNoUsers, promotions };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("backfill-org-owners (P0.A.2)", () => {
  const updates: Array<{ userId: string; role: Role }> = [];
  const mockUpdate = async (userId: string, role: Role) => {
    updates.push({ userId, role });
  };

  beforeEach(() => {
    updates.length = 0;
  });

  it("promotes earliest user to OWNER when org has no owner", async () => {
    const orgs: MockOrg[] = [
      {
        id: "org-1",
        name: "Test Salon",
        users: [
          { id: "u-1", email: "first@test.com", role: Role.STAFF, createdAt: new Date("2026-01-01") },
          { id: "u-2", email: "second@test.com", role: Role.STAFF, createdAt: new Date("2026-02-01") },
        ],
      },
    ];

    const result = await runBackfill(orgs, mockUpdate);

    assert.equal(result.promoted, 1);
    assert.equal(result.skippedHasOwner, 0);
    assert.equal(result.skippedNoUsers, 0);
    assert.equal(updates.length, 1);
    assert.equal(updates[0].userId, "u-1"); // earliest createdAt
    assert.equal(updates[0].role, Role.OWNER);
  });

  it("skips orgs that already have an OWNER (idempotency)", async () => {
    const orgs: MockOrg[] = [
      {
        id: "org-1",
        name: "Already Owned",
        users: [
          { id: "u-1", email: "owner@test.com", role: Role.OWNER, createdAt: new Date("2026-01-01") },
          { id: "u-2", email: "staff@test.com", role: Role.STAFF, createdAt: new Date("2026-02-01") },
        ],
      },
    ];

    const result = await runBackfill(orgs, mockUpdate);

    assert.equal(result.promoted, 0);
    assert.equal(result.skippedHasOwner, 1);
    assert.equal(updates.length, 0);
  });

  it("skips orgs with zero users without crashing", async () => {
    const orgs: MockOrg[] = [
      { id: "org-empty", name: "Empty Org", users: [] },
    ];

    const result = await runBackfill(orgs, mockUpdate);

    assert.equal(result.promoted, 0);
    assert.equal(result.skippedNoUsers, 1);
    assert.equal(updates.length, 0);
  });

  it("is idempotent — running twice produces same result", async () => {
    const orgs: MockOrg[] = [
      {
        id: "org-1",
        name: "Test Salon",
        users: [
          { id: "u-1", email: "first@test.com", role: Role.STAFF, createdAt: new Date("2026-01-01") },
        ],
      },
    ];

    // First run
    const result1 = await runBackfill(orgs, mockUpdate);
    assert.equal(result1.promoted, 1);

    // Simulate the promotion having taken effect
    orgs[0].users[0].role = Role.OWNER;
    updates.length = 0;

    // Second run — should skip because org now has an owner
    const result2 = await runBackfill(orgs, mockUpdate);
    assert.equal(result2.promoted, 0);
    assert.equal(result2.skippedHasOwner, 1);
    assert.equal(updates.length, 0);
  });

  it("promotes correct user when multiple users exist (earliest createdAt)", async () => {
    const orgs: MockOrg[] = [
      {
        id: "org-1",
        name: "Multi-user Salon",
        users: [
          // Pre-sorted by createdAt asc (matching Prisma orderBy)
          { id: "u-earliest", email: "earliest@test.com", role: Role.MANAGER, createdAt: new Date("2025-06-01") },
          { id: "u-middle", email: "middle@test.com", role: Role.STAFF, createdAt: new Date("2025-09-01") },
          { id: "u-latest", email: "latest@test.com", role: Role.STAFF, createdAt: new Date("2026-01-01") },
        ],
      },
    ];

    const result = await runBackfill(orgs, mockUpdate);

    assert.equal(result.promoted, 1);
    assert.equal(result.promotions[0].userId, "u-earliest");
    assert.equal(updates[0].userId, "u-earliest");
  });

  it("handles mixed orgs correctly", async () => {
    const orgs: MockOrg[] = [
      {
        id: "org-needs-owner",
        name: "Needs Owner",
        users: [
          { id: "u-1", email: "a@test.com", role: Role.STAFF, createdAt: new Date("2026-01-01") },
        ],
      },
      {
        id: "org-has-owner",
        name: "Has Owner",
        users: [
          { id: "u-2", email: "b@test.com", role: Role.OWNER, createdAt: new Date("2026-01-01") },
        ],
      },
      { id: "org-empty", name: "Empty", users: [] },
    ];

    const result = await runBackfill(orgs, mockUpdate);

    assert.equal(result.promoted, 1);
    assert.equal(result.skippedHasOwner, 1);
    assert.equal(result.skippedNoUsers, 1);
  });
});
