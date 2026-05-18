import { prismaAdmin } from '@/lib/prismaAdmin';
import { logger } from '@/lib/observability/logger';

export interface HealthCheck {
  name: string;
  ok: boolean;
}

export interface HealthSnapshot {
  ok: boolean;
  timestamp: string;
  checks: HealthCheck[];
}

const CRON_HEARTBEAT_STALE_THRESHOLD_MS = 26 * 60 * 60 * 1000; // 26 hours

export async function checkDatabase(): Promise<HealthCheck> {
  try {
    await prismaAdmin.$queryRaw`SELECT 1`;
    return { name: 'database', ok: true };
  } catch (err) {
    logger.error({ err, check: 'database' }, 'health check failed');
    return { name: 'database', ok: false };
  }
}

export async function checkSentry(): Promise<HealthCheck> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.warn({ check: 'sentry' }, 'SENTRY_DSN not configured');
    return { name: 'sentry', ok: false };
  }
  const ok = /^https:\/\/[^@]+@[^/]+\/\d+$/.test(dsn);
  if (!ok) {
    logger.error({ check: 'sentry', dsn_format_invalid: true }, 'health check failed');
  }
  return { name: 'sentry', ok };
}

export async function checkResend(): Promise<HealthCheck> {
  const key = process.env.RESEND_API_KEY;
  const ok = !!key && key.startsWith('re_');
  if (!ok) {
    logger.warn({ check: 'resend' }, 'RESEND_API_KEY not configured or malformed');
  }
  return { name: 'resend', ok };
}

export async function checkStorage(): Promise<HealthCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ok = !!url && !!anonKey;
  if (!ok) {
    logger.warn({ check: 'storage' }, 'Supabase storage env vars missing');
  }
  return { name: 'storage', ok };
}

export async function checkCronHeartbeat(): Promise<HealthCheck> {
  try {
    const recent = await prismaAdmin.auditLog.findFirst({
      where: { action: 'audit_retention.completed' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // If never run yet (foundation just shipped), return ok=true — no false
    // alarms before the cron is registered in vercel.json.
    if (!recent) {
      logger.info({ check: 'cron_heartbeat' }, 'no audit_retention.completed entry yet');
      return { name: 'cron_heartbeat', ok: true };
    }

    const ageMs = Date.now() - recent.createdAt.getTime();
    const ok = ageMs < CRON_HEARTBEAT_STALE_THRESHOLD_MS;
    if (!ok) {
      logger.error(
        { check: 'cron_heartbeat', ageMs, lastRun: recent.createdAt.toISOString() },
        'cron heartbeat stale'
      );
    }
    return { name: 'cron_heartbeat', ok };
  } catch (err) {
    logger.error({ err, check: 'cron_heartbeat' }, 'health check failed');
    return { name: 'cron_heartbeat', ok: false };
  }
}

/**
 * Run all checks in parallel and return a snapshot.
 * Overall ok = true only if ALL checks pass.
 */
export async function runAllHealthChecks(): Promise<HealthSnapshot> {
  const checks = await Promise.all([
    checkDatabase(),
    checkSentry(),
    checkResend(),
    checkStorage(),
    checkCronHeartbeat(),
  ]);

  return {
    ok: checks.every(c => c.ok),
    timestamp: new Date().toISOString(),
    checks,
  };
}

export { CRON_HEARTBEAT_STALE_THRESHOLD_MS };
