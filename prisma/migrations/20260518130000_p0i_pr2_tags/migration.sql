-- ============================================================================
-- P0.I PR 2 — Tags (polymorphic labeling)
-- ============================================================================
-- Two-table design: Tag (definition) + EntityTag (polymorphic join).
-- Same 5 target entities as custom fields.
--
-- DEPLOYMENT NOTES:
--
-- 1. GRANT statements at the bottom require the `postgres` role (the migration
--    role), not `kasse_app` (the application role). When applied via Supabase
--    MCP or Prisma's MIGRATION_DATABASE_URL, this is automatic — both use the
--    postgres role. If migrations are ever run with a non-superuser role, the
--    GRANTs will silently fail and kasse_app will get permission denied at
--    runtime.
--
-- 2. EntityTag intentionally has NO updatedAt column. Join-table rows are
--    either present (tag attached) or absent (tag detached) — there is no
--    "update" operation that would make updatedAt meaningful. The createdAt
--    timestamp records when the tag was attached.
--
-- ============================================================================

-- --- Tag ---------------------------------------------------------------------

CREATE TABLE "Tag" (
  "id"                TEXT        NOT NULL,
  "organizationId"    TEXT        NOT NULL,
  "name"              TEXT        NOT NULL,
  "slug"              TEXT        NOT NULL,
  "color"             TEXT        NOT NULL DEFAULT '#606E74',
  "description"       TEXT,
  "isActive"          BOOLEAN     NOT NULL DEFAULT true,
  "displayOrder"      INTEGER     NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdByUserId"   TEXT,
  "softDeletedAt"     TIMESTAMPTZ,

  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "Tag_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,

  CONSTRAINT "Tag_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "Tag_organizationId_slug_key"
    UNIQUE ("organizationId", "slug"),

  CONSTRAINT "Tag_slug_format_check"
    CHECK ("slug" ~ '^[a-z0-9][a-z0-9-]{0,63}$'),

  CONSTRAINT "Tag_color_format_check"
    CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$'),

  CONSTRAINT "Tag_name_length_check"
    CHECK (length("name") BETWEEN 1 AND 50)
);

CREATE INDEX "idx_tag_org"
  ON "Tag"("organizationId")
  WHERE "isActive" = true AND "softDeletedAt" IS NULL;

CREATE INDEX "idx_tag_org_slug"
  ON "Tag"("organizationId", "slug")
  WHERE "softDeletedAt" IS NULL;


-- --- EntityTag ---------------------------------------------------------------

CREATE TABLE "EntityTag" (
  "id"                TEXT        NOT NULL,
  "organizationId"    TEXT        NOT NULL,
  "tagId"             TEXT        NOT NULL,
  "entityType"        TEXT        NOT NULL,
  "entityId"          TEXT        NOT NULL,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdByUserId"   TEXT,

  CONSTRAINT "EntityTag_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "EntityTag_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,

  CONSTRAINT "EntityTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE,

  CONSTRAINT "EntityTag_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "EntityTag_tagId_entityType_entityId_key"
    UNIQUE ("tagId", "entityType", "entityId"),

  CONSTRAINT "EntityTag_entityType_check"
    CHECK ("entityType" IN ('CLIENT', 'SERVICE', 'APPOINTMENT', 'STAFF', 'PRODUCT'))
);

CREATE INDEX "idx_entitytag_entity"
  ON "EntityTag"("entityType", "entityId");

CREATE INDEX "idx_entitytag_org_entity"
  ON "EntityTag"("organizationId", "entityType", "entityId");

CREATE INDEX "idx_entitytag_tag"
  ON "EntityTag"("tagId");


-- --- RLS: Tag ----------------------------------------------------------------

ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "Tag"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "Tag"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "Tag"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "Tag"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- RLS: EntityTag ----------------------------------------------------------

ALTER TABLE "EntityTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EntityTag" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "EntityTag"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "EntityTag"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "EntityTag"
  FOR UPDATE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  )
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_delete" ON "EntityTag"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Grants to kasse_app -----------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON "Tag" TO kasse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "EntityTag" TO kasse_app;
