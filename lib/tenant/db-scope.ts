import { Prisma } from "@prisma/client";
import type { TenantContext, SuperadminContext } from "./context";

/**
 * AsyncLocalStorage-style holder for the current tenant context within a request.
 * Set by withTenantScope() before a tenant-scoped database call.
 *
 * For Vercel serverless we use a request-scoped variable rather than node:async_hooks
 * to keep the surface minimal. Each request handler explicitly opts in.
 */
type ScopedRunner = <T>(fn: () => Promise<T>) => Promise<T>;

/**
 * Runs `fn` inside a Prisma interactive transaction with app.current_org_id and
 * app.is_superadmin set for the duration of the transaction.
 *
 * Once 0.5.3b enables RLS policies, every Prisma query inside `fn` will be
 * automatically scoped to the tenant by the database itself.
 *
 * Until 0.5.3b is applied, this is a no-op safety net: it sets the session vars
 * but no policy enforces them yet, so existing queries keep working unchanged.
 *
 * Usage:
 *   const result = await withTenantScope(prisma, ctx, async (tx) => {
 *     return tx.client.findMany();
 *   });
 */
export async function withTenantScope<T>(
  prisma: { $transaction: <R>(fn: (tx: any) => Promise<R>) => Promise<R> },
  ctx: TenantContext,
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe(
      `SELECT app_set_tenant($1, $2)`,
      ctx.organizationId,
      ctx.isSuperadmin,
    );
    await tx.$executeRawUnsafe(
      `SELECT app_set_actor($1, $2, $3, $4, $5, $6)`,
      ctx.userId,
      ctx.email,
      ctx.request?.ip ?? "",
      ctx.request?.userAgent ?? "",
      ctx.request?.requestId ?? "",
      ctx.request?.route ?? "",
    );
    try {
      return await fn(tx);
    } finally {
      try {
        await tx.$executeRawUnsafe(`SELECT app_clear_actor()`);
        await tx.$executeRawUnsafe(`SELECT app_clear_tenant()`);
      } catch {
        // ignore — transaction may already be closed
      }
    }
  });
}

/**
 * Convenience: read the current scope from the database. Useful for tests
 * and for verifying RLS in dev.
 */
export async function readCurrentScope(prisma: {
  $queryRawUnsafe: (sql: string) => Promise<Array<{ org_id: string; is_super: boolean }>>;
}): Promise<{ orgId: string; isSuperadmin: boolean }> {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT app_current_org_id() as org_id, app_is_superadmin() as is_super`,
  );
  const row = rows[0] ?? { org_id: "", is_super: false };
  return { orgId: row.org_id, isSuperadmin: row.is_super };
}

/**
 * Runs a function inside an admin-scope transaction.
 *
 * Sets the actor session vars (so audit triggers capture WHO did the operation),
 * but deliberately does NOT set the tenant scope vars. Admin routes operate
 * across all tenants, so binding to one organization would be incorrect.
 *
 * The bypass of RLS is handled by prismaAdmin's $extends wrapper, which sets
 * SET LOCAL app.is_superadmin = 'true' on every operation. withAdminScope adds
 * the actor identity on top so audit rows record the superadmin user.
 *
 * IMPORTANT: pass `prismaAdmin` as the first argument, not `prisma`. Calling
 * with `prisma` would leave is_superadmin unset and the queries would be
 * subject to RLS policies (returning zero rows for cross-tenant reads under
 * RLS).
 */
export async function withAdminScope<T>(
  client: { $transaction: <R>(fn: (tx: any) => Promise<R>) => Promise<R> },
  admin: SuperadminContext,
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  return client.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe(
      `SELECT app_set_actor($1, $2, $3, $4, $5, $6)`,
      admin.userId,
      admin.email,
      admin.request?.ip ?? "",
      admin.request?.userAgent ?? "",
      admin.request?.requestId ?? "",
      admin.request?.route ?? "",
    );
    try {
      return await fn(tx);
    } finally {
      try {
        await tx.$executeRawUnsafe(`SELECT app_clear_actor()`);
      } catch {
        // ignore — transaction may already be closed
      }
    }
  });
}

export type { ScopedRunner };
