import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { withTenantScope } from '@/lib/tenant/db-scope';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { setCompensationForStaff, VALID_MODEL_TYPES } from '@/lib/onboarding/compensation';
import type { CompensationInput } from '@/lib/onboarding/compensation';
import { transitionTo } from '@/lib/onboarding/sessions';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { OnboardingError } from '@/lib/onboarding/types';
import { onboardingErrorStatus } from '@/lib/onboarding/error-status';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/onboarding/compensation?sessionId=<id>
 *
 * Returns staff members who need compensation configuration. For each
 * staff member: name, whether they have an agreement, whether they
 * already have a compensation row, and existing compensation data.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }
    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: 'org_not_in_session', message: 'Call /api/onboarding/refresh-session first.' },
        { status: 409 }
      );
    }
    if (!session.user.email || !session.user.role) {
      return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    // Read staff + agreements + existing compensation via prismaAdmin
    // (bypasses RLS, but we scope by orgId from verified session).
    const staffMembers = await prismaAdmin.staff.findMany({
      where: {
        organizationId: session.user.organizationId,
        locationId: session.user.locationId ?? undefined,
        softDeletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employmentAgreements: {
          select: {
            id: true,
            templateType: true,
            status: true,
          },
        },
        compensation: {
          select: {
            id: true,
            modelType: true,
            baseHourlyRateCents: true,
            baseCommissionPct: true,
            perServiceCommissionOverrides: true,
            tieredCommissionConfig: true,
            retailCommissionPct: true,
            boothRentCents: true,
            boothRentFrequency: true,
            overtimeMultiplier: true,
            overtimeThresholdHours: true,
            includeTipsInCommission: true,
            productDeductionEnabled: true,
            effectiveStartDate: true,
            effectiveEndDate: true,
            notes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = staffMembers.map((s) => ({
      staffId: s.id,
      name: s.name,
      email: s.email,
      hasAgreement: s.employmentAgreements.length > 0,
      agreementTemplateType: s.employmentAgreements[0]?.templateType ?? null,
      hasCompensation: s.compensation !== null,
      compensation: s.compensation,
    }));

    return NextResponse.json(
      { staff: result, sessionId },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('GET /api/onboarding/compensation failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

/**
 * POST /api/onboarding/compensation
 *
 * Set compensation for all staff members. State advances
 * AGREEMENTS_CONFIGURED -> COMPENSATION_PENDING -> COMPENSATION_CONFIGURED.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }
    if (!session.user.organizationId) {
      return NextResponse.json(
        { error: 'org_not_in_session', message: 'Call /api/onboarding/refresh-session first.' },
        { status: 409 }
      );
    }
    if (!session.user.email || !session.user.role) {
      return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    }

    // OWNER-only gate (same as agreements route)
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'forbidden', message: 'only OWNER role can set compensation during onboarding' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, compensations } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    if (!Array.isArray(compensations) || compensations.length === 0) {
      return NextResponse.json(
        { error: 'compensations_required', message: 'at least one compensation entry is required' },
        { status: 400 }
      );
    }

    if (!session.user.locationId) {
      return NextResponse.json(
        { error: 'location_not_yet_created', message: 'Call /api/onboarding/refresh-session after location step.' },
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
      return setCompensationForStaff({
        tx,
        input: {
          sessionId,
          organizationId: session.user.organizationId!,
          locationId: session.user.locationId!,
          compensations: compensations as CompensationInput[],
        },
        authenticatedUserId: session.user.id,
      });
    });

    // Tenant tx committed. Compensation rows visible.
    // Advance state: COMPENSATION_PENDING -> COMPENSATION_CONFIGURED.
    await transitionTo({
      sessionId,
      toState: 'COMPENSATION_CONFIGURED',
      triggeredByUserId: session.user.id,
      metadata: {
        compensationCount: result.compensationCount,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      organizationId: result.organizationId,
      action: AuditAction.ONBOARDING_COMPENSATION_SET,
      entity: 'Compensation',
      entityId: null,
      metadata: {
        via: 'onboarding',
        sessionId,
        compensationCount: result.compensationCount,
      },
    });

    return NextResponse.json(
      {
        compensationCount: result.compensationCount,
        sessionState: 'COMPENSATION_CONFIGURED',
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
    console.error('POST /api/onboarding/compensation failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
