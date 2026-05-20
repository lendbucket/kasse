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
 * The SET LOCAL prelude is included as the first operation, followed by
 * a runtime assertion that verifies the SET LOCAL actually applied within
 * the batch. All subsequent operations run with app.is_superadmin = 'true'
 * on the SAME connection within the SAME transaction.
 *
 * Returns the results of the user-provided operations (NOT including
 * the SET LOCAL or assertion results, which are dropped).
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
 * SAFETY:
 *   - Throws if $parent is unavailable (no silent fallback to the
 *     wrapped client, which would reintroduce the broken pattern).
 *   - Includes a runtime assertion that SET LOCAL applied within the
 *     batch via current_setting() check. If Prisma batch semantics
 *     ever change, this fails fast rather than allowing ops to run
 *     without superadmin context (silent RLS denial).
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
 *   Runtime SET LOCAL assertion passes on every call.
 */
export async function withAdminTx<T extends readonly Prisma.PrismaPromise<unknown>[]>(
  build: (p: PrismaAdminBase) => [...T]
): Promise<{ [K in keyof T]: T[K] extends Prisma.PrismaPromise<infer R> ? R : never }> {
  // Access the underlying _prismaAdmin client via $extends's $parent.
  //
  // $parent is NOT part of the Prisma public API — there is no
  // documentation, issue, or PR to pin to. Verification on Prisma upgrade
  // is empirical via two runtime guardrails in this helper:
  //   1. The identity check below (line ~79): throws if $parent returns
  //      the wrapped client itself.
  //   2. The SET LOCAL assertion (line ~99): throws if SET LOCAL didn't
  //      apply within the batch.
  //
  // If a future Prisma upgrade changes the $extends internals such that
  // $parent is unavailable, returns the wrapped client, or breaks batch
  // semantics, one of those two assertions will fire on the next call to
  // withAdminTx and surface a descriptive error.
  //
  // Verified on Prisma 7.7.x (current package.json pinned version).
  // Throw if unavailable — falling back to the wrapped client would
  // reintroduce the broken pattern.
  const unwrapped = (prismaAdmin as any).$parent as PrismaAdminBase | undefined;
  if (!unwrapped) {
    throw new Error(
      '[withAdminTx] prismaAdmin.$parent is unavailable. ' +
      'This is required to access the unwrapped Prisma client for batch ' +
      'transactions. The $parent property is verified on Prisma 7.x — ' +
      'if you upgraded Prisma, check the $extends API for the equivalent.'
    );
  }
  // Defensive: if $parent ever returns the same wrapped client (or any
  // $extends-wrapped variant) we'd be back to the broken pattern this
  // helper exists to fix. Throw rather than allow silent re-introduction.
  if (unwrapped === (prismaAdmin as any)) {
    throw new Error(
      '[withAdminTx] prismaAdmin.$parent returned the wrapped client itself. ' +
      'This means $extends interception is still in play and batch operations ' +
      'will not run atomically. Check the Prisma version and $extends API.'
    );
  }

  const operations = build(unwrapped);

  // Batch: SET LOCAL + assertion + user operations.
  // The assertion verifies SET LOCAL applied on this connection within
  // this transaction. If Prisma batch semantics ever change such that
  // SET LOCAL runs on a different connection, the assertion catches it.
  const [, isSuperadminCheck, ...results] = await unwrapped.$transaction([
    unwrapped.$executeRaw`SET LOCAL app.is_superadmin = 'true'`,
    unwrapped.$queryRaw<[{ value: string }]>`SELECT current_setting('app.is_superadmin', true) AS value`,
    ...operations,
  ]);

  const assertedValue = (isSuperadminCheck as unknown as [{ value: string }])?.[0]?.value;
  if (assertedValue !== 'true') {
    throw new Error(
      '[withAdminTx] SET LOCAL did not apply within the batch transaction. ' +
      `Expected 'true', got '${assertedValue ?? '(empty)'}'. ` +
      'Prisma batch semantics may have changed — verify $transaction array form still wraps in one tx.'
    );
  }

  // The function signature's mapped type correctly propagates the tuple
  // shape to callers — but Prisma's batch $transaction return type is too
  // loose to cast through without `as any` here. The narrow types are
  // enforced at the build(p) callback return and at the destructuring
  // call sites; this cast covers only the internal forwarding.
  return results as any;
}

// Type alias for the underlying _prismaAdmin base PrismaClient.
//
// IMPORTANT TYPING CAVEAT: at the type level, this is identical to
// `typeof prismaAdmin` (the $extends-wrapped client). At runtime, the
// value passed to the build() callback is the UNWRAPPED base client
// accessed via $parent. The type system cannot distinguish them because
// both expose the same model accessors and $executeRaw / $queryRaw —
// $extends adds no new surface, it just intercepts dispatch.
//
// We rely on this identical surface so that `p.user.create(...)` inside
// the callback compiles. If $extends ever adds new methods that aren't
// on the base client, this type would need to be narrowed.
type PrismaAdminBase = typeof prismaAdmin;
