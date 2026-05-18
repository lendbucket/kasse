import type { Prisma } from "@prisma/client";
import type { DeductionSource } from "./types";
import { writeAuditLog } from "@/lib/audit/write";

type Tx = Prisma.TransactionClient;

/**
 * Record an inventory deduction: validates input, creates the deduction record,
 * and updates the InventoryLevel for the location + variant.
 */
export async function recordInventoryDeduction(
  tx: Tx,
  args: {
    organizationId: string;
    locationId: string;
    productVariantId: string;
    quantityUsed: number;
    valueCents?: number;
    source: DeductionSource;
    appointmentId?: string | null;
    staffId?: string | null;
    colorFormulaId?: string | null;
    transferToLocationId?: string | null;
    notes?: string | null;
    actorUserId?: string | null;
  },
): Promise<{ deductionId: string; newQuantityOnHand: number; wasNegativeStock: boolean; wasNewLevel: boolean }> {
  if (args.quantityUsed <= 0) {
    throw new Error("quantityUsed must be greater than 0");
  }

  // Create deduction record
  const deduction = await tx.inventoryDeduction.create({
    data: {
      organizationId: args.organizationId,
      locationId: args.locationId,
      productVariantId: args.productVariantId,
      quantityUsed: args.quantityUsed,
      valueCents: args.valueCents ?? 0,
      source: args.source,
      appointmentId: args.appointmentId ?? undefined,
      staffId: args.staffId ?? undefined,
      colorFormulaId: args.colorFormulaId ?? undefined,
      transferToLocationId: args.transferToLocationId ?? undefined,
      notes: args.notes ?? undefined,
    },
  });

  // Check if InventoryLevel exists before upsert to track wasNewLevel flag
  const existingLevel = await tx.inventoryLevel.findUnique({
    where: {
      locationId_productVariantId: {
        locationId: args.locationId,
        productVariantId: args.productVariantId,
      },
    },
    select: { id: true },
  });
  const wasNewLevel = !existingLevel;

  // If no InventoryLevel exists for this location+variant, create one with a NEGATIVE
  // quantityOnHand to record the deduction. This is intentional for audit-trail
  // completeness when stock-tracking hasn't been initialized for a product yet.
  // Owners can run a count adjustment later to set actual stock; the negative tracks
  // what was used before tracking started. UI consumers MUST check for negative values
  // and surface them as "untracked usage" rather than literal stock counts.
  const level = await tx.inventoryLevel.upsert({
    where: {
      locationId_productVariantId: {
        locationId: args.locationId,
        productVariantId: args.productVariantId,
      },
    },
    update: {
      quantityOnHand: { decrement: args.quantityUsed },
      lastDeductedAt: new Date(),
    },
    create: {
      organizationId: args.organizationId,
      locationId: args.locationId,
      productVariantId: args.productVariantId,
      quantityOnHand: -args.quantityUsed,
      lastDeductedAt: new Date(),
    },
  });

  await writeAuditLog({
    userId: args.actorUserId ?? null,
    organizationId: args.organizationId,
    action: "inventory.deduct" as never,
    entity: "InventoryDeduction",
    entityId: deduction.id,
    after: {
      productVariantId: args.productVariantId,
      quantityUsed: args.quantityUsed,
      source: args.source,
      newQuantityOnHand: level.quantityOnHand,
    },
  });

  return {
    deductionId: deduction.id,
    newQuantityOnHand: level.quantityOnHand,
    wasNegativeStock: level.quantityOnHand < 0,
    wasNewLevel,
  };
}
