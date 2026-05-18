export type RecurringFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "EVERY_3_WEEKS"
  | "EVERY_4_WEEKS"
  | "EVERY_6_WEEKS"
  | "EVERY_8_WEEKS"
  | "MONTHLY"
  | "CUSTOM_DAYS";

export type RecurringSeriesStatus =
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export interface RecurringSeriesSpec {
  organizationId: string;
  locationId: string;
  clientId: string;
  staffId: string;
  primaryServiceId: string;
  frequency: RecurringFrequency;
  customIntervalDays: number | null;
  dayOfWeek: number | null;
  preferredTime: Date; // Matches Prisma Time field representation (date portion is 1970-01-01)
  startDate: Date;
  endDate: Date | null;
  maxOccurrences: number | null;
  notes: string | null;
}

export interface NextOccurrenceParams {
  frequency: RecurringFrequency;
  customIntervalDays: number | null;
  fromDate: Date;
}
