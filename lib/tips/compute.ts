import type { TipSplitMethod, AppointmentItemForSplit, TipDistributionResult } from "./types";

/**
 * Pure computation: distribute a tip across staff based on the split method.
 * No DB calls — deterministic and testable.
 */
export function computeSplit(
  method: TipSplitMethod,
  tipCents: number,
  items: AppointmentItemForSplit[],
): TipDistributionResult[] {
  if (items.length === 0) return [];
  if (tipCents <= 0) return items.map((i) => ({ staffId: i.staffId, amountCents: 0, splitWeight: 0 }));

  switch (method) {
    case "PRIMARY_ONLY":
      return splitPrimaryOnly(tipCents, items);
    case "TIME_BASED":
      return splitByWeight(tipCents, items, (i) => i.durationMinutes);
    case "REVENUE_RATIO":
      return splitByWeight(tipCents, items, (i) => i.revenueCents);
    case "EXPLICIT_PERCENT":
      // EXPLICIT_PERCENT requires a config map (roleType -> percentage) that this
      // pure function doesn't accept. Callers using EXPLICIT_PERCENT must pass the
      // config via distributeTipForAppointment (which can load TipSplit.explicitPercentsConfig).
      // This pure function intentionally throws rather than silently fall back, which
      // would misdirect tip money without the caller knowing.
      throw new Error(
        "EXPLICIT_PERCENT split method requires explicit config. " +
        "Use distributeTipForAppointment which loads org config, or pass a different method.",
      );
    default:
      return splitPrimaryOnly(tipCents, items);
  }
}

function splitPrimaryOnly(
  tipCents: number,
  items: AppointmentItemForSplit[],
): TipDistributionResult[] {
  const primary = items.find((i) => i.isPrimary) ?? items[0];
  return items.map((i) => ({
    staffId: i.staffId,
    amountCents: i.staffId === primary.staffId ? tipCents : 0,
    splitWeight: i.staffId === primary.staffId ? 1 : 0,
  }));
}

function splitByWeight(
  tipCents: number,
  items: AppointmentItemForSplit[],
  weightFn: (i: AppointmentItemForSplit) => number,
): TipDistributionResult[] {
  const totalWeight = items.reduce((sum, i) => sum + weightFn(i), 0);

  // If total weight is 0 (e.g., all durations are 0), split evenly.
  if (totalWeight === 0) {
    const base = Math.floor(tipCents / items.length);
    const remainder = tipCents - base * items.length;
    return items.map((i, idx) => ({
      staffId: i.staffId,
      amountCents: base + (idx < remainder ? 1 : 0),
      splitWeight: 1 / items.length,
    }));
  }

  // Proportional split with remainder allocated to highest-weight recipient.
  const results: TipDistributionResult[] = items.map((i) => {
    const weight = weightFn(i) / totalWeight;
    return {
      staffId: i.staffId,
      amountCents: Math.floor(tipCents * weight),
      splitWeight: weight,
    };
  });

  const allocated = results.reduce((s, r) => s + r.amountCents, 0);
  const remainder = tipCents - allocated;
  if (remainder > 0) {
    // Allocate rounding remainder to the highest-weight recipient.
    // This is more defensible than always-first-recipient — the staff member who
    // contributed the most should receive the rounding adjustment.
    let highestIndex = 0;
    for (let i = 1; i < results.length; i++) {
      if (results[i].splitWeight > results[highestIndex].splitWeight) {
        highestIndex = i;
      }
    }
    results[highestIndex].amountCents += remainder;
  }

  return results;
}
