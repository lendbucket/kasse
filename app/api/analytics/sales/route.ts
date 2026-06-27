import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, tenantErrorResponse, type TenantContext } from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { computeSales, type SalesGrain } from "@/lib/analytics/sales";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_GRAINS: SalesGrain[] = ["day", "week", "month"];
const fmt = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
function todayChicago() { return fmt(new Date()); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); }

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try { ctx = await requireTenantContext(request); }
  catch (e) { const r = tenantErrorResponse(e); if (r) return r; throw e; }

  const params = request.nextUrl.searchParams;
  const startDate = params.get("startDate") ?? daysAgo(30);
  const endDate = params.get("endDate") ?? todayChicago();
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) return NextResponse.json({ error: "invalid_date", expected: "YYYY-MM-DD" }, { status: 400 });

  const grainParam = params.get("grain");
  if (grainParam && !VALID_GRAINS.includes(grainParam as SalesGrain)) return NextResponse.json({ error: "invalid_grain", valid: VALID_GRAINS }, { status: 400 });
  const grain: SalesGrain = (grainParam as SalesGrain) || "day";
  const locationId = params.get("locationId") ?? undefined;

  const sales = await withTenantScope(prisma, ctx, async (tx) => computeSales(tx, { startDate, endDate, grain, locationId, organizationId: ctx.organizationId }));
  return NextResponse.json({ sales });
}
