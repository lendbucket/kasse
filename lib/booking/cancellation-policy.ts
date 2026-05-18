import type { Prisma, CancellationPolicy } from "@prisma/client";
import type { CancellationPolicyResolved } from "./types";

type Tx = Prisma.TransactionClient;

const DEFAULT_POLICY: CancellationPolicyResolved = {
  windowHours: 24,
  cancellationFeeFixedCents: null,
  cancellationFeePercentage: null,
  cancellationFeeChargeType: "NONE",
  noShowFeeFixedCents: null,
  noShowFeePercentage: null,
  noShowFeeChargeType: "NONE",
  policyText: null,
  requirePreAuth: false,
  preAuthAmountCents: null,
  source: "DEFAULT",
};

/**
 * Resolve cancellation policy for a service+location combination.
 * Priority: service-specific > location-specific > org-wide > default.
 */
export async function resolveCancellationPolicy(
  tx: Tx,
  args: {
    organizationId: string;
    serviceId: string;
    locationId: string;
  },
): Promise<CancellationPolicyResolved> {
  // 1. Service-specific
  const servicePolicy = await tx.cancellationPolicy.findFirst({
    where: {
      organizationId: args.organizationId,
      serviceId: args.serviceId,
      isActive: true,
    },
  });
  if (servicePolicy) {
    return mapPolicy(servicePolicy, "SERVICE");
  }

  // 2. Location-specific (serviceId NULL)
  const locationPolicy = await tx.cancellationPolicy.findFirst({
    where: {
      organizationId: args.organizationId,
      serviceId: null,
      locationId: args.locationId,
      isActive: true,
    },
  });
  if (locationPolicy) {
    return mapPolicy(locationPolicy, "LOCATION");
  }

  // 3. Org-wide (both NULL)
  const orgPolicy = await tx.cancellationPolicy.findFirst({
    where: {
      organizationId: args.organizationId,
      serviceId: null,
      locationId: null,
      isActive: true,
    },
  });
  if (orgPolicy) {
    return mapPolicy(orgPolicy, "ORGANIZATION");
  }

  return DEFAULT_POLICY;
}

function mapPolicy(
  p: CancellationPolicy,
  source: "SERVICE" | "LOCATION" | "ORGANIZATION",
): CancellationPolicyResolved {
  return {
    windowHours: p.windowHours,
    cancellationFeeFixedCents: p.cancellationFeeFixedCents,
    cancellationFeePercentage: p.cancellationFeePercentage,
    cancellationFeeChargeType: p.cancellationFeeChargeType as CancellationPolicyResolved["cancellationFeeChargeType"],
    noShowFeeFixedCents: p.noShowFeeFixedCents,
    noShowFeePercentage: p.noShowFeePercentage,
    noShowFeeChargeType: p.noShowFeeChargeType as CancellationPolicyResolved["noShowFeeChargeType"],
    policyText: p.policyText,
    requirePreAuth: p.requirePreAuth,
    preAuthAmountCents: p.preAuthAmountCents,
    source,
  };
}

/**
 * Calculate the cancellation fee that should be charged for an appointment.
 */
export function calculateCancellationFee(args: {
  policy: CancellationPolicyResolved;
  appointmentPriceCents: number;
  hoursUntilAppointment: number;
  isNoShow: boolean;
}): { feeCents: number; reason: string } {
  if (args.isNoShow) {
    if (args.policy.noShowFeeChargeType === "NONE") {
      return { feeCents: 0, reason: "No no-show fee configured" };
    }
    if (args.policy.noShowFeeChargeType === "FIXED") {
      return {
        feeCents: args.policy.noShowFeeFixedCents ?? 0,
        reason: "Fixed no-show fee",
      };
    }
    if (args.policy.noShowFeeChargeType === "PERCENTAGE") {
      const pct = args.policy.noShowFeePercentage ?? 0;
      return {
        feeCents: Math.round((args.appointmentPriceCents * pct) / 100),
        reason: `${pct}% no-show fee`,
      };
    }
  }

  // Cancellation (not no-show)
  if (args.hoursUntilAppointment >= args.policy.windowHours) {
    return { feeCents: 0, reason: "Cancelled outside fee window" };
  }
  if (args.policy.cancellationFeeChargeType === "NONE") {
    return { feeCents: 0, reason: "No cancellation fee configured" };
  }
  if (args.policy.cancellationFeeChargeType === "FIXED") {
    return {
      feeCents: args.policy.cancellationFeeFixedCents ?? 0,
      reason: "Fixed cancellation fee",
    };
  }
  if (args.policy.cancellationFeeChargeType === "PERCENTAGE") {
    const pct = args.policy.cancellationFeePercentage ?? 0;
    return {
      feeCents: Math.round((args.appointmentPriceCents * pct) / 100),
      reason: `${pct}% cancellation fee`,
    };
  }
  return { feeCents: 0, reason: "No applicable fee" };
}
