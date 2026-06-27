export function slugifyLocationName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "location";
}

/**
 * Ensures the slug is unique within the org by appending -2, -3, ... if taken.
 * tx is the scoped Prisma client from withTenantScope; excludeId skips a row
 * (for future edits).
 *
 * `organizationId` MUST match the org scoped into `tx`; it's used for the
 * readable query, while the DB unique constraint + RLS are the real safety net.
 */
export async function ensureUniqueLocationSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: { location: { findFirst: (...args: any[]) => Promise<{ id: string } | null> } },
  organizationId: string,
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base;
  // n starts at 1; first generated suffix is -2 (intentional, not off-by-one)
  let n = 1;
  // cap iterations defensively
  while (n < 1000) {
    const existing = await tx.location.findFirst({
      where: {
        organizationId,
        bookingSlug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
  // extremely unlikely fallback
  return `${base}-${Date.now()}`;
}
