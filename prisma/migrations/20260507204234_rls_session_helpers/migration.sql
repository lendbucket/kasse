-- Phase 0.5.3a — RLS session helpers.
-- These functions set/clear/read the per-connection tenant scope.
-- No RLS policies are added in this migration. That ships in 0.5.3b.

-- Set the current tenant for the connection.
-- Called by the Prisma extension at the start of every tenant-scoped query.
CREATE OR REPLACE FUNCTION app_set_tenant(org_id text, is_superadmin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_org_id', COALESCE(org_id, ''), true);
  PERFORM set_config('app.is_superadmin', CASE WHEN is_superadmin THEN 'true' ELSE 'false' END, true);
END;
$$;

-- Clear the tenant for the connection. Called after the query runs.
CREATE OR REPLACE FUNCTION app_clear_tenant()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_org_id', '', true);
  PERFORM set_config('app.is_superadmin', 'false', true);
END;
$$;

-- Read helper for use inside RLS policies (added in 0.5.3b).
-- Returns the current tenant org id for the session, or empty string if not set.
CREATE OR REPLACE FUNCTION app_current_org_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.current_org_id', true), '');
$$;

-- Read helper: is the current connection a superadmin?
CREATE OR REPLACE FUNCTION app_is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.is_superadmin', true), 'false') = 'true';
$$;

-- Sanity check for the read helpers — used by tests.
COMMENT ON FUNCTION app_current_org_id IS 'Returns the org id set for the current connection via app_set_tenant. Empty string if not set.';
COMMENT ON FUNCTION app_is_superadmin IS 'True if app_set_tenant was called with is_superadmin=true for this connection.';
