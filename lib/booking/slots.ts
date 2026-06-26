import type { Prisma } from "@prisma/client";
import { checkStylistAvailability } from "@/lib/booking/availability";
import { resolvePriceForBooking } from "@/lib/compensation/resolve";

type PrismaTx = Prisma.TransactionClient;

const TZ = "America/Chicago";

export interface DaySlotsInput {
  organizationId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  /** YYYY-MM-DD, Chicago-local calendar date */
  date: string;
  /** Slot step in minutes (default 15) */
  stepMinutes?: number;
}

export interface DaySlotsResult {
  /** ISO start times in UTC */
  slots: string[];
  serviceDurationMinutes: number;
}

/**
 * Generates open appointment-start times for a stylist+service+date by asking
 * the authoritative availability engine. Reuses the engine; duplicates NO
 * booking logic.
 *
 * ALGORITHM:
 * 1. Resolve duration via resolvePriceForBooking.
 * 2. Walk the Chicago-local date from 08:00 to 20:00 in stepMinutes increments.
 *    For each candidate, convert to UTC and compute candidateEnd.
 * 3. Call checkStylistAvailability for each candidate. If ok, include the slot.
 * 4. Return the list of open slots + service duration.
 *
 * PERFORMANCE NOTE:
 * This calls the engine once per candidate (~48 calls/day at 15-min step).
 * Correct and drift-free but O(candidates) queries. TODO: when appointment
 * volume grows, optimize to fetch the day's appointments + schedule once and
 * compute overlaps in memory — but keep the write path on the engine +
 * exclusion constraint as the source of truth. The slot list is ADVISORY
 * (what to show); the booking write is AUTHORITATIVE (what's allowed).
 */
export async function generateDaySlots(
  tx: PrismaTx,
  input: DaySlotsInput,
): Promise<DaySlotsResult> {
  const {
    organizationId,
    locationId,
    staffId,
    serviceId,
    date,
    stepMinutes = 15,
  } = input;

  // 1. Resolve duration from the compensation engine
  const { durationMinutes } = await resolvePriceForBooking(tx, {
    staffId,
    serviceId,
    organizationId,
  });

  // 2. Build candidate window: 08:00–20:00 Chicago time, stepping by stepMinutes
  //    Convert each Chicago-local time to UTC using the same Intl approach the
  //    engine uses (via lib/chicago-time.ts pattern).
  const [y, m, d] = date.split("-").map(Number);

  // Compute Chicago→UTC offset for the target date (use noon to avoid DST edge)
  const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const offsetMinutes = chicagoOffsetMinutes(noonUTC);

  const slots: string[] = [];
  const startHour = 8;
  const endHour = 20;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      // Chicago local -> UTC
      const candidateUTC = new Date(
        Date.UTC(y, m - 1, d, hour, minute, 0) - offsetMinutes * 60_000,
      );
      const candidateEnd = new Date(
        candidateUTC.getTime() + durationMinutes * 60_000,
      );

      // 3. Ask the authoritative engine
      const result = await checkStylistAvailability(tx, {
        staffId,
        locationId,
        organizationId,
        startTime: candidateUTC,
        endTime: candidateEnd,
        serviceId,
      });

      if (result.ok) {
        slots.push(candidateUTC.toISOString());
      }
    }
  }

  return { slots, serviceDurationMinutes: durationMinutes };
}

/**
 * Compute the offset in minutes from Chicago local time to UTC for a given
 * instant. Positive means Chicago is behind UTC (e.g., +300 for CDT (UTC−5), +360 for CST (UTC−6)).
 * Same approach as lib/chicago-time.ts.
 */
function chicagoOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60_000;
}
