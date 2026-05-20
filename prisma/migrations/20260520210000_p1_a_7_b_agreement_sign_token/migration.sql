-- P1.A.7-b: AgreementSignToken — per-recipient hashed signing token.
--
-- Mirrors the StaffInvitation pattern (P1.A.5): hash stored at rest,
-- raw token returned once via email. Atomic single-use consumption
-- via updateMany at acceptance time (acceptance flow lands in P1.A.7-c).
--
-- IMPORTANT: this migration creates a table with RLS policies. The
-- CREATE TABLE + ALTER TABLE + CREATE POLICY + GRANT statements require
-- the postgres role. MIGRATION_DATABASE_URL must point to a postgres
-- connection. See docs/RLS_AUDIT.md "Production State Log".

CREATE TABLE "AgreementSignToken" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL,
  "agreementId" TEXT NOT NULL UNIQUE,
  "staffId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  "ipAddressIssued" TEXT,
  "userAgentIssued" TEXT,
  "ipAddressConsumed" TEXT,
  "userAgentConsumed" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AgreementSignToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgreementSignToken_agreementId_fkey"
    FOREIGN KEY ("agreementId") REFERENCES "EmploymentAgreement"("id") ON DELETE CASCADE,
  CONSTRAINT "AgreementSignToken_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE,
  CONSTRAINT "AgreementSignToken_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_agreement_sign_token_org" ON "AgreementSignToken" ("organizationId");
CREATE INDEX "idx_agreement_sign_token_expires" ON "AgreementSignToken" ("expiresAt") WHERE "consumedAt" IS NULL;

-- RLS: per-command policies with superadmin bypass
ALTER TABLE "AgreementSignToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgreementSignToken" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "AgreementSignToken"
  FOR SELECT USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_insert" ON "AgreementSignToken"
  FOR INSERT WITH CHECK (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_update" ON "AgreementSignToken"
  FOR UPDATE USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_delete" ON "AgreementSignToken"
  FOR DELETE USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON "AgreementSignToken" TO kasse_app;
