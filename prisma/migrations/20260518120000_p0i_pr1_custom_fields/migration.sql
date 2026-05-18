-- ============================================================================
-- P0.I PR 1 — Custom Fields
-- ============================================================================
-- Two-table EAV design for tenant-defined structured metadata on core entities.
-- CustomFieldDefinition: field schema (name, type, validation rules, target entity)
-- CustomFieldValue: per-row values stored as typed JSONB
-- ============================================================================

-- --- CustomFieldDefinition ---------------------------------------------------

CREATE TABLE "CustomFieldDefinition" (
  "id"                  TEXT        NOT NULL,
  "organizationId"      TEXT        NOT NULL,
  "targetEntity"        TEXT        NOT NULL,
  "key"                 TEXT        NOT NULL,
  "displayName"         TEXT        NOT NULL,
  "description"         TEXT,
  "fieldType"           TEXT        NOT NULL,
  "isRequired"          BOOLEAN     NOT NULL DEFAULT false,
  "displayOrder"        INTEGER     NOT NULL DEFAULT 0,
  "validationRules"     JSONB       NOT NULL DEFAULT '{}',
  "defaultValue"        JSONB,
  "visibleToCustomers"  BOOLEAN     NOT NULL DEFAULT false,
  "isActive"            BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdByUserId"     TEXT,
  "softDeletedAt"       TIMESTAMPTZ,

  CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "CustomFieldDefinition_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,

  CONSTRAINT "CustomFieldDefinition_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "CustomFieldDefinition_organizationId_targetEntity_key_key"
    UNIQUE ("organizationId", "targetEntity", "key"),

  CONSTRAINT "CustomFieldDefinition_targetEntity_check"
    CHECK ("targetEntity" IN ('CLIENT', 'SERVICE', 'APPOINTMENT', 'STAFF', 'PRODUCT')),

  CONSTRAINT "CustomFieldDefinition_fieldType_check"
    CHECK ("fieldType" IN ('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'URL', 'EMAIL', 'PHONE')),

  CONSTRAINT "CustomFieldDefinition_key_format_check"
    CHECK ("key" ~ '^[a-z][a-z0-9_]{0,63}$')
);

CREATE INDEX "idx_cfd_org_entity"
  ON "CustomFieldDefinition"("organizationId", "targetEntity")
  WHERE "isActive" = true AND "softDeletedAt" IS NULL;

CREATE INDEX "idx_cfd_active"
  ON "CustomFieldDefinition"("isActive")
  WHERE "softDeletedAt" IS NULL;


-- --- CustomFieldValue --------------------------------------------------------

CREATE TABLE "CustomFieldValue" (
  "id"                TEXT        NOT NULL,
  "organizationId"    TEXT        NOT NULL,
  "definitionId"      TEXT        NOT NULL,
  "entityId"          TEXT        NOT NULL,
  "value"             JSONB       NOT NULL,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedByUserId"   TEXT,

  CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "CustomFieldValue_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,

  CONSTRAINT "CustomFieldValue_definitionId_fkey"
    FOREIGN KEY ("definitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE,

  CONSTRAINT "CustomFieldValue_updatedByUserId_fkey"
    FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL,

  CONSTRAINT "CustomFieldValue_definitionId_entityId_key"
    UNIQUE ("definitionId", "entityId")
);

CREATE INDEX "idx_cfv_entity"
  ON "CustomFieldValue"("entityId");

CREATE INDEX "idx_cfv_org_entity"
  ON "CustomFieldValue"("organizationId", "entityId");

CREATE INDEX "idx_cfv_definition"
  ON "CustomFieldValue"("definitionId");

CREATE INDEX "idx_cfv_value_gin"
  ON "CustomFieldValue" USING GIN ("value");


-- --- RLS: CustomFieldDefinition ----------------------------------------------

ALTER TABLE "CustomFieldDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomFieldDefinition" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "CustomFieldDefinition"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "CustomFieldDefinition"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "CustomFieldDefinition"
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

CREATE POLICY "tenant_isolation_delete" ON "CustomFieldDefinition"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- RLS: CustomFieldValue ---------------------------------------------------

ALTER TABLE "CustomFieldValue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomFieldValue" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON "CustomFieldValue"
  FOR SELECT
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_insert" ON "CustomFieldValue"
  FOR INSERT
  WITH CHECK (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );

CREATE POLICY "tenant_isolation_update" ON "CustomFieldValue"
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

CREATE POLICY "tenant_isolation_delete" ON "CustomFieldValue"
  FOR DELETE
  USING (
    current_setting('app.is_superadmin', true) = 'true'
    OR
    "organizationId" = current_setting('app.current_org_id', true)
  );


-- --- Grants to kasse_app -----------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON "CustomFieldDefinition" TO kasse_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "CustomFieldValue" TO kasse_app;
