/**
 * Supabase Storage wrapper for agreement PDFs.
 *
 * Uses the Storage REST API directly via fetch() — we do NOT use the
 * Supabase JS client. Per the standing rule in docs/RLS_AUDIT.md, any
 * introduction of the JS client requires an explicit doc update. Using
 * raw fetch keeps the audit surface small and simple.
 *
 * SUPABASE_SERVICE_ROLE_KEY is used here (and ONLY here) to authenticate
 * as the service_role, which has full access to the kasse-agreements
 * bucket. See docs/RLS_AUDIT.md "P1.A.7-b — Supabase Storage Integration"
 * for the bypass exception.
 */

const BUCKET = 'kasse-agreements';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('[agreement-storage] SUPABASE_URL is not configured');
  if (!key) throw new Error('[agreement-storage] SUPABASE_SERVICE_ROLE_KEY is not configured');
  return { url: url.replace(/\/$/, ''), key };
}

/**
 * Upload a PDF to the kasse-agreements bucket.
 * Path convention: <orgId>/<agreementId>/<filename>
 */
export async function uploadAgreementPDF(args: {
  organizationId: string;
  agreementId: string;
  filename: 'unsigned.pdf' | 'signed.pdf';
  pdfBytes: Buffer;
}): Promise<{ path: string }> {
  const { url, key } = getSupabaseConfig();
  const path = `${args.organizationId}/${args.agreementId}/${args.filename}`;

  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/pdf',
        // Upsert: overwrite if exists (re-sends / regenerations)
        'x-upsert': 'true',
      },
      body: new Uint8Array(args.pdfBytes),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(
      `[agreement-storage] upload failed: ${res.status} ${res.statusText} — ${body}`
    );
  }

  return { path };
}

/**
 * Create a time-limited signed download URL for a stored PDF.
 * The URL is self-contained — the recipient does not need to be
 * authenticated to download it. TTL should match the sign token TTL.
 */
export async function createSignedDownloadUrl(args: {
  path: string;
  expiresInSec: number;
}): Promise<{ signedUrl: string; expiresAt: Date }> {
  const { url, key } = getSupabaseConfig();

  const res = await fetch(
    `${url}/storage/v1/object/sign/${BUCKET}/${args.path}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: args.expiresInSec }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '(no body)');
    throw new Error(
      `[agreement-storage] signed URL creation failed: ${res.status} ${res.statusText} — ${body}`
    );
  }

  const data = await res.json() as { signedURL: string };
  const expiresAt = new Date(Date.now() + args.expiresInSec * 1000);

  // The signedURL from Supabase is a path — prepend the project URL
  const signedUrl = data.signedURL.startsWith('http')
    ? data.signedURL
    : `${url}/storage/v1${data.signedURL}`;

  return { signedUrl, expiresAt };
}
