/**
 * Kasse Prisma client (tenant-scoped path).
 *
 * Connection role contract (post-cutover):
 *  - DATABASE_URL points at the kasse_app role, which has rolbypassrls=FALSE.
 *  - RLS policies fire on every query through this client.
 *  - Tenant-scoping is enforced via app.current_org_id session variable,
 *    set by withTenantScope in lib/tenant/db-scope.ts via app_set_tenant().
 *
 * If you need to bypass RLS legitimately (admin operations, cross-tenant
 * reads from a superadmin route), use lib/prismaAdmin.ts instead, which
 * sets app.is_superadmin via the same kasse_app connection — the
 * superadmin "bypass" is a session variable that the RLS policies
 * specifically respect, NOT a role-level bypass.
 *
 * What you must NOT do:
 *  - Add SQL that requires DDL privileges (CREATE/ALTER TABLE, etc.).
 *    kasse_app has CRUD only. Migrations run through a separate
 *    MIGRATION_DATABASE_URL connecting as postgres.
 *  - Construct queries that read pg_settings/pg_roles/other system
 *    tables without thinking about role visibility — some columns are
 *    restricted for non-superusers.
 *  - Assume connection as postgres. After the cutover (post-PR #28f),
 *    this connection is kasse_app.
 *
 * See docs/RLS_AUDIT.md "Role-split architecture" for the full context
 * and the branch verification results.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
