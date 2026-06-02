import type { OnboardingState } from "@/lib/onboarding/types";

/**
 * Maps a backend OnboardingSession state to the user-facing wizard
 * step number (1–8). The number returned is the step the user is
 * READY TO ENTER OR CURRENTLY ON — not the step that just completed.
 *
 * - In-progress states (e.g., ACCOUNT_CREATED, ORG_CREATED, LOCATION_PENDING)
 *   map to the step they're in progress on (step 1 in this case).
 * - Terminal-of-step states (e.g., LOCATION_CREATED) map to the NEXT
 *   step the user can enter (step 2 in this case). This is what makes
 *   the page guard (`if (actualStep < STEP_NUMBER) redirect to actualStep`)
 *   allow forward navigation without bouncing users backwards.
 *
 * Multi-sub-state steps (e.g., step 3 spans STAFF_PENDING through
 * COMPENSATION_PENDING) keep all in-progress sub-states mapped to the
 * step itself; only the terminal sub-state (COMPENSATION_CONFIGURED)
 * advances the mapping to the next step.
 *
 * COMPLETED should be filtered out by callers before invoking this —
 * the wizard pages all query for state != COMPLETED and redirect to
 * /dashboard if no active session is found. The switch handles
 * COMPLETED defensively (returns 8) as a safety net in case the guard
 * is ever bypassed.
 *
 * Pre-account states (STARTED, EMAIL_VERIFIED) shouldn't be hit by
 * authenticated wizard traffic because the wizard layout already gates
 * on session.user.id. They map to step 1 defensively.
 */
export function stateToWizardStep(state: OnboardingState): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  switch (state) {
    // Step 1 in-progress states
    case "STARTED":
    case "EMAIL_VERIFIED":
    case "ACCOUNT_CREATED":
    case "ORG_CREATED":
    case "LOCATION_PENDING":
      return 1; // Step 1: Business Profile (in progress)

    // Step 1 complete → ready for Step 2
    case "LOCATION_CREATED":
      return 2;

    // Step 2 in-progress
    case "SERVICES_PENDING":
      return 2; // Step 2: Services (in progress)

    // Step 2 complete → ready for Step 3
    case "SERVICES_SEEDED":
      return 3;

    // Step 3 in-progress sub-states
    case "STAFF_PENDING":
      return 3; // Step 3: Team (in progress)

    // Step 3 complete → ready for Step 4
    case "STAFF_INVITED":
      return 4;

    // Step 4 in-progress sub-states (agreements)
    case "AGREEMENTS_PENDING":
      return 4; // Step 4: Agreements (in progress)

    // Step 4 complete → ready for Step 5
    case "AGREEMENTS_CONFIGURED":
      return 5;

    // Step 5 in-progress sub-states (compensation)
    case "COMPENSATION_PENDING":
      return 5; // Step 5: Compensation (in progress)

    // Step 5 complete — still renders step 5 (alreadyComplete variant
    // triggers completion call + redirect to dashboard)
    case "COMPENSATION_CONFIGURED":
      return 5;

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
  "Agreements",         // Step 4
  "Compensation",       // Step 5
  "Branding",           // Step 6
  "Import",             // Step 7
  "Go Live",            // Step 8
] as const;
