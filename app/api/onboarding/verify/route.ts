import { NextResponse } from 'next/server';
import { consumeToken } from '@/lib/onboarding/verification-tokens';
import { transitionTo } from '@/lib/onboarding/sessions';
import { signResumeToken } from '@/lib/onboarding/resume-token';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { OnboardingError } from '@/lib/onboarding/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;
    if (typeof token !== 'string' || token.length < 32) {
      return NextResponse.json(
        { error: 'invalid_token', message: 'token is required' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent');

    const consumed = await consumeToken({
      rawToken: token,
      expectedPurpose: 'EMAIL_VERIFICATION',
      ipAddress,
      userAgent,
    });

    // Load session to get current state
    const session = await prismaAdmin.onboardingSession.findUnique({
      where: { id: consumed.sessionId },
    });
    if (!session) {
      return NextResponse.json(
        { error: 'session_not_found' },
        { status: 404 }
      );
    }

    // If session is already at EMAIL_VERIFIED (state past STARTED), skip the
    // transition. This handles the narrow case where the consumeToken updateMany
    // won, but a previous request already advanced state and got returned to
    // the user — same user clicking the same link twice (between consume and
    // state-write) gracefully no-ops.
    if (session.state === 'STARTED') {
      await transitionTo({
        sessionId: session.id,
        toState: 'EMAIL_VERIFIED',
      });
    }

    // Issue resume token for the next step (password creation)
    const resumeToken = signResumeToken({
      sessionId: session.id,
      email: session.email,
      state: 'EMAIL_VERIFIED',
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        state: 'EMAIL_VERIFIED',
        resumeToken,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === 'INVALID_TOKEN' ? 400
        : err.code === 'TOKEN_ALREADY_CONSUMED' ? 410
        : err.code === 'SESSION_EXPIRED' ? 410
        : err.code === 'WRONG_TOKEN_PURPOSE' ? 400
        : 400;
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status }
      );
    }
    console.error('onboarding verify failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
