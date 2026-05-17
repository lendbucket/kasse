import type { PlanTier } from "@prisma/client";

/**
 * Per-tier limits for a Kasse merchant org.
 *
 * Billing: per-location, NOT per-org. Multiply monthlyPriceCentsPerLocation
 * by the org's location count to get monthly bill.
 *
 * Locations limit: enforced at hard-block. Trying to add a 2nd location on
 * FREE returns 402 PAYMENT_REQUIRED.
 *
 * Staff limit: null = unlimited (matches Square's actual policy).
 *
 * Features-by-tier are handled separately via the addon system. The base
 * tier determines limits; addons add features without raising limits.
 */
export interface PlanTierLimits {
  /** Max locations the org can create. null = unlimited (ENTERPRISE) */
  maxLocations: number | null;
  /** Max staff members across all locations. null = unlimited */
  maxStaff: number | null;
  /** Monthly cost in cents PER LOCATION. null for ENTERPRISE (custom contract) */
  monthlyPriceCentsPerLocation: number | null;
  /** Display label for upgrade UIs */
  displayName: string;
  /** Marketing tagline shown in upgrade dialogs */
  tagline: string;
}

/**
 * Calculated monthly cost for an org given their tier + location count.
 * Returns null for ENTERPRISE since pricing is contract-based.
 */
export interface OrgMonthlyCost {
  tier: PlanTier;
  locationCount: number;
  monthlyTotalCents: number | null;
  pricePerLocationCents: number | null;
}
