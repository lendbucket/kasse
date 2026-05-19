import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import type { OnboardingLocationCreateInput } from './types';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';

const DEFAULT_GEOFENCE_RADIUS_FT = 100;

// DEFAULT_TIMEZONE is the fallback when client doesn't specify one.
// P1.A.8 UI will pick based on the user's browser/location. Keeping a
// US Central default makes sense at launch since the founder team and
// initial salons are concentrated in TX.
const DEFAULT_TIMEZONE = 'America/Chicago';

// Fail fast if the runtime is too old to support IANA timezone validation.
// package.json engines.node >= 20 should make this impossible, but assert
// here to catch any deployment that bypasses the engine gate.
if (typeof Intl.supportedValuesOf !== 'function') {
  throw new Error(
    'lib/onboarding/location.ts requires Node >=20 for Intl.supportedValuesOf. ' +
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
 * Uses prismaAdmin deliberately — the owner's NextAuth JWT was minted at
 * sign-in time before the org existed, so session.user.organizationId is
 * null. withTenantScope would throw NO_TENANT. This is the same bootstrap
 * window as org-create. Ownership is verified via the OnboardingSession
 * (session.userId must match the authenticated caller).
 *
 * All writes including state transition happen atomically inside a single
 * $transaction. Audit logs are written outside (fail-soft).
 */
export async function createLocationForOnboarding(args: {
  input: OnboardingLocationCreateInput;
  authenticatedUserId: string;
}): Promise<{ locationId: string }> {
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

  // All writes atomic: location + session FK + user locationId + state
  // transition + transition audit row.
  const location = await prismaAdmin.$transaction(async (tx) => {
    // Re-read session inside transaction to catch concurrent-call races.
    // The pre-tx check above is for fast-fail user feedback; this one
    // guarantees correctness under concurrency.
    const txSession = await tx.onboardingSession.findUnique({
      where: { id: args.input.sessionId },
    });
    if (!txSession || txSession.state !== 'ORG_CREATED') {
      throw new OnboardingError(
        'INVALID_TRANSITION',
        `concurrent call advanced session state — retry`
      );
    }
    if (txSession.locationId !== null) {
      throw new OnboardingError(
        'INVALID_TRANSITION',
        'location already exists for this session'
      );
    }
    if (!txSession.organizationId) {
      // Should be impossible given state === 'ORG_CREATED', but be paranoid
      throw new OnboardingError(
        'ORG_NOT_YET_CREATED',
        'session has no organizationId despite state being ORG_CREATED — DB inconsistency'
      );
    }

    // Use txSession.organizationId (authoritative in-tx re-read) not
    // args.input.organizationId (client-supplied). Closes the TOCTOU window.
    const newLocation = await tx.location.create({
      data: {
        organizationId: txSession.organizationId,
        name: args.input.locationName.trim(),
        address: args.input.address.trim(),
        city: args.input.city.trim(),
        state: args.input.state.trim().toUpperCase(),
        zip: args.input.zip.trim(),
        geofenceRadius: DEFAULT_GEOFENCE_RADIUS_FT,
        timezone: args.input.timezone ?? DEFAULT_TIMEZONE,
        // lat/lng: null by default — no geocoder integrated yet.
        // TODO: integrate geocoding service before launch (Google Places,
        // Mapbox, or similar). Until then, address is stored as text and
        // geofence checks use the default 100ft radius with null coords.
      },
    });

    await tx.onboardingSession.update({
      where: { id: args.input.sessionId },
      data: {
        locationId: newLocation.id,
        state: 'LOCATION_CREATED',
      },
    });

    await tx.user.update({
      where: { id: args.authenticatedUserId },
      data: { locationId: newLocation.id },
    });

    await tx.onboardingStateTransition.create({
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

    return newLocation;
  });

  // Audit logs outside transaction (fail-soft — writeAuditLog never throws).
  // Use location.organizationId (post-tx authoritative value from the created
  // entity), consistent with org.ts using org.id.
  await writeAuditLog({
    userId: args.authenticatedUserId,
    organizationId: location.organizationId,
    action: AuditAction.ONBOARDING_SESSION_TRANSITIONED,
    entity: 'OnboardingSession',
    entityId: args.input.sessionId,
    before: { state: 'ORG_CREATED' },
    after: { state: 'LOCATION_CREATED' },
    changedFields: ['state'],
  });

  await writeAuditLog({
    userId: args.authenticatedUserId,
    organizationId: location.organizationId,
    action: AuditAction.LOCATION_CREATED,
    entity: 'Location',
    entityId: location.id,
    metadata: { via: 'onboarding', sessionId: args.input.sessionId },
  });

  return { locationId: location.id };
}
