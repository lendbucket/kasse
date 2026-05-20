export const ONBOARDING_STATES = [
  'STARTED',
  'EMAIL_VERIFIED',
  'ACCOUNT_CREATED',
  'ORG_CREATED',
  'LOCATION_PENDING',
  'LOCATION_CREATED',
  'SERVICES_PENDING',
  'SERVICES_SEEDED',
  'STAFF_PENDING',
  'STAFF_INVITED',
  'AGREEMENTS_PENDING',
  'AGREEMENTS_CONFIGURED',
  'COMPENSATION_PENDING',
  'COMPENSATION_CONFIGURED',
  'COMPLETED',
] as const;

export type OnboardingState = typeof ONBOARDING_STATES[number];

/**
 * Forward-only state machine. Maps each state to its single allowed next state.
 *
 * LOCATION_PENDING, SERVICES_PENDING, and STAFF_PENDING are transient
 * sentinels used for concurrency serialization. Each is set by a claim
 * updateMany that transitions state as a claim token (e.g.,
 * SERVICES_SEEDED → STAFF_PENDING). Concurrent POSTs both attempt the
 * UPDATE; Postgres row-level lock serializes them; only the first succeeds
 * because the second sees the changed state and its WHERE fails (count=0).
 * The route handler then advances to the final state (e.g., STAFF_INVITED)
 * via transitionTo after the tenant tx commits. Sessions should not be
 * observed in a PENDING state for more than ~100ms in practice — if you
 * see one stuck there, the previous request crashed between the claim and
 * transitionTo (recovery is a manual state reset or janitor job, tracked
 * in issue #95).
 */
export const ALLOWED_TRANSITIONS: Record<OnboardingState, OnboardingState | null> = {
  STARTED: 'EMAIL_VERIFIED',
  EMAIL_VERIFIED: 'ACCOUNT_CREATED',
  ACCOUNT_CREATED: 'ORG_CREATED',
  ORG_CREATED: 'LOCATION_PENDING',
  LOCATION_PENDING: 'LOCATION_CREATED',
  LOCATION_CREATED: 'SERVICES_PENDING',
  SERVICES_PENDING: 'SERVICES_SEEDED',
  SERVICES_SEEDED: 'STAFF_PENDING',
  STAFF_PENDING: 'STAFF_INVITED',
  STAFF_INVITED: 'AGREEMENTS_PENDING',
  AGREEMENTS_PENDING: 'AGREEMENTS_CONFIGURED',
  AGREEMENTS_CONFIGURED: 'COMPENSATION_PENDING',
  COMPENSATION_PENDING: 'COMPENSATION_CONFIGURED',
  COMPENSATION_CONFIGURED: 'COMPLETED',
  COMPLETED: null,
};

/**
 * Steps the owner can explicitly skip without abandoning the flow.
 *
 * NOTE: This set governs the `skipStep` helper, NOT the `skip: true`
 * flag on onboarding routes. The skip flag is route-specific and
 * advances state through the same sentinel mechanism as the non-skip
 * path (e.g., agreements route: STAFF_INVITED → AGREEMENTS_PENDING →
 * AGREEMENTS_CONFIGURED, with no actual agreements created). The two
 * mechanisms are distinct:
 *   - SKIPPABLE_STATES: used by /api/onboarding/skip-step, advances
 *     state from X to ALLOWED_TRANSITIONS[X] without doing any work.
 *   - skip: true flag: used by step-specific routes, advances through
 *     the same state path as non-skip but creates zero resources.
 */
export const SKIPPABLE_STATES: ReadonlySet<OnboardingState> = new Set([
  'STAFF_INVITED',
  'AGREEMENTS_CONFIGURED',
  'COMPENSATION_CONFIGURED',
]);

export type OnboardingVertical = 'SALON' | 'BARBERSHOP' | 'NAIL_SALON' | 'MED_SPA';

export const V1_LAUNCH_VERTICALS: readonly OnboardingVertical[] = ['SALON'] as const;

export interface OnboardingSessionRecord {
  id: string;
  email: string;
  state: OnboardingState;
  vertical: OnboardingVertical | null;
  userId: string | null;
  organizationId: string | null;
  locationId: string | null;
  data: Record<string, unknown>;
  skippedSteps: string[];
  emailVerifiedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  magicLinkEmailsSentCount: number;
  magicLinkLastSentAt: Date | null;
  passwordHash: string | null;
}

export interface ResumeTokenPayload {
  sub: string;
  email: string;
  state: OnboardingState;
  iat: number;
  exp: number;
  type: 'onboarding-resume';
}

export interface MagicLinkSentResult {
  sessionId: string;
  expiresAt: Date;
  /**
   * In development, the raw verification URL is returned so testing without
   * a real inbox is possible. In production this field is always undefined.
   */
  devVerificationUrl?: string;
}

export type VerificationTokenPurpose = 'EMAIL_VERIFICATION';

export interface VerificationTokenRecord {
  id: string;
  sessionId: string;
  purpose: VerificationTokenPurpose;
  consumedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

export type OnboardingPlanTier = 'FREE' | 'PREMIUM';

export const V1_LAUNCH_PLAN_TIERS: readonly OnboardingPlanTier[] =
  ['FREE', 'PREMIUM'] as const;

export interface OnboardingOrgCreateInput {
  sessionId: string;
  orgName: string;
  vertical: 'SALON';
  planTier: string;  // Validated at runtime via V1_LAUNCH_PLAN_TIERS
}

export interface OnboardingLocationCreateInput {
  sessionId: string;
  organizationId: string;
  locationName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  timezone?: string;
}

export class OnboardingError extends Error {
  constructor(
    public code:
      | 'INVALID_TRANSITION'
      | 'STEP_NOT_SKIPPABLE'
      | 'SESSION_NOT_FOUND'
      | 'SESSION_EXPIRED'
      | 'SESSION_COMPLETED'
      | 'INVALID_TOKEN'
      | 'EMAIL_MISMATCH'
      | 'DUPLICATE_ACTIVE_SESSION'
      | 'INVALID_EMAIL'
      | 'TOO_MANY_MAGIC_LINK_SENDS'
      | 'TOKEN_ALREADY_CONSUMED'
      | 'WRONG_TOKEN_PURPOSE'
      | 'PASSWORD_TOO_WEAK'
      | 'EMAIL_ALREADY_REGISTERED'
      | 'INVALID_PLAN_TIER'
      | 'INVALID_VERTICAL'
      | 'NOT_AUTHENTICATED'
      | 'ORG_SCOPE_MISMATCH'
      | 'INVALID_ADDRESS'
      | 'INVALID_ORG_NAME'
      | 'INVALID_LOCATION_NAME'
      | 'INVALID_TIMEZONE'
      | 'ORG_NOT_YET_CREATED'
      | 'SLUG_COLLISION'
      | 'LOCATION_NOT_YET_CREATED'
      | 'INVITE_EMAIL_REQUIRED'
      | 'INVITE_ALREADY_EXISTS'
      | 'INVITE_NOT_FOUND'
      | 'INVITE_ALREADY_ACCEPTED'
      | 'INVITE_EXPIRED'
      | 'INVITE_NAME_REQUIRED'
      | 'INVITE_EMAIL_ALREADY_USER'
      | 'INVALID_AGREEMENT_TEMPLATE_TYPE'
      | 'INVITE_NO_STAFF_TO_AGREE'
      | 'COMPENSATION_FIELDS_INCOMPLETE'
      | 'COMPENSATION_STAFF_MISMATCH'
      | 'NOT_ALL_STAFF_HAVE_COMPENSATION',
    message: string
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}
