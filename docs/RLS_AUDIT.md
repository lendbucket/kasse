# RLS Route Classification

**Version:** 1.0
**Phase:** 0.5.3b-1
**Status:** Living document — update when adding new API routes
**Owner:** Foundation engineering

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

## Routes

### TENANT_SCOPED — Uses `requireTenantContext` + `withTenantScope`

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/clients` | GET, POST | Lists/creates clients scoped to tenant org; asserts location ownership on POST |
| `/api/staff` | GET, POST | Lists/creates staff scoped to tenant org; asserts location ownership on POST |
| `/api/locations` | GET | Returns locations belonging to the authenticated tenant |
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

- TENANT_SCOPED: **20**
- BYPASS_NEEDED: **10**
  - PRE_SESSION: **5** (auth handlers + NextAuth)
  - SUPERADMIN: **5** (admin portal operations)
- PUBLIC_STATIC: **1** (static endpoints with no auth or tenant context)
- UNDECIDED: **0**

**Total routes: 31**

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

User, Account, Session, VerificationToken — auth tables, accessed via prismaAdmin
Child tables without organizationId (e.g. AppointmentAddon, TransactionItem,
GiftCardRedemption, LoyaltyEvent, ClientMembership, CampaignRecipient,
FormSubmission, ClockEvent, PerformanceStat, Notification, FamilyMember)
— protected transitively through their parent's tenant-scoped row

### Postgres role analysis (queried 2026-05-11)

Application connects as `postgres`, which has rolbypassrls=TRUE and owns
every table. To make RLS actually fire, the migration uses
`FORCE ROW LEVEL SECURITY` on every table — this makes RLS apply even to
the table owner.

Without FORCE, the policies would compile and exist in pg_policies but
no query would ever be subject to them. This was identified by PR #23
reviewer Concern #1.

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

### Rollout sequence

| PR | Sub-commit | What | Status |
|----|----|----|----|
| #23 | 0.5.3b-3a | Author migration SQL (not applied) | In progress (this PR) |
| #26 | 0.5.3b-3b | Build rls-verify.ts harness + rls-test-2 fixture | Completed |
| TBD | 0.5.3b-3c | Apply on Supabase database branch, run smoke + audit-verify + rls-verify | Pending |
| TBD | 0.5.3b-3d | Apply to production (off-hours, rollback prepared) | Pending |

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
| 0.5.3b-3b | Built rls-verify.ts harness (two-mode design — RLS_NOT_APPLIED / RLS_APPLIED / PARTIAL). Added rls-test-2 seed fixture. All 6 DB-level tests + 1 application-layer test from PR #23 reviewer Concerns are covered. Today the harness reports RLS_NOT_APPLIED against production, which is correct — PR #27 applies policies to the Supabase branch, then re-runs the harness to confirm RLS_APPLIED. |
