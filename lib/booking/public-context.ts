import { prisma } from "@/lib/prisma";

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
 * This is a plain prisma call (not tenant-scoped) because there is no session;
 * the slug IS the scope. Only ever exposes org/location display info, never
 * customer data.
 */
export async function resolvePublicContextBySlug(
  slug: string,
): Promise<PublicBookingContext | null> {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!org) return null;

  const location = await prisma.location.findFirst({
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
