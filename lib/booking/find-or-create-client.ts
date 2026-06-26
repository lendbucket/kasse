import { Prisma } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

/**
 * Finds an existing client or creates a new one within the current tenant scope.
 *
 * Match logic (org-scoped, not soft-deleted):
 *   1. If phone provided → match on organizationId + phone
 *   2. If email provided → match on organizationId + email
 *   3. No match → create
 *
 * Race safety: the partial-unique indexes idx_client_org_phone_unique and
 * idx_client_org_email_unique are the backstop. If a concurrent booking creates
 * the same client between our findFirst and our create, the create throws P2002.
 * We catch it, roll back to a SAVEPOINT (so the enclosing withTenantScope
 * transaction stays valid), re-query, and return the existing row with
 * created:false — turning a lost race into a graceful reuse instead of a 500.
 *
 * MUST be called inside an existing withTenantScope transaction — does NOT open
 * its own scope.
 */
export async function findOrCreateClient(
  tx: PrismaTx,
  input: {
    organizationId: string;
    locationId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  },
): Promise<{ clientId: string; created: boolean }> {
  const { organizationId, locationId, name, email, phone } = input;

  if (!name.trim()) {
    throw new Error("Client name is required");
  }

  // Try to find an existing client by phone first, then email
  if (phone?.trim()) {
    const byPhone = await tx.client.findFirst({
      where: {
        organizationId,
        phone: phone.trim(),
        softDeletedAt: null,
      },
      select: { id: true },
    });
    if (byPhone) return { clientId: byPhone.id, created: false };
  }
  if (email?.trim()) {
    const byEmail = await tx.client.findFirst({
      where: {
        organizationId,
        email: email.trim(),
        softDeletedAt: null,
      },
      select: { id: true },
    });
    if (byEmail) return { clientId: byEmail.id, created: false };
  }

  // No match → create with SAVEPOINT so a P2002 race doesn't poison the
  // enclosing withTenantScope transaction. Postgres aborts the transaction on a
  // unique violation unless a SAVEPOINT catches it.
  await tx.$executeRawUnsafe("SAVEPOINT before_client_create");

  try {
    const client = await tx.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        locationId,
        organizationId,
      },
    });
    await tx.$executeRawUnsafe("RELEASE SAVEPOINT before_client_create");
    return { clientId: client.id, created: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Lost a create race — another concurrent booking created this client
      // first (blocked by idx_client_org_phone_unique / idx_client_org_email_unique).
      // Roll back to the savepoint so the transaction is usable again.
      await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT before_client_create");

      // Re-query and use the existing row instead of failing the booking.
      if (phone?.trim()) {
        const byPhone = await tx.client.findFirst({
          where: { organizationId, phone: phone.trim(), softDeletedAt: null },
          select: { id: true },
        });
        if (byPhone) return { clientId: byPhone.id, created: false };
      }
      if (email?.trim()) {
        const byEmail = await tx.client.findFirst({
          where: { organizationId, email: email.trim(), softDeletedAt: null },
          select: { id: true },
        });
        if (byEmail) return { clientId: byEmail.id, created: false };
      }
    }
    throw e;
  }
}
