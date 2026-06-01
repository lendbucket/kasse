import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError, V1_LAUNCH_PLAN_TIERS } from './types';
import type { OnboardingOrgCreateInput, OnboardingPlanTier } from './types';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import type { VerticalId } from '@/lib/verticals/types';

const VALID_VERTICALS = new Set<string>(['salon', 'nail_salon']);

const MIN_ORG_NAME_LENGTH = 2;
const MAX_ORG_NAME_LENGTH = 100;

export function validateOrgName(name: string): string | null {
  if (typeof name !== 'string') return 'organization name is required';
  const trimmed = name.trim();
  if (trimmed.length < MIN_ORG_NAME_LENGTH) {
    return `organization name must be at least ${MIN_ORG_NAME_LENGTH} characters`;
  }
  if (trimmed.length > MAX_ORG_NAME_LENGTH) {
    return `organization name must be at most ${MAX_ORG_NAME_LENGTH} characters`;
  }
  return null;
}

// Lowercase alphanumeric, no ambiguous chars (no 0/O/1/l/I)
const SLUG_SUFFIX_CHARS = '23456789abcdefghjkmnpqrstuvwxyz';

function generateSlugSuffix(): string {
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += SLUG_SUFFIX_CHARS[randomInt(0, SLUG_SUFFIX_CHARS.length)];
  }
  return suffix;
}

function generateSlug(name: string): string {
  const base = name
    .normalize('NFD')                    // Decompose: 'é' → 'e' + '\u0301'
    .replace(/[\u0300-\u036f]/g, '')     // Strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  if (!base) {
    return generateSlugSuffix();
  }

  return `${base}-${generateSlugSuffix()}`;
}

/**
 * Bootstrap the owner's organization. Uses prismaAdmin deliberately because
 * the org doesn't exist yet — there's no tenant context to scope by. This
 * is the ONLY legitimate Organization.create call outside SUPERADMIN admin
 * routes. Documented in RLS_AUDIT.md as ORG_BOOTSTRAP.
 *
 * All writes including state transition happen atomically inside a single
 * $transaction. Audit logs are written outside (fail-soft).
 */
