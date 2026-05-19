# Onboarding

Last updated: 2026-05-18

## Purpose

Server-side state machine that tracks where each prospective signup is in
the onboarding flow. Persists scratch data across steps, supports save-and-
resume via email link, and provides a forward-only state model so the UI
can branch by current state without ad-hoc step-tracking.

## Architecture

- **OnboardingSession** table -- one row per email signing up. State, vertical,
  per-step scratch data, eventual FK links to User/Organization/Location once
  they exist.
- **OnboardingStateTransition** table -- audit trail of every state move.
- **Resume tokens** -- JWTs signed with ONBOARDING_RESUME_SECRET, payload
  contains sessionId + email. 7-day default TTL.

Both tables enforce strict RLS (SUPERADMIN-only writes) and go through
`prismaAdmin` helpers from server-side routes. Same pattern as FeatureFlag.

## State machine

```
STARTED
  | (email verified)
EMAIL_VERIFIED
  | (password set, User created)
ACCOUNT_CREATED
  | (org name + vertical, Organization created)
ORG_CREATED
  | (address geocoded, Location created)
LOCATION_CREATED
  | (vertical-specific catalog seeded)
SERVICES_SEEDED
  | (>=1 staff invite sent OR skipped)
STAFF_INVITED
  | (employment templates configured OR skipped)
AGREEMENTS_CONFIGURED
  | (>=1 Compensation record OR skipped)
COMPENSATION_CONFIGURED
  | (owner reached "you're set up" page)
COMPLETED
```

Forward-only. No backwards transitions. "Back" in the UI re-renders the
form for the current state -- it doesn't rewind state. Skippable steps
(STAFF_INVITED, AGREEMENTS_CONFIGURED, COMPENSATION_CONFIGURED) record the
skip in skippedSteps array but still advance state.

## Vertical scope

V1 launches salon-only. The vertical column on OnboardingSession exists
for future expansion (BARBERSHOP, NAIL_SALON, MED_SPA). V1 onboarding
hard-codes SALON; other verticals unlock when their configs ship.

## Resume tokens

Signed JWTs containing the sessionId + email. Used to construct resume URLs
for email links:

```
https://signup.kasseapp.com/onboarding/resume?token=<jwt>
```

The resume handler (P1.A.2) verifies the token via `verifyResumeToken`, loads
the session, and routes to the correct step based on state.

Tokens have a 7-day TTL. If the token expires, the user can re-enter the
flow with the same email and pick up where they left off (the session
itself has a 30-day TTL).

## Required env var

`ONBOARDING_RESUME_SECRET` -- 32+ random bytes. Use a different value than
NEXTAUTH_SECRET. Generate with:

```bash
openssl rand -hex 32
```

Set in Vercel for Production + Preview. Local dev can use any 32+ char string.

## Helper functions

- `getOrCreateSession({ email, ipAddress?, userAgent?, referrer? })` --
  idempotent entry point
- `getSessionById(sessionId)` -- direct lookup
- `getSessionByEmail(email)` -- find active session by email
- `transitionTo({ sessionId, toState, triggeredByUserId?, dataPatch?, metadata? })`
  -- forward transition with validation and audit
- `skipStep({ sessionId, step, triggeredByUserId? })` -- advance from a
  skippable step
- `patchData({ sessionId, patch })` -- save scratch form data without
  changing state
- `linkResource({ sessionId, userId?, organizationId?, locationId?, vertical? })`
  -- attach FKs as rows get created in later steps
- `signResumeToken(...)` / `verifyResumeToken(...)` -- token lifecycle

## Magic-link flow (P1.A.2)

The owner-facing entry path:

1. **POST /api/onboarding/email** -- owner submits email. We get-or-create
   their session, check rate limits, issue a 24-hour single-use verification
   token, send it via Resend from onboarding@kasseapp.com. Rate limit: 3
   sends per hour per session.

2. **Owner clicks link** -- link goes to a future verify page (P1.A.8 UI),
   which calls POST /api/onboarding/verify with the raw token.

3. **POST /api/onboarding/verify** -- atomic single-use consumption:
   UPDATE ... SET consumedAt = now() WHERE tokenHash = ? AND consumedAt IS NULL.
   Transitions STARTED -> EMAIL_VERIFIED. Returns a resume token (JWT, 7-day TTL).

4. **POST /api/onboarding/password** -- owner submits password + resume token.
   We verify the resume token, validate password (min 12 chars, letters +
   numbers/specials), bcrypt-hash at 12 rounds, create User row, transition
   EMAIL_VERIFIED -> ACCOUNT_CREATED.

5. After account creation, the future UI calls NextAuth signIn() to issue
   the session. The session links the now-existing User to subsequent
   onboarding steps (P1.A.3+).

## Verification tokens

- Single-use, 24-hour TTL
- Raw token = 64 hex chars (32 bytes from crypto.randomBytes)
- Storage: sha256 hash only -- we never store the raw token
- Atomic consumption via updateMany with conditional where clause
- Purposes: EMAIL_VERIFICATION (extensible to PASSWORD_RESET later)
- Table: OnboardingVerificationToken (separate from NextAuth's VerificationToken)

## Rate limiting

Magic-link sends: 3 per session per hour. Tracked on OnboardingSession columns
`magicLinkEmailsSentCount` + `magicLinkLastSentAt`. Resets after window rolls.

## Password requirements (v1)

- Minimum 12 characters
- Must contain a letter
- Must contain a number OR special character
- Maximum 200 chars (defense against bcrypt DoS)
- Bcrypt rounds: 12

## NextAuth integration

After ACCOUNT_CREATED, the User row exists with email + bcrypt hash. The
existing NextAuth Credentials provider authenticates against this row. The
onboarding password endpoint does NOT issue a session itself -- the UI calls
NextAuth signIn() separately. This keeps the password creation endpoint
cleanly testable and separable from session machinery.

## What this PR doesn't include

- UI pages -- P1.A.8
- signup.kasseapp.com DNS -- operational task
- Session cleanup cron (delete expired) -- later deployment PR

## Related strategic decisions

- **SD-K-003** -- Payroc KYC moves to payments settings, NOT initial onboarding
- **SD-K-019** -- ENTERPRISE plan = concierge path (sales call, not self-serve)
- **Launch scope** -- salon-only at launch; beauty-adjacent verticals ship
  2-3 months later
