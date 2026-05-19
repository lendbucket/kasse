import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withTenantScope } from '@/lib/tenant/db-scope';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { createServicesForOnboarding } from '@/lib/onboarding/services';
import { transitionTo } from '@/lib/onboarding/sessions';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { OnboardingError } from '@/lib/onboarding/types';

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
          message: 'Call /api/onboarding/refresh-session before seeding services.',
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
    const { sessionId } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
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
      return createServicesForOnboarding({
        tx,
        input: {
          sessionId,
          organizationId: session.user.organizationId!,
        },
        authenticatedUserId: session.user.id,
      });
    });

    // Tenant tx committed. Service rows are visible to all connections.
    // The SERVICES_PENDING claim already guaranteed exclusivity —
    // concurrent callers got INVALID_TRANSITION.
    //
    // Atomicity gap: writes below are NOT atomic with the tenant-scoped
    // writes above. Same gap as /api/onboarding/location (tracked in
    // issue #95). Partial failure leaves session at SERVICES_PENDING,
    // blocking retries until manual recovery.
    await transitionTo({
      sessionId,
      toState: 'SERVICES_SEEDED',
      triggeredByUserId: session.user.id,
      metadata: { servicesSeededCount: result.servicesSeededCount },
    });

    await writeAuditLog({
      userId: session.user.id,
      organizationId: result.organizationId,
      action: AuditAction.SERVICES_SEEDED,
      entity: 'Service',
      entityId: null,
      metadata: {
        via: 'onboarding',
        sessionId,
        count: result.servicesSeededCount,
      },
    });

    return NextResponse.json(
      {
        servicesSeededCount: result.servicesSeededCount,
        state: 'SERVICES_SEEDED',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === 'LOCATION_NOT_YET_CREATED' ? 409
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
    console.error('onboarding services seed failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
