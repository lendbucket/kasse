import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicContextBySlug } from "@/lib/booking/public-context";

/**
 * GET /api/public/[slug]/options
 *
 * Anonymous, read-only. Lists bookable services + active stylists for the
 * booking picker. Slug-scoped, no tenant context, no PII exposed.
 *
 * TODO: add rate-limiting middleware before heavy public launch (e.g., per-IP).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const ctx = await resolvePublicContextBySlug(slug);
  if (!ctx) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [services, stylists] = await Promise.all([
    prisma.service.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
        bookableByCustomers: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        duration: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.staff.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
        softDeletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    organization: { name: ctx.organizationName },
    location: { id: ctx.locationId, name: ctx.locationName },
    services,
    stylists,
  });
}
