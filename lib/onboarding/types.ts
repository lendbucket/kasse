export const ONBOARDING_STATES = [
  'STARTED',
  'EMAIL_VERIFIED',
  'ACCOUNT_CREATED',
  'ORG_CREATED',
  'LOCATION_CREATED',
  'SERVICES_SEEDED',
  'STAFF_INVITED',
  'AGREEMENTS_CONFIGURED',
  'COMPENSATION_CONFIGURED',
  'COMPLETED',
] as const;

export type OnboardingState = typeof ONBOARDING_STATES[number];

/**
 * Forward-only state machine. Maps each state to its single allowed next state.
 */
export const ALLOWED_TRANSITIONS: Record<OnboardingState, OnboardingState | null> = {
  STARTED: 'EMAIL_VERIFIED',
  EMAIL_VERIFIED: 'ACCOUNT_CREATED',
  ACCOUNT_CREATED: 'ORG_CREATED',
  ORG_CREATED: 'LOCATION_CREATED',
  LOCATION_CREATED: 'SERVICES_SEEDED',
  SERVICES_SEEDED: 'STAFF_INVITED',
  STAFF_INVITED: 'AGREEMENTS_CONFIGURED',
  AGREEMENTS_CONFIGURED: 'COMPENSATION_CONFIGURED',
  COMPENSATION_CONFIGURED: 'COMPLETED',
  COMPLETED: null,
};

/**
 * Steps the owner can explicitly skip without abandoning the flow.
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
}

export interface ResumeTokenPayload {
  sub: string;
  email: string;
  state: OnboardingState;
  iat: number;
  exp: number;
  type: 'onboarding-resume';
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
      | 'INVALID_EMAIL',
    message: string
  ) {
    super(message);
    this.name = 'OnboardingError';
  }
}
