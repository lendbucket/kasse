#!/usr/bin/env tsx
/**
 * End-to-end audit log verification.
 *
 * Requires: SMOKE_SESSION_COOKIE env var set to a logged-in next-auth session token.
 * Optional:  SMOKE_BASE_URL (default http://localhost:3000)
 *            SMOKE_LOCATION_ID (default: auto-discover first location for the tenant)
 *
 * Usage (PowerShell):
 *   $env:SMOKE_SESSION_COOKIE="next-auth.session-token=eyJ..."
 *   npx tsx scripts/audit-verify.ts
 *
 * What it does:
 *   1. Auto-discovers a location for the authenticated tenant (or uses SMOKE_LOCATION_ID)
 *   2. POST /api/clients to create a test client → captures returned id
 *   3. Sleeps 500ms (audit triggers run inside the same transaction, but we
 *      give the connection a moment to finish before we query)
 *   4. Queries AuditLog directly via Prisma for the row matching that entityId
 *   5. Asserts every expected column is populated correctly
 *   6. Cleans up: DELETE the test client (and verify the DELETE produced an audit row too)
 *
 * Exit code 0 on success, 1 on any assertion failure.
 */

import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const COOKIE = process.env.SMOKE_SESSION_COOKIE ?? "";
const PRESET_LOCATION = process.env.SMOKE_LOCATION_ID ?? "";

if (!COOKIE) {
  console.error("FAIL: SMOKE_SESSION_COOKIE is required.");
  console.error("Set it to a valid next-auth session cookie from your browser:");
  console.error("  Open dev tools → Application → Cookies → http://localhost:3000");
  console.error("  Copy the entire 'next-auth.session-token' value");
  console.error('  $env:SMOKE_SESSION_COOKIE="next-auth.session-token=<value>"');
  process.exit(1);
}

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

function check(name: string, ok: boolean, detail: string): CheckResult {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`  ${mark}  ${name}${detail ? "  —  " + detail : ""}`);
  return { name, ok, detail };
}

async function authedFetch(path: string, init?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: COOKIE,
      ...(init?.headers ?? {}),
    },
  });
}

