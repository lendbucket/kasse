import { NextResponse } from 'next/server';
import { sendMagicLink } from '@/lib/onboarding/magic-link';
import { OnboardingError } from '@/lib/onboarding/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email;
    if (typeof email !== 'string') {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent');
    const referrer = req.headers.get('referer');

    const result = await sendMagicLink({ email, ipAddress, userAgent, referrer });
    return NextResponse.json(
      {
        sessionId: result.sessionId,
        expiresAt: result.expiresAt.toISOString(),
        ...(result.devVerificationUrl
          ? { devVerificationUrl: result.devVerificationUrl }
          : {}),
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === 'INVALID_EMAIL' ? 400
        : err.code === 'TOO_MANY_MAGIC_LINK_SENDS' ? 429
        : 400;
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status }
      );
    }
    console.error('onboarding email send failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
