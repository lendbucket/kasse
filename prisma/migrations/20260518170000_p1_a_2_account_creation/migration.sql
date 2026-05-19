-- P1.A.2: Account creation + email verification
-- OnboardingVerificationToken table + OnboardingSession columns + RLS

-- =============================================================
-- 1. OnboardingVerificationToken table
-- =============================================================
CREATE TABLE "OnboardingVerificationToken" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sessionId"           TEXT NOT NULL,
  "tokenHash"           TEXT NOT NULL,
  "purpose"             TEXT NOT NULL,
  "consumedAt"          TIMESTAMPTZ(6),
  "expiresAt"           TIMESTAMPTZ(6) NOT NULL,
  "createdAt"           TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "ipAddressIssued"     TEXT,
  "ipAddressConsumed"   TEXT,
  "userAgentIssued"     TEXT,
  "userAgentConsumed"   TEXT,

  CONSTRAINT "OnboardingVerificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OnboardingVerificationToken_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "OnboardingVerificationToken_purpose_check"
    CHECK ("purpose" IN ('EMAIL_VERIFICATION'))
);

-- Unique on tokenHash (atomic consumption guard)
CREATE UNIQUE INDEX "OnboardingVerificationToken_tokenHash_key" ON "OnboardingVerificationToken"("tokenHash");

-- Lookup by session + purpose
CREATE INDEX "idx_onboarding_vtoken_session_purpose"
  ON "OnboardingVerificationToken"("sessionId", "purpose");

-- =============================================================
-- 2. OnboardingSession — add columns
-- =============================================================
ALTER TABLE "OnboardingSession"
  ADD COLUMN "magicLinkEmailsSentCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "magicLinkLastSentAt"      TIMESTAMPTZ(6),
  ADD COLUMN "passwordHash"             TEXT;

-- =============================================================
-- 3. RLS on OnboardingVerificationToken
-- =============================================================
ALTER TABLE "OnboardingVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OnboardingVerificationToken" FORCE ROW LEVEL SECURITY;

-- SELECT: superadmin only
CREATE POLICY "onboarding_vtoken_select_superadmin"
  ON "OnboardingVerificationToken" FOR SELECT
  USING (current_setting('app.is_superadmin', true) = 'true');

-- INSERT: superadmin only
CREATE POLICY "onboarding_vtoken_insert_superadmin"
  ON "OnboardingVerificationToken" FOR INSERT
  WITH CHECK (current_setting('app.is_superadmin', true) = 'true');

-- UPDATE: superadmin only
CREATE POLICY "onboarding_vtoken_update_superadmin"
  ON "OnboardingVerificationToken" FOR UPDATE
  USING (current_setting('app.is_superadmin', true) = 'true')
  WITH CHECK (current_setting('app.is_superadmin', true) = 'true');

-- DELETE: superadmin only
CREATE POLICY "onboarding_vtoken_delete_superadmin"
  ON "OnboardingVerificationToken" FOR DELETE
  USING (current_setting('app.is_superadmin', true) = 'true');

-- =============================================================
-- 4. Grant kasse_app CRUD on OnboardingVerificationToken
-- =============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON "OnboardingVerificationToken" TO kasse_app;
