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

  return {
    deletedCount: result.count,
    cutoffDate,
    durationMs,
  };
}
