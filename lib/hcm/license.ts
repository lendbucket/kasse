import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export interface ExpiringLicense {
  id: string;
  staffId: string;
  state: string;
  licenseType: string;
  licenseNumber: string;
  expiresAt: Date;
  daysUntilExpiry: number;
}

/**
 * Find licenses that will expire within the given number of days.
 * Only returns ACTIVE licenses (not already expired/suspended).
 */
export async function findExpiringLicenses(
  tx: Tx,
  args: {
    organizationId: string;
    withinDays: number;
  },
): Promise<ExpiringLicense[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + args.withinDays * 24 * 60 * 60 * 1000);

  const licenses = await tx.licenseVerification.findMany({
    where: {
      organizationId: args.organizationId,
      verificationStatus: "ACTIVE",
      expiresAt: {
        not: null,
        lte: cutoff,
        gte: now,
      },
    },
    orderBy: { expiresAt: "asc" },
  });

  return licenses.map((l) => ({
    id: l.id,
    staffId: l.staffId,
    state: l.state,
    licenseType: l.licenseType,
    licenseNumber: l.licenseNumber,
    expiresAt: l.expiresAt!,
    daysUntilExpiry: Math.ceil(
      (l.expiresAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    ),
  }));
}
