-- ============================================================================
-- P0.5.3d: RLS auth_rls_initplan performance optimization
-- ============================================================================
--
-- Wraps every current_setting('app.X', true) call in RLS policy expressions in
-- (SELECT current_setting('app.X', true)) so PostgreSQL evaluates the function
-- once per query instead of once per row.
--
-- Background:
--   Supabase performance advisor flagged 239 auth_rls_initplan warnings across
--   89 tables. Each warning indicates that current_setting() is being
--   re-evaluated per row during RLS policy checks, which produces suboptimal
--   query performance at scale (10-100x slower for large tenant data sets).
--
-- Fix:
--   PostgreSQL guarantees that an InitPlan node — produced by wrapping a
--   subquery in parentheses with SELECT — is evaluated exactly once per
--   query, then its scalar result is cached for all subsequent row checks.
--   The pattern `(SELECT current_setting('app.X', true))` triggers this
--   optimization while remaining functionally identical to the bare call.
--
-- Reference:
--   https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Semantic equivalence:
--   The (SELECT ...) wrapper changes nothing about WHAT is evaluated —
--   only HOW MANY TIMES. set_config('app.X', value, true) still sets the
--   session variable transaction-locally via SET LOCAL, the value is still
--   read inside the policy check, and the row is still filtered by the
--   same boolean expression. This is a pure query-plan optimization with
--   zero behavioral change.
--
-- Approach:
--   This migration uses a DO block that iterates over pg_policies, applies
--   regexp_replace to wrap every current_setting() call, drops the old
--   policy, and creates the new one with the wrapped expression — all in
--   a single transaction. If any individual policy rewrite fails, the
--   entire migration rolls back.
--
-- Tables affected: 89
-- Policies affected: 239 (count emitted by the DO block as RAISE NOTICE)
--
-- Excluded from rewrite:
--   - Policies using is_current_user_superadmin() SECURITY DEFINER function
--     (FeatureFlag, FeatureFlagAudit) — Postgres already caches these per-query
--   - Policies with qual = 'true' (FeatureFlag.featureflag_read) — no
--     current_setting() to wrap
--
-- Applied to production via Supabase MCP on 2026-05-21.
--
-- IMPORTANT: this migration's DROP POLICY / CREATE POLICY statements
-- require the postgres role (table owner). When running via
-- `prisma migrate deploy`, MIGRATION_DATABASE_URL must point to a
-- postgres-role connection. The kasse_app role cannot execute these
-- statements (it lacks ownership of the policied tables).
-- See docs/RLS_AUDIT.md "Production State Log" for the
-- DATABASE_URL/MIGRATION_DATABASE_URL split.
-- ============================================================================

DO $migration$
DECLARE
  policy_record RECORD;
  new_qual TEXT;
  new_with_check TEXT;
  drop_sql TEXT;
  create_sql TEXT;
  policies_rewritten INTEGER := 0;
BEGIN
  FOR policy_record IN
    SELECT 
      tablename,
      policyname,
      cmd,
      qual,
      with_check,
      permissive,
      roles
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%current_setting(%' OR with_check LIKE '%current_setting(%')
      AND NOT (
        (qual IS NOT NULL AND qual NOT LIKE '%current_setting(%' OR qual LIKE '%(SELECT current_setting(%')
        AND (with_check IS NOT NULL AND with_check NOT LIKE '%current_setting(%' OR with_check LIKE '%(SELECT current_setting(%')
      )
    ORDER BY tablename, cmd, policyname
  LOOP
    new_qual := regexp_replace(
      policy_record.qual,
      'current_setting\(''(app\.[a-z_]+)''::text, true\)',
      '(SELECT current_setting(''\1''::text, true))',
      'g'
    );
    new_with_check := regexp_replace(
      policy_record.with_check,
      'current_setting\(''(app\.[a-z_]+)''::text, true\)',
      '(SELECT current_setting(''\1''::text, true))',
      'g'
    );

    IF (new_qual IS NOT DISTINCT FROM policy_record.qual) 
       AND (new_with_check IS NOT DISTINCT FROM policy_record.with_check) THEN
      CONTINUE;
    END IF;

    drop_sql := format('DROP POLICY %I ON public.%I', policy_record.policyname, policy_record.tablename);
    EXECUTE drop_sql;

    create_sql := format(
      'CREATE POLICY %I ON public.%I FOR %s',
      policy_record.policyname,
      policy_record.tablename,
      policy_record.cmd
    );

    IF new_qual IS NOT NULL THEN
      create_sql := create_sql || format(' USING (%s)', new_qual);
    END IF;
    IF new_with_check IS NOT NULL THEN
      create_sql := create_sql || format(' WITH CHECK (%s)', new_with_check);
    END IF;

    EXECUTE create_sql;
    policies_rewritten := policies_rewritten + 1;
  END LOOP;

  RAISE NOTICE 'P0.5.3d: rewrote % RLS policies to wrap current_setting() in (SELECT ...)', policies_rewritten;
END;
$migration$;
