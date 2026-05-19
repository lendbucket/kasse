import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOrgForOnboarding } from '@/lib/onboarding/org';
import { OnboardingError } from '@/lib/onboarding/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, orgName, planTier } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }
    if (typeof orgName !== 'string' || !orgName) {
      return NextResponse.json({ error: 'org_name_required' }, { status: 400 });
    }
    if (typeof planTier !== 'string' || !planTier) {
      return NextResponse.json({ error: 'plan_tier_required' }, { status: 400 });
    }

    const result = await createOrgForOnboarding({
      input: {
        sessionId,
        orgName,
        planTier,
        vertical: 'SALON',
      },
      authenticatedUserId: session.user.id,
    });

    return NextResponse.json(
      {
        organizationId: result.organizationId,
        state: 'ORG_CREATED',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === 'INVALID_PLAN_TIER' ? 400
        : err.code === 'INVALID_VERTICAL' ? 400
        : err.code === 'INVALID_ORG_NAME' ? 400
        // SLUG_COLLISION is transient — the slug suffix is random and a fresh
        // retry succeeds. 503 is semantically correct: service-temporarily-
        // can't-fulfill, not a user-input conflict. UI should auto-retry.
        : err.code === 'SLUG_COLLISION' ? 503
        : err.code === 'ORG_SCOPE_MISMATCH' ? 403
        : err.code === 'INVALID_TRANSITION' ? 409
        : err.code === 'SESSION_NOT_FOUND' ? 404
        : 400;
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status }
      );
    }
    console.error('onboarding org create failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
