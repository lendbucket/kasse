import type { Prisma } from "@prisma/client";
import type { TipSplitMethod, AppointmentItemForSplit, TipDistributionResult } from "./types";
import { writeAuditLog } from "@/lib/audit/write";
import { computeSplit } from "./compute";

// Re-export for consumers that want the pure function directly
export { computeSplit };

type Tx = Prisma.TransactionClient;

/**
 * DB version: load org TipSplit config, compute split, persist TipDistribution rows, audit log.
 */
export async function distributeTipForAppointment(
  tx: Tx,
  args: {
    organizationId: string;
    appointmentId: string;
    orderId?: string | null;
    paymentId?: string | null;
    tipCents: number;
    items: AppointmentItemForSplit[];
    actorUserId: string | null;
  },
): Promise<TipDistributionResult[]> {
  // Load org's TipSplit config
  const config = await tx.tipSplit.findUnique({
    where: { organizationId: args.organizationId },
  });
  let method: TipSplitMethod = (config?.splitMethod as TipSplitMethod) ?? "PRIMARY_ONLY";

  // If method is EXPLICIT_PERCENT but no config exists, fall back to PRIMARY_ONLY
  // with a logged warning indicating the misconfiguration.
  if (
    method === "EXPLICIT_PERCENT" &&
    (!config?.explicitPercentsConfig ||
      Object.keys(config.explicitPercentsConfig as object).length === 0)
  ) {
    console.warn(
      `[tip-distribution] Org ${args.organizationId} configured EXPLICIT_PERCENT ` +
      `but no explicitPercentsConfig present. Falling back to PRIMARY_ONLY.`,
    );
    method = "PRIMARY_ONLY";
  }

  const results = computeSplit(method, args.tipCents, args.items);

  for (const r of results) {
    if (r.amountCents <= 0) continue;
    await tx.tipDistribution.create({
      data: {
        organizationId: args.organizationId,
        appointmentId: args.appointmentId,
        orderId: args.orderId ?? undefined,
        paymentId: args.paymentId ?? undefined,
        staffId: r.staffId,
        amountCents: r.amountCents,
        methodUsed: method,
        splitWeight: r.splitWeight,
      },
    });
  }

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: "tip.distribute" as never,
    entity: "TipDistribution",
    entityId: args.appointmentId,
    after: { method, tipCents: args.tipCents, splits: results.length },
  });

  return results;
}
