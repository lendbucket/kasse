-- ============================================================
-- DEPLOYMENT NOTE: This migration MUST run as the postgres role.
-- ============================================================
-- The CREATE POLICY statements below target storage.objects, which
-- lives in the storage schema. The kasse_app role does NOT have
-- CREATE permission on storage.objects.
--
-- Applied via Supabase MCP using the postgres superuser on 2026-05-20,
-- BEFORE merging this PR. The file is committed to prisma/migrations/
-- for documentation only — DO NOT let `prisma migrate deploy` re-run
-- this in CI/CD.
--
-- If you need to roll back or re-apply, do it via Supabase MCP or
-- the Supabase dashboard SQL editor, connecting as postgres.
-- ============================================================
--
-- P1.A.7-b: Create kasse-agreements storage bucket.
--
-- Bucket organization: kasse-agreements/<orgId>/<agreementId>/<filename>
--   - unsigned.pdf — generated when owner triggers send (this PR)
--   - signed.pdf   — generated when staff signs (P1.A.7-c)
--
-- The bucket is PRIVATE (no public read). All access goes through
-- signed URLs minted by the backend using the service role key.
--
-- This is the FIRST place we touch Supabase Storage. See
-- docs/RLS_AUDIT.md "P1.A.7-b — Supabase Storage Integration"
-- for the architectural rationale and the SUPABASE_SERVICE_ROLE_KEY
-- bypass exception.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kasse-agreements',
  'kasse-agreements',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Service role full access (backend uploads, regenerations, deletes)
CREATE POLICY "service_role_all_access_kasse_agreements"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'kasse-agreements')
  WITH CHECK (bucket_id = 'kasse-agreements');

-- Authenticated read for org's own path
CREATE POLICY "authenticated_read_own_org_kasse_agreements"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kasse-agreements'
    AND (
      (current_setting('app.is_superadmin', true) = 'true')
      OR ((string_to_array(name, '/'))[1] = current_setting('app.current_org_id', true))
    )
  );
