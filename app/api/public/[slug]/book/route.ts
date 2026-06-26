import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicContextBySlug } from "@/lib/booking/public-context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import { checkStylistAvailability } from "@/lib/booking/availability";
import { resolvePriceForBooking } from "@/lib/compensation/resolve";
import { findOrCreateClient } from "@/lib/booking/find-or-create-client";
import type { TenantContext } from "@/lib/tenant/context";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const TZ = "America/Chicago";

// TODO: add rate-limiting middleware before public launch (per-IP/per-phone).

/**
 * POST /api/public/[slug]/book
 *
 * Anonymous booking write endpoint. Creates a real appointment with a
 * find-or-create client. Slug→org resolved via prismaAdmin (cross-tenant
 * lookup inside resolvePublicContextBySlug); all data access + write via
 * withTenantScope scoped to the resolved org. Engine + exclusion constraint
 * protected.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const ctx = await resolvePublicContextBySlug(slug);
  if (!ctx) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: {
    staffId?: string;
    serviceId?: string;
    date?: string;
    time?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { staffId, serviceId, date, time, clientName, clientEmail, clientPhone } = body;

  if (!staffId || !serviceId || !date || !time || !clientName?.trim()) {
    return NextResponse.json(
      { error: "missing_params", required: ["staffId", "serviceId", "date", "time", "clientName"] },
      { status: 400 },
    );
  }

  if (!clientEmail?.trim() && !clientPhone?.trim()) {
    return NextResponse.json(
      { error: "missing_contact", message: "At least one of clientEmail or clientPhone is required" },
      { status: 400 },
    );
  }

  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "invalid_date", expected: "YYYY-MM-DD" }, { status: 400 });
  }

  if (!TIME_RE.test(time)) {
    return NextResponse.json({ error: "invalid_time", expected: "HH:MM" }, { status: 400 });
  }

  // Compute startTime as UTC from Chicago-local date+time
  // Same Chicago→UTC approach as lib/booking/slots.ts chicagoOffsetMinutes
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);

  const noonUTC = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const offsetMinutes = chicagoOffsetMinutes(noonUTC);
  const startTime = new Date(
    Date.UTC(y, mo - 1, d, h, mi, 0) - offsetMinutes * 60_000,
  );

  // Build synthetic public TenantContext
  // TODO: role sentinel — no PUBLIC role in the type yet; userId marks this as
  // an anonymous public booking in audit.
  const publicCtx: TenantContext = {
    userId: "__public__",
    email: "",
    name: null,
    role: "STAFF",
    organizationId: ctx.organizationId,
    locationId: null,
    isSuperadmin: false,
    request: { route: "/api/public/[slug]/book" },
  };

  try {
    const result = await withTenantScope(prisma, publicCtx, async (tx) => {
      // Verify staffId belongs to this org
      const staff = await tx.staff.findFirst({
        where: {
          id: staffId,
          organizationId: ctx.organizationId,
          isActive: true,
          softDeletedAt: null,
        },
        select: { id: true },
      });
      if (!staff) return { notFound: true as const };

      // Verify serviceId belongs to this org
      const service = await tx.service.findFirst({
        where: {
          id: serviceId,
          organizationId: ctx.organizationId,
          isActive: true,
        },
        select: { id: true, name: true },
      });
      if (!service) return { notFound: true as const };

      // Find or create client
      const { clientId } = await findOrCreateClient(tx, {
        organizationId: ctx.organizationId,
        locationId: ctx.locationId,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
      });

      // Resolve duration + price via compensation engine
      const resolved = await resolvePriceForBooking(tx, {
        staffId,
        serviceId,
        organizationId: ctx.organizationId,
      });

      const endTime = new Date(startTime.getTime() + resolved.durationMinutes * 60_000);

      // Availability check
      const availability = await checkStylistAvailability(tx, {
        staffId,
        locationId: ctx.locationId,
        organizationId: ctx.organizationId,
        startTime,
        endTime,
        serviceId,
      });

      if (!availability.ok) {
        return { conflict: true as const, conflicts: availability.conflicts };
      }

      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          locationId: ctx.locationId,
          organizationId: ctx.organizationId,
          staffId,
          serviceId,
          serviceName: service.name,
          price: resolved.priceCents / 100,
          estimatedTotalCents: resolved.priceCents,
          estimatedTotalMinutes: resolved.durationMinutes,
          clientId,
          clientName: clientName.trim(),
          startTime,
          endTime,
          status: "scheduled",
          bookingSource: "ONLINE",
          bookedByStaffId: null,
        },
      });

      return {
        notFound: false as const,
        conflict: false as const,
        appointment: {
          id: appointment.id,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          serviceName: appointment.serviceName,
          staffId: appointment.staffId,
        },
        client: { id: clientId },
      };
    });

    if ("notFound" in result && result.notFound) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if ("conflict" in result && result.conflict) {
      return NextResponse.json(
        { error: "booking_conflict", conflicts: result.conflicts },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { appointment: result.appointment, client: result.client },
      { status: 201 },
    );
  } catch (e: unknown) {
    // Catch the exclusion-constraint violation (concurrent double-book race)
    if (isPgExclusionViolation(e)) {
      return NextResponse.json(
        { error: "booking_conflict", conflicts: [{ type: "STYLIST_DOUBLE_BOOKED" }] },
        { status: 409 },
      );
    }
    throw e;
  }
}

/**
 * Detect Postgres exclusion_violation (23P01) from the appointment_no_double_booking
 * constraint. Prisma wraps this as a PrismaClientKnownRequestError with code P2034
 * or surfaces the raw pg error code in the message.
 */
function isPgExclusionViolation(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as Record<string, unknown>;
  // Prisma may surface the pg code in meta or in the message
  if (err.code === "P2034") return true;
  const meta = err.meta as Record<string, unknown> | undefined;
  if (meta?.code === "23P01") return true;
  if (typeof err.message === "string" && err.message.includes("23P01")) return true;
  return false;
}

/**
 * Compute Chicago→UTC offset in minutes for a given instant.
 * Same approach as lib/booking/slots.ts chicagoOffsetMinutes.
 */
function chicagoOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60_000;
}
