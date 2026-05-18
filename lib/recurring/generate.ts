import type { Prisma } from "@prisma/client";
import type { RecurringFrequency } from "./types";
import { nextOccurrenceDate } from "./occurrence";
import { writeAuditLog } from "@/lib/audit/write";
import { AuditAction } from "@/lib/audit/helpers";

export { nextOccurrenceDate } from "./occurrence";

type Tx = Prisma.TransactionClient;

/**
 * Generate the next N appointments for an active recurring series.
 * Idempotent: won't create duplicates if called repeatedly (uses lastGeneratedThrough).
 */
export async function generateNextOccurrences(
  tx: Tx,
  args: {
    seriesId: string;
    organizationId: string;
    count: number;
  },
): Promise<{ created: number; generatedThrough: Date | null }> {
  const series = await tx.recurringSeries.findFirst({
    where: {
      id: args.seriesId,
      organizationId: args.organizationId,
      status: "ACTIVE",
    },
  });
  if (!series) {
    return { created: 0, generatedThrough: null };
  }

  let currentDate = series.lastGeneratedThrough
    ? new Date(series.lastGeneratedThrough)
    : new Date(series.startDate);
  let created = 0;

  for (let i = 0; i < args.count; i++) {
    const occurrenceDate = nextOccurrenceDate({
      frequency: series.frequency as RecurringFrequency,
      customIntervalDays: series.customIntervalDays,
      fromDate: currentDate,
    });

    if (series.endDate && occurrenceDate > new Date(series.endDate)) {
      break;
    }

    if (
      series.maxOccurrences &&
      series.occurrencesGenerated + created >= series.maxOccurrences
    ) {
      break;
    }

    const startTime = new Date(occurrenceDate);
    // NOTE: series.preferredTime is a PostgreSQL Time field (no timezone). When Prisma
    // returns it as a Date object, the date portion is meaningless and the time portion
    // is in UTC. toISOString().slice(11, 16) extracts the time as 'HH:MM' assuming UTC.
    // This is safe because Time fields don't carry timezone info, but if we ever switch
    // to TimeTZ this code will need updating.
    const [hours, minutes] = series.preferredTime.toISOString().slice(11, 16).split(":");
    startTime.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

    const service = await tx.service.findUnique({
      where: { id: series.primaryServiceId },
      select: { duration: true, bufferTime: true },
    });
    if (!service) {
      throw new Error(
        `Primary service ${series.primaryServiceId} not found`,
      );
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(
      endTime.getMinutes() + service.duration + service.bufferTime,
    );

    const appt = await tx.appointment.create({
      data: {
        organizationId: series.organizationId,
        locationId: series.locationId,
        clientId: series.clientId,
        staffId: series.staffId,
        serviceId: series.primaryServiceId,
        startTime,
        endTime,
        seriesId: series.id,
        bookingSource: "STAFF",
        status: "scheduled",
      },
    });

    // Status history entry (invariant: every appointment has >= 1 history row)
    await tx.appointmentStatusHistory.create({
      data: {
        appointmentId: appt.id,
        previousStatus: null,
        newStatus: "scheduled",
        changedByUserId: null,
        changedByStaffId: null,
        changeSource: "SYSTEM_AUTO",
        changeReason: `Auto-generated from recurring series ${series.id}`,
      },
    });

    // Audit log
    await writeAuditLog({
      userId: null,
      organizationId: series.organizationId,
      action: AuditAction.APPOINTMENT_CREATE_RECURRING,
      entity: "Appointment",
      entityId: appt.id,
      after: {
        seriesId: series.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        source: "SYSTEM_AUTO",
      },
    });

    currentDate = occurrenceDate;
    created++;
  }

  if (created > 0) {
    await tx.recurringSeries.update({
      where: { id: series.id },
      data: {
        occurrencesGenerated: { increment: created },
        lastGeneratedThrough: currentDate,
      },
    });
  }

  return { created, generatedThrough: currentDate };
}
