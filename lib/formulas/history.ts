import type { Prisma } from "@prisma/client";
import type { ColorFormulaRecord, FormulaIngredient } from "./types";

type Tx = Prisma.TransactionClient;

/**
 * Get formula history for a client, most recent first.
 * Requires organizationId for defense-in-depth tenant verification.
 */
export async function getClientFormulaHistory(
  tx: Tx,
  args: { clientId: string; organizationId: string; limit?: number },
): Promise<ColorFormulaRecord[]> {
  const limit = args.limit ?? 50;
  const formulas = await tx.colorFormula.findMany({
    where: {
      clientId: args.clientId,
      organizationId: args.organizationId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return formulas.map((f) => ({
    id: f.id,
    clientId: f.clientId,
    appointmentId: f.appointmentId,
    staffId: f.staffId,
    formulaVersion: f.formulaVersion,
    formulaIngredients: f.formulaIngredients as unknown as FormulaIngredient[],
    processingMinutes: f.processingMinutes,
    resultNotes: f.resultNotes,
    beforePhotoUrl: f.beforePhotoUrl,
    afterPhotoUrl: f.afterPhotoUrl,
    allergyChecked: f.allergyChecked,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));
}

/**
 * Compute next formula version for a client (auto-increment).
 * Requires organizationId for defense-in-depth tenant verification.
 */
export async function nextFormulaVersionForClient(
  tx: Tx,
  args: { clientId: string; organizationId: string },
): Promise<number> {
  const latest = await tx.colorFormula.findFirst({
    where: {
      clientId: args.clientId,
      organizationId: args.organizationId,
    },
    orderBy: { formulaVersion: "desc" },
    select: { formulaVersion: true },
  });
  return (latest?.formulaVersion ?? 0) + 1;
}
