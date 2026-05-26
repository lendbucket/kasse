-- Track when the abandoned-wizard email was sent for this session.
-- The hourly cron at /api/cron/onboarding-abandoned uses this column
-- to avoid sending duplicate emails. NULL means the session has not
-- received an abandoned-wizard email yet.
ALTER TABLE "OnboardingSession"
  ADD COLUMN "abandonedEmailSentAt" TIMESTAMPTZ(6);

-- Index for the cron query: find sessions that are NOT completed,
-- created >24h ago, and haven't been emailed yet.
-- Partial index keeps the index small (only un-emailed, active sessions
-- qualify).
CREATE INDEX "idx_onboarding_session_abandoned_candidates"
  ON "OnboardingSession" ("createdAt")
  WHERE "state" <> 'COMPLETED'
    AND "abandonedEmailSentAt" IS NULL;
