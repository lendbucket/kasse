-- P1.A.3b: Add LOCATION_PENDING to OnboardingSession state CHECK constraint.
-- Transient sentinel state for concurrent-call serialization during location creation.

ALTER TABLE "OnboardingSession"
  DROP CONSTRAINT "OnboardingSession_state_check";

ALTER TABLE "OnboardingSession"
  ADD CONSTRAINT "OnboardingSession_state_check"
    CHECK ("state" IN (
      'STARTED', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ORG_CREATED',
      'LOCATION_PENDING', 'LOCATION_CREATED', 'SERVICES_SEEDED',
      'STAFF_INVITED', 'AGREEMENTS_CONFIGURED', 'COMPENSATION_CONFIGURED',
      'COMPLETED'
    ));
