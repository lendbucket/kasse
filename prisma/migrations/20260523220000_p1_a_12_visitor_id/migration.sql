-- AlterTable
ALTER TABLE "User" ADD COLUMN "visitorId" TEXT;

-- Index for analytics joins (visitorId → User lookups)
CREATE INDEX "User_visitorId_idx" ON "User"("visitorId");
