import type { Prisma } from "@prisma/client";
import type { ResolvedAvailability } from "./types";

type Tx = Prisma.TransactionClient;

/**
 * Resolve stylist availability for a specific date.
 * Priority: StylistScheduleException > StylistSchedule > NONE.
 */
export async function resolveStylistAvailability(
  tx: Tx,
  args: { staffId: string; date: Date },
): Promise<ResolvedAvailability> {
  // Compute date string from input directly for timezone safety
  const dateString = args.date.toISOString().slice(0, 10);
  const dateOnly = new Date(`${dateString}T00:00:00Z`);

  // Check for exception first
  const exception = await tx.stylistScheduleException.findUnique({
    where: { staffId_date: { staffId: args.staffId, date: dateOnly } },
  });
  if (exception) {
    return {
      date: dateString,
      isWorking: exception.isWorking,
      startTime: exception.startTime
        ? formatTime(exception.startTime)
        : null,
      endTime: exception.endTime
        ? formatTime(exception.endTime)
        : null,
      source: "EXCEPTION",
    };
  }

  // Fall back to weekly schedule
  const dayOfWeek = dateOnly.getUTCDay();
  const schedule = await tx.stylistSchedule.findFirst({
    where: {
      staffId: args.staffId,
      dayOfWeek,
      effectiveStartDate: { lte: dateOnly },
      OR: [
        { effectiveEndDate: null },
        { effectiveEndDate: { gte: dateOnly } },
      ],
    },
    orderBy: { effectiveStartDate: "desc" },
  });

  if (schedule) {
    return {
      date: dateString,
      isWorking: schedule.isWorking,
      startTime: formatTime(schedule.startTime),
      endTime: formatTime(schedule.endTime),
      source: "SCHEDULE",
    };
  }

  return {
    date: dateString,
    isWorking: false,
    startTime: null,
    endTime: null,
    source: "NONE",
  };
}

/** Extract HH:MM from a Date representing a TIME field. */
function formatTime(d: Date): string {
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
