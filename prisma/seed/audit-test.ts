#!/usr/bin/env tsx
/**
 * Audit test fixture seed.
 *
 * Creates (or updates) a dedicated Organization, Location, and User that the
 * audit-verify script can authenticate as. This user belongs to a real org
 * with a real location, so tenant-scoped routes work end-to-end.
 *
 * Idempotent — safe to run multiple times. Uses upsert on unique fields.
 *
 * Usage:
 *   npm run audit:seed
 *
 * Production safety:
 *   Refuses to run if NODE_ENV=production unless --force is passed.
 *   Don't pass --force in production. This fixture is a local-dev-only contract.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// ── Production guard ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
  console.error("REFUSED: audit-test seed will not run in production.");
  console.error("This fixture is for local development only.");
  console.error("If you really mean it, pass --force.");
  process.exit(1);
}

// ── Database connection ──────────────────────────────────────────────────
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("FAIL: DATABASE_URL is not set. Run via: npm run audit:seed");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

// ── Fixture constants ────────────────────────────────────────────────────
const AUDIT_ORG_ID = "audit-test-org";
const AUDIT_ORG_SLUG = "audit-test-salon";
const AUDIT_LOCATION_ID = "audit-test-location";
const AUDIT_USER_EMAIL = "audit-test@localhost";
const AUDIT_USER_PASSWORD = "AuditTest2026!";

async function main() {
  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { slug: AUDIT_ORG_SLUG },
    update: { name: "Audit Test Salon" },
    create: {
      id: AUDIT_ORG_ID,
      name: "Audit Test Salon",
      slug: AUDIT_ORG_SLUG,
      plan: "starter",
      planStatus: "trial",
    },
  });
  console.log(`Organization: ${org.name} (${org.id})`);

  // 2. Location
  const location = await prisma.location.upsert({
    where: { id: AUDIT_LOCATION_ID },
    update: { name: "Audit Test Location", organizationId: org.id },
    create: {
      id: AUDIT_LOCATION_ID,
      name: "Audit Test Location",
      organizationId: org.id,
    },
  });
  console.log(`Location: ${location.name} (${location.id})`);

  // 3. User (owner role, belongs to the audit-test org)
  const hash = await bcrypt.hash(AUDIT_USER_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: AUDIT_USER_EMAIL },
    update: {
      password: hash,
      organizationId: org.id,
      role: "owner",
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      email: AUDIT_USER_EMAIL,
      name: "Audit Test User",
      password: hash,
      role: "owner",
      organizationId: org.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log(`User: ${user.email} (${user.id}) — password: [fixture, see prisma/seed/audit-test.ts]`);
}

main()
  .catch((err) => {
    console.error("audit-test seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
