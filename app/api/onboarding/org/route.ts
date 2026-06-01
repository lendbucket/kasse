import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateOrgForOnboarding } from '@/lib/onboarding/org';
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
    const { sessionId, vertical, legalName, dbaName, displayName } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }
    if (typeof vertical !== 'string' || !vertical) {
      return NextResponse.json({ error: 'vertical_required' }, { status: 400 });
    }
    if (typeof legalName !== 'string' || !legalName) {
      return NextResponse.json({ error: 'legal_name_required' }, { status: 400 });
    }
    if (typeof displayName !== 'string' || !displayName) {
      return NextResponse.json({ error: 'display_name_required' }, { status: 400 });
    }

    const result = await updateOrgForOnboarding({
      input: {
        sessionId,
        vertical,
        legalName,
        dbaName: typeof dbaName === 'string' ? dbaName : undefined,
        displayName,
      },
      authenticatedUserId: session.user.id,
    });

    return NextResponse.json(
      {
        organizationId: result.organizationId,
        state: 'ORG_CREATED',
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === 'INVALID_VERTICAL' ? 400
        : err.code === 'INVALID_ORG_NAME' ? 400
        : err.code === 'ORG_SCOPE_MISMATCH' ? 403
        : err.code === 'ORG_NOT_YET_CREATED' ? 409
        : err.code === 'SESSION_COMPLETED' ? 409
        : err.code === 'INVALID_TRANSITION' ? 409
        : err.code === 'SESSION_NOT_FOUND' ? 404
        : 400;
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status }
      );
    }
    console.error('onboarding org update failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
