import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { runAuditRetention } from '@/lib/audit/retention';
import { logger } from '@/lib/observability/logger';

export const maxDuration = 60;

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  // Timing-safe comparison to avoid leaking secret bytes via response timing.
  const expectedBuf = Buffer.from(`Bearer ${expected}`);
  const actualBuf = Buffer.from(authHeader ?? '');
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAuditRetention();
    return NextResponse.json({
      ok: true,
      deletedCount: result.deletedCount,
      cutoffDate: result.cutoffDate.toISOString(),
      durationMs: result.durationMs,
    });
  } catch (err) {
    logger.error({ err }, 'audit retention failed');
    return NextResponse.json(
      { error: 'retention failed' },
      { status: 500 }
    );
  }
}
