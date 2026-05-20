# Admin Transactions (withAdminTx)

**Added:** 2026-05-20 (issue #95)
**Status:** Active

## Problem

The `prismaAdmin` client uses `$extends` with a `$allOperations` wrapper
that runs every operation in its own batch transaction with
`SET LOCAL app.is_superadmin = 'true'` as the prelude. This is correct
for single operations but **broken for multi-op atomicity**.

### Broken pattern: interactive transaction

```typescript
// DON'T DO THIS — silently broken
await prismaAdmin.$transaction(async (tx) => {
  const user = await tx.user.create({...});
  await tx.onboardingSession.update({...});
});
```

The inner `tx.user.create()` is intercepted by the `$extends` wrapper,
which dispatches it through `_prismaAdmin` (the unwrapped client) — not
the `tx` from the outer `$transaction`. The two operations run in
separate transactions on separate connections.

### Broken pattern: sequential calls

```typescript
// DON'T DO THIS — not atomic
await prismaAdmin.onboardingSession.update({...});     // Batch tx 1
await prismaAdmin.onboardingStateTransition.create({...}); // Batch tx 2
await writeAuditLog({...});                            // Batch tx 3
```

Three independent transactions. A crash between any two leaves the DB
in an inconsistent state.

## Solution: withAdminTx

```typescript
import { withAdminTx } from '@/lib/admin/withAdminTx';

const [updated, transition, audit] = await withAdminTx((p) => [
  p.onboardingSession.update({ where: {...}, data: {...} }),
  p.onboardingStateTransition.create({ data: {...} }),
  p.auditLog.create({ data: {...} }),
]);
```

`withAdminTx` uses Prisma's **batch transaction form**
(`$transaction([promise1, promise2, ...])`), which groups all operations
on one connection in one transaction. The `SET LOCAL app.is_superadmin`
prelude is prepended automatically.

The callback receives the **unwrapped** `_prismaAdmin` client (accessed
via `(prismaAdmin as any).$parent`), bypassing the `$extends` wrapper.

## Rules

1. **Do NOT await inside the callback.** Return an array of PrismaPromise
   values. Awaiting defeats the batching.

2. **Use client-side IDs for parent-child writes.** The batch form
   doesn't expose intermediate results. Generate IDs with
   `crypto.randomUUID()` and pass them explicitly.

   ```typescript
   const userId = crypto.randomUUID();
   const [user, session] = await withAdminTx((p) => [
     p.user.create({ data: { id: userId, ... } }),
     p.onboardingSession.update({ data: { userId } }),
   ]);
   ```

3. **Use `auditLogCreateOp` for audit writes inside batches.** The
   regular `writeAuditLog` is fail-soft (catches errors); inside a batch,
   you want the error to propagate so the whole transaction rolls back.

   ```typescript
   import { auditLogCreateOp } from '@/lib/audit/write';

   await withAdminTx((p) => [
     p.someModel.create({...}),
     auditLogCreateOp(p, { action: ..., entity: ..., ... }),
   ]);
   ```

4. **Only for prismaAdmin operations.** Tenant-scoped writes still use
   `withTenantScope`. The two helpers serve different purposes:
   - `withTenantScope`: sets `app.current_org_id`, enforces RLS
   - `withAdminTx`: sets `app.is_superadmin`, bypasses RLS

## When to use what

| Scenario | Helper |
|----------|--------|
| Single prismaAdmin operation | Use `prismaAdmin.x.create(...)` directly (the $extends wrapper handles SET LOCAL) |
| Multiple prismaAdmin operations that must be atomic | Use `withAdminTx` |
| Tenant-scoped writes | Use `withTenantScope(prisma, ctx, ...)` |
| Audit log as standalone side-effect | Use `writeAuditLog()` (fail-soft) |
| Audit log inside atomic batch | Use `auditLogCreateOp(p, ...)` |

## Empirical validation

Confirmed 2026-05-20:
- `(prismaAdmin as any).$parent` returns the unwrapped `_prismaAdmin`
  base PrismaClient (identity check: `$parent === base` is `true`).
- Batch transactions on the unwrapped client group all operations on
  one backend connection (verified via `pg_backend_pid()`).
- If any operation in the batch fails, all operations roll back.

## Reference

- `lib/admin/withAdminTx.ts` — the helper
- `lib/prismaAdmin.ts` — the $extends wrapper (DO NOT modify)
- `lib/audit/write.ts` — `auditLogCreateOp` for batch use
- Issue #95 — the tracking issue
