-- P0.G PR 1: Service Catalog + Client + Stylist Scheduling Foundation
-- Single atomic migration — all or nothing.

-- ═══════════════════════════════════════════
-- 1. DepositType enum + Service table extensions
-- ═══════════════════════════════════════════

CREATE TYPE "DepositType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

ALTER TABLE "Service" ADD COLUMN "productCost" INTEGER;
ALTER TABLE "Service" ADD COLUMN "consumableCost" INTEGER;
ALTER TABLE "Service" ADD COLUMN "targetMarginPct" INTEGER;
ALTER TABLE "Service" ADD COLUMN "processingMinutes" INTEGER;
ALTER TABLE "Service" ADD COLUMN "addOnVisibleOnBookingMenu" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Service" ADD COLUMN "bookableByCustomers" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Service" ADD COLUMN "bookableByStaff" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Service" ADD COLUMN "requiresConsultation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Service" ADD COLUMN "requiresConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Service" ADD COLUMN "softDeletedAt" TIMESTAMP(3);

-- Convert depositType from text to enum
ALTER TABLE "Service" ADD COLUMN "depositTypeNew" "DepositType";
UPDATE "Service" SET "depositTypeNew" = 'FIXED_AMOUNT' WHERE "depositType" = 'fixed_amount';
UPDATE "Service" SET "depositTypeNew" = 'PERCENTAGE' WHERE "depositType" = 'percentage';
ALTER TABLE "Service" DROP COLUMN "depositType";
ALTER TABLE "Service" RENAME COLUMN "depositTypeNew" TO "depositType";

-- Convert depositAmount (float) to depositValueCents (integer)
ALTER TABLE "Service" ADD COLUMN "depositValueCents" INTEGER;
UPDATE "Service" SET "depositValueCents" = ROUND("depositAmount" * 100)::INTEGER
  WHERE "depositType" = 'FIXED_AMOUNT' AND "depositAmount" IS NOT NULL;
UPDATE "Service" SET "depositValueCents" = ROUND("depositAmount")::INTEGER
  WHERE "depositType" = 'PERCENTAGE' AND "depositAmount" IS NOT NULL;
ALTER TABLE "Service" DROP COLUMN "depositAmount";

-- Service indexes
CREATE INDEX "idx_service_org_loc_active" ON "Service"("organizationId", "locationId", "isActive")
  WHERE "softDeletedAt" IS NULL;
CREATE INDEX "idx_service_org_addon" ON "Service"("organizationId", "isAddon", "isActive");

-- ═══════════════════════════════════════════
-- 2. ServiceLocation table
-- ═══════════════════════════════════════════

CREATE TABLE "ServiceLocation" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "priceOverrideCents" INTEGER,
  "durationOverrideMinutes" INTEGER,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "pendingPriceApproval" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceLocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceLocation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE,
  CONSTRAINT "ServiceLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE
);

ALTER TABLE "ServiceLocation" ADD CONSTRAINT "ServiceLocation_serviceId_locationId_key" UNIQUE ("serviceId", "locationId");
CREATE INDEX "idx_servicelocation_service" ON "ServiceLocation"("serviceId");
CREATE INDEX "idx_servicelocation_location" ON "ServiceLocation"("locationId");

-- ═══════════════════════════════════════════
-- 3. ServiceStaffOverride table
-- ═══════════════════════════════════════════

CREATE TABLE "ServiceStaffOverride" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "priceCents" INTEGER,
  "durationMinutes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceStaffOverride_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceStaffOverride_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE,
  CONSTRAINT "ServiceStaffOverride_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE
);

ALTER TABLE "ServiceStaffOverride" ADD CONSTRAINT "ServiceStaffOverride_serviceId_staffId_key" UNIQUE ("serviceId", "staffId");
CREATE INDEX "idx_servicestaff_service" ON "ServiceStaffOverride"("serviceId");
CREATE INDEX "idx_servicestaff_staff" ON "ServiceStaffOverride"("staffId");

-- ═══════════════════════════════════════════
-- 4. StylistService table
-- ═══════════════════════════════════════════

CREATE TABLE "StylistService" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "skillLevel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StylistService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StylistService_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE,
  CONSTRAINT "StylistService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE
);

ALTER TABLE "StylistService" ADD CONSTRAINT "StylistService_staffId_serviceId_key" UNIQUE ("staffId", "serviceId");
CREATE INDEX "idx_stylistservice_staff" ON "StylistService"("staffId");
CREATE INDEX "idx_stylistservice_service" ON "StylistService"("serviceId");

