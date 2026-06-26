import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicContextBySlug } from "@/lib/booking/public-context";
import { generateDaySlots } from "@/lib/booking/slots";
import { todayChicagoDateString } from "@/lib/chicago-time";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FUTURE_DAYS = 90;
const MAX_STEP_MINUTES = 60;

/**
 * GET /api/public/[slug]/availability?staffId=&serviceId=&date=YYYY-MM-DD
 *
 * Anonymous, read-only. Returns open appointment slots for a given
 * stylist + service + date. Slug-scoped, no tenant context, no PII exposed.
 *
 * TODO: add rate-limiting middleware before heavy public launch (e.g., per-IP).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const ctx = await resolvePublicContextBySlug(slug);
  if (!ctx) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Parse query params
  const url = new URL(request.url);
  const staffId = url.searchParams.get("staffId");
  const serviceId = url.searchParams.get("serviceId");
  const date = url.searchParams.get("date");
  const stepParam = url.searchParams.get("stepMinutes");

  if (!staffId || !serviceId || !date) {
    return NextResponse.json(
      { error: "missing_params", required: ["staffId", "serviceId", "date"] },
      { status: 400 },
    );
  }

  // Validate date format
  if (!DATE_RE.test(date)) {
    return NextResponse.json(
      { error: "invalid_date", expected: "YYYY-MM-DD" },
      { status: 400 },
    );
  }

  // Validate date is a real calendar date
  const [y, m, d] = date.split("-").map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return NextResponse.json(
      { error: "invalid_date", expected: "YYYY-MM-DD" },
      { status: 400 },
    );
  }

  // Validate date is not in the past (Chicago time)
  const todayStr = todayChicagoDateString();
  if (date < todayStr) {
    return NextResponse.json(
      { error: "date_in_past" },
      { status: 400 },
    );
  }

  // Booking window guard: max 90 days out
  const today = new Date(todayStr);
  const target = new Date(date);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays > MAX_FUTURE_DAYS) {
    return NextResponse.json(
      { error: "date_out_of_range", maxDays: MAX_FUTURE_DAYS },
      { status: 400 },
    );
  }

  // Cap stepMinutes to prevent abuse
  let stepMinutes: number | undefined;
  if (stepParam) {
    stepMinutes = parseInt(stepParam, 10);
    if (isNaN(stepMinutes) || stepMinutes < 5 || stepMinutes > MAX_STEP_MINUTES) {
      return NextResponse.json(
        { error: "invalid_step_minutes", min: 5, max: MAX_STEP_MINUTES },
        { status: 400 },
      );
    }
  }

  // Verify staffId belongs to this org and is active (prevents cross-org probing)
  const staff = await prisma.staff.findFirst({
    where: {
      id: staffId,
      organizationId: ctx.organizationId,
      isActive: true,
      softDeletedAt: null,
    },
    select: { id: true },
  });
  if (!staff) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Verify serviceId belongs to this org
  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      organizationId: ctx.organizationId,
      isActive: true,
    },
    select: { id: true },
  });
  if (!service) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Generate slots using the authoritative engine inside a transaction
  const result = await prisma.$transaction(async (tx) =>
    generateDaySlots(tx, {
      organizationId: ctx.organizationId,
      locationId: ctx.locationId,
      staffId,
      serviceId,
      date,
      stepMinutes,
    }),
  );

  return NextResponse.json({
    date,
    serviceDurationMinutes: result.serviceDurationMinutes,
    slots: result.slots,
  });
}
