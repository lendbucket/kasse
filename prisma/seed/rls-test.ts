#!/usr/bin/env tsx
/**
 * RLS test fixture seed — creates Tenant 2 for cross-tenant isolation tests.
 *
 * Tenant 1 is the existing audit-test fixture (audit-test-org / audit-test@localhost).
 * Tenant 2 is created here (rls-test-org-2 / rls-test-2@localhost).
 *
 * The rls-verify harness uses both tenants to confirm that cross-tenant reads
 * and writes are blocked by RLS policies.
 *
 * Idempotent — safe to run multiple times. Uses upsert on unique fields.
 *
 * Usage:
 *   npm run rls:seed
 *
 * Production safety:
 *   Refuses to run if NODE_ENV=production unless --force is passed.
 */

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// ── Production guard ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
  console.error("REFUSED: rls-test seed will not run in production.");
  console.error("This fixture is for local development only.");
  console.error("If you really mean it, pass --force.");
  process.exit(1);
}

// ── Database connection ──────────────────────────────────────────────────
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("FAIL: DATABASE_URL is not set. Run via: npm run rls:seed");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

// ── Fixture constants ────────────────────────────────────────────────────
const RLS_ORG_ID = "rls-test-org-2";
const RLS_ORG_SLUG = "rls-test-salon-2";
const RLS_LOCATION_ID = "rls-test-location-2";
const RLS_USER_EMAIL = "rls-test-2@localhost";
// Intentionally hardcoded fixture password. Synthetic value, never reused
// for any real account. Local dev only — the production guard blocks this
// seed from running unless --force is passed.
const RLS_USER_PASSWORD = "RlsTest2026!";

async function main() {
  // 1. Organization (Tenant 2)
  const org = await prisma.organization.upsert({
    where: { slug: RLS_ORG_SLUG },
    update: { name: "RLS Test Salon 2" },
    create: {
      id: RLS_ORG_ID,
      name: "RLS Test Salon 2",
      slug: RLS_ORG_SLUG,
      plan: "starter",
      planStatus: "trial",
    },
  });
  console.log(`Organization: ${org.name} (${org.id})`);

  // 2. Location
  const location = await prisma.location.upsert({
    where: { id: RLS_LOCATION_ID },
    update: { name: "RLS Test Location 2" },
    create: {
      id: RLS_LOCATION_ID,
      name: "RLS Test Location 2",
      organizationId: org.id,
    },
  });
  console.log(`Location: ${location.name} (${location.id})`);

  // 3. User (owner role, belongs to rls-test-org-2)
  const hash = await bcrypt.hash(RLS_USER_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: RLS_USER_EMAIL },
    update: {
      password: hash,
      organizationId: org.id,
      role: Role.OWNER,
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      email: RLS_USER_EMAIL,
      name: "RLS Test User 2",
      password: hash,
      role: Role.OWNER,
      organizationId: org.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log(`User: ${user.email} (${user.id}) — password: [fixture, see prisma/seed/rls-test.ts]`);

  // 4. Create a Client row owned by Tenant 2 (used as cross-tenant test target)
  const client = await prisma.client.upsert({
    where: { id: "rls-test-client-2" },
    update: { name: "RLS Isolation Target" },
    create: {
      id: "rls-test-client-2",
      name: "RLS Isolation Target",
      organizationId: org.id,
    },
  });
  console.log(`Client: ${client.name} (${client.id}) — owned by ${org.id}`);
}

main()
  .catch((err) => {
    console.error("rls-test seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
