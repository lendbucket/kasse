import { NextResponse } from 'next/server';
import { runAllHealthChecks } from '@/lib/health/checks';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * Public health endpoint. Returns 200 if all checks pass, 503 if any fail.
 * Designed for synthetic monitor pings (BetterStack, etc.).
 *
 * Unauthenticated — synthetic monitors don't carry auth.
 * Informationally minimal — no version strings, IPs, or stack traces.
 */
export async function GET() {
  const snapshot = await runAllHealthChecks();

  return NextResponse.json(snapshot, {
    status: snapshot.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex',
    },
  });
}
