export interface AuditLogRecord {
  id: string;
  userId: string | null;
  organizationId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedFields: string[];
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  route: string | null;
  createdAt: Date;
}

export interface AuditLogQueryFilter {
  organizationId?: string | null;
  userId?: string | null;
  entity?: string;
  entityId?: string;
  action?: string;
  actionPrefix?: string;
  startDate?: Date;
  endDate?: Date;
  requestId?: string;
}

export interface AuditLogPage {
  rows: AuditLogRecord[];
  total: number;
  hasMore: boolean;
}

export interface PaginationArgs {
  limit?: number;
  offset?: number;
}
