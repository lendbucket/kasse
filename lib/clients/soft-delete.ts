import type { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit/write";
import { AuditAction } from "@/lib/audit/helpers";

type Tx = Prisma.TransactionClient;

/**
 * Soft-delete a client. Sets softDeletedAt timestamp + audit log entry.
 * Caller must have CLIENT.DELETE permission (enforced at route level).
 *
 * Uses organizationId in both the find and update WHERE clauses as
 * defense-in-depth tenant verification (on top of RLS).
 */
export async function softDeleteClient(
  tx: Tx,
  args: {
    clientId: string;
    organizationId: string;
    actorUserId: string;
  },
): Promise<void> {
  const before = await tx.client.findFirst({
    where: { id: args.clientId, organizationId: args.organizationId },
    select: { softDeletedAt: true, name: true },
  });
  if (!before || before.softDeletedAt) {
    throw new Error("Client not found or already deleted");
  }

  const now = new Date();
  const result = await tx.client.updateMany({
    where: { id: args.clientId, organizationId: args.organizationId },
    data: { softDeletedAt: now },
  });
  if (result.count === 0) {
    throw new Error("Client not found or already deleted");
  }

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.CLIENT_SOFT_DELETE,
    entity: "Client",
    entityId: args.clientId,
    before: { softDeletedAt: null },
    after: { softDeletedAt: now.toISOString() },
    changedFields: ["softDeletedAt"],
  });
}
