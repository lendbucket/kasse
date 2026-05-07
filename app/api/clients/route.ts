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
  const q = params.get("q")?.trim() ?? "";
  const locationId = params.get("locationId");

  // If a locationId is supplied, prove it belongs to this tenant.
  // This kills any chance of locationId being used as a cross-tenant probe.
  if (locationId) {
    try {
      await assertLocationInTenant(locationId, ctx);
    } catch (e) {
      const r = tenantErrorResponse(e);
      if (r) return r;
      throw e;
    }
  }

  // Application-layer tenant scope. RLS will enforce this again at the DB layer in 0.5.3b.
  const where: Record<string, unknown> = { organizationId: ctx.organizationId };
  if (locationId) where.locationId = locationId;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const clients = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.client.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { startTime: "desc" },
          take: 1,
          select: { startTime: true },
        },
      },
    });
  });

  const shaped = clients.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    locationId: c.locationId,
    visitCount: c._count.appointments,
    lastVisit: c.appointments[0]?.startTime ?? null,
  }));

  return NextResponse.json({ clients: shaped });
}

type CreateBody = {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  locationId: string;
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

  // Verify the location belongs to this tenant before creating anything under it.
  let location: { id: string; organizationId: string };
  try {
    location = await assertLocationInTenant(body.locationId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const client = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.client.create({
      data: {
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        notes: body.notes?.trim() || null,
        locationId: body.locationId,
        organizationId: location.organizationId,
      },
    });
  });

  return NextResponse.json({ client }, { status: 201 });
}
