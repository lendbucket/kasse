import { NextResponse, type NextRequest } from 'next/server';
import {
  requireSuperadminContext,
  tenantErrorResponse,
} from '@/lib/tenant/context';
import { queryAuditLogs } from '@/lib/audit/query';
import type { AuditLogQueryFilter } from '@/lib/audit/query-types';

export async function GET(request: NextRequest) {
  try {
    await requireSuperadminContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const params = request.nextUrl.searchParams;

  const filter: AuditLogQueryFilter = {};

  const orgId = params.get('organizationId');
  if (orgId !== null) {
    filter.organizationId = orgId || null; // empty string = platform-only (null)
  }

  const userIdParam = params.get('userId');
  if (userIdParam) filter.userId = userIdParam;

  const entityParam = params.get('entity');
  if (entityParam) filter.entity = entityParam;

  const entityIdParam = params.get('entityId');
  if (entityIdParam) filter.entityId = entityIdParam;

  const actionParam = params.get('action');
  if (actionParam) filter.action = actionParam;

  const actionPrefixParam = params.get('actionPrefix');
  if (actionPrefixParam) filter.actionPrefix = actionPrefixParam;

  const requestIdParam = params.get('requestId');
  if (requestIdParam) filter.requestId = requestIdParam;

  const startDateParam = params.get('startDate');
  if (startDateParam) {
    const d = new Date(startDateParam);
    if (!isNaN(d.getTime())) filter.startDate = d;
  }

  const endDateParam = params.get('endDate');
  if (endDateParam) {
    const d = new Date(endDateParam);
    if (!isNaN(d.getTime())) filter.endDate = d;
  }

  const limitParam = params.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const offsetParam = params.get('offset');
  const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

  const page = await queryAuditLogs({
    filter,
    pagination: { limit, offset },
  });

  return NextResponse.json(page);
}
