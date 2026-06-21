import { NextResponse } from 'next/server';
import { acceptStaffInvitation } from '@/lib/onboarding/staff-invites';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json(
        { error: 'token_required', message: 'Invitation token is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (typeof password !== 'string' || !password) {
      return NextResponse.json(
        { error: 'password_required', message: 'Password is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const result = await acceptStaffInvitation({
      rawToken: token,
      password,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { ok: true, email: result.email },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status: onboardingErrorStatus(err.code), headers: { 'Cache-Control': 'no-store' } }
      );
    }
    console.error('[staff-accept] unexpected error', err);
    return NextResponse.json(
      { error: 'internal_error', message: 'Something went wrong. Please try again.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
