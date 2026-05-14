#!/usr/bin/env tsx
/**
 * P0.A.2: Standalone idempotent org-owner backfill script.
 *
 * Finds all Organization rows and ensures each has at least one
 * Role.OWNER user. If an org has users but none with OWNER role,
 * promotes the earliest-createdAt user to OWNER.
 *
 * Idempotent: safe to run multiple times. Orgs that already have
 * an OWNER are skipped. Orgs with zero users are skipped.
 *
 * Usage:
 *   npx tsx scripts/backfill-org-owners.ts
 *   npm run backfill:org-owners
 *
 * Production safety:
 *   Refuses to run if NODE_ENV=production unless ALLOW_PROD_SEED=1.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.2
 */
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ── Production guard ─────────────────────────────────────────────────────
if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_PROD_SEED !== "1"
) {
  console.error(
    "REFUSED: backfill-org-owners will not run in production.",
  );
  console.error("Set ALLOW_PROD_SEED=1 to override.");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      users: { orderBy: { createdAt: "asc" } },
    },
  });

  let promoted = 0;
  let skippedHasOwner = 0;
  let skippedNoUsers = 0;

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

    const earliest = org.users[0];
    await prisma.user.update({
      where: { id: earliest.id },
      data: { role: Role.OWNER },
    });
    console.log(
      `Promoted ${earliest.email} to OWNER for org "${org.name}" (${org.id})`,
    );
    promoted++;
  }

  console.log(
    `\nBackfill complete: ${promoted} promoted, ${skippedHasOwner} skipped (has owner), ${skippedNoUsers} skipped (no users)`,
  );
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