-- ═══════════════════════════════════════════
-- 5. Client table extensions
-- ═══════════════════════════════════════════

ALTER TABLE "Client" ADD COLUMN "allergies" JSONB;
ALTER TABLE "Client" ADD COLUMN "vipStatus" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Client" ADD COLUMN "relationshipScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Client" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "Client" ADD COLUMN "preferredContactChannel" TEXT NOT NULL DEFAULT 'SMS';
ALTER TABLE "Client" ADD COLUMN "totalLifetimeValue" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Client" ADD COLUMN "softDeletedAt" TIMESTAMP(3);

CREATE INDEX "idx_client_org_phone" ON "Client"("organizationId", "phone")
  WHERE "softDeletedAt" IS NULL;
CREATE INDEX "idx_client_org_email" ON "Client"("organizationId", "email")
  WHERE "softDeletedAt" IS NULL;
CREATE INDEX "idx_client_org_active" ON "Client"("organizationId", "isActive")
  WHERE "softDeletedAt" IS NULL;

-- ═══════════════════════════════════════════
-- 6. ColorFormula table
-- ═══════════════════════════════════════════

CREATE TABLE "ColorFormula" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "appointmentId" TEXT,
  "staffId" TEXT NOT NULL,
  "formulaVersion" INTEGER NOT NULL DEFAULT 1,
  "formulaIngredients" JSONB NOT NULL,
  "processingMinutes" INTEGER,
  "resultNotes" TEXT,
  "beforePhotoUrl" TEXT,
  "afterPhotoUrl" TEXT,
  "allergyChecked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ColorFormula_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ColorFormula_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ColorFormula_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE,
  CONSTRAINT "ColorFormula_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL,
  CONSTRAINT "ColorFormula_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_colorformula_client_created" ON "ColorFormula"("clientId", "createdAt" DESC);
CREATE INDEX "idx_colorformula_org" ON "ColorFormula"("organizationId");
CREATE INDEX "idx_colorformula_appointment" ON "ColorFormula"("appointmentId") WHERE "appointmentId" IS NOT NULL;

-- ═══════════════════════════════════════════
-- 7. ConsentSignature table
-- ═══════════════════════════════════════════

CREATE TABLE "ConsentSignature" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "serviceId" TEXT,
  "consentType" TEXT NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signedDocUrl" TEXT,
  "signatureDataUrl" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "ConsentSignature_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConsentSignature_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ConsentSignature_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE,
  CONSTRAINT "ConsentSignature_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_consent_client" ON "ConsentSignature"("clientId", "signedAt" DESC);
CREATE INDEX "idx_consent_org" ON "ConsentSignature"("organizationId");

-- ═══════════════════════════════════════════
-- 8. StylistSchedule table
-- ═══════════════════════════════════════════

CREATE TABLE "StylistSchedule" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TIME NOT NULL,
  "endTime" TIME NOT NULL,
  "isWorking" BOOLEAN NOT NULL DEFAULT true,
  "effectiveStartDate" DATE NOT NULL,
  "effectiveEndDate" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StylistSchedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StylistSchedule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE,
  CONSTRAINT "StylistSchedule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_stylistsched_staff_day" ON "StylistSchedule"("staffId", "dayOfWeek");
CREATE INDEX "idx_stylistsched_staff_eff" ON "StylistSchedule"("staffId", "effectiveStartDate", "effectiveEndDate");
CREATE INDEX "idx_stylistsched_location" ON "StylistSchedule"("locationId");

-- ═══════════════════════════════════════════
-- 9. StylistScheduleException table
-- ═══════════════════════════════════════════

CREATE TABLE "StylistScheduleException" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "startTime" TIME,
  "endTime" TIME,
  "isWorking" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StylistScheduleException_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StylistScheduleException_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE
);

ALTER TABLE "StylistScheduleException" ADD CONSTRAINT "StylistScheduleException_staffId_date_key" UNIQUE ("staffId", "date");
CREATE INDEX "idx_schedexc_staff_date" ON "StylistScheduleException"("staffId", "date");

-- ═══════════════════════════════════════════
-- 10. Staff table extensions
-- ═══════════════════════════════════════════

