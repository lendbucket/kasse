-- P0.B.5: Add Organization.themeOverride for per-org theme customizations.
ALTER TABLE "Organization" ADD COLUMN "themeOverride" jsonb;
