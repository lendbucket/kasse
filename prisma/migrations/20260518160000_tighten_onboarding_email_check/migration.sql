-- Tighten OnboardingSession.email CHECK constraint to match the TypeScript
-- EMAIL_PATTERN regex (no whitespace allowed in local or domain parts).
-- Original: '^[^@]+@[^@]+\.[^@]+$' (allowed spaces)
-- Updated:  '^[^@\s]+@[^@\s]+\.[^@\s]+$' (rejects spaces)

ALTER TABLE "OnboardingSession"
  DROP CONSTRAINT IF EXISTS "OnboardingSession_email_check";

ALTER TABLE "OnboardingSession"
  ADD CONSTRAINT "OnboardingSession_email_check"
  CHECK (length(email) > 0 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');
