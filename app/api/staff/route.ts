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
  const activeParam = params.get("active"); // "all" | "true" | "false" | null(default true)

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

  const staff = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.staff.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        location: { select: { id: true, name: true } },
      },
    });
  });

  return NextResponse.json({ staff });
}

type CreateBody = {
  name: string;
  email?: string;
  phone?: string;
  role?: "manager" | "stylist";
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

  if (!body.name?.trim() || !body.locationId) {
    return NextResponse.json(
      { error: "Name and locationId required" },
      { status: 400 },
    );
  }

  const role = body.role === "manager" ? "manager" : "stylist";

  let location: { id: string; organizationId: string };
  try {
    location = await assertLocationInTenant(body.locationId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const staff = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.staff.create({
      data: {
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        role,
        locationId: body.locationId,
        organizationId: location.organizationId,
        isActive: body.active ?? true,
      },
    });
  });

  return NextResponse.json({ staff }, { status: 201 });
}
