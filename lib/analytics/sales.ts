import { Prisma } from "@prisma/client";
import { OrderStatus, PaymentStatus } from "@/lib/checkout/constants";

type PrismaTx = Prisma.TransactionClient;
export type SalesGrain = "day" | "week" | "month";

export interface SalesOpts { startDate: string; endDate: string; grain: SalesGrain; locationId?: string; }
export interface SalesSeriesPoint { period: string; orders: number; grossCents: number; netCents: number; taxCents: number; tipCents: number; }
export interface StaffSalesRow { staffId: string | null; staffName: string; revenueCents: number; items: number; orders: number; pctOfRevenue: number; }
export interface ServiceSalesRow { displayName: string; revenueCents: number; quantity: number; }
export interface PaymentMixRow { method: string; amountCents: number; count: number; }
export interface SalesSummary { orders: number; grossCents: number; netCents: number; subtotalCents: number; discountCents: number; taxCents: number; tipCents: number; itemsSold: number; avgTicketCents: number; }
export interface SalesResult { summary: SalesSummary; series: SalesSeriesPoint[]; byStaff: StaffSalesRow[]; byService: ServiceSalesRow[]; byPaymentMethod: PaymentMixRow[]; range: { startDate: string; endDate: string; grain: SalesGrain }; }

/**
 * Sales analytics over the modern Order/OrderItem/Payment cents ledger.
 * MUST run inside withTenantScope — RLS scopes every table by org.
 * All inputs are parameterized; the grain bucket is chosen from a fixed whitelist.
 */
export async function computeSales(tx: PrismaTx, opts: SalesOpts): Promise<SalesResult> {
  const { startDate, endDate, grain, locationId } = opts;

  const ts = Prisma.sql`(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')`;
  const bucketExpr = (() => {
    switch (grain) {
      case "day": return Prisma.sql`${ts}::date`;
      case "week": return Prisma.sql`date_trunc('week', ${ts})::date`;
      case "month": return Prisma.sql`date_trunc('month', ${ts})::date`;
    }
  })();
  const dateRange = Prisma.sql`${ts}::date BETWEEN ${startDate}::date AND ${endDate}::date`;
  const locFilter = locationId ? Prisma.sql`AND o."locationId" = ${locationId}` : Prisma.empty;
  const closed = Prisma.sql`o.status = ${OrderStatus.CLOSED}`;

  const seriesRaw = await tx.$queryRaw<Array<{ period: Date | string; orders: bigint | number; gross: bigint | number; subtotal: bigint | number; discount: bigint | number; tax: bigint | number; tip: bigint | number }>>`
    SELECT ${bucketExpr} AS period,
      COUNT(*) AS orders,
      COALESCE(SUM(o."totalCents"),0) AS gross,
      COALESCE(SUM(o."subtotalCents"),0) AS subtotal,
      COALESCE(SUM(o."discountCents"),0) AS discount,
      COALESCE(SUM(o."taxCents"),0) AS tax,
      COALESCE(SUM(o."tipCents"),0) AS tip
    FROM "Order" o
    WHERE ${closed} AND ${dateRange} ${locFilter}
    GROUP BY period
    ORDER BY period ASC
  `;

  const [itemsRow] = await tx.$queryRaw<Array<{ items: bigint | number }>>`
    SELECT COALESCE(SUM(oi.quantity),0) AS items
    FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
    WHERE ${closed} AND ${dateRange} ${locFilter}
  `;

  const staffRaw = await tx.$queryRaw<Array<{ staffId: string | null; revenue: bigint | number; items: bigint | number; orders: bigint | number }>>`
    SELECT oi."staffId" AS "staffId",
      COALESCE(SUM(oi."subtotalCents"),0) AS revenue,
      COALESCE(SUM(oi.quantity),0) AS items,
      COUNT(DISTINCT oi."orderId") AS orders
    FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
    WHERE ${closed} AND ${dateRange} ${locFilter}
    GROUP BY oi."staffId"
    ORDER BY revenue DESC
  `;

  const serviceRaw = await tx.$queryRaw<Array<{ displayName: string; revenue: bigint | number; qty: bigint | number }>>`
    SELECT oi."displayName" AS "displayName",
      COALESCE(SUM(oi."subtotalCents"),0) AS revenue,
      COALESCE(SUM(oi.quantity),0) AS qty
    FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
    WHERE ${closed} AND ${dateRange} ${locFilter}
    GROUP BY oi."displayName"
    ORDER BY revenue DESC
    LIMIT 10
  `;

  const payRaw = await tx.$queryRaw<Array<{ method: string; amount: bigint | number; cnt: bigint | number }>>`
    SELECT p."paymentMethod" AS method,
      COALESCE(SUM(p."amountCents"),0) AS amount,
      COUNT(*) AS cnt
    FROM "Payment" p JOIN "Order" o ON o.id = p."orderId"
    WHERE p.status = ${PaymentStatus.COMPLETED} AND ${closed} AND ${dateRange} ${locFilter}
    GROUP BY p."paymentMethod"
    ORDER BY amount DESC
  `;

  const staffIds = [...new Set(staffRaw.map((r) => r.staffId).filter((v): v is string => v != null))];
  const nameMap = new Map<string, string>();
  if (staffIds.length) {
    const recs = await tx.staff.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } });
    for (const s of recs) nameMap.set(s.id, s.name);
  }

  const num = (v: bigint | number) => Number(v);
  const periodStr = (p: Date | string) => (p instanceof Date ? p.toISOString().slice(0, 10) : String(p).slice(0, 10));

  const series: SalesSeriesPoint[] = seriesRaw.map((r) => ({
    period: periodStr(r.period), orders: num(r.orders), grossCents: num(r.gross),
    netCents: num(r.subtotal) - num(r.discount), taxCents: num(r.tax), tipCents: num(r.tip),
  }));

  const summary: SalesSummary = { orders: 0, grossCents: 0, netCents: 0, subtotalCents: 0, discountCents: 0, taxCents: 0, tipCents: 0, itemsSold: num(itemsRow?.items ?? 0), avgTicketCents: 0 };
  for (const r of seriesRaw) {
    summary.orders += num(r.orders); summary.grossCents += num(r.gross);
    summary.subtotalCents += num(r.subtotal); summary.discountCents += num(r.discount);
    summary.taxCents += num(r.tax); summary.tipCents += num(r.tip);
  }
  summary.netCents = summary.subtotalCents - summary.discountCents;
  summary.avgTicketCents = summary.orders > 0 ? Math.round(summary.grossCents / summary.orders) : 0;

  const totalStaffRevenue = staffRaw.reduce((a, r) => a + num(r.revenue), 0);
  const byStaff: StaffSalesRow[] = staffRaw.map((r) => ({
    staffId: r.staffId, staffName: r.staffId ? (nameMap.get(r.staffId) ?? "Unknown") : "Unassigned",
    revenueCents: num(r.revenue), items: num(r.items), orders: num(r.orders),
    pctOfRevenue: totalStaffRevenue > 0 ? Math.round((100 * num(r.revenue)) / totalStaffRevenue * 10) / 10 : 0,
  }));

  const byService: ServiceSalesRow[] = serviceRaw.map((r) => ({ displayName: r.displayName, revenueCents: num(r.revenue), quantity: num(r.qty) }));
  const byPaymentMethod: PaymentMixRow[] = payRaw.map((r) => ({ method: r.method, amountCents: num(r.amount), count: num(r.cnt) }));

  return { summary, series, byStaff, byService, byPaymentMethod, range: { startDate, endDate, grain } };
}
