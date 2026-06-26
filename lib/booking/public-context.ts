import { prismaAdmin } from "@/lib/prismaAdmin";

/**
 * Public booking context resolved from an organization slug.
 * No auth required — the slug IS the scope.
 * Only exposes org/location display info, never customer data.
 */
export interface PublicBookingContext {
  organizationId: string;
  organizationName: string;
  locationId: string;
  locationName: string | null;
  timezone: string;
}

/**
 * Resolves an organization slug to the public booking context.
 * Returns null if the slug doesn't match an org or the org has no location.
 *
 * Uses prismaAdmin (cross-tenant lookup) because there is no session and no
 * tenant GUC set. The kasse_app role has rolbypassrls=FALSE, so a plain prisma
 * call would return zero rows under RLS. prismaAdmin sets
 * app.is_superadmin='true' per-operation, which the RLS policies allow. This is
 * analogous to auth routes resolving a user by email — a legitimate public
 * cross-tenant lookup that only exposes org/location display info, never
 * customer data.
 */
export async function resolvePublicContextBySlug(
  slug: string,
): Promise<PublicBookingContext | null> {
  const org = await prismaAdmin.organization.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!org) return null;

  const location = await prismaAdmin.location.findFirst({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, timezone: true },
  });

  if (!location) return null;

  return {
    organizationId: org.id,
    organizationName: org.name,
    locationId: location.id,
    locationName: location.name,
    timezone: location.timezone ?? "America/Chicago",
  };
}
