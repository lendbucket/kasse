import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  assertLocationInTenant,
  assertStaffInTenant,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { chicagoDayBounds } from "@/lib/chicago-time";
import { checkStylistAvailability } from "@/lib/booking/availability";

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
  const date = params.get("date");
  const locationId = params.get("locationId");

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
  if (date) {
    const { start, end } = chicagoDayBounds(date);
    where.startTime = { gte: start, lt: end };
  }

  const appointments = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.appointment.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        staff: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });
  });

  return NextResponse.json({ appointments });
}

type CreateBody = {
  locationId: string;
  staffId: string;
  serviceId?: string;
  clientName?: string;
  startTime: string;
  durationMinutes?: number;
  notes?: string;
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

  if (!body.locationId || !body.staffId || !body.startTime) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const start = new Date(body.startTime);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
  }

  let location: { id: string; organizationId: string };
  try {
    location = await assertLocationInTenant(body.locationId, ctx);
    await assertStaffInTenant(body.staffId, ctx);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  // Service lookup, availability check, and create all run in ONE transaction
  // so the overlap re-check serializes concurrent bookings (no TOCTOU gap).
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // Resolve service (tenant-scoped)
    let duration = body.durationMinutes ?? 30;
    let serviceName: string | null = null;
    let price: number | null = null;

    if (body.serviceId) {
      const service = await tx.service.findFirst({
        where: { id: body.serviceId, organizationId: ctx.organizationId },
      });
      if (service) {
        duration = service.duration;
        serviceName = service.name;
        price = service.price;
      }
    }

    const end = new Date(start.getTime() + duration * 60_000);

    // Availability check — collects ALL conflicts (double-booking, working
    // hours, service eligibility) before rejecting.
    const availability = await checkStylistAvailability(tx, {
      staffId: body.staffId,
      locationId: body.locationId,
      startTime: start,
      endTime: end,
      serviceId: body.serviceId,
    });

    if (!availability.ok) {
      return { conflict: true as const, conflicts: availability.conflicts };
    }

    const appointment = await tx.appointment.create({
      data: {
        locationId: body.locationId,
        organizationId: location.organizationId,
        staffId: body.staffId,
        serviceId: body.serviceId ?? null,
        serviceName,
        price,
        clientName: body.clientName?.trim() || null,
        startTime: start,
        endTime: end,
        notes: body.notes?.trim() || null,
        status: "scheduled",
      },
    });

    return { conflict: false as const, appointment };
  });

  if (result.conflict) {
    return NextResponse.json(
      { error: "booking_conflict", conflicts: result.conflicts },
      { status: 409 },
    );
  }

  return NextResponse.json({ appointment: result.appointment }, { status: 201 });
}
