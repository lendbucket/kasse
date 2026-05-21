import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { completeIfAllSigned } from '@/lib/onboarding/agreement-completion';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/onboarding/session-complete
 *
 * Owner finishes onboarding session. Body: { sessionId, force? }
 * - force=false: advance only if all agreements SIGNED (or none exist)
 * - force=true: advance regardless (owner explicitly continues)
 *
 * NOTE: This is distinct from /api/onboarding/complete which handles
 * the merchant application submission (KYC/banking). This route handles
 * the OnboardingSession state machine advance from COMPENSATION_CONFIGURED
 * to COMPLETED.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }
    if (!session.user.organizationId || !session.user.locationId) {
      return NextResponse.json({ error: 'org_or_location_missing' }, { status: 409 });
    }
    if (!session.user.email || !session.user.role) {
      return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    }
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'forbidden', message: 'only OWNER can complete onboarding' },
        { status: 403 }
      );
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
    const force =
      typeof body === 'object' && body !== null && 'force' in body
        ? (body as { force: unknown }).force === true
        : false;

    if (!sessionId) return NextResponse.json({ error: 'session_id_required' }, { status: 400 });

    const ctx = tenantCtxFromSession({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organizationId: session.user.organizationId,
      locationId: session.user.locationId ?? null,
    });

    // prisma is the tenant-scoped instance from @/lib/prisma.
    // completeIfAllSigned wraps reads in withTenantScope and state
    // transitions via transitionTo (withAdminTx) internally.
    const result = await completeIfAllSigned({
      prisma,
      ctx,
      input: {
        sessionId,
        organizationId: session.user.organizationId,
        locationId: session.user.locationId,
        force,
      },
      authenticatedUserId: session.user.id,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    if (err instanceof OnboardingError) {
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status: onboardingErrorStatus(err.code) }
      );
    }
    console.error('POST /api/onboarding/session-complete failed', {
      errorName: err instanceof Error ? err.name : 'unknown',
    });
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
