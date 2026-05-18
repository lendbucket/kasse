-- ============================================================================
-- P1.A.1 — Onboarding State Machine
-- ============================================================================
-- OnboardingSession: per-email signup tracking with forward-only state machine.
-- OnboardingStateTransition: audit trail of every state move.
--
-- DEPLOYMENT NOTES:
--
-- 1. GRANT statements require the postgres role (migration role).
-- 2. RLS policies use SUPERADMIN-only writes — all mutations go through
--    prismaAdmin helpers. Reads restricted to session owner (userId) or
--    SUPERADMIN. Same pattern as FeatureFlag/FeatureFlagAudit (P0.H.2).
-- 3. The partial unique index on (email) WHERE state NOT IN ('COMPLETED')
--    ensures only one active session per email.
-- ============================================================================

-- --- OnboardingSession -------------------------------------------------------

CREATE TABLE "OnboardingSession" (
  "id"                  TEXT        NOT NULL,
  "email"               TEXT        NOT NULL,
  "state"               TEXT        NOT NULL DEFAULT 'STARTED',
  "vertical"            TEXT,
  "userId"              TEXT,
  "organizationId"      TEXT,
  "locationId"          TEXT,
  "data"                JSONB       NOT NULL DEFAULT '{}',
  "skippedSteps"        TEXT[]      NOT NULL DEFAULT '{}',
  "emailVerifiedAt"     TIMESTAMPTZ,
  "completedAt"         TIMESTAMPTZ,
  "expiresAt"           TIMESTAMPTZ NOT NULL,
  "ipAddressFirstSeen"  TEXT,
  "userAgentFirstSeen"  TEXT,
  "referrerFirstSeen"   TEXT,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "OnboardingSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "OnboardingSession_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL,

  CONSTRAINT "OnboardingSession_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL,

  CONSTRAINT "OnboardingSession_state_check"
    CHECK ("state" IN (
      'STARTED', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ORG_CREATED',
      'LOCATION_CREATED', 'SERVICES_SEEDED', 'STAFF_INVITED',
      'AGREEMENTS_CONFIGURED', 'COMPENSATION_CONFIGURED', 'COMPLETED'
    )),

  CONSTRAINT "OnboardingSession_email_check"
    CHECK (length("email") > 0 AND "email" ~ '^[^@]+@[^@]+\.[^@]+$')
);

CREATE UNIQUE INDEX "idx_onboarding_session_email_active"
  ON "OnboardingSession"("email")
  WHERE "state" NOT IN ('COMPLETED');

CREATE INDEX "idx_onboarding_session_email"
  ON "OnboardingSession"("email");

CREATE INDEX "idx_onboarding_session_state"
  ON "OnboardingSession"("state")
  WHERE "state" != 'COMPLETED';

CREATE INDEX "idx_onboarding_session_expires"
  ON "OnboardingSession"("expiresAt")
  WHERE "state" != 'COMPLETED';


-- --- OnboardingStateTransition -----------------------------------------------

CREATE TABLE "OnboardingStateTransition" (
  "id"                  TEXT        NOT NULL,
  "sessionId"           TEXT        NOT NULL,
  "fromState"           TEXT        NOT NULL,
  "toState"             TEXT        NOT NULL,
  "triggeredByUserId"   TEXT,
  "metadata"            JSONB       NOT NULL DEFAULT '{}',
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "OnboardingStateTransition_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "OnboardingStateTransition_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE CASCADE,

  CONSTRAINT "OnboardingStateTransition_triggeredByUserId_fkey"
    FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_onboarding_transition_session"
  ON "OnboardingStateTransition"("sessionId", "createdAt");


-- --- RLS: OnboardingSession --------------------------------------------------

ALTER TABLE "OnboardingSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OnboardingSession" FORCE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_session_read" ON "OnboardingSession"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR (
      "userId" IS NOT NULL
      AND "userId" = current_setting('app.actor_user_id', true)
    )
  );

CREATE POLICY "onboarding_session_write" ON "OnboardingSession"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
  );

CREATE POLICY "onboarding_session_update" ON "OnboardingSession"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
  );

CREATE POLICY "onboarding_session_delete" ON "OnboardingSession"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
  );


-- --- RLS: OnboardingStateTransition ------------------------------------------

ALTER TABLE "OnboardingStateTransition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OnboardingStateTransition" FORCE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_transition_read" ON "OnboardingStateTransition"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
  );

CREATE POLICY "onboarding_transition_write" ON "OnboardingStateTransition"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
  );

CREATE POLICY "onboarding_transition_update" ON "OnboardingStateTransition"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
  );

CREATE POLICY "onboarding_transition_delete" ON "OnboardingStateTransition"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
  );


-- --- Grants to kasse_app -----------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON "OnboardingSession" TO kasse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "OnboardingStateTransition" TO kasse_app;
