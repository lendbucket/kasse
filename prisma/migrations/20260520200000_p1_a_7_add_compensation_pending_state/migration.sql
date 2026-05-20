-- P1.A.7-a: Add COMPENSATION_PENDING to OnboardingSession state CHECK constraint
-- and OnboardingStateTransition fromState/toState CHECK constraints.
-- Transient sentinel state for concurrent-call serialization during
-- compensation configuration.
--
-- IMPORTANT: this migration's ALTER TABLE statements require the postgres
-- role (table owner). MIGRATION_DATABASE_URL must point to a postgres
-- connection. See docs/RLS_AUDIT.md "Production State Log" for the
-- DATABASE_URL/MIGRATION_DATABASE_URL split.

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
      'COMPENSATION_PENDING', 'COMPENSATION_CONFIGURED',
      'COMPLETED'
    ));

ALTER TABLE "OnboardingStateTransition"
  DROP CONSTRAINT IF EXISTS "OnboardingStateTransition_fromState_check";
ALTER TABLE "OnboardingStateTransition"
  DROP CONSTRAINT IF EXISTS "OnboardingStateTransition_toState_check";

-- Allow 'NEW' as fromState for the initial seed row (already used in
-- getOrCreateSession). Otherwise same list as OnboardingSession.state
-- plus the special 'NEW' sentinel.
ALTER TABLE "OnboardingStateTransition"
  ADD CONSTRAINT "OnboardingStateTransition_fromState_check"
    CHECK ("fromState" IN (
      'NEW',
      'STARTED', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ORG_CREATED',
      'LOCATION_PENDING', 'LOCATION_CREATED',
      'SERVICES_PENDING', 'SERVICES_SEEDED',
      'STAFF_PENDING', 'STAFF_INVITED',
      'AGREEMENTS_PENDING', 'AGREEMENTS_CONFIGURED',
      'COMPENSATION_PENDING', 'COMPENSATION_CONFIGURED',
      'COMPLETED'
    ));

ALTER TABLE "OnboardingStateTransition"
  ADD CONSTRAINT "OnboardingStateTransition_toState_check"
    CHECK ("toState" IN (
      'STARTED', 'EMAIL_VERIFIED', 'ACCOUNT_CREATED', 'ORG_CREATED',
      'LOCATION_PENDING', 'LOCATION_CREATED',
      'SERVICES_PENDING', 'SERVICES_SEEDED',
      'STAFF_PENDING', 'STAFF_INVITED',
      'AGREEMENTS_PENDING', 'AGREEMENTS_CONFIGURED',
      'COMPENSATION_PENDING', 'COMPENSATION_CONFIGURED',
      'COMPLETED'
    ));
