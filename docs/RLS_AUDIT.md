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

### TENANT_SCOPED_PENDING — Old `getServerSession` pattern, needs migration

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/clients/[id]` | GET, PATCH | Fetches/patches a client by raw ID with NO organizationId scope check — cross-tenant read/write risk |
| `/api/staff/[id]` | PATCH, DELETE | Updates/soft-deletes staff by raw ID with NO organizationId scope check — cross-tenant mutation risk |

### BYPASS_NEEDED — PRE_SESSION (public, no session required)

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth catch-all handler for sign-in, sign-out, session, callbacks (PRE_SESSION) |
| `/api/auth/register` | POST | Creates new user + org + business settings; hashes password; sends verification email (PRE_SESSION) |
| `/api/auth/forgot-password` | POST | Sets password reset token and sends reset email; always returns success to prevent enumeration (PRE_SESSION) |
| `/api/auth/reset-password` | POST | Validates reset token, hashes new password, clears token fields (PRE_SESSION) |
| `/api/auth/verify-email` | GET | Validates email verification token, stamps emailVerified, redirects to onboarding (PRE_SESSION) |

### BYPASS_NEEDED — SUPERADMIN (cross-tenant operations)

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/admin/stats` | GET | Platform-wide aggregate stats (merchant count, trials, locations, recent signups) (SUPERADMIN) |
| `/api/admin/merchants` | GET, POST | Lists all orgs with owner/counts; creates new orgs — superadmin gated (SUPERADMIN) |
| `/api/admin/merchants/[orgId]` | GET, PATCH, DELETE | Fetches/updates/hard-deletes a specific org by ID — superadmin gated (SUPERADMIN) |
| `/api/admin/users` | GET | Lists all users across all orgs — superadmin gated (SUPERADMIN) |
| `/api/admin/users/[userId]` | PATCH | Toggles user isActive or force-resets password — superadmin gated (SUPERADMIN) |

### BYPASS_NEEDED — ONBOARDING (session exists, org setup in progress)

| Route | Method(s) | Reason |
|-------|-----------|--------|
| `/api/onboarding` | POST | Saves onboarding progress for steps 2–9; writes org/location/service/settings data (ONBOARDING) |
| `/api/onboarding/complete` | POST | Persists full merchant payment application (banking, PII, business details); sends notification email (ONBOARDING) |
| `/api/onboarding/send-application` | POST | Sends SalonTransact application confirmation + admin notification emails; no DB writes (ONBOARDING) |
| `/api/onboarding/template` | GET | Returns hardcoded CSV template for requested import type; fully public, no auth, no DB (ONBOARDING) |

## Summary

- TENANT_SCOPED: **15**
- TENANT_SCOPED_PENDING (needs migration): **2**
  - `/api/clients/[id]` — cross-tenant read/write risk
  - `/api/staff/[id]` — cross-tenant mutation risk
- BYPASS_NEEDED: **14**
  - PRE_SESSION: **5** (auth handlers + NextAuth)
  - SUPERADMIN: **5** (admin portal operations)
  - ONBOARDING: **4** (org setup flow + CSV template)
- UNDECIDED: **0**

**Total routes: 31**

## What happens next

- **0.5.3b-1.1 (immediate):** Migrate the 2 TENANT_SCOPED_PENDING routes
  (`/api/clients/[id]` and `/api/staff/[id]`) to `requireTenantContext` +
  `withTenantScope`. These are cross-tenant vulnerabilities that must be
  closed before RLS is relevant.
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

### `/api/clients/[id]` and `/api/staff/[id]` — SECURITY GAP

These routes accept an ID parameter and fetch/mutate the record without
checking `organizationId`. Any authenticated user can read or modify any
client or staff record across all tenants by guessing/enumerating IDs.
Migration to `requireTenantContext` is the highest-priority follow-up.
