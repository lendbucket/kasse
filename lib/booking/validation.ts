import type { Prisma } from "@prisma/client";
import type { BookingValidationResult, BookingValidationError } from "./types";

type Tx = Prisma.TransactionClient;

/**
 * Validate a booking request against booking window constraints.
 * Does NOT check stylist availability (use resolveStylistAvailability for that).
 */
export async function validateBookingWindow(
  tx: Tx,
  args: {
    locationId: string;
    requestedStartTime: Date;
    isOnlineBooking: boolean;
    now?: Date; // injectable for testing
  },
): Promise<BookingValidationResult> {
  const errors: BookingValidationError[] = [];

  const window = await tx.bookingWindow.findUnique({
    where: { locationId: args.locationId },
  });
  if (!window) {
    return { isValid: true, errors: [] };
  }

  if (args.isOnlineBooking && !window.allowOnlineBooking) {
    errors.push({
      code: "ONLINE_BOOKING_DISABLED",
      message: "Online booking is not enabled for this location",
      context: { locationId: args.locationId },
    });
  }

  const now = args.now ?? new Date();
  const hoursUntil =
    (args.requestedStartTime.getTime() - now.getTime()) / 3600000;
  const daysUntil = hoursUntil / 24;

  if (daysUntil > window.maxDaysAhead) {
    errors.push({
      code: "OUTSIDE_BOOKING_WINDOW",
      message: `Cannot book more than ${window.maxDaysAhead} days in advance`,
      context: { maxDaysAhead: window.maxDaysAhead, daysUntil },
    });
  }

  if (hoursUntil < window.minHoursAhead) {
    errors.push({
      code: "BELOW_MIN_LEAD_TIME",
      message: `Must book at least ${window.minHoursAhead} hours in advance`,
      context: { minHoursAhead: window.minHoursAhead, hoursUntil },
    });
  }

  if (!window.allowSameDayBooking && isSameDay(args.requestedStartTime, now)) {
    errors.push({
      code: "NOT_ALLOWED_SAME_DAY",
      message: "Same-day booking is not allowed for this location",
      context: { requestedDate: args.requestedStartTime.toISOString() },
    });
  }

  return { isValid: errors.length === 0, errors };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a stylist performs a specific service (StylistService table).
 */
export async function staffCanPerformService(
  tx: Tx,
  args: { staffId: string; serviceId: string },
): Promise<boolean> {
  const link = await tx.stylistService.findUnique({
    where: {
      staffId_serviceId: {
        staffId: args.staffId,
        serviceId: args.serviceId,
      },
    },
  });
  return link !== null;
}

/**
 * Check for time conflicts on a stylist's schedule.
 */
export async function hasTimeConflict(
  tx: Tx,
  args: {
    staffId: string;
    startTime: Date;
    endTime: Date;
    excludeAppointmentId?: string;
  },
): Promise<boolean> {
  const conflicts = await tx.appointmentItem.findMany({
    where: {
      staffId: args.staffId,
      ...(args.excludeAppointmentId
        ? { appointmentId: { not: args.excludeAppointmentId } }
        : {}),
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      scheduledStart: { lt: args.endTime },
      scheduledEnd: { gt: args.startTime },
    },
    take: 1,
  });
  return conflicts.length > 0;
}
