import { prismaAdmin } from '@/lib/prismaAdmin';
import { getSessionById } from './sessions';
import { OnboardingError } from './types';
import type { Prisma } from '@prisma/client';

// Local imports for use within this file. The `export { ... }` block
// below re-exports them for consumers — `export` does not pull names
// into the current scope, so both blocks are needed.
import { validateCompensationInput } from './compensation-validation';
import type { CompensationInput } from './compensation-validation';

// Re-export pure validation types and functions from the DB-free module
// so consumers can import everything from a single entry point. Tests
// import directly from compensation-validation.ts to avoid the
// DATABASE_URL requirement that pulling in compensation.ts triggers.
export {
  VALID_MODEL_TYPES,
  VALID_BOOTH_RENT_FREQUENCIES,
  validateCompensationInput,
} from './compensation-validation';
export type {
  CompensationModelType,
  BoothRentFrequency,
  CompensationInput,
} from './compensation-validation';

/**
 * Set compensation for all staff members during onboarding. Follows the
 * same dual-client architecture as createEmploymentAgreementDrafts:
 *
 * - Pre-claim validation via prismaAdmin (RLS bypass, scoped by orgId)
 * - Atomic state claim: AGREEMENTS_CONFIGURED -> COMPENSATION_PENDING
 * - Compensation rows created via tenant-scoped tx (RLS enforced)
 * - Caller (route handler) advances to COMPENSATION_CONFIGURED after tx commits
 *
 * Compensation is REQUIRED per locked Q3. No skip path.
 */
