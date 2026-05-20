/**
 * Maps OnboardingError codes to HTTP status codes for route responses.
 * Centralized to keep route handlers thin and consistent.
 *
 * Extracted in P1.A.5 per cycle 3 reviewer feedback on PR #96 — the
 * mapping was duplicated across /api/onboarding/location and
 * /api/onboarding/services and would have continued to be copied with
 * each new route. Centralized here.
 */
export function onboardingErrorStatus(code: string): number {
  switch (code) {
    case 'SESSION_NOT_FOUND': return 404;
    case 'INVALID_TOKEN': return 404;
    case 'INVITE_NOT_FOUND': return 404;
    case 'ORG_SCOPE_MISMATCH': return 403;
    case 'NOT_AUTHENTICATED': return 401;
    case 'SESSION_EXPIRED': return 410;
    case 'TOKEN_ALREADY_CONSUMED': return 410;
    case 'INVITE_ALREADY_ACCEPTED': return 410;
    case 'INVITE_EXPIRED': return 410;
    case 'INVALID_TRANSITION': return 409;
    case 'STEP_NOT_SKIPPABLE': return 409;
    case 'SESSION_COMPLETED': return 409;
    case 'ORG_NOT_YET_CREATED': return 409;
    case 'LOCATION_NOT_YET_CREATED': return 409;
    case 'DUPLICATE_ACTIVE_SESSION': return 409;
    case 'EMAIL_ALREADY_REGISTERED': return 409;
    case 'INVITE_ALREADY_EXISTS': return 409;
    case 'INVITE_EMAIL_ALREADY_USER': return 409;
    case 'TOO_MANY_MAGIC_LINK_SENDS': return 429;
    // Default 400 for validation-style codes:
    // INVALID_EMAIL, INVALID_ADDRESS, INVALID_LOCATION_NAME,
    // INVALID_TIMEZONE, INVALID_VERTICAL, INVALID_PLAN_TIER,
    // INVALID_ORG_NAME, PASSWORD_TOO_WEAK, EMAIL_MISMATCH,
    // WRONG_TOKEN_PURPOSE, SLUG_COLLISION, INVITE_EMAIL_REQUIRED
    default: return 400;
  }
}
