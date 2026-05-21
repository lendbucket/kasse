import { redirect } from 'next/navigation';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { hashAgreementToken } from '@/lib/onboarding/agreement-tokens';
import {
  parseStoragePathMarker,
  createSignedDownloadUrl,
} from '@/lib/onboarding/agreement-storage';
import SignForm from './sign-form';

const TOKEN_REGEX = /^[0-9a-f]{64}$/;

/**
 * GET /agreements/sign/[token]
 *
 * Public page — the token IS the auth. Staff member arrives here via
 * the signing email sent in P1.A.7-b. Shows PDF preview + signing form.
 *
 * Uses prismaAdmin because this is a public route with no tenant context
 * (same pattern as /api/onboarding/verify). The token hash lookup is
 * scoped by the token itself, not by org.
 */
export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validate token format before any DB query
  if (!TOKEN_REGEX.test(token)) {
    redirect('/agreements/sign/error?reason=invalid');
  }

  const tokenHash = hashAgreementToken(token);

  const tokenRow = await prismaAdmin.agreementSignToken.findUnique({
    where: { tokenHash },
    include: {
      agreement: {
        include: {
          staff: { select: { id: true, name: true, email: true } },
          organization: { select: { name: true } },
        },
      },
    },
  });

  if (!tokenRow) {
    redirect('/agreements/sign/error?reason=invalid');
  }
  if (tokenRow.consumedAt) {
    redirect('/agreements/sign/error?reason=consumed');
  }
  if (tokenRow.expiresAt < new Date()) {
    redirect('/agreements/sign/error?reason=expired');
  }
  if (tokenRow.agreement.status === 'SIGNED') {
    redirect('/agreements/sign/error?reason=consumed');
  }

  // Record viewedAt — race-safe via updateMany WHERE viewedAt IS NULL.
  // Two concurrent GETs both reading viewedAt=null would otherwise produce
  // a last-write-wins overwrite. The WHERE clause makes the first write
  // the only winner. Same pattern as the AgreementSignToken consume step.
  await prismaAdmin.employmentAgreement.updateMany({
    where: {
      id: tokenRow.agreementId,
      viewedAt: null,
    },
    data: { viewedAt: new Date() },
  });

  // Mint a short-lived signed URL for the PDF preview
  const marker = parseStoragePathMarker(tokenRow.agreement.documentUrl);
  let pdfUrl: string | null = null;

  if (marker) {
    const path = `${marker.organizationId}/${marker.agreementId}/${marker.filename}`;
    try {
      const { signedUrl } = await createSignedDownloadUrl({
        path,
        expiresInSec: 3600,
      });
      pdfUrl = signedUrl;
    } catch (err) {
      console.error('[AGREEMENT_SIGN_VIEW] failed to mint PDF preview URL', {
        agreementId: tokenRow.agreementId,
        errorName: err instanceof Error ? err.name : 'unknown',
      });
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f7f8fa', padding: '48px 0' }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
            Review and Sign Your Agreement
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>
            {tokenRow.agreement.organization.name} sent you an employment
            agreement to review and sign.
          </p>

          {pdfUrl ? (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              marginBottom: 24,
              overflow: 'hidden',
            }}>
              <iframe
                src={pdfUrl}
                title="Employment Agreement PDF"
                style={{ width: '100%', height: 600, border: 'none' }}
              />
            </div>
          ) : (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 24,
              fontSize: 13,
              color: '#991b1b',
            }}>
              PDF preview is not available. You can still sign the agreement below.
            </div>
          )}

          <SignForm
            token={token}
            staffName={tokenRow.agreement.staff.name ?? ''}
            agreementTitle={tokenRow.agreement.documentTitle}
            organizationName={tokenRow.agreement.organization.name}
          />
        </div>
      </div>
    </main>
  );
}
