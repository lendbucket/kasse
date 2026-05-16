-- P0 security hardening: tenant/audit helper functions
--
-- Combines two MCP-applied migrations into one rollup file for fresh-clone
-- reproducibility:
--   - 20260516180000_p0_security_fix_lock_search_path_and_revoke_rpc
--   - 20260516180001_p0_security_fix_revoke_public_execute_on_definer_fns
--
-- Two security findings addressed:
-- 1. Lock search_path on 9 helper functions to prevent name-resolution attacks
-- 2. Revoke PUBLIC EXECUTE on the 5 mutating SECURITY DEFINER functions to
--    close the /rest/v1/rpc/* privilege escalation vector (anon and
--    authenticated roles inherit from PUBLIC; revoking PUBLIC is the
--    correct fix). kasse_app (Prisma role) and postgres (admin) keep
--    EXECUTE so app code is unaffected.
--
-- The read-only functions (app_current_org_id, app_is_superadmin,
-- app_actor_user_id, app_request_id) keep PUBLIC EXECUTE since they only
-- return the caller's own session state.

-- A. Lock search_path on all 9 helper functions
ALTER FUNCTION public.app_set_tenant(text, boolean) SET search_path = '';
ALTER FUNCTION public.app_clear_tenant() SET search_path = '';
ALTER FUNCTION public.app_current_org_id() SET search_path = '';
ALTER FUNCTION public.app_is_superadmin() SET search_path = '';
ALTER FUNCTION public.app_set_actor(text, text, text, text, text, text) SET search_path = '';
ALTER FUNCTION public.app_clear_actor() SET search_path = '';
ALTER FUNCTION public.app_actor_user_id() SET search_path = '';
ALTER FUNCTION public.app_request_id() SET search_path = '';
ALTER FUNCTION public.app_audit_trigger() SET search_path = '';

-- B. Revoke PUBLIC EXECUTE on the 5 mutating SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.app_set_tenant(text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.app_clear_tenant() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.app_set_actor(text, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.app_clear_actor() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.app_audit_trigger() FROM PUBLIC;

-- C. Ensure kasse_app retains EXECUTE on functions it needs (defensive)
GRANT EXECUTE ON FUNCTION public.app_set_tenant(text, boolean) TO kasse_app;
GRANT EXECUTE ON FUNCTION public.app_clear_tenant() TO kasse_app;
GRANT EXECUTE ON FUNCTION public.app_set_actor(text, text, text, text, text, text) TO kasse_app;
GRANT EXECUTE ON FUNCTION public.app_clear_actor() TO kasse_app;
