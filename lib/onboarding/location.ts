import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import type { OnboardingLocationCreateInput } from './types';
import type { Prisma } from '@prisma/client';

const DEFAULT_GEOFENCE_RADIUS_FT = 100;

// DEFAULT_TIMEZONE is the fallback when client doesn't specify one.
// P1.A.8 UI will pick based on the user's browser/location. Keeping a
// US Central default makes sense at launch since the founder team and
// initial salons are concentrated in TX.
const DEFAULT_TIMEZONE = 'America/Chicago';

// Fail fast if the runtime is too old to support IANA timezone validation.
// package.json engines.node >= 18 should make this impossible, but assert
// here to catch any deployment that bypasses the engine gate.
if (typeof Intl.supportedValuesOf !== 'function') {
  throw new Error(
    'lib/onboarding/location.ts requires Node >=18 for Intl.supportedValuesOf. ' +
    'Update Node or check package.json engines field.'
  );
}

const IANA_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));

export function validateTimezone(tz: string | undefined): string | null {
  if (!tz) return null; // Empty/undefined = use default, not invalid
  if (!IANA_TIMEZONES.has(tz)) {
    return `'${tz}' is not a recognized IANA timezone identifier`;
  }
  return null;
}

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const US_ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

// 50 states + DC + 5 territories
const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
]);

export function validateLocationName(name: string): string | null {
  if (typeof name !== 'string') return 'location name is required';
  const trimmed = name.trim();
  if (trimmed.length < MIN_NAME_LENGTH) {
    return `location name must be at least ${MIN_NAME_LENGTH} characters`;
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `location name must be at most ${MAX_NAME_LENGTH} characters`;
  }
  return null;
}

export function validateAddress(args: {
  address: string;
  city: string;
  state: string;
  zip: string;
}): string | null {
  if (!args.address || args.address.trim().length < 3) {
    return 'street address is required';
  }
  if (!args.city || args.city.trim().length < 1) {
    return 'city is required';
  }
  if (!US_STATE_CODES.has(args.state.trim().toUpperCase())) {
    return 'state must be a valid US state code (e.g., TX)';
  }
  if (!US_ZIP_PATTERN.test(args.zip)) {
    return 'zip code must be 5 digits or ZIP+4 (e.g., 78401 or 78401-1234)';
  }
  return null;
}

/**
 * Create the first Location for the owner's org during onboarding.
 *
 * Accepts a tenant-scoped transaction client (tx) from withTenantScope for
 * Location/User/Organization writes (RLS-enforced tenant isolation).
 *
 * OnboardingSession state writes (linkResource + transitionTo + audit) are
 * the CALLER's responsibility — they must run AFTER withTenantScope returns
 * (after the tenant tx commits) so the Location row is visible on the
 * prismaAdmin connection that sessions.ts helpers use. Doing them inside
 * args.tx would fail with a FK constraint violation because prismaAdmin
 * runs on a separate connection pool and can't see uncommitted rows.
 */
export async function createLocationForOnboarding(args: {
  tx: Prisma.TransactionClient;
  input: OnboardingLocationCreateInput;
  authenticatedUserId: string;
}): Promise<{ locationId: string; organizationId: string }> {
  const nameError = validateLocationName(args.input.locationName);
  if (nameError) {
    throw new OnboardingError('INVALID_LOCATION_NAME', nameError);
  }

  const addrError = validateAddress({
    address: args.input.address,
    city: args.input.city,
    state: args.input.state,
    zip: args.input.zip,
  });
  if (addrError) {
    throw new OnboardingError('INVALID_ADDRESS', addrError);
  }

  const tzError = validateTimezone(args.input.timezone);
  if (tzError) {
    throw new OnboardingError('INVALID_TIMEZONE', tzError);
  }

  // Pre-tx fast-fail checks via prismaAdmin (getSessionById uses prismaAdmin).
  const session = await getSessionById(args.input.sessionId);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', 'session not found');
  }
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session does not belong to authenticated user');
  }
  if (session.organizationId === null) {
    throw new OnboardingError(
      'ORG_NOT_YET_CREATED',
      'organization must be created before adding a location'
    );
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session organization does not match the input organization');
  }
  if (session.state !== 'ORG_CREATED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot create location from state '${session.state}' — must be ORG_CREATED`
    );
  }

  // Atomic claim via state transition. Two concurrent POSTs both try this
  // UPDATE; Postgres row-level lock serializes them. The first transitions
  // ORG_CREATED → LOCATION_PENDING and returns count=1. The second waits
  // for the lock, re-reads the row, sees state='LOCATION_PENDING' (not
  // 'ORG_CREATED'), WHERE clause fails, returns count=0 → throws.
  //
  // The state-as-claim-token pattern works because the UPDATE modifies
  // a column (state) that's in its own WHERE clause. A plain "touch
  // updatedAt" sentinel would NOT serialize.
  //
  // The userId + organizationId conditions in the WHERE clause fold
  // ownership verification into the atomic claim. Pre-tx getSessionById
  // already verified ownership, but that read is on a separate connection
  // from this UPDATE — including the conditions here closes the narrow
  // TOCTOU window without an extra round-trip. If a session token is
  // presented for the wrong user/org, the claim silently fails (count=0)
  // and the route returns INVALID_TRANSITION. Pre-tx checks still run
  // first to give clients better error discrimination (SESSION_NOT_FOUND,
  // ORG_SCOPE_MISMATCH, etc.) before reaching this claim.
  const claim = await prismaAdmin.onboardingSession.updateMany({
    where: {
      id: args.input.sessionId,
      state: 'ORG_CREATED',
      locationId: null,
      userId: args.authenticatedUserId,
      organizationId: args.input.organizationId,
    },
    data: {
      state: 'LOCATION_PENDING',
    },
  });

  if (claim.count === 0) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      'session is no longer eligible for location creation — concurrent call or state has advanced'
    );
  }

  // Tenant-scoped writes: Location.create, User.update(locationId),
  // Organization.update(timezone). RLS-enforced via withTenantScope. These
  // commit when the withTenantScope callback returns.

  const locationTimezone = args.input.timezone ?? DEFAULT_TIMEZONE;
  const newLocation = await args.tx.location.create({
    data: {
      // organizationId comes from the JWT (server-verified by NextAuth).
      // The pre-tx session check above asserted session.organizationId ===
      // args.input.organizationId, and the claim updateMany requires
      // state='ORG_CREATED' on the session, so a session whose org was
      // mutated mid-flow would fail the claim.
      organizationId: args.input.organizationId,
      name: args.input.locationName.trim(),
      address: args.input.address.trim(),
      city: args.input.city.trim(),
      state: args.input.state.trim().toUpperCase(),
      zip: args.input.zip.trim(),
      geofenceRadius: DEFAULT_GEOFENCE_RADIUS_FT,
      timezone: locationTimezone,
      // lat/lng: null by default — no geocoder integrated yet.
      // TODO: integrate geocoding service before launch.
    },
  });

  await args.tx.user.update({
    where: { id: args.authenticatedUserId },
    data: { locationId: newLocation.id },
  });

  // First-location-wins for org timezone. The claim guard above (updateMany
  // with state='ORG_CREATED' + locationId IS NULL) ensures only one call
  // reaches this update — concurrent calls and post-LOCATION_CREATED
  // retries are rejected with INVALID_TRANSITION.
  await args.tx.organization.update({
    where: { id: args.input.organizationId },
    data: { timezone: locationTimezone },
  });

  return {
    locationId: newLocation.id,
    // organizationId echoed from the create result. Prisma returns the
    // value we wrote; no separate read.
    organizationId: newLocation.organizationId,
  };
}
