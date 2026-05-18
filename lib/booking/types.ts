export interface BookingConstraints {
  maxDaysAhead: number;
  minHoursAhead: number;
  slotGranularityMinutes: number;
  allowSameDayBooking: boolean;
  allowOnlineBooking: boolean;
  requireDepositForNewClients: boolean;
  requireConsultationForNewClients: boolean;
  bufferBetweenAppointmentsMinutes: number;
  maxConcurrentBookingsPerClient: number;
}

export type CancellationFeeChargeType = "FIXED" | "PERCENTAGE" | "NONE";

export interface CancellationPolicyResolved {
  windowHours: number;
  cancellationFeeFixedCents: number | null;
  cancellationFeePercentage: number | null;
  cancellationFeeChargeType: CancellationFeeChargeType;
  noShowFeeFixedCents: number | null;
  noShowFeePercentage: number | null;
  noShowFeeChargeType: CancellationFeeChargeType;
  policyText: string | null;
  requirePreAuth: boolean;
  preAuthAmountCents: number | null;
  source: "SERVICE" | "LOCATION" | "ORGANIZATION" | "DEFAULT";
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: BookingValidationError[];
}

export interface BookingValidationError {
  code:
    | "OUTSIDE_BOOKING_WINDOW"
    | "BELOW_MIN_LEAD_TIME"
    | "NOT_ALLOWED_SAME_DAY"
    | "ONLINE_BOOKING_DISABLED"
    | "STAFF_NOT_AVAILABLE"
    | "STAFF_DOES_NOT_PERFORM_SERVICE"
    | "TIME_CONFLICT"
    | "CONCURRENT_BOOKING_LIMIT_EXCEEDED";
  message: string;
  context: Record<string, unknown>;
}
