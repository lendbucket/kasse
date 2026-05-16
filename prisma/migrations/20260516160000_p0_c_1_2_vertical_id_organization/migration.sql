-- P0.C.1+2: VerticalConfig system foundation
--
-- Adds VerticalId enum + Organization.verticalId + Organization.verticalConfigOverride.

CREATE TYPE "VerticalId" AS ENUM (
  'salon', 'barbershop', 'nail_salon', 'restaurant', 'bar', 'gym',
  'yoga_studio', 'pilates_studio', 'massage', 'med_spa',
  'auto_detailing', 'auto_repair', 'pet_grooming', 'veterinary',
  'tattoo', 'retail', 'food_truck', 'cafe', 'bakery', 'catering',
  'cleaning', 'photography', 'tutoring', 'childcare', 'coworking',
  'sports_training', 'beauty_school', 'brow_studio', 'lash_studio',
  'tanning_studio', 'dance_studio', 'martial_arts', 'crossfit',
  'chiropractic', 'physical_therapy', 'general'
);

ALTER TABLE "Organization" ADD COLUMN "verticalId" "VerticalId" NOT NULL DEFAULT 'salon';
ALTER TABLE "Organization" ADD COLUMN "verticalConfigOverride" jsonb;
CREATE INDEX "Organization_verticalId_idx" ON "Organization"("verticalId");
