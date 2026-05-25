import type { OnboardingState } from "@/lib/onboarding/types";

/**
 * Maps a backend OnboardingSession state to the user-facing wizard
 * step number (1–8). Multiple backend states can map to the same UI
 * step — e.g., STAFF_PENDING through COMPENSATION_CONFIGURED all fall
 * within wizard "Step 3: Team" because team setup encompasses staff
 * invite + employment agreement + compensation as a single user-facing
 * step.
 *
 * COMPLETED is not in the input domain — callers should redirect to
 * /dashboard before calling this.
 *
 * Pre-account states (STARTED, EMAIL_VERIFIED) shouldn't be hit by
 * authenticated wizard traffic because the wizard layout already gates
 * on session.user.id. They map to step 1 defensively.
 */
export function stateToWizardStep(state: OnboardingState): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  switch (state) {
    case "STARTED":
    case "EMAIL_VERIFIED":
    case "ACCOUNT_CREATED":
    case "ORG_CREATED":
    case "LOCATION_PENDING":
    case "LOCATION_CREATED":
      return 1; // Step 1: Business Profile

    case "SERVICES_PENDING":
    case "SERVICES_SEEDED":
      return 2; // Step 2: Services

    case "STAFF_PENDING":
    case "STAFF_INVITED":
    case "AGREEMENTS_PENDING":
    case "AGREEMENTS_CONFIGURED":
    case "COMPENSATION_PENDING":
    case "COMPENSATION_CONFIGURED":
      return 3; // Step 3: Team (multi-sub-state)

    // No backend state yet for steps 4–8. Once a step's backend ships
    // (P1.C.4 = payment processing, etc.), add the new state to the
    // ALLOWED_TRANSITIONS chain in types.ts and update this mapping.
    // Until then, this branch is unreachable for current production
    // sessions.
    case "COMPLETED":
      // Defensive: callers should redirect to /dashboard before calling
      // this. Treat as step 8 (Go Live) if someone does reach it.
      return 8;

    default: {
      // Exhaustiveness check — if a new state is added to OnboardingState
      // without a case here, TS will fail compilation.
      const _exhaustive: never = state;
      throw new Error(`Unmapped state: ${_exhaustive}`);
    }
  }
}

/**
 * Number of total steps in the wizard. Centralized constant so
 * ProgressBar and StepCounter stay in sync.
 */
export const TOTAL_WIZARD_STEPS = 8;

/**
 * Step labels for the progress bar (hover/tap reveal on desktop).
 */
export const WIZARD_STEP_LABELS = [
  "Business Profile",  // Step 1
  "Services",           // Step 2
  "Team",               // Step 3
  "Payment Processing", // Step 4
  "Booking Page",       // Step 5
  "Branding",           // Step 6
  "Import",             // Step 7
  "Go Live",            // Step 8
] as const;
