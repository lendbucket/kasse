import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { logger } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// In-memory rate limit: 1 call per 30s per userId. In-memory is sufficient
// because this endpoint is hit only by authenticated users during onboarding
// (low volume). Vercel serverless cold starts reset the map — worst case is
// N concurrent instances each allow 1 call (total = N per 30s), acceptable.
// Memory: ~50 bytes/entry. At 100 entries before cleanup, max ~5KB held.
const lastRefreshByUser = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 30_000;
const CLEANUP_THRESHOLD_SIZE = 100;
const CLEANUP_MAX_AGE_MS = RATE_LIMIT_WINDOW_MS * 10; // 5 min

function cleanupRateLimitMap(now: number) {
  if (lastRefreshByUser.size < CLEANUP_THRESHOLD_SIZE) return;
  for (const [userId, ts] of lastRefreshByUser.entries()) {
    if (now - ts > CLEANUP_MAX_AGE_MS) {
      lastRefreshByUser.delete(userId);
    }
  }
}

/**
 * Server-side JWT refresh helper. Returns the user's current
 * organizationId/role/locationId from the DB so the client can call
 * `useSession().update()` to trigger a JWT regeneration via the
 * `trigger === "update"` branch of the jwt callback.
 *
 * Used after onboarding state transitions that change the user's auth
 * context (e.g., POST /api/onboarding/org assigns the user to a newly-created
 * org — the JWT cookie from sign-in still says organizationId: null until
 * the client calls this endpoint and then update()).
 *
 * Requires an authenticated NextAuth session. The endpoint reads from the
 * DB and returns the user's current state; the JWT regeneration happens
 * in the jwt callback when the client invokes update().
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
    }

    // Rate limit: 1 call per 30s per user
    const now = Date.now();
    const last = lastRefreshByUser.get(session.user.id);
    if (last !== undefined && now - last < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        {
          error: 'too_many_requests',
          message: 'session refresh is rate-limited to once per 30s',
          retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - last),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((RATE_LIMIT_WINDOW_MS - (now - last)) / 1000)),
          },
        }
      );
    }
    lastRefreshByUser.set(session.user.id, now);
    cleanupRateLimitMap(now);

    const dbUser = await prismaAdmin.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        organizationId: true,
        role: true,
        locationId: true,
      },
    });

    if (!dbUser) {
      logger.error(
        { userId: session.user.id },
        'refresh-session: User row missing for authenticated session'
      );
      return NextResponse.json(
        { error: 'user_not_found' },
        { status: 404 }
      );
    }

    await writeAuditLog({
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: AuditAction.SESSION_REFRESHED,
      entity: 'User',
      entityId: dbUser.id,
      metadata: {
        hasOrg: dbUser.organizationId !== null,
        role: dbUser.role,
      },
    });

    return NextResponse.json(
      {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        role: dbUser.role,
        locationId: dbUser.locationId,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    logger.error({ err }, 'refresh-session failed');
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
