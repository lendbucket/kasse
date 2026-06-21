/**
 * lib/compensation/resolve.ts — Pure pricing + commission resolution engine.
 *
 * ALL MONEY IS INTEGER CENTS. Service.price (Float, dollars in DB) must be
 * converted to cents at the boundary: Math.round(price * 100).
 * ALL RATES are percent as a number (40 means 40%). Apply as:
 *   Math.round(amountCents * ratePct / 100)
 *
 * resolveCommission is tip-agnostic — callers decide whether tips are included
 * in saleAmountCents based on comp.includeTipsInCommission.
 */

import { Prisma } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PerServiceOverride =
  | { type: "percent"; value: number } // value = percent, 50 = 50%
  | { type: "flat"; valueCents: number }; // flat commission in cents

export interface TierBand {
  thresholdCents: number;
  ratePct: number;
}

export interface TieredConfig {
  mode: "marginal" | "whole";
  bands: TierBand[];
}

export type CommissionSource =
  | "per_service_override"
  | "tier"
  | "base_pct"
  | "staff_default";

export interface PriceResolution {
  priceCents: number;
  durationMinutes: number;
  source: "stylist_override" | "service_base";
}

export interface CommissionResolution {
  commissionCents: number;
  ratePctApplied: number | null; // null when a flat per-service override was used
  source: CommissionSource;
  explanation: string;
}

// ─── Internal validators ─────────────────────────────────────────────────────

function isFiniteNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && Number.isInteger(n);
}

/**
 * Validates that x is a Record<serviceId, PerServiceOverride>.
 * Returns the map if valid, null otherwise.
 */
function parsePerServiceOverrides(
  x: unknown,
): Record<string, PerServiceOverride> | null {
  if (x == null || typeof x !== "object" || Array.isArray(x)) return null;
  const obj = x as Record<string, unknown>;
  const result: Record<string, PerServiceOverride> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val == null || typeof val !== "object" || Array.isArray(val)) continue;
    const entry = val as Record<string, unknown>;
    if (entry.type === "percent" && typeof entry.value === "number" && Number.isFinite(entry.value)) {
      result[key] = { type: "percent", value: entry.value };
    } else if (entry.type === "flat" && typeof entry.valueCents === "number" && Number.isFinite(entry.valueCents)) {
      result[key] = { type: "flat", valueCents: entry.valueCents };
    }
    // Invalid entries are silently skipped — only their serviceId is ignored
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Validates TieredConfig from raw jsonb. Returns null if malformed.
 */
function parseTieredConfig(x: unknown): TieredConfig | null {
  if (x == null || typeof x !== "object" || Array.isArray(x)) return null;
  const obj = x as Record<string, unknown>;
  if (obj.mode !== "marginal" && obj.mode !== "whole") return null;
  if (!Array.isArray(obj.bands) || obj.bands.length === 0) return null;
  const bands: TierBand[] = [];
  for (const b of obj.bands) {
    if (b == null || typeof b !== "object" || Array.isArray(b)) return null;
    const band = b as Record<string, unknown>;
    if (
      typeof band.thresholdCents !== "number" ||
      !Number.isFinite(band.thresholdCents) ||
      band.thresholdCents < 0 ||
      typeof band.ratePct !== "number" ||
      !Number.isFinite(band.ratePct)
    ) {
      return null; // entire config is invalid if any band is bad
    }
    bands.push({ thresholdCents: band.thresholdCents, ratePct: band.ratePct });
  }
  return { mode: obj.mode, bands };
}

// ─── resolveServicePrice (PURE — no DB) ─────────────────────────────────────

export function resolveServicePrice(args: {
  serviceBasePriceCents: number;
  serviceBaseDurationMinutes: number;
  override?: { priceCents: number | null; durationMinutes: number | null } | null;
}): PriceResolution {
  const { serviceBasePriceCents, serviceBaseDurationMinutes, override } = args;

  if (!isFiniteNonNegativeInt(serviceBasePriceCents)) {
    throw new Error(
      `resolveServicePrice: serviceBasePriceCents must be a finite non-negative integer, got ${serviceBasePriceCents}`,
    );
  }
  if (!isFiniteNonNegativeInt(serviceBaseDurationMinutes)) {
    throw new Error(
      `resolveServicePrice: serviceBaseDurationMinutes must be a finite non-negative integer, got ${serviceBaseDurationMinutes}`,
    );
  }

  // Coerce override values to safe integers; treat invalid overrides as absent
  const overridePriceSafe =
    override?.priceCents != null && Number.isFinite(override.priceCents) && override.priceCents >= 0
      ? Math.round(override.priceCents)
      : null;
  const overrideDurationSafe =
    override?.durationMinutes != null && Number.isFinite(override.durationMinutes) && override.durationMinutes >= 0
      ? Math.round(override.durationMinutes)
      : null;

  const priceCents = overridePriceSafe ?? serviceBasePriceCents;
  const durationMinutes = overrideDurationSafe ?? serviceBaseDurationMinutes;
  const source: PriceResolution["source"] =
    overridePriceSafe != null ? "stylist_override" : "service_base";

  return { priceCents, durationMinutes, source };
}

