import { NextResponse } from 'next/server';
import { verifyResumeToken } from '@/lib/onboarding/resume-token';
import { createAccount } from '@/lib/onboarding/account';
import { OnboardingError } from '@/lib/onboarding/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeToken = body?.resumeToken;
    const password = body?.password;

    if (typeof resumeToken !== 'string' || !resumeToken) {
      return NextResponse.json(
        { error: 'resume_token_required' },
        { status: 400 }
      );
    }
    if (typeof password !== 'string' || !password) {
      return NextResponse.json(
        { error: 'password_required' },
        { status: 400 }
      );
    }

    // Verify resume token + load session
    const { sessionId } = await verifyResumeToken(resumeToken);

    // Create account (validates password, hashes, creates User, transitions session)
    const { userId } = await createAccount({ sessionId, password });

    return NextResponse.json(
      {
        sessionId,
        userId,
        state: 'ACCOUNT_CREATED',
        message: 'Account created. Next: log in to continue onboarding.',
      },
      {
        status: 201,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === 'PASSWORD_TOO_WEAK' ? 400
        : err.code === 'INVALID_TOKEN' ? 401
        : err.code === 'SESSION_EXPIRED' ? 410
        : err.code === 'EMAIL_ALREADY_REGISTERED' ? 409
        : err.code === 'DUPLICATE_ACTIVE_SESSION' ? 409
        : err.code === 'INVALID_TRANSITION' ? 409
        : 400;
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status }
      );
    }
    console.error('onboarding password failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
