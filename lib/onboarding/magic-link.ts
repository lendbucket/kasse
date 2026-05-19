import { Resend } from 'resend';
import { issueToken } from './verification-tokens';
import { getOrCreateSession } from './sessions';
import { OnboardingError, type MagicLinkSentResult } from './types';
import { writeAuditLog, AuditAction } from '@/lib/audit/write';
import { logger } from '@/lib/observability/logger';
import { renderMagicLinkEmail } from './emails/magic-link';
import { prismaAdmin } from '@/lib/prismaAdmin';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = 'Kasse <onboarding@kasseapp.com>';

const MAX_MAGIC_LINKS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getResendClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(RESEND_API_KEY);
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_ONBOARDING_BASE_URL
    ?? 'https://signup.kasseapp.com';
}

/**
 * Top-level entry: owner submits email. We get-or-create their session,
 * check rate limits, issue a fresh verification token, send the email.
 *
 * Idempotent semantics: repeated requests for the same email return the
 * same session ID but issue fresh tokens (the old ones remain valid until
 * consumed or expired — single-use is enforced at consume time).
 */
export async function sendMagicLink(args: {
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}): Promise<MagicLinkSentResult> {
  const session = await getOrCreateSession({
    email: args.email,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    referrer: args.referrer,
  });

  // Atomic rate limit check-and-increment. Three cases handled:
  // 1. magicLinkLastSentAt IS NULL — never sent, allow (set count=1)
  // 2. magicLinkLastSentAt < windowStart — window expired, reset counter to 1
  // 3. magicLinkLastSentAt >= windowStart AND count < MAX — within window,
  //    increment counter
  // Anything else (window active and count >= MAX) → UPDATE matches 0 rows.
  //
  // Uses $executeRaw inside an explicit $transaction with SET LOCAL because
  // prismaAdmin.$extends does not wrap $executeRaw (see RLS_AUDIT.md caveat).
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  const rowsAffected: number = await prismaAdmin.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL app.is_superadmin = 'true'`;
    return tx.$executeRaw`
      UPDATE "OnboardingSession"
      SET
        "magicLinkEmailsSentCount" = CASE
          WHEN "magicLinkLastSentAt" IS NULL OR "magicLinkLastSentAt" < ${windowStart}
            THEN 1
          ELSE "magicLinkEmailsSentCount" + 1
        END,
        "magicLinkLastSentAt" = ${now}
      WHERE "id" = ${session.id}
        AND (
          "magicLinkLastSentAt" IS NULL
          OR "magicLinkLastSentAt" < ${windowStart}
          OR "magicLinkEmailsSentCount" < ${MAX_MAGIC_LINKS_PER_HOUR}
        )
    `;
  });

  if (rowsAffected === 0) {
    throw new OnboardingError(
      'TOO_MANY_MAGIC_LINK_SENDS',
      'please wait before requesting another magic link'
    );
  }

  // Ordering note: we issue the token to the DB FIRST, then send the email.
  // This means a failed Resend call leaves an orphaned (but expired-in-24h)
  // token in the DB. We accept this trade-off because:
  // 1. The orphaned token is harmless — the owner never received it
  // 2. The 24h TTL + scheduled cleanup ensures bounded accumulation
  // 3. The reverse ordering (send first, then issue) is worse: a successful
  //    send followed by a failed DB write means the owner has a working-looking
  //    link in their inbox that points to nothing.
  // 4. Resend's HTTP 200 doesn't guarantee delivery anyway, so "send-then-issue"
  //    doesn't actually solve the delivery problem.

  // Issue token
  const { rawToken, expiresAt } = await issueToken({
    sessionId: session.id,
    purpose: 'EMAIL_VERIFICATION',
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  const verificationUrl = `${getBaseUrl()}/onboarding/verify?token=${rawToken}`;

  // Send email via Resend (or noop in test/dev if not configured)
  if (RESEND_API_KEY) {
    try {
      const resend = getResendClient();
      const { html, text } = renderMagicLinkEmail({
        verificationUrl,
        expiresAt,
      });
      const sendResult = await resend.emails.send({
        from: RESEND_FROM,
        to: session.email,
        subject: 'Verify your Kasse email',
        html,
        text,
      });
      logger.info(
        {
          email_send: true,
          sessionId: session.id,
          resendId: sendResult.data?.id,
        },
        'magic-link sent'
      );
    } catch (err) {
      logger.error(
        { err, sessionId: session.id },
        'failed to send magic-link email'
      );
      throw new Error('failed to send verification email');
    }
  } else {
    logger.warn(
      { sessionId: session.id, verificationUrl },
      'RESEND_API_KEY not set — would have sent magic-link'
    );
  }

  await writeAuditLog({
    userId: null,
    organizationId: null,
    action: AuditAction.ONBOARDING_RESUME_LINK_SENT,
    entity: 'OnboardingSession',
    entityId: session.id,
    metadata: {
      email: session.email,
    },
  });

  return {
    sessionId: session.id,
    expiresAt,
    // Only expose raw verification URL outside production (helps local dev
    // and CI without a real inbox)
    devVerificationUrl: process.env.NODE_ENV !== 'production'
      ? verificationUrl
      : undefined,
  };
}

export { MAX_MAGIC_LINKS_PER_HOUR, RATE_LIMIT_WINDOW_MS };