// ─── resolveCommission (PURE — no DB) ────────────────────────────────────────
//
// Worked examples (documented for audit):
//
// Per-service percent: $100 sale (10000c), 50% → round(10000*50/100) = 5000c
// Per-service flat: $100 sale, flat $25 (2500c) → 2500c, ratePctApplied = null
//
// Tier whole: bands [{0,35},{200000,45}], periodRevenue $2500 (250000c)
//   → highest reached band = 200000c threshold (250000>=200000), rate=45%
//   → commission = round(saleAmountCents * 45/100)
//
// Tier marginal: bands [{0,35},{200000,45}], periodRevenue $1800 (180000c),
//   sale $400 (40000c). Sale spans 180000→220000.
//   Portion in band-0 (0→200000): from 180000 to 200000 = 20000c at 35%
//     → round(20000*35/100) = 7000c
//   Portion in band-1 (200000+): from 200000 to 220000 = 20000c at 45%
//     → round(20000*45/100) = 9000c
//   Total = 16000c. Blended rate = 16000/40000*100 = 40.00%.
//
// Tier rate DECREASES: bands [{0,45},{200000,35}] → engine honors the decrease.
//   No "increase only" assumption; the owner configured it intentionally.
//
// Malformed tieredConfig (bands not array, NaN in ratePct, etc.):
//   → parseTieredConfig returns null → falls through to base_pct/staff_default.
//   Never produces NaN or 0 from bad config.
//
// No comp row: → staff_default rate (Staff.commissionRate, typically 40%).

