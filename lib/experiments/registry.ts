/**
 * P1.A.12: A/B experiment registry.
 *
 * Experiments are code-defined. To add a new experiment:
 * 1. Add an entry to the EXPERIMENTS array below
 * 2. Reference the experiment via getVariant("experiment-key") in server code
 * 3. Deploy
 *
 * No admin UI yet (deferred to P3+). No DB writes per assignment — variant
 * resolution is hash-based deterministic. See lib/experiments/resolve.ts.
 *
 * Trafficking: variant weights sum to 1.0. The "control" variant is by
 * convention the baseline. Add new variants by appending; never reorder
 * existing variants (would shift hash buckets and remix already-bucketed
 * visitors).
 */

export interface ExperimentVariant {
  key: string
  weight: number  // 0.0 to 1.0; weights across all variants must sum to 1.0
}

export interface ExperimentDefinition {
  key: string
  description: string
  variants: ExperimentVariant[]
  enabled: boolean  // when false, getVariant always returns the first variant (control)
}

export const EXPERIMENTS: ExperimentDefinition[] = [
  // No experiments defined yet — P1.A.12 ships foundation only.
  // Example shape (commented):
  // {
  //   key: "signup-button-copy",
  //   description: "Test 'Start free trial' vs 'Get started' on the signup form",
  //   enabled: true,
  //   variants: [
  //     { key: "control", weight: 0.5 },   // "Start free trial"
  //     { key: "treatment", weight: 0.5 }, // "Get started"
  //   ],
  // },
]

export function getExperiment(key: string): ExperimentDefinition | null {
  return EXPERIMENTS.find((e) => e.key === key) ?? null
}
