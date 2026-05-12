#!/usr/bin/env tsx
/**
 * Pre-cutover sanity check for the RLS role-split rollout (PR #28c-#28f).
 *
 * Run this script BEFORE each of these production-touching PRs to confirm
 * the environment is in the expected state. Cheap insurance against
 * applying the wrong thing to the wrong database.
 *
 * Usage:
 *   npm run preflight:cutover
 *
 * Each check is independent. The script reports the state of every check
 * and exits with code 0 if everything is as expected for the NEXT step in
 * the rollout, otherwise code 1.
 *
 * Required env vars:
 *   DATABASE_URL — the database to check (production for cutover steps)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type CheckResult = { name: string; status: "PASS" | "FAIL" | "INFO"; detail: string };
const results: CheckResult[] = [];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("FAIL: DATABASE_URL is not set. Run via: npm run preflight:cutover");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

function record(name: string, status: CheckResult["status"], detail: string) {
  results.push({ name, status, detail });
  console.log(`  ${status.padEnd(4)}  ${name}: ${detail}`);
}

async function main() {
  console.log("Kasse RLS cutover preflight check");
  console.log("==================================");
  const urlSnippet = (process.env.DATABASE_URL ?? "").replace(/:\/\/[^@]+@/, "://****@").slice(0, 80);
  console.log(`Database: ${urlSnippet}\n`);

  // Check 1: Current connection role
  try {
    const roleInfo = await prisma.$queryRaw<Array<{ user: string; is_super: string }>>`
      SELECT current_user as user, current_setting('is_superuser') as is_super
    `;
    const r = roleInfo[0];
    record(
      "Current connection role",
      "INFO",
      `current_user=${r?.user} is_superuser=${r?.is_super}`,
    );
  } catch (e) {
    record(
      "Current connection role",
      "FAIL",
      `Could not query: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Check 2: Required Prisma migrations applied
  try {
    const expectedMigrations = [
      "20260507204234_rls_session_helpers",
      "20260507213449_audit_log",
      "20260508194352_relation_hardening",
    ];
    const applied = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM _prisma_migrations
      WHERE migration_name IN (
        '20260507204234_rls_session_helpers',
        '20260507213449_audit_log',
        '20260508194352_relation_hardening'
      )
      ORDER BY migration_name
    `;
    const appliedNames = new Set(applied.map((r) => r.migration_name));
    const missing = expectedMigrations.filter((m) => !appliedNames.has(m));
    if (missing.length === 0) {
      record(
        "Required prior migrations",
        "PASS",
        `All ${expectedMigrations.length} prerequisite migrations applied`,
      );
    } else {
      record(
        "Required prior migrations",
        "FAIL",
        `Missing: ${missing.join(", ")}`,
      );
    }
  } catch (e) {
    record(
      "Required prior migrations",
      "FAIL",
      `Could not query _prisma_migrations: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Check 3: app_set_tenant function exists
  try {
    const fnExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'app_set_tenant'
      ) as exists
    `;
    if (fnExists[0]?.exists) {
      record("app_set_tenant function", "PASS", "Function exists (required by app + cutover)");
    } else {
      record(
        "app_set_tenant function",
        "FAIL",
        "Function not found — apply migration 20260507204234_rls_session_helpers first",
      );
    }
  } catch (e) {
    record(
      "app_set_tenant function",
      "FAIL",
      `Could not query: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Check 4: kasse_app role status (may or may not exist yet, both are informational)
  try {
    const roleInfo = await prisma.$queryRaw<Array<{ rolname: string; rolbypassrls: boolean; rolcanlogin: boolean }>>`
      SELECT rolname, rolbypassrls, rolcanlogin
      FROM pg_roles WHERE rolname = 'kasse_app'
    `;
    if (roleInfo.length === 0) {
      record(
        "kasse_app role",
        "INFO",
        "Not yet created — expected before PR #28c. After #28c, this should PASS.",
      );
    } else {
      const r = roleInfo[0];
      if (r.rolbypassrls === false && r.rolcanlogin === true) {
        record(
          "kasse_app role",
          "PASS",
          `Exists with correct attributes (rolbypassrls=false, rolcanlogin=true)`,
        );
      } else {
        record(
          "kasse_app role",
          "FAIL",
          `Exists but with WRONG attributes: rolbypassrls=${r.rolbypassrls}, rolcanlogin=${r.rolcanlogin}`,
        );
      }
    }
  } catch (e) {
    record(
      "kasse_app role",
      "FAIL",
      `Could not query pg_roles: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Check 5: RLS policies present (informational pre-#28d, required post-#28d)
  try {
    const policyCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM pg_policies WHERE schemaname = 'public'
    `;
    const count = Number(policyCount[0]?.count ?? 0);
    if (count === 0) {
      record(
        "RLS policies",
        "INFO",
        "0 policies — expected before PR #28d. After #28d, expect 93.",
      );
    } else if (count === 93) {
      record("RLS policies", "PASS", `93 policies present (23 tables x 4 + 1 AuditLog SELECT)`);
    } else {
      record(
        "RLS policies",
        "FAIL",
        `${count} policies present — expected either 0 (pre-#28d) or exactly 93 (post-#28d)`,
      );
    }
  } catch (e) {
    record(
      "RLS policies",
      "FAIL",
      `Could not query pg_policies: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Check 6: FORCE ROW LEVEL SECURITY count
  try {
    const forceCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relforcerowsecurity = true
    `;
    const count = Number(forceCount[0]?.count ?? 0);
    if (count === 0) {
      record(
        "FORCE ROW LEVEL SECURITY",
        "INFO",
        "0 tables forced — expected before PR #28d. After #28d, expect 24.",
      );
    } else if (count === 24) {
      record("FORCE ROW LEVEL SECURITY", "PASS", `24 tables forced (23 standard + AuditLog)`);
    } else {
      record(
        "FORCE ROW LEVEL SECURITY",
        "FAIL",
        `${count} tables forced — expected either 0 or exactly 24`,
      );
    }
  } catch (e) {
    record(
      "FORCE ROW LEVEL SECURITY",
      "FAIL",
      `Could not query pg_class: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  // Summary
  const fails = results.filter((r) => r.status === "FAIL").length;
  const passes = results.filter((r) => r.status === "PASS").length;
  const infos = results.filter((r) => r.status === "INFO").length;

  console.log(`\n========================================`);
  console.log(`Summary: ${passes} PASS, ${fails} FAIL, ${infos} INFO`);
  console.log(`========================================`);

  if (fails > 0) {
    console.log("\nFAILs indicate an unexpected state. Investigate before proceeding.");
    console.log("INFOs indicate states that vary by rollout phase — review against the");
    console.log("phase you're about to execute.");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("\nNo FAILs. Review INFOs against the phase you're about to execute.");
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("Preflight crashed:", e);
  process.exit(2);
});
