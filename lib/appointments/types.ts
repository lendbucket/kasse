export type BookingSource =
  | "CUSTOMER_ONLINE"
  | "STAFF"
  | "WALK_IN"
  | "PHONE"
  | "AI_RECEPTIONIST"
  | "IMPORT";

export type AppointmentItemStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED"
  | "CANCELLED";

export type PreAuthHoldStatus = "PENDING" | "CAPTURED" | "VOIDED" | "EXPIRED";

export type AppointmentChangeSource =
  | "CUSTOMER"
  | "STAFF"
  | "SYSTEM_AUTO"
  | "AI_AGENT";

export interface AppointmentItemSpec {
  serviceId: string;
  staffId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  isPrimary: boolean;
  isAddOn: boolean;
  displayOrder: number;
  notes: string | null;
}

export interface AppointmentBookingRequest {
  organizationId: string;
  locationId: string;
  clientId: string | null;
  bookingSource: BookingSource;
  items: AppointmentItemSpec[];
  notes: string | null;
  seriesId: string | null;
  bookedByUserId: string | null;
  bookedByStaffId: string | null;
}
