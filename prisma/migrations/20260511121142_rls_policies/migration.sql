-- ============================================================================
-- Phase 0.5.3b-3a -- Row-Level Security policies
-- ============================================================================
--
-- Purpose:
--   Enforce tenant isolation at the database layer. Every tenant-scoped table
--   gets a SELECT/INSERT/UPDATE/DELETE policy that:
--     1. Allows the operation if app.is_superadmin = 'true' (set by prismaAdmin)
--     2. Otherwise restricts rows to those matching app.current_org_id
--        (set by withTenantScope)
--
-- Defense-in-depth:
--   The application layer ALREADY scopes every tenant-scoped query by
--   organizationId in its WHERE clauses. These RLS policies are the second
--   line of defense: if a future application bug omits the WHERE clause,
--   the database itself refuses to return cross-tenant rows.
--
-- Connection-pool behavior:
--   The app sets app.is_superadmin and app.current_org_id via SET LOCAL inside
--   transactions (see lib/tenant/db-scope.ts and lib/prismaAdmin.ts). SET LOCAL
--   is transaction-scoped, so connections returning to the pool carry no
--   leaked tenant context.
--
-- AuditLog exception:
--   The audit log has SELECT-only policy for tenants. INSERTs come from the
--   audit trigger function (app_audit_trigger) which runs with SECURITY DEFINER
--   and bypasses RLS entirely. UPDATE and DELETE are not permitted at all.
--
-- Child tables without organizationId:
--   AppointmentAddon, TransactionItem, GiftCardRedemption, LoyaltyEvent,
--   ClientMembership, CampaignRecipient, FormSubmission, ClockEvent,
--   PerformanceStat, Notification, FamilyMember -- these are protected
--   transitively through their parent table's RLS policy.
--
-- Rollback:
--   To roll back this migration, run the contents of the ROLLBACK section
--   at the bottom of this file (commented out). Disable RLS on every table
--   and drop every policy.
-- ============================================================================


-- --- Location ---------------------------------------------------------------
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Location"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Location"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Location"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Location"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Staff ------------------------------------------------------------------
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Staff"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Staff"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Staff"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Staff"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Client -----------------------------------------------------------------
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Client"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Client"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Client"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Client"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Service ----------------------------------------------------------------
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Service"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Service"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Service"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Service"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Appointment ------------------------------------------------------------
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Appointment"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Appointment"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Appointment"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Appointment"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Transaction ------------------------------------------------------------
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Transaction"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Transaction"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Transaction"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Transaction"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- GiftCard ---------------------------------------------------------------
ALTER TABLE "GiftCard" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "GiftCard"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "GiftCard"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "GiftCard"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "GiftCard"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- LoyaltyProgram ---------------------------------------------------------
ALTER TABLE "LoyaltyProgram" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "LoyaltyProgram"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "LoyaltyProgram"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "LoyaltyProgram"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "LoyaltyProgram"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Membership -------------------------------------------------------------
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Membership"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Membership"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Membership"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Membership"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- WaitlistEntry ----------------------------------------------------------
ALTER TABLE "WaitlistEntry" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "WaitlistEntry"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "WaitlistEntry"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "WaitlistEntry"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "WaitlistEntry"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Campaign ---------------------------------------------------------------
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Campaign"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Campaign"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Campaign"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Campaign"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- ReviewRequest ----------------------------------------------------------
ALTER TABLE "ReviewRequest" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "ReviewRequest"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "ReviewRequest"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "ReviewRequest"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "ReviewRequest"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- FormTemplate -----------------------------------------------------------
ALTER TABLE "FormTemplate" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "FormTemplate"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "FormTemplate"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "FormTemplate"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "FormTemplate"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- PermissionSet ----------------------------------------------------------
ALTER TABLE "PermissionSet" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "PermissionSet"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "PermissionSet"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "PermissionSet"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "PermissionSet"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- BusinessSettings -------------------------------------------------------
ALTER TABLE "BusinessSettings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "BusinessSettings"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "BusinessSettings"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "BusinessSettings"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "BusinessSettings"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- ImportJob --------------------------------------------------------------
ALTER TABLE "ImportJob" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "ImportJob"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "ImportJob"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "ImportJob"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "ImportJob"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Device -----------------------------------------------------------------
ALTER TABLE "Device" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Device"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Device"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Device"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Device"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- ApiKey -----------------------------------------------------------------
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "ApiKey"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "ApiKey"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "ApiKey"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "ApiKey"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Webhook ----------------------------------------------------------------
ALTER TABLE "Webhook" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Webhook"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Webhook"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Webhook"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Webhook"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- AiReceptionistConfig ---------------------------------------------------
ALTER TABLE "AiReceptionistConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "AiReceptionistConfig"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "AiReceptionistConfig"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "AiReceptionistConfig"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "AiReceptionistConfig"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- AiReceptionistCall -----------------------------------------------------
ALTER TABLE "AiReceptionistCall" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "AiReceptionistCall"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "AiReceptionistCall"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "AiReceptionistCall"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "AiReceptionistCall"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Message ----------------------------------------------------------------
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Message"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Message"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Message"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Message"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- SavedResponse ----------------------------------------------------------
ALTER TABLE "SavedResponse" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "SavedResponse"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "SavedResponse"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "SavedResponse"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "SavedResponse"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- AuditLog (read-only for tenants, write only via trigger) ---------------
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON "AuditLog"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

