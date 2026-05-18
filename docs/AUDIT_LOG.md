# Audit Log

Last updated: 2026-05-18

## Purpose

Every mutating operation in Kasse writes an audit log entry. The audit log is
the canonical record of "who did what to which entity when" -- used for:

- Incident forensics (paired with requestId for Sentry correlation)
- Compliance (tenant data is recoverable for 2 years via audit history)
- Owner-facing change history (P1+ feature -- tenant audit viewer)
- Platform-level governance (SUPERADMIN flag changes, etc.)

## Schema

The `AuditLog` table captures:
- `userId` -- who did it (nullable for system actions)
- `organizationId` -- which tenant (NULL = platform-level)
- `action` -- canonical action constant (see lib/audit/helpers.ts)
- `entity` -- entity type ('Client', 'Service', 'Tag', etc.)
- `entityId` -- opaque ID of the affected row
- `before` / `after` -- JSONB snapshots of relevant fields
- `changedFields` -- convenience array of field names that changed
- `metadata` -- arbitrary additional context (action-specific)
- `ipAddress`, `userAgent`, `requestId`, `route` -- request forensics
- `createdAt` -- when the action happened

## Writing entries

All mutating helpers MUST write an audit entry. The established pattern:

```typescript
import { writeAuditLog, AuditAction } from '@/lib/audit/write';

await writeAuditLog({
  userId: args.actorUserId,
  organizationId: args.organizationId,
  action: AuditAction.SOME_CONSTANT,
  entity: 'EntityName',
  entityId: row.id,
  before: { /* snapshot before */ },
  after: { /* snapshot after */ },
});
```

`writeAuditLog` is fail-soft -- if the write fails it logs an error but does
NOT throw. Better to lose an audit entry than fail the mutation.

### Why writeAuditLog uses prismaAdmin

Audit logs span tenants and run regardless of the caller's tenant scope.
The `prismaAdmin` client bypasses RLS so the write succeeds in any context
(authenticated tenant, unauthenticated cron, platform-level admin action).

## Reading entries

### Server-side (helpers)

```typescript
import {
  queryAuditLogs,
  queryAuditLogsForTenant,
  getEntityAuditTrail,
} from '@/lib/audit/query';

// SUPERADMIN-only cross-tenant query
const page = await queryAuditLogs({
  filter: { actionPrefix: 'tag.', startDate: oneWeekAgo },
  pagination: { limit: 50 },
});

// Tenant-scoped query (filters to one org)
const tenantPage = await queryAuditLogsForTenant({
  organizationId: org.id,
  filter: { entity: 'Client', entityId: client.id },
});

// Entity-specific audit trail
const trail = await getEntityAuditTrail({
  organizationId: org.id,
  entity: 'Service',
  entityId: service.id,
});
```

### Admin UI

SUPERADMIN can browse all audit logs at `/admin/audit-logs` with filters for
organization, user, entity, entityId, action, action prefix, date range, and
request ID.

## Pagination

All query helpers paginate. Default limit 50, max 200. Always check
`hasMore` to determine if more pages exist.

## Retention

- **Tenant-scoped rows** (organizationId NOT NULL): deleted after 730 days
  (2 years) by `runAuditRetention`
- **Platform-level rows** (organizationId IS NULL): NEVER deleted automatically

The retention cron lives at `POST /api/cron/audit-retention` and is protected
by `CRON_SECRET`. Registration in vercel.json happens in a later deployment
PR -- the route is built and tested but not yet automatically invoked.

## Common action constants

See `lib/audit/helpers.ts` for the canonical AuditAction object. Add new
constants there before using them -- don't write string literals.

Categories so far:
- `permission_set.*`, `organization_group.*`, `user.custom_role.*` (P0.A)
- `client.*`, `appointment.*`, `cart.*`, `order.*` (P0.G)
- `custom_field_definition.*` (P0.I.1)
- `tag.*` (P0.I.2)

## Cross-referencing with Sentry

Every API request gets a `requestId` (from middleware in P0.H PR 1). Audit
log entries capture this. Sentry events also tag this. Given a requestId:

1. Open `/admin/audit-logs` and filter by Request ID
2. See exactly what mutation(s) the request performed
3. Click a row to expand before/after JSON snapshots

This is the foundation for incident response -- every action is traceable
end to end.

## Known audit gaps

These mutating helpers do NOT currently write audit entries:
- `pairCustomerDisplayToChair` (lib/devices/pairing.ts) -- operational action,
  device pairing is transient and high-frequency
- `checkGeolocationAndLog` (lib/geolocation/check.ts) -- already writes its
  own GeolocationLog record; adding AuditLog would be redundant

Both are acceptable gaps. If audit coverage is needed for compliance, add
the calls following the established pattern.
