#!/usr/bin/env tsx
/**
 * P0.A.6: Idempotent seed for system PermissionSet rows.
 *
 * Creates 7 system permission sets matching roleDefaults from P0.A.5:
 * Owner / Manager / Staff / Staff View Only / Accountant /
 * Business Partner / Franchise Owner Default.
 *
 * CLIENT excluded (empty default — keys defined in P11).
 * SUPERADMIN excluded (bypass via can(), no set needed).
 *
 * Uses findFirst + create/update fallback (not upsert) because
 * Postgres treats NULL as distinct in the @@unique([organizationId, name])
 * constraint — upsert would fail to match existing null-org rows.
 *
 * Usage:
 *   npx tsx prisma/seed-permission-sets.ts
 *   npm run seed:permission-sets
 *
 * Production safety:
 *   Refuses to run if NODE_ENV=production unless ALLOW_PROD_SEED=1.
 *
 * Refs: docs/build-order/PHASE_0_FOUNDATION.md P0.A.6
 */
import { Role } from "@prisma/client";
import { prismaAdmin } from "../lib/prismaAdmin";
import { roleDefaults } from "../lib/permissions/defaults";

// ── Production guard ─────────────────────────────────────────────────────
if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_PROD_SEED !== "1"
) {
  console.error("REFUSED: seed-permission-sets will not run in production.");
  console.error("Set ALLOW_PROD_SEED=1 to override.");
  process.exit(1);
}

const prisma = prismaAdmin;

/** System permission sets to seed — one per non-empty, non-SUPERADMIN role. */
const SYSTEM_SETS: Array<{ name: string; role: Role }> = [
  { name: "Owner Default", role: Role.OWNER },
  { name: "Manager Default", role: Role.MANAGER },
  { name: "Staff Default", role: Role.STAFF },
  { name: "Staff View Only", role: Role.STAFF_VIEW_ONLY },
  { name: "Accountant Default", role: Role.ACCOUNTANT },
  { name: "Business Partner Default", role: Role.BUSINESS_PARTNER },
  { name: "Franchise Owner Default", role: Role.FRANCHISE_OWNER },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const { name, role } of SYSTEM_SETS) {
    const permissions = roleDefaults[role] as string[];

    const existing = await prisma.permissionSet.findFirst({
      where: { organizationId: null, name },
    });

    if (existing) {
      await prisma.permissionSet.update({
        where: { id: existing.id },
        data: { permissions, isSystem: true },
      });
      updated++;
    } else {
      try {
        await prisma.permissionSet.create({
          data: {
            organizationId: null,
            name,
            permissions,
            isSystem: true,
          },
        });
        created++;
      } catch (e: unknown) {
        // Race: another process created this set between our findFirst and create.
        // Recover by updating instead.
        if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
          const raced = await prisma.permissionSet.findFirst({
            where: { organizationId: null, name },
          });
          if (raced) {
            await prisma.permissionSet.update({
              where: { id: raced.id },
              data: { permissions, isSystem: true },
            });
            updated++;
          }
        } else {
          throw e;
        }
      }
    }
  }

  console.log(
    `\nPermissionSet seed complete: ${created} created, ${updated} updated (${SYSTEM_SETS.length} total system sets)`,
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
