import type { Prisma } from "@prisma/client";
import type { ServicePricing, ServiceDuration } from "./types";

type Tx = Prisma.TransactionClient;

/**
 * Compute effective price for a service booking, applying overrides in priority order:
 * 1. Staff-specific override (highest priority)
 * 2. Location-specific override
 * 3. Base service price (default)
 */
export async function getServicePriceForBooking(
  tx: Tx,
  args: {
    serviceId: string;
    locationId?: string | null;
    staffId?: string | null;
  },
): Promise<ServicePricing> {
  const service = await tx.service.findUnique({
    where: { id: args.serviceId },
    select: { price: true },
  });
  if (!service) {
    throw new Error(`Service ${args.serviceId} not found`);
  }
  // NOTE: service.price is still a Float (legacy field). Math.round(price * 100) is the
  // best available conversion until a future migration converts all money fields to
  // integer cents. Float arithmetic can produce edge-case rounding at values like
  // $49.99 → 4998 or 4999 depending on JS implementation. This is a known imprecision
  // and not safety-critical (a $0.01 difference is below user-perceivable threshold for
  // service pricing). Tracked for resolution in P0.G PR 2 or later.
  const baseCents = Math.round(service.price * 100);

  let locationOverrideCents: number | null = null;
  if (args.locationId) {
    const loc = await tx.serviceLocation.findUnique({
      where: {
        serviceId_locationId: {
          serviceId: args.serviceId,
          locationId: args.locationId,
        },
      },
      select: { priceOverrideCents: true, isAvailable: true },
    });
    if (loc && !loc.isAvailable) {
      throw new Error("Service not available at this location");
    }
    locationOverrideCents = loc?.priceOverrideCents ?? null;
  }

  let staffOverrideCents: number | null = null;
  if (args.staffId) {
    const staff = await tx.serviceStaffOverride.findUnique({
      where: {
        serviceId_staffId: {
          serviceId: args.serviceId,
          staffId: args.staffId,
        },
      },
      select: { priceCents: true },
    });
    staffOverrideCents = staff?.priceCents ?? null;
  }

  const effectiveCents = staffOverrideCents ?? locationOverrideCents ?? baseCents;

  return { baseCents, locationOverrideCents, staffOverrideCents, effectiveCents };
}

/**
 * Compute effective duration for a service booking, same override priority.
 * Buffer time and processing time are added separately.
 */
export async function getServiceDurationForBooking(
  tx: Tx,
  args: {
    serviceId: string;
    locationId?: string | null;
    staffId?: string | null;
  },
): Promise<ServiceDuration> {
  const service = await tx.service.findUnique({
    where: { id: args.serviceId },
    select: {
      duration: true,
      bufferTime: true,
      processingMinutes: true,
    },
  });
  if (!service) {
    throw new Error(`Service ${args.serviceId} not found`);
  }
  const baseMinutes = service.duration;
  const bufferMinutes = service.bufferTime;
  const processingMinutes = service.processingMinutes;

  let locationOverrideMinutes: number | null = null;
  if (args.locationId) {
    const loc = await tx.serviceLocation.findUnique({
      where: {
        serviceId_locationId: {
          serviceId: args.serviceId,
          locationId: args.locationId,
        },
      },
      select: { durationOverrideMinutes: true },
    });
    locationOverrideMinutes = loc?.durationOverrideMinutes ?? null;
  }

  let staffOverrideMinutes: number | null = null;
  if (args.staffId) {
    const staff = await tx.serviceStaffOverride.findUnique({
      where: {
        serviceId_staffId: {
          serviceId: args.serviceId,
          staffId: args.staffId,
        },
      },
      select: { durationMinutes: true },
    });
    staffOverrideMinutes = staff?.durationMinutes ?? null;
  }

  const effectiveDurationMinutes =
    staffOverrideMinutes ?? locationOverrideMinutes ?? baseMinutes;
  const effectiveTotalMinutes =
    effectiveDurationMinutes + bufferMinutes + (processingMinutes ?? 0);

  return {
    baseMinutes,
    locationOverrideMinutes,
    staffOverrideMinutes,
    bufferMinutes,
    processingMinutes,
    effectiveTotalMinutes,
  };
}
