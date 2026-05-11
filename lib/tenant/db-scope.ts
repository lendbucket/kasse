import { Prisma, PrismaClient } from "@prisma/client";
import type { TenantContext, SuperadminContext } from "./context";

/**
 * Type alias for a Prisma interactive transaction client. This is the `tx`
 * parameter that Prisma passes to the callback inside `$transaction(async (tx) => ...)`.
 *
 * Using a named type instead of `any` gives callsites IntelliSense and
 * prevents silent misuse (e.g., calling $transaction on the tx itself).
 */
type PrismaTx = Prisma.TransactionClient;

/**
 * Structural type for any Prisma-like client that supports interactive
 * transactions. Accepts both `prisma` (plain) and `prismaAdmin` ($extends
 * wrapper) without requiring the exact PrismaClient type.
 *
 * We use a simplified $transaction signature here. Prisma's actual signature
 * has two overloads (batch and callback), and the $extends wrapper produces
 * a DynamicClientExtensionThis type that TypeScript struggles to unify with
 * a structural match. Using `(...args: any[]) => any` for the client type
 * while keeping the callback `fn` parameter strongly typed (PrismaTx) gives
 * us the best tradeoff: callsites get full IntelliSense inside the callback,
 * while the client parameter accepts both prisma and prismaAdmin.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientLike = { $transaction: (...args: any[]) => any };

type ScopedRunner = <T>(fn: () => Promise<T>) => Promise<T>;

/**
 * Runs `fn` inside a Prisma interactive transaction with app.current_org_id and
 * app.is_superadmin set for the duration of the transaction via SET LOCAL.
 *
 * Once RLS policies are enabled, every Prisma query inside `fn` will be
 * automatically scoped to the tenant by the database itself.
 *
 * Until RLS is applied, this is a safety net: it sets the session vars but no
 * policy enforces them yet, so existing queries keep working unchanged.
 *
 * No explicit clear is needed: app_set_tenant and app_set_actor use SET LOCAL,
 * which Postgres automatically scopes to the transaction. On commit or rollback,
 * the vars clear and the connection returns to the pool clean.
 *
 * Usage:
 *   const result = await withTenantScope(prisma, ctx, async (tx) => {
 *     return tx.client.findMany();
 *   });
 */
export async function withTenantScope<T>(
  prisma: PrismaClientLike,
  ctx: TenantContext,
  fn: (tx: PrismaTx) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    await tx.$executeRaw`
      SELECT app_set_tenant(${ctx.organizationId}::text, ${ctx.isSuperadmin}::boolean)
    `;
    await tx.$executeRaw`
      SELECT app_set_actor(
        ${ctx.userId}::text,
        ${ctx.email}::text,
        ${ctx.request?.ip ?? ""}::text,
        ${ctx.request?.userAgent ?? ""}::text,
        ${ctx.request?.requestId ?? ""}::text,
        ${ctx.request?.route ?? ""}::text
      )
    `;
    return await fn(tx);
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
 * Runs `fn` inside an admin-scope transaction.
 *
 * What this function does:
 *   - Begins a database transaction
 *   - Calls app_set_actor with the SuperadminContext to record WHO performs
 *     each query (for audit log triggers)
 *   - Executes the callback with the transaction client
 *
 * What this function does NOT do:
 *   - Set app.is_superadmin or any RLS-bypass flag. That is the job of
 *     prismaAdmin's $extends wrapper (see lib/prismaAdmin.ts), which runs
 *     SET LOCAL app.is_superadmin = 'true' on every model operation.
 *   - Set tenant scope. Admin routes operate cross-tenant by design.
 *
 * No explicit clear is needed: app_set_actor uses SET LOCAL, which Postgres
 * automatically scopes to the transaction. On commit or rollback, the var
 * clears and the connection returns to the pool clean.
 *
 * IMPORTANT: pass `prismaAdmin` (not `prisma`) as the first argument.
 * Calling with `prisma` would leave is_superadmin unset, and queries
 * would be subject to RLS policies once those are enabled — returning
 * zero rows for cross-tenant reads.
 */
export async function withAdminScope<T>(
  client: PrismaClientLike,
  admin: SuperadminContext,
  fn: (tx: PrismaTx) => Promise<T>,
): Promise<T> {
  return client.$transaction(async (tx: PrismaTx) => {
    await tx.$executeRaw`
      SELECT app_set_actor(
        ${admin.userId}::text,
        ${admin.email}::text,
        ${admin.request?.ip ?? ""}::text,
        ${admin.request?.userAgent ?? ""}::text,
        ${admin.request?.requestId ?? ""}::text,
        ${admin.request?.route ?? ""}::text
      )
    `;
    return await fn(tx);
  });
}

export type { ScopedRunner, PrismaTx, PrismaClientLike };
