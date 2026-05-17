-- P0 security follow-up: schema-qualify table + function references inside app_audit_trigger.
--
-- PR #69 locked search_path = '' on this function but the body uses
-- unqualified "AuditLog" and gen_random_uuid() references which fail
-- under locked search_path.
--
-- Fix: schema-qualify all references inside the function body.
--   "AuditLog" → "public"."AuditLog"
--   gen_random_uuid() → pg_catalog.gen_random_uuid()
--
-- Function signature, SECURITY DEFINER, and SET search_path = '' stay
-- unchanged. Only the body changes.

CREATE OR REPLACE FUNCTION public.app_audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    FOR k IN SELECT jsonb_object_keys(v_after) LOOP
      IF (v_before->k) IS DISTINCT FROM (v_after->k) THEN
        v_changed := array_append(v_changed, k);
      END IF;
    END LOOP;
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'DELETE';
    v_before := to_jsonb(OLD);
    v_id_value := COALESCE(v_before->>'id', '');
    v_org_value := v_before->>'organizationId';
  END IF;

  v_actor_id    := NULLIF(current_setting('app.actor_user_id', true), '');
  v_actor_email := NULLIF(current_setting('app.actor_email',   true), '');
  v_actor_ip    := NULLIF(current_setting('app.actor_ip',      true), '');
  v_actor_ua    := NULLIF(current_setting('app.actor_ua',      true), '');
  v_request_id  := NULLIF(current_setting('app.request_id',    true), '');
  v_route       := NULLIF(current_setting('app.route',         true), '');

  v_org_id := COALESCE(v_org_value, NULLIF(current_setting('app.current_org_id', true), ''));

  INSERT INTO "public"."AuditLog" (
    "id", "userId", "organizationId", "action", "entity", "entityId",
    "before", "after", "ipAddress", "userAgent", "route", "requestId",
    "changedFields", "createdAt"
  ) VALUES (
    'al_' || replace(pg_catalog.gen_random_uuid()::text, '-', ''),
    v_actor_id, v_org_id, v_action, v_entity, NULLIF(v_id_value, ''),
    v_before, v_after, v_actor_ip, v_actor_ua, v_route, v_request_id,
    v_changed, NOW()
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;
