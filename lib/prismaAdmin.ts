/**
 * Kasse prismaAdmin client (superadmin path).
 *
 * What this is:
 *  - Same Postgres connection as lib/prisma.ts (kasse_app role, no BYPASSRLS).
 *  - Inside every transaction, sets app.is_superadmin = true via SET LOCAL
 *    so RLS policies treat queries as superadmin reads.
 *  - This is NOT a role-level bypass. It's a session-variable signal that
 *    the RLS policies in 20260511121142_rls_policies/migration.sql
 *    specifically check.
 *
 * Connection role contract (post-cutover):
 *  - DATABASE_URL points at kasse_app (rolbypassrls=FALSE).
 *  - prismaAdmin uses the SAME connection — there is NO separate admin
 *    connection role. The privilege is granted via session variable, not
 *    via switching to a more-privileged role.
 *  - This means RLS policies CAN audit "who is acting as superadmin" by
 *    looking at app.actor_id (set by app_set_actor) — something that
 *    would be lost if we used a separate role.
 *
 * What you must NOT do:
 *  - Use prismaAdmin from a tenant-facing route. Routes that should be
 *    scoped to a tenant must use lib/prisma.ts with withTenantScope.
 *  - Bypass auth checks. prismaAdmin assumes the caller has already
 *    established (via requireSuperadminContext) that the action is
 *    authorized at the application layer.
 *  - Add DDL operations. kasse_app has CRUD only.
 *
 * See docs/RLS_AUDIT.md "Tenant context patterns" for the route
 * classification rules.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * prismaAdmin — Prisma client that bypasses RLS policies.
 *
 * USAGE: This client is for routes that legitimately need to operate without a
 * tenant context. The legitimate cases are:
 *   - PRE_SESSION (auth routes — signup, login, password reset, email verify)
 *   - SUPERADMIN  (Command Center — admin/* routes)
 *   - ONBOARDING  (creating an organization — onboarding/* routes)
 *
 * See docs/RLS_AUDIT.md for the canonical classification of which routes use
 * this client.
 *
 * SECURITY: Every query through this client runs inside an explicit
 * transaction that issues `SET LOCAL app.is_superadmin = 'true'`. The
 * `LOCAL` qualifier scopes the variable to the transaction; when the
 * transaction commits, the var clears, and the connection returning to the
 * pool carries no superadmin flag for the next request.
 *
 * Using SET without LOCAL was rejected during review because it persists
 * for the connection's lifetime, leaking is_superadmin=true to subsequent
 * tenant-scoped requests that reuse the same pooled connection.
 *
 * When RLS policies are enabled (Phase 0.5.3b-3), they MUST check this
 * session var and bypass tenant scoping when it's true. Until policies are
 * applied, setting the var is a no-op — the var exists but nothing reads
 * it. prismaAdmin is therefore safe to deploy BEFORE RLS goes live.
 *
 * NEVER import this client from a route under app/api/* unless the route is
 * explicitly classified in docs/RLS_AUDIT.md as PRE_SESSION, SUPERADMIN, or
 * ONBOARDING. Importing this from a tenant-scoped route is a SEVERE security
 * regression — it would allow cross-tenant data access without the RLS
 * defense-in-depth.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for prismaAdmin");
}

const adapter = new PrismaPg({ connectionString });

const _prismaAdmin = new PrismaClient({ adapter });

// Every prismaAdmin operation runs inside an explicit transaction so we can
// use SET LOCAL — which is scoped to the transaction. When the transaction
// commits or aborts, the connection returns to the pool with the
// app.is_superadmin var cleared.
//
// Using SET (without LOCAL) was wrong: it persists for the entire session
// (i.e. the lifetime of the pooled connection). A subsequent tenant-scoped
// request reusing that connection would inherit is_superadmin=true and,
// under RLS, bypass tenant scoping — a cross-tenant data exposure vector.
//
// Caveat: $queryRaw / $executeRaw / $executeRawUnsafe called directly on
// prismaAdmin do NOT pass through this $extends wrapper. If we ever add a
// raw SQL call in an auth/admin/onboarding route, it MUST be wrapped in an
// explicit prismaAdmin.$transaction(...) with its own SET LOCAL prelude.
// See docs/RLS_AUDIT.md "Known limitations" for the standing record.
//
// Every prismaAdmin operation runs inside a BATCH transaction so the
// SET LOCAL and the actual query run on the same connection in the same
// transaction. Earlier interactive-transaction form was broken:
//
//   await _prismaAdmin.$transaction(async (tx) => {
//     await tx.$executeRaw`SET LOCAL app.is_superadmin = 'true'`;
//     return query(args);  // ← BUG: ran on _prismaAdmin, not tx
//   });
//
// query(args) executes against the outer _prismaAdmin instance, which picks
// up a different pooled connection that doesn't have the session variable
// set. RLS policies that check current_setting('app.is_superadmin') see
// nothing → query returns empty → silent denial.
//
// The batch-array form below sends both operations as a single Prisma
// transaction batch, guaranteeing they run on the same connection.
//
// Reference: https://www.prisma.io/docs/orm/prisma-client/client-extensions/query
//   (section "Wrap a query into a batch transaction")
//
// SET LOCAL is scoped to the transaction; when it commits, the variable
// clears, and the pooled connection returns clean for subsequent requests.
export const prismaAdmin = _prismaAdmin.$extends({
  query: {
    $allOperations: async ({ args, query }) => {
      const [, result] = await _prismaAdmin.$transaction([
        _prismaAdmin.$executeRaw`SET LOCAL app.is_superadmin = 'true'`,
        query(args),
      ]);
      return result;
    },
  },
});
