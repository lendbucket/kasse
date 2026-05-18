import { Prisma } from '@prisma/client';
import type { FlagEvaluationContext, FlagEvaluationResult } from './types';
import { computeFlagBucket } from './hash';

/**
 * Evaluate a single feature flag for the given context.
 * Delegates to evaluateFlags to avoid logic duplication.
 *
 * Priority:
 *   1. Flag does not exist -> MISSING (defaultValue false)
 *   2. Flag is inactive -> INACTIVE (returns defaultValue)
 *   3. Per-org override -> OVERRIDE
 *   4. Rollout percentage hash -> ROLLOUT
 *   5. Default value -> DEFAULT
 */
export async function evaluateFlag(
  tx: Prisma.TransactionClient,
  args: {
    key: string;
    context: FlagEvaluationContext;
  },
): Promise<FlagEvaluationResult> {
  const results = await evaluateFlags(tx, {
    keys: [args.key],
    context: args.context,
  });
  return results[args.key];
}

/**
 * Evaluate multiple flags in a single DB query.
 * Returns a Record<flagKey, FlagEvaluationResult>.
 */
export async function evaluateFlags(
  tx: Prisma.TransactionClient,
  args: {
    keys: string[];
    context: FlagEvaluationContext;
  },
): Promise<Record<string, FlagEvaluationResult>> {
  if (args.keys.length === 0) return {};

  const flags = await tx.featureFlag.findMany({
    where: { key: { in: args.keys } },
  });
  const flagMap = new Map(flags.map((f) => [f.key, f]));

  const results: Record<string, FlagEvaluationResult> = {};
  for (const key of args.keys) {
    const flag = flagMap.get(key);
    if (!flag) {
      results[key] = { key, enabled: false, source: 'MISSING' };
      continue;
    }
    if (!flag.isActive) {
      results[key] = { key, enabled: flag.defaultValue, source: 'INACTIVE' };
      continue;
    }
    if (args.context.organizationId) {
      const overrides = (flag.overrides as Record<string, boolean>) ?? {};
      if (Object.prototype.hasOwnProperty.call(overrides, args.context.organizationId)) {
        results[key] = {
          key,
          enabled: overrides[args.context.organizationId],
          source: 'OVERRIDE',
        };
        continue;
      }
    }
    if (flag.rolloutPct > 0 && args.context.organizationId) {
      const bucket = computeFlagBucket(key, args.context.organizationId);
      if (bucket < flag.rolloutPct) {
        results[key] = { key, enabled: true, source: 'ROLLOUT' };
        continue;
      }
    }
    results[key] = { key, enabled: flag.defaultValue, source: 'DEFAULT' };
  }

  return results;
}