export async function setCompensationForStaff(args: {
  tx: Prisma.TransactionClient;
  input: {
    sessionId: string;
    organizationId: string;
    locationId: string;
    compensations: CompensationInput[];
  };
  authenticatedUserId: string;
}): Promise<{
  compensationCount: number;
  organizationId: string;
}> {
  // 1. Session validation (mirrors createEmploymentAgreementDrafts pattern)
  const session = await getSessionById(args.input.sessionId);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', 'session not found');
  }
  if (session.userId !== args.authenticatedUserId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session does not belong to authenticated user');
  }
  if (session.organizationId === null) {
    throw new OnboardingError('ORG_NOT_YET_CREATED', 'organization must be created before setting compensation');
  }
  if (session.organizationId !== args.input.organizationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session organization does not match the input organization');
  }
  if (session.locationId === null) {
    throw new OnboardingError('LOCATION_NOT_YET_CREATED', 'location must be created before setting compensation');
  }
  if (session.locationId !== args.input.locationId) {
    throw new OnboardingError('ORG_SCOPE_MISMATCH', 'session location does not match the input location');
  }
  if (session.state !== 'AGREEMENTS_CONFIGURED') {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      `cannot set compensation from state '${session.state}' — must be AGREEMENTS_CONFIGURED`
    );
  }

  // 2. Pre-claim invariant: every staff with a non-DRAFT agreement must
  //    have a matching compensation input, and every input.staffId must
  //    correspond to a real staff at this location.
  const staffWithAgreements = await prismaAdmin.staff.findMany({
    where: {
      organizationId: args.input.organizationId,
      locationId: args.input.locationId,
      softDeletedAt: null,
    },
    select: {
      id: true,
      name: true,
      employmentAgreements: {
        select: { id: true, status: true },
      },
    },
  });

  // Staff who have an EmploymentAgreement (any status) are required
  const staffRequiringCompensation = staffWithAgreements.filter(
    (s) => s.employmentAgreements.length > 0
  );

  const inputStaffIds = new Set(args.input.compensations.map((c) => c.staffId));
  const validStaffIds = new Set(staffWithAgreements.map((s) => s.id));

  // Check: every input staffId must be a real staff at this location
  for (const comp of args.input.compensations) {
    if (!validStaffIds.has(comp.staffId)) {
      throw new OnboardingError(
        'COMPENSATION_STAFF_MISMATCH',
        `staffId '${comp.staffId}' does not match any active staff at this location`
      );
    }
  }

  // Check: every staff with an agreement must have compensation input
  for (const staff of staffRequiringCompensation) {
    if (!inputStaffIds.has(staff.id)) {
      throw new OnboardingError(
        'NOT_ALL_STAFF_HAVE_COMPENSATION',
        `staff '${staff.name ?? staff.id}' has an employment agreement but no compensation input was provided`
      );
    }
  }

  // 3. Validate every compensation input
  for (const comp of args.input.compensations) {
    const error = validateCompensationInput(comp);
    if (error) {
      throw new OnboardingError(
        'COMPENSATION_FIELDS_INCOMPLETE',
        `compensation for staff '${comp.staffId}': ${error}`
      );
    }
  }

  // 4. Atomic claim: AGREEMENTS_CONFIGURED -> COMPENSATION_PENDING
  //
  // WHY THIS COMES BEFORE THE TENANT TX:
  // The claim uses prismaAdmin (rolbypassrls bypass) to write the
  // OnboardingSession state. We can't put this inside withTenantScope
  // because OnboardingSession has SUPERADMIN_PROTECTED RLS policies —
  // the tenant-scoped tx (kasse_app role) cannot write to it.
  //
  // FAILURE MODE: if step 5 (Compensation row writes) throws, the
  // tenant tx rolls back BUT this claim already committed. The session
  // is stuck at COMPENSATION_PENDING. Recovery is by the janitor cron
  // (app/api/cron/onboarding-janitor) which sweeps stuck *_PENDING
  // states. The owner sees a 500/409 and retries after the janitor
  // surfaces it (today: 5min log-only; future: automated state reset).
  //
  // This is the same dual-client architecture trade-off documented for
  // /api/onboarding/agreements, /api/onboarding/staff-invite, and
  // /api/onboarding/services. Tracked as a known limitation in
  // docs/RLS_AUDIT.md under "Issue #95 — Codebase Atomicity Hardening".
  const claim = await prismaAdmin.onboardingSession.updateMany({
    where: {
      id: args.input.sessionId,
      state: 'AGREEMENTS_CONFIGURED',
      userId: args.authenticatedUserId,
      organizationId: args.input.organizationId,
      locationId: { not: null },
    },
    data: {
      state: 'COMPENSATION_PENDING',
    },
  });

  if (claim.count === 0) {
    throw new OnboardingError(
      'INVALID_TRANSITION',
      'session is no longer eligible for compensation configuration — concurrent call or state has advanced'
    );
  }

  // 5. Create Compensation rows via tenant-scoped tx (RLS enforced).
  //    Use upsert to handle re-runs gracefully (staffId is @unique on Compensation).
  for (const comp of args.input.compensations) {
    const startDate = new Date(comp.effectiveStartDate + 'T00:00:00Z');
    const endDate = comp.effectiveEndDate ? new Date(comp.effectiveEndDate + 'T00:00:00Z') : null;

    await args.tx.compensation.upsert({
      where: { staffId: comp.staffId },
      create: {
        organizationId: args.input.organizationId,
        staffId: comp.staffId,
        modelType: comp.modelType,
        effectiveStartDate: startDate,
        effectiveEndDate: endDate,
        baseHourlyRateCents: comp.baseHourlyRateCents ?? null,
        baseCommissionPct: comp.baseCommissionPct ?? null,
        perServiceCommissionOverrides: comp.perServiceCommissionOverrides ?? undefined,
        tieredCommissionConfig: comp.tieredCommissionConfig ?? undefined,
        retailCommissionPct: comp.retailCommissionPct ?? null,
        boothRentCents: comp.boothRentCents ?? null,
        boothRentFrequency: comp.boothRentFrequency ?? null,
        overtimeMultiplier: comp.overtimeMultiplier ?? 1.5,
        overtimeThresholdHours: comp.overtimeThresholdHours ?? 40,
        includeTipsInCommission: comp.includeTipsInCommission ?? false,
        productDeductionEnabled: comp.productDeductionEnabled ?? false,
        notes: comp.notes ?? null,
      },
      update: {
        modelType: comp.modelType,
        effectiveStartDate: startDate,
        effectiveEndDate: endDate,
        baseHourlyRateCents: comp.baseHourlyRateCents ?? null,
        baseCommissionPct: comp.baseCommissionPct ?? null,
        perServiceCommissionOverrides: comp.perServiceCommissionOverrides ?? undefined,
        tieredCommissionConfig: comp.tieredCommissionConfig ?? undefined,
        retailCommissionPct: comp.retailCommissionPct ?? null,
        boothRentCents: comp.boothRentCents ?? null,
        boothRentFrequency: comp.boothRentFrequency ?? null,
        overtimeMultiplier: comp.overtimeMultiplier ?? 1.5,
        overtimeThresholdHours: comp.overtimeThresholdHours ?? 40,
        includeTipsInCommission: comp.includeTipsInCommission ?? false,
        productDeductionEnabled: comp.productDeductionEnabled ?? false,
        notes: comp.notes ?? null,
      },
    });
  }

  return {
    compensationCount: args.input.compensations.length,
    organizationId: args.input.organizationId,
  };
}
