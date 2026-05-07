-- Phase 0.5.4 — Audit log infrastructure
-- 1. Augment AuditLog with route, requestId, changedFields, metadata + indexes
-- 2. Add session-variable helpers for actor context
-- 3. Add a generic audit trigger function
-- 4. Attach the trigger to: User, Organization, Staff, Transaction, Client

-- ============================================================================
-- PART 1 — AuditLog column additions and indexes
-- ============================================================================

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "changedFields" TEXT[],
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "route" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);

-- ============================================================================
-- PART 2 — Actor context session variables
-- ============================================================================

CREATE OR REPLACE FUNCTION app_set_actor(
  user_id  text,
  email    text,
  ip       text,
  ua       text,
  req_id   text,
  route    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.actor_user_id', COALESCE(user_id, ''), true);
  PERFORM set_config('app.actor_email',   COALESCE(email,   ''), true);
  PERFORM set_config('app.actor_ip',      COALESCE(ip,      ''), true);
  PERFORM set_config('app.actor_ua',      COALESCE(ua,      ''), true);
  PERFORM set_config('app.request_id',    COALESCE(req_id,  ''), true);
  PERFORM set_config('app.route',         COALESCE(route,   ''), true);
END;
$$;

CREATE OR REPLACE FUNCTION app_clear_actor()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.actor_user_id', '', true);
  PERFORM set_config('app.actor_email',   '', true);
  PERFORM set_config('app.actor_ip',      '', true);
  PERFORM set_config('app.actor_ua',      '', true);
  PERFORM set_config('app.request_id',    '', true);
  PERFORM set_config('app.route',         '', true);
END;
$$;

CREATE OR REPLACE FUNCTION app_actor_user_id() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.actor_user_id', true), '');
$$;

CREATE OR REPLACE FUNCTION app_request_id() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.request_id', true), '');
$$;

-- ============================================================================
-- PART 3 — Generic audit trigger function
-- Reads actor + tenant context from session variables, writes one AuditLog row
-- per INSERT/UPDATE/DELETE. UPDATE rows include the list of changed columns
-- so consumers can filter without parsing the JSON.
-- ============================================================================

CREATE OR REPLACE FUNCTION app_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action       text;
  v_entity       text := TG_TABLE_NAME;
  v_entity_id    text;
  v_before       jsonb;
  v_after        jsonb;
  v_changed      text[] := ARRAY[]::text[];
  v_org_id       text;
  v_actor_id     text;
  v_actor_email  text;
  v_actor_ip     text;
  v_actor_ua     text;
  v_request_id   text;
  v_route        text;
  v_id_value     text;
  v_org_value    text;
  k              text;
BEGIN
  -- Determine action and primary id
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_after  := to_jsonb(NEW);
    v_id_value := COALESCE(v_after->>'id', '');
    v_org_value := v_after->>'organizationId';
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_before := to_jsonb(OLD);
    v_after  := to_jsonb(NEW);
    v_id_value := COALESCE(v_after->>'id', v_before->>'id', '');
    v_org_value := COALESCE(v_after->>'organizationId', v_before->>'organizationId');
    -- Compute changed field names
    FOR k IN SELECT jsonb_object_keys(v_after) LOOP
      IF (v_before->k) IS DISTINCT FROM (v_after->k) THEN
        v_changed := array_append(v_changed, k);
      END IF;
    END LOOP;
    -- If nothing actually changed, skip writing an audit row
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_before := to_jsonb(OLD);
    v_id_value := COALESCE(v_before->>'id', '');
    v_org_value := v_before->>'organizationId';
  END IF;

  -- Pull actor + request context from session vars (set by withTenantScope)
  v_actor_id    := NULLIF(current_setting('app.actor_user_id', true), '');
  v_actor_email := NULLIF(current_setting('app.actor_email',   true), '');
  v_actor_ip    := NULLIF(current_setting('app.actor_ip',      true), '');
  v_actor_ua    := NULLIF(current_setting('app.actor_ua',      true), '');
  v_request_id  := NULLIF(current_setting('app.request_id',    true), '');
  v_route       := NULLIF(current_setting('app.route',         true), '');

  -- Prefer the row's organizationId; fall back to the connection's tenant scope
  v_org_id := COALESCE(v_org_value, NULLIF(current_setting('app.current_org_id', true), ''));

  INSERT INTO "AuditLog" (
    "id",
    "userId",
    "organizationId",
    "action",
    "entity",
    "entityId",
    "before",
    "after",
    "ipAddress",
    "userAgent",
    "route",
    "requestId",
    "changedFields",
    "createdAt"
  ) VALUES (
    -- cuid-shaped fallback id; Postgres can't generate cuids natively, so we use a uuid-ish prefix.
    -- Application code should rely on its own id generation; this is the safety-net path.
    'al_' || replace(gen_random_uuid()::text, '-', ''),
    v_actor_id,
    v_org_id,
    v_action,
    v_entity,
    NULLIF(v_id_value, ''),
    v_before,
    v_after,
    v_actor_ip,
    v_actor_ua,
    v_route,
    v_request_id,
    v_changed,
    NOW()
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- PART 4 — Attach the trigger to high-value tables.
-- Order matters only for readability.
-- ============================================================================

DROP TRIGGER IF EXISTS audit_trg ON "User";
CREATE TRIGGER audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON "User"
  FOR EACH ROW EXECUTE FUNCTION app_audit_trigger();

DROP TRIGGER IF EXISTS audit_trg ON "Organization";
CREATE TRIGGER audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON "Organization"
  FOR EACH ROW EXECUTE FUNCTION app_audit_trigger();

DROP TRIGGER IF EXISTS audit_trg ON "Staff";
CREATE TRIGGER audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON "Staff"
  FOR EACH ROW EXECUTE FUNCTION app_audit_trigger();

DROP TRIGGER IF EXISTS audit_trg ON "Transaction";
CREATE TRIGGER audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON "Transaction"
  FOR EACH ROW EXECUTE FUNCTION app_audit_trigger();

DROP TRIGGER IF EXISTS audit_trg ON "Client";
CREATE TRIGGER audit_trg
  AFTER INSERT OR UPDATE OR DELETE ON "Client"
  FOR EACH ROW EXECUTE FUNCTION app_audit_trigger();

-- ============================================================================
-- Helper view for ops: most recent audit events per tenant.
-- Read-only. Useful for dashboards and SOC 2 evidence collection.
-- ============================================================================

CREATE OR REPLACE VIEW v_recent_audit AS
SELECT
  id,
  "createdAt" AS at,
  "organizationId" AS org_id,
  "userId" AS actor_user_id,
  action,
  entity,
  "entityId" AS entity_id,
  "changedFields" AS changed,
  route,
  "requestId" AS request_id,
  "ipAddress" AS ip
FROM "AuditLog"
ORDER BY "createdAt" DESC
LIMIT 1000;

COMMENT ON FUNCTION app_audit_trigger IS 'Generic audit trigger. Attach to any table; reads actor and tenant context from app.* session vars set by withTenantScope.';
