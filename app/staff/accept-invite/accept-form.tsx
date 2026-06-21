'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, CheckCircle2, User } from 'lucide-react';
const MIN_PASSWORD_LENGTH = 12;

/**
 * Client-side password hint only — mirrors lib/onboarding/account.ts.
 * Server is the source of truth; this avoids importing server-only modules.
 */
function validatePassword(password: string): string | null {
  if (typeof password !== 'string') return 'password is required';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > 200) {
    return 'password is too long (max 200 chars)';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'password must contain at least one letter';
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return 'password must contain at least one number or special character';
  }
  return null;
}

interface Props {
  token: string;
}

type FormPhase = 'form' | 'fatal';

const FATAL_ERRORS: Record<string, { heading: string; body: string; showLogin: boolean }> = {
  invite_not_found: {
    heading: 'Invite link is no longer valid',
    body: 'This invite link is no longer valid. Ask your manager to resend it.',
    showLogin: false,
  },
  invite_expired: {
    heading: 'Invite link is no longer valid',
    body: 'This invite link has expired. Ask your manager to resend it.',
    showLogin: false,
  },
  invite_already_accepted: {
    heading: 'Invite already used',
    body: 'This invite was already used. Try logging in instead.',
    showLogin: true,
  },
  invite_email_already_user: {
    heading: 'Account already exists',
    body: 'An account already exists for this email. Log in instead.',
    showLogin: true,
  },
};

export default function AcceptForm({ token }: Props) {
  const router = useRouter();
  const inFlightRef = useRef(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<FormPhase>('form');
  const [fatalKey, setFatalKey] = useState<string | null>(null);

  const clientHint = password ? validatePassword(password) : null;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    password.length > 0 &&
    confirm.length > 0 &&
    !mismatch &&
    !clientHint &&
    !submitting;

  async function handleSubmit() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/onboarding/staff-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.status === 201) {
        const data = await res.json();
        const email = data.email ?? '';
        router.push(`/login?email=${encodeURIComponent(email)}&accepted=1`);
        return;
      }

      const data = await res.json().catch(() => ({ error: 'unknown', message: '' }));
      const errCode = data.error ?? 'unknown';

      if (FATAL_ERRORS[errCode]) {
        setFatalKey(errCode);
        setPhase('fatal');
        return;
      }

      if (errCode === 'password_too_weak') {
        setError(data.message || 'Password does not meet requirements.');
        return;
      }

      if (res.status >= 500) {
        setError('Something went wrong. Please try again.');
      } else {
        setError(data.message || 'Could not create your account. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
      inFlightRef.current = false;
    }
  }

  if (phase === 'fatal' && fatalKey && FATAL_ERRORS[fatalKey]) {
    const info = FATAL_ERRORS[fatalKey];
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--error-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertCircle size={24} strokeWidth={1.5} style={{ color: 'var(--error)' }} />
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.31px',
            margin: '0 0 8px',
          }}
        >
          {info.heading}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
          {info.body}
        </p>
        {info.showLogin && (
          <a
            href="/login"
            className="btn btn-primary"
            style={{ height: 44, padding: '0 24px', textDecoration: 'none' }}
          >
            Go to login
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--brand-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <User size={24} strokeWidth={1.5} style={{ color: 'var(--brand)' }} />
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.31px',
            margin: '0 0 6px',
          }}
        >
          Set up your account
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Create a password to join your team on Kasse.
        </p>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            background: 'var(--error-soft)',
            border: '1px solid var(--error)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--error)',
            lineHeight: 1.5,
          }}
        >
          <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Password */}
      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="password"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          <Lock size={14} strokeWidth={1.5} />
          Password
        </label>
        <input
          id="password"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          placeholder="At least 12 characters"
          autoComplete="new-password"
        />
        {clientHint && password.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--error)', margin: '4px 0 0', lineHeight: 1.4 }}>
            {clientHint}
          </p>
        )}
        {!clientHint && password.length >= 12 && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--success)',
              margin: '4px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle2 size={12} strokeWidth={1.5} />
            Password meets requirements
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div style={{ marginBottom: 24 }}>
        <label
          htmlFor="confirm-password"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          <Lock size={14} strokeWidth={1.5} />
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={submitting}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />
        {mismatch && (
          <p style={{ fontSize: 12, color: 'var(--error)', margin: '4px 0 0' }}>
            Passwords don&apos;t match
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          height: 52,
          fontSize: 15,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          opacity: canSubmit ? 1 : 0.55,
        }}
      >
        {submitting ? 'Creating account\u2026' : 'Create account & continue'}
      </button>
    </div>
  );
}
