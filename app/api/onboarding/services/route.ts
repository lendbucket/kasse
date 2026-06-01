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
    const { sessionId, selectedNames, skip } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    if (selectedNames !== undefined) {
      if (!Array.isArray(selectedNames) || !selectedNames.every((n: unknown) => typeof n === 'string')) {
        return NextResponse.json({ error: 'invalid_selected_names' }, { status: 400 });
      }
    }

    if (skip !== undefined && typeof skip !== 'boolean') {
      return NextResponse.json({ error: 'invalid_skip_value' }, { status: 400 });
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
          selectedNames,
          skip: skip ?? false,
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
    // issue #95). Three failure modes worth knowing about:
    //
    // 1. transitionTo throws → session stuck at SERVICES_PENDING, Service
    //    rows committed, client gets 500. Recovery: manual state reset.
    // 2. writeAuditLog throws after transitionTo succeeded → state is
    //    SERVICES_SEEDED, Service rows committed, but client gets 500.
    //    Client may retry, hitting INVALID_TRANSITION (state has already
    //    advanced). The operation succeeded; only the audit and the
    //    response status disagree with reality.
    // 3. Process crash anywhere in this block → same residue as #1 or #2
    //    depending on where it landed.
    //
    // All three are #95 territory. withAdminTx will wrap transitionTo and
    // writeAuditLog in a single atomic admin tx; janitor job will detect
    // stuck PENDING sessions for case #1.
    await transitionTo({
      sessionId,
      toState: 'SERVICES_SEEDED',
      triggeredByUserId: session.user.id,
      metadata: { servicesSeededCount: result.servicesSeededCount, skipped: !!skip },
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
        skipped: !!skip,
      },
    });

    return NextResponse.json(
      {
        servicesSeededCount: result.servicesSeededCount,
        skipped: !!skip,
        state: 'SERVICES_SEEDED',
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
    console.error('onboarding services seed failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
