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
const STORAGE_PATH_PREFIX = 'kasse-agreements://';

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('[agreement-storage] SUPABASE_URL is not configured');
  if (!key) throw new Error('[agreement-storage] SUPABASE_SERVICE_ROLE_KEY is not configured');
  return { url: url.replace(/\/$/, ''), key };
}

/**
 * Build a stable storage path marker for EmploymentAgreement.documentUrl.
 * The PDF lives at this path inside the kasse-agreements bucket. Signed
 * download URLs are minted on demand via createSignedDownloadUrl().
 *
 * Format: kasse-agreements://<orgId>/<agreementId>/<filename>
 */
export function buildStoragePathMarker(args: {
  organizationId: string;
  agreementId: string;
  filename: 'unsigned.pdf' | 'signed.pdf';
}): string {
  return `${STORAGE_PATH_PREFIX}${args.organizationId}/${args.agreementId}/${args.filename}`;
}

/**
 * Parse a storage path marker back into its components. Returns null
 * if the input isn't a kasse-agreements storage path marker.
 */
export function parseStoragePathMarker(marker: string): {
  organizationId: string;
  agreementId: string;
  filename: string;
} | null {
  if (!marker.startsWith(STORAGE_PATH_PREFIX)) return null;
  const path = marker.slice(STORAGE_PATH_PREFIX.length);
  const parts = path.split('/');
  if (parts.length !== 3) return null;
  return { organizationId: parts[0], agreementId: parts[1], filename: parts[2] };
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

  // Supabase Storage REST API field name varies by version:
  // - Legacy (storage-api v0.x, v1.x through ~2024): returns signedURL (capital URL)
  // - Modern (storage-api v1.x late 2024+): returns signedUrl (camelCase)
  // Observed dual-field handling needed during P1.A.7-b development on
  // 2026-05-20 against current Supabase Storage REST API. Accept either.
  const data = await res.json() as { signedURL?: string; signedUrl?: string };
  const rawSignedUrl = data.signedURL ?? data.signedUrl;
  if (!rawSignedUrl) {
    throw new Error(
      `[agreement-storage] signed URL response missing both signedURL and signedUrl fields: ${JSON.stringify(data)}`
    );
  }

  const expiresAt = new Date(Date.now() + args.expiresInSec * 1000);

  // The signed URL from Supabase may be a path — prepend the project URL
  const signedUrl = rawSignedUrl.startsWith('http')
    ? rawSignedUrl
    : `${url}/storage/v1${rawSignedUrl}`;

  return { signedUrl, expiresAt };
}
