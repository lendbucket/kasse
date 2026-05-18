import type { Prisma } from "@prisma/client";
import type { CartItemSpec, CartTotals } from "./types";
import { writeAuditLog } from "@/lib/audit/write";
import { AuditAction } from "@/lib/audit/helpers";

type Tx = Prisma.TransactionClient;

/**
 * Create a new Cart linked to an Appointment.
 * Per SD-K-028: cart starts at appointment creation.
 */
export async function createCartForAppointment(
  tx: Tx,
  args: {
    organizationId: string;
    locationId: string;
    appointmentId: string;
    clientId: string | null;
    chairId: string | null;
    activeStylistDeviceId: string | null;
    actorUserId: string | null;
  },
): Promise<{ cartId: string; realtimeChannelId: string }> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const realtimeChannelId = `cart:${args.locationId}:${args.appointmentId}`;

  const cart = await tx.cart.create({
    data: {
      organizationId: args.organizationId,
      locationId: args.locationId,
      appointmentId: args.appointmentId,
      clientId: args.clientId,
      chairId: args.chairId,
      activeStylistDeviceId: args.activeStylistDeviceId,
      realtimeChannelId,
      status: "OPEN",
      expiresAt,
    },
  });

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.CART_CREATE,
    entity: "Cart",
    entityId: cart.id,
    after: { appointmentId: args.appointmentId, chairId: args.chairId },
  });

  return { cartId: cart.id, realtimeChannelId };
}

/**
 * Add an item to a cart and recompute totals.
 */
export async function addCartItem(
  tx: Tx,
  args: {
    organizationId: string;
    cartId: string;
    item: CartItemSpec;
  },
): Promise<{ itemId: string; cartTotals: CartTotals }> {
  const cart = await tx.cart.findFirst({
    where: { id: args.cartId, organizationId: args.organizationId },
    select: { status: true },
  });
  if (!cart) {
    throw new Error("Cart not found");
  }
  if (cart.status !== "OPEN") {
    throw new Error(`Cannot add items to ${cart.status} cart`);
  }

  const subtotalCents =
    args.item.quantity * args.item.unitPriceCents - args.item.discountCents;

  const item = await tx.cartItem.create({
    data: {
      cartId: args.cartId,
      itemType: args.item.itemType,
      displayName: args.item.displayName,
      serviceId: args.item.serviceId,
      appointmentItemId: args.item.appointmentItemId,
      staffId: args.item.staffId,
      quantity: args.item.quantity,
      unitPriceCents: args.item.unitPriceCents,
      discountCents: args.item.discountCents,
      subtotalCents,
      taxableFlag: args.item.taxableFlag,
      isAddOn: args.item.isAddOn,
      notes: args.item.notes,
      displayOrder: args.item.displayOrder,
    },
  });

  const totals = await recomputeCartTotals(tx, {
    cartId: args.cartId,
    organizationId: args.organizationId,
  });
  return { itemId: item.id, cartTotals: totals };
}

/**
 * Recompute all cart totals from cart items + cart-level fields.
 */
export async function recomputeCartTotals(
  tx: Tx,
  args: { cartId: string; organizationId: string },
): Promise<CartTotals> {
  const items = await tx.cartItem.findMany({
    where: { cartId: args.cartId },
    select: { subtotalCents: true, taxCents: true },
  });

  const cart = await tx.cart.findFirst({
    where: { id: args.cartId, organizationId: args.organizationId },
    select: {
      discountCents: true,
      tipCents: true,
      giftCardAppliedCents: true,
      loyaltyAppliedCents: true,
      depositAppliedCents: true,
    },
  });
  if (!cart) {
    throw new Error("Cart not found");
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.subtotalCents, 0);
  const taxCents = items.reduce((sum, i) => sum + i.taxCents, 0);
  const totalCents =
    subtotalCents -
    cart.discountCents +
    taxCents +
    cart.tipCents -
    cart.giftCardAppliedCents -
    cart.loyaltyAppliedCents -
    cart.depositAppliedCents;

  await tx.cart.update({
    where: { id: args.cartId },
    data: { subtotalCents, taxCents, totalCents, updatedAt: new Date() },
  });

  return {
    subtotalCents,
    discountCents: cart.discountCents,
    taxCents,
    tipCents: cart.tipCents,
    giftCardAppliedCents: cart.giftCardAppliedCents,
    loyaltyAppliedCents: cart.loyaltyAppliedCents,
    depositAppliedCents: cart.depositAppliedCents,
    totalCents,
  };
}

/**
 * Void a cart (cancel before payment).
 */
export async function voidCart(
  tx: Tx,
  args: {
    organizationId: string;
    cartId: string;
    actorUserId: string | null;
    reason: string | null;
  },
): Promise<void> {
  const result = await tx.cart.updateMany({
    where: {
      id: args.cartId,
      organizationId: args.organizationId,
      status: { in: ["OPEN", "PENDING_PAYMENT"] },
    },
    data: { status: "VOIDED", updatedAt: new Date() },
  });

  if (result.count === 0) {
    throw new Error("Cart not found or not in voidable state");
  }

  await writeAuditLog({
    userId: args.actorUserId,
    organizationId: args.organizationId,
    action: AuditAction.CART_VOID,
    entity: "Cart",
    entityId: args.cartId,
    after: { reason: args.reason },
  });
}
