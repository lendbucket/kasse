-- Reconcile: bookingSlug column + per-org unique constraint were applied
-- out-of-band. This migration records them so Prisma's migration history
-- matches the schema and DB state.

-- AlterTable
ALTER TABLE "Location" ADD COLUMN "bookingSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Location_organizationId_bookingSlug_key" ON "Location"("organizationId", "bookingSlug");
