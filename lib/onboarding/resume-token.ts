import jwt from 'jsonwebtoken';
import {
  type ResumeTokenPayload,
  type OnboardingState,
  OnboardingError,
} from './types';
import { getSessionById } from './sessions';

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  const secret = process.env.ONBOARDING_RESUME_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ONBOARDING_RESUME_SECRET is not configured or is too short (need 32+ chars)'
    );
  }
  return secret;
}

export function signResumeToken(args: {
  sessionId: string;
  email: string;
  state: OnboardingState;
  ttlSeconds?: number;
}): string {
  const ttl = args.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const payload: Omit<ResumeTokenPayload, 'iat' | 'exp'> = {
    sub: args.sessionId,
    email: args.email,
    state: args.state,
    type: 'onboarding-resume',
  };
  return jwt.sign(payload, getSecret(), { expiresIn: ttl });
}

export async function verifyResumeToken(token: string): Promise<{
  sessionId: string;
  email: string;
}> {
  let decoded: ResumeTokenPayload;
  try {
    decoded = jwt.verify(token, getSecret()) as ResumeTokenPayload;
  } catch {
    throw new OnboardingError('INVALID_TOKEN', 'resume token invalid or expired');
  }

  if (decoded.type !== 'onboarding-resume') {
    throw new OnboardingError('INVALID_TOKEN', 'token type mismatch');
  }

  const session = await getSessionById(decoded.sub);
  if (!session) {
    throw new OnboardingError('SESSION_NOT_FOUND', 'session referenced by token does not exist');
  }
  if (session.expiresAt < new Date()) {
    throw new OnboardingError('SESSION_EXPIRED', 'session expired');
  }
  if (session.state === 'COMPLETED') {
    throw new OnboardingError('SESSION_COMPLETED', 'session already completed');
  }
  if (session.email !== decoded.email) {
    throw new OnboardingError('EMAIL_MISMATCH', 'token email does not match session');
  }

  return { sessionId: decoded.sub, email: decoded.email };
}

export { DEFAULT_TTL_SECONDS };
