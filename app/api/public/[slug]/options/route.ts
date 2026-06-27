import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicContextBySlug } from "@/lib/booking/public-context";
import { withTenantScope } from "@/lib/tenant/db-scope";
import type { TenantContext } from "@/lib/tenant/context";

/**
 * GET /api/public/[slug]/options
 *
 * Anonymous, read-only. Lists bookable services + active stylists for the
 * booking picker. Slug resolved via prismaAdmin (cross-tenant lookup); all
 * data access via withTenantScope scoped to the resolved org.
 *
 * TODO: add rate-limiting middleware before heavy public launch (e.g., per-IP).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const locationSlug = new URL(request.url).searchParams.get("location") ?? undefined;
  const ctx = await resolvePublicContextBySlug(slug, locationSlug);
  if (!ctx) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

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
    request: { route: "/api/public/[slug]/options" },
  };

  const { services, staff, staffServices } = await withTenantScope(prisma, publicCtx, async (tx) => {
    const [services, staff] = await Promise.all([
      tx.service.findMany({
        where: { organizationId: ctx.organizationId, isActive: true, bookableByCustomers: true },
        select: { id: true, name: true, price: true, duration: true },
        orderBy: { name: "asc" },
      }),
      tx.staff.findMany({
        where: { organizationId: ctx.organizationId, isActive: true, softDeletedAt: null, bookableByCustomers: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    const staffServices = await tx.stylistService.findMany({
      where: { staffId: { in: staff.map((s) => s.id) }, serviceId: { in: services.map((s) => s.id) } },
      select: { staffId: true, serviceId: true },
    });
    return { services, staff, staffServices };
  });

  return NextResponse.json({
    organization: { name: ctx.organizationName },
    location: { id: ctx.locationId, name: ctx.locationName, timezone: ctx.timezone },
    services,
    staff,
    staffServices,
  });
}
