import { Prisma } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

export type RetentionGrain = "day" | "week" | "month";

export interface RetentionOpts {
  startDate: string;
  endDate: string;
  grain: RetentionGrain;
  locationId?: string;
  staffId?: string;
}

export interface RetentionRow {
  period: string;
  locationId: string;
  staffId: string | null;
  staffName: string | null;
  checkouts: number;
  rebookedClients: number;
  rebookPct: number;
}

export interface RetentionResult {
  rows: RetentionRow[];
  totals: {
    checkouts: number;
    rebookedClients: number;
    rebookPct: number;
  };
}

interface RawRow {
  period: Date | string;
  locationId: string;
  staffId: string | null;
  checkouts: bigint | number;
  rebooked_clients: bigint | number;
}

/**
 * Computes retention/rebook metrics per stylist/location/period.
 *
 * MUST be called inside a withTenantScope transaction — RLS handles org scoping.
 * The query is parameterized (never string-interpolates user input).
 *
 * Formula (Salon Envy definition):
 *   checkout = completed POS Transaction with non-null clientId, bucketed to
 *              its Chicago-local calendar day.
 *   rebooked = client has ANY Appointment (not soft-deleted, not cancelled/no_show)
 *              whose startTime Chicago-local day is AFTER the checkout day.
 *   rebook%  = distinct rebooked clients / distinct checked-out clients * 100
 */
export async function computeRetention(
  tx: PrismaTx,
  opts: RetentionOpts,
): Promise<RetentionResult> {
  const { startDate, endDate, grain, locationId, staffId } = opts;

  // Build the bucket expression from a fixed whitelist — NEVER from user input
  const bucketExpr = (() => {
    switch (grain) {
      case "day":
        return Prisma.sql`(t."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')::date`;
      case "week":
        return Prisma.sql`date_trunc('week', (t."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago'))::date`;
      case "month":
        return Prisma.sql`date_trunc('month', (t."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago'))::date`;
    }
  })();

  // Build optional filters
  const locationFilter = locationId
    ? Prisma.sql`AND t."locationId" = ${locationId}`
    : Prisma.empty;
  const staffFilter = staffId
    ? Prisma.sql`AND t."staffId" = ${staffId}`
    : Prisma.empty;

  // Shared CTE filter fragments — used by both the per-stylist grouped query
  // and the salon-wide distinct-total query so they never drift.
  const checkoutWhere = Prisma.sql`
      WHERE t.status = 'completed'
        AND t."clientId" IS NOT NULL
        AND (t."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')::date
            BETWEEN ${startDate}::date AND ${endDate}::date
        ${locationFilter}
        ${staffFilter}`;

  // RLS already scopes Appointment by org (forced RLS, kasse_app); the explicit
  // organizationId match is defense-in-depth + makes cross-tenant safety self-evident.
  const rebookExists = Prisma.sql`EXISTS (
        SELECT 1 FROM "Appointment" a
        WHERE a."clientId" = c."clientId"
          AND a."organizationId" = c."organizationId"
          AND a."softDeletedAt" IS NULL
          AND a.status NOT IN ('cancelled','no_show')
          AND (a."startTime" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')::date > c.checkout_day
      )`;

  // Per-stylist grouped query
  const rawRows = await tx.$queryRaw<RawRow[]>`
    WITH checkouts AS (
      SELECT t."organizationId", t."locationId", t."staffId", t."clientId",
             ${bucketExpr} AS period,
             (t."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')::date AS checkout_day
      FROM "Transaction" t
      ${checkoutWhere}
    ),
    cwr AS (
      SELECT c.*, ${rebookExists} AS rebooked
      FROM checkouts c
    )
    SELECT period, "locationId", "staffId",
      COUNT(DISTINCT "clientId") AS checkouts,
      COUNT(DISTINCT "clientId") FILTER (WHERE rebooked) AS rebooked_clients
    FROM cwr
    GROUP BY period, "locationId", "staffId"
    ORDER BY period DESC, "staffId"
  `;

  // Salon-wide distinct-client totals (no GROUP BY — one row).
  // A client seen by two stylists counts once here, unlike the per-stylist rows
  // where she counts for each stylist (correct for per-stylist analysis).
  const [salonTotals] = await tx.$queryRaw<
    { checkouts: bigint | number; rebooked_clients: bigint | number }[]
  >`
    WITH checkouts AS (
      SELECT t."organizationId", t."clientId",
             (t."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Chicago')::date AS checkout_day
      FROM "Transaction" t
      ${checkoutWhere}
    ),
    cwr AS (
      SELECT c.*, ${rebookExists} AS rebooked
      FROM checkouts c
    )
    SELECT COUNT(DISTINCT "clientId") AS checkouts,
           COUNT(DISTINCT "clientId") FILTER (WHERE rebooked) AS rebooked_clients
    FROM cwr
  `;

  // Resolve staff names
  const staffIds = [
    ...new Set(rawRows.map((r) => r.staffId).filter((id): id is string => id != null)),
  ];
  const staffMap = new Map<string, string>();
  if (staffIds.length > 0) {
    const staffRecords = await tx.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, name: true },
    });
    for (const s of staffRecords) staffMap.set(s.id, s.name);
  }

  // Map raw rows to typed results
  const rows: RetentionRow[] = rawRows.map((r) => {
    const checkouts = Number(r.checkouts);
    const rebookedClients = Number(r.rebooked_clients);
    const rebookPct = checkouts === 0 ? 0 : Math.round((100 * rebookedClients) / checkouts * 10) / 10;
    const periodStr =
      r.period instanceof Date
        ? r.period.toISOString().slice(0, 10)
        : String(r.period).slice(0, 10);

    return {
      period: periodStr,
      locationId: r.locationId,
      staffId: r.staffId,
      staffName: r.staffId ? (staffMap.get(r.staffId) ?? "Unknown") : "Unassigned",
      checkouts,
      rebookedClients,
      rebookPct,
    };
  });

  // Totals: salon-wide distinct-client counts (not sum of per-stylist rows,
  // which would double-count a client seen by two stylists).
  const totalCheckouts = Number(salonTotals.checkouts);
  const totalRebooked = Number(salonTotals.rebooked_clients);
  const totalPct =
    totalCheckouts === 0
      ? 0
      : Math.round((100 * totalRebooked) / totalCheckouts * 10) / 10;

  return {
    rows,
    totals: {
      checkouts: totalCheckouts,
      rebookedClients: totalRebooked,
      rebookPct: totalPct,
    },
  };
}
