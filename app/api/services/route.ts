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

  const params = request.nextUrl.searchParams;
  const locationId = params.get("locationId");
  const activeParam = params.get("active");

  if (locationId) {
    try {
      await assertLocationInTenant(locationId, ctx);
    } catch (e) {
      const r = tenantErrorResponse(e);
      if (r) return r;
      throw e;
    }
  }

  const where: Record<string, unknown> = { organizationId: ctx.organizationId };
  if (locationId) where.locationId = locationId;
  if (activeParam !== "all") {
    where.isActive = activeParam === "false" ? false : true;
  }

  const services = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.service.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  });

  return NextResponse.json({ services });
}

type CreateBody = {
  name: string;
  price: number;
  duration: number;
  category?: string | null;
  locationId: string;
  active?: boolean;
};

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.name?.trim() ||
    !body.locationId ||
    typeof body.price !== "number" ||
    typeof body.duration !== "number" ||
    body.price < 0 ||
    body.duration <= 0
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 },
    );
  }

  let location: { id: string; organizationId: string };
  try {
    location = await assertLocationInTenant(body.locationId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const service = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.service.create({
      data: {
        name: body.name.trim(),
        price: body.price,
        duration: Math.round(body.duration),
        category: body.category?.trim() || null,
        locationId: body.locationId,
        organizationId: location.organizationId,
        isActive: body.active ?? true,
      },
    });
  });

  return NextResponse.json({ service }, { status: 201 });
}
