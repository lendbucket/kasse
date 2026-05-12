-- ============================================================================
-- Phase 0.5.3b-3d-a — kasse_app role bootstrap
-- ============================================================================
-- Purpose:
--   Creates the kasse_app Postgres role that the Kasse application will
--   connect as in production after PR #28f cutover. The application currently
--   connects as the postgres role, which has rolbypassrls=TRUE, meaning RLS
--   policies (authored in 20260511121142_rls_policies) silently do not
--   enforce on app queries.
--
--   The kasse_app role has rolbypassrls=FALSE, so RLS policies actually fire.
--
--   This was discovered during branch verification in Phase 0.5.3b-3c — the
--   FORCE ROW LEVEL SECURITY on tables was insufficient because rolbypassrls
--   is evaluated separately and overrides FORCE.
--
-- How this migration runs:
--   This migration must run as a Postgres SUPERUSER (or a role with
--   CREATE ROLE permission). On Supabase, the postgres role has this. The
--   application's normal DATABASE_URL connection (post-cutover) will be
--   kasse_app, which is NOT a superuser and cannot run this migration.
--
--   Therefore, in production this migration must be applied using a
--   MIGRATION_DATABASE_URL that points at postgres (not kasse_app).
--   See docs/RLS_AUDIT.md "Env var architecture" section for the full setup.
--
-- Idempotency:
--   The CREATE ROLE statement is wrapped in a DO block that checks for
--   existence first, so this migration can be safely re-applied.
--
-- Rollback:
--   To roll back, see the ROLLBACK section at the bottom of this file
--   (commented out). The reverse migration drops the role and all its
--   grants. Drop the role only after switching DATABASE_URL back to
--   postgres in Vercel; otherwise the app will fail to connect.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kasse_app') THEN
    -- Password is set to a deliberately-invalid placeholder. The real password
    -- is set out-of-band via Supabase dashboard "Reset password" after this
    -- migration runs, before the env var swap. The placeholder ensures that
    -- if someone tries to connect with this default, it fails immediately.
    CREATE ROLE kasse_app
      WITH LOGIN
      PASSWORD 'PLACEHOLDER_REPLACE_VIA_SUPABASE_DASHBOARD'
      NOBYPASSRLS;
  END IF;
END
$$;

-- Schema usage. Without this, kasse_app cannot reference any object in public.
GRANT USAGE ON SCHEMA public TO kasse_app;

-- CRUD privileges on all existing tables in public schema.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kasse_app;

-- Sequence privileges for cuid/serial columns.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kasse_app;

-- Default privileges: ensure any FUTURE tables/sequences created by future
-- migrations automatically grant access to kasse_app. Without these, every
-- new table would be inaccessible to the app until manually granted.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kasse_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO kasse_app;

-- EXECUTE on the RLS session helper functions. These functions are
-- SECURITY DEFINER (run with definer's privileges), but the caller still
-- needs EXECUTE permission to invoke them. These were created in migration
-- 20260507204234_rls_session_helpers.
GRANT EXECUTE ON FUNCTION app_set_tenant(text, boolean) TO kasse_app;
GRANT EXECUTE ON FUNCTION app_clear_tenant() TO kasse_app;
GRANT EXECUTE ON FUNCTION app_set_actor(text, text, text, text, text, text) TO kasse_app;
GRANT EXECUTE ON FUNCTION app_clear_actor() TO kasse_app;
GRANT EXECUTE ON FUNCTION app_current_org_id() TO kasse_app;
GRANT EXECUTE ON FUNCTION app_is_superadmin() TO kasse_app;

-- ============================================================================
-- POST-MIGRATION OPERATOR CHECKLIST
-- ============================================================================
-- After this migration runs:
--
--   1. Verify the role exists with the right attributes:
--        SELECT rolname, rolsuper, rolbypassrls, rolcanlogin
--        FROM pg_roles WHERE rolname = 'kasse_app';
--      Expected: rolsuper=false, rolbypassrls=false, rolcanlogin=true
--
--   2. Set the real password via Supabase dashboard or this SQL:
--        ALTER ROLE kasse_app WITH PASSWORD '<strong random password>';
--      Save the password to your secret manager. Do not paste it anywhere
--      it could be logged.
--
--   3. The app is NOT yet connecting as kasse_app at this point. Connection
--      role switch happens in PR #28e (Vercel env var update) and #28f
--      (Vercel redeploy).
--
--   4. Until cutover (PR #28f), production behavior is unchanged. RLS
--      policies exist (after 20260511121142_rls_policies is also applied)
--      but the app still connects as postgres which bypasses them. RLS
--      will not enforce until the app is redeployed with the new
--      DATABASE_URL pointing at kasse_app.
-- ============================================================================

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To remove the kasse_app role and its grants, run the following SQL as a
-- superuser. Do NOT uncomment in this file — copy to a separate emergency
-- script if needed.
--
-- IMPORTANT: only drop the role AFTER switching the app's DATABASE_URL back
-- to postgres in Vercel and redeploying. Otherwise the app will lose its
-- connection mid-traffic.
--
--   -- Revoke default privileges first to prevent permission issues on existing tables
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM kasse_app;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM kasse_app;
--
--   -- Revoke all granted privileges
--   REVOKE ALL ON ALL TABLES IN SCHEMA public FROM kasse_app;
--   REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM kasse_app;
--   REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM kasse_app;
--   REVOKE USAGE ON SCHEMA public FROM kasse_app;
--
--   -- Drop the role
--   DROP ROLE kasse_app;
-- ============================================================================
