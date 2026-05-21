import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { reissueAgreementSignToken } from '@/lib/onboarding/agreement-completion';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/onboarding/agreements/resend
 *
 * Owner re-issues a signing token for a single SENT agreement. Covers
 * DEGRADED, COMMIT_FAILED, and stale/expired token recovery.
 * Body: { sessionId: string, agreementId: string }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }
    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'org_not_in_session' }, { status: 409 });
    }
    if (!session.user.email || !session.user.role) {
      return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    }
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'forbidden', message: 'only OWNER can re-issue agreements' },
        { status: 403 }
      );
    }
    if (!session.user.locationId) {
      return NextResponse.json({ error: 'location_not_yet_created' }, { status: 409 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const sessionId =
      typeof body === 'object' && body !== null && 'sessionId' in body
        ? String((body as { sessionId: unknown }).sessionId)
        : '';
    const agreementId =
      typeof body === 'object' && body !== null && 'agreementId' in body
        ? String((body as { agreementId: unknown }).agreementId)
        : '';

    if (!sessionId) return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    if (!agreementId) return NextResponse.json({ error: 'agreement_id_required' }, { status: 400 });

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const ctx = tenantCtxFromSession({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organizationId: session.user.organizationId,
      locationId: session.user.locationId ?? null,
    });

    const result = await reissueAgreementSignToken({
      prisma,
      ctx,
      input: {
        sessionId,
        agreementId,
        organizationId: session.user.organizationId,
        locationId: session.user.locationId,
      },
      authenticatedUserId: session.user.id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { result: result.result, expiresAt: result.expiresAt.toISOString() },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status: onboardingErrorStatus(err.code) }
      );
    }
    console.error('POST /api/onboarding/agreements/resend failed', {
      errorName: err instanceof Error ? err.name : 'unknown',
    });
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
