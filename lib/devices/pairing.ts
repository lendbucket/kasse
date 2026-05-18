import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Pair a customer display device to a chair.
 */
export async function pairCustomerDisplayToChair(
  tx: Tx,
  args: {
    organizationId: string;
    chairId: string;
    deviceId: string;
  },
): Promise<{ pairingId: string }> {
  const chair = await tx.chair.findFirst({
    where: { id: args.chairId, organizationId: args.organizationId },
  });
  const device = await tx.device.findFirst({
    where: { id: args.deviceId, organizationId: args.organizationId },
  });
  if (!chair || !device) {
    throw new Error("Chair or device not found");
  }
  if (device.role !== "CUSTOMER_DISPLAY") {
    throw new Error(
      `Device role must be CUSTOMER_DISPLAY, got ${device.role}`,
    );
  }

  // Deactivate any existing pairing for this chair
  await tx.devicePairing.updateMany({
    where: { chairId: args.chairId, isActive: true },
    data: { isActive: false, unpairedAt: new Date() },
  });

  const pairing = await tx.devicePairing.create({
    data: {
      chairId: args.chairId,
      customerDisplayDeviceId: args.deviceId,
      isActive: true,
    },
  });

  // Defense-in-depth: use updateMany with organizationId compound where
  const updateResult = await tx.device.updateMany({
    where: { id: args.deviceId, organizationId: args.organizationId },
    data: { pairedChairId: args.chairId },
  });
  if (updateResult.count === 0) {
    throw new Error("Device not found in organization (defense-in-depth)");
  }

  return { pairingId: pairing.id };
}

/**
 * Get the active customer display device for a chair.
 */
export async function getActiveCustomerDisplay(
  tx: Tx,
  args: { organizationId: string; chairId: string },
): Promise<{ deviceId: string; realtimeChannelId: string | null } | null> {
  const pairing = await tx.devicePairing.findFirst({
    where: {
      chairId: args.chairId,
      isActive: true,
      chair: {
        organizationId: args.organizationId,
      },
    },
  });
  if (!pairing?.customerDisplayDeviceId) {
    return null;
  }
  const device = await tx.device.findUnique({
    where: { id: pairing.customerDisplayDeviceId },
    select: { realtimeChannelId: true },
  });
  return {
    deviceId: pairing.customerDisplayDeviceId,
    realtimeChannelId: device?.realtimeChannelId ?? null,
  };
}
