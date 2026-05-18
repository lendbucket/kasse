-- NOTE: This migration was applied via Supabase MCP (apply_migration tool),
-- not via `prisma migrate deploy`. Production target is Supabase only.
-- This file is the source of truth for what was executed against the database
-- and serves as a reviewable record for future maintainers.

-- P0.G PR 2: Appointment + Recurring + Booking Constraints

-- 1. Appointment table extensions
ALTER TABLE "Appointment" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "bookingSource" TEXT NOT NULL DEFAULT 'STAFF';
ALTER TABLE "Appointment" ADD COLUMN "bookedByUserId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "bookedByStaffId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "preAuthHoldCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "preAuthHoldStatus" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "preAuthPayrocTransactionId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "noShowFeeAppliedCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "cancellationFeeAppliedCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "consentSignatureIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Appointment" ADD COLUMN "estimatedTotalCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "estimatedTotalMinutes" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "isFirstVisit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN "formulaIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Appointment" ADD COLUMN "softDeletedAt" TIMESTAMP(3);

-- 2. RecurringSeries table (must exist before FK on Appointment)
CREATE TABLE "RecurringSeries" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "primaryServiceId" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "customIntervalDays" INTEGER,
  "dayOfWeek" INTEGER,
  "preferredTime" TIME NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "maxOccurrences" INTEGER,
  "occurrencesGenerated" INTEGER NOT NULL DEFAULT 0,
  "lastGeneratedThrough" DATE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "pausedReason" TEXT,
  "pausedUntil" DATE,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringSeries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecurringSeries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "RecurringSeries_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE,
  CONSTRAINT "RecurringSeries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE,
  CONSTRAINT "RecurringSeries_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT,
  CONSTRAINT "RecurringSeries_primaryServiceId_fkey" FOREIGN KEY ("primaryServiceId") REFERENCES "Service"("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_recseries_org" ON "RecurringSeries"("organizationId", "status");
CREATE INDEX "idx_recseries_client" ON "RecurringSeries"("clientId");
CREATE INDEX "idx_recseries_staff" ON "RecurringSeries"("staffId", "status") WHERE "status" = 'ACTIVE';
CREATE INDEX "idx_recseries_generate" ON "RecurringSeries"("lastGeneratedThrough") WHERE "status" = 'ACTIVE';

-- Appointment FKs (after RecurringSeries exists)
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RecurringSeries"("id") ON DELETE SET NULL;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_bookedByUserId_fkey" FOREIGN KEY ("bookedByUserId") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_bookedByStaffId_fkey" FOREIGN KEY ("bookedByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL;

CREATE INDEX "idx_appointment_series" ON "Appointment"("seriesId") WHERE "seriesId" IS NOT NULL;
CREATE INDEX "idx_appointment_org_source" ON "Appointment"("organizationId", "bookingSource");
CREATE INDEX "idx_appointment_softdel" ON "Appointment"("organizationId", "locationId", "startTime") WHERE "softDeletedAt" IS NULL;

-- 3. AppointmentItem table
CREATE TABLE "AppointmentItem" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "scheduledStart" TIMESTAMP(3) NOT NULL,
  "scheduledEnd" TIMESTAMP(3) NOT NULL,
  "actualStart" TIMESTAMP(3),
  "actualEnd" TIMESTAMP(3),
  "priceAtBookingCents" INTEGER NOT NULL,
  "durationAtBookingMinutes" INTEGER NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isAddOn" BOOLEAN NOT NULL DEFAULT false,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentItem_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE,
  CONSTRAINT "AppointmentItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT,
  CONSTRAINT "AppointmentItem_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_apptitem_appointment" ON "AppointmentItem"("appointmentId");
CREATE INDEX "idx_apptitem_service" ON "AppointmentItem"("serviceId");
CREATE INDEX "idx_apptitem_staff_scheduled" ON "AppointmentItem"("staffId", "scheduledStart");
CREATE INDEX "idx_apptitem_status" ON "AppointmentItem"("appointmentId", "status");

-- 4. CancellationPolicy table
CREATE TABLE "CancellationPolicy" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "serviceId" TEXT,
  "locationId" TEXT,
  "windowHours" INTEGER NOT NULL DEFAULT 24,
  "cancellationFeeFixedCents" INTEGER,
  "cancellationFeePercentage" INTEGER,
  "cancellationFeeChargeType" TEXT NOT NULL DEFAULT 'FIXED',
  "noShowFeeFixedCents" INTEGER,
  "noShowFeePercentage" INTEGER,
  "noShowFeeChargeType" TEXT NOT NULL DEFAULT 'FIXED',
  "policyText" TEXT,
  "requirePreAuth" BOOLEAN NOT NULL DEFAULT false,
  "preAuthAmountCents" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CancellationPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "CancellationPolicy_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE,
  CONSTRAINT "CancellationPolicy_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_cancelpol_org" ON "CancellationPolicy"("organizationId", "isActive");
CREATE INDEX "idx_cancelpol_service" ON "CancellationPolicy"("serviceId") WHERE "serviceId" IS NOT NULL;
CREATE INDEX "idx_cancelpol_location" ON "CancellationPolicy"("locationId") WHERE "locationId" IS NOT NULL;

-- 5. BookingWindow table
CREATE TABLE "BookingWindow" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL UNIQUE,
  "maxDaysAhead" INTEGER NOT NULL DEFAULT 60,
  "minHoursAhead" INTEGER NOT NULL DEFAULT 1,
  "slotGranularityMinutes" INTEGER NOT NULL DEFAULT 15,
  "allowSameDayBooking" BOOLEAN NOT NULL DEFAULT true,
  "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true,
  "requireDepositForNewClients" BOOLEAN NOT NULL DEFAULT false,
  "requireConsultationForNewClients" BOOLEAN NOT NULL DEFAULT false,
  "bufferBetweenAppointmentsMinutes" INTEGER NOT NULL DEFAULT 0,
  "maxConcurrentBookingsPerClient" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingWindow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingWindow_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE
);

