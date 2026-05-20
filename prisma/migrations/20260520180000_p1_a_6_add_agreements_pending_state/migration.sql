-- P1.A.6: Add AGREEMENTS_PENDING to OnboardingSession state CHECK constraint.
-- Transient sentinel state for concurrent-call serialization during
-- employment agreement scaffolding.
--
-- Applied to production via Supabase MCP on 2026-05-20.

ALTER TABLE "OnboardingSession"
  DROP CONSTRAINT "OnboardingSession_state_check";

ALTER TABLE "OnboardingSession"
  ADD CONSTRAINT "OnboardingSession_state_check"
    CHECK ("state" IN (
      'STARTED', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ORG_CREATED',
      'LOCATION_PENDING', 'LOCATION_CREATED',
      'SERVICES_PENDING', 'SERVICES_SEEDED',
      'STAFF_PENDING', 'STAFF_INVITED',
      'AGREEMENTS_PENDING', 'AGREEMENTS_CONFIGURED',
      'COMPENSATION_CONFIGURED',
      'COMPLETED'
    ));
