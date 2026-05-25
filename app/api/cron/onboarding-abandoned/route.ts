import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prismaAdmin } from '@/lib/prismaAdmin';
import { signResumeToken } from '@/lib/onboarding/resume-token';
import { getWizardAbandonedEmailHtml } from '@/lib/emails/wizard-abandoned';
import type { OnboardingState } from '@/lib/onboarding/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ABANDONED_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_LIMIT = 100; // cap per-run to avoid Resend rate limit + cron timeout

// Module-scoped Resend client (matches PRs #115, #117, #119 pattern).
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * GET /api/cron/onboarding-abandoned
 *
 * Hourly cron sweep for OnboardingSessions that were created >24 hours
 * ago, are not yet COMPLETED, and have not yet received an abandoned-
 * signup email. For each qualifying session:
 *
 * 1. Mint a resume token via signResumeToken (7-day JWT)
 * 2. Build resumeUrl pointing at /onboarding/resume/[token]
 * 3. Send the abandoned-wizard email via Resend
 * 4. Stamp OnboardingSession.abandonedEmailSentAt = now()
 *
 * Fault isolation: Resend failures for individual sessions don't
 * abort the batch. Each session is processed in its own try/catch.
 * The abandonedEmailSentAt stamp is only set on successful send so
 * a transient Resend outage will retry on the next cron tick.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const cronSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (process.env.NODE_ENV === 'production' && !expected) {
    console.error('[CRON_AUTH_MISCONFIG] CRON_SECRET env var is not set');
    return NextResponse.json(
      { error: 'service_misconfigured' },
      { status: 500 }
    );
  }
  if (expected && cronSecret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ABANDONED_THRESHOLD_MS);
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://portal.kasseapp.com';

  const candidates = await prismaAdmin.onboardingSession.findMany({
    where: {
      state: { not: 'COMPLETED' },
      abandonedEmailSentAt: null,
      createdAt: { lt: cutoff },
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      state: true,
    },
    take: BATCH_LIMIT,
    orderBy: { createdAt: 'asc' },
  });

  let emailedCount = 0;
  let failedCount = 0;

  for (const session of candidates) {
    try {
      const resumeToken = signResumeToken({
        sessionId: session.id,
        email: session.email,
        state: session.state as OnboardingState,
      });
      const resumeUrl = `${baseUrl}/onboarding/resume/${encodeURIComponent(resumeToken)}`;

      await resend.emails.send({
        from: 'Kasse <onboarding@kasseapp.com>',
        to: session.email,
        subject: 'Finish setting up your Kasse account',
        html: getWizardAbandonedEmailHtml({ resumeUrl, baseUrl }),
      });

      await prismaAdmin.onboardingSession.update({
        where: { id: session.id },
        data: { abandonedEmailSentAt: new Date() },
      });

      emailedCount++;
    } catch (err) {
      failedCount++;
      console.warn(
        `[onboarding-abandoned] email send failed for session ${session.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return NextResponse.json({
    candidates: candidates.length,
    emailedCount,
    failedCount,
    note: candidates.length === BATCH_LIMIT
      ? `batch limit hit (${BATCH_LIMIT}); next tick will pick up remaining`
      : 'all candidates processed',
  });
}
