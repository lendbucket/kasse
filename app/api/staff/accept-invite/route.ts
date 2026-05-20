import { NextResponse } from 'next/server';
import { acceptStaffInvitation } from '@/lib/onboarding/staff-invites';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_ONBOARDING_BASE_URL
    ?? 'https://signup.kasseapp.com';
}

/**
 * POST /api/staff/accept-invite
 *
 * Public route — the invitee has no User account yet at the time of
 * acceptance. Auth is the invitation token itself.
 *
 * BYPASS_NEEDED — PRE_SESSION: invitee has no JWT, no organizationId in
 * context. All writes go through prismaAdmin (see acceptStaffInvitation).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (typeof token !== 'string' || !token) {
      return NextResponse.json({ error: 'token_required' }, { status: 400 });
    }
    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'password_required' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    const result = await acceptStaffInvitation({
      rawToken: token,
      password,
      ipAddress,
      userAgent,
    });

    await writeAuditLog({
      userId: result.userId,
      organizationId: result.organizationId,
      action: AuditAction.STAFF_INVITATION_ACCEPTED,
      entity: 'StaffInvitation',
      entityId: null,
      metadata: {
        staffId: result.staffId,
        // email REMOVED — PII. staffId is sufficient for audit lookups.
        // Email is recoverable via Staff → User join if needed for investigation.
      },
    });

    return NextResponse.json(
      {
        userId: result.userId,
        staffId: result.staffId,
        organizationId: result.organizationId,
        email: result.email,
        signinUrl: `${getBaseUrl()}/signin?email=${encodeURIComponent(result.email)}`,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status: onboardingErrorStatus(err.code) }
      );
    }
    console.error('staff invite accept failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
