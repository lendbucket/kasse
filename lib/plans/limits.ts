import type { PlanTier } from "@prisma/client";
import type { PlanTierLimits } from "./types";

/**
 * PLAN_LIMITS — canonical limit configuration per tier.
 *
 * Square-aligned pricing as of 2026-05-16:
 * - FREE: 1 location, unlimited staff, $0/mo. On-ramp for solo professionals.
 * - PLUS: unlimited locations, unlimited staff, $29/mo per location.
 * - PREMIUM: unlimited locations, unlimited staff, $69/mo per location. Adds advanced reporting + multi-location dashboards.
 * - ENTERPRISE: custom contract; no enum-encoded limits.
 *
 * Single source of truth. Limit enforcement code MUST read from this map,
 * never hard-code numbers.
 */
export const PLAN_LIMITS: Record<PlanTier, PlanTierLimits> = {
  FREE: {
    maxLocations: 1,
    maxStaff: null,
    monthlyPriceCentsPerLocation: 0,
    displayName: "Free",
    tagline: "For solo professionals getting started",
  },
  PLUS: {
    maxLocations: null,
    maxStaff: null,
    monthlyPriceCentsPerLocation: 2900,
    displayName: "Plus",
    tagline: "Everything you need to run a salon",
  },
  PREMIUM: {
    maxLocations: null,
    maxStaff: null,
    monthlyPriceCentsPerLocation: 6900,
    displayName: "Premium",
    tagline: "Advanced reporting and multi-location dashboards",
  },
  ENTERPRISE: {
    maxLocations: null,
    maxStaff: null,
    monthlyPriceCentsPerLocation: null,
    displayName: "Enterprise",
    tagline: "Custom plans for large operators",
  },
};

/**
 * Returns the limits for a tier. Always returns a value — every PlanTier
 * enum value has a corresponding entry in PLAN_LIMITS.
 */
export function getPlanLimits(tier: PlanTier): PlanTierLimits {
  return PLAN_LIMITS[tier];
}

/**
 * Calculates the monthly cost for an org given their tier and location count.
 * Returns null for ENTERPRISE (contract-based pricing).
 */
export function calculateMonthlyCost(tier: PlanTier, locationCount: number): number | null {
  const limits = PLAN_LIMITS[tier];
  if (limits.monthlyPriceCentsPerLocation === null) return null;
  if (locationCount < 0) throw new Error("locationCount cannot be negative");
  return limits.monthlyPriceCentsPerLocation * locationCount;
}

/**
 * Checks if a tier allows adding another location given the current count.
 * Returns true if the action is allowed, false if at limit (hard-block).
 *
 * Routes that create locations MUST call this and return 402 PAYMENT_REQUIRED
 * if it returns false.
 */
export function canAddLocation(tier: PlanTier, currentLocationCount: number): boolean {
  const limits = PLAN_LIMITS[tier];
  if (limits.maxLocations === null) return true;
  return currentLocationCount < limits.maxLocations;
}

/**
 * Same pattern for staff. Currently always returns true since all tiers
 * have unlimited staff at launch, but the function exists so the API
 * shape is in place for future plan changes.
 */
export function canAddStaff(tier: PlanTier, currentStaffCount: number): boolean {
  const limits = PLAN_LIMITS[tier];
  if (limits.maxStaff === null) return true;
  return currentStaffCount < limits.maxStaff;
}
