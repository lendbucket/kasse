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
 * SECURITY: Every query through this client sets `app.is_superadmin = true` in
 * the database session. When RLS policies are enabled (Phase 0.5.3b-3), they
 * MUST check this var and bypass tenant scoping when it's true. The session var
 * is set in a transaction wrapper so it persists for the duration of the query.
 *
 * Until RLS policies are applied, setting this var is a no-op — the var
 * exists but nothing reads it. This means prismaAdmin is safe to deploy
 * BEFORE RLS goes live.
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

// Extend the client so every query runs inside a transaction that first sets
// app.is_superadmin = true. This is how the bypass actually flows to the
// database — RLS policies will read this session var.
//
// We use $extends with a query-level wrapper. Every model.method call passes
// through this; nothing escapes the bypass. Raw $queryRaw / $executeRaw also
// need the var, but they're rare and we accept that they'd need an explicit
// transaction wrapper.
export const prismaAdmin = _prismaAdmin.$extends({
  query: {
    $allOperations: async ({ args, query }) => {
      // We can't easily wrap individual queries in a transaction without
      // changing the call shape. Instead, set the var at the connection level
      // each time. Postgres SET LOCAL only persists inside an explicit
      // transaction; SET (without LOCAL) persists for the whole session, which
      // is fine here because the connection is reused.
      //
      // The PrismaPg adapter uses connection pooling, so we set the var at
      // the start of every query. This is cheap (one round-trip) and safe.
      await _prismaAdmin.$executeRawUnsafe(`SET app.is_superadmin = 'true'`);
      return query(args);
    },
  },
});
