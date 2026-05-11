# scripts/

Operational scripts for the Kasse portal.

## smoke.ts

Discovers all routes in `app/` and pings each one. Validates HTTP status codes.
Run from a repo root with the dev server running:

    npm run dev          # in one terminal
    npm run smoke        # in another

Expected: 46/46 PASS, 0 failed, 9 skipped (dynamic).

## audit-verify.ts

End-to-end verification that the audit log pipeline produces complete rows on
real authenticated writes. Requires a session cookie from a logged-in browser.

### How to run

1. Start the dev server:

       npm run dev

2. Open `http://localhost:3000` in your browser. Log in.

3. Open dev tools (F12) → **Application** tab → **Cookies** →
   `http://localhost:3000` → click `next-auth.session-token`.
   Copy the **entire Value** (long base64 string, may include dots).

4. In a fresh terminal:

       $env:SMOKE_SESSION_COOKIE = "next-auth.session-token=<paste-value-here>"
       npm run audit:verify

5. Read the output. Every line should say PASS. Failures indicate a real
   gap in the audit pipeline — fix before merging.

### Expected output

    Kasse audit log end-to-end verification
    Base URL: http://localhost:3000
    Auth cookie: provided

    Step 1: discovering location...
      PASS  location discovery — using <Location Name>

    Step 2: POST /api/clients to create test client...
      PASS  create client — id=<cuid>

    Step 3: querying AuditLog for the create event...
      PASS  audit row exists — id=<cuid>

    Step 4: validating every audit column...
      PASS  userId set — <user cuid>
      PASS  organizationId set — <org cuid>
      PASS  entity = Client
      PASS  entityId matches
      PASS  action = CREATE
      PASS  ipAddress captured — ::1   (or null on some configs)
      PASS  userAgent captured — node ...
      PASS  route captured — /api/clients
      PASS  requestId captured — <null on localhost — expected>
      PASS  after state populated — id+name match
      PASS  before is null on CREATE
      PASS  changedFields present — array(0)

    Step 5: cleanup — deleting test client...
      PASS  cleanup delete
      PASS  DELETE audit row exists

    Summary: 15/15 ok, 0 failed.

### What "PASS with null on localhost" means

Some HTTP context fields like `requestId` (sourced from `x-vercel-id`) won't
populate on a local dev server. The script accepts this and reports it. On
Vercel production, all fields populate.

### Prerequisite: audit test fixture

Before running `audit:verify`, you need a user that belongs to an org with a
location. The superadmin account (`ceo@36west.org`) has `organizationId: null`
and will not work.

Run the audit test seed once to create the fixture:

    npm run audit:seed

This creates:
- **Organization:** Audit Test Salon (`audit-test-org`)
- **Location:** Audit Test Location (`audit-test-location`)
- **User:** `audit-test@localhost` / `AuditTest2026!` (role: owner)

Then log in as `audit-test@localhost` in your browser, grab the session cookie,
and run `audit:verify` with that cookie.

### Production safety

The seed refuses to run if `NODE_ENV=production` unless `--force` is passed.
Don't pass `--force` in production. The fixture is a local-dev-only contract.

## rls-verify.ts

Two-mode RLS verification harness. Detects whether RLS policies are applied
by querying `pg_policies`, then either runs full isolation tests (RLS_APPLIED)
or reports all tests as SKIPPED (RLS_NOT_APPLIED).

### Two modes

The harness detects mode automatically by querying `pg_policies`:

**RLS_NOT_APPLIED** — no policies exist on tenant-scoped tables. Tests that
require RLS to be enforced are marked SKIPPED with a clear reason. This is the
expected state before PR #27.

**RLS_APPLIED** — policies exist on all 23 standard tables + AuditLog. Tests run
in full. Every test must PASS or the rollout is blocked.

**PARTIAL** — some tables have policies, others don't. This indicates a
partial migration apply (or a corrupted state). Test reports FAIL immediately.

### What gets tested in RLS_APPLIED mode

1. Policy count verification — 4 policies x 23 tables + 1 AuditLog SELECT policy.
2. Cross-tenant read — Tenant 1 cannot see Tenant 2's data; result must be zero rows.
3. Cross-tenant write — INSERT with wrong organizationId blocked by WITH CHECK.
4. Cross-tenant UPDATE org-change — attempt to move a row to another tenant blocked.
5. Superadmin cross-tenant read — bypass works; superadmin sees all tenants.
6. Unset-setting safe-deny — no session vars set returns zero rows, never errors.
   **NOTE:** This test exercises the empty-string case
   (`app_set_tenant('', false)`), not the genuinely-unset case (variable was
   never set in this session). The two are equivalent under our current policy
   which uses `current_setting(name, true)` with the `missing_ok` flag — both
   produce empty string. If the policy is ever changed to use
   `current_setting(name)` without the flag, genuinely-unset would throw an
   error while empty-string would not, and this test would not catch the
   difference. A full genuinely-unset test would require forcing a fresh
   connection, which is operationally complex in a pooled client. This
   limitation is documented in the harness code comment as well.
7. Organization-IDOR (app-layer) — admin routes refuse unauthenticated orgId access.

### Test fixtures

- Tenant 1: `audit-test-org` / `audit-test@localhost` / [fixture password — see prisma/seed/audit-test.ts]
  (Created by `npm run audit:seed` — PR #5 fixture, reused.)
- Tenant 2: `rls-test-org-2` / `rls-test-2@localhost` / [fixture password — see prisma/seed/rls-test.ts]
  (Created by `npm run rls:seed` — this PR's fixture.)

### How to run

1. Seed both fixtures (idempotent):

       npm run audit:seed
       npm run rls:seed

2. Run the harness:

       npm run rls:verify

3. Today (before RLS migration is applied), expect:

       Mode: RLS_NOT_APPLIED
       Summary: 2 PASS, 0 FAIL, 6 SKIP

   Note: The Organization-IDOR application-layer test runs in BOTH modes —
   it validates that admin routes reject unauthenticated orgId access, which
   is independent of RLS state. Skipping this in RLS_NOT_APPLIED mode would
   hide real signal about the auth layer.

4. After RLS migration is applied (PR #27), expect:

       Mode: RLS_APPLIED
       Summary: 8 PASS, 0 FAIL, 0 SKIP

### TODO

- Pre-create scripts/rls-rollback.sql in PR #27 (sibling to migration.sql) so
  rollback is "one psql -f" during an incident, not "find the comment, paste."
