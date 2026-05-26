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
| `/api/onboarding/location` | POST | Creates first Location during onboarding; uses `withTenantScope` after JWT refresh provides organizationId. OnboardingSession writes via prismaAdmin (RLS requires superadmin for those tables). (P1.A.3b) |
| `/api/onboarding/agreements` | POST | Creates DRAFT EmploymentAgreement rows for all staff at org+location during onboarding; dual-client (EmploymentAgreement writes via withTenantScope tx; OnboardingSession state via prismaAdmin in sessions.ts helpers AFTER tenant tx commits). (P1.A.6) |

### BYPASS_NEEDED — PRE_SESSION (public, no session required)

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/auth/[...nextauth]` | GET, POST | PRE_SESSION (delegates entirely to lib/auth.ts which uses prismaAdmin; no direct DB calls in the route file) |
| `/api/auth/register` | POST | Creates user + org + business settings via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |
| `/api/auth/forgot-password` | POST | Sets password reset token via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |
| `/api/auth/reset-password` | POST | Validates reset token, hashes new password via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |
| `/api/auth/verify-email` | GET | Validates email verification token via prismaAdmin (PRE_SESSION — migrated 0.5.3b-2a) |
| `/api/onboarding/email` | POST | Sends magic-link verification email via prismaAdmin (PRE_SESSION — P1.A.2) |
| `/api/onboarding/verify` | POST | Consumes verification token, transitions to EMAIL_VERIFIED via prismaAdmin (PRE_SESSION — P1.A.2) |
| `/api/onboarding/password` | POST | Creates User row with password hash, transitions to ACCOUNT_CREATED via prismaAdmin (PRE_SESSION — P1.A.2) |

### BYPASS_NEEDED — SELF_READ (authenticated user reads own row)

Routes that use `prismaAdmin` to read the authenticated user's OWN row (via `session.user.id` from NextAuth). RLS isn't bypassed for tenant data — the query is naturally scoped to a single user the caller has already proven they own. The justification for `prismaAdmin` here is operational, not architectural: these routes need to read user fields like organizationId and role that may not yet be reflected in the JWT (post-org-create staleness window), so they cannot rely on `session.user.organizationId` to scope a tenant query.

**Security property**: `session.user.id` is server-verified by NextAuth. The query uses `where: { id: session.user.id }` exclusively — no other filter, no other access. The user can only read their own row.

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/onboarding/refresh-session` | POST | Returns the caller's current organizationId, role, locationId for JWT refresh (SELF_READ — P1.A.3) |

**Rate limit caveat**: refresh-session has a per-user 30-second rate limit implemented in-memory. Per-instance state means a multi-instance Vercel deployment can allow up to N concurrent calls per window (N = warm instances). This is acceptable DoS hardening for an onboarding-only endpoint with low blast radius; the rate limit is best-effort, not a security boundary. For production hardening at scale, replace with a shared store (Redis / Supabase row counter).

This bucket persists past P1.A.3b (the location-route TENANT_SCOPED flip that closes most ORG_BOOTSTRAP usage). refresh-session stays because the JWT staleness scenario isn't unique to onboarding.

### BYPASS_NEEDED — SELF_WRITE (authenticated user writes own row)

Same security property as SELF_READ but for write operations. Routes that
use `prismaAdmin` to create or update a row belonging to the authenticated
user, with the row scoped by `session.user.id` exclusively. Justification
for `prismaAdmin`: the data being written is cross-tenant (legal records,
account-level state) and not part of any specific organization's tenant
scope.

**Security property**: `session.user.id` is server-verified by NextAuth.
The query writes a row with `userId: session.user.id` exclusively — the
caller cannot write a row attributed to another user.

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/terms/accept` | POST | Creates TermsAcceptance row for caller (SELF_WRITE — P1.A.10). Cross-tenant legal record, not org-scoped. |

### BYPASS_NEEDED — ORG_BOOTSTRAP (authenticated, no org yet)

Used during the bootstrap window of onboarding for one operation: org-create (no org exists yet, so `withTenantScope` has no tenant to scope by). The bootstrap call uses `prismaAdmin` because there's no tenant context. Ownership is verified via the OnboardingSession row (session.userId must match the authenticated caller). Mandatory audit logging of the bootstrap event.

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/onboarding/org` | POST | Creates Organization + BusinessSettings + links User as OWNER via prismaAdmin (ORG_BOOTSTRAP — P1.A.3). The ONLY legitimate non-admin Organization.create in the codebase. |

**P1.A.3b update**: `/api/onboarding/location` was moved from ORG_BOOTSTRAP to TENANT_SCOPED. The JWT refresh foundation (`/api/onboarding/refresh-session` + jwt callback `trigger === "update"`) now provides the organizationId in the JWT before location-create is called.

**Not in this bucket**: POST /api/onboarding/refresh-session — see SELF_READ section above. It uses prismaAdmin to read the caller's own user row, not to bypass tenant scope for cross-tenant writes.

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

### CRON — Scheduled platform tasks (no user session)

Routes invoked only by Vercel Cron (or equivalent scheduled trigger). Protected via shared secret in the Authorization header (compared with `timingSafeEqual` against `CRON_SECRET`). No user session, no tenant context. Uses `prismaAdmin` because the operations are platform-wide (retention sweeps, integrity checks, etc.).

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/cron/audit-retention` | POST | Deletes tenant audit rows older than 730 days; preserves platform rows. Uses prismaAdmin. |
| `/api/cron/onboarding-abandoned` | GET | Hourly sweep for sessions abandoned >24h; sends one-shot recovery email via Resend. Uses prismaAdmin (cross-tenant); claim-then-send via updateMany prevents double-send. See P1.B.6 + P1.B.7 section below. |
| `/api/cron/onboarding-janitor` | GET | 5-minute sweep for OnboardingSessions stuck in *_PENDING states. Log-only (no automated recovery yet). Uses prismaAdmin. |

### PUBLIC_STATIC — No auth, no database

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/onboarding/template` | GET | Serves hardcoded CSV templates; no auth, no DB. Code unchanged. |

## Summary

- TENANT_SCOPED: **34**
- BYPASS_NEEDED: **20**
  - PRE_SESSION: **9** (auth handlers + NextAuth + 3 onboarding pre-account routes + staff invite accept)
  - SELF_READ: **1** (refresh-session — authenticated user reads own row)
  - ORG_BOOTSTRAP: **1** (onboarding org-create — authenticated but no org yet)
  - SUPERADMIN: **9** (admin portal operations — 5 original + 3 feature-flag routes + 1 audit-logs route)
- CRON: **3** (audit retention + onboarding janitor + onboarding abandoned, CRON_SECRET protected)
- PUBLIC_STATIC: **1** (static endpoints with no auth or tenant context)
- UNDECIDED: **0**

**Total routes: 58**

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

## Migration Pattern Note

All schema migrations from P0.G onward are applied via Supabase MCP (`apply_migration` tool)
and recorded locally in `prisma/migrations/` as the source-of-truth DDL file. Prisma does NOT
execute these migrations — `prisma db pull` syncs the schema.prisma from the live DB. This
pattern is intentional: Supabase is the single deployment target, and the MCP tool provides
transactional guarantees.

## P0.G.2 Tables — RLS Classification (2026-05-18)

All 5 new tables from P0.G PR 2 have RLS ENABLED + FORCE ROW LEVEL SECURITY + tenant_isolation policies.

| Table | Scoping Strategy | Policy |
|-------|-----------------|--------|
| `AppointmentItem` | JOIN via `Appointment.organizationId` | EXISTS subquery on Appointment |
| `RecurringSeries` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `CancellationPolicy` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `BookingWindow` | Two-hop via `Location.organizationId` (no direct orgId column) | EXISTS subquery on Location |
| `AppointmentStatusHistory` | JOIN via `Appointment.organizationId` | EXISTS subquery on Appointment |

All tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P0.G.2 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `createAppointmentWithItems` | `lib/appointments/booking` | Atomic appointment + items + status history + audit |
| `updateAppointmentStatus` | `lib/appointments/booking` | Status change with audit trail + auto-timestamps |
| `resolveCancellationPolicy` | `lib/booking/cancellation-policy` | SERVICE > LOCATION > ORG > DEFAULT priority resolution |
| `calculateCancellationFee` | `lib/booking/cancellation-policy` | FIXED/PERCENTAGE fee math with no-show vs window logic |
| `validateBookingWindow` | `lib/booking/validation` | Checks all per-location booking window constraints |
| `staffCanPerformService` | `lib/booking/validation` | StylistService link check |
| `hasTimeConflict` | `lib/booking/validation` | Overlap detection on stylist schedule items |
| `nextOccurrenceDate` | `lib/recurring/generate` | Frequency-aware date math |
| `generateNextOccurrences` | `lib/recurring/generate` | Idempotent batch generation for recurring series |

## P0.G.3 Tables — RLS Classification (2026-05-18)

All 10 new tables from P0.G PR 3 have RLS ENABLED + FORCE ROW LEVEL SECURITY + tenant_isolation policies.

| Table | Scoping Strategy | Policy |
|-------|-----------------|--------|
| `Chair` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `DevicePairing` | JOIN via `Chair.organizationId` | EXISTS subquery on Chair |
| `Cart` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `CartItem` | JOIN via `Cart.organizationId` | EXISTS subquery on Cart |
| `Order` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `OrderItem` | JOIN via `Order.organizationId` | EXISTS subquery on Order |
| `Payment` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `Refund` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `OfflineQueue` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `GeolocationLog` | Direct `organizationId` column | Direct match on `app.current_org_id` |

All tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P0.G.3 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `createCartForAppointment` | `lib/carts/lifecycle` | Creates cart with realtime channel ID (SD-K-028) |
| `addCartItem` | `lib/carts/lifecycle` | Adds item + recomputes totals atomically |
| `recomputeCartTotals` | `lib/carts/lifecycle` | Single source of truth for cart math |
| `voidCart` | `lib/carts/lifecycle` | Soft cancel with audit log |
| `finalizeCartToOrder` | `lib/orders/finalize` | Atomic Cart→Order conversion with per-location numbering |
| `recordPaymentOnOrder` | `lib/orders/finalize` | Incremental payment with status transitions |
| `checkGeolocationAndLog` | `lib/geolocation/check` | Haversine distance check + always-log pattern (SD-K-030) |
| `pairCustomerDisplayToChair` | `lib/devices/pairing` | Chair pairing with role enforcement (SD-K-016) |
| `getActiveCustomerDisplay` | `lib/devices/pairing` | Lookup current chair pairing |

## P0.G.4 Tables — RLS Classification (2026-05-18)

All 17 new tables from P0.G PR 4 have RLS ENABLED + FORCE ROW LEVEL SECURITY + tenant_isolation policies.

| Table | Scoping Strategy | Policy |
|-------|-----------------|--------|
| `Compensation` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `TipSplit` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `TipDistribution` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `TaxRate` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `ProductCategory` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `Product` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `ProductVariant` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `InventoryLevel` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `InventoryDeduction` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `InventoryReorderDraft` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `EmploymentAgreement` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `PtoRequest` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `BackgroundCheck` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `LicenseVerification` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `EmailTemplate` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `MarketingAutomation` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `MarketingExecution` | Direct `organizationId` column | Direct match on `app.current_org_id` |

All tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P0.G.4 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `computeSplit` | `lib/tips/distribute` | Pure tip split computation (PRIMARY_ONLY, TIME_BASED, REVENUE_RATIO) |
| `distributeTipForAppointment` | `lib/tips/distribute` | DB version: persist TipDistribution rows + audit |
| `recordInventoryDeduction` | `lib/inventory/deduct` | Create deduction + update InventoryLevel atomically |
| `calculateTaxCents` | `lib/tax/calculate` | Pure tax math (subtotal * rate, rounded) |
| `getActiveTaxRate` | `lib/tax/calculate` | Look up effective tax rate for a location |
| `findExpiringLicenses` | `lib/hcm/license` | Find ACTIVE licenses expiring within N days |

**NOTE:** The helpers listed above are TENANT_SCOPED (require `withTenantScope` context). When future API routes are wired to call these helpers, those routes must be classified in this audit doc as TENANT_SCOPED. This applies especially to:

- POST/PUT routes for tip distribution
- Inventory deduction routes
- Tax rate management routes
- License verification cron jobs

## P0.H.2 Tables — RLS Classification (2026-05-18)

Both tables are PLATFORM_SCOPED (not tenant-scoped). They do not have an `organizationId`
column. Access is controlled by role-based RLS policies using `is_current_user_superadmin()`,
a SECURITY DEFINER function that queries the User table via `app.actor_user_id`.

| Table | Scoping Strategy | Read Policy | Write Policy |
|-------|-----------------|-------------|--------------|
| `FeatureFlag` | PLATFORM_SCOPED | `featureflag_read`: SELECT allowed for all (`USING (true)`) so `evaluateFlag()` works without elevation | `featureflag_write_superadmin` / `featureflag_update_superadmin` / `featureflag_delete_superadmin`: SUPERADMIN only via `is_current_user_superadmin()` |
| `FeatureFlagAudit` | PLATFORM_SCOPED | `featureflagaudit_read_superadmin`: SELECT SUPERADMIN only | `featureflagaudit_write_superadmin` / `featureflagaudit_update_superadmin` / `featureflagaudit_delete_superadmin`: SUPERADMIN only via `is_current_user_superadmin()` |

Both tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P0.H.2 SECURITY DEFINER Function

`is_current_user_superadmin()` — looks up the User's role via `app.actor_user_id` session
variable (set by `app_set_actor`). Returns true only if the user's role is `SUPERADMIN`.
`REVOKE EXECUTE FROM PUBLIC` applied; `GRANT EXECUTE TO kasse_app` applied.
`SET search_path = ''` applied per standing security rule.

### P0.H.2 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/admin/feature-flags` | GET, POST | BYPASS_NEEDED — SUPERADMIN | Lists/creates feature flags; uses `requireSuperadminContext` + `withAdminScope(prismaAdmin, ...)` |
| `/api/admin/feature-flags/[id]` | GET, PATCH | BYPASS_NEEDED — SUPERADMIN | Reads/updates individual flag + audit log; uses `requireSuperadminContext` + `withAdminScope(prismaAdmin, ...)` |
| `/api/admin/feature-flags/[id]/overrides` | POST | BYPASS_NEEDED — SUPERADMIN | Sets/removes per-org overrides; uses `requireSuperadminContext` + `withAdminScope(prismaAdmin, ...)` |

### P0.H.2 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `computeFlagBucket` | `lib/feature-flags/hash` | Stable sha256-based 0-99 bucket per (flag, org) pair |
| `evaluateFlag` | `lib/feature-flags/evaluate` | Single flag evaluation: MISSING > INACTIVE > OVERRIDE > ROLLOUT > DEFAULT |
| `evaluateFlags` | `lib/feature-flags/evaluate` | Batch evaluation, single DB query |
| `createFlag` | `lib/feature-flags/admin` | Create flag + write CREATE audit entry |
| `updateFlag` | `lib/feature-flags/admin` | Update flag + write typed audit entry |
| `setFlagOverride` | `lib/feature-flags/admin` | Set/remove per-org override + write audit entry |

The evaluate helpers are called inside `withTenantScope` in the dashboard layout for
flag hydration. The admin helpers are called inside `withAdminScope` in admin API routes.

## P0.I.1 Tables — RLS Classification (2026-05-18)

Both new tables from P0.I PR 1 have RLS ENABLED + FORCE ROW LEVEL SECURITY + tenant_isolation policies.

| Table | Scoping Strategy | Policy |
|-------|-----------------|--------|
| `CustomFieldDefinition` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `CustomFieldValue` | Direct `organizationId` column | Direct match on `app.current_org_id` |

Both tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P0.I.1 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/custom-fields/definitions` | GET, POST | TENANT_SCOPED | Lists/creates definitions; uses `requireTenantContext` + `withTenantScope`; POST restricted to OWNER/MANAGER/SUPERADMIN |
| `/api/custom-fields/definitions/[id]` | PATCH, DELETE | TENANT_SCOPED | Updates/soft-deletes definitions; uses `requireTenantContext` + `withTenantScope`; restricted to OWNER/MANAGER/SUPERADMIN |

### P0.I.1 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `createDefinition` | `lib/custom-fields/definitions` | Create field definition + audit log |
| `updateDefinition` | `lib/custom-fields/definitions` | Update definition (immutable key/fieldType/targetEntity) + audit log |
| `softDeleteDefinition` | `lib/custom-fields/definitions` | Soft-delete definition + audit log |
| `listDefinitions` | `lib/custom-fields/definitions` | List active definitions by org + targetEntity |
| `validateValue` | `lib/custom-fields/validate` | Type-discriminated validation with rule enforcement |
| `setValue` | `lib/custom-fields/values` | Upsert single field value with validation |
| `setValues` | `lib/custom-fields/values` | Batch upsert with all-or-nothing validation + required field check |
| `getValues` | `lib/custom-fields/values` | Read all custom field values for an entity |
| `deleteValue` | `lib/custom-fields/values` | Remove a value (field cleared) |

## P1.A.1 Tables — RLS Classification (2026-05-18)

Both new tables from P1.A.1 have RLS ENABLED + FORCE ROW LEVEL SECURITY. These are SUPERADMIN_PROTECTED tables (same pattern as FeatureFlag/FeatureFlagAudit): all writes go through `prismaAdmin` helpers; DB-level policies restrict to SUPERADMIN only for writes.

| Table | Scoping Strategy | Read Policy | Write Policy |
|-------|-----------------|-------------|--------------|
| `OnboardingSession` | PRE_ACCOUNT (no orgId initially) | Session owner (`userId` = `app.actor_user_id`) OR SUPERADMIN | SUPERADMIN only |
| `OnboardingStateTransition` | JOIN via OnboardingSession | SUPERADMIN only | SUPERADMIN only |

Both tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

**Deployment note:** The migration includes `GRANT ... TO kasse_app` statements that require the `postgres` role (the migration role), not `kasse_app`. When running `prisma migrate deploy` in CI/CD, ensure `MIGRATION_DATABASE_URL` is set (postgres-role connection), not just `DATABASE_URL` (kasse_app-role connection). Same pattern as P0.I PR 2 (Tags).

### P1.A.1 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `getOrCreateSession` | `lib/onboarding/sessions` | Idempotent session entry point |
| `getSessionById` | `lib/onboarding/sessions` | Direct lookup |
| `getSessionByEmail` | `lib/onboarding/sessions` | Find active session by email |
| `transitionTo` | `lib/onboarding/sessions` | Forward-only state transition + audit |
| `skipStep` | `lib/onboarding/sessions` | Skip a skippable step |
| `patchData` | `lib/onboarding/sessions` | Save scratch data without state change |
| `linkResource` | `lib/onboarding/sessions` | Attach userId/orgId/locationId |
| `signResumeToken` | `lib/onboarding/resume-token` | Issue JWT resume token |
| `verifyResumeToken` | `lib/onboarding/resume-token` | Verify + load session from token |

## P0.I.3 — Audit Extension (2026-05-18)

No new tables. Added performance indexes on existing AuditLog table:
- `idx_auditlog_action` on `action`
- `idx_auditlog_request` on `requestId` (partial: WHERE requestId IS NOT NULL)

### P0.I.3 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/admin/audit-logs` | GET | BYPASS_NEEDED — SUPERADMIN | Cross-tenant audit query; uses `requireSuperadminContext` + `prismaAdmin` via `queryAuditLogs` |
| `/api/cron/audit-retention` | POST | CRON | Protected by CRON_SECRET bearer token; uses `prismaAdmin` for retention sweep |

### P0.I.3 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `queryAuditLogs` | `lib/audit/query` | SUPERADMIN cross-tenant query with full filter set + pagination |
| `queryAuditLogsForTenant` | `lib/audit/query` | Tenant-scoped query (forces organizationId) |
| `getEntityAuditTrail` | `lib/audit/query` | Entity-specific audit history |
| `runAuditRetention` | `lib/audit/retention` | Delete tenant rows older than 730 days; preserves platform rows |

### P0.I.3 Notes

- Query helpers use `prismaAdmin` (RLS bypass) because audit logs are platform-level data
- Tenant-scoped reads via `queryAuditLogsForTenant` enforce org scope in the where clause
- Retention sweep runs as platform-level via `prismaAdmin` — bypasses RLS intentionally
- Cron route built but NOT yet registered in vercel.json — registration is a deployment step

## P0.I.2 Tables — RLS Classification (2026-05-18)

Both new tables from P0.I PR 2 have RLS ENABLED + FORCE ROW LEVEL SECURITY + tenant_isolation policies.

| Table | Scoping Strategy | Policy |
|-------|-----------------|--------|
| `Tag` | Direct `organizationId` column | Direct match on `app.current_org_id` |
| `EntityTag` | Direct `organizationId` column | Direct match on `app.current_org_id` |

Both tables granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P0.I.2 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/tags` | GET, POST | TENANT_SCOPED | Lists/creates tags; uses `requireTenantContext` + `withTenantScope`; POST restricted to OWNER/MANAGER/SUPERADMIN |
| `/api/tags/[id]` | PATCH, DELETE | TENANT_SCOPED | Updates/soft-deletes tags; uses `requireTenantContext` + `withTenantScope`; restricted to OWNER/MANAGER/SUPERADMIN |

### P0.I.2 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `createTag` | `lib/tags/definitions` | Create tag + audit log |
| `updateTag` | `lib/tags/definitions` | Update tag (updateMany with org guard) + audit log |
| `softDeleteTag` | `lib/tags/definitions` | Soft-delete tag + audit log |
| `listTags` | `lib/tags/definitions` | List active tags by org |
| `attachTag` | `lib/tags/attach` | Idempotent tag attachment via upsert |
| `detachTag` | `lib/tags/attach` | Remove tag from entity |
| `setTagsForEntity` | `lib/tags/attach` | Diff-based bulk replace (add missing, remove extra) |
| `getTagsForEntity` | `lib/tags/attach` | Get tags for a single entity (filters inactive/deleted) |
| `getEntitiesForTag` | `lib/tags/attach` | Get entity IDs for a tag |
| `getTagsForEntities` | `lib/tags/attach` | Bulk-load tags for many entities (N+1 prevention) |

## P0.H.3 Column Additions — RLS Note (2026-05-18)

Two columns added to existing tables:

| Table | Column | Type | RLS Impact |
|-------|--------|------|-----------|
| `User` | `locale` | TEXT (nullable) | Inherits existing User table policies (auth tables, accessed via prismaAdmin) |
| `Organization` | `defaultLocale` | TEXT NOT NULL DEFAULT 'en-US' | Inherits existing Organization policies (app-logic protected, not RLS-scoped — see Organization note in Tables NOT covered section) |

No new RLS policies needed. The locale fields are read via `prismaAdmin` in `i18n/request.ts`
(runs outside tenant scope during locale detection, before withTenantScope is established).

## P1.A.2 Tables — RLS Classification (2026-05-18)

One new table from P1.A.2 has RLS ENABLED + FORCE ROW LEVEL SECURITY. Same SUPERADMIN_PROTECTED pattern as OnboardingSession from P1.A.1.

| Table | Scoping Strategy | Read Policy | Write Policy |
|-------|-----------------|-------------|--------------|
| `OnboardingVerificationToken` | PRE_ACCOUNT (no orgId) | SUPERADMIN only | SUPERADMIN only |

Table granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P1.A.2 Column Additions

Three columns added to existing `OnboardingSession` table:

| Column | Type | Purpose |
|--------|------|---------|
| `magicLinkEmailsSentCount` | INTEGER NOT NULL DEFAULT 0 | Rate limiting: emails sent in current window |
| `magicLinkLastSentAt` | TIMESTAMPTZ (nullable) | Rate limiting: last email timestamp |
| `passwordHash` | TEXT (nullable) | Bcrypt hash set at ACCOUNT_CREATED |

### P1.A.2 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/email` | POST | BYPASS_NEEDED — PRE_SESSION | Sends magic-link via prismaAdmin (no tenant context pre-account) |
| `/api/onboarding/verify` | POST | BYPASS_NEEDED — PRE_SESSION | Consumes verification token via prismaAdmin |
| `/api/onboarding/password` | POST | BYPASS_NEEDED — PRE_SESSION | Creates User row via prismaAdmin, transitions to ACCOUNT_CREATED |