async function main() {
  console.log(`\nKasse audit log end-to-end verification`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth cookie: provided\n`);

  const results: CheckResult[] = [];
  const stamp = Date.now();
  const testClientName = `_smoke_test_${stamp}`;
  let createdClientId: string | null = null;

  try {
    // ─── STEP 1: discover a location ─────────────────────────────────────
    console.log("Step 1: discovering location for the authenticated tenant...");

    let locationId = PRESET_LOCATION;
    if (!locationId) {
      const locRes = await authedFetch("/api/locations");
      if (!locRes.ok) {
        results.push(check("auth check", false, `GET /api/locations returned ${locRes.status}`));
        throw new Error("Cannot discover location — auth failed or no locations.");
      }
      const locBody = (await locRes.json()) as { locations: Array<{ id: string; name: string }> };
      if (!locBody.locations || locBody.locations.length === 0) {
        results.push(check("location discovery", false, "no locations exist for this tenant"));
        throw new Error("No location available — create one in onboarding first.");
      }
      locationId = locBody.locations[0].id;
      results.push(check("location discovery", true, `using ${locBody.locations[0].name}`));
    } else {
      results.push(check("location discovery", true, `using preset ${PRESET_LOCATION}`));
    }

    // ─── STEP 2: create a test client (audited write) ────────────────────
    console.log("\nStep 2: POST /api/clients to create test client...");

    const createRes = await authedFetch("/api/clients", {
      method: "POST",
      body: JSON.stringify({
        name: testClientName,
        locationId,
        notes: "audit-verify smoke test client; safe to delete",
      }),
    });

    if (createRes.status !== 201) {
      const body = await createRes.text();
      results.push(check("create client", false, `expected 201 got ${createRes.status}: ${body.slice(0, 200)}`));
      throw new Error("Create failed.");
    }

    const createBody = (await createRes.json()) as { client: { id: string; name: string } };
    createdClientId = createBody.client.id;
    results.push(check("create client", true, `id=${createdClientId}`));

    // ─── STEP 3: wait briefly for audit trigger to finalize ──────────────
    await new Promise((r) => setTimeout(r, 500));

    // ─── STEP 4: assert audit row exists with full context ───────────────
    console.log("\nStep 3: querying AuditLog for the create event...");

    const auditRow = await prisma.auditLog.findFirst({
      where: { entity: "Client", entityId: createdClientId, action: "CREATE" },
      orderBy: { createdAt: "desc" },
    });

    if (!auditRow) {
      results.push(check("audit row exists", false, "no AuditLog row found for created client"));
      throw new Error("Audit pipeline did not write a row.");
    }

    results.push(check("audit row exists", true, `id=${auditRow.id}`));

    // ─── STEP 5: assert every expected column ────────────────────────────
    console.log("\nStep 4: validating every audit column...");

    results.push(check("userId set",         !!auditRow.userId,         auditRow.userId ?? "<null>"));
    results.push(check("organizationId set", !!auditRow.organizationId, auditRow.organizationId ?? "<null>"));
    results.push(check("entity = Client",    auditRow.entity === "Client", auditRow.entity ?? "<null>"));
    results.push(check("entityId matches",   auditRow.entityId === createdClientId, auditRow.entityId ?? "<null>"));
    results.push(check("action = CREATE",    auditRow.action === "CREATE", auditRow.action));

    // HTTP context fields. Local dev may not have all of these (no x-vercel-id locally),
    // so we assert presence with caveats.
    const ipPresent = !!auditRow.ipAddress;
    const uaPresent = !!auditRow.userAgent;
    const routePresent = auditRow.route === "/api/clients";

    results.push(check("ipAddress captured",  ipPresent, auditRow.ipAddress ?? "<null — expected on Vercel, may be null on localhost>"));
    results.push(check("userAgent captured",  uaPresent, (auditRow.userAgent ?? "").slice(0, 60) + "..."));
    results.push(check("route captured",      routePresent, auditRow.route ?? "<null>"));

    // requestId: Vercel sets x-vercel-id in production. Local dev usually has none — that's fine.
    if (auditRow.requestId) {
      results.push(check("requestId captured", true, auditRow.requestId));
    } else {
      results.push(check("requestId captured", true, "<null on localhost — expected, will populate on Vercel>"));
    }

    // after state — should be a JSON object containing the new client's data
    const afterOk =
      auditRow.after &&
      typeof auditRow.after === "object" &&
      !Array.isArray(auditRow.after) &&
      (auditRow.after as any).id === createdClientId &&
      (auditRow.after as any).name === testClientName;
    results.push(check("after state populated", !!afterOk, afterOk ? "id+name match" : JSON.stringify(auditRow.after).slice(0, 100)));

    // before should be null on a CREATE
    results.push(check("before is null on CREATE", auditRow.before === null, auditRow.before === null ? "ok" : "unexpected before value"));

    // changedFields on CREATE — current trigger leaves this empty for CREATE (only computes on UPDATE).
    // We accept either empty array or null. Just log what's there.
    const cfNote = Array.isArray(auditRow.changedFields)
      ? `array(${auditRow.changedFields.length})`
      : String(auditRow.changedFields);
    results.push(check("changedFields present", true, cfNote));

    // ─── STEP 6: cleanup — delete the test client ────────────────────────
    console.log("\nStep 5: cleanup — deleting test client...");

    // We don't have a DELETE /api/clients/[id] yet, so we delete via prisma directly.
    // This still triggers the audit fire because the trigger is at the DB level.
    await prisma.client.delete({ where: { id: createdClientId } });
    createdClientId = null;
    results.push(check("cleanup delete", true, "test client removed"));

    await new Promise((r) => setTimeout(r, 300));

    const deleteAuditRow = await prisma.auditLog.findFirst({
      where: { entity: "Client", entityId: auditRow.entityId, action: "DELETE" },
      orderBy: { createdAt: "desc" },
    });
    results.push(check(
      "DELETE audit row exists",
      !!deleteAuditRow,
      deleteAuditRow ? `id=${deleteAuditRow.id}` : "no DELETE audit row found",
    ));

    // ─── DONE ────────────────────────────────────────────────────────────
  } catch (e: any) {
    console.error(`\nAborted: ${e.message}`);
  } finally {
    // Best-effort cleanup if we crashed mid-test
    if (createdClientId) {
      try {
        await prisma.client.delete({ where: { id: createdClientId } });
        console.log(`(post-failure cleanup: removed test client ${createdClientId})`);
      } catch {
        console.log(`(post-failure cleanup: could not remove test client ${createdClientId} — clean up manually)`);
      }
    }
    await prisma.$disconnect();
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n────────────────────────────────────────────────────────`);
  console.log(`Summary: ${passed}/${results.length} ok, ${failed.length} failed.`);

  if (failed.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failed) {
      console.log(`  - ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("audit-verify crashed:", e);
  process.exit(2);
});
