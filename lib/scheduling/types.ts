export interface ScheduleSlot {
  dayOfWeek: number; // 0-6
  startTime: string; // 'HH:MM'
  endTime: string;
  isWorking: boolean;
  effectiveStartDate: string; // ISO date
  effectiveEndDate: string | null;
}

export interface ScheduleException {
  date: string; // ISO date
  startTime: string | null;
  endTime: string | null;
  isWorking: boolean;
  reason: string | null;
}

export interface ResolvedAvailability {
  date: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
  source: "EXCEPTION" | "SCHEDULE" | "NONE";
}
