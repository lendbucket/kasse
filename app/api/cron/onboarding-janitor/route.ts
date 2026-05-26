import { NextResponse } from 'next/server';
import { prismaAdmin } from '@/lib/prismaAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PENDING_STATES = [
  'LOCATION_PENDING',
  'SERVICES_PENDING',
  'STAFF_PENDING',
  'AGREEMENTS_PENDING',
  'COMPENSATION_PENDING',
];

const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/cron/onboarding-janitor
 *
 * Cron-triggered sweep for OnboardingSessions stuck in any *_PENDING
 * state for >5 minutes. Vercel cron sends HTTP GET requests.
 *
 * PENDING states are transient sentinels used for concurrent-call
 * serialization — a session should not stay in one for more than
 * ~100ms in practice. If it does, the owning request crashed between
 * the state-as-token claim and the transitionTo call.
 *
 * v1 behavior: LOG-ONLY. Emits [STUCK_PENDING_SESSION] tags for each
 * stuck session so Vercel log search and future alerting can surface
 * them. Automated recovery (resetting state to the prior state) is
 * the next iteration, after we trust the janitor correctly identifies
 * stuck sessions vs. legitimately slow requests.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  // Defensive Bearer parsing: split on prefix and take the token
  // instead of string-replace. .replace('Bearer ', '') would silently
  // mangle tokens containing the literal 'Bearer ' substring elsewhere
  // (though Vercel-generated CRON_SECRET values never do).
  const authHeader = req.headers.get('authorization');
  const cronSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  // PR #122 cycle 2 hardening: require CRON_SECRET unconditionally.
  // The previous pattern (skip auth when secret absent for dev
  // convenience) left preview deployments open — preview URLs are
  // internet-accessible. Developers testing locally can set CRON_SECRET
  // in .env.local (one line). Production sets it via Vercel env vars.
  if (!expected) {
    console.error('[CRON_AUTH_MISCONFIG] CRON_SECRET env var is not set');
    return NextResponse.json(
      { error: 'service_misconfigured' },
      { status: 500 }
    );
  }
  if (cronSecret !== expected) {
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
      state: true,
      organizationId: true,
      updatedAt: true,
    },
  });

  for (const session of stuck) {
    console.error('[STUCK_PENDING_SESSION] session in PENDING state >5min', {
      sessionId: session.id,
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
