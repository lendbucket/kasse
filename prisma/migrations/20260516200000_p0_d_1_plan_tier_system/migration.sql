-- P0.D.1: Plan Tier System foundation
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PLUS', 'PREMIUM', 'ENTERPRISE');
ALTER TABLE "Organization" ADD COLUMN "planTier" "PlanTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "Organization" ADD COLUMN "enabledAddons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Organization" ADD COLUMN "planEffectiveAt" TIMESTAMP(3);
CREATE INDEX "Organization_planTier_idx" ON "Organization"("planTier");
UPDATE "Organization" SET "planEffectiveAt" = NOW() WHERE "planEffectiveAt" IS NULL;
