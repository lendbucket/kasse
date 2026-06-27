import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { getActiveTaxRate, calculateTaxCents } from "@/lib/tax/calculate";
import { CartStatus, OrderStatus, PaymentStatus, PaymentChannel, ItemType, IMMEDIATE_TENDERS } from "./constants";

export type CheckoutLineInput = { serviceId: string; staffId?: string | null; quantity?: number };
export type CheckoutInput = {
  organizationId: string;
  locationId: string;
  clientId?: string | null;
  clientName?: string | null;
  appointmentId?: string | null;
  items: CheckoutLineInput[];
  tipCents?: number;
  discountCents?: number; // order-level; 3a UI sends 0
  method: string;         // PaymentMethod.* — must be in IMMEDIATE_TENDERS
  idempotencyKey: string;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};
export type CheckoutError =
  | "no_items" | "too_many_items" | "invalid_quantity" | "invalid_tip" | "invalid_discount"
  | "unsupported_tender" | "service_not_found" | "staff_not_found" | "location_mismatch";
type Line = { displayName: string; staffId: string | null; quantity: number; unitPriceCents: number; subtotalCents: number; taxCents: number };
export type CheckoutResult =
  | { ok: true; deduped: boolean; orderId: string; orderNumber: string; subtotalCents: number; discountCents: number; taxCents: number; tipCents: number; totalCents: number; paymentId: string; lines: Line[] }
  | { ok: false; error: CheckoutError; detail?: string };

const MAX_ITEMS = 50;

async function nextOrderNumber(tx: Prisma.TransactionClient, locationId: string): Promise<string> {
  const now = new Date();
  const y = now.getUTCFullYear(), mo = now.getUTCMonth(), d = now.getUTCDate();
  const datePart = `${y}${String(mo + 1).padStart(2, "0")}${String(d).padStart(2, "0")}`;
  const start = new Date(Date.UTC(y, mo, d));
  const end = new Date(Date.UTC(y, mo, d + 1));
  const todayCount = await tx.order.count({ where: { locationId, createdAt: { gte: start, lt: end } } });
  return `${datePart}-${String(todayCount + 1).padStart(3, "0")}`;
}

/**
 * 3a immediate (cash/manual) checkout. Creates Cart -> Order(+items) -> Payment and
 * closes the order, all SERVER-priced in integer cents. CARD is NOT handled here
 * (routes through SalonTransact in 3b). Caller passes a tenant-scoped tx and retries
 * the whole tx on a P2002 orderNumber collision.
 */
