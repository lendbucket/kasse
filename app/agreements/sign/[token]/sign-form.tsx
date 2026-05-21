'use client';

import { useState } from 'react';

interface SignFormProps {
  token: string;
  staffName: string;
  agreementTitle: string;
  organizationName: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  color: '#111827',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const ERROR_MESSAGES: Record<string, string> = {
  token_already_consumed: 'This agreement has already been signed.',
  session_expired: 'This signing link has expired.',
  invalid_token: 'This signing link is not valid.',
  name_mismatch: 'The typed name does not match the name on file.',
  state_mismatch: 'This agreement is not in a signable state.',
  sign_commit_failed:
    'Your signature could not be saved. Please contact your employer ' +
    'to have a new signing link sent.',
};

export default function SignForm({
  token,
  staffName,
  agreementTitle,
  organizationName,
}: SignFormProps) {
  const [typedName, setTypedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedAt, setSignedAt] = useState<Date | null>(null);

  const canSubmit = typedName.trim().length > 0 && agreed && !submitting;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/agreements/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typedName: typedName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setSignedAt(new Date(data.signedAt));
      } else {
        const data = await res.json().catch(() => ({ message: 'unknown error' }));
        const errCode = data.error ?? 'unknown';
        setError(ERROR_MESSAGES[errCode] ?? data.message ?? 'Failed to sign');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (signedAt) {
    return (
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
          Signature Recorded
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>
          Signed by {typedName} on {signedAt.toLocaleString()}
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          You can close this page. A copy of the signed agreement will be
          available from your employer.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 4 }}>
          Type your full name to sign
        </label>
        <input
          type="text"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          disabled={submitting}
          style={inputStyle}
          placeholder="e.g., Jane Doe"
        />
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>
          On file: {staffName || '(no name set)'}
        </p>
      </div>

      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        cursor: 'pointer',
        marginBottom: 16,
      }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={submitting}
          style={{ marginTop: 3 }}
        />
        <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>
          I am {typedName.trim() || '[typed name]'} and I agree to be bound
          by this agreement. This typed signature has the same legal effect
          as a handwritten signature.
        </span>
      </label>

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

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '10px 16px',
          fontSize: 14,
          fontWeight: 600,
          color: '#ffffff',
          background: canSubmit ? '#606E74' : '#9ca3af',
          border: 'none',
          borderRadius: 8,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'background 0.15s',
        }}
      >
        {submitting ? 'Signing...' : 'Sign Agreement'}
      </button>
    </div>
  );
}
