import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLocationForOnboarding } from '@/lib/onboarding/location';
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

    // Trust chain for organizationId verification:
    // 1. authenticatedUserId comes from the NextAuth session (server-verified)
    // 2. organizationId comes from the request body (CLIENT-controlled)
    // 3. createLocationForOnboarding loads the OnboardingSession via sessionId
    //    (also client-controlled) but enforces:
    //      a. session.userId === authenticatedUserId  → user owns the session
    //      b. session.organizationId === input.organizationId  → org match
    // (a) prevents using a session that belongs to someone else.
    // (b) prevents creating a Location under an org that isn't the session's.
    // Future refactor: pull organizationId from the OnboardingSession directly
    // once JWT staleness is solved in P1.A.8, eliminating the body parameter.
    const {
      sessionId,
      organizationId,
      locationName,
      address,
      city,
      state,
      zip,
      timezone,
    } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }
    if (typeof organizationId !== 'string' || !organizationId) {
      return NextResponse.json({ error: 'organization_id_required' }, { status: 400 });
    }

    const result = await createLocationForOnboarding({
      input: {
        sessionId,
        organizationId,
        locationName,
        address,
        city,
        state,
        zip,
        timezone,
      },
      authenticatedUserId: session.user.id,
    });

    return NextResponse.json(
      {
        locationId: result.locationId,
        state: 'LOCATION_CREATED',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === 'INVALID_ADDRESS' ? 400
        : err.code === 'INVALID_LOCATION_NAME' ? 400
        : err.code === 'INVALID_TIMEZONE' ? 400
        : err.code === 'ORG_NOT_YET_CREATED' ? 409
        : err.code === 'ORG_SCOPE_MISMATCH' ? 403
        : err.code === 'INVALID_TRANSITION' ? 409
        : err.code === 'SESSION_NOT_FOUND' ? 404
        : 400;
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status }
      );
    }
    console.error('onboarding location create failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
