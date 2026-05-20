-- P95: Add superadmin bypass to EmploymentAgreement RLS policy.
--
-- The current policy is FOR ALL with only tenant matching. This means
-- prismaAdmin.* operations on EmploymentAgreement are blocked by RLS,
-- which prevents future admin tools (janitor jobs, support flows,
-- compliance reporting) from operating on these rows.
--
-- This migration replaces the single FOR ALL policy with per-command
-- policies (SELECT/INSERT/UPDATE/DELETE) that include the superadmin
-- OR clause — same pattern as Location, Service, Staff, StaffInvitation.
--
-- Applied to production via Supabase MCP on 2026-05-20.

DROP POLICY IF EXISTS "tenant_isolation" ON "EmploymentAgreement";

CREATE POLICY "tenant_isolation_select" ON "EmploymentAgreement"
  FOR SELECT USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_insert" ON "EmploymentAgreement"
  FOR INSERT WITH CHECK (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_update" ON "EmploymentAgreement"
  FOR UPDATE USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_delete" ON "EmploymentAgreement"
  FOR DELETE USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );
