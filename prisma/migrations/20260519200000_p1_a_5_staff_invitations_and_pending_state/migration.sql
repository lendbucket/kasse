-- P1.A.5: StaffInvitation table + RLS policies + STAFF_PENDING state.
-- Staff invitation lifecycle for onboarding staff-invite flow.

-- 1. Create StaffInvitation table
-- Note: id has no DEFAULT — Prisma generates cuid() client-side (matches codebase convention)
CREATE TABLE "StaffInvitation" (
  "id"                TEXT NOT NULL,
  "organizationId"    TEXT NOT NULL,
  "locationId"        TEXT NOT NULL,
  "staffId"           TEXT NOT NULL,
  "inviterUserId"     TEXT NOT NULL,
  "email"             TEXT NOT NULL,
  "name"              TEXT NOT NULL,
  "role"              "Role" NOT NULL DEFAULT 'STAFF',
  "tokenHash"         TEXT NOT NULL,
  "expiresAt"         TIMESTAMPTZ(6) NOT NULL,
  "acceptedAt"        TIMESTAMPTZ(6),
  "acceptedUserId"    TEXT,
  "revokedAt"         TIMESTAMPTZ(6),
  "revokedReason"     TEXT,
  "emailsSentCount"   INTEGER NOT NULL DEFAULT 1,
  "lastEmailSentAt"   TIMESTAMPTZ(6),
  "ipAddressIssued"   TEXT,
  "ipAddressAccepted" TEXT,
  "userAgentIssued"   TEXT,
  "userAgentAccepted" TEXT,
  "createdAt"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- 2. Unique constraint on tokenHash (creates index automatically)
ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_tokenHash_key" UNIQUE ("tokenHash");

-- 3. Foreign key constraints
ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- Note: locationId FK uses default ON DELETE RESTRICT (not CASCADE).
-- Locations are typically soft-deleted (isActive=false), not hard-deleted.
-- If a hard-delete is ever attempted on a Location with pending
-- StaffInvitations, it will fail loudly — which is the safe behavior.
-- Pending invitations should be revoked/accepted before location removal.
ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id")
    ON UPDATE NO ACTION;

ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_inviterUserId_fkey"
    FOREIGN KEY ("inviterUserId") REFERENCES "User"("id")
    ON UPDATE NO ACTION;

ALTER TABLE "StaffInvitation"
  ADD CONSTRAINT "StaffInvitation_acceptedUserId_fkey"
    FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id")
    ON UPDATE NO ACTION;

-- 4. Indexes (partial for pending invitations)
CREATE INDEX "idx_staffinv_org_loc_pending"
  ON "StaffInvitation" ("organizationId", "locationId", "acceptedAt")
  WHERE ("acceptedAt" IS NULL AND "revokedAt" IS NULL);

CREATE INDEX "idx_staffinv_email"
  ON "StaffInvitation" ("email");

CREATE INDEX "idx_staffinv_expires"
  ON "StaffInvitation" ("expiresAt")
  WHERE ("acceptedAt" IS NULL AND "revokedAt" IS NULL);

-- 5. Enable RLS + FORCE
ALTER TABLE "StaffInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffInvitation" FORCE ROW LEVEL SECURITY;

-- 6. Tenant isolation policies (per-command, with superadmin bypass folded in)
-- Pattern matches Location/Service/Staff: single combined policy per command
-- with superadmin OR tenant match.
CREATE POLICY "tenant_isolation_select" ON "StaffInvitation"
  FOR SELECT USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_insert" ON "StaffInvitation"
  FOR INSERT WITH CHECK (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_update" ON "StaffInvitation"
  FOR UPDATE USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

CREATE POLICY "tenant_isolation_delete" ON "StaffInvitation"
  FOR DELETE USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

-- 7. Grant privileges to kasse_app role
GRANT SELECT, INSERT, UPDATE, DELETE ON "StaffInvitation" TO kasse_app;

-- 8. Update OnboardingSession state CHECK to include STAFF_PENDING
ALTER TABLE "OnboardingSession"
  DROP CONSTRAINT "OnboardingSession_state_check";

ALTER TABLE "OnboardingSession"
  ADD CONSTRAINT "OnboardingSession_state_check"
    CHECK ("state" IN (
      'STARTED', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ORG_CREATED',
      'LOCATION_PENDING', 'LOCATION_CREATED',
      'SERVICES_PENDING', 'SERVICES_SEEDED',
      'STAFF_PENDING', 'STAFF_INVITED',
      'AGREEMENTS_CONFIGURED', 'COMPENSATION_CONFIGURED',
      'COMPLETED'
    ));