-- No INSERT/UPDATE/DELETE policies for tenants. AuditLog writes come from
-- the app_audit_trigger function which is SECURITY DEFINER and bypasses RLS.
-- This means no application path can directly write or modify AuditLog rows
-- -- only the trigger can. Defense against audit tampering.


-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To disable RLS and remove all policies created by this migration,
-- run the following SQL. Do NOT uncomment in this file -- copy to a separate
-- emergency script if needed.
--
--   ALTER TABLE "Location" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Location";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Location";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Location";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Location";
--
--   ALTER TABLE "Staff" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Staff";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Staff";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Staff";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Staff";
--
--   ALTER TABLE "Client" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Client";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Client";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Client";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Client";
--
--   ALTER TABLE "Service" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Service";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Service";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Service";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Service";
--
--   ALTER TABLE "Appointment" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Appointment";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Appointment";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Appointment";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Appointment";
--
--   ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Transaction";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Transaction";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Transaction";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Transaction";
--
--   ALTER TABLE "GiftCard" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "GiftCard";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "GiftCard";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "GiftCard";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "GiftCard";
--
--   ALTER TABLE "LoyaltyProgram" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "LoyaltyProgram";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "LoyaltyProgram";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "LoyaltyProgram";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "LoyaltyProgram";
--
--   ALTER TABLE "Membership" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Membership";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Membership";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Membership";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Membership";
--
--   ALTER TABLE "WaitlistEntry" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "WaitlistEntry";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "WaitlistEntry";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "WaitlistEntry";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "WaitlistEntry";
--
--   ALTER TABLE "Campaign" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Campaign";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Campaign";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Campaign";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Campaign";
--
--   ALTER TABLE "ReviewRequest" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "ReviewRequest";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "ReviewRequest";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "ReviewRequest";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "ReviewRequest";
--
--   ALTER TABLE "FormTemplate" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "FormTemplate";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "FormTemplate";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "FormTemplate";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "FormTemplate";
--
--   ALTER TABLE "PermissionSet" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "PermissionSet";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "PermissionSet";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "PermissionSet";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "PermissionSet";
--
--   ALTER TABLE "BusinessSettings" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "BusinessSettings";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "BusinessSettings";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "BusinessSettings";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "BusinessSettings";
--
--   ALTER TABLE "ImportJob" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "ImportJob";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "ImportJob";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "ImportJob";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "ImportJob";
--
--   ALTER TABLE "Device" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Device";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Device";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Device";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Device";
--
--   ALTER TABLE "ApiKey" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "ApiKey";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "ApiKey";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "ApiKey";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "ApiKey";
--
--   ALTER TABLE "Webhook" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Webhook";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Webhook";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Webhook";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Webhook";
--
--   ALTER TABLE "AiReceptionistConfig" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "AiReceptionistConfig";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "AiReceptionistConfig";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "AiReceptionistConfig";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "AiReceptionistConfig";
--
--   ALTER TABLE "AiReceptionistCall" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "AiReceptionistCall";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "AiReceptionistCall";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "AiReceptionistCall";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "AiReceptionistCall";
--
--   ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "Message";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "Message";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "Message";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "Message";
--
--   ALTER TABLE "SavedResponse" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "tenant_isolation_select" ON "SavedResponse";
--   DROP POLICY IF EXISTS "tenant_isolation_insert" ON "SavedResponse";
--   DROP POLICY IF EXISTS "tenant_isolation_update" ON "SavedResponse";
--   DROP POLICY IF EXISTS "tenant_isolation_delete" ON "SavedResponse";
--
--   ALTER TABLE "AuditLog" DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS "audit_log_select" ON "AuditLog";
-- ============================================================================
