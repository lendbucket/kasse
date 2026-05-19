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
 * the Location.create call (RLS-enforced tenant isolation). OnboardingSession
 * and OnboardingStateTransition writes go through prismaAdmin because their
 * RLS policies require is_superadmin for mutations.
 *
 * Returns the created location ID. Audit logs are written by the caller
 * (route handler) outside the transaction scope.
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

  // Pre-tx fast-fail checks via prismaAdmin (OnboardingSession RLS requires
  // superadmin for writes; reads allow userId match via actor_user_id).
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

  // Create location via tenant-scoped tx (RLS enforces org scope on Location table).
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

  // Set owner's default locationId via tenant-scoped tx.
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

  // OnboardingSession + OnboardingStateTransition writes go through
  // prismaAdmin because their RLS policies require is_superadmin for
  // INSERT/UPDATE. These are outside the tenant-scoped tx but still
  // atomic within prismaAdmin's own transaction wrapper.
  await prismaAdmin.onboardingSession.update({
    where: { id: args.input.sessionId },
    data: {
      locationId: newLocation.id,
      state: 'LOCATION_CREATED',
    },
  });

  await prismaAdmin.onboardingStateTransition.create({
    data: {
      sessionId: args.input.sessionId,
      fromState: session.state,
      toState: 'LOCATION_CREATED',
      triggeredByUserId: args.authenticatedUserId,
      metadata: {
        locationId: newLocation.id,
      },
    },
  });

  return { locationId: newLocation.id, organizationId: newLocation.organizationId };
}