-- 6. AppointmentStatusHistory table
CREATE TABLE "AppointmentStatusHistory" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "previousStatus" TEXT,
  "newStatus" TEXT NOT NULL,
  "changedByUserId" TEXT,
  "changedByStaffId" TEXT,
  "changeReason" TEXT,
  "changeSource" TEXT NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentStatusHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentStatusHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE,
  CONSTRAINT "AppointmentStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "AppointmentStatusHistory_changedByStaffId_fkey" FOREIGN KEY ("changedByStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_apptsh_appointment_created" ON "AppointmentStatusHistory"("appointmentId", "createdAt" DESC);

-- 7. RLS Policies

-- RecurringSeries (direct organizationId)
ALTER TABLE "RecurringSeries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecurringSeries" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "RecurringSeries"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON "RecurringSeries" TO kasse_app;

-- AppointmentItem (via Appointment.organizationId)
ALTER TABLE "AppointmentItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppointmentItem" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "AppointmentItem"
  USING (
    EXISTS (
      SELECT 1 FROM "Appointment" a
      WHERE a."id" = "AppointmentItem"."appointmentId"
        AND a."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Appointment" a
      WHERE a."id" = "AppointmentItem"."appointmentId"
        AND a."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "AppointmentItem" TO kasse_app;

-- CancellationPolicy (direct organizationId)
ALTER TABLE "CancellationPolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CancellationPolicy" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "CancellationPolicy"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON "CancellationPolicy" TO kasse_app;

-- BookingWindow (via Location.organizationId)
ALTER TABLE "BookingWindow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingWindow" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "BookingWindow"
  USING (
    EXISTS (
      SELECT 1 FROM "Location" l
      WHERE l."id" = "BookingWindow"."locationId"
        AND l."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Location" l
      WHERE l."id" = "BookingWindow"."locationId"
        AND l."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "BookingWindow" TO kasse_app;

-- AppointmentStatusHistory (via Appointment.organizationId)
ALTER TABLE "AppointmentStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppointmentStatusHistory" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "AppointmentStatusHistory"
  USING (
    EXISTS (
      SELECT 1 FROM "Appointment" a
      WHERE a."id" = "AppointmentStatusHistory"."appointmentId"
        AND a."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Appointment" a
      WHERE a."id" = "AppointmentStatusHistory"."appointmentId"
        AND a."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "AppointmentStatusHistory" TO kasse_app;
