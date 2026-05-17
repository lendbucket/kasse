"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type { PlanTier } from "@prisma/client";
import { getPlanLimits, calculateMonthlyCost } from "./limits";
import type { PlanTierLimits } from "./types";

/**
 * Effective plan context for the current session's organization.
 *
 * Reads:
 *   1. session.user.planTier — set in lib/auth.ts session callback (deferred wire-up; returns 'FREE' until activated)
 *   2. session.user.locationCount — current location count for monthly cost calculation (also deferred)
 *
 * Returns the plan tier + computed limits + current location count + computed monthly bill.
 *
 * SECURITY NOTE: planTier and locationCount on the session are READ-ONLY signals — a malicious user
 * forging them on the client would only change what THEIR OWN UI shows, not what the server enforces.
 * All limit enforcement happens server-side in api-helpers.ts. This is the same defense-in-depth
 * pattern used by usePermissions().
 */
export interface PlanContext {
  tier: PlanTier;
  limits: PlanTierLimits;
  locationCount: number;
  monthlyCostCents: number | null;
  /** True if the org is at its location limit (hard-block on adding more) */
  atLocationLimit: boolean;
  /** True if the org is at its staff limit (currently always false at launch) */
  atStaffLimit: boolean;
}

/**
 * Reads the effective plan context from the session.
 * Falls back to FREE / 0 locations if no session — same pattern as useTheme + usePermissions.
 * Same defensive useSession() destructure pattern from P0.B.8b for SSG-prerender safety.
 */
export function usePlan(): PlanContext {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;

  const userExt = session?.user as { planTier?: PlanTier; locationCount?: number } | undefined;
  const planTier = userExt?.planTier;
  const sessionLocationCount = userExt?.locationCount;

  return useMemo(() => {
    const tier: PlanTier = planTier ?? 'FREE';
    const locationCount = sessionLocationCount ?? 0;
    const limits = getPlanLimits(tier);
    const monthlyCostCents = calculateMonthlyCost(tier, locationCount);
    const atLocationLimit = limits.maxLocations !== null && locationCount >= limits.maxLocations;
    // atStaffLimit stays false at launch: all tiers have unlimited staff.
    // When a future plan adds a maxStaff limit, also wire session.user.staffCount
    // and compute this the same way atLocationLimit is computed.
    const atStaffLimit = false;

    return {
      tier,
      limits,
      locationCount,
      monthlyCostCents,
      atLocationLimit,
      atStaffLimit,
    };
  }, [planTier, sessionLocationCount]);
}

/**
 * Convenience hook returning just the tier. Use when a component only cares about which plan,
 * not the full context.
 */
export function usePlanTier(): PlanTier {
  return usePlan().tier;
}