export async function createOrgForOnboarding(args: {
  input: OnboardingOrgCreateInput;
  authenticatedUserId: string;
}): Promise<{ organizationId: string }> {
  const nameError = validateOrgName(args.input.orgName);
  if (nameError) {
    throw new OnboardingError('INVALID_ORG_NAME', nameError);
  }

  if (!(V1_LAUNCH_PLAN_TIERS as readonly string[]).includes(args.input.planTier)) {
    throw new OnboardingError(
      'INVALID_PLAN_TIER',
      `plan tier must be one of: ${V1_LAUNCH_PLAN_TIERS.join(', ')}`
    );
  }
  // After validation, planTier is guaranteed to be a valid OnboardingPlanTier
  const validatedPlanTier = args.input.planTier as OnboardingPlanTier;

  if (args.input.vertical !== 'SALON') {
    throw new OnboardingError(
      'INVALID_VERTICAL',
      'only SALON vertical is supported at v1 launch'
    );
  }

  const session = await getSessionById(args.input.sessionId);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', `session ${args.input.sessionId} not found`);
  }
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError(
      'ORG_SCOPE_MISMATCH',
      'authenticated user does not own this onboarding session'
    );
  }
  if (session.state !== 'ACCOUNT_CREATED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot create org from state '${session.state}' — must be ACCOUNT_CREATED`
    );
  }
  if (session.organizationId) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      'organization already exists for this session'
    );
  }

  const slug = generateSlug(args.input.orgName);

  // All writes atomic: org + user link + business settings + session FK +
  // state transition + transition audit row.
  // Slug uniqueness is enforced by DB unique constraint. With a 6-character
  // crypto.randomInt suffix over a 31-char alphabet (~887M combinations),
  // collision probability is vanishingly small for our signup volume. If
  // P2002 fires (would require two concurrent signups whose entire slug
  // collides), the $transaction rolls back and the route returns 503.
  // Retry by the user generates a fresh suffix. Accepted gap — no retry loop.
  const org = await prismaAdmin.$transaction(async (tx) => {
    // Re-read session inside transaction to catch concurrent-call races.
    // The pre-tx check above is for fast-fail user feedback; this one
    // guarantees correctness under concurrency.
    const txSession = await tx.onboardingSession.findUnique({
      where: { id: args.input.sessionId },
    });
    if (!txSession || txSession.state !== 'ACCOUNT_CREATED') {
      throw new OnboardingError(
        'INVALID_TRANSITION',
        `concurrent call advanced session state — retry`
      );
    }
    if (txSession.organizationId) {
      throw new OnboardingError(
        'INVALID_TRANSITION',
        'organization already exists for this session'
      );
    }

    let newOrg;
    try {
      newOrg = await tx.organization.create({
        data: {
          name: args.input.orgName.trim(),
          slug,
          planTier: validatedPlanTier,
          verticalId: 'salon',
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new OnboardingError(
          'SLUG_COLLISION',
          'temporary slug generation collision (extremely rare) — please try again in a moment'
        );
      }
      throw err;
    }

    await tx.user.update({
      where: { id: args.authenticatedUserId },
      data: {
        organizationId: newOrg.id,
        role: 'OWNER',
      },
    });

    await tx.businessSettings.create({
      data: { organizationId: newOrg.id },
    });

    // Map API-level 'SALON' (uppercase) to DB-level 'salon' (lowercase enum)
    // to keep OnboardingSession.vertical consistent with Organization.verticalId.
    await tx.onboardingSession.update({
      where: { id: args.input.sessionId },
      data: {
        organizationId: newOrg.id,
        vertical: 'salon',
        state: 'ORG_CREATED',
      },
    });

    await tx.onboardingStateTransition.create({
      data: {
        sessionId: args.input.sessionId,
        fromState: session.state,
        toState: 'ORG_CREATED',
        triggeredByUserId: args.authenticatedUserId,
        metadata: {
          organizationId: newOrg.id,
          planTier: validatedPlanTier,
          vertical: 'salon',
        },
      },
    });

    return newOrg;
  });

  // Audit logs outside transaction (fail-soft — writeAuditLog never throws)
  await writeAuditLog({
    userId: args.authenticatedUserId,
    organizationId: org.id,
    action: AuditAction.ONBOARDING_SESSION_TRANSITIONED,
    entity: 'OnboardingSession',
    entityId: args.input.sessionId,
    before: { state: 'ACCOUNT_CREATED' },
    after: { state: 'ORG_CREATED' },
    changedFields: ['state'],
  });

  await writeAuditLog({
    userId: args.authenticatedUserId,
    organizationId: org.id,
    action: AuditAction.ORG_BOOTSTRAPPED,
    entity: 'Organization',
    entityId: org.id,
    metadata: {
      via: 'onboarding',
      sessionId: args.input.sessionId,
      planTier: validatedPlanTier,
      vertical: 'salon',
    },
  });

  return { organizationId: org.id };
}

/**
 * Update an existing organization's profile during onboarding Step 1.
 * Under Option C, signup already creates the org + an ORG_CREATED session,
 * so this function UPDATES the org (not creates). It sets vertical, legal
 * name, DBA, and display name without advancing state — the location route
 * handles state advancement (ORG_CREATED → LOCATION_CREATED).
 *
 * Idempotent: can be called on revisits (states past ORG_CREATED) to
 * re-edit the profile. Only blocks COMPLETED sessions.
 *
 * Uses prismaAdmin because the org was just created by signup and the
 * session doesn't have tenant context yet. Same ORG_BOOTSTRAP justification
 * as createOrgForOnboarding.
 */
export async function updateOrgForOnboarding(args: {
  input: {
    sessionId: string;
    vertical: string;
    legalName: string;
    dbaName?: string;
    displayName: string;
  };
  authenticatedUserId: string;
}): Promise<{ organizationId: string }> {
  const { sessionId, vertical, legalName, dbaName, displayName } = args.input;

  // --- Validate vertical ---
  if (!VALID_VERTICALS.has(vertical)) {
    throw new OnboardingError(
      'INVALID_VERTICAL',
      `vertical must be one of: ${[...VALID_VERTICALS].join(', ')}`
    );
  }
  // After validation, vertical is guaranteed to be a valid VerticalId
  const validatedVertical = vertical as VerticalId;

  // --- Validate names ---
  const legalNameError = validateOrgName(legalName);
  if (legalNameError) {
    throw new OnboardingError('INVALID_ORG_NAME', `legal name: ${legalNameError}`);
  }
  const displayNameError = validateOrgName(displayName);
  if (displayNameError) {
    throw new OnboardingError('INVALID_ORG_NAME', `display name: ${displayNameError}`);
  }
  if (dbaName !== undefined && dbaName !== null && dbaName.trim().length > MAX_ORG_NAME_LENGTH) {
    throw new OnboardingError(
      'INVALID_ORG_NAME',
      `DBA name must be at most ${MAX_ORG_NAME_LENGTH} characters`
    );
  }

  // --- Load and verify session ---
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', `session ${sessionId} not found`);
  }
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError(
      'ORG_SCOPE_MISMATCH',
      'authenticated user does not own this onboarding session'
    );
  }
  if (!session.organizationId) {
    throw new OnboardingError(
      'ORG_NOT_YET_CREATED',
      'organization has not been created yet — signup may not have completed'
    );
  }
  if (session.state === 'COMPLETED') {
    throw new OnboardingError(
      'SESSION_COMPLETED',
      'cannot update org on a completed session'
    );
  }

  const organizationId = session.organizationId;

  // --- Atomic update: org + session ---
  await prismaAdmin.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: organizationId },
      data: {
        name: displayName.trim(),
        legalName: legalName.trim(),
        dbaName: dbaName?.trim() || null,
        verticalId: validatedVertical,
      },
    });

    const existingData = (session.data ?? {}) as Record<string, unknown>;
    await tx.onboardingSession.update({
      where: { id: sessionId },
      data: {
        vertical: validatedVertical,
        data: {
          ...existingData,
          vertical: validatedVertical,
          legalName: legalName.trim(),
          dbaName: dbaName?.trim() || null,
          displayName: displayName.trim(),
        },
      },
    });
  });

  // Audit outside transaction (fail-soft)
  await writeAuditLog({
    userId: args.authenticatedUserId,
    organizationId,
    action: AuditAction.ORG_BOOTSTRAPPED,
    entity: 'Organization',
    entityId: organizationId,
    metadata: {
      via: 'onboarding-step1-update',
      vertical: validatedVertical,
      legalName: legalName.trim(),
      displayName: displayName.trim(),
    },
  });

  return { organizationId };
}
