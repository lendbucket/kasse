/**
 * lib/compensation/validate.ts — First-line validators for commission config.
 *
 * These mirror the engine's parseTieredConfig/parsePerServiceOverrides EXACTLY
 * (same shape acceptance) PLUS friendlier bounds (rate 0–100, distinct thresholds)
 * and return human-readable error messages. Any value these accept, the engine's
 * parsers MUST also accept.
 *
 * Contract proof (examples):
 * - {mode:"whole",bands:[{thresholdCents:0,ratePct:35},{thresholdCents:200000,ratePct:45}]} → accepted by both
 * - {mode:"marginal",bands:[{thresholdCents:0,ratePct:45},{thresholdCents:200000,ratePct:35}]} (decreasing) → accepted by both
 * - empty bands [] → rejected by both
 * - partial band {thresholdCents:0} (no ratePct) → rejected by both
 * - perService {svc1:{type:"flat",valueCents:2500}} → accepted by both
 * - perService {svc1:{type:"flat",valueCents:25.5}} non-int → rejected by validate (engine would accept float but we enforce int for money)
 */

import type { TieredConfig, TierBand, PerServiceOverride } from "./resolve";

export type { TieredConfig, TierBand, PerServiceOverride };

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateTieredConfigInput(raw: unknown): ValidationResult<TieredConfig> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Tiered config must be an object" };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.mode !== "marginal" && obj.mode !== "whole") {
    return { ok: false, error: 'Mode must be "marginal" or "whole"' };
  }

  if (!Array.isArray(obj.bands) || obj.bands.length === 0) {
    return { ok: false, error: "At least one band is required" };
  }

  const bands: TierBand[] = [];
  const seenThresholds = new Set<number>();

  for (let i = 0; i < obj.bands.length; i++) {
    const b = obj.bands[i];
    if (b == null || typeof b !== "object" || Array.isArray(b)) {
      return { ok: false, error: `Band ${i + 1} is malformed` };
    }
    const band = b as Record<string, unknown>;

    if (typeof band.thresholdCents !== "number" || !Number.isFinite(band.thresholdCents) || band.thresholdCents < 0) {
      return { ok: false, error: `Band ${i + 1}: threshold must be a non-negative number` };
    }
    if (!Number.isInteger(band.thresholdCents)) {
      return { ok: false, error: `Band ${i + 1}: threshold must be an integer (cents)` };
    }
    if (typeof band.ratePct !== "number" || !Number.isFinite(band.ratePct)) {
      return { ok: false, error: `Band ${i + 1}: rate must be a number` };
    }
    if (band.ratePct < 0 || band.ratePct > 100) {
      return { ok: false, error: `Band ${i + 1}: rate must be between 0 and 100` };
    }
    if (seenThresholds.has(band.thresholdCents)) {
      return { ok: false, error: `Band ${i + 1}: duplicate threshold $${(band.thresholdCents / 100).toFixed(2)}` };
    }
    seenThresholds.add(band.thresholdCents);
    bands.push({ thresholdCents: band.thresholdCents, ratePct: band.ratePct });
  }

  return { ok: true, value: { mode: obj.mode, bands } };
}

export function validatePerServiceOverridesInput(
  raw: unknown,
  allowedServiceIds: Set<string>,
): ValidationResult<Record<string, PerServiceOverride>> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Per-service overrides must be an object" };
  }
  const obj = raw as Record<string, unknown>;
  const result: Record<string, PerServiceOverride> = {};

  for (const [serviceId, val] of Object.entries(obj)) {
    if (!allowedServiceIds.has(serviceId)) {
      return { ok: false, error: `Service ${serviceId} is not in the stylist's eligibility set` };
    }
    if (val == null || typeof val !== "object" || Array.isArray(val)) {
      return { ok: false, error: `Override for service ${serviceId} is malformed` };
    }
    const entry = val as Record<string, unknown>;

    if (entry.type === "percent") {
      if (typeof entry.value !== "number" || !Number.isFinite(entry.value)) {
        return { ok: false, error: `Service ${serviceId}: percent value must be a number` };
      }
      if (entry.value < 0 || entry.value > 100) {
        return { ok: false, error: `Service ${serviceId}: percent must be between 0 and 100` };
      }
      result[serviceId] = { type: "percent", value: entry.value };
    } else if (entry.type === "flat") {
      if (typeof entry.valueCents !== "number" || !Number.isFinite(entry.valueCents)) {
        return { ok: false, error: `Service ${serviceId}: flat valueCents must be a number` };
      }
      if (!Number.isInteger(entry.valueCents) || entry.valueCents < 0) {
        return { ok: false, error: `Service ${serviceId}: flat valueCents must be a non-negative integer` };
      }
      result[serviceId] = { type: "flat", valueCents: entry.valueCents };
    } else {
      return { ok: false, error: `Service ${serviceId}: type must be "percent" or "flat"` };
    }
  }

  return { ok: true, value: result };
}
