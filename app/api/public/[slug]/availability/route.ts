import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicContextBySlug } from "@/lib/booking/public-context";
import { generateDaySlots } from "@/lib/booking/slots";
import { todayDateStringInTz } from "@/lib/chicago-time";
import { withTenantScope } from "@/lib/tenant/db-scope";
import type { TenantContext } from "@/lib/tenant/context";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FUTURE_DAYS = 90;
const MAX_STEP_MINUTES = 60;

/**
 * GET /api/public/[slug]/availability?staffId=&serviceId=&date=YYYY-MM-DD
 *
 * Anonymous, read-only. Returns open appointment slots for a given
 * stylist + service + date. Slug resolved via prismaAdmin (cross-tenant
 * lookup); all data access via withTenantScope scoped to the resolved org.
 *
 * TODO: add rate-limiting middleware before heavy public launch (e.g., per-IP).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const url = new URL(request.url);
  const locationSlug = url.searchParams.get("location") ?? undefined;

  const ctx = await resolvePublicContextBySlug(slug, locationSlug);
  if (!ctx) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Parse query params
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

  // Validate date is not in the past (location-local time)
  const todayStr = todayDateStringInTz(ctx.timezone);
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

  const publicCtx: TenantContext = {
    userId: "",
    email: "",
    name: null,
    role: "STAFF",
    organizationId: ctx.organizationId,
    locationId: null,
    isSuperadmin: false,
    request: { route: "/api/public/[slug]/availability" },
  };

  // Verify staff+service belong to this org, then generate slots — all under
  // withTenantScope so the kasse_app role has RLS access via app.current_org_id.
  const result = await withTenantScope(prisma, publicCtx, async (tx) => {
    // Verify staffId belongs to this org and is active (prevents cross-org probing)
    const staff = await tx.staff.findFirst({
      where: {
        id: staffId,
        organizationId: ctx.organizationId,
        isActive: true,
        softDeletedAt: null,
      },
      select: { id: true },
    });
    if (!staff) return null;

    // Verify serviceId belongs to this org
    const service = await tx.service.findFirst({
      where: {
        id: serviceId,
        organizationId: ctx.organizationId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!service) return null;

    // Generate slots using the authoritative engine
    return generateDaySlots(tx, {
      organizationId: ctx.organizationId,
      locationId: ctx.locationId,
      staffId,
      serviceId,
      date,
      timeZone: ctx.timezone,
      stepMinutes,
    });
  });

  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    date,
    serviceDurationMinutes: result.serviceDurationMinutes,
    slots: result.slots,
  });
}
