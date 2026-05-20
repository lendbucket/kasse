import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { withTenantScope } from '@/lib/tenant/db-scope';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { createStaffInvitation } from '@/lib/onboarding/staff-invites';
import { transitionTo } from '@/lib/onboarding/sessions';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';
import { renderStaffInviteEmail } from '@/lib/onboarding/emails/staff-invite';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = 'Kasse <onboarding@kasseapp.com>';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_ONBOARDING_BASE_URL
    ?? 'https://signup.kasseapp.com';
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }
    if (!session.user.organizationId) {
      return NextResponse.json(
        {
          error: 'org_not_in_session',
          message: 'Call /api/onboarding/refresh-session before inviting staff.',
        },
        { status: 409 }
      );
    }
    if (!session.user.email) {
      return NextResponse.json(
        { error: 'invalid_session', message: 'session missing email' },
        { status: 401 }
      );
    }
    if (!session.user.role) {
      return NextResponse.json(
        { error: 'invalid_session', message: 'session missing role' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId, skip, email, name, role } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const userAgent = req.headers.get('user-agent') ?? null;

    // Look up locationId from the onboarding session
    const onboardingSession = await prismaAdmin.onboardingSession.findUnique({
      where: { id: sessionId },
      select: { locationId: true },
    });
    if (!onboardingSession?.locationId) {
      return NextResponse.json(
        { error: 'location_not_yet_created', message: 'location must be created before inviting staff' },
        { status: 409 }
      );
    }

    const ctx = tenantCtxFromSession({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organizationId: session.user.organizationId,
      locationId: session.user.locationId ?? null,
    });

    const result = await withTenantScope(prisma, ctx, async (tx) => {
      return createStaffInvitation({
        tx,
        input: {
          sessionId,
          organizationId: session.user.organizationId!,
          locationId: onboardingSession.locationId!,
          skip: skip === true,
          email: typeof email === 'string' ? email : undefined,
          name: typeof name === 'string' ? name : undefined,
          role: role === 'STAFF' ? 'STAFF' : undefined,
        },
        authenticatedUserId: session.user.id,
        ipAddress,
        userAgent,
      });
    });

    // Tenant tx committed. Staff + StaffInvitation rows are visible.
    // The STAFF_PENDING claim already guaranteed exclusivity.
    //
    // Atomicity gap: writes below are NOT atomic with the tenant-scoped
    // writes above. Same gap as /api/onboarding/location and
    // /api/onboarding/services (tracked in issue #95).

    if (result.skipped) {
      // Skip path: advance through STAFF_PENDING → STAFF_INVITED and
      // record the skip in skippedSteps.
      await transitionTo({
        sessionId,
        toState: 'STAFF_INVITED',
        triggeredByUserId: session.user.id,
        metadata: { skipped: true },
      });

      // Record in skippedSteps (skipStep helper doesn't fit here because
      // we're at STAFF_PENDING, not STAFF_INVITED — and STAFF_PENDING is
      // not in SKIPPABLE_STATES by design).
      await prismaAdmin.onboardingSession.update({
        where: { id: sessionId },
        data: {
          skippedSteps: {
            push: 'SERVICES_SEEDED',
          },
        },
      });

      await writeAuditLog({
        userId: session.user.id,
        organizationId: result.organizationId,
        action: AuditAction.ONBOARDING_STAFF_INVITE_SKIPPED,
        entity: 'OnboardingSession',
        entityId: sessionId,
        metadata: { via: 'onboarding', skipped: true },
      });

      return NextResponse.json(
        { skipped: true, state: 'STAFF_INVITED' },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Non-skip path: advance state, send email, write audit log
    await transitionTo({
      sessionId,
      toState: 'STAFF_INVITED',
      triggeredByUserId: session.user.id,
      metadata: {
        staffInvitationId: result.staffInvitationId,
        staffId: result.staffId,
      },
    });

    // Send invitation email
    let emailSent = false;
    if (RESEND_API_KEY && result.rawToken) {
      try {
        const org = await prismaAdmin.organization.findUnique({
          where: { id: result.organizationId },
          select: { name: true },
        });
        const location = await prismaAdmin.location.findUnique({
          where: { id: onboardingSession.locationId! },
          select: { name: true },
        });

        const acceptUrl = `${getBaseUrl()}/staff/accept-invite?token=${result.rawToken}`;
        const emailContent = renderStaffInviteEmail({
          inviterName: session.user.name ?? session.user.email,
          organizationName: org?.name ?? 'your organization',
          locationName: location?.name ?? 'your location',
          inviteeName: body.name,
          acceptUrl,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: RESEND_FROM,
          to: body.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error('staff invite email send failed — non-fatal', emailErr);
      }
    } else if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — staff invite email not sent');
    }

    await writeAuditLog({
      userId: session.user.id,
      organizationId: result.organizationId,
      action: AuditAction.STAFF_INVITATION_SENT,
      entity: 'StaffInvitation',
      entityId: result.staffInvitationId,
      metadata: {
        via: 'onboarding',
        sessionId,
        staffId: result.staffId,
        emailSent,
      },
    });

    const responseBody: Record<string, unknown> = {
      staffInvitationId: result.staffInvitationId,
      staffId: result.staffId,
      state: 'STAFF_INVITED',
      emailSent,
    };

    // In non-production, include rawToken so testing without a real inbox is possible
    if (process.env.NODE_ENV !== 'production' && result.rawToken) {
      responseBody.devRawToken = result.rawToken;
    }

    return NextResponse.json(
      responseBody,
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status: onboardingErrorStatus(err.code) }
      );
    }
    console.error('onboarding staff invite failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
