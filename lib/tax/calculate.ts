import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Pure tax calculation: subtotal * rate, rounded to nearest cent.
 */
export function calculateTaxCents(args: {
  subtotalCents: number;
  ratePercent: number;
}): number {
  // ratePercent === 0 is valid (tax-exempt scenarios). Both early-returns are
  // correctly handled: 0 * anything = 0, so the math works out either way.
  if (args.subtotalCents <= 0 || args.ratePercent <= 0) return 0;
  return Math.round(args.subtotalCents * (args.ratePercent / 100));
}

/**
 * Look up the active tax rate for a location, optionally filtered by
 * applicability (services vs products).
 */
export async function getActiveTaxRate(
  tx: Tx,
  args: {
    organizationId: string;
    locationId: string;
    applicableTo?: "services" | "products";
  },
): Promise<{ ratePercent: number; taxRateId: string } | null> {
  const today = new Date();

  const where: Prisma.TaxRateWhereInput = {
    organizationId: args.organizationId,
    locationId: args.locationId,
    isActive: true,
    effectiveStartDate: { lte: today },
    OR: [
      { effectiveEndDate: null },
      { effectiveEndDate: { gte: today } },
    ],
  };

  if (args.applicableTo === "services") {
    where.applicableToServices = true;
  } else if (args.applicableTo === "products") {
    where.applicableToProducts = true;
  }

  const rate = await tx.taxRate.findFirst({
    where,
    orderBy: { effectiveStartDate: "desc" },
    select: { id: true, ratePercent: true },
  });

  if (!rate) return null;
  return { ratePercent: rate.ratePercent, taxRateId: rate.id };
}
