import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withTenantScope } from '@/lib/tenant/db-scope';
import { createLocationForOnboarding } from '@/lib/onboarding/location';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { OnboardingError } from '@/lib/onboarding/types';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }
    if (!session.user.organizationId) {
      // JWT staleness: user has org in DB but JWT not yet refreshed.
      // Client must call /api/onboarding/refresh-session first.
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

    const body = await req.json();
    const { sessionId, locationName, address, city, state, zip, timezone } = body;

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'session_id_required' }, { status: 400 });
    }

    // Tenant-scoped: organizationId comes from the NextAuth JWT, which was
    // refreshed via /api/onboarding/refresh-session after org-create. The
    // JWT is server-verified and withTenantScope sets Postgres RLS context.
    const result = await withTenantScope(prisma, {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      role: session.user.role ?? Role.OWNER,
      organizationId: session.user.organizationId,
      locationId: session.user.locationId ?? null,
      isSuperadmin: false,
    }, async (tx) => {
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

    // Audit logs outside tenant scope (writeAuditLog uses prismaAdmin internally)
    await writeAuditLog({
      userId: session.user.id,
      organizationId: result.organizationId,
      action: AuditAction.ONBOARDING_SESSION_TRANSITIONED,
      entity: 'OnboardingSession',
      entityId: sessionId,
      before: { state: 'ORG_CREATED' },
      after: { state: 'LOCATION_CREATED' },
      changedFields: ['state'],
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
