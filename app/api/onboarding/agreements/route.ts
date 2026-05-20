import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { withTenantScope } from '@/lib/tenant/db-scope';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { createEmploymentAgreementDrafts, VALID_TEMPLATE_TYPES } from '@/lib/onboarding/agreements';
import { transitionTo } from '@/lib/onboarding/sessions';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
          message: 'Call /api/onboarding/refresh-session before configuring agreements.',
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

    // Onboarding is OWNER-only. Even though the helper enforces
    // session.userId === authenticated user (preventing cross-user
    // attacks), a non-OWNER role driving onboarding is incorrect by
    // design. STAFF, MANAGER, FRANCHISE_OWNER, etc. should not be able
    // to advance another role's onboarding flow.
    //
    // NOTE: prior onboarding routes (location, services, staff-invite)
    // do NOT have this check. Retroactive hardening tracked separately —
    // add this check to all prior routes as a follow-up hardening PR.
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        {
          error: 'forbidden',
          message: 'only OWNER role can configure agreements during onboarding',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, skip, templateType, notes } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    if (!session.user.locationId) {
      return NextResponse.json(
        {
          error: 'location_not_yet_created',
          message: 'Call /api/onboarding/refresh-session after location step.',
        },
        { status: 409 }
      );
    }

    // Validate templateType upfront if not skipping
    if (skip !== true && (!templateType || !VALID_TEMPLATE_TYPES.includes(templateType))) {
      return NextResponse.json(
        {
          error: 'invalid_agreement_template_type',
          message: `templateType must be one of: ${VALID_TEMPLATE_TYPES.join(', ')}`,
        },
        { status: 400 }
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
      return createEmploymentAgreementDrafts({
        tx,
        input: {
          sessionId,
          organizationId: session.user.organizationId!,
          locationId: session.user.locationId!,
          skip: skip === true,
          templateType: typeof templateType === 'string' ? templateType : undefined,
          notes: typeof notes === 'string' ? notes : undefined,
        },
        authenticatedUserId: session.user.id,
      });
    });

    // Tenant tx committed. EmploymentAgreement rows are visible.
    // The AGREEMENTS_PENDING claim already guaranteed exclusivity.
    //
    // Atomicity gap: writes below are NOT atomic with the tenant-scoped
    // writes above. Same gap as /api/onboarding/location,
    // /api/onboarding/services, and /api/onboarding/staff-invite
    // (tracked in issue #95).

    if (result.skipped) {
      await transitionTo({
        sessionId,
        toState: 'AGREEMENTS_CONFIGURED',
        triggeredByUserId: session.user.id,
        metadata: { skipped: true },
      });

      await prismaAdmin.onboardingSession.update({
        where: { id: sessionId },
        data: {
          skippedSteps: {
            push: 'AGREEMENTS_CONFIGURED',
          },
        },
      });

      await writeAuditLog({
        userId: session.user.id,
        organizationId: result.organizationId,
        action: AuditAction.ONBOARDING_AGREEMENTS_SKIPPED,
        entity: 'OnboardingSession',
        entityId: sessionId,
        metadata: { via: 'onboarding', skipped: true },
      });

      return NextResponse.json(
        { skipped: true, state: 'AGREEMENTS_CONFIGURED' },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Non-skip path: advance state, write audit log
    await transitionTo({
      sessionId,
      toState: 'AGREEMENTS_CONFIGURED',
      triggeredByUserId: session.user.id,
      metadata: {
        agreementsCreatedCount: result.agreementsCreatedCount,
        templateType: result.templateType,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      organizationId: result.organizationId,
      action: AuditAction.ONBOARDING_AGREEMENTS_DRAFTED,
      entity: 'EmploymentAgreement',
      entityId: null,
      metadata: {
        via: 'onboarding',
        sessionId,
        agreementsCreatedCount: result.agreementsCreatedCount,
        templateType: result.templateType,
      },
    });

    return NextResponse.json(
      {
        agreementsCreatedCount: result.agreementsCreatedCount,
        templateType: result.templateType,
        skipped: false,
        state: 'AGREEMENTS_CONFIGURED',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status: onboardingErrorStatus(err.code) }
      );
    }
    console.error('onboarding agreements configuration failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
