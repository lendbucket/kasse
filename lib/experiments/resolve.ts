import { createHash } from "crypto"
import { headers } from "next/headers"
import { getExperiment } from "./registry"

/**
 * P1.A.12: Resolve which variant a visitor sees for a given experiment.
 *
 * Deterministic: hash(experimentKey + visitorId) -> bucket index. Same visitor
 * always sees same variant for the same experiment. Different experiments
 * produce independent buckets for the same visitor (salt by experimentKey).
 *
 * Returns the variant key (e.g. "control" or "treatment"). Returns the
 * control variant (first in the variants array) when:
 * - Experiment is not found
 * - Experiment is disabled
 * - visitorId is empty (defensive — middleware should always set it)
 *
 * NOT IDEMPOTENT WITH VARIANT REORDERING: if you reorder the variants array
 * for an existing experiment, every visitor's bucket changes. Never reorder;
 * only append.
 */
export function resolveVariant(
  experimentKey: string,
  visitorId: string | null | undefined,
): string {
  const experiment = getExperiment(experimentKey)
  if (!experiment) return "control"  // safe default for missing experiments
  if (!experiment.enabled) return experiment.variants[0]?.key ?? "control"
  if (!visitorId) return experiment.variants[0]?.key ?? "control"

  // Hash visitorId + experimentKey, take first 8 hex chars as integer
  const hash = createHash("sha256")
    .update(`${experimentKey}:${visitorId}`)
    .digest("hex")
    .slice(0, 8)

  const intHash = parseInt(hash, 16)
  const bucket = (intHash % 10000) / 10000  // 0.0 to 0.9999...

  // Walk variants and find the bucket that bucket falls into
  let cumulative = 0
  for (const variant of experiment.variants) {
    cumulative += variant.weight
    if (bucket < cumulative) return variant.key
  }

  // Defensive fallback: weights didn't sum to 1.0 (config error).
  // Return the last variant rather than throwing — A/B test should never
  // break the user-facing flow.
  return experiment.variants[experiment.variants.length - 1]?.key ?? "control"
}

/**
 * Server-side convenience: reads visitor ID from x-kasse-visitor-id header
 * (set by middleware) and resolves the variant. Use this from server
 * components and route handlers.
 */
export async function getVariant(experimentKey: string): Promise<string> {
  const hdrs = await headers()
  const visitorId = hdrs.get("x-kasse-visitor-id")
  return resolveVariant(experimentKey, visitorId)
}