export async function createImmediateCheckout(tx: Prisma.TransactionClient, input: CheckoutInput): Promise<CheckoutResult> {
  const method = (input.method ?? "").toUpperCase();
  if (!IMMEDIATE_TENDERS.includes(method)) return { ok: false, error: "unsupported_tender", detail: method };
  if (!Array.isArray(input.items) || input.items.length === 0) return { ok: false, error: "no_items" };
  if (input.items.length > MAX_ITEMS) return { ok: false, error: "too_many_items" };

  const tipCents = input.tipCents ?? 0;
  if (!Number.isInteger(tipCents) || tipCents < 0) return { ok: false, error: "invalid_tip" };
  const orderDiscountCents = input.discountCents ?? 0;
  if (!Number.isInteger(orderDiscountCents) || orderDiscountCents < 0) return { ok: false, error: "invalid_discount" };

  // Idempotency: a payment with this key already exists -> return its order.
  const existingPayment = await tx.payment.findFirst({
    where: { organizationId: input.organizationId, idempotencyKey: input.idempotencyKey },
    select: { id: true, orderId: true },
  });
  if (existingPayment) {
    const o = await tx.order.findUnique({
      where: { id: existingPayment.orderId },
      select: { id: true, orderNumber: true, subtotalCents: true, discountCents: true, taxCents: true, tipCents: true, totalCents: true,
        items: { select: { displayName: true, staffId: true, quantity: true, unitPriceCents: true, subtotalCents: true, taxCents: true }, orderBy: { displayOrder: "asc" } } },
    });
    if (o) return { ok: true, deduped: true, orderId: o.id, orderNumber: o.orderNumber, subtotalCents: o.subtotalCents, discountCents: o.discountCents, taxCents: o.taxCents, tipCents: o.tipCents, totalCents: o.totalCents, paymentId: existingPayment.id, lines: o.items.map((i) => ({ displayName: i.displayName, staffId: i.staffId, quantity: i.quantity, unitPriceCents: i.unitPriceCents, subtotalCents: i.subtotalCents, taxCents: i.taxCents })) };
  }

  // Server-authoritative services (price, taxable, location scope).
  const serviceIds = Array.from(new Set(input.items.map((i) => i.serviceId)));
  const services = await tx.service.findMany({
    where: { id: { in: serviceIds }, organizationId: input.organizationId, isActive: true, softDeletedAt: null },
    select: { id: true, name: true, price: true, taxable: true, locationId: true },
  });
  const svcById = new Map(services.map((s) => [s.id, s]));
  for (const id of serviceIds) {
    const s = svcById.get(id);
    if (!s) return { ok: false, error: "service_not_found", detail: id };
    if (s.locationId !== null && s.locationId !== input.locationId) return { ok: false, error: "location_mismatch", detail: id };
  }

  // Validate referenced staff (in-org, active).
  const staffIds = Array.from(new Set(input.items.map((i) => i.staffId).filter((v): v is string => !!v)));
  if (staffIds.length) {
    const staff = await tx.staff.findMany({ where: { id: { in: staffIds }, organizationId: input.organizationId, isActive: true, softDeletedAt: null }, select: { id: true } });
    const okIds = new Set(staff.map((s) => s.id));
    for (const sid of staffIds) if (!okIds.has(sid)) return { ok: false, error: "staff_not_found", detail: sid };
  }

  // Per-stylist price overrides (cents) for present (service,staff) pairs.
  const pairs = input.items.filter((i) => i.staffId).map((i) => ({ serviceId: i.serviceId, staffId: i.staffId as string }));
  const overrides = pairs.length
    ? await tx.serviceStaffOverride.findMany({ where: { OR: pairs.map((k) => ({ serviceId: k.serviceId, staffId: k.staffId })) }, select: { serviceId: true, staffId: true, priceCents: true } })
    : [];
  const overrideByPair = new Map(overrides.filter((o) => o.priceCents != null).map((o) => [`${o.serviceId}:${o.staffId}`, o.priceCents as number]));

  // Active services tax rate (null if none OR rate doesn't apply to services).
  const svcRate = await getActiveTaxRate(tx, { organizationId: input.organizationId, locationId: input.locationId, applicableTo: "services" });

  type Built = { serviceId: string; staffId: string | null; displayName: string; quantity: number; unitPriceCents: number; subtotalCents: number; taxableFlag: boolean; taxCents: number; displayOrder: number };
  const built: Built[] = [];
  let idx = 0;
  for (const item of input.items) {
    const qty = item.quantity ?? 1;
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) return { ok: false, error: "invalid_quantity", detail: item.serviceId };
    const s = svcById.get(item.serviceId)!;
    const staffId = item.staffId ?? null;
    const override = staffId ? overrideByPair.get(`${item.serviceId}:${staffId}`) : undefined;
    const unitPriceCents = override ?? Math.round(s.price * 100);
    const subtotalCents = unitPriceCents * qty;
    const taxableFlag = s.taxable === true;
    const taxCents = taxableFlag && svcRate ? calculateTaxCents({ subtotalCents, ratePercent: svcRate.ratePercent }) : 0;
    built.push({ serviceId: item.serviceId, staffId, displayName: s.name, quantity: qty, unitPriceCents, subtotalCents, taxableFlag, taxCents, displayOrder: idx++ });
  }

  const subtotalCents = built.reduce((a, b) => a + b.subtotalCents, 0);
  const discountCents = Math.min(orderDiscountCents, subtotalCents);
  const taxCents = built.reduce((a, b) => a + b.taxCents, 0);
  const totalCents = subtotalCents - discountCents + taxCents + tipCents;

  const itemCreate = built.map((b) => ({
    itemType: ItemType.SERVICE, displayName: b.displayName, serviceId: b.serviceId, staffId: b.staffId,
    quantity: b.quantity, unitPriceCents: b.unitPriceCents, subtotalCents: b.subtotalCents, taxableFlag: b.taxableFlag, taxCents: b.taxCents, displayOrder: b.displayOrder,
  }));

  const cart = await tx.cart.create({
    data: {
      organizationId: input.organizationId, locationId: input.locationId,
      appointmentId: input.appointmentId ?? null, clientId: input.clientId ?? null,
      realtimeChannelId: randomUUID(), status: CartStatus.CONVERTED,
      subtotalCents, discountCents, taxCents, tipCents, totalCents,
      items: { create: itemCreate },
    },
    select: { id: true },
  });

  const orderNumber = await nextOrderNumber(tx, input.locationId);
  const order = await tx.order.create({
    data: {
      organizationId: input.organizationId, locationId: input.locationId, cartId: cart.id, orderNumber,
      appointmentId: input.appointmentId ?? null, clientId: input.clientId ?? null, clientNameSnapshot: input.clientName ?? null,
      subtotalCents, discountCents, taxCents, tipCents, totalCents, paidCents: totalCents, balanceDueCents: 0,
      status: OrderStatus.CLOSED, closedAt: new Date(),
      items: { create: itemCreate },
    },
    select: { id: true, orderNumber: true },
  });

  const payment = await tx.payment.create({
    data: {
      organizationId: input.organizationId, orderId: order.id, amountCents: totalCents, tipCents,
      paymentMethod: method, paymentChannel: PaymentChannel.IN_PERSON, status: PaymentStatus.COMPLETED, processedAt: new Date(),
      idempotencyKey: input.idempotencyKey, deviceId: input.deviceId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null,
    },
    select: { id: true },
  });

  return { ok: true, deduped: false, orderId: order.id, orderNumber: order.orderNumber, subtotalCents, discountCents, taxCents, tipCents, totalCents, paymentId: payment.id,
    lines: built.map((b) => ({ displayName: b.displayName, staffId: b.staffId, quantity: b.quantity, unitPriceCents: b.unitPriceCents, subtotalCents: b.subtotalCents, taxCents: b.taxCents })) };
}