### P1.A.2 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `issueToken` | `lib/onboarding/verification-tokens` | Issue single-use verification token (stores hash only) |
| `consumeToken` | `lib/onboarding/verification-tokens` | Atomic single-use consumption with error discrimination |
| `sendMagicLink` | `lib/onboarding/magic-link` | End-to-end: session + rate limit + token + Resend email |
| `validatePassword` | `lib/onboarding/account` | Password strength validation (12+ chars, letters + nums/specials) |
| `createAccount` | `lib/onboarding/account` | Bcrypt hash + User creation + state transition |
| `renderMagicLinkEmail` | `lib/onboarding/emails/magic-link` | HTML + text email template |

## P1.A.3 — Org + Location Bootstrap (2026-05-18)

No new tables. Uses existing Organization, Location, BusinessSettings, User tables.

### P1.A.3 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/org` | POST | BYPASS_NEEDED — ORG_BOOTSTRAP | Creates Organization + BusinessSettings + links User as OWNER via prismaAdmin. The ONLY non-admin Organization.create. |
| `/api/onboarding/location` | POST | TENANT_SCOPED (P1.A.3b) | Dual-client: Location/User/Org writes via withTenantScope tx; OnboardingSession/StateTransition writes via prismaAdmin (in sessions.ts helpers) AFTER the tenant tx commits. Was ORG_BOOTSTRAP in P1.A.3. |
| `/api/onboarding/services` | POST | TENANT_SCOPED (P1.A.4) | Dual-client: Service.createMany via withTenantScope tx; OnboardingSession/StateTransition writes via prismaAdmin (sessions.ts helpers) AFTER the tenant tx commits. Same architecture as /api/onboarding/location. |
| `/api/onboarding/staff-invite` | POST | TENANT_SCOPED (P1.A.5) | Dual-client. Staff.create + StaffInvitation.create via withTenantScope tx; OnboardingSession state via prismaAdmin in sessions.ts. |
| `/api/staff/accept-invite` | POST | BYPASS_NEEDED — PRE_SESSION (P1.A.5) | Invitee has no session yet. User/Staff/StaffInvitation writes all via prismaAdmin (atomic across 3 tables not guaranteed, #95). |
| `/api/onboarding/agreements` | POST | TENANT_SCOPED (P1.A.6) | Dual-client. EmploymentAgreement.createMany via withTenantScope tx; OnboardingSession state via prismaAdmin in sessions.ts. |
| `/api/onboarding/refresh-session` | POST | BYPASS_NEEDED — SELF_READ | Returns user's own DB state for JWT refresh. Read-only, no mutations. |

### P1.A.3 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `validateOrgName` | `lib/onboarding/org` | Org name validation (2-100 chars) |
| `createOrgForOnboarding` | `lib/onboarding/org` | Bootstrap: org + user link + business settings + state transition |
| `validateLocationName` | `lib/onboarding/location` | Location name validation (2-100 chars) |
| `validateAddress` | `lib/onboarding/location` | US address validation (state code, ZIP format) |
| `createLocationForOnboarding` | `lib/onboarding/location` | First location creation + state transition |

## P1.A.4 — Service catalog seed (2026-05-18)

No new tables (uses existing Service table). No new RLS policies needed — Service already has tenant_isolation_* policies from P0.5.3b-3a.

### P1.A.4 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/services` | POST | TENANT_SCOPED | Dual-client: Service.createMany via tx (withTenantScope); OnboardingSession/StateTransition writes via prismaAdmin in sessions.ts helpers AFTER the tenant tx commits. Same architecture as /api/onboarding/location. |

### P1.A.4 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `createServicesForOnboarding` | `lib/onboarding/services` | Seeds vertical's defaultServices into org's Service table during onboarding. State-as-claim-token serialization via LOCATION_CREATED → SERVICES_PENDING claim. |

## P1.A.5 — Staff invite + role assignment (2026-05-19)

New table: StaffInvitation (RLS-enabled, 4 tenant isolation policies + superadmin bypass). Token storage is hashed (sha256), single-use via atomic updateMany consume.

### P1.A.5 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/staff-invite` | POST | TENANT_SCOPED | Dual-client: Staff.create + StaffInvitation.create via withTenantScope tx; OnboardingSession state transitions via prismaAdmin in sessions.ts helpers AFTER tenant tx commits. Same architecture as /api/onboarding/location and /api/onboarding/services. Skip path uses same STAFF_PENDING sentinel mechanism. |
| `/api/staff/accept-invite` | POST | BYPASS_NEEDED — PRE_SESSION | Invitee has no User account or JWT at time of acceptance. Auth is the invitation token itself. Creates User row, links Staff.userId, marks invitation accepted — all via prismaAdmin. Atomicity gap spans 3 tables without single transaction (#95 territory). |

### P1.A.5 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `createStaffInvitation` | `lib/onboarding/staff-invites` | Owner invites a stylist or skips. Creates Staff row (userId=null) + StaffInvitation with hashed token. State-as-claim-token serialization via SERVICES_SEEDED → STAFF_PENDING claim. |
| `acceptStaffInvitation` | `lib/onboarding/staff-invites` | Consumes invitation token, creates User (role=STAFF), links Staff.userId, activates staff. All via prismaAdmin (no tenant scope — invitee has no session). |
| `onboardingErrorStatus` | `lib/onboarding/error-status` | Maps OnboardingError codes to HTTP status codes. Extracted from duplicated logic in location.ts and services.ts (cycle 3 reviewer feedback on PR #96). |

## P1.A.6 — Employment agreements scaffolding (2026-05-20)

No new tables (uses existing EmploymentAgreement model from P0.G.4). Migration updates OnboardingSession state CHECK constraint to include AGREEMENTS_PENDING.

### P1.A.6 API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/agreements` | POST | TENANT_SCOPED | Dual-client: EmploymentAgreement.createMany via withTenantScope tx; OnboardingSession state transitions via prismaAdmin in sessions.ts helpers AFTER tenant tx commits. Same architecture as /api/onboarding/staff-invite. Skip path uses same AGREEMENTS_PENDING sentinel mechanism. |

### P1.A.6 Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `createEmploymentAgreementDrafts` | `lib/onboarding/agreements` | Owner selects templateType or skips. Creates one DRAFT EmploymentAgreement per active Staff at org+location. State-as-claim-token serialization via STAFF_INVITED → AGREEMENTS_PENDING claim. Scaffolding only — documentUrl is placeholder, status is DRAFT. |

### P1.A.6 EmploymentAgreement RLS — RESOLVED (#95)

~~The existing EmploymentAgreement RLS policy was FOR ALL with no superadmin bypass.~~

**Fixed in #95**: The single `tenant_isolation` FOR ALL policy has been replaced with 4 per-command policies (SELECT/INSERT/UPDATE/DELETE) that include the `OR app.is_superadmin = 'true'` clause — same pattern as Location, Service, Staff, StaffInvitation. Migration: `20260520190000_p95_employment_agreement_superadmin_bypass`. Applied to production via Supabase MCP on 2026-05-20.

prismaAdmin can now operate on EmploymentAgreement rows directly. P1.A.6 tenant-scoped writes (via `args.tx`) are unaffected — the tenant isolation condition still matches.

## Issue #95 — Codebase Atomicity Hardening (2026-05-20)

### withAdminTx helper

New helper `lib/admin/withAdminTx.ts` wraps multiple prismaAdmin operations in a SINGLE Prisma batch transaction. Works around the broken `prismaAdmin.$transaction(async (tx) => ...)` pattern caused by the `$extends` wrapper intercepting operations and dispatching them on separate connections.

See `docs/architecture/admin-transactions.md` for full documentation, usage examples, and rules.

### Refactored helpers

| Helper | Module | Change |
|--------|--------|--------|
| `transitionTo` | `lib/onboarding/sessions` | Session update + state transition + audit log now atomic via withAdminTx |
| `skipStep` | `lib/onboarding/sessions` | Session update + state transition + audit log now atomic via withAdminTx |
| `getOrCreateSession` | `lib/onboarding/sessions` | Session create + state transition + audit log now atomic via withAdminTx |
| `createAccount` | `lib/onboarding/account` | **SEVERE bug fix**: User create + session update + state transition + audit log now atomic via withAdminTx. Previously used broken `prismaAdmin.$transaction(async tx => ...)` where inner operations bypassed the outer tx. |

### auditLogCreateOp

New export from `lib/audit/write.ts`: `auditLogCreateOp(p, input)` returns a deferred PrismaPromise for use inside withAdminTx batches. Unlike `writeAuditLog()`, it does NOT catch errors — failures propagate to the batch transaction and trigger rollback.

### Janitor cron

`POST /api/cron/onboarding-janitor` — log-only sweep for sessions stuck in *_PENDING states for >5 minutes. Emits `[STUCK_PENDING_SESSION]` tags. Registered in `vercel.json` at `*/5 * * * *`. Automated recovery is the next iteration.

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/cron/onboarding-janitor` | GET | CRON | Protected by CRON_SECRET bearer token; uses prismaAdmin for platform-wide session scan. Vercel cron sends GET. |

**Note (updated 2026-05-26 in PR #122 cycle 2)**: This route's auth
was hardened to require CRON_SECRET unconditionally in all
environments. See the "Cycle 2 hardening" subsection under
"P1.B.6 + P1.B.7" below for full rationale.

## P1.A.7-a — Compensation foundation (2026-05-20)

No new tables (uses existing Compensation table from P0.G.4). Migration
adds COMPENSATION_PENDING to the OnboardingSession.state CHECK constraint
and OnboardingStateTransition fromState/toState CHECK constraints.

### P1.A.7-a API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/compensation` | GET, POST | TENANT_SCOPED-style | GET is a DELIBERATE prismaAdmin read (not an oversight) — scoped by strict organizationId+locationId filters derived from verified server-side session JWT claims. Same pattern as the agreements route's pre-claim staff check. OWNER-only at the route level. POST creates Compensation rows via withTenantScope tx; OnboardingSession state transitions via prismaAdmin in sessions.ts helpers AFTER tenant tx commits. See route file inline comment for forward-compatibility notes. |

### P1.A.7-a Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `validateCompensationInput` | `lib/onboarding/compensation` | Pure validation: model-type-conditional field checks, date sanity |
| `setCompensationForStaff` | `lib/onboarding/compensation` | Owner sets compensation for all non-skipped agreement staff. Pre-claim invariant: every staff with an agreement must have a corresponding compensation input. State-as-claim-token via AGREEMENTS_CONFIGURED -> COMPENSATION_PENDING. |

## P1.A.7-b — Supabase Storage Integration + SUPABASE_SERVICE_ROLE_KEY exception (2026-05-20)

**Status:** ACTIVE

P1.A.7-b introduces the FIRST use of Supabase Storage and the FIRST
use of SUPABASE_SERVICE_ROLE_KEY in this codebase. Per the standing
rule in this document ("if you see SUPABASE_SERVICE_ROLE_KEY introduced
in a PR, flag it as a SEVERE concern unless this audit doc has been
updated to document the new bypass exception"), the bypass exception is
documented here.

### Why the service role key is needed

Supabase Storage uses its own RLS layer on storage.objects. Server-side
uploads from a Vercel function don't have a Supabase JWT — they need a
credential that authenticates as a privileged backend identity. The
service_role key is the standard pattern for backend-to-Storage flows.

### Bypass scope

SUPABASE_SERVICE_ROLE_KEY is used ONLY by:
- `lib/onboarding/agreement-storage.ts` (uploads + signed URL minting)

No other module reads this env var. Any future module that introduces a
read MUST update this section.

### Storage path convention

All objects in kasse-agreements are stored as:
  `<organizationId>/<agreementId>/<filename>`

The `authenticated_read_own_org_kasse_agreements` policy enforces that
clients can only read objects whose path prefix matches their
`app.current_org_id` session variable. Defense-in-depth — the primary
access pattern is signed URLs minted by the backend.

### P1.A.7-b Tables

| Table | Scoping Strategy | Policy |
|-------|-----------------|--------|
| `AgreementSignToken` | Direct `organizationId` column | 4 per-command policies (SELECT/INSERT/UPDATE/DELETE) with superadmin bypass |

Table granted SELECT, INSERT, UPDATE, DELETE to `kasse_app` role.

### P1.A.7-b API Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/agreements/send` | POST | TENANT_SCOPED | OWNER-only. Pre-batch reads (agreements, org) use withTenantScope (RLS-enforced). Multi-table atomic writes use withAdminTx (EmploymentAgreement.update + AgreementSignToken.create + audit log). PDF upload + Resend send happen after batch commits (best-effort, fail-soft logged as DEGRADED). |
| `/api/onboarding/agreements/send-test` | POST | TENANT_SCOPED | Same as /send but recipient is the authenticated owner's email. PDF + token are still real. |

### P1.A.7-b Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `renderEmploymentAgreementPDF` | `lib/onboarding/agreement-pdf` | Server-side PDF generation via @react-pdf/renderer |
| `uploadAgreementPDF` | `lib/onboarding/agreement-storage` | Uploads PDF to kasse-agreements bucket via Storage REST API + SUPABASE_SERVICE_ROLE_KEY |
| `createSignedDownloadUrl` | `lib/onboarding/agreement-storage` | Mints a time-limited signed URL for the agreement PDF |
| `generateRawAgreementToken` | `lib/onboarding/agreement-tokens` | 32-byte random token, hex (64 chars) |
| `hashAgreementToken` | `lib/onboarding/agreement-tokens` | SHA-256 of the raw token, hex |
| `sendAllAgreementsForSession` | `lib/onboarding/agreement-send` | Orchestrator: per-agreement loop with isolated failures, withAdminTx for DB writes, PDF upload + Resend send after commit |
| `renderAgreementSignEmail` | `lib/onboarding/emails/agreement-sign` | HTML + text email template for signing notification |
| `buildCompensationSummary` | `lib/onboarding/emails/agreement-sign` | Brief compensation text for email body |
| `buildStoragePathMarker` | `lib/onboarding/agreement-storage` | Stable path marker for documentUrl (not a signed URL) |
| `parseStoragePathMarker` | `lib/onboarding/agreement-storage` | Parse marker back into orgId/agreementId/filename |

### Storage path markers in documentUrl

`EmploymentAgreement.documentUrl` stores a STORAGE PATH MARKER
(format: `kasse-agreements://<orgId>/<agreementId>/<filename>`), NOT
a signed URL. Signed download URLs are minted on demand via
`createSignedDownloadUrl()` because they have a fixed TTL (currently
7 days, matching the signing token). Storing a signed URL would
create a time bomb where `documentUrl` becomes dead after 7 days.

Recovery path: the storage path marker is stable. Any view that needs
to display the PDF re-mints a signed URL from the path.

Migration impact: existing DRAFT rows have `documentUrl='pending://...'`
(set in P1.A.6). These get OVERWRITTEN to the storage path marker
when the owner triggers send (P1.A.7-b). No migration is needed.

### Migration tracking drift (2026-05-20)

Brute-force verification during PR #101 review confirmed:
- `_prisma_migrations` table has rows through `20260516200000_p0_d_1_plan_tier_system`
- `prisma/migrations/` folder contains migrations through `20260520211000_p1_a_7_b_kasse_agreements_bucket`
- ~22 migrations applied via Supabase MCP are not recorded in `_prisma_migrations`

Production schema is correct. Migration tracking is drifted.

Why this doesn't block production:
- Vercel build runs `npm install && next build` only
- `prisma migrate deploy` is not part of the deploy pipeline
- All schema changes happen via Supabase MCP with manual SQL review

Cleanup plan (not in this PR):
- One-time PR to run `npx prisma migrate resolve --applied <each_name>`
  for each unrecorded migration. Recompute checksums from the migration
  files. Verify with `prisma migrate status`.
- After cleanup, consider whether to add `prisma migrate deploy` to
  the Vercel build (this requires MIGRATION_DATABASE_URL to be set
  with postgres role permissions for storage policies).

Until then: continue applying migrations via Supabase MCP only. Do
NOT run `prisma migrate dev` or `prisma migrate deploy` against
production.

## P1.A.7-c — Public signing UI + signature acceptance (2026-05-20)

No new tables. No schema changes. Uses existing EmploymentAgreement +
AgreementSignToken tables from P1.A.7-b.

### P1.A.7-c Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/agreements/sign/[token]` | GET (page) | PUBLIC_PRE_SESSION | Token IS the auth. Reads AgreementSignToken + EmploymentAgreement via prismaAdmin (same pattern as /api/onboarding/verify). Token regex validated before DB query. Writes viewedAt (idempotent). |
| `/api/agreements/sign/[token]` | POST | PUBLIC_PRE_SESSION | Atomic single-use consume. Token regex + JSON body validated. updateMany for race-safe consume + withAdminTx for agreement SIGNED + audit log. |
| `/agreements/sign/error` | GET (page) | PUBLIC_STATIC | No DB access. Reads reason from search params. |

### P1.A.7-c Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `consumeAgreementSignToken` | `lib/onboarding/agreement-sign-consume` | Atomic token consume + signature record. Race-safe via updateMany WHERE consumedAt IS NULL. |

### P1.A.7-c Security notes

- Hash comparison only — raw token never stored (same StaffInvitation pattern)
- Two-write window: token consume (commit 1) may succeed but agreement update (commit 2, withAdminTx) may fail. Logged as AGREEMENT_SIGN_COMMIT_FAILED, recoverable via P1.A.7-d re-issue
- Token regex `/^[0-9a-f]{64}$/` prevents arbitrary input from reaching DB
- NAME_MISMATCH: case-insensitive compare of typed name vs staff.name. Intentional fraud friction, not a hard block if staff.name is empty
- OnboardingSession state is NOT advanced. P1.A.7-d handles COMPENSATION_CONFIGURED -> COMPLETED

## P1.A.7-d — Owner completion layer (2026-05-20)

No new tables, no schema changes. Reuses EmploymentAgreement +
AgreementSignToken from P1.A.7-b and OnboardingSession state machine
from P1.A.1.

### P1.A.7-d Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/onboarding/agreements/resend` | POST | TENANT_SCOPED | OWNER-only. Burns existing AgreementSignToken + creates fresh one + re-uploads PDF + sends email. Uses withTenantScope for reads, withAdminTx for the multi-table atomic write batch (deleteMany + create + update + audit). |
| `/api/onboarding/session-complete` | POST | TENANT_SCOPED | OWNER-only. Counts signed/total via withTenantScope, advances OnboardingSession via transitionTo (which uses withAdminTx). Two paths: auto-advance if all signed, or force=true via owner explicit choice. Note: distinct from /api/onboarding/complete which handles the merchant application submission. |
| `/dashboard/admin/agreements/[sessionId]` | GET (page) | TENANT_SCOPED | OWNER-only server component. getSigningProgress reads via withTenantScope. |

### P1.A.7-d Helper Functions

| Helper | Module | Purpose |
|--------|--------|---------|
| `getSigningProgress` | `lib/onboarding/agreement-completion` | Read-only snapshot of signing state for a session. RLS-enforced via withTenantScope. |
| `reissueAgreementSignToken` | `lib/onboarding/agreement-completion` | Burn old token + create fresh one + re-send email. Atomic via withAdminTx. |
| `completeIfAllSigned` | `lib/onboarding/agreement-completion` | Advance OnboardingSession COMPENSATION_CONFIGURED -> COMPLETED. Force flag bypasses all-signed check. Uses transitionTo. |

### P1.A.7-d Security notes

- All three routes are OWNER-only with explicit role check before any DB access
- reissueAgreementSignToken uses deleteMany (not delete) on the old token so the call is idempotent
- completeIfAllSigned validates state === 'COMPENSATION_CONFIGURED' before advancing
- force=true is recorded in audit log metadata (forced=true, unsignedCount) so partial-signing exits are auditable
## Migration tracking drift cleanup (2026-05-21)

The `_prisma_migrations` tracking table previously drifted from the on-disk migration set. **Resolved 2026-05-21.**

**Direct SQL fix (via Supabase MCP):**
Deleted orphan failed `20260508194352_relation_hardening` row (`id=41ba50b7-dafc-4e10-811f-d3a06e8577ab`, `applied_steps_count=0, finished_at=null` from an aborted apply; the retry row with `applied_steps_count=1` and proper `finished_at` is the authoritative record).

**Backfilled tracking for 25 migrations applied via Supabase MCP:**

Each was resolved via `npx prisma migrate resolve --applied <name>` which inserts the row with the correct SHA-256 checksum without re-running the SQL.

- `20260511121142_rls_policies`
- `20260512005451_kasse_app_role`
- `20260518000001_p0g_pr1_services_clients_scheduling`
- `20260518000002_p0g_pr1_cycle2_stylist_schedule_unique`
- `20260518000003_p0g_pr2_appointments_recurring_booking`
- `20260518000004_p0g_pr2_cycle2_rename_preauth_field`
- `20260518000005_p0g_pr3_cart_device_order_payment`
- `20260518000006_p0g_pr3_cycle2_idempotency_indexes`
- `20260518000007_p0g_pr4_commission_tips_tax_inventory_marketing`
- `20260518100000_p0h_pr2_feature_flags`
- `20260518110000_p0h_pr3_locale_fields`
- `20260518120000_p0i_pr1_custom_fields`
- `20260518130000_p0i_pr2_tags`
- `20260518140000_p0i_pr3_audit_indexes`
- `20260518150000_p1_a_1_onboarding_state_machine`
- `20260518160000_tighten_onboarding_email_check`
- `20260518170000_p1_a_2_account_creation`
- `20260518180000_p1_a_3b_add_location_pending_state`
- `20260518190000_p1_a_4_add_services_pending_state`
- `20260519200000_p1_a_5_staff_invitations_and_pending_state`
- `20260520180000_p1_a_6_add_agreements_pending_state`
- `20260520190000_p95_employment_agreement_superadmin_bypass`
- `20260520200000_p1_a_7_add_compensation_pending_state`
- `20260520210000_p1_a_7_b_agreement_sign_token`
- `20260520211000_p1_a_7_b_kasse_agreements_bucket`

**Verification:** `npx prisma migrate status` now reports "Database schema is up to date!"

**Known cosmetic gap (not fixed by this cleanup):** 5 P0.A migrations have tracking rows but no on-disk `migration.sql` files:

- `20260514160000_p0_a_6_permission_set_schema_sync`
- `20260514160100_p0_a_6_permissionset_select_allow_system_rows`
- `20260514210000_p0_a_11_user_custom_role_id`
- `20260514230000_p0_a_13_groupid_move_to_location`
- `20260515000000_p0_a_13_organizationgroup_add_organizationid`

These were applied during P0.A ship via direct Supabase MCP SQL and the migration.sql files were never committed. Schema changes are in production and verified; tracking is accurate; only the historical file record is missing. Will be reverse-engineered from the live schema as a housekeeping PR before multi-developer onboarding. See `prisma/README.md` "Known cosmetic gap" section.

**Process change going forward:** The new workflow in `prisma/README.md` requires that every schema PR runs `npx prisma migrate resolve --applied <name>` before merging. This prevents this kind of drift from recurring.

## P0.5.3d — auth_rls_initplan performance optimization (2026-05-21)

### Problem

Supabase performance advisor reported **239 `auth_rls_initplan` warnings** across 89 tables. Each warning indicates that `current_setting()` calls inside RLS policies were being re-evaluated for every row during policy checks instead of once per query. At scale this produces 10�100x slower queries on large tenant datasets.

### Root cause

PostgreSQL's query planner treats `current_setting('app.X', true)` as a volatile function call that must be re-evaluated per row unless the planner can prove otherwise. Wrapping the call in `(SELECT ...)` creates an InitPlan node, which Postgres guarantees is evaluated exactly once per query and cached.

Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

### Fix

Migration `20260521201207_p0_5_3d_rls_initplan_optimization` uses a `DO $$ ... $$` block that:

1. Iterates over every `pg_policies` row in the `public` schema where `qual` or `with_check` contains `current_setting()`
2. Applies `regexp_replace` to wrap each `current_setting('app.X', true)` call in `(SELECT current_setting('app.X', true))`
3. Drops the old policy and creates the new one with the wrapped expression
4. All in a single transaction � atomic rollback on any failure

### Verification

| Metric | Before | After |
|---|---|---|
| `auth_rls_initplan` warnings | 239 | 0 |
| Policies still bare (`current_setting` not in `SELECT`) | 239 | 0 |
| Policies wrapped (`SELECT current_setting`) | 0 | 239 |
| Total policies using `current_setting` | 239 | 239 |

Confirmed via `Supabase:get_advisors(type='performance')` immediately after the migration applied. The `auth_rls_initplan` lint category dropped from 239 findings to 0.

### Semantic equivalence

The `(SELECT ...)` wrapper changes **nothing** about what is evaluated � only how many times.

- `set_config('app.X', value, true)` still sets the session variable transaction-locally via `SET LOCAL`
- The value is still read inside the policy check
- The row is still filtered by the same boolean expression
- The wrapped expression is semantically identical to the bare call, just executed once per query instead of once per row

This is a pure query-plan optimization with **zero behavioral change**. All existing RLS tenant-isolation behavior is preserved.

### Excluded from rewrite

- **`FeatureFlag` / `FeatureFlagAudit`** � policies use `is_current_user_superadmin()` SECURITY DEFINER function which Postgres already caches per-query (function volatility is STABLE)
- **`FeatureFlag.featureflag_read`** � `USING (true)` policy has no `current_setting()` to wrap
- **`OrganizationGroup.group_select`** � has a recursive CTE; the regex matches and rewrites the `current_setting()` calls within the CTE body without breaking the CTE structure (verified)

### Storage normalization

Note: Postgres internally normalizes the stored form of `(SELECT current_setting('app.X', true))` to `( SELECT current_setting('app.X'::text, true) AS current_setting)` with an automatic column alias. This is display formatting only � the AST is identical and the query plan optimization applies regardless.

### Rollback (if ever needed)

To reverse this optimization (not recommended unless investigating a regression):

```sql
DO $rollback$
DECLARE
  policy_record RECORD;
  new_qual TEXT;
  new_with_check TEXT;
  drop_sql TEXT;
  create_sql TEXT;
BEGIN
  FOR policy_record IN
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%SELECT current_setting%' OR with_check LIKE '%SELECT current_setting%')
  LOOP
    new_qual := regexp_replace(policy_record.qual, '\(\s*SELECT current_setting\(''(app\.[a-z_]+)''::text, true\)(\s+AS current_setting)?\s*\)', 'current_setting(''\1''::text, true)', 'g');
    new_with_check := regexp_replace(policy_record.with_check, '\(\s*SELECT current_setting\(''(app\.[a-z_]+)''::text, true\)(\s+AS current_setting)?\s*\)', 'current_setting(''\1''::text, true)', 'g');

    drop_sql := format('DROP POLICY %I ON public.%I', policy_record.policyname, policy_record.tablename);
    EXECUTE drop_sql;

    create_sql := format('CREATE POLICY %I ON public.%I FOR %s', policy_record.policyname, policy_record.tablename, policy_record.cmd);
    IF new_qual IS NOT NULL THEN create_sql := create_sql || format(' USING (%s)', new_qual); END IF;
    IF new_with_check IS NOT NULL THEN create_sql := create_sql || format(' WITH CHECK (%s)', new_with_check); END IF;
    EXECUTE create_sql;
  END LOOP;
END;
$rollback$;
```

## P1.A.8 — Google OAuth signup (2026-05-21)

No new tables. No schema changes. Uses existing User + Account tables (NextAuth's
PrismaAdapter standard).

### P1.A.8 Bootstrap flow

First-time Google user → signIn callback creates Organization + BusinessSettings
+ User (role=OWNER, password=null, emailVerified=now()) via prismaAdmin. Then
PrismaAdapter creates the Account row linking Google to the User automatically.

Existing-email Google user → signIn callback updates lastLoginAt. PrismaAdapter
links the Google Account to the existing User via allowDangerousEmailAccountLinking.
Single User row, two Account rows (one credentials, one google).

Inactive User (isActive=false) → signIn callback throws ACCOUNT_DISABLED.

### P1.A.8 Routes

No new API routes. The `/api/auth/[...nextauth]` handler covers the Google flow
via the provider definition. See existing classification in the route table
above: `/api/auth/[...nextauth]` is BYPASS_NEEDED — PRE_SESSION (delegates
entirely to lib/auth.ts which uses prismaAdmin; no direct DB calls in the
route file).

### P1.A.8 RLS Impact

None. All bootstrap writes go through prismaAdmin (same as /api/auth/register,
which is BYPASS_NEEDED — PRE_SESSION).

### P1.A.8 Onboarding state machine integration

Out of scope for this PR. The current /login flow (both credentials and Google)
does NOT create an OnboardingSession. The OnboardingSession state machine from
P1.A.1/P1.A.2 was authored but never wired to the actual signup UI. Google
sign-ins land on /dashboard the same as credentials sign-ins. If/when the
OnboardingSession flow is wired to /login (separate PR), Google users will
need a path that transitions STARTED → ACCOUNT_CREATED directly on first
sign-in, bypassing the EMAIL_VERIFIED + PASSWORD_SET intermediate states.

## P1.A.9 — Apple Sign-In (2026-05-21)

No new tables. No schema changes. Uses existing User + Account tables (NextAuth's
PrismaAdapter standard). Structurally mirrors P1.A.8 (Google OAuth).

### P1.A.9 Bootstrap flow

Same as P1.A.8 — the signIn callback was generalized to handle both Google and
Apple via an oauthProviders Set. First-time Apple user → withAdminTx atomic
bootstrap creates Organization + BusinessSettings + User (role=OWNER,
password=null, emailVerified=now()) via prismaAdmin. PrismaAdapter creates the
Account row linking Apple to the User automatically after signIn returns true.

Existing-email Apple user → signIn callback updates lastLoginAt. PrismaAdapter
links the Apple Account to the existing User via allowDangerousEmailAccountLinking.
Single User row, multiple Account rows (credentials, google, apple as applicable).

Inactive User (isActive=false) → signIn callback throws ACCOUNT_DISABLED.

Email verification parity: starting in PR #107 (P1.A.9), OAuth sign-ins
to an EXISTING Kasse account require existingUser.emailVerified to be set.
This matches the credentials provider's EMAIL_NOT_VERIFIED throw and
prevents an OAuth flow from silently claiming an unverified credentials
account (e.g., one where the verification email was never received).

### P1.A.9 Apple-specific notes

- Apple-issued JWTs always have verified email claims — no `email_verified` check
  needed (unlike Google, where the check is defense-in-depth)
- Apple Private Email Relay addresses (`@privaterelay.appleid.com`) are accepted
  as legitimate emails; no special handling
- Apple sends the user's display name ONLY on the first sign-in consent screen.
  Subsequent sign-ins do not include name. The bootstrap captures the name
  correctly on first sign-in; existing users use their stored User.name field.
- The Apple `clientSecret` is a pre-signed JWT (ES256, 90-day validity)
  generated at module load via `generateAppleClientSecret()` in
  `lib/auth.ts`. Apple's spec requires this format — passing the raw `.p8`
  private key would result in `invalid_client` errors at the OAuth token
  exchange step. The provider is conditionally registered: if any of the
  four required env vars (APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID,
  APPLE_PRIVATE_KEY) is missing or JWT generation fails, the provider is
  excluded entirely.

### P1.A.9 Account linking trust model

Both GoogleProvider (P1.A.8) and AppleProvider (P1.A.9) set
`allowDangerousEmailAccountLinking: true`. This means NextAuth's PrismaAdapter
will link an OAuth Account row to any existing User row whose email matches
the OAuth identity's email, with no additional handshake. The trust assumption
is that:

1. The OAuth provider (Google or Apple) has verified the user controls the
   email address (Google: profile.email_verified check enforced in
   lib/auth.ts signIn callback; Apple: guaranteed by Apple's JWT spec).
2. The existing Kasse User row's emailVerified field is non-null. Added in
   PR #107 (P1.A.9) to both the existingUser branch and the P2002-race
   raceWinner branch — if a credentials-based account never completed
   verification, OAuth sign-in throws EMAIL_NOT_VERIFIED instead of silently
   claiming the account.

Combined, these two checks mean an attacker would need to:
- Control a Google or Apple identity with the target's email address
  (requires actually controlling the email), AND
- The target's Kasse account is already email-verified (so the
  emailVerified check passes).

The practical attack surface is "attacker controls the victim's email
inbox" — at which point they could also use the credentials provider's
forgot-password flow. The OAuth linking does not expand the attack surface
beyond what email control already grants.

### P1.A.9 Routes

No new API routes. The `/api/auth/[...nextauth]` handler covers both Google and
Apple OAuth flows via the provider definitions. Classification unchanged from
P1.A.8: BYPASS_NEEDED — PRE_SESSION (delegates entirely to lib/auth.ts which
uses prismaAdmin; no direct DB calls in the route file).

### P1.A.9 RLS Impact

None. All bootstrap writes go through prismaAdmin (same as /api/auth/register
and Google OAuth from P1.A.8).

## P1.A.10 — Terms + Privacy acceptance with version tracking (2026-05-23)

### Schema

Two new tables: TermsVersion (master list of policy versions with body
hashes and content URLs) and TermsAcceptance (per-user, per-version
acceptance records with IP, userAgent, timestamp).

User model gets a reverse relation `acceptances TermsAcceptance[]`.

### Bootstrap

Initial TermsVersion v1.0.0 is seeded in the migration with placeholder
content URLs (/terms, /privacy) pointing to "Coming soon" stub pages.
Real attorney-drafted documents land in a follow-up PR; that PR updates
the URLs and hashes.

### P1.A.10 Routes

| Route | Method(s) | Classification | Reason |
|-------|-----------|---------------|--------|
| `/api/terms/accept` | POST | BYPASS_NEEDED — SELF_WRITE | Authenticated user creates a TermsAcceptance row for themselves; uses session.user.id from server-verified NextAuth. prismaAdmin used because TermsAcceptance is a cross-tenant legal record, not org-scoped business data. Same pattern as SELF_READ but for writes. |

### P1.A.10 Pages (middleware-gated)

These are server-rendered pages with no direct DB access. Auth and access
control are handled by middleware. Listed for completeness — they do not
belong in the RLS Routes taxonomy (which classifies database client choice
per API route).

| Page | Access Control |
|------|---------------|
| `/terms` | Public, no auth |
| `/privacy` | Public, no auth |
| `/terms/accept` | Authenticated. Middleware redirects unauthenticated users to /login. Page is a client component that calls /api/terms/accept (classified above as BYPASS_NEEDED — SELF_WRITE). |

### P1.A.10 Tables

| Table | Scoping Strategy | Notes |
|-------|-----------------|-------|
| `TermsVersion` | PLATFORM_SCOPED | No RLS. Public-read policy data. Server-side writes only via attorney-PR migration. |
| `TermsAcceptance` | PLATFORM_SCOPED | No RLS. Cross-tenant legal record. Server-side access only via prismaAdmin through /api/terms/accept and lib/auth.ts JWT injection. No client-side reads. |

Both tables follow the same pattern as FeatureFlag/FeatureFlagAudit (P0.H.2)
and AuditLog (P0.5.3b-3a) — platform-scoped tables with no tenant column,
access controlled at the application layer via prismaAdmin and explicit
role/session checks rather than RLS policies.

### Re-acceptance flow

JWT carries two fields: currentTermsVersionId (effective version at JWT
mint time) and acceptedTermsVersionId (user's most recent acceptance).
Middleware compares them on every authenticated, non-exempt request.
If they differ, redirect to /terms/accept.

The JWT is refreshed on sign-in and on explicit useSession().update()
calls. After a user accepts, the /terms/accept client calls
session.update() to refresh the JWT with the new acceptance, then
window.location.href = /dashboard.

### Exempt routes

The middleware terms check excludes: /api/*, /_next/*, /login, /logout,
/terms, /privacy, /terms/accept. All other authenticated routes require
current-version acceptance.

### Legal record properties

- IP address captured via lib/http/headers.ts:getLegalRecordIp(). Order
  of preference: x-real-ip (Vercel-observed edge IP), then LAST hop of
  x-forwarded-for. Last-hop is whatever the most recent trusted proxy added
  (on Vercel: the edge; on Cloudflare-in-front-of-Vercel: the
  CF-Connecting-IP-equivalent value). The first hop of x-forwarded-for can
  be client-supplied and spoofed, so it is never used for legal records.

  Different trust requirements from rate-limit IP extraction
  (getRateLimitIp). For rate-limit, IP-axis degradation is acceptable
  (falls back to email-only limiting). For legal records, an attacker-
  controlled IP would corrupt the audit trail. The two helpers are
  intentionally separate.
- User-agent captured from request headers
- Document content hashes (termsBodyHash, privacyBodyHash) prove WHAT
  was accepted, not just THAT it was accepted
- TermsAcceptance rows are NEVER auto-deleted. Both FK relations use
  onDelete: Restrict — user deletion blocks at the DB level if any
  TermsAcceptance rows reference that User, and TermsVersion deletion
  blocks if any TermsAcceptance references that version. Future user-
  deletion flows must explicitly handle TermsAcceptance rows
  (anonymize by setting userId to a sentinel "deleted user" row, OR
  refuse to hard-delete and require soft-delete via isActive=false).
  This is intentional: legal record retention must outlast user
  lifecycle and survive operational mistakes.

## P1.A.11 — UTM tracking with cookie persistence (2026-05-23)

### Schema

Added 5 nullable TEXT columns to User: utmSource, utmMedium, utmCampaign,
utmTerm, utmContent. No new tables. No new indexes (UTM fields are written
during signup/signin and read for analytics dashboards — no query patterns
yet justify an index, defer until P2+ analytics work).

### Capture flow

1. Middleware scans every page request for utm_* search params (utm_source,
   utm_medium, utm_campaign, utm_term, utm_content)
2. If any present, sets/refreshes the kasse_utm cookie (JSON-encoded, 30-day
   TTL, Secure in production, SameSite=Lax, HttpOnly: true)
3. On registration (POST /api/auth/register) and on every sign-in (credentials
   + OAuth signIn callback), reads cookie and overwrites User row UTM fields
   if any are non-null (hasAnyUtm guard)
4. Cookie is NOT set on responses to /api/* paths (API clients don't navigate
   with UTM params; gating prevents pointless writes on JSON error responses)

### Overwrite policy

Every sign-in overwrites UTM fields if cookie present. This tracks re-entry
attribution — e.g., a user signs up via utm_campaign=launch_email, then later
clicks utm_campaign=spring_promo and signs in — the User row records the
most recent attribution. Original signup attribution is NOT preserved
separately (deliberate: simpler schema, retention-focused analytics treat
the most recent touchpoint as authoritative).

### Routes touched

- `/api/auth/register` (existing route, P1.A.10 classification BYPASS_NEEDED — PRE_SESSION) — now reads kasse_utm cookie via readUtmFromCookies()
- `/api/auth/[...nextauth]` (existing route, P1.A.8 classification BYPASS_NEEDED — PRE_SESSION) — lib/auth.ts now reads kasse_utm cookie in credentials authorize() and signIn callback
- `middleware.ts` — runs on every request matched by the existing matcher; sets/refreshes kasse_utm cookie when utm_* params present in URL

No new RLS-classified routes. No new BYPASS_NEEDED subtypes.

### Cookie properties

- Name: kasse_utm
- Format: JSON object with keys utm_source, utm_medium, utm_campaign, utm_term, utm_content
- TTL: 30 days (rolling — refreshed on every request with UTM params)
- Path: /
- Secure: true in production, false in dev
- SameSite: lax
- HttpOnly: true (no client-side use case identified; XSS-safer default)

## P1.A.12 — A/B test infrastructure with visitor identity (2026-05-23)

### Schema

Added one nullable TEXT column to User: visitorId. Index on visitorId for
analytics joins (visitorId → User lookups when analyzing A/B test outcomes
post-signup).

### Visitor identity flow

1. Middleware checks every request for a kasse_visitor_id cookie
2. If missing or invalid (not a UUID v4), generates a new UUID via
   crypto.randomUUID() and sets the cookie on the response
3. Cookie persists for 365 days (rolling, refreshed on cookie-missing only)
4. Cookie properties: HttpOnly, Secure in production, SameSite=Lax, Path=/
5. Visitor ID is also propagated to server components via the
   x-kasse-visitor-id request header (set by middleware)

### A/B resolution flow

1. lib/experiments/registry.ts defines experiments in code (typed array of
   ExperimentDefinition)
2. lib/experiments/resolve.ts hashes (experimentKey + visitorId) via SHA-256,
   takes first 8 hex chars as integer, computes bucket position, walks
   variant weights to find bucket
3. Deterministic: same visitor always sees same variant for same experiment
4. Independent across experiments: same visitor's buckets for different
   experiments are independent (salted by experimentKey)
5. No DB writes per page view — assignment is purely computational

### Visitor → User binding

On registration (POST /api/auth/register), the kasse_visitor_id cookie value
is read and written to User.visitorId in the same withAdminTx batch.

On every sign-in (credentials + 4 OAuth paths), visitorId is bound ONLY if
the User's current visitorId is null. This is one-time bind: subsequent
sign-ins with a different cookie do NOT overwrite the established identity.
Different visitor identity binding policy from UTM (which overwrites on
every sign-in for re-entry attribution).

### Routes touched

- `/api/auth/register` (existing route, P1.A.10 classification BYPASS_NEEDED — PRE_SESSION) — now reads kasse_visitor_id cookie via readVisitorIdFromCookies()
- `/api/auth/[...nextauth]` (existing route, P1.A.8 classification BYPASS_NEEDED — PRE_SESSION) — lib/auth.ts now reads kasse_visitor_id cookie in credentials authorize() and signIn callback
- `middleware.ts` — runs on every request matched by the existing matcher; sets kasse_visitor_id cookie if missing/invalid; propagates visitor ID via x-kasse-visitor-id header

No new RLS-classified routes. No new BYPASS_NEEDED subtypes. visitorId field
on User is part of the existing User table RLS posture.

### Cookie properties

- Name: kasse_visitor_id
- Format: UUID v4 (e.g. 550e8400-e29b-41d4-a716-446655440000)
- TTL: 365 days (rolling — re-set only when missing or invalid)
- Path: /
- Secure: true in production, false in dev
- SameSite: lax
- HttpOnly: true (no client-side use case)
- Validation: middleware regex-validates UUID v4 format on read; tampered
  values are replaced with a fresh UUID

### Why hash-based and not stored assignments?

Stored ExperimentAssignment rows would require a DB write on every first
page visit with an active experiment. At scale that includes bots, crawlers,
and bounced visitors who never matter to the experiment. Hash-based gives
deterministic results without writes; the trade-off is that we can't query
"who was in variant A?" from the DB — we'd need to recompute or log
exposures. Exposure logging can be added later as additive P3+ work without
changing the resolution logic.

## P1.A.13 — Rate limiting via Upstash Redis (2026-05-23)

### Infrastructure

External dependency added: Upstash Redis. Env vars required:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

When env vars are missing (e.g. dev environment without Upstash setup),
the rate limiter logs a single startup-time warning and fail-opens. This
means the PR ships safely before the Upstash account is provisioned.

### Limits

10 attempts per 10 minutes per (IP, endpoint, identifier).

- Algorithm: sliding window (via @upstash/ratelimit)
- Identifier resolves to email when available, otherwise falls back to IP
- 3-axis key defeats both "1 IP, many emails" (botnet cycling) and
  "1 email, many IPs" (distributed brute-force)

IP extraction for rate-limiting uses lib/http/headers.ts:getRateLimitIp
(prefers x-real-ip, falls back to FIRST hop of x-forwarded-for). This is
intentionally distinct from legal-record IP extraction (getLegalRecordIp,
LAST hop fallback) because rate-limit and legal records have different
trust requirements. Do not consolidate the two helpers. See the P1.A.10
"Legal record properties" subsection for the legal-record extraction
rationale.

For NextAuth's credentials authorize() callback specifically, IP is
extracted via a private helper getRateLimitIpFromNextAuthReq in lib/auth.ts.
This is because NextAuth v4 types `req.headers` as
`Record<string, string | string[] | undefined>` — a plain object, NOT a
WHATWG Headers instance. Using getRateLimitIp(req.headers as Headers) would
silently return null for every lookup and degrade rate-limit to email-only
on the credentials sign-in path.

**Rate limit fires before input validation (intentional).** A request with
no email body hits the rate-limit check first, where the identifier falls
back to the client IP. The result: empty-body and valid-email requests
land on different rate-limit keys (IP-only vs IP+email). This is a known
minor axis-of-attack asymmetry — a bot can probe the input-validation
layer without burning an email-bound rate-limit slot. We accept this
because:

1. The IP-axis still catches volume from any single source at 10/10min,
   regardless of body shape
2. Reversing the order — validation first, rate-limit after — creates a
   "free probe" channel where attackers can hit the validation layer
   millions of times without ever consuming a rate-limit slot. That's a
   worse trade-off
3. The asymmetry only matters once volume gets high enough to exhaust the
   IP-axis, at which point the 10/10min already triggered

If real-world abuse shows the asymmetry being exploited (e.g. logs show
high volume of no-email POSTs with the same IP cycling under the 10/10min
threshold), this can be tightened in a follow-up by either:
- Lowering the limit specifically for malformed requests
- Adding a separate "register-malformed" endpoint key
- Moving rate-limit after validation (accepts the free-probe risk)

### Routes protected (this PR)

- `/api/auth/register` (POST) — endpoint key: "register"
- `/api/auth/[...nextauth]` credentials authorize() — endpoint key:
  "signin-credentials". OAuth paths (Google + Apple) are NOT
  rate-limited at this layer — they're already gated by Google/Apple's
  own anti-abuse infrastructure and our domain verification.

### Routes deferred

- `/api/auth/forgot-password` — does not exist yet. Will be added when
  the forgot-password flow ships (likely P1.A.16 or P1.B).
- `/api/auth/verify-email` — token-based, single-use, sufficient on its
  own. Adding rate limit here would lock out users with email retry
  loops; defer until abuse is observed.

### Failure mode

Fail-open. When Upstash returns an error or times out:
- Request is allowed through
- `console.warn` is emitted with endpoint + error message
- Vercel logs surface the failure for monitoring

Rationale: auth flows must NEVER be blocked by rate-limit infrastructure
failures. The cost of a brief abuse window during an Upstash outage is
strictly less than the cost of locking out legitimate users.

### Error surfaces

- HTTP 429 with Retry-After, X-RateLimit-* headers from /api/auth/register
- NextAuth throws "RATE_LIMITED" error code from credentials authorize,
  surfaced in app/login/page.tsx as user-friendly copy

### RLS classification

No new routes, no DB writes from this PR (rate limit state lives in
Upstash, not Postgres). The Upstash client is module-scoped, not
tenant-scoped — appropriate since rate limit data is platform-level
abuse-defense, not tenant data.

**Module placement note:** getRateLimitIp and getLegalRecordIp live in
`lib/http/headers.ts`, not in `lib/rate-limit/*`. The two helpers have
intentionally different trust requirements and live together in a
generic HTTP-utility module so they're reusable from non-rate-limit
contexts (e.g. legal records). See PR #111 cycles 5–8 reviewer
discussion for the rationale.

## P1.A.14 — Cloudflare Turnstile signup CAPTCHA (2026-05-23)

### Infrastructure

External dependency added: Cloudflare Turnstile. Env vars required:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public, loaded in client bundle)
- `TURNSTILE_SECRET_KEY` (server-only, used in /api/auth/register)

When env vars are missing, the verifier logs a startup warning and
fail-opens (allows all requests). This means the PR ships safely before
the Cloudflare account is provisioned. Dev/preview should use Cloudflare's
documented test keys (always-pass) so the code path is identical to
production.

### Coverage

- `/api/auth/register` (POST) — Turnstile token verified before any
  business logic, after rate limit check.

### NOT covered (deferred)

- Sign-in (credentials authorize): rate limiting + correct-password
  requirement is sufficient defense. Adding Turnstile to every login
  would create unacceptable UX friction for legitimate users.
- `/api/auth/forgot-password`: route doesn't exist yet. Will be added
  when that route ships.
- OAuth paths (Google, Apple): gated by Google/Apple anti-abuse, no
  Turnstile needed.

### Failure mode

Fail-open. When Cloudflare's siteverify is unreachable, times out, or
returns a non-2xx status:
- Request is allowed through
- console.warn is emitted with the failure reason
- Vercel logs surface the failure for monitoring

Rationale: same philosophy as rate limiting. Auth flows must NEVER be
blocked by external infrastructure failures.

### Token handling

- Tokens expire 5 minutes after issuance per Cloudflare spec
- Client-side useEffect resets the widget after 4 minutes to force a
  fresh challenge if the user idled
- Server-side verification rejects expired tokens with reason
  "timeout-or-duplicate" (returned by Cloudflare)
- Tokens are single-use: re-submitting the same token fails verification

### RLS classification

No new routes, no new DB writes from this PR. Turnstile state is
stateless — verification happens on each /api/auth/register call.
Module-scoped warning flag in `lib/turnstile/verify.ts` is platform-
level (not tenant-scoped), appropriate for global verification state.

### Hostname binding

Cloudflare's Turnstile widget is bound to the domain configured in the
dashboard. The site key only works on that domain. For Kasse:
- Production site key: bound to `kasseapp.com` (covers all subdomains
  including `portal.kasseapp.com`)
- Dev/preview test key: bound to localhost (Cloudflare's test keys
  accept any hostname)

### IP forwarding

The `remoteip` parameter passed to /siteverify uses the same
`getRateLimitIp()` helper from `@/lib/http/headers`. Trust requirements
are similar to rate limiting (first-hop x-forwarded-for is fine — token
verification accuracy is helped by IP but not security-critical).

## P1.A.15 — Day 0 welcome email coverage (2026-05-23)

### Coverage

Closes two gaps in the existing P1.A.* email infrastructure:

1. `/api/auth/register` — Resend send is now fault-isolated. A Resend
   failure no longer causes a 500 response that confuses the user
   (account is created, email failed, user can't retry without "Email
   already registered" error).

2. `lib/auth.ts` signIn OAuth bootstrap branch — new welcome email
   sent to Google/Apple first-time signups. Previously this cohort
   got zero Day 0 touchpoint. New template at
   `lib/emails/oauth-welcome.ts` (no verify URL, just welcome +
   dashboard CTA — these users are already verified by their OAuth
   provider).

### NOT covered (intentional)

- Sign-in (subsequent logins): no welcome email; this is for FIRST-TIME
  signups only. The race-winner branch in signIn (when OAuth identity
  joins an existing email) correctly skips the welcome email since
  that's a sign-in, not a signup.
- Resend retry queue: if the email fails, we log and move on. No
  automatic retry. Same fail-open philosophy as Turnstile (P1.A.14)
  and rate-limiting (P1.A.13). If failure rates become problematic
  later, add a FailedEmail table and a cron-driven retry job.
- `lib/emails/verification.ts` Georgia serif font in kasse. wordmark:
  pre-existing brand drift, not introduced by this PR. The new
  `oauth-welcome.ts` uses Inter to match the design system. Follow-up
  PR will update verification.ts (and merchant-application.ts if it has
  the same issue) to match. This PR's template inconsistency is
  one-cycle-only.

### Failure mode

Fail-open with console.warn. Same pattern as Turnstile + rate-limit.
The credentials-path failure now also returns a slightly different
user-facing message ("we're sending your verification email now —
check your inbox in a few minutes") rather than a confusing
"Registration failed" 500.

### Log line PII

Two log sites for email-send failures, with different PII surfaces:

- `lib/auth.ts` OAuth welcome failure: masks the email local-part
  (`email.slice(0, 3) + "***"`) since the address might be a real
  user email (Apple Hide-My-Email relay addresses included).
- `app/api/auth/register/route.ts` credentials verification failure:
  logs only the userId (UUID), not the email. UserId is already
  internal-only; no masking needed.

Both follow the principle of "minimize PII in logs" — the email is
already in the DB row, no need to duplicate it in logs.

### RLS classification

No new routes, no new DB writes from this PR. Email sends are stateless
external calls to Resend. Module-scoped Resend client in lib/auth.ts
is platform-level (not tenant-scoped), appropriate for global email
infrastructure.

## Cron route classification (2026-05-25)

### Coverage

`/api/cron/*` routes are middleware-public — they bypass the
authenticated/role/permission guards because Vercel's cron scheduler
fires them without a user session. The route handlers themselves
enforce `Authorization: Bearer ${CRON_SECRET}` instead.

### Current cron routes

- `/api/cron/onboarding-janitor` (5-minute schedule, log-only sweep
  for stuck OnboardingSessions in *_PENDING states)

### Invariant — REQUIRED for every new cron route

**Every route under `/api/cron/` MUST validate
`Authorization: Bearer ${CRON_SECRET}` before performing any work.**

The middleware does not enforce this. The route map declares
`/api/cron` as public via longest-prefix match (one entry covers
all subroutes). If a developer adds a new cron route without the
bearer check, the route would be wide-open to the public — anyone
discovering the URL could trigger it without authorization.

Required pattern in every cron route handler:

```ts
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const cronSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  // Production: secret MUST be set; fail-closed if misconfigured.
  if (process.env.NODE_ENV === 'production' && !expected) {
    console.error('[CRON_AUTH_MISCONFIG] CRON_SECRET env var is not set');
    return NextResponse.json({ error: 'service_misconfigured' }, { status: 500 });
  }

  // All environments: if secret is set, enforce it. Only skip auth
  // entirely when secret is absent (dev/test convenience).
  //
  // ⚠️  DEV NOTE: when CRON_SECRET is absent, auth is skipped entirely.
  // Do NOT deploy to staging without CRON_SECRET set if your cron routes
  // use prismaAdmin or write data. Vercel auto-injects CRON_SECRET in
  // production via the cron scheduler integration; staging environments
  // must set it manually. Without it, anyone who discovers the URL can
  // trigger the route with full prismaAdmin access.
  if (expected && cronSecret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ... rest of handler
}
```

Copy this pattern verbatim into new cron route handlers.

### CRON_SECRET env var

Vercel auto-manages `CRON_SECRET` for projects with a crons entry in
vercel.json. It's automatically injected into the request as
`Authorization: Bearer ${CRON_SECRET}` by Vercel's cron scheduler.

If `[CRON_AUTH_MISCONFIG]` appears in production logs, the env var
is missing — set it manually per
https://vercel.com/docs/cron-jobs/manage-cron-jobs.

### RLS classification

Cron routes are platform-level (no tenant scoping). They use
`prismaAdmin` to bypass RLS for sweeping operations across all
organizations. This is correct — cron is the trusted scheduler, not
a tenant-scoped user. Each cron route's documentation should
explicitly note this in its route-handler comment block.

### Failure mode

Cron routes follow the standard fail-loud pattern for
infrastructure errors:
- Missing CRON_SECRET → 500 "service_misconfigured"
- Wrong CRON_SECRET → 401 "unauthorized"
- Route handler errors → propagate normally (Vercel cron will
  retry on next scheduled tick)

This is DIFFERENT from the fail-open pattern used for rate-limiting
(P1.A.13) and Turnstile (P1.A.14). Cron infrastructure failures are
operational, not user-facing — they should be loud, not silent.

## Email template hardening — verification + merchant-application (2026-05-25)

### Coverage

Follow-up to P1.A.15 (oauth-welcome.ts template hardening). Applies
the same three fixes symmetrically to the two existing transactional
email templates plus the inline admin-notification HTML in
send-application/route.ts:

1. **Inter font wordmark** — replaced `font-family:Georgia,serif` in
   the kasse. wordmark with the Kasse design system Inter stack
   (`'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`)
   in BOTH verification.ts AND merchant-application.ts. Brand
   consistency across all three templates (oauth-welcome.ts already
   uses Inter as of P1.A.15 cycle 3).

2. **HTML-escape user-supplied data** — added escapeHtml helper to
   each template and applied to all user-supplied interpolations:
   - verification.ts: name + businessName (2 fields, 3 sites)
   - merchant-application.ts: ownerFirstName + ownerLastName +
     businessName + monthlyVolume + avgTicket (5 fields, 7 sites)
   - send-application/route.ts admin notification: same 5 fields
     plus ctx.email + ein (7 sites)

3. **Footer links in verification.ts only** — replaced three
   `<a href="#">` placeholder links (Privacy + Terms + Unsubscribe)
   with real /privacy + /terms links (Unsubscribe removed — transactional
   emails are CAN-SPAM exempt). Required adding baseUrl param to the
   template function and updating the call site in
   app/api/auth/register/route.ts.

   merchant-application.ts NOT touched for footer links — its footer
   was already clean (no placeholder links).

### Helper duplication note

The escapeHtml function is duplicated across three sites:
oauth-welcome.ts (P1.A.15), verification.ts, merchant-application.ts,
plus send-application/route.ts. Once we have 3+ copies in production,
a future cleanup PR extracts the helper to lib/emails/escape.ts. Doing
the extraction in this PR is premature consolidation — wait for the
pattern to prove stable across multiple template types first.

### No new routes, no new DB writes

Pure template + inline-HTML hardening. No new persistence, no new
RLS surface, no migration. Existing tests cover the email-send fault
isolation pattern; the escape changes are visual correctness, not
functional behavior changes.

### Subject lines NOT escaped

Email subject lines are plain text per RFC 5322, not HTML. Resend
handles subject sanitization at the SMTP layer. Only HTML body
interpolations need escapeHtml.

## Email helper consolidation — lib/emails/escape.ts (2026-05-25)

### Coverage

Extracted the duplicated `escapeHtml` helper from four sites into a
single canonical module at `lib/emails/escape.ts`. No behavior change
— pure refactor. The four call sites are now consumers, not owners:

- `lib/emails/oauth-welcome.ts`
- `lib/emails/verification.ts`
- `lib/emails/merchant-application.ts`
- `app/api/onboarding/send-application/route.ts`

### Rationale

Reviewer of PR #117 (email templates symmetric hardening) flagged the
4-copy duplication as the next refactor. Consolidation prevents future
template additions from forking the implementation. The new module
includes expanded JSDoc covering when to use escapeHtml (user-supplied
HTML interpolation), when NOT to use it (server-controlled URLs,
email subjects, URL query params).

### No new routes, no new DB writes

Pure code consolidation. The function implementation is character-for-
character identical to the previous copies (verified in PR #117 cycle 1).
Tests that exercise the existing email send paths cover the consolidation
transitively — there's no separate test surface for the helper itself
since it's a small pure function.

## Password-reset email hardening (2026-05-25)

### Coverage

Symmetric application of the PR #117 template hardening pattern to
the remaining transactional email template:

1. **Inter font wordmark** — replaced `font-family:Georgia,serif`
   in the kasse. wordmark with the Kasse design system Inter stack.
   All four templates now use Inter consistently
   (oauth-welcome.ts, verification.ts, merchant-application.ts,
   password-reset.ts).

2. **Footer links** — replaced three `<a href="#">` placeholder
   links (Privacy + Terms + Unsubscribe) with real /privacy +
   /terms links. Unsubscribe removed (transactional, CAN-SPAM
   exempt). Required adding baseUrl param to the template function
   and updating the call site in
   `app/api/auth/forgot-password/route.ts`.

3. **NOT applied: HTML escape** — password-reset.ts intentionally
   doesn't interpolate any user-supplied data. The template doesn't
   include the recipient's name or business name (security/abuse
   defense for password reset flows — exposing user identity in the
   reset email could aid phishing or social engineering). Only
   `resetUrl` and `baseUrl` are interpolated, both server-controlled.
   No escapeHtml import needed.

### Resend send fault-isolation in forgot-password/route.ts

Closed a fault-isolation gap pre-dating this session: the Resend
send was await-ed inline with no try/catch. A Resend failure would
propagate to Next.js's default error handler and return 500 to the
user — even though the User row was already updated with
passwordResetToken + passwordResetExp. The user would retry,
invalidating the first token with a new one, OR see a confusing
error.

Same fault-isolation pattern as register/route.ts post-PR #115
cycle 1. Key difference: the success response is NOT differentiated
based on emailSent because the email-enumeration-prevention
requirement means the "real user with Resend failure" case and the
"unknown user" case MUST return identical JSON. The emailSent flag
exists only for log-side observability via console.warn (PII-masked
to userId, no email).

### No new routes, no new DB writes

Pure template hardening + fault-isolation. No new persistence, no
new RLS surface, no migration. The existing user.update for the
reset token happens BEFORE the Resend call (unchanged).

## P1.B.1 — Wizard shell (2026-05-25)

### Routes added

None at the route-handler level. P1.B.1 adds server-rendered PAGES
at `/onboarding/wizard` and `/onboarding/wizard/step-N` (8 step
placeholders). Pages are NOT API routes; they're not in the RLS
classification taxonomy.

### Page auth & DB access

All 9 wizard pages (`page.tsx` + step-1 through step-8) use the
same pattern:

1. `getServerSession(authOptions)` for auth gate
2. `prismaAdmin.onboardingSession.findFirst` to look up the
   user's session by userId

The `prismaAdmin` access is SELF_READ — the query is scoped by
`userId: session.user.id` (server-verified). Same security
property as the existing `/api/onboarding/refresh-session` route
classified as SELF_READ. No cross-tenant exposure possible because:

- The query filter uses session.user.id exclusively
- No client-supplied identifier is read or accepted
- A user can only read their OWN OnboardingSession row

This pattern is server-page-only — no API route is added by this PR.
When step pages get POST forms in P1.C.*, each will go through an
already-classified `/api/onboarding/*` route (org, location,
services, etc.).

### No new tables, no new RLS surface

Pure UI shell. The OnboardingSession + OnboardingStateTransition
tables (P1.A.1) are used read-only.

## P1.B.6 + P1.B.7 — Abandoned wizard cron + email (2026-05-26)

### Routes added

`GET /api/cron/onboarding-abandoned` — hourly cron.

**Auth**: Bearer cron secret only (canonical pattern from PR #116).
No session, no tenant context. Classification: **public via cron** —
the route accepts ONLY requests with a valid `Authorization: Bearer
${CRON_SECRET}` header. Vercel cron sends the header automatically;
no user traffic should reach this route.

**Data access**: prismaAdmin (no tenant context — cron writes
cross-tenant). Reads `OnboardingSession` rows where `state != COMPLETED`,
`abandonedEmailSentAt IS NULL`, `createdAt < now() - 24h`,
`expiresAt > now()`. Writes `abandonedEmailSentAt = now()` after
successful Resend send.

**Authorization model**: same as `/api/cron/onboarding-janitor`. The
cron secret validates that Vercel (or an authenticated developer
testing) is calling. No user or tenant authorization applies.

### Schema change

Added `OnboardingSession.abandonedEmailSentAt: DateTime?` plus a
partial index for the cron query. RLS policies on OnboardingSession
unchanged — the new column inherits the table's existing policies.

### Email template

`lib/emails/wizard-abandoned.ts` follows the canonical template
pattern (Inter font, real footer links via baseUrl, no
personalization). NO escapeHtml needed because no user-supplied data
is interpolated. Matches password-reset.ts (PR #119).

### Known gap

The email's resume link goes to `/onboarding/resume/[token]` which
doesn't exist yet (P1.B.8). Clicked links will 404 until P1.B.8
ships in the next PR. Pre-launch, the production impact is nil.
Tracked as PR #123 follow-up.

### Cycle 2 hardening

Updated `/api/cron/onboarding-abandoned` AND
`/api/cron/onboarding-janitor` to require CRON_SECRET unconditionally.
The previous pattern (skip auth when secret absent for dev
convenience) left preview deployments open. Developers testing locally
can set CRON_SECRET in .env.local. Production sets it via Vercel env
vars.

### Cycle 3 hardening

Cron route's email-send loop refactored to claim-then-send pattern:
atomically stamps `abandonedEmailSentAt` via conditional updateMany
BEFORE the Resend call. If two overlapping cron invocations both read
the same un-emailed session, only one's claim succeeds — the other's
updateMany returns count === 0 and skips. Prevents double-send on
Vercel's non-single-instance cron execution.

Trade-off: Resend failure after the stamp leaves the stamp set with
no retry; acceptable per "miss-once is better than send-twice" for
recovery emails.

Also quoted `state` identifier in schema partial index raw() to align
with migration SQL — purely to prevent `prisma migrate diff`
false-positive drift warnings.

### P1.B.8 — Resume route (PR #125, 2026-05-26)

`/onboarding/resume/[token]` is a public route that validates a JWT
resume token signed by `signResumeToken` (TTL: 7 days), then triggers
a NextAuth credentials provider sign-in via the `onboarding-resume`
provider id. Both the page route and the auth provider live in code,
no API route is added.

**Auth model:** Token IS the auth. Possession of a valid token proves
the user owns the session's email (received it at that email). The
token is NOT consumed on use — a user clicking the link twice both
succeeds. The token EXPIRES after 7 days regardless.

**Classification:**
- Route: PUBLIC (no auth required to reach)
- DB access (server component, `app/onboarding/resume/[token]/page.tsx`):
  `verifyResumeToken` → `getSessionById` → `prismaAdmin` for
  OnboardingSession lookup. PRE_SESSION (no user session exists yet
  when the page renders).
- DB access (credentials provider, `lib/auth.ts` authorize callback):
  `prismaAdmin` for OnboardingSession + User lookup. PRE_SESSION
  (the authorize() runs before NextAuth issues the JWT).

Note: the happy path performs the OnboardingSession lookup twice —
once server-side in page.tsx (to enable rich ResumeError rendering
with granular error codes) and once in authorize() (authoritative
NextAuth verification before session issuance). This is deliberate;
the cost is two cheap lookups for substantially better error UX. A
TOCTOU window of ~500ms exists between the two calls; if the token
expires in that window, the user sees the generic ResumeAutoSignIn
fallback message instead of the rich ResumeError page.

**Edge cases:**
- Expired token → renders ResumeError page
- Session not found / expired / completed → ResumeError page
- Email mismatch (token email ≠ session email) → ResumeError page
- User inactive (isActive = false) → authorize returns null, NextAuth
  surfaces error, ResumeAutoSignIn shows fallback error message
- Network error during signIn → ResumeAutoSignIn shows fallback

**PII discipline:** Logs in the authorize() callback include
user.id and session.id, NEVER user.email or session.email.

**Closes P1.B:** With this route shipped, P1.B (Wizard Shell) is
complete. P1.C (the 8 wizard step forms) is the next phase.
