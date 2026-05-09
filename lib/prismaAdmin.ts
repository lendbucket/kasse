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
export const prismaAdmin = _prismaAdmin.$extends({
  query: {
    $allOperations: async ({ args, query }) => {
      return await _prismaAdmin.$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL app.is_superadmin = 'true'`;
        return query(args);
      });
    },
  },
});
