import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  assertLocationInTenant,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const locationId = request.nextUrl.searchParams.get("locationId");
  if (!locationId) {
    return NextResponse.json({ error: "locationId required" }, { status: 400 });
  }

  try {
    await assertLocationInTenant(locationId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const rate = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.taxRate.findFirst({
      where: {
        organizationId: ctx.organizationId,
        locationId,
        isActive: true,
        effectiveStartDate: { lte: todayUtc },
        OR: [{ effectiveEndDate: null }, { effectiveEndDate: { gte: todayUtc } }],
      },
      orderBy: { effectiveStartDate: "desc" },
    });
  });

  if (!rate) {
    return NextResponse.json({
      ratePercent: null,
      applicableToServices: null,
      applicableToProducts: null,
    });
  }

  return NextResponse.json({
    ratePercent: rate.ratePercent,
    applicableToServices: rate.applicableToServices,
    applicableToProducts: rate.applicableToProducts,
  });
}
