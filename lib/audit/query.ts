import type { Prisma } from '@prisma/client';
import { prismaAdmin } from '@/lib/prismaAdmin';
import type {
  AuditLogRecord,
  AuditLogQueryFilter,
  AuditLogPage,
  PaginationArgs,
} from './query-types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * SUPERADMIN-only audit log query. Uses prismaAdmin (RLS bypass) because
 * audit logs are platform-level data — they intentionally span tenants.
 * The CALLER is responsible for SUPERADMIN gating at the route layer.
 */
export async function queryAuditLogs(args: {
  filter: AuditLogQueryFilter;
  pagination?: PaginationArgs;
}): Promise<AuditLogPage> {
  const limit = clampLimit(args.pagination?.limit);
  const offset = Math.max(0, args.pagination?.offset ?? 0);
  const where = buildWhere(args.filter);

  const [rows, total] = await Promise.all([
    prismaAdmin.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prismaAdmin.auditLog.count({ where }),
  ]);

  return {
    rows: rows as unknown as AuditLogRecord[],
    total,
    hasMore: offset + rows.length < total,
  };
}

/**
 * Tenant-scoped audit log query. Forces organizationId to the supplied value.
 *
 * CALLER CONTRACT: organizationId MUST come from the verified session context
 * (e.g., ctx.organizationId from requireTenantContext), NEVER from a user-controlled
 * request parameter. This helper uses prismaAdmin internally (RLS bypass) — the
 * org scope is enforced ONLY by the value the caller passes in, so passing an
 * attacker-controlled value would leak cross-tenant data.
 */
export async function queryAuditLogsForTenant(args: {
  organizationId: string;
  filter: Omit<AuditLogQueryFilter, 'organizationId'>;
  pagination?: PaginationArgs;
}): Promise<AuditLogPage> {
  return queryAuditLogs({
    filter: { ...args.filter, organizationId: args.organizationId },
    pagination: args.pagination,
  });
}

/**
 * Get the audit trail for a specific entity (entity + entityId).
 */
export async function getEntityAuditTrail(args: {
  organizationId: string | null;
  entity: string;
  entityId: string;
  pagination?: PaginationArgs;
}): Promise<AuditLogPage> {
  return queryAuditLogs({
    filter: {
      organizationId: args.organizationId,
      entity: args.entity,
      entityId: args.entityId,
    },
    pagination: args.pagination,
  });
}

function clampLimit(requested: number | undefined): number {
  if (requested == null) return DEFAULT_LIMIT;
  if (requested < 1) return 1;
  if (requested > MAX_LIMIT) return MAX_LIMIT;
  return Math.floor(requested);
}

function buildWhere(filter: AuditLogQueryFilter): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filter.organizationId !== undefined) {
    where.organizationId = filter.organizationId;
  }
  if (filter.userId !== undefined) {
    where.userId = filter.userId;
  }
  if (filter.entity) {
    where.entity = filter.entity;
  }
  if (filter.entityId) {
    where.entityId = filter.entityId;
  }
  if (filter.action) {
    where.action = filter.action;
  } else if (filter.actionPrefix) {
    where.action = { startsWith: filter.actionPrefix };
  }
  if (filter.requestId) {
    where.requestId = filter.requestId;
  }
  if (filter.startDate || filter.endDate) {
    const createdAt: Record<string, Date> = {};
    if (filter.startDate) createdAt.gte = filter.startDate;
    if (filter.endDate) createdAt.lte = filter.endDate;
    where.createdAt = createdAt;
  }

  return where;
}

export { DEFAULT_LIMIT, MAX_LIMIT };
