import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { id: staffId } = await params;

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    const staff = await tx.staff.findFirst({
      where: { id: staffId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!staff) return null;

    // Get eligible service IDs
    const eligibility = await tx.stylistService.findMany({
      where: { staffId },
      select: { serviceId: true },
    });
    const eligibleIds = eligibility.map((e) => e.serviceId);
    if (eligibleIds.length === 0) return { services: [] };

    // Fetch base services (scoped by org)
    const services = await tx.service.findMany({
      where: { id: { in: eligibleIds }, organizationId: ctx.organizationId },
      select: { id: true, name: true, category: true, price: true, duration: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Fetch existing overrides
    const overrides = await tx.serviceStaffOverride.findMany({
      where: { staffId, serviceId: { in: eligibleIds } },
      select: { serviceId: true, priceCents: true, durationMinutes: true },
    });
    const overrideMap = new Map(overrides.map((o) => [o.serviceId, o]));

    return {
      services: services.map((s) => {
        const ovr = overrideMap.get(s.id);
        return {
          serviceId: s.id,
          name: s.name,
          category: s.category,
          basePriceCents: Math.round(s.price * 100),
          baseDurationMinutes: s.duration,
          overridePriceCents: ovr?.priceCents ?? null,
          overrideDurationMinutes: ovr?.durationMinutes ?? null,
        };
      }),
    };
  });

  if (result === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

type PutBody = {
  overrides: Array<{
    serviceId: string;
    priceCents?: number | null;
    durationMinutes?: number | null;
  }>;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const { id: staffId } = await params;

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.overrides)) {
    return NextResponse.json({ error: "overrides must be an array" }, { status: 400 });
  }

  // Validate each override
  for (const ovr of body.overrides) {
    if (!ovr.serviceId || typeof ovr.serviceId !== "string") {
      return NextResponse.json({ error: "Each override must have a serviceId string" }, { status: 400 });
    }
    if (ovr.priceCents != null) {
      if (!Number.isInteger(ovr.priceCents) || ovr.priceCents < 0) {
        return NextResponse.json(
          { error: `Invalid priceCents for service ${ovr.serviceId}: must be a non-negative integer` },
          { status: 400 },
        );
      }
    }
    if (ovr.durationMinutes != null) {
      if (!Number.isInteger(ovr.durationMinutes) || ovr.durationMinutes < 1) {
        return NextResponse.json(
          { error: `Invalid durationMinutes for service ${ovr.serviceId}: must be a positive integer` },
          { status: 400 },
        );
      }
    }
  }

  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // 1. Verify staff in-tenant
    const staff = await tx.staff.findFirst({
      where: { id: staffId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!staff) return { error: "not_found" as const };

    // 2. Validate serviceIds: must be in org AND in eligibility
    const serviceIds = body.overrides.map((o) => o.serviceId);
    if (serviceIds.length > 0) {
      const orgServices = await tx.service.findMany({
        where: { id: { in: serviceIds }, organizationId: ctx.organizationId },
        select: { id: true },
      });
      const orgServiceIds = new Set(orgServices.map((s) => s.id));
      const invalidOrg = serviceIds.filter((id) => !orgServiceIds.has(id));
      if (invalidOrg.length > 0) {
        return { error: "invalid_services" as const, ids: invalidOrg };
      }

      const eligibility = await tx.stylistService.findMany({
        where: { staffId, serviceId: { in: serviceIds } },
        select: { serviceId: true },
      });
      const eligibleIds = new Set(eligibility.map((e) => e.serviceId));
      const notEligible = serviceIds.filter((id) => !eligibleIds.has(id));
      if (notEligible.length > 0) {
        return { error: "not_eligible" as const, ids: notEligible };
      }
    }

    // 3. Full replace: delete all overrides for this staff, then create non-empty ones
    await tx.serviceStaffOverride.deleteMany({ where: { staffId } });

    // Only create rows that actually override something
    const toCreate = body.overrides.filter(
      (o) => o.priceCents != null || o.durationMinutes != null,
    );

    if (toCreate.length > 0) {
      await tx.serviceStaffOverride.createMany({
        data: toCreate.map((o) => ({
          staffId,
          serviceId: o.serviceId,
          priceCents: o.priceCents ?? null,
          durationMinutes: o.durationMinutes ?? null,
        })),
      });
    }

    return { ok: true as const, count: toCreate.length };
  });

  if (result.error === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.error === "invalid_services") {
    return NextResponse.json({ error: `Invalid serviceIds: ${result.ids.join(", ")}` }, { status: 400 });
  }
  if (result.error === "not_eligible") {
    return NextResponse.json({ error: `Services not in eligibility set: ${result.ids.join(", ")}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true, count: result.count });
}
