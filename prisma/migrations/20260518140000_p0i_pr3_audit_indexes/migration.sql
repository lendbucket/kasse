-- ============================================================================
-- P0.I PR 3 — Audit Log performance indexes
-- ============================================================================
-- The AuditLog table already has indexes on (organizationId, createdAt DESC),
-- (entity, entityId), and (userId, createdAt DESC). These two additional
-- indexes support the new query helpers and admin viewer.
--
-- No schema changes to AuditLog itself — only index additions.
-- ============================================================================

CREATE INDEX IF NOT EXISTS "idx_auditlog_action"
  ON "AuditLog"("action");

CREATE INDEX IF NOT EXISTS "idx_auditlog_request"
  ON "AuditLog"("requestId")
  WHERE "requestId" IS NOT NULL;
