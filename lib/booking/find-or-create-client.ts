import type { Prisma } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

/**
 * Finds an existing client or creates a new one within the current tenant scope.
 *
 * Match logic (org-scoped, not soft-deleted):
 *   1. If phone provided → match on organizationId + phone
 *   2. Else if email provided → match on organizationId + email
 *   3. No match → create
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
    const existing = await tx.client.findFirst({
      where: {
        organizationId,
        phone: phone.trim(),
        softDeletedAt: null,
      },
      select: { id: true },
    });
    if (existing) return { clientId: existing.id, created: false };
  } else if (email?.trim()) {
    const existing = await tx.client.findFirst({
      where: {
        organizationId,
        email: email.trim(),
        softDeletedAt: null,
      },
      select: { id: true },
    });
    if (existing) return { clientId: existing.id, created: false };
  }

  // No match → create
  const client = await tx.client.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      locationId,
      organizationId,
    },
  });

  return { clientId: client.id, created: true };
}