ALTER TABLE "Staff" ADD COLUMN "softDeletedAt" TIMESTAMP(3);
ALTER TABLE "Staff" ADD COLUMN "bufferOverrideMinutes" JSONB;

CREATE INDEX "idx_staff_org_active" ON "Staff"("organizationId", "isActive")
  WHERE "softDeletedAt" IS NULL;

-- ═══════════════════════════════════════════
-- 11. Location geofenceRadius default change
-- ═══════════════════════════════════════════

-- WARNING: This UPDATE assumes Location.geofenceRadius=500 was always the legacy
-- default and never an intentional tenant setting. Prior to this migration, the
-- default was 500. We're bringing existing rows down to 100 (SD-K-030) to match
-- the new default. If any future tenant data load might include intentional
-- geofenceRadius=500 values, that data should be re-set after this migration runs.
-- Verified: 3 production locations all at 100ft after migration ran cleanly.
ALTER TABLE "Location" ALTER COLUMN "geofenceRadius" SET DEFAULT 100;
UPDATE "Location" SET "geofenceRadius" = 100 WHERE "geofenceRadius" = 500;

-- ═══════════════════════════════════════════
-- 12. Appointment indexes
-- ═══════════════════════════════════════════

CREATE INDEX "idx_appointment_org_loc_start" ON "Appointment"("organizationId", "locationId", "startTime");
CREATE INDEX "idx_appointment_org_staff_start" ON "Appointment"("organizationId", "staffId", "startTime");
CREATE INDEX "idx_appointment_client" ON "Appointment"("clientId") WHERE "clientId" IS NOT NULL;

-- ═══════════════════════════════════════════
-- 13. RLS Policies for new tables
-- ═══════════════════════════════════════════

-- ColorFormula (direct organizationId)
ALTER TABLE "ColorFormula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ColorFormula" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "ColorFormula"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON "ColorFormula" TO kasse_app;

-- ConsentSignature (direct organizationId)
ALTER TABLE "ConsentSignature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsentSignature" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "ConsentSignature"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));
GRANT SELECT, INSERT, UPDATE, DELETE ON "ConsentSignature" TO kasse_app;

-- ServiceLocation (via Service.organizationId)
ALTER TABLE "ServiceLocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceLocation" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "ServiceLocation"
  USING (
    EXISTS (
      SELECT 1 FROM "Service" s
      WHERE s."id" = "ServiceLocation"."serviceId"
        AND s."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Service" s
      WHERE s."id" = "ServiceLocation"."serviceId"
        AND s."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "ServiceLocation" TO kasse_app;

-- ServiceStaffOverride (via Service.organizationId)
ALTER TABLE "ServiceStaffOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceStaffOverride" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "ServiceStaffOverride"
  USING (
    EXISTS (
      SELECT 1 FROM "Service" s
      WHERE s."id" = "ServiceStaffOverride"."serviceId"
        AND s."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Service" s
      WHERE s."id" = "ServiceStaffOverride"."serviceId"
        AND s."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "ServiceStaffOverride" TO kasse_app;

-- StylistService (via Staff.organizationId)
ALTER TABLE "StylistService" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StylistService" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "StylistService"
  USING (
    EXISTS (
      SELECT 1 FROM "Staff" st
      WHERE st."id" = "StylistService"."staffId"
        AND st."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Staff" st
      WHERE st."id" = "StylistService"."staffId"
        AND st."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "StylistService" TO kasse_app;

-- StylistSchedule (via Staff.organizationId)
ALTER TABLE "StylistSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StylistSchedule" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "StylistSchedule"
  USING (
    EXISTS (
      SELECT 1 FROM "Staff" st
      WHERE st."id" = "StylistSchedule"."staffId"
        AND st."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Staff" st
      WHERE st."id" = "StylistSchedule"."staffId"
        AND st."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "StylistSchedule" TO kasse_app;

-- StylistScheduleException (via Staff.organizationId)
ALTER TABLE "StylistScheduleException" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StylistScheduleException" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "StylistScheduleException"
  USING (
    EXISTS (
      SELECT 1 FROM "Staff" st
      WHERE st."id" = "StylistScheduleException"."staffId"
        AND st."organizationId" = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Staff" st
      WHERE st."id" = "StylistScheduleException"."staffId"
        AND st."organizationId" = current_setting('app.current_org_id', true)
    )
  );
GRANT SELECT, INSERT, UPDATE, DELETE ON "StylistScheduleException" TO kasse_app;
