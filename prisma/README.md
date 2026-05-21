# Prisma migrations — Kasse

## Schema change workflow

All schema changes for Kasse are applied via Supabase MCP with manual SQL review.
After applying via MCP, commit the migration.sql to `prisma/migrations/<timestamp>_<name>/`
and run `npx prisma migrate resolve --applied <timestamp>_<name>` to record it in
`_prisma_migrations`. **Both steps must happen before merging the PR.**

## Why this workflow (not `prisma migrate deploy`)

- DDL changes need human eyes before they hit production
- The `prisma migrate dev` shadow-database workflow doesn't fit Supabase's pooled-connection security model
- Schema changes are infrequent enough that the manual review step is fast
- Storage-policy migrations and role-grants require the `postgres` role; the
  `kasse_app` runtime role cannot execute them. Running these via MCP keeps the
  privileged execution path explicit and reviewable.

## Migration tracking is now consistent

As of 2026-05-21, `_prisma_migrations` matches what's on disk. Every migration
in `prisma/migrations/` has a tracking row with its correct SHA-256 checksum,
and there are no orphan or duplicate rows.

`npx prisma migrate status` reports **"Database schema is up to date!"**

For details on the 2026-05-21 cleanup operation, see the "Migration tracking
drift cleanup (2026-05-21)" section in `docs/RLS_AUDIT.md`.

## Standing rules for new contributors

- Do **NOT** run `npx prisma migrate dev` against production
- Do **NOT** run `npx prisma migrate deploy` against production without coordinating
  — DDL operations require `MIGRATION_DATABASE_URL` (postgres role), not `DATABASE_URL`
  (kasse_app role)
- For local development with a fresh Supabase project, see the onboarding runbook (TBD)

## Known cosmetic gap

5 P0.A migrations have tracking rows in `_prisma_migrations` but no on-disk
`migration.sql` files:

- `20260514160000_p0_a_6_permission_set_schema_sync`
- `20260514160100_p0_a_6_permissionset_select_allow_system_rows`
- `20260514210000_p0_a_11_user_custom_role_id`
- `20260514230000_p0_a_13_groupid_move_to_location`
- `20260515000000_p0_a_13_organizationgroup_add_organizationid`

The schema changes they represent are applied to production (verified via direct
schema inspection — see `docs/RLS_AUDIT.md` "P0.A.13 Deployment Notes"). Tracking
is accurate; only the historical file record is missing. They were applied during
the P0.A permission-engine ship via direct Supabase MCP SQL and the migration.sql
files were never committed to git.

This is a cosmetic gap. It does not block deploys today because no CI/CD step runs
`prisma migrate deploy`. Before multi-developer onboarding, these 5 files will be
reverse-engineered from the live schema and committed as a housekeeping PR.