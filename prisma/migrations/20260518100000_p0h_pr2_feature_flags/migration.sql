-- =============================================================
-- P0.H PR 2 — Feature Flags
-- Migration: p0h_pr2_feature_flags
-- Tables: FeatureFlag, FeatureFlagAudit
-- RLS: ENABLED + FORCE on both tables
-- =============================================================

-- -------------------------------------------------------------
-- 1. SECURITY DEFINER helper: is_current_user_superadmin()
--    Uses app.actor_user_id session variable (set by app_set_actor)
--    to look up the User's role. No new session variables needed.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_current_user_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT "role"::text INTO v_role
  FROM public."User"
  WHERE id = NULLIF(current_setting('app.actor_user_id', true), '');
  RETURN v_role = 'SUPERADMIN';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_current_user_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_superadmin() TO kasse_app;

-- -------------------------------------------------------------
-- 2. FeatureFlag table
-- -------------------------------------------------------------
CREATE TABLE public."FeatureFlag" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "key"             TEXT        NOT NULL,
  "description"     TEXT        NOT NULL,
  "defaultValue"    BOOLEAN     NOT NULL DEFAULT false,
  "rolloutPct"      INTEGER     NOT NULL DEFAULT 0,
  "overrides"       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  "isActive"        BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,

  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FeatureFlag_key_key" UNIQUE ("key"),
  CONSTRAINT "FeatureFlag_rolloutPct_check" CHECK ("rolloutPct" BETWEEN 0 AND 100),
  CONSTRAINT "FeatureFlag_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES public."User"("id") ON DELETE SET NULL,
  CONSTRAINT "FeatureFlag_updatedByUserId_fkey"
    FOREIGN KEY ("updatedByUserId") REFERENCES public."User"("id") ON DELETE SET NULL
);

-- Indexes
CREATE INDEX "idx_featureflag_key"
  ON public."FeatureFlag" ("key") WHERE "isActive" = true;
CREATE INDEX "idx_featureflag_active"
  ON public."FeatureFlag" ("isActive");

-- -------------------------------------------------------------
-- 3. FeatureFlagAudit table
-- -------------------------------------------------------------
CREATE TABLE public."FeatureFlagAudit" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "flagId"          TEXT        NOT NULL,
  "changedByUserId" TEXT,
  "changeType"      TEXT        NOT NULL,
  "before"          JSONB,
  "after"           JSONB,
  "reason"          TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "FeatureFlagAudit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FeatureFlagAudit_flagId_fkey"
    FOREIGN KEY ("flagId") REFERENCES public."FeatureFlag"("id") ON DELETE CASCADE,
  CONSTRAINT "FeatureFlagAudit_changedByUserId_fkey"
    FOREIGN KEY ("changedByUserId") REFERENCES public."User"("id") ON DELETE SET NULL
);

-- Indexes
CREATE INDEX "idx_featureflagaudit_flag"
  ON public."FeatureFlagAudit" ("flagId", "createdAt" DESC);
CREATE INDEX "idx_featureflagaudit_user"
  ON public."FeatureFlagAudit" ("changedByUserId")
  WHERE "changedByUserId" IS NOT NULL;

-- -------------------------------------------------------------
-- 4. RLS — FeatureFlag
-- -------------------------------------------------------------
ALTER TABLE public."FeatureFlag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FeatureFlag" FORCE ROW LEVEL SECURITY;

-- Read: any authenticated user (so evaluate() works without elevation)
CREATE POLICY "featureflag_read" ON public."FeatureFlag"
  FOR SELECT
  USING (true);

-- Write: SUPERADMIN only (via SECURITY DEFINER function)
CREATE POLICY "featureflag_write_superadmin" ON public."FeatureFlag"
  FOR INSERT
  WITH CHECK (public.is_current_user_superadmin());

CREATE POLICY "featureflag_update_superadmin" ON public."FeatureFlag"
  FOR UPDATE
  USING (public.is_current_user_superadmin())
  WITH CHECK (public.is_current_user_superadmin());

CREATE POLICY "featureflag_delete_superadmin" ON public."FeatureFlag"
  FOR DELETE
  USING (public.is_current_user_superadmin());

-- -------------------------------------------------------------
-- 5. RLS — FeatureFlagAudit
-- -------------------------------------------------------------
ALTER TABLE public."FeatureFlagAudit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FeatureFlagAudit" FORCE ROW LEVEL SECURITY;

CREATE POLICY "featureflagaudit_read_superadmin" ON public."FeatureFlagAudit"
  FOR SELECT
  USING (public.is_current_user_superadmin());

CREATE POLICY "featureflagaudit_write_superadmin" ON public."FeatureFlagAudit"
  FOR INSERT
  WITH CHECK (public.is_current_user_superadmin());

CREATE POLICY "featureflagaudit_update_superadmin" ON public."FeatureFlagAudit"
  FOR UPDATE
  USING (public.is_current_user_superadmin())
  WITH CHECK (public.is_current_user_superadmin());

CREATE POLICY "featureflagaudit_delete_superadmin" ON public."FeatureFlagAudit"
  FOR DELETE
  USING (public.is_current_user_superadmin());

-- -------------------------------------------------------------
-- 6. Grant kasse_app privileges
-- -------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public."FeatureFlag" TO kasse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."FeatureFlagAudit" TO kasse_app;
