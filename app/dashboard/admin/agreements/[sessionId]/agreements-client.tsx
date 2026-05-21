'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Agreement {
  id: string;
  staffId: string;
  staffName: string | null;
  staffEmail: string | null;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  tokenConsumedButNotSigned: boolean;
}

interface SigningProgress {
  total: number;
  signedCount: number;
  sentNotSignedCount: number;
  draftCount: number;
  agreements: Agreement[];
}

export default function AgreementsClient({
  sessionId,
  initialProgress,
}: {
  sessionId: string;
  initialProgress: SigningProgress;
}) {
  const router = useRouter();
  const [progress] = useState(initialProgress);
  const [reissuingId, setReissuingId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSigned = progress.total > 0 && progress.signedCount === progress.total;
  const someUnsigned = progress.sentNotSignedCount > 0 || progress.draftCount > 0;

  async function handleReissue(agreementId: string) {
    setReissuingId(agreementId);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/agreements/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, agreementId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Re-issue failed');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setReissuingId(null);
    }
  }

  async function handleComplete(force: boolean) {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding/session-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, force }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Complete failed');
        return;
      }
      if (data.advanced) {
        setIsCompleted(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else if (data.reason === 'not_all_signed') {
        setError(`${data.signedCount} of ${data.total} signed — not all agreements signed yet.`);
      } else {
        setError(`Not advanced: ${data.reason}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCompleting(false);
      setShowForceConfirm(false);
    }
  }

  if (isCompleted) {
    return (
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
          Onboarding Complete
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Agreement list */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        {progress.agreements.map((a, idx) => (
          <div
            key={a.id}
            style={{
              padding: 16,
              borderBottom: idx === progress.agreements.length - 1 ? 'none' : '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                {a.staffName ?? '(unnamed)'}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {a.staffEmail ?? 'no email'}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                Status: <strong>{a.status}</strong>
                {a.viewedAt && <> &middot; Viewed</>}
                {a.signedAt && <> &middot; Signed {new Date(a.signedAt).toLocaleString()}</>}
                {a.tokenConsumedButNotSigned && (
                  <span style={{ color: '#991b1b', marginLeft: 8 }}>
                    &middot; Token consumed but not signed (re-issue needed)
                  </span>
                )}
              </div>
            </div>
            {a.status === 'SENT' && (
              <button
                type="button"
                onClick={() => handleReissue(a.id)}
                disabled={reissuingId === a.id}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#ffffff',
                  background: reissuingId === a.id ? '#9ca3af' : '#606E74',
                  border: 'none',
                  borderRadius: 8,
                  cursor: reissuingId === a.id ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {reissuingId === a.id ? 'Re-issuing...' : 'Re-issue link'}
              </button>
            )}
          </div>
        ))}
        {progress.agreements.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            No agreements were created for this session.
          </div>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 13,
          color: '#991b1b',
        }}>
          {error}
        </div>
      )}

      {/* Completion CTAs */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
      }}>
        {allSigned ? (
          <>
            <p style={{ fontSize: 14, color: '#111827', marginBottom: 12 }}>
              All agreements are signed. You can finish setting up your salon.
            </p>
            <button
              type="button"
              onClick={() => handleComplete(false)}
              disabled={completing}
              style={{
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                background: completing ? '#9ca3af' : '#606E74',
                border: 'none',
                borderRadius: 8,
                cursor: completing ? 'not-allowed' : 'pointer',
              }}
            >
              {completing ? 'Completing...' : 'Complete onboarding'}
            </button>
          </>
        ) : someUnsigned ? (
          <>
            <p style={{ fontSize: 14, color: '#111827', marginBottom: 8 }}>
              {progress.sentNotSignedCount} agreement{progress.sentNotSignedCount === 1 ? '' : 's'} waiting for signature.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              You can wait for all staff to sign, or continue setting up your salon and revisit later.
            </p>
            {!showForceConfirm ? (
              <button
                type="button"
                onClick={() => setShowForceConfirm(true)}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#606E74',
                  background: '#ffffff',
                  border: '1px solid #606E74',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Continue without waiting
              </button>
            ) : (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: 8,
                padding: 16,
              }}>
                <p style={{ fontSize: 13, color: '#92400e', marginBottom: 12 }}>
                  Continue setup without all signatures? The unsigned agreements will
                  remain pending — staff can sign whenever.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleComplete(true)}
                    disabled={completing}
                    style={{
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      background: '#92400e',
                      border: 'none',
                      borderRadius: 8,
                      cursor: completing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {completing ? 'Completing...' : 'Yes, continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForceConfirm(false)}
                    disabled={completing}
                    style={{
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#6b7280',
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : progress.total === 0 ? (
          <>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
              No agreements were created during onboarding. You can complete onboarding now.
            </p>
            <button
              type="button"
              onClick={() => handleComplete(false)}
              disabled={completing}
              style={{
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                background: completing ? '#9ca3af' : '#606E74',
                border: 'none',
                borderRadius: 8,
                cursor: completing ? 'not-allowed' : 'pointer',
              }}
            >
              {completing ? 'Completing...' : 'Complete onboarding'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
