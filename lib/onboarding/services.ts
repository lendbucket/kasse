import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import { getVerticalConfig } from '@/lib/verticals/registry';
import type { Prisma } from '@prisma/client';
import type { VerticalId } from '@prisma/client';

/**
 * Seed the vertical's default service catalog for the owner's org during
 * onboarding.
 *
 * Accepts a tenant-scoped transaction client (tx) from withTenantScope for
 * Service.createMany (RLS-enforced tenant isolation). OnboardingSession
 * state writes happen in the CALLER (route handler) AFTER withTenantScope
 * returns, so the Service rows are committed and visible on the prismaAdmin
 * connection that sessions.ts helpers use.
 */
export async function createServicesForOnboarding(args: {
  tx: Prisma.TransactionClient;
  input: {
    sessionId: string;
    organizationId: string;
    selectedNames?: string[];
    skip?: boolean;
  };
  authenticatedUserId: string;
}): Promise<{ servicesSeededCount: number; organizationId: string }> {
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
      'organization must be created before seeding services'
    );
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session organization does not match the input organization');
  }
  if (session.locationId === null) {
    throw new OnboardingError(
      'LOCATION_NOT_YET_CREATED',
      'location must be created before seeding services'
    );
  }
  if (session.state !== 'LOCATION_CREATED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot seed services from state '${session.state}' — must be LOCATION_CREATED`
    );
  }

  // Atomic claim via state transition. Same pattern as LOCATION_PENDING in
  // createLocationForOnboarding. Concurrent POSTs both try this UPDATE;
  // Postgres row-level lock serializes them. The first transitions
  // LOCATION_CREATED → SERVICES_PENDING (count=1). The second sees
  // state='SERVICES_PENDING', WHERE fails, count=0 → throws.
  //
  // userId + organizationId in WHERE fold ownership verification into the
  // atomic claim, closing the TOCTOU window between pre-tx read and claim.
  // locationId: { not: null } is defense-in-depth — state='LOCATION_CREATED'
  // already implies locationId is non-null in normal operation (P1.A.3b
  // always sets locationId before advancing state), but the explicit
  // guard stays consistent with cycle 7 of PR #94 ownership defense.
  const claim = await prismaAdmin.onboardingSession.updateMany({
    where: {
      id: args.input.sessionId,
      state: 'LOCATION_CREATED',
      userId: args.authenticatedUserId,
      organizationId: args.input.organizationId,
      locationId: { not: null },
    },
    data: {
      state: 'SERVICES_PENDING',
    },
  });

  if (claim.count === 0) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      'session is no longer eligible for service seeding — concurrent call or state has advanced'
    );
  }

  // Look up the org's verticalId to pick the right defaultServices list.
  const org = await args.tx.organization.findUnique({
    where: { id: args.input.organizationId },
    select: { verticalId: true },
  });
  if (!org) {
    // Structurally impossible in normal operation: the pre-tx check
    // already asserted session.organizationId !== null, and the claim
    // updateMany above required organizationId = X to succeed. Reaching
    // this branch means the Organization row was deleted between the
    // claim and this lookup (only possible via SUPERADMIN intervention).
    //
    // If this fires, the session is left stuck at SERVICES_PENDING with
    // no automated recovery — same atomicity gap as all other onboarding
    // state transitions. Tracked in issue #95 (janitor job for stuck
    // PENDING sessions + withAdminTx for atomic state rollback).
    throw new OnboardingError('ORG_NOT_YET_CREATED', 'organization not found');
  }

  // Cast: Prisma's generated VerticalId enum and the registry's VerticalId
  // union have identical runtime values. The cast bridges the type-system
  // distinction without changing behavior.
  const config = getVerticalConfig(org.verticalId as VerticalId);
  const defaultServices = config.defaultServices;

  // Skip path: seed nothing, return immediately. State still advances via
  // the route's transitionTo to SERVICES_SEEDED — skipping is a valid
  // completion of this step.
  if (args.input.skip) {
    return {
      servicesSeededCount: 0,
      organizationId: args.input.organizationId,
    };
  }

  // Resolve the seed list: if selectedNames provided, filter to those;
  // otherwise seed all. If the resolved list is empty (user deselected
  // everything, or vertical has no catalog), treat as a skip — seed
  // nothing. Forward progress is never blocked by empties.
  let servicesToSeed = defaultServices;
  if (args.input.selectedNames && args.input.selectedNames.length > 0) {
    const nameSet = new Set(args.input.selectedNames);
    servicesToSeed = defaultServices.filter((s) => nameSet.has(s.name));
  }

  if (servicesToSeed.length === 0) {
    return {
      servicesSeededCount: 0,
      organizationId: args.input.organizationId,
    };
  }

  // Seed services via tenant-scoped tx (RLS enforces org scope).
  // Services are org-wide by default; per-location pricing/availability
  // overrides ride on ServiceLocation (P0.G.1 schema, wired in P1.C.2).
  const result = await args.tx.service.createMany({
    data: servicesToSeed.map((s) => ({
      organizationId: args.input.organizationId,
      name: s.name,
      category: s.category ?? null,
      price: s.priceCents / 100, // schema stores Float dollars, config has cents
      duration: s.durationMinutes,
      bufferTime: 0,
      isAddon: false,
      isActive: true,
      taxable: true,
      bookableByCustomers: true,
      bookableByStaff: true,
    })),
  });

  return {
    servicesSeededCount: result.count,
    organizationId: args.input.organizationId,
  };
}
