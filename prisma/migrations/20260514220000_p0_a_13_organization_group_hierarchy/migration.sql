-- P0.A.13: Multi-level organization hierarchy
-- Combines: organization_group_hierarchy, groupid_move_to_location, add_organizationid
-- Applied via Supabase MCP in three sequential migrations, rolled up here for source-of-truth.

-- CreateEnum
CREATE TYPE "GroupLevel" AS ENUM ('REGION', 'BRAND', 'CONCEPT');

-- CreateTable
CREATE TABLE "OrganizationGroup" (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  level           "GroupLevel" NOT NULL,
  "parentGroupId" TEXT,
  "permissionSetId" TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrganizationGroup_parentGroupId_fkey" FOREIGN KEY ("parentGroupId")
    REFERENCES "OrganizationGroup"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OrganizationGroup_permissionSetId_fkey" FOREIGN KEY ("permissionSetId")
    REFERENCES "PermissionSet"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "OrganizationGroup_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OrganizationGroup_parentGroupId_idx" ON "OrganizationGroup"("parentGroupId");
CREATE INDEX "OrganizationGroup_level_idx" ON "OrganizationGroup"(level);
CREATE INDEX "OrganizationGroup_permissionSetId_idx" ON "OrganizationGroup"("permissionSetId");
CREATE INDEX "OrganizationGroup_organizationId_idx" ON "OrganizationGroup"("organizationId");

-- AlterTable: add groupId to Location
ALTER TABLE "Location" ADD COLUMN "groupId" TEXT;
ALTER TABLE "Location" ADD CONSTRAINT "Location_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "OrganizationGroup"(id)
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Location_groupId_idx" ON "Location"("groupId");

-- RLS: enable on OrganizationGroup
ALTER TABLE "OrganizationGroup" ENABLE ROW LEVEL SECURITY;

-- RLS SELECT: org match OR recursive chain walk (Option C visibility)
CREATE POLICY "group_select" ON "OrganizationGroup" FOR SELECT
  USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
    OR EXISTS (
      WITH RECURSIVE group_chain AS (
        SELECT id, "parentGroupId", 0 AS depth
        FROM "OrganizationGroup"
        WHERE "organizationId" = current_setting('app.current_org_id', true)
        UNION ALL
        SELECT og.id, og."parentGroupId", gc.depth + 1
        FROM "OrganizationGroup" og
        JOIN group_chain gc ON og."parentGroupId" = gc.id
        WHERE gc.depth < 10
      )
      SELECT 1 FROM group_chain WHERE id = "OrganizationGroup".id
    )
  );

-- RLS INSERT: own org only
CREATE POLICY "group_insert" ON "OrganizationGroup" FOR INSERT
  WITH CHECK (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

-- RLS UPDATE: own org only
CREATE POLICY "group_update" ON "OrganizationGroup" FOR UPDATE
  USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

-- RLS DELETE: own org only
CREATE POLICY "group_delete" ON "OrganizationGroup" FOR DELETE
  USING (
    (current_setting('app.is_superadmin', true) = 'true')
    OR ("organizationId" = current_setting('app.current_org_id', true))
  );

-- Grant kasse_app access to the new table (matches bootstrap pattern from 20260512005451)
GRANT SELECT, INSERT, UPDATE, DELETE ON "OrganizationGroup" TO kasse_app;
