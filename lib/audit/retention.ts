import { prismaAdmin } from '@/lib/prismaAdmin';
import { logger } from '@/lib/observability/logger';

export const TENANT_AUDIT_RETENTION_DAYS = 730; // 2 years

export interface RetentionResult {
  deletedCount: number;
  cutoffDate: Date;
  durationMs: number;
}

/**
 * Delete tenant-scoped audit log rows older than TENANT_AUDIT_RETENTION_DAYS.
 * Rows with organizationId IS NULL are NEVER deleted (platform-level audit
 * trail is permanent).
 *
 * Designed to be called from a cron. Idempotent — safe to run multiple times.
 */
export async function runAuditRetention(): Promise<RetentionResult> {
  const startedAt = Date.now();
  const cutoffDate = new Date(
    Date.now() - TENANT_AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const result = await prismaAdmin.auditLog.deleteMany({
    where: {
      organizationId: { not: null },
      createdAt: { lt: cutoffDate },
    },
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      audit_retention: true,
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
      durationMs,
    },
    'audit retention sweep completed'
  );

  // Write a heartbeat audit entry so checkCronHeartbeat can detect staleness.
  // If this fails after the delete succeeded, the system is still consistent —
  // we just lose this run's heartbeat record.
  try {
    await prismaAdmin.auditLog.create({
      data: {
        action: 'audit_retention.completed',
        entity: 'AuditLog',
        entityId: null,
        organizationId: null,
        userId: null,
        after: {
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
          durationMs,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, 'failed to write audit retention heartbeat — non-fatal');
  }

  return {
    deletedCount: result.count,
    cutoffDate,
    durationMs,
  };
}
