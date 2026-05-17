"use client";

import type { ReactNode } from "react";
import type { PlanTier } from "@prisma/client";
import { usePlan } from "@/lib/plans/usePlan";

/**
 * Tier ordering for "minimum tier" checks. Higher index = higher tier.
 * Order matches the user-facing upgrade path: FREE → PLUS → PREMIUM → ENTERPRISE.
 */
const TIER_ORDER: PlanTier[] = ['FREE', 'PLUS', 'PREMIUM', 'ENTERPRISE'];

/**
 * Pure helper — returns true if the current tier meets or exceeds the minimum.
 * Extracted for unit testing without rendering React.
 */
export function tierMeetsMinimum(current: PlanTier, minimum: PlanTier): boolean {
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(minimum);
}

/**
 * <PlanGate>
 *
 * Shows children only if the org's plan tier meets or exceeds the required minimum.
 * Mirrors the <PermissionGate> pattern from P0.A.10.
 *
 * Usage:
 *   <PlanGate minTier="PLUS">
 *     <MultiLocationDashboard />
 *   </PlanGate>
 *
 *   <PlanGate minTier="PREMIUM" fallback={<UpgradePromo target="PREMIUM" />}>
 *     <AdvancedReports />
 *   </PlanGate>
 *
 * If no fallback is provided and the tier doesn't meet the minimum, renders nothing.
 */
export type PlanGateProps = {
  /** Minimum tier required to see children */
  minTier: PlanTier;
  /** Children rendered when the org meets the minimum tier */
  children: ReactNode;
  /** Optional fallback rendered when the org doesn't meet the minimum tier (e.g., upgrade promo) */
  fallback?: ReactNode;
};

export function PlanGate({ minTier, children, fallback = null }: PlanGateProps): ReactNode {
  const { tier } = usePlan();
  if (tierMeetsMinimum(tier, minTier)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
