import { NextResponse } from 'next/server';
import { prismaAdmin } from '@/lib/prismaAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PENDING_STATES = [
  'LOCATION_PENDING',
  'SERVICES_PENDING',
  'STAFF_PENDING',
  'AGREEMENTS_PENDING',
];

const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/cron/onboarding-janitor
 *
 * Cron-triggered sweep for OnboardingSessions stuck in any *_PENDING
 * state for >5 minutes. PENDING states are transient sentinels used for
 * concurrent-call serialization — a session should not stay in one for
 * more than ~100ms in practice. If it does, the owning request crashed
 * between the state-as-token claim and the transitionTo call.
 *
 * v1 behavior: LOG-ONLY. Emits [STUCK_PENDING_SESSION] tags for each
 * stuck session so Vercel log search and future alerting can surface
 * them. Automated recovery (resetting state to the prior state) is
 * the next iteration, after we trust the janitor correctly identifies
 * stuck sessions vs. legitimately slow requests.
 */
export async function POST(req: Request) {
  const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CRON_SECRET &&
    cronSecret !== process.env.CRON_SECRET
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

  const stuck = await prismaAdmin.onboardingSession.findMany({
    where: {
      state: { in: PENDING_STATES },
      updatedAt: { lt: cutoff },
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      state: true,
      organizationId: true,
      updatedAt: true,
    },
  });

  for (const session of stuck) {
    console.error('[STUCK_PENDING_SESSION] session in PENDING state >5min', {
      sessionId: session.id,
      email: session.email,
      state: session.state,
      organizationId: session.organizationId,
      updatedAt: session.updatedAt.toISOString(),
      stuckForMs: Date.now() - session.updatedAt.getTime(),
    });
  }

  return NextResponse.json({
    scanned: stuck.length,
    recoveredCount: 0,
    note: 'log-only mode; automated recovery not yet enabled',
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, mode: 'log-only' });
}
