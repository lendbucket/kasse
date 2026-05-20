import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendAllAgreementsForSession } from '@/lib/onboarding/agreement-send';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/onboarding/agreements/send
 *
 * Owner triggers sending ALL DRAFT EmploymentAgreements at their
 * org+location. For each agreement: renders PDF, uploads to Storage,
 * creates signing token, sends email to the staff member.
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
        { error: 'forbidden', message: 'only OWNER can send agreements' },
        { status: 403 }
      );
    }
    if (!session.user.locationId) {
      return NextResponse.json({ error: 'location_not_yet_created' }, { status: 409 });
    }

    const body = await req.json();
    const { sessionId } = body;
    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const result = await sendAllAgreementsForSession({
      input: {
        sessionId,
        organizationId: session.user.organizationId,
        locationId: session.user.locationId,
        isTest: false,
      },
      authenticatedUserId: session.user.id,
      authenticatedUserEmail: session.user.email,
      ipAddress,
      userAgent,
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
    console.error('POST /api/onboarding/agreements/send failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
