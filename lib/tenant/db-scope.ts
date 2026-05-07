import { Prisma } from "@prisma/client";
import type { TenantContext } from "./context";

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
    try {
      return await fn(tx);
    } finally {
      // Best-effort clear. If the transaction is being rolled back the session
      // var is already discarded, so this is mostly cosmetic.
      try {
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

export type { ScopedRunner };
