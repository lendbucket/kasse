import { getSessionById, linkResource, transitionTo } from './sessions';
import { OnboardingError } from './types';
import type { OnboardingLocationCreateInput } from './types';
import type { Prisma } from '@prisma/client';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';

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
 * OnboardingSession state writes go through the established sessions.ts
 * helpers (linkResource + transitionTo) which use prismaAdmin internally.
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

  // Three-phase write sequence:
  //
  // Phase 1 — tenant-scoped (args.tx, withTenantScope): Location.create,
  //   User.update(locationId), Organization.update(timezone). RLS-enforced.
  //   These writes commit when the withTenantScope callback returns.
  //
  // Phase 2 — superadmin via helpers (linkResource + transitionTo, both in
  //   lib/onboarding/sessions.ts): OnboardingSession.locationId, state
  //   advance, StateTransition row, ONBOARDING_SESSION_TRANSITIONED audit.
  //   These write through prismaAdmin but NOT inside a single $transaction
  //   — that pattern is broken under the prismaAdmin $extends wrapper
  //   (see lib/prismaAdmin.ts comment block and GitHub issue #95).
  //
  // Phase 3 — audit (writeAuditLog): LOCATION_CREATED entry. Fail-soft.
  //
  // Atomicity: writes are NOT atomic across phases. Same gap exists in
  // every other onboarding helper. Tracked in GitHub issue #95. The pre-tx
  // state guard above and transitionTo's own ALLOWED_TRANSITIONS validation
  // guard against most retry failure modes; the residual risk is a process
  // crash between phases 1 and 2, leaving a Location with no
  // OnboardingSession progression. Operationally recoverable: a follow-up
  // call from the same user would hit the ORG_CREATED state guard in
  // transitionTo and create a new Location (the orphaned first Location
  // is detectable by orgId + recent createdAt for janitor cleanup).

  const locationTimezone = args.input.timezone ?? DEFAULT_TIMEZONE;
  const newLocation = await args.tx.location.create({
    data: {
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

  // First-location-wins for org timezone. Multi-location orgs created
  // later won't trigger this — only the very first location sets the
  // org timezone (state === 'ORG_CREATED' guard ensures this).
  await args.tx.organization.update({
    where: { id: args.input.organizationId },
    data: { timezone: locationTimezone },
  });

  // OnboardingSession.locationId + state transition via established helpers.
  // These run after the tenant tx callback returns but the atomicity gap
  // is the same as all other onboarding state transitions in the codebase
  // (sessions.ts transitionTo / linkResource / skipStep all use this pattern).
  await linkResource({
    sessionId: args.input.sessionId,
    locationId: newLocation.id,
  });

  await transitionTo({
    sessionId: args.input.sessionId,
    toState: 'LOCATION_CREATED',
    triggeredByUserId: args.authenticatedUserId,
    metadata: { locationId: newLocation.id },
  });

  await writeAuditLog({
    userId: args.authenticatedUserId,
    organizationId: newLocation.organizationId,
    action: AuditAction.LOCATION_CREATED,
    entity: 'Location',
    entityId: newLocation.id,
    metadata: { via: 'onboarding', sessionId: args.input.sessionId },
  });

  return {
    locationId: newLocation.id,
    // organizationId read from the created entity (round-trip to args.input.organizationId).
    // Kept this way for defense-in-depth: if Prisma ever transforms the FK on write,
    // we'd surface the actual stored value rather than the input.
    organizationId: newLocation.organizationId,
  };
}
