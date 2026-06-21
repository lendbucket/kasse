/**
 * Booking availability engine — stylist collision detection, working-hours
 * enforcement, and service-eligibility checks.
 *
 * Pure validation module: no HTTP/Next imports, no mutations. All functions
 * take a tenant-scoped transaction client + input and return typed results.
 * Designed for reuse by POST /api/appointments, public booking, and POS.
 *
 * Stylist-only collision (no chair dimension — Salon Envy books by stylist).
 *
 * Race note: running the overlap check + appointment create in ONE transaction
 * removes the gap WITHIN a single request, but at READ COMMITTED it does NOT
 * eliminate the race between two concurrent requests — both can pass the check
 * and both insert, producing a double-booking. The bulletproof fix is a Postgres
 * exclusion constraint on (staffId, tstzrange(startTime, endTime)) WHERE status
 * NOT IN (cancelled, no_show) — tracked as a follow-up (schema change, not this
 * PR). Until then, the double-booking guarantee is "very unlikely," not
 * "impossible."
 */

import type { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingConflict =
  | {
      type: 'STYLIST_DOUBLE_BOOKED';
      conflictingAppointmentId: string;
      conflictStart: string;
      conflictEnd: string;
    }
  | { type: 'STYLIST_NOT_WORKING'; reason: string }
  | { type: 'SERVICE_NOT_OFFERED_BY_STYLIST'; staffId: string; serviceId: string }
  | { type: 'INVALID_TIME_RANGE'; reason: string };

export type AvailabilityCheck =
  | { ok: true }
  | { ok: false; conflicts: BookingConflict[] };

export interface AvailabilityInput {
  staffId: string;
  /** Reserved: not currently used in checks (schedules/eligibility are staff-scoped).
   *  Kept for public-booking/POS callers and future per-location schedule support. */
  locationId: string;
  organizationId: string;
  startTime: Date;
  endTime: Date;
  serviceId?: string;
  /** When rescheduling, exclude the appointment being moved so it doesn't conflict with itself. */
  excludeAppointmentId?: string;
}

// ---------------------------------------------------------------------------
// Timezone helpers
// TODO: derive timezone from Location row instead of hardcoding America/Chicago.
// ---------------------------------------------------------------------------

const TZ = 'America/Chicago';

/** Format a Date into Chicago local parts. */
function chicagoLocalParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
} {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  );

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
    dayOfWeek: weekdayMap[parts.weekday] ?? 0,
  };
}

