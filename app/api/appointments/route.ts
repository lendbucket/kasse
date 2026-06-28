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
import { resolvePriceForBooking } from "@/lib/compensation/resolve";

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
  clientId?: string;
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
  // to reduce the double-booking race window. At READ COMMITTED this does not
  // fully eliminate concurrent races — see lib/booking/availability.ts race note
  // and the tracked tstzrange exclusion constraint follow-up.
  const result = await withTenantScope(prisma, ctx, async (tx) => {
    // Resolve service (tenant-scoped) + lock price via compensation engine
    let duration = body.durationMinutes ?? 30;
    let serviceName: string | null = null;
    let price: number | null = null;
    let estimatedTotalCents: number | null = null;
    let estimatedTotalMinutes: number | null = null;

    if (body.serviceId) {
      const service = await tx.service.findFirst({
        where: { id: body.serviceId, organizationId: ctx.organizationId },
      });
      if (service) {
        serviceName = service.name;
        // Use the compensation engine to resolve price (respects ServiceStaffOverride)
        const resolved = await resolvePriceForBooking(tx, {
          staffId: body.staffId,
          serviceId: body.serviceId,
          organizationId: ctx.organizationId,
        });
        duration = resolved.durationMinutes;
        price = resolved.priceCents / 100; // legacy Float field (dollars)
        estimatedTotalCents = resolved.priceCents;
        estimatedTotalMinutes = resolved.durationMinutes;
      }
    }

    const end = new Date(start.getTime() + duration * 60_000);

    // Availability check — collects ALL conflicts (double-booking, working
    // hours, service eligibility) before rejecting.
    const availability = await checkStylistAvailability(tx, {
      staffId: body.staffId,
      locationId: body.locationId,
      organizationId: ctx.organizationId,
      startTime: start,
      endTime: end,
      serviceId: body.serviceId,
    });

    if (!availability.ok) {
      return { conflict: true as const, conflicts: availability.conflicts };
    }

    // Resolve client link (tenant-scoped) + first-visit detection.
    let clientId: string | null = null;
    let clientNameSnapshot: string | null = body.clientName?.trim() || null;
    let isFirstVisit = false;
    if (body.clientId) {
      const client = await tx.client.findFirst({
        where: { id: body.clientId, organizationId: ctx.organizationId },
        select: { id: true, name: true },
      });
      if (client) {
        clientId = client.id;
        clientNameSnapshot = client.name;
        const priorVisits = await tx.appointment.count({
          where: { clientId: client.id, organizationId: ctx.organizationId, status: { notIn: ["cancelled", "no_show"] } },
        });
        isFirstVisit = priorVisits === 0;
      }
    }

    const appointment = await tx.appointment.create({
      data: {
        locationId: body.locationId,
        organizationId: location.organizationId,
        staffId: body.staffId,
        serviceId: body.serviceId ?? null,
        serviceName,
        price,
        estimatedTotalCents,
        estimatedTotalMinutes,
        clientId,
        clientName: clientNameSnapshot,
        isFirstVisit,
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
