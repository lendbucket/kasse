import type { PlanTier, Prisma, PrismaClient } from "@prisma/client";
import { canAddLocation, canAddStaff, getPlanLimits } from "./limits";

/**
 * Either the full PrismaClient OR a Prisma transaction client returned by
 * withTenantScope's callback. Both have the same model methods we need.
 */
type PrismaScoped = PrismaClient | Prisma.TransactionClient;

/**
 * Server-side plan context for a given organization. Queries the DB
 * directly — not session-derived — so this is authoritative.
 *
 * Returns null if the org doesn't exist (caller's tenant scope should
 * already prevent this, but defense-in-depth).
 */
export interface ServerPlanContext {
  organizationId: string;
  tier: PlanTier;
  locationCount: number;
  enabledAddons: string[];
}

/**
 * Loads the authoritative plan context for an org.
 *
 * MUST be called inside withTenantScope. The `tx` parameter is the scoped
 * Prisma transaction client returned by withTenantScope's callback — passing
 * the unscoped prisma client would bypass RLS.
 *
 * Returns null if the org doesn't exist (defense-in-depth; caller's tenant
 * scope should already prevent this, but guard against it).
 */
export async function getServerPlanContext(
  tx: PrismaScoped,
  organizationId: string,
): Promise<ServerPlanContext | null> {
  const [org, locationCount] = await Promise.all([
    tx.organization.findUnique({
      where: { id: organizationId },
      select: { planTier: true, enabledAddons: true },
    }),
    tx.location.count({
      where: { organizationId },
    }),
  ]);

  if (!org) return null;

  return {
    organizationId,
    tier: org.planTier,
    locationCount,
    enabledAddons: org.enabledAddons,
  };
}

/**
 * PlanLimitError — thrown when an action exceeds the org's plan limits.
 * Caught by route handlers and translated to HTTP 402 PAYMENT_REQUIRED.
 *
 * Includes structured fields so the upgrade dialog can render the right
 * recommended tier ("PLUS" if currently on FREE, etc).
 */
export class PlanLimitError extends Error {
  constructor(
    public readonly code: 'LOCATION_LIMIT' | 'STAFF_LIMIT',
    public readonly currentTier: PlanTier,
    public readonly currentCount: number,
    public readonly limit: number,
    public readonly recommendedTier: PlanTier,
  ) {
    super(`Plan limit reached: ${code} (${currentCount}/${limit} on ${currentTier})`);
    this.name = 'PlanLimitError';
  }
}

/**
 * Asserts the org can add another location. Throws PlanLimitError if not.
 *
 * Usage in a route handler:
 *   const ctx = await requireTenantContext(req);
 *   const plan = await getServerPlanContext(ctx.organizationId);
 *   if (!plan) return new Response('not found', { status: 404 });
 *   assertCanAddLocation(plan);  // throws PlanLimitError if at limit
 *   const newLocation = await prisma.location.create({ ... });
 */
export function assertCanAddLocation(plan: ServerPlanContext): void {
  if (canAddLocation(plan.tier, plan.locationCount)) return;
  const limits = getPlanLimits(plan.tier);
  throw new PlanLimitError(
    'LOCATION_LIMIT',
    plan.tier,
    plan.locationCount,
    limits.maxLocations ?? 0,
    recommendedUpgrade(plan.tier),
  );
}

/**
 * Asserts the org can add another staff member. Throws PlanLimitError if not.
 * Currently always passes (all tiers unlimited staff at launch), but the
 * function is in place for future plan changes.
 */
export function assertCanAddStaff(
  plan: ServerPlanContext,
  currentStaffCount: number,
): void {
  if (canAddStaff(plan.tier, currentStaffCount)) return;
  const limits = getPlanLimits(plan.tier);
  throw new PlanLimitError(
    'STAFF_LIMIT',
    plan.tier,
    currentStaffCount,
    limits.maxStaff ?? 0,
    recommendedUpgrade(plan.tier),
  );
}

/**
 * Returns the next-tier-up recommendation for an upgrade prompt.
 * FREE → PLUS, PLUS → PREMIUM, PREMIUM → ENTERPRISE, ENTERPRISE → ENTERPRISE (no higher).
 */
export function recommendedUpgrade(current: PlanTier): PlanTier {
  switch (current) {
    case 'FREE': return 'PLUS';
    case 'PLUS': return 'PREMIUM';
    case 'PREMIUM': return 'ENTERPRISE';
    case 'ENTERPRISE': return 'ENTERPRISE';
  }
}

/**
 * Standard HTTP response builder for PlanLimitError.
 * Returns null if the error is not a PlanLimitError.
 *
 * Usage in a route handler:
 *   try { assertCanAddLocation(plan); ... }
 *   catch (e) {
 *     const r = planLimitErrorResponse(e); if (r) return r;
 *     throw e;
 *   }
 *
 * Returns 402 PAYMENT_REQUIRED with structured body so the client
 * upgrade dialog can render correctly.
 */
export function planLimitErrorResponse(e: unknown): Response | null {
  if (!(e instanceof PlanLimitError)) return null;
  return new Response(JSON.stringify({
    error: e.message,
    code: e.code,
    currentTier: e.currentTier,
    currentCount: e.currentCount,
    limit: e.limit,
    recommendedTier: e.recommendedTier,
  }), {
    status: 402,
    headers: { "content-type": "application/json" },
  });
}
