import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { computeRetention, type RetentionGrain } from "@/lib/analytics/retention";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_GRAINS: RetentionGrain[] = ["day", "week", "month"];

function todayChicago(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const params = request.nextUrl.searchParams;

  // Parse and validate dates (default: last 30 days)
  let startDate = params.get("startDate") ?? daysAgo(30);
  let endDate = params.get("endDate") ?? todayChicago();

  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return NextResponse.json(
      { error: "invalid_date", expected: "YYYY-MM-DD" },
      { status: 400 },
    );
  }

  // Parse grain (default: month; explicitly invalid → 400)
  const grainParam = params.get("grain");
  if (grainParam && !VALID_GRAINS.includes(grainParam as RetentionGrain)) {
    return NextResponse.json(
      { error: "invalid_grain", valid: ["day", "week", "month"] },
      { status: 400 },
    );
  }
  const grain: RetentionGrain = (grainParam as RetentionGrain) || "month";

  const locationId = params.get("locationId") ?? undefined;
  const staffId = params.get("staffId") ?? undefined;

  const result = await withTenantScope(prisma, ctx, async (tx) =>
    computeRetention(tx, { startDate, endDate, grain, locationId, staffId }),
  );

  return NextResponse.json({
    retention: {
      rows: result.rows,
      totals: result.totals,
      range: { startDate, endDate, grain },
    },
  });
}
