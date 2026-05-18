# RLS Route Classification

**Version:** 1.0
**Phase:** 0.5.3b-1
**Status:** Living document — update when adding new API routes
**Owner:** Foundation engineering

## Phase 0.5.3b Status: COMPLETE

**Phase 0.5.3b — RLS rollout — completed 2026-05-12.**

This phase delivered Row-Level Security as defense-in-depth on the Kasse production database. Tenant isolation is now enforced at both the application layer (via `withTenantScope` in route handlers) and the database layer (via 93 RLS policies on 24 tables + FORCE ROW LEVEL SECURITY).

**Empire architecture impact:**
- Kasse is now production-grade multi-tenant from a security perspective
- Same RLS architecture pattern can be applied to SalonTransact (Layer 1, payment engine) when its data model expands
- Reseller program (Layer 3, post-Phase 9 pending legal counsel review) inherits this isolation by default
- AI agent capabilities (Future Agent #1 DM-to-Booking, Future Agent #2 Lead Nurture) can be built on top of this RLS foundation safely

**Sub-phases:**
- 0.5.3b-1 / 0.5.3b-2 — Foundational route migration to tenant context patterns (PRs #1-22, merged 2026-05-09 through 2026-05-11)
- 0.5.3b-3a — Authored RLS policies migration (PR #23, merged 2026-05-11)
- 0.5.3b-3b — Built rls-verify harness (PR #24, merged 2026-05-11)
- 0.5.3b-3c — Branch verification proved RLS architecture works (no PR — local branch test, 9 PASS / 0 FAIL)
- 0.5.3b-3d-a — Authored kasse_app role bootstrap migration (PR #25, merged 2026-05-12)
- 0.5.3b-3d-b — Verified lib files + preflight script (PR #26, merged 2026-05-12)
- 0.5.3b-3d-c — Applied kasse_app role to production (PR #27, merged 2026-05-12)
- 0.5.3b-3d-d — Applied RLS policies to production (PR #28, merged 2026-05-12)
- 0.5.3b-3d-e — Staged Vercel env vars (PR #29, merged 2026-05-12)
- 0.5.3b-3d-f / 0.5.3b-3d-g — Cutover + documentation finalization (this PR, 2026-05-12)

## Purpose

When Row-Level Security (RLS) policies are enabled in 0.5.3b-3, every Prisma
query against a tenant-scoped table goes through a Postgres policy check that
reads `app.current_org_id` from the connection. If the variable isn't set
(set automatically by `withTenantScope`), tenant-scoped queries return zero
rows.

This document lists every API route and classifies it into one of three
buckets so we know exactly which routes:
- Use `withTenantScope` and will work correctly under RLS (TENANT_SCOPED)
- Must use a separate `prismaAdmin` client that bypasses RLS (BYPASS_NEEDED)
- Need a deliberate decision before RLS rollout (UNDECIDED)

## How to read this

For every new API route added after this audit, the author MUST update this
document with the route's classification. A new route with no entry in this
table is a foundation regression and should be flagged in code review.

## Server-side helpers requiring withTenantScope

These library helpers must be called inside a `withTenantScope` block — they accept a scoped `tx` argument from the callback. They do NOT manage their own connection or scope.

| Helper | Module | Purpose |
|--------|--------|---------|
| `getServerPlanContext(tx, organizationId)` | `lib/plans/api-helpers` | Returns the authoritative plan tier + location count + enabled addons for an org. Used before `assertCanAddLocation`/`assertCanAddStaff`. |

## Routes

### TENANT_SCOPED — Uses `requireTenantContext` + `withTenantScope`

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/clients` | GET, POST | Lists/creates clients scoped to tenant org; asserts location ownership on POST |
| `/api/staff` | GET, POST | Lists/creates staff scoped to tenant org; asserts location ownership on POST |
| `/api/locations` | GET, POST | GET returns locations belonging to the authenticated tenant. POST creates a new location; gated by plan tier (FREE = max 1 location). Returns 402 PAYMENT_REQUIRED with structured upgrade body on limit. |
| `/api/services` | GET, POST | Lists/creates services scoped to tenant org; asserts location on POST |
| `/api/services/[id]` | PATCH, DELETE | Updates/soft-deletes a service, scoped to tenant organizationId |
| `/api/transactions` | POST | Creates a payment transaction; asserts location + staff belong to tenant |
| `/api/waitlist` | GET, POST | Lists/adds waitlist entries scoped to tenant; validates staff if provided |
| `/api/appointments` | GET, POST | Lists/creates appointments; asserts location, staff, and service ownership |
| `/api/appointments/[id]` | PATCH | Updates appointment status/notes via updateMany scoped to organizationId |
| `/api/messages` | GET, POST | Conversation list + send outbound message; verifies client belongs to tenant |
| `/api/messages/[clientId]` | GET | Full message thread for a client; marks inbound as read in same transaction |
| `/api/ai-receptionist/calls` | GET | Returns 50 most recent AI call records for the tenant |
| `/api/ai-receptionist/config` | GET, PATCH | Reads/upserts AI receptionist config with field allowlist on PATCH |
| `/api/settings` | GET, PATCH | Reads org + business settings; applies allowlist-filtered updates transactionally |
| `/api/settings/import` | GET, POST | CSV bulk import with ImportJob audit trail (tenant-scoped); row inserts use raw prisma intentionally (see architectural note in file) |
| `/api/clients/[id]` | GET, PATCH | Reads client + appointments + totalSpent; patches profile fields — all scoped by organizationId (migrated 0.5.3b-1b) |
| `/api/staff/[id]` | PATCH, DELETE | Updates staff fields (with locationId validation) or soft-deletes — all scoped by organizationId (migrated 0.5.3b-1b) |
| `/api/permission-sets` | GET, POST | Lists/creates custom PermissionSets scoped to tenant org; validates name uniqueness + permission keys on POST (P0.A.11) |
| `/api/permission-sets/[id]` | GET, PATCH, DELETE | Reads/updates/deletes a custom PermissionSet; org-scoped with defense-in-depth org match checks (P0.A.11) |
| `/api/users` | GET | Lists org users for role assignment UI; scoped by organizationId (P0.A.12) |
| `/api/users/[id]` | PATCH | Updates user's customRoleId; validates target PermissionSet belongs to same org (P0.A.12) |
| `/api/organization-groups` | GET, POST | Lists/creates OrganizationGroups; tenant-scoped via org membership filter + withTenantScope; validates parent/permissionSet in tenant context on POST (P0.A.13) |
| `/api/organization-groups/[id]` | GET, PATCH, DELETE | Reads/updates/deletes OrganizationGroup; tenant-scoped via org membership filter; PATCH includes cycle detection on parentGroupId changes (P0.A.13) |

### BYPASS_NEEDED — PRE_SESSION (public, no session required)

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/auth/[...nextauth]` | GET, POST | PRE_SESSION (delegates entirely to lib/auth.ts which uses prismaAdmin; no direct DB calls in the route file) |
| `/api/auth/register` | POST | Creates user + org + business settings via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |
| `/api/auth/forgot-password` | POST | Sets password reset token via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |
| `/api/auth/reset-password` | POST | Validates reset token, hashes new password via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |
| `/api/auth/verify-email` | GET | Validates email verification token via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |

### BYPASS_NEEDED — SUPERADMIN (cross-tenant operations)

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/admin/stats` | GET | SUPERADMIN (uses prismaAdmin + requireSuperadminContext + withAdminScope; migrated 0.5.3b-2b) |
| `/api/admin/merchants` | GET, POST | SUPERADMIN (uses prismaAdmin + requireSuperadminContext + withAdminScope; migrated 0.5.3b-2b) |
| `/api/admin/merchants/[orgId]` | GET, PATCH, DELETE | SUPERADMIN (uses prismaAdmin + requireSuperadminContext + withAdminScope; migrated 0.5.3b-2b) |
| `/api/admin/users` | GET | SUPERADMIN (uses prismaAdmin + requireSuperadminContext + withAdminScope; migrated 0.5.3b-2b) |
| `/api/admin/users/[userId]` | PATCH | SUPERADMIN (uses prismaAdmin + requireSuperadminContext + withAdminScope; migrated 0.5.3b-2b) |

### TENANT_SCOPED — ONBOARDING (user has org from registration; configures it via wizard)

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/onboarding` | POST | Configures existing org via wizard steps 2–9; uses requireTenantContext + withTenantScope + ORGANIZATION_ONBOARDING_ALLOWED_FIELDS. Multi-write steps atomic. (migrated 0.5.3b-2c) |
| `/api/onboarding/complete` | POST | Writes KYC/banking via ORGANIZATION_ONBOARDING_ALLOWED_FIELDS; atomic 3-write transaction. Email outside tx. (migrated 0.5.3b-2c) |
| `/api/onboarding/send-application` | POST | TENANT_SCOPED — auth-required but no DB writes (uses requireTenantContext for actor identity only; no withTenantScope wrapper needed since the only side effect is a Resend email. This is TENANT_SCOPED in the audit-bucket sense but does not exercise the tenant scope at runtime.) (migrated 0.5.3b-2c) |

### PUBLIC_STATIC — No auth, no database

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/onboarding/template` | GET | Serves hardcoded CSV templates; no auth, no DB. Code unchanged. |

## Summary

- TENANT_SCOPED: **26**
- BYPASS_NEEDED: **10**
  - PRE_SESSION: **5** (auth handlers + NextAuth)
  - SUPERADMIN: **5** (admin portal operations)
- PUBLIC_STATIC: **1** (static endpoints with no auth or tenant context)
- UNDECIDED: **0**

**Total routes: 37**

## What happens next

- **0.5.3b-1b (done):** Migrated clients/[id] and staff/[id] to tenant context.
- **0.5.3b-2:** Build `lib/prismaAdmin.ts` — a Prisma client that explicitly
  sets `app.is_superadmin = true` on every connection so it bypasses RLS
  policies. Migrate every BYPASS_NEEDED route to use it.
- **0.5.3b-3:** Apply RLS policies on a Supabase database branch. Run smoke +
  audit-verify against the branched DB.
- **0.5.3b-4:** Test on branch. Fix any classification errors.
- **0.5.3b-5:** Merge migration to production.

## Notes on specific routes

### `/api/settings/import` — hybrid scope pattern

This route is classified as TENANT_SCOPED but uses raw `prisma` (not
`withTenantScope`) for the bulk row-insert loop. This is intentional:
- The ImportJob create/update calls use `withTenantScope` (audit-trail rows)
- The per-row inserts (Client/Staff/Service/GiftCard) use raw `prisma` to
  avoid holding a transaction open for the entire import
- Each row insert includes `organizationId: ctx.organizationId` in the data
  block, so cross-tenant writes are impossible even without connection-level
  scope

Under RLS, these raw `prisma` inserts will need the `app.current_org_id`
session variable set. Options:
1. Wrap the entire loop in `withTenantScope` (risks timeout on large files)
2. Set the session variable once at the start of the loop via raw SQL
3. Use `prismaAdmin` for the bulk inserts (they're already scoped by data)

Decision deferred to 0.5.3b-2.

### `/api/onboarding/template` — public endpoint

This route serves static CSV template content with no auth check. This is
intentional — the templates contain column headers only, no user data. No
RLS impact because it performs no database queries.

### `/api/clients/[id]` and `/api/staff/[id]` — RESOLVED

These routes were migrated to `requireTenantContext` + `withTenantScope` in
0.5.3b-1b. All queries now scope by `organizationId`. The cross-tenant
read/write gap is closed.

## Known limitations

### Raw SQL via $queryRaw / $executeRaw bypasses the prismaAdmin extension

The prismaAdmin client uses Prisma's $extends API to wrap every model
operation in a transaction with `SET LOCAL app.is_superadmin = 'true'`.
This covers the typed query surface (`prismaAdmin.user.findUnique(...)`,
`prismaAdmin.organization.create(...)`, etc.).

It does NOT cover:
- `prismaAdmin.$queryRaw\`...\``
- `prismaAdmin.$executeRaw\`...\``
- `prismaAdmin.$executeRawUnsafe(...)`

These bypass the $extends wrapper. If an auth, admin, or onboarding route
ever needs to issue a raw SQL query, it MUST wrap that query in an explicit
transaction with the SET LOCAL prelude:

```ts
await prismaAdmin.$transaction(async (tx) => {
  await tx.$executeRaw`SET LOCAL app.is_superadmin = 'true'`;
  return tx.$queryRaw`SELECT ...`;
});
```

Today, no route in app/api/auth, app/api/admin, or app/api/onboarding uses
raw SQL. If a PR introduces one without the wrapper above, the reviewer
should flag it as SEVERE.

## RLS Migration Status

**Migration:** `prisma/migrations/20260511121142_rls_policies/migration.sql`
**Status:** AUTHORED, NOT APPLIED (as of Phase 0.5.3b-3a-fix)

This migration enables Row-Level Security on 24 tables — 23 standard
tenant-scoped tables and AuditLog (SELECT-only for tenants).

### Tables covered (24)

**Standard tenant policy (23 tables, 4 policies each):**

Location, Staff, Client, Service, Appointment, Transaction, GiftCard,
LoyaltyProgram, Membership, WaitlistEntry, Campaign, ReviewRequest,
FormTemplate, PermissionSet, BusinessSettings, ImportJob, Device, ApiKey,
Webhook, AiReceptionistConfig, AiReceptionistCall, Message, SavedResponse

**Special policy (1 table, 1 policy):**

AuditLog — SELECT only. Writes go through app_audit_trigger (SECURITY DEFINER).

### Tables NOT covered (intentional)

- **Organization** — protected by app logic, not by RLS. Every tenant-scoped route in `app/api/*` derives `organizationId` from `requireTenantContext(req)` which reads from the validated session JWT — never from client-supplied parameters. This means a request like `GET /api/some-route?orgId=other-tenant-id` cannot succeed because the route ignores the query param and uses session.organizationId. **This is load-bearing app logic.** If any future route ever accepts an `organizationId` from a request body or query string without validating it equals `ctx.organizationId`, the database provides zero backstop for Organization-row access. The rls-verify.ts harness in 0.5.3b-3b MUST include an explicit test that confirms no Kasse route reads Organization with a client-supplied orgId without session validation.

User (role: Role enum @default(STAFF) — P0.A.1), Account, Session, VerificationToken — auth tables, accessed via prismaAdmin
Child tables without organizationId (e.g. AppointmentAddon, TransactionItem,
GiftCardRedemption, LoyaltyEvent, ClientMembership, CampaignRecipient,
FormSubmission, ClockEvent, PerformanceStat, Notification, FamilyMember)
— protected transitively through their parent's tenant-scoped row

### Postgres role analysis (queried 2026-05-11, updated 2026-05-11)

Application connects as `postgres`, which has rolbypassrls=TRUE and owns
every table. The RLS policies migration uses `FORCE ROW LEVEL SECURITY`
on every table — this makes RLS apply even to the table owner.

However, **FORCE ROW LEVEL SECURITY does NOT override rolbypassrls**.
This was verified empirically during Phase 0.5.3b-3c branch testing:
with `postgres` (rolbypassrls=TRUE), all cross-tenant isolation tests
FAILED despite FORCE being set on every table. With `kasse_app`
(rolbypassrls=FALSE), all 9 tests PASSED. The fix is the `kasse_app`
role bootstrap migration (20260512005451_kasse_app_role).

Without FORCE, the policies would compile and exist in pg_policies but
no query would ever be subject to them. This was identified by PR #23
reviewer Concern #1. FORCE is still necessary (it prevents the table
owner from bypassing RLS), but it is not sufficient on its own when the
connecting role has rolbypassrls=TRUE.

### Other rolbypassrls=TRUE roles — service_role gap

Two roles in this Supabase instance have rolbypassrls=TRUE:
- `postgres` — addressed by FORCE ROW LEVEL SECURITY (the app connects as this)
- `service_role` — NOT addressed by FORCE

FORCE only affects the table owner. It does NOT strip rolbypassrls from
roles that have it. If anywhere in the codebase initializes a Supabase JS
client with SUPABASE_SERVICE_ROLE_KEY and queries these tables directly,
those queries bypass RLS entirely regardless of FORCE.

**Current state (verified):** Kasse does NOT use the Supabase JS client.
All database access goes through Prisma via DATABASE_URL, which connects
as `postgres`. No SUPABASE_SERVICE_ROLE_KEY env var is referenced in the
codebase or in `KASSE_ARCHITECTURE.md`'s canonical env list.

**Standing rule:** Do not introduce a Supabase JS client initialized with
the service role key without first updating this audit doc. If such a path
becomes necessary (e.g., for a Supabase Storage trigger or Edge Function
that needs DB access), the integration must be documented as a deliberate
RLS bypass exception, classified in the route table just like prismaAdmin
routes, AND the rls-verify.ts harness must include a test confirming the
service_role path enforces tenant isolation through application-layer
checks instead.

**For future reviewers:** if you see `SUPABASE_SERVICE_ROLE_KEY` introduced
in a PR, flag it as a SEVERE concern unless this audit doc has been
updated to document the new bypass exception.

### Role-split architecture (decided 2026-05-11 after branch verification)

Verified empirically during Phase 0.5.3b-3c branch test: `FORCE ROW LEVEL
SECURITY` does NOT override `rolbypassrls`. A connection as the `postgres`
role bypasses RLS even when policies exist and FORCE is set, because
`rolbypassrls` is evaluated separately and takes precedence.

The fix: create a dedicated `kasse_app` role with `NOBYPASSRLS` for the
application's database connection. Migrations continue running as `postgres`
(needs DDL privileges that `kasse_app` should not have).

This means production has **TWO** connection roles:

| Role | rolbypassrls | rolcanlogin | Used for |
|------|-------------|-------------|----------|
| `postgres` | TRUE | TRUE | Schema migrations (DDL); admin operations |
| `kasse_app` | FALSE | TRUE | Application connection (DATABASE_URL) |

#### Env var architecture (post-cutover)

| Env var | Role used | Purpose |
|---------|-----------|---------|
| `DATABASE_URL` | `kasse_app` | Application runtime queries |
| `DIRECT_URL` | `kasse_app` | Same role; bypass pooler when needed |
| `MIGRATION_DATABASE_URL` | `postgres` | `prisma migrate deploy` (DDL access) — NEW, added in PR #28e |

The `MIGRATION_DATABASE_URL` is new and **DOES NOT YET EXIST** as of PR #28a
(this PR). It will be added to Vercel env vars in PR #28e as part of the staged
cutover. Before cutover, `DATABASE_URL` = `DIRECT_URL` = postgres connection
(current production state). After PR #28e completes the Vercel env var stage
and PR #28f triggers the redeployment, `DATABASE_URL` switches to `kasse_app`
while `MIGRATION_DATABASE_URL` preserves DDL access for future migrations run
via CI/CD.

#### Verified by branch test (2026-05-11)

When the application connects as `kasse_app` (rolbypassrls=false), all 9 tests
in rls-verify pass:

- Cross-tenant read isolation: **PASS**
- Cross-tenant write isolation: **PASS** (INSERT with wrong organizationId blocked)
- Cross-tenant UPDATE org-change attack: **PASS** (UPDATE blocked by WITH CHECK)
- Superadmin cross-tenant read: **PASS** (bypass works correctly)
- Unset-setting safe-deny: **PASS** (zero rows when no scope set)
- Application-layer Organization-IDOR: **PASS**

Production rollout (PR #28b through #28g) replicates this branch architecture.

### Rollout sequence

Note on identifiers: The "#28a–#28g" column entries below are INTERNAL PHASE
IDS for tracking sub-steps of the RLS rollout — they are NOT GitHub PR
numbers. The actual GitHub PR numbers are assigned at PR creation time. For
reference: the role bootstrap migration was merged in GitHub PR #25, the
lib verification + preflight in #26, and subsequent phases continue from
there. Cross-reference the Changelog entries for the merged GitHub PR numbers.

| PR | Sub-commit | What | Status |
|----|----|----|----|
| #23 | 0.5.3b-3a | Author migration SQL (not applied) | Completed |
| #24 | 0.5.3b-3b | Build rls-verify.ts harness + rls-test-2 fixture | Completed |
| — | 0.5.3b-3c | Apply on Supabase database branch, run rls-verify | Completed (branch test) |
| #28a | 0.5.3b-3d-a | Author kasse_app role bootstrap migration (SQL only, not applied) | Completed |
| #28b | 0.5.3b-3d-b | Verify lib/prisma.ts and lib/prismaAdmin.ts work with new role; add preflight script; add inline docs to lib files | Completed |
| #28c | 0.5.3b-3d-c | Apply kasse_app role bootstrap on production via Supabase MCP. MANUAL APPLICATION ONLY — not pipeline-triggered, since this migration creates the role that subsequent automation will rely on. The migration must run as postgres (superuser), which currently means via the Supabase MCP `apply_migration` tool or direct dashboard SQL editor. | Completed (2026-05-12) |
| #28d | 0.5.3b-3d-d | Apply RLS policies migration on production via Supabase MCP. MANUAL APPLICATION ONLY — same constraint as #28c. | Completed (2026-05-12) |
| #28e | 0.5.3b-3d-e | Stage Vercel env vars (DATABASE_URL → kasse_app, add MIGRATION_DATABASE_URL). VERIFY any CI/CD pipeline that runs `prisma migrate deploy` is configured to use MIGRATION_DATABASE_URL (postgres role), not DATABASE_URL (kasse_app role). | Completed (2026-05-12) |
| #28f | 0.5.3b-3d-f | Trigger Vercel redeployment — RLS enforcement begins | Completed (2026-05-12) |
| #28g | 0.5.3b-3d-g | Cleanup, documentation finalization. INCLUDE a process-doc entry: "All future schema migrations MUST run as postgres role via MIGRATION_DATABASE_URL. If a migration is delegated to a different role (e.g., a Supabase service account), its newly-created tables will NOT inherit the kasse_app grants set by the bootstrap migration, and kasse_app will silently lose access." | Completed (2026-05-12) |

## Production State Log

Records of production database state changes during the RLS rollout.

### 2026-05-12 — kasse_app role created (PR #28c / 0.5.3b-3d-c)

Applied via Supabase MCP `apply_migration` against project nknuonxznhshrgfseeqc.

**SQL applied:** Identical to `prisma/migrations/20260512005451_kasse_app_role/migration.sql` (PR #25, merged to main 2026-05-12).

**Pre-application state verified:**
- kasse_app role: did not exist ✓
- RLS policies count: 0 ✓
- FORCE tables count: 0 ✓
- app_set_tenant function: existed (from 20260507204234_rls_session_helpers) ✓
- All 3 prerequisite migrations applied ✓

**Post-application state verified:**
- kasse_app role: exists ✓
- rolbypassrls: false ✓ (the critical attribute — RLS will fire on this role's queries)
- rolcanlogin: true ✓
- rolsuper: false ✓
- rolcreatedb: false ✓
- rolcreaterole: false ✓
- Tables with grants: 42 (all public schema tables) ✓
- RLS helper functions granted: 6 (app_set_tenant, app_clear_tenant, app_set_actor, app_clear_actor, app_current_org_id, app_is_superadmin) ✓
- Client table CRUD privileges: all 4 (SELECT, INSERT, UPDATE, DELETE) ✓

**Password:** Set via Supabase dashboard SQL Editor (out-of-band, never in chat or source). Stored in password manager.

**Production app behavior:** UNCHANGED. App continues to connect as postgres via DATABASE_URL. The kasse_app role exists but nothing connects to it yet. Connection role switch happens in PR #28e (Vercel env var stage) and PR #28f (Vercel redeploy).

**Rollback if needed:** `DROP ROLE IF EXISTS kasse_app;` — safe because nothing connects to it. After cutover (PR #28f), rollback requires Vercel env var revert + redeploy BEFORE dropping the role.

### 2026-05-12 — RLS policies migration applied (PR #28d / 0.5.3b-3d-d)

Applied via Supabase MCP `apply_migration` against project nknuonxznhshrgfseeqc.

**SQL applied:** Identical to `prisma/migrations/20260511121142_rls_policies/migration.sql` (PR #23, merged to main 2026-05-11).

**Pre-application state verified:**
- RLS policies count: 0 ✓
- FORCE tables count: 0 ✓
- kasse_app role exists with rolbypassrls=false ✓ (from PR #27)
- app_set_tenant function: existed ✓
- app_audit_trigger function: existed ✓ (from 20260507213449_audit_log)
- All 42 public tables present ✓

**Post-application state verified:**
- Total policies: 93 ✓ (baseline: 23 × 4 + 1)
- Tables with FORCE ROW LEVEL SECURITY: 24 ✓ (23 standard + AuditLog)
- Tables with policies: 24 ✓
- Per-table breakdown:
  - 23 standard tables × 4 policies each (SELECT/INSERT/UPDATE/DELETE): Location, Staff, Client, Service, Appointment, Transaction, GiftCard, LoyaltyProgram, Membership, WaitlistEntry, Campaign, ReviewRequest, FormTemplate, PermissionSet, BusinessSettings, ImportJob, Device, ApiKey, Webhook, AiReceptionistConfig, AiReceptionistCall, Message, SavedResponse
  - 1 AuditLog table × 1 SELECT-only policy

**Production data verified intact:**
- Organization rows: 7 (unchanged)
- User rows: 7 (unchanged)
- Location rows: 4 (unchanged)

**Production app behavior:** STILL UNCHANGED. App continues to connect as postgres, which has rolbypassrls=true. The 93 policies exist but do not fire on app queries because Postgres bypasses RLS for roles with that attribute. App functions exactly as it did before PR #27.

**The cutover (PR #28f) is what activates RLS enforcement** — by switching DATABASE_URL to kasse_app (rolbypassrls=false), every app query becomes subject to these policies.

**Rollback if needed (pre-cutover):**
Run the rollback SQL from the bottom of `prisma/migrations/20260511121142_rls_policies/migration.sql` — disables RLS and drops all 93 policies. Safe before cutover because app still connects as postgres.

**Rollback if needed (post-cutover):**
Must revert Vercel DATABASE_URL/DIRECT_URL back to postgres credentials and redeploy BEFORE running rollback SQL, otherwise app loses access to its own data when RLS starts blocking unscoped queries.

### 2026-05-12 — Vercel env vars staged for cutover (PR #29 / 0.5.3b-3d-e)

Vercel environment variables updated on the Kasse project. **Production deployment NOT yet redeployed** — env vars staged for activation on next deployment.

**Env vars before this change:**
- DATABASE_URL: postgres credentials, pooler port 6543
- DIRECT_URL: postgres credentials, pooler port 6543
- (no MIGRATION_DATABASE_URL)

**Env vars after this change:**
- DATABASE_URL: **kasse_app credentials**, pooler port 6543 (`postgresql://kasse_app.nknuonxznhshrgfseeqc:[REDACTED]@aws-1-us-east-2.pooler.supabase.com:6543/postgres`)
- DIRECT_URL: **kasse_app credentials**, pooler port 6543 (same as DATABASE_URL value)
- **MIGRATION_DATABASE_URL: postgres credentials**, pooler port 6543 (preserves DDL access for future migrations via CI/CD)

All three env vars are scoped to Production, Preview, and Development environments in Vercel.

**Production app behavior at this moment:** UNCHANGED.
- Active production deployment still uses the env vars it was deployed with (postgres credentials)
- New env vars exist in Vercel project config but are NOT loaded into any running deployment yet
- RLS still not enforcing on app queries (app still connects as postgres which bypasses RLS)

**The cutover (PR #28f) is the next step.** Triggering a Vercel redeployment will cause the new deployment to load the staged env vars, the app will reconnect as kasse_app, and RLS will begin enforcing on every query.

**Rollback (pre-redeployment):** Revert the env var changes in Vercel dashboard. DATABASE_URL and DIRECT_URL back to postgres credentials. Optionally remove MIGRATION_DATABASE_URL. No code change needed.

**Rollback (post-redeployment):** Revert env vars in Vercel dashboard → trigger another redeployment to apply the reverted vars. App will reconnect as postgres on next deployment. RLS will exist on the database but won't fire (postgres bypasses).

**Critical operator note for CI/CD:**
Any future automation that runs `prisma migrate deploy` MUST use MIGRATION_DATABASE_URL, not DATABASE_URL. The kasse_app role has CRUD privileges only, not DDL. Attempting a migration as kasse_app will fail with permission errors. This is enforced by the role definition (NOBYPASSRLS, no CREATEROLE, no CREATEDB).

### 2026-05-12 — CUTOVER: RLS enforcement live in production (PR #30 / 0.5.3b-3d-f)

Triggered Vercel redeployment of the Kasse production deployment. New deployment loaded the staged env vars, app now connects as kasse_app instead of postgres. **RLS enforcement is now active on every production query.**

**Verification end-to-end:**
- Vercel deployment completed with "Ready" status
- Production homepage (`portal.kasseapp.com`) loaded normally
- Superadmin login successful (`ceo@36west.org`)
- Dashboard rendered with data — proves prismaAdmin's `app.is_superadmin=true` SET LOCAL pattern works through the kasse_app connection
- Supabase pg_stat_activity confirmed kasse_app connections active on production
- Zero application errors during or after redeployment

**Production state after cutover:**
- App connection role: kasse_app (rolbypassrls=false)
- RLS policies: 93 (firing on every query)
- FORCE ROW LEVEL SECURITY: 24 tables
- Migration role (CI/CD): postgres via MIGRATION_DATABASE_URL
- Tenant isolation: enforced at the database layer

**What this means going forward:**
- Application bugs that forget `where: { organizationId: ctx.organizationId }` will return zero rows (or fail INSERT) instead of leaking cross-tenant data
- Defense-in-depth: even if a future application bug exposes cross-tenant routes, the database refuses the query
- Compromised application credentials cannot enable cross-tenant data access without ALSO compromising the session-variable signal (set per-transaction via SET LOCAL)
- All 6 RLS-aware test scenarios from rls-verify.ts now apply to production

**Rollback procedure (if a problem surfaces post-cutover):**
1. Vercel dashboard → Environment Variables
2. Revert DATABASE_URL and DIRECT_URL back to postgres credentials (saved value before PR #29)
3. Optionally remove MIGRATION_DATABASE_URL (or leave it — does no harm)
4. Trigger Vercel redeployment with reverted env vars
5. App reverts to postgres connection in ~60 seconds
6. RLS policies remain on database but do not fire because postgres has rolbypassrls=true
7. ~5 minutes total to fully revert

## Changelog

| Phase | Change |
|-------|--------|
| 0.5.3b-1 | Initial classification: 15 TENANT_SCOPED, 2 TENANT_SCOPED_PENDING, 14 BYPASS_NEEDED, 0 UNDECIDED |
| 0.5.3b-1b | Migrated clients/[id] and staff/[id] to tenant context; both moved to TENANT_SCOPED. Final: 17 TENANT_SCOPED, 14 BYPASS_NEEDED. |
| 0.5.3b-2a | Built lib/prismaAdmin.ts. Migrated lib/auth.ts (NextAuth credentials + adapter) and 5 PRE_SESSION auth routes (register, forgot-password, reset-password, verify-email, [...nextauth] via lib/auth.ts) to prismaAdmin. Foundation now distinguishes tenant-scoped from bypass clients deliberately. |
| 0.5.3b-2a-fix | Reviewer-driven correction of prismaAdmin: switched from connection-level SET to transaction-scoped SET LOCAL to prevent is_superadmin leaking across pooled connections. Hardened verify-email redirect against host-header spoofing. Documented $queryRaw/$executeRaw caveat. |
| 0.5.3b-2b | Migrated 5 SUPERADMIN admin routes (stats, merchants, merchants/[orgId], users, users/[userId]) to prismaAdmin. Built requireSuperadminContext + withAdminScope helpers. Audit triggers now correctly capture the actor (superadmin user) without binding to a tenant scope. |
| 0.5.3b-2c | Reclassified onboarding routes. Three are TENANT_SCOPED (users have orgId from registration); migrated to requireTenantContext + withTenantScope + ORGANIZATION_ONBOARDING_ALLOWED_FIELDS for KYC/banking writes. Multi-write steps now atomic. One route (template) reclassified to new PUBLIC_STATIC bucket. The ONBOARDING bypass bucket is now empty by design. |
| 0.5.3b-3a | Authored RLS migration SQL for 24 tables. Not applied. |
| 0.5.3b-3a-fix | Reviewer fix: added FORCE ROW LEVEL SECURITY to every table (required because app connects as `postgres` which has rolbypassrls=TRUE). Added role analysis comment. Strengthened AuditLog operational hazard comment. Updated rollback instructions. Added RLS Migration Status section. |
| 0.5.3b-3a-fix2 | Reviewer documentation hardening: explicitly documented service_role bypass gap (Kasse doesn't use service_role today; standing rule that future use requires doc update + SEVERE flag in code review). Expanded Organization "no RLS" rationale to make clear it's load-bearing app logic. Added FamilyMember to child-table list. No migration SQL changes — SQL is correct as-is. |
| 0.5.3b-3b | Built rls-verify.ts (two-mode harness) + rls-test-2 fixture. Eight named test scenarios total: mode detection, policy count verification, cross-tenant read, cross-tenant write, cross-tenant UPDATE org-change, superadmin cross-tenant read, unset-setting safe-deny (six DB-level), plus app-layer Organization-IDOR. App-layer test runs in both RLS_NOT_APPLIED and RLS_APPLIED modes; DB-level tests run only in RLS_APPLIED. |
| 0.5.3b-3b-fix | Reviewer corrections: replaced RESET ALL with targeted RESET to avoid search_path side effects; removed dead unscoped query before cross-tenant read test; split cross-tenant UPDATE test into separate setup/test try/catches so setup failures SKIP rather than false-PASS; moved Organization-IDOR test out of RLS-gated path (runs in both modes); scrubbed plaintext passwords from seed stdout (audit-test + rls-test); added explanatory comment on as-unknown-as cast; corrected README summary counts. |
| 0.5.3b-3c | Branch verification: applied all migrations to Supabase branch. Discovered FORCE ROW LEVEL SECURITY does not override rolbypassrls — postgres role bypasses RLS despite FORCE. Created kasse_app role (NOBYPASSRLS) on branch; re-ran rls-verify as kasse_app: 9 PASS, 0 FAIL. This proved the role-split architecture is the correct fix. |
| 0.5.3b-3d-a | Authored kasse_app role bootstrap migration. Idempotent CREATE ROLE with NOBYPASSRLS. Grants schema/tables/sequences/functions privileges. Sets default privileges for future Prisma migrations. Documented role-split architecture, env var architecture, and the branch test that confirmed RLS enforcement works with NOBYPASSRLS connections. Not yet applied to any database — applies in PR #28c. |
| 0.5.3b-3d-b | Verified lib/prisma.ts and lib/prismaAdmin.ts have no hardcoded role assumptions — both read DATABASE_URL via env vars only. Added inline header comments documenting the role-split contract: lib/prisma.ts is the tenant-scoped path, lib/prismaAdmin.ts is the superadmin path (same connection, session-variable signal). Added scripts/preflight-rls-cutover.ts and `npm run preflight:cutover` — a pre-cutover sanity check that any operator can run before PR #28c through #28f to confirm the environment is in the expected state. Documentation only — no code logic changes, no migration changes. |
| 0.5.3b-3d-c | Applied kasse_app role bootstrap to production via Supabase MCP. Verified all role attributes correct (rolbypassrls=false), 42 tables granted, 6 functions executable. Password set out-of-band via Supabase dashboard. No app behavior change — role exists, nothing connects to it yet. Production State Log section added. |
| 0.5.3b-3d-d | Applied RLS policies migration to production via Supabase MCP. Verified 93 policies and 24 FORCE entries on production. Production data counts unchanged (7 orgs, 7 users, 4 locations). No app behavior change — app still connects as postgres which has rolbypassrls=true and bypasses RLS. Policies will begin enforcing at PR #28f cutover when DATABASE_URL switches to kasse_app. |
| 0.5.3b-3d-e | Staged Vercel env vars for cutover. DATABASE_URL and DIRECT_URL changed to kasse_app credentials. New MIGRATION_DATABASE_URL added pointing at postgres for future migrations. No redeployment triggered — env vars saved but not loaded into running deployment. Production app behavior unchanged until PR #28f redeploy. |
| 0.5.3b-3d-f | CUTOVER: Triggered Vercel redeployment. App now connects as kasse_app. RLS enforcing on every production query. Verified end-to-end via superadmin login + dashboard data load + pg_stat_activity confirmation of kasse_app connections. Zero errors. |
| 0.5.3b-3d-g | Phase 0.5.3b complete. RLS rollout finished. Documentation finalized. |

---

# Phase 0.6 — Banking PII Hardening

This phase addresses encryption-at-rest and email-redaction for banking and KYC fields stored on the Organization table. Per SD-K-008 (KASSE_STRATEGIC_DECISIONS.md), HIPAA-adjacent and sensitive financial data must be encrypted at the column level. Phase 0.5.3b (RLS) addressed *access control* — Phase 0.6 addresses *encryption*.

## Phase 0.6 Status: IN PROGRESS

| Sub-phase | What | Status |
|-----------|------|--------|
| 0.6-a | Redact banking PII in application submission email (lib/redact.ts + onboarding/complete route) | In Progress (this PR) |
| 0.6-b | Architecture decision: Payroc tokenization vs KMS encryption for banking fields | Pending (awaiting Christopher Boutwell confirmation on Payroc bank tokenization API) |
| 0.6-c | Implement at-rest encryption for sensitive Organization fields | Pending |
| 0.6-d | Audit log every decryption operation | Pending |
| 0.6-e | Admin Application Detail view (gated, audit-logged access to decrypted PII) | Pending |

## Phase 0.6 Changelog

| Sub-phase | Change |
|-----------|--------|
| 0.6-a | Created lib/redact.ts with masking utilities. Modified app/api/onboarding/complete/route.ts to redact routing number, EIN, and account holder name in application submission email. Added PII-redacted notice block to email body. No database schema changes. No change to data stored on Organization table. |

---

## Pending Classifications for Future Routes

### Reyna Pay engine routes (Phase 0.9 / Tier 2 of REYNA_PAY_API_SPEC.md)

Tier 2 of `docs/REYNA_PAY_API_SPEC.md` will define resource endpoints for the Reyna Pay engine: charges, refunds, voids, bank tokens, payouts, customers, merchants, disputes, checkout sessions, transactions, reports. These endpoints will be implemented in the SalonTransact codebase (separate repo, lendbucket/salontransact), NOT in this Kasse repo.

However, Kasse will add corresponding consumer-side handlers and clients in `lib/engine/*` and potentially in `app/api/webhooks/reyna-pay/route.ts` to call those engine endpoints. Each such consumer-side route or handler added to the Kasse codebase MUST be classified in this RLS_AUDIT.md document at the time the PR creating it merges.

When Tier 2 of REYNA_PAY_API_SPEC.md publishes, this section should be expanded to list each anticipated Kasse-side consumer route with its planned classification, so PRs that add the routes can reference the pre-planned classification rather than deriving it under deadline pressure.

For now: no Kasse-side consumer routes for Reyna Pay engine endpoints exist. This forward-note tracks the gap.

---

## P0.A.13 Deployment Notes — Organization Group Hierarchy

The P0.A.13 schema migrations (OrganizationGroup table + Location.groupId +
organizationId column + RLS policies) were applied to production via
Supabase MCP across multiple sessions. The rollup file at
prisma/migrations/20260514220000_p0_a_13_organization_group_hierarchy/
reflects the final production state.

On the next clean environment (e.g., a new staging instance), run:

    npx prisma migrate resolve --applied 20260514220000_p0_a_13_organization_group_hierarchy

to mark the migration as already-applied without re-running it. This
prevents the next `prisma migrate deploy` from attempting to re-create
the type/table/RLS policies and failing with "already exists" errors.

The _prisma_migrations table in production has three pre-rollup entries
(20260514220000_..., 20260514230000_..., 20260515000000_...) with empty
checksums. These are technical debt to clean up in a future housekeeping
PR — they don't block deploys, but the names don't match any file in
prisma/migrations/. The new rollup file's name matches the first entry.

## P0.A.14 — Audit Log Writes via prismaAdmin

The `writeAuditLog` helper in `lib/audit/write.ts` uses `prismaAdmin` (RLS bypass)
to insert audit records. This is the same cross-cutting infrastructure pattern as
the NextAuth session-callback write path — audit logging is platform-wide and must
succeed regardless of whether the caller's session has tenant context.

The helper is fail-soft: errors are caught and logged to console but never thrown.
An audit-write failure does NOT block or roll back the main mutation. Writes happen
AFTER the main mutation succeeds, outside any transaction.

Routes that call `writeAuditLog` (P0.A.14):
- `POST /api/permission-sets` — permission_set.create
- `PATCH /api/permission-sets/[id]` — permission_set.update
- `DELETE /api/permission-sets/[id]` — permission_set.delete
- `PATCH /api/users/[id]` — user.custom_role.assign / unassign
- `POST /api/organization-groups` — organization_group.create
- `PATCH /api/organization-groups/[id]` — organization_group.update
- `DELETE /api/organization-groups/[id]` — organization_group.delete

These routes remain classified as TENANT_SCOPED in the route table above — the
main mutation still uses `withTenantScope(prisma, ...)`. Only the audit side-write
uses `prismaAdmin`.

## P0.A.1 Deployment Notes

The 20260513204427_add_role_enum migration was applied to production
Supabase project nknuonxznhshrgfseeqc via the Supabase MCP, bypassing
the Prisma CLI. As a result, the migration is not yet recorded in the
_prisma_migrations table.

Before running `npx prisma migrate deploy` in any environment that
was migrated this way, the migration row must be manually inserted:

    INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
    VALUES (gen_random_uuid()::text, '<sha256-of-migration-sql>', NOW(), '20260513204427_add_role_enum', NOW(), 1);

All P0 migrations must be applied via the postgres superuser role
(DDL operations require CREATE TYPE / ALTER TABLE privileges that
the application runtime role does not have).

## Security advisor pass — 2026-05-16

Initial Supabase security advisor audit on the tenant/audit helper functions
found 19 WARN-level findings, all addressed in migration
`20260516180000_p0_security_lock_search_path_and_revoke_public`:

- **9 mutable search_path warnings** — fixed by `SET search_path = ''` on every helper function. Prevents function-name-resolution attacks where a privileged caller could resolve `app_*` references to attacker-supplied tables in their own search_path.
- **10 SECURITY DEFINER callable-by-PUBLIC warnings** — fixed by `REVOKE EXECUTE ... FROM PUBLIC` on the 5 mutating functions (app_set_tenant, app_clear_tenant, app_set_actor, app_clear_actor, app_audit_trigger). Without this, a malicious user could call `/rest/v1/rpc/app_set_tenant('victim-org-id', true)` to elevate themselves to superadmin in another tenant's RLS context.
- The read-only helpers (app_current_org_id, app_is_superadmin, app_actor_user_id, app_request_id) keep PUBLIC EXECUTE since they only return the caller's own session variables.
- The `kasse_app` Prisma connection role keeps EXECUTE on all mutating functions via explicit GRANT — app code unaffected.
- Post-migration: `get_advisors(type='security')` returns ZERO findings.

## P0.G.1 Tables — RLS Classification (2026-05-18)

All 7 new tables from P0.G PR 1 have RLS ENABLED + FORCE ROW LEVEL SECURITY + tenant_isolation policies.

| Table | Scoping Strategy | Policy |
|-------|-----------------|--------|
| `ServiceLocation` | JOIN via `Service.organizationId` | EXISTS subquery on Service |
| `ServiceStaffOverride` | JOIN via `Service.organizationId` | EXISTS subquery on Service |
| `StylistService` | JOIN via `Staff.organizationId` | EXISTS subquery on Staff |
| `ColorFormula` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `ConsentSignature` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `StylistSchedule` | JOIN via `Staff.organizationId` | EXISTS subquery on Staff |
| `StylistScheduleException` | JOIN via `Staff.organizationId` | EXISTS subquery on Staff |

All tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P0.G.1 Helper Functions

The following helpers in `lib/` require TENANT_SCOPED context (must be called inside `withTenantScope`):

| Helper | Module | Purpose |
|--------|--------|---------|
| `getServicePriceForBooking` | `lib/services/pricing` | Resolves effective price with staff > location > base override priority |
| `getServiceDurationForBooking` | `lib/services/pricing` | Resolves effective duration + buffer + processing |
| `resolveStylistAvailability` | `lib/scheduling/availability` | Resolves schedule for a date (exception > schedule > none) |
| `getClientFormulaHistory` | `lib/formulas/history` | Returns formula history for a client, newest first |
| `nextFormulaVersionForClient` | `lib/formulas/history` | Auto-increments formula version per client |
| `softDeleteClient` | `lib/clients/soft-delete` | Sets softDeletedAt + writes audit log entry |

All helpers take `tx: Prisma.TransactionClient` as first argument. Future route authors: do NOT import bare prisma into route code. Pass the scoped `tx` from `withTenantScope`.
