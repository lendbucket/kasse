import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import type { Prisma } from '@prisma/client';

const VALID_TEMPLATE_TYPES = ['W2', 'CONTRACTOR_1099', 'BOOTH_RENT', 'HYBRID'] as const;
type TemplateType = typeof VALID_TEMPLATE_TYPES[number];

/**
 * Create DRAFT EmploymentAgreement rows for all active Staff at a given
 * org+location during onboarding. Scaffolding only — documentUrl is a
 * placeholder ('pending://<templateType>') and status is always 'DRAFT'.
 * Real legal document content, e-sign, and PDF storage ship in P1.A.7.
 *
 * Accepts a tenant-scoped transaction client (tx) from withTenantScope for
 * EmploymentAgreement.createMany (RLS-enforced tenant isolation).
 * OnboardingSession state writes happen in the CALLER (route handler) AFTER
 * withTenantScope returns, so the EmploymentAgreement rows are committed
 * and visible on the prismaAdmin connection that sessions.ts helpers use.
 */
export async function createEmploymentAgreementDrafts(args: {
  tx: Prisma.TransactionClient;
  input: {
    sessionId: string;
    organizationId: string;
    locationId: string;
    skip?: boolean;
    templateType?: string;
    notes?: string;
  };
  authenticatedUserId: string;
}): Promise<{
  agreementsCreatedCount: number;
  templateType: string | null;
  skipped: boolean;
  organizationId: string;
}> {
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
      'organization must be created before configuring agreements'
    );
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session organization does not match the input organization');
  }
  if (session.locationId === null) {
    throw new OnboardingError(
      'LOCATION_NOT_YET_CREATED',
      'location must be created before configuring agreements'
    );
  }
  if (session.state !== 'STAFF_INVITED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot configure agreements from state '${session.state}' — must be STAFF_INVITED`
    );
  }

  // Validate templateType if not skipping
  if (!args.input.skip) {
    if (!args.input.templateType || !VALID_TEMPLATE_TYPES.includes(args.input.templateType as TemplateType)) {
      throw new OnboardingError(
        'INVALID_AGREEMENT_TEMPLATE_TYPE',
        `templateType must be one of: ${VALID_TEMPLATE_TYPES.join(', ')}`
      );
    }

    // Verify at least one Staff member exists at this org+location before
    // we claim the state. If we did this check AFTER the claim, an owner
    // who skipped staff invites would get stuck at AGREEMENTS_PENDING with
    // no recovery path. Pre-claim check keeps state at STAFF_INVITED so
    // owner can either invite staff or skip this step.
    //
    // Use prismaAdmin here (same connection family as getSessionById above);
    // RLS is bypassed but we're filtering by organizationId from a
    // pre-verified session, so cross-tenant exposure is impossible.
    const hasStaff = await prismaAdmin.staff.findFirst({
      where: {
        organizationId: args.input.organizationId,
        locationId: args.input.locationId,
        softDeletedAt: null,
      },
      select: { id: true },
    });

    if (!hasStaff) {
      throw new OnboardingError(
        'INVITE_NO_STAFF_TO_AGREE',
        'no active staff members found at this location — invite staff first or skip this step'
      );
    }
  }

  // Atomic claim via state transition. Same pattern as STAFF_PENDING in
  // createStaffInvitation. Concurrent POSTs both try this UPDATE;
  // Postgres row-level lock serializes them. The first transitions
  // STAFF_INVITED → AGREEMENTS_PENDING (count=1). The second sees
  // state='AGREEMENTS_PENDING', WHERE fails, count=0 → throws.
  const claim = await prismaAdmin.onboardingSession.updateMany({
    where: {
      id: args.input.sessionId,
      state: 'STAFF_INVITED',
      userId: args.authenticatedUserId,
      organizationId: args.input.organizationId,
      locationId: { not: null },
    },
    data: {
      state: 'AGREEMENTS_PENDING',
    },
  });

  if (claim.count === 0) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      'session is no longer eligible for agreement configuration — concurrent call or state has advanced'
    );
  }

  // Skip path: return early with no agreements created.
  // Route handler will transitionTo AGREEMENTS_CONFIGURED + record skip.
  if (args.input.skip) {
    return {
      agreementsCreatedCount: 0,
      templateType: null,
      skipped: true,
      organizationId: args.input.organizationId,
    };
  }

  const templateType = args.input.templateType as TemplateType;

  // Read all Staff rows for this org+location via args.tx (RLS-enforced).
  const staffMembers = await args.tx.staff.findMany({
    where: {
      organizationId: args.input.organizationId,
      locationId: args.input.locationId,
      softDeletedAt: null,
    },
    select: { id: true, name: true },
  });

  // Invariant: staffMembers.length > 0 — guaranteed by the pre-claim
  // INVITE_NO_STAFF_TO_AGREE check above. The check uses prismaAdmin
  // (RLS bypassed); this read uses args.tx (RLS enforced). In practice
  // they return the same set because: (a) all Staff have a non-null
  // organizationId, (b) the RLS policy on Staff filters by organizationId,
  // and (c) we're inside the tenant scope for this organizationId. If
  // there's ever a divergence (e.g., RLS policy changes), this would
  // fire as a 'INTERNAL: empty Staff under tenant scope' error.
  if (staffMembers.length === 0) {
    throw new OnboardingError(
      'INVITE_NO_STAFF_TO_AGREE',
      'INTERNAL: Staff found via prismaAdmin pre-check but not via tx — possible RLS divergence'
    );
  }

  // Create one DRAFT EmploymentAgreement per Staff member
  const result = await args.tx.employmentAgreement.createMany({
    data: staffMembers.map((s) => ({
      organizationId: args.input.organizationId,
      staffId: s.id,
      templateType,
      documentTitle: `${templateType} Employment Agreement — Draft`,
      documentUrl: `pending://${templateType}`,
      status: 'DRAFT',
      notes: args.input.notes ?? null,
    })),
  });

  return {
    agreementsCreatedCount: result.count,
    templateType,
    skipped: false,
    organizationId: args.input.organizationId,
  };
}
