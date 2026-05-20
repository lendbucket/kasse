import { prismaAdmin } from '@/lib/prismaAdmin';
import type { Prisma } from '@prisma/client';

/**
 * Run multiple prismaAdmin operations atomically in a single transaction.
 *
 * Works around the $extends wrapper limitation that makes
 * prismaAdmin.$transaction(async (tx) => ...) silently broken — the
 * inner tx operations bypass the outer transaction and run on
 * _prismaAdmin's connection pool instead.
 *
 * Uses Prisma's BATCH transaction form: $transaction([...promises]).
 * The SET LOCAL prelude is included as the first operation, so all
 * subsequent operations in the batch see app.is_superadmin = 'true'
 * on the SAME connection within the SAME transaction.
 *
 * Returns the results of the user-provided operations (NOT including
 * the SET LOCAL result, which is dropped).
 *
 * USAGE:
 *   const [user, session, transition] = await withAdminTx((p) => [
 *     p.user.create({ data: {...} }),
 *     p.onboardingSession.update({ where: {...}, data: {...} }),
 *     p.onboardingStateTransition.create({ data: {...} }),
 *   ]);
 *
 * IMPORTANT: The callback receives the UNWRAPPED _prismaAdmin client
 * (accessed via $parent) so the returned promises go directly into
 * the batch without the $extends wrapper interception. All operations
 * MUST return PrismaPromise (i.e., be deferred). Do NOT await inside
 * the callback — that defeats the batching.
 *
 * LIMITATIONS:
 *   - All operations must be Prisma model operations (findUnique,
 *     create, update, delete, findMany, updateMany, deleteMany,
 *     upsert, count, aggregate, etc.) that return PrismaPromise.
 *   - $queryRaw / $executeRaw inside the callback are allowed.
 *   - Operations that depend on the result of a previous operation
 *     in the same batch (e.g., insert child rows that need the
 *     parent's auto-generated ID) CANNOT use this helper — the batch
 *     form doesn't expose intermediate results. For those cases, use
 *     client-side ID generation (crypto.randomUUID()) or split into
 *     multiple calls where the dependent IDs are known beforehand.
 *
 * EMPIRICAL VALIDATION (2026-05-20):
 *   Confirmed that (prismaAdmin as any).$parent returns the unwrapped
 *   _prismaAdmin base PrismaClient (identity check: $parent === base).
 *   Batch transactions on the unwrapped client group all operations on
 *   one backend connection (verified via pg_backend_pid()).
 */
export async function withAdminTx<T extends readonly Prisma.PrismaPromise<unknown>[]>(
  build: (p: PrismaAdminUnwrapped) => [...T]
): Promise<{ [K in keyof T]: T[K] extends Prisma.PrismaPromise<infer R> ? R : never }> {
  // Access the underlying _prismaAdmin client. The $extends wrapper exposes
  // this via .$parent (verified against Prisma 7.x).
  const unwrapped: PrismaAdminUnwrapped = (prismaAdmin as any).$parent ?? prismaAdmin;

  const operations = build(unwrapped);

  // Prepend SET LOCAL so it runs on the same connection as the batch.
  const [, ...results] = await unwrapped.$transaction([
    unwrapped.$executeRaw`SET LOCAL app.is_superadmin = 'true'`,
    ...operations,
  ]);

  return results as any;
}

// Type alias for the unwrapped client. Consumers see the same surface
// as prismaAdmin (model accessors, $executeRaw, etc.).
type PrismaAdminUnwrapped = typeof prismaAdmin;