/** Convert HH:MM local-time string (or a Time-typed Date) to minutes-since-midnight. */
function timeToMinutes(d: Date): number {
  // Prisma Time(6) fields come back as Date objects anchored at 1970-01-01 UTC.
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Convert a Chicago-local hour:minute to minutes-since-midnight. */
function localToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/** Format YYYY-MM-DD from local parts for Prisma Date comparison. */
function localDateString(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

type PrismaTx = Prisma.TransactionClient;

/** 1. Validate time range is positive, non-zero, and same calendar day. */
function checkTimeRange(input: AvailabilityInput): BookingConflict[] {
  if (input.endTime <= input.startTime) {
    return [{
      type: 'INVALID_TIME_RANGE',
      reason: 'End time must be after start time.',
    }];
  }

  // Same-day guard: working-hours math converts to minutes-since-local-midnight.
  // An appointment crossing local midnight would wrap apptEndMin below apptStartMin
  // and corrupt the bounds check. Salons never operate across midnight, so reject
  // rather than handle multi-day. Revisit only if a 24h/overnight vertical is added.
  const startParts = chicagoLocalParts(input.startTime);
  const endParts = chicagoLocalParts(input.endTime);
  if (
    startParts.year !== endParts.year ||
    startParts.month !== endParts.month ||
    startParts.day !== endParts.day
  ) {
    return [{
      type: 'INVALID_TIME_RANGE',
      reason: 'Appointment must start and end on the same day.',
    }];
  }

  return [];
}

/** 2. Double-booking: any overlapping appointment for the same stylist? */
async function checkDoubleBooking(
  tx: PrismaTx,
  input: AvailabilityInput,
): Promise<BookingConflict[]> {
  // Half-open overlap: existing.startTime < input.endTime AND existing.endTime > input.startTime
  // Back-to-back (one ends exactly when next starts) is allowed.
  const overlapping = await tx.appointment.findMany({
    where: {
      organizationId: input.organizationId,
      staffId: input.staffId,
      softDeletedAt: null,
      status: { notIn: ['cancelled', 'no_show'] },
      ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {}),
      startTime: { lt: input.endTime },
      endTime: { gt: input.startTime },
    },
    select: { id: true, startTime: true, endTime: true },
    take: 5, // Cap results — we only need to report conflicts, not all of them
  });

  return overlapping.map((a) => ({
    type: 'STYLIST_DOUBLE_BOOKED' as const,
    conflictingAppointmentId: a.id,
    conflictStart: a.startTime.toISOString(),
    conflictEnd: a.endTime.toISOString(),
  }));
}

/** 3. Working hours: does the stylist work during this window? */
async function checkWorkingHours(
  tx: PrismaTx,
  input: AvailabilityInput,
): Promise<BookingConflict[]> {
  // Uses the start day's schedule. Appointments that span midnight (rare for
  // a salon; effectively impossible here) are validated only against the
  // start day. Revisit if 24h/overnight verticals are added.
  const startParts = chicagoLocalParts(input.startTime);
  const endParts = chicagoLocalParts(input.endTime);
  const dateStr = localDateString(startParts);
  // Prisma stores Postgres `date` columns anchored at UTC midnight, so we
  // compare against UTC-midnight of the Chicago-local calendar date. This
  // is intentional and matches Prisma's date storage — do not "fix" to
  // local midnight or the schedule/exception lookups will mismatch.
  const apptDate = new Date(dateStr + 'T00:00:00Z');

  // Check for date-specific exception first
  const exception = await tx.stylistScheduleException.findUnique({
    where: {
      staffId_date: {
        staffId: input.staffId,
        date: apptDate,
      },
    },
  });

  if (exception) {
    if (!exception.isWorking) {
      return [{
        type: 'STYLIST_NOT_WORKING',
        reason: exception.reason
          ? `Day off: ${exception.reason}`
          : 'This stylist has the day off.',
      }];
    }

    // Exception with isWorking=true + custom hours — appointment must fit within
    if (exception.startTime && exception.endTime) {
      const excStartMin = timeToMinutes(exception.startTime);
      const excEndMin = timeToMinutes(exception.endTime);
      const apptStartMin = localToMinutes(startParts.hour, startParts.minute);
      const apptEndMin = localToMinutes(endParts.hour, endParts.minute);

      if (apptStartMin < excStartMin || apptEndMin > excEndMin) {
        return [{
          type: 'STYLIST_NOT_WORKING',
          reason: "This appointment falls outside the stylist\u2019s scheduled hours for this date.",
        }];
      }
    }

    // Exception says working + no time bounds → allowed all day
    return [];
  }

  // No exception — check weekly schedule
  // First, see if ANY schedule rows exist for this stylist at all
  const anySchedule = await tx.stylistSchedule.findFirst({
    where: { staffId: input.staffId },
    select: { id: true },
  });

  if (!anySchedule) {
    // No schedule configured at all → allow (day-one behavior)
    return [];
  }

  // Schedule exists — find a matching row for this day + effective date range
  const schedules = await tx.stylistSchedule.findMany({
    where: {
      staffId: input.staffId,
      dayOfWeek: startParts.dayOfWeek,
      effectiveStartDate: { lte: apptDate },
      OR: [
        { effectiveEndDate: null },
        { effectiveEndDate: { gte: apptDate } },
      ],
    },
    orderBy: { effectiveStartDate: 'desc' },
    take: 1,
  });

  if (schedules.length === 0) {
    return [{
      type: 'STYLIST_NOT_WORKING',
      reason: "This stylist isn\u2019t scheduled to work on this day.",
    }];
  }

  const sched = schedules[0];

  if (!sched.isWorking) {
    return [{
      type: 'STYLIST_NOT_WORKING',
      reason: "This stylist isn\u2019t scheduled to work on this day.",
    }];
  }

  // Check if appointment falls within schedule hours
  const schedStartMin = timeToMinutes(sched.startTime);
  const schedEndMin = timeToMinutes(sched.endTime);
  const apptStartMin = localToMinutes(startParts.hour, startParts.minute);
  const apptEndMin = localToMinutes(endParts.hour, endParts.minute);

  if (apptStartMin < schedStartMin || apptEndMin > schedEndMin) {
    return [{
      type: 'STYLIST_NOT_WORKING',
      reason: "This appointment falls outside the stylist\u2019s working hours.",
    }];
  }

  return [];
}

/** 4. Service eligibility: does the stylist offer this service? */
async function checkServiceEligibility(
  tx: PrismaTx,
  input: AvailabilityInput,
): Promise<BookingConflict[]> {
  if (!input.serviceId) return [];

  // Check if stylist has ANY StylistService rows at all
  const anyLink = await tx.stylistService.findFirst({
    where: { staffId: input.staffId },
    select: { id: true },
  });

  if (!anyLink) {
    // No eligibility configured → treat as "does everything" (day-one behavior)
    return [];
  }

  // Eligibility exists — check for this specific service
  const match = await tx.stylistService.findUnique({
    where: {
      staffId_serviceId: {
        staffId: input.staffId,
        serviceId: input.serviceId,
      },
    },
    select: { id: true },
  });

  if (!match) {
    return [{
      type: 'SERVICE_NOT_OFFERED_BY_STYLIST',
      staffId: input.staffId,
      serviceId: input.serviceId,
    }];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Run all availability checks for a proposed booking. Returns all conflicts
 * (does not short-circuit) so the UI can show everything wrong at once.
 *
 * Must be called inside a withTenantScope transaction. The caller should
 * also perform the appointment.create inside the same transaction to reduce
 * (not eliminate) the double-booking race window. See module-level race note.
 */
export async function checkStylistAvailability(
  tx: PrismaTx,
  input: AvailabilityInput,
): Promise<AvailabilityCheck> {
  const conflicts: BookingConflict[] = [];

  // Time range is synchronous
  conflicts.push(...checkTimeRange(input));

  // Sequential, not Promise.all: Prisma interactive transactions use one
  // connection; concurrent queries over the same tx are unsupported.
  conflicts.push(...(await checkDoubleBooking(tx, input)));
  conflicts.push(...(await checkWorkingHours(tx, input)));
  conflicts.push(...(await checkServiceEligibility(tx, input)));

  return conflicts.length === 0
    ? { ok: true }
    : { ok: false, conflicts };
}