export function resolveCommission(args: {
  saleAmountCents: number;
  serviceId: string;
  comp: {
    baseCommissionPct: number | null;
    perServiceCommissionOverrides: unknown;
    tieredCommissionConfig: unknown;
  } | null;
  periodRevenueCents: number;
  staffDefaultRatePct: number;
}): CommissionResolution {
  const { saleAmountCents, serviceId, comp, staffDefaultRatePct } = args;

  if (typeof saleAmountCents !== "number" || !Number.isFinite(saleAmountCents) || saleAmountCents < 0) {
    throw new Error(
      `resolveCommission: saleAmountCents must be a finite non-negative number, got ${saleAmountCents}`,
    );
  }

  // Degrade invalid/absent periodRevenueCents to 0 (start-of-period) rather than
  // throwing — callers may not always have period data, and the "0 if unknown"
  // contract is documented in the function signature.
  const periodRevenueCents =
    Number.isFinite(args.periodRevenueCents) && args.periodRevenueCents >= 0
      ? args.periodRevenueCents
      : 0;

  // 1. Per-service override
  if (comp) {
    const overrides = parsePerServiceOverrides(comp.perServiceCommissionOverrides);
    if (overrides && overrides[serviceId]) {
      const entry = overrides[serviceId];
      if (entry.type === "percent") {
        const commissionCents = Math.max(0, Math.round(saleAmountCents * entry.value / 100));
        return {
          commissionCents,
          ratePctApplied: entry.value,
          source: "per_service_override",
          explanation: `Per-service ${entry.value}%`,
        };
      } else {
        // flat
        const commissionCents = Math.max(0, entry.valueCents);
        return {
          commissionCents,
          ratePctApplied: null,
          source: "per_service_override",
          explanation: `Per-service flat $${(commissionCents / 100).toFixed(2)}`,
        };
      }
    }
  }

  // 2. Tiered
  if (comp) {
    const tiered = parseTieredConfig(comp.tieredCommissionConfig);
    if (tiered) {
      // Sort bands by thresholdCents ascending for evaluation
      const bands = [...tiered.bands].sort((a, b) => a.thresholdCents - b.thresholdCents);

      if (tiered.mode === "whole") {
        // Find the highest band whose threshold <= periodRevenueCents
        let applicableBand: TierBand | null = null;
        for (const band of bands) {
          if (band.thresholdCents <= periodRevenueCents) {
            applicableBand = band;
          }
        }
        // If no band has threshold <= periodRevenueCents (e.g. all thresholds > 0
        // and revenue is 0), fall through — a tier config that doesn't cover $0
        // shouldn't zero someone out.
        if (applicableBand) {
          const commissionCents = Math.max(0, Math.round(saleAmountCents * applicableBand.ratePct / 100));
          return {
            commissionCents,
            ratePctApplied: applicableBand.ratePct,
            source: "tier",
            explanation: `Tier (whole): ${applicableBand.ratePct}% (band at $${(applicableBand.thresholdCents / 100).toFixed(2)}+)`,
          };
        }
      } else {
        // mode === 'marginal' (bracket-style)
        // This sale's dollars sit at the TOP of the period revenue.
        // The sale covers periodRevenueCents → periodRevenueCents + saleAmountCents.
        // Split across bands by their thresholds.

        // Check at least one band covers the starting point (after asc sort)
        if (bands[0].thresholdCents <= periodRevenueCents) {
          const saleStart = periodRevenueCents;
          const saleEnd = periodRevenueCents + saleAmountCents;
          let totalCommission = 0;

          for (let i = 0; i < bands.length; i++) {
            const bandStart = bands[i].thresholdCents;
            const bandEnd = i + 1 < bands.length ? bands[i + 1].thresholdCents : Infinity;
            const rate = bands[i].ratePct;

            // Overlap between [saleStart, saleEnd) and [bandStart, bandEnd)
            const overlapStart = Math.max(saleStart, bandStart);
            const overlapEnd = Math.min(saleEnd, bandEnd);
            if (overlapStart < overlapEnd) {
              const portion = overlapEnd - overlapStart;
              totalCommission += Math.round(portion * rate / 100);
            }
          }

          const commissionCents = Math.max(0, totalCommission);
          const blendedRate = saleAmountCents > 0
            ? Math.round((commissionCents / saleAmountCents) * 10000) / 100
            : 0;
          return {
            commissionCents,
            ratePctApplied: blendedRate,
            source: "tier",
            explanation: `Tier (marginal): blended ${blendedRate}% across ${bands.length} band(s)`,
          };
        }
        // else: no band covers starting revenue → fall through
      }
    }
  }

  // 3. Base percent
  if (comp?.baseCommissionPct != null && Number.isFinite(comp.baseCommissionPct)) {
    const commissionCents = Math.max(0, Math.round(saleAmountCents * comp.baseCommissionPct / 100));
    return {
      commissionCents,
      ratePctApplied: comp.baseCommissionPct,
      source: "base_pct",
      explanation: `Base commission ${comp.baseCommissionPct}%`,
    };
  }

  // 4. Staff default
  const commissionCents = Math.max(0, Math.round(saleAmountCents * staffDefaultRatePct / 100));
  return {
    commissionCents,
    ratePctApplied: staffDefaultRatePct,
    source: "staff_default",
    explanation: `Staff default ${staffDefaultRatePct}%`,
  };
}

// ─── DB wrapper: resolvePriceForBooking ──────────────────────────────────────
// Thin IO layer — fetches Service + ServiceStaffOverride, then calls the pure fn.
// Caller must invoke inside withTenantScope; tx provides RLS scoping.

type PrismaTx = Prisma.TransactionClient;

export async function resolvePriceForBooking(
  tx: PrismaTx,
  args: { staffId: string; serviceId: string; organizationId: string },
): Promise<PriceResolution> {
  const { staffId, serviceId, organizationId } = args;

  const service = await tx.service.findFirst({
    where: { id: serviceId, organizationId },
    select: { price: true, duration: true },
  });

  if (!service) {
    throw new Error(`resolvePriceForBooking: service ${serviceId} not found in org ${organizationId}`);
  }

  const override = await tx.serviceStaffOverride.findUnique({
    where: { serviceId_staffId: { serviceId, staffId } },
    select: { priceCents: true, durationMinutes: true },
  });

  return resolveServicePrice({
    serviceBasePriceCents: Math.round(service.price * 100),
    serviceBaseDurationMinutes: service.duration,
    override: override ?? null,
  });
}
