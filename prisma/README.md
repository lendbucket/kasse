# Prisma migrations — Kasse

## Do not run `prisma migrate dev` or `prisma migrate deploy` against production.

All schema changes in this project are applied via Supabase MCP with
manual SQL review. The `_prisma_migrations` tracking table is currently
drifted from the actual production schema state — see the "Migration
tracking drift (2026-05-20)" section in `docs/RLS_AUDIT.md` for details
and the planned cleanup.

Migrations live in this folder as a historical record of what was applied.
They are NOT automatically run.

If you are a new contributor, do not run any `prisma migrate` commands
against production until the tracking-table cleanup PR has landed.

For local development with a fresh Supabase project, see the onboarding
runbook (TBD).
