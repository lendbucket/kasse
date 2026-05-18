import type { NextOccurrenceParams } from "./types";

/**
 * Compute the next occurrence date given frequency + last date.
 * Pure function — no DB or audit dependencies.
 */
export function nextOccurrenceDate(params: NextOccurrenceParams): Date {
  const next = new Date(params.fromDate);

  switch (params.frequency) {
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14);
      break;
    case "EVERY_3_WEEKS":
      next.setDate(next.getDate() + 21);
      break;
    case "EVERY_4_WEEKS":
      next.setDate(next.getDate() + 28);
      break;
    case "EVERY_6_WEEKS":
      next.setDate(next.getDate() + 42);
      break;
    case "EVERY_8_WEEKS":
      next.setDate(next.getDate() + 56);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "CUSTOM_DAYS":
      if (!params.customIntervalDays) {
        throw new Error(
          "customIntervalDays required for CUSTOM_DAYS frequency",
        );
      }
      next.setDate(next.getDate() + params.customIntervalDays);
      break;
  }
  return next;
}
