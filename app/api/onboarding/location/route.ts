import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withTenantScope } from '@/lib/tenant/db-scope';
import { tenantCtxFromSession } from '@/lib/tenant/ctx-from-session';
import { createLocationForOnboarding } from '@/lib/onboarding/location';
import { linkResource, transitionTo } from '@/lib/onboarding/sessions';
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
          message: 'Call /api/onboarding/refresh-session before creating a location.',
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
    const { sessionId, locationName, address, city, state, zip, timezone } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    // Tenant-scoped: organizationId comes from the NextAuth JWT, which was
    // refreshed via /api/onboarding/refresh-session after org-create. The
    // JWT is server-verified and withTenantScope sets Postgres RLS context.
    const ctx = tenantCtxFromSession({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organizationId: session.user.organizationId,
      locationId: session.user.locationId ?? null,
    });

    const result = await withTenantScope(prisma, ctx, async (tx) => {
      return createLocationForOnboarding({
        tx,
        input: {
          sessionId,
          organizationId: session.user.organizationId!,
          locationName,
          address,
          city,
          state,
          zip,
          timezone,
        },
        authenticatedUserId: session.user.id,
      });
    });

    // withTenantScope tx has now committed. The Location row is visible to
    // all connections. The claim updateMany inside createLocationForOnboarding
    // already advanced the session from ORG_CREATED → LOCATION_PENDING,
    // which guarantees no concurrent caller reaches this point (their claim
    // sees state='LOCATION_PENDING', not 'ORG_CREATED', and fails).
    //
    // Atomicity gap: writes below are NOT atomic with the tenant-scoped
    // writes above. If linkResource or transitionTo fails after args.tx
    // committed, the session is left at LOCATION_PENDING with locationId
    // still null and the Location is orphaned. Retries are blocked (claim
    // sees state != 'ORG_CREATED'). Recovery requires SUPERADMIN state
    // reset or a janitor job for stuck PENDING sessions. This is a
    // deliberate trade: blocking retries prevents orphan-Location
    // accumulation. Tracked in issue #95 for codebase-wide fix.
    await linkResource({
      sessionId,
      locationId: result.locationId,
    });

    await transitionTo({
      sessionId,
      toState: 'LOCATION_CREATED',
      triggeredByUserId: session.user.id,
      metadata: { locationId: result.locationId },
    });

    await writeAuditLog({
      userId: session.user.id,
      organizationId: result.organizationId,
      action: AuditAction.LOCATION_CREATED,
      entity: 'Location',
      entityId: result.locationId,
      metadata: { via: 'onboarding', sessionId },
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
      return NextResponse.json(
        { error: err.code.toLowerCase(), message: err.message },
        { status: onboardingErrorStatus(err.code) }
      );
    }
    console.error('onboarding location create failed', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
