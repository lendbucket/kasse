import type { VerticalConfig, VerticalId } from "./types";
import { salonConfig } from "./configs/salon";
import { barbershopConfig } from "./configs/barbershop";
import { nailSalonConfig } from "./configs/nail_salon";
import { medSpaConfig } from "./configs/med_spa";
import { generalConfig } from "./configs/general";

/**
 * Central registry of VerticalConfig instances. Maps every VerticalId
 * to its config. Verticals without a shipped config (per launch scope —
 * memory item #30) map to `generalConfig` as a sane fallback.
 *
 * When a new vertical config ships:
 *   1. Add the config file at lib/verticals/configs/<id>.ts
 *   2. Import it here and add a registry entry
 *   3. No migration needed — VerticalId enum is already populated for all 36
 *
 * The registry is data, not code — pure mapping, no logic.
 */
const REGISTRY: Record<VerticalId, VerticalConfig> = {
  // Launched verticals (full or stub content)
  salon: salonConfig,
  barbershop: barbershopConfig,
  nail_salon: nailSalonConfig,
  med_spa: medSpaConfig,

  // Fallback for verticals not yet implemented
  general: generalConfig,

  // Beauty-adjacent — defer content month 2-3, use general fallback for now
  restaurant: generalConfig,
  bar: generalConfig,
  gym: generalConfig,
  yoga_studio: generalConfig,
  pilates_studio: generalConfig,
  massage: generalConfig,
  auto_detailing: generalConfig,
  auto_repair: generalConfig,
  pet_grooming: generalConfig,
  veterinary: generalConfig,
  tattoo: generalConfig,
  retail: generalConfig,
  food_truck: generalConfig,
  cafe: generalConfig,
  bakery: generalConfig,
  catering: generalConfig,
  cleaning: generalConfig,
  photography: generalConfig,
  tutoring: generalConfig,
  childcare: generalConfig,
  coworking: generalConfig,
  sports_training: generalConfig,
  beauty_school: generalConfig,
  brow_studio: generalConfig,
  lash_studio: generalConfig,
  tanning_studio: generalConfig,
  dance_studio: generalConfig,
  martial_arts: generalConfig,
  crossfit: generalConfig,
  chiropractic: generalConfig,
  physical_therapy: generalConfig,
};

/**
 * Returns the base VerticalConfig for the given vertical ID. Falls back
 * to generalConfig for unknown IDs (defensive — should never happen since
 * VerticalId is a TypeScript union, but covers runtime edge cases like
 * stale session data or hand-crafted DB rows).
 *
 * This returns the BASE config without any org-level overrides. To apply
 * an org's verticalConfigOverride, use useVerticalConfig() in client code
 * or mergeVerticalConfig() in server code.
 */
export function getVerticalConfig(id: VerticalId): VerticalConfig {
  return REGISTRY[id] ?? generalConfig;
}

/**
 * Returns all verticals that ship with FULL launch content (not stubs).
 * Used by signup wizards and admin UIs to show "ready to use" verticals
 * separately from "available but stub" verticals.
 */
export function getLaunchVerticals(): VerticalConfig[] {
  return [salonConfig];
}

/**
 * Returns all verticals that have ANY config (stub or full). Excludes
 * general from the list since it's the fallback, not a real vertical.
 */
export function getAvailableVerticals(): VerticalConfig[] {
  return [salonConfig, barbershopConfig, nailSalonConfig, medSpaConfig];
}

/**
 * Deep-merges an org's verticalConfigOverride (Partial<VerticalConfig>)
 * onto the base config. The override can only override TOP-LEVEL fields
 * for now — nested arrays (navigation, services) are replaced wholesale,
 * not merged. This is intentional: nav structure is product-defined.
 *
 * Common override use cases:
 *   - Override terms: { terms: { client: 'Member' } } for a specific org
 *   - Disable a feature: { features: { walkInQueue: false } }
 *   - Add custom default services
 *
 * If override is null or undefined, returns the base config unchanged.
 */
export function mergeVerticalConfig(
  base: VerticalConfig,
  override: Partial<VerticalConfig> | null | undefined,
): VerticalConfig {
  if (!override) return base;
  return {
    ...base,
    ...override,
    terms: { ...base.terms, ...(override.terms ?? {}) },
    features: { ...base.features, ...(override.features ?? {}) },
    compliance: { ...base.compliance, ...(override.compliance ?? {}) },
  };
}

export { generalConfig };
