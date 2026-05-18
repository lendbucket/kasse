import type { Prisma } from "@prisma/client";
import type { GeolocationCheckParams, GeolocationResult } from "./types";

type Tx = Prisma.TransactionClient;

/**
 * Compute distance in feet between two lat/lng points using Haversine formula.
 */
export function haversineFeet(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 20925524.9; // Earth radius in feet
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check geolocation against location's geofence and log the result.
 * Per SD-K-030: soft warn outside geofence + audit log + manager override allowed.
 */
export async function checkGeolocationAndLog(
  tx: Tx,
  params: GeolocationCheckParams,
): Promise<GeolocationResult> {
  const location = await tx.location.findUnique({
    where: { id: params.locationId },
    select: { lat: true, lng: true, geofenceRadius: true },
  });
  if (!location) {
    throw new Error("Location not found");
  }

  let distanceFeet: number | null = null;
  let withinGeofence = true;
  let warningLevel: GeolocationResult["warningLevel"] = "NONE";
  let reason: string | null = null;

  if (
    params.lat !== null &&
    params.lng !== null &&
    location.lat !== null &&
    location.lng !== null
  ) {
    distanceFeet = haversineFeet(
      params.lat,
      params.lng,
      location.lat,
      location.lng,
    );
    withinGeofence = distanceFeet <= location.geofenceRadius;
    if (!withinGeofence) {
      warningLevel = "SOFT_WARN";
      reason = `Outside ${location.geofenceRadius}ft geofence (${Math.round(distanceFeet)}ft away)`;
    }
  } else {
    warningLevel = "SOFT_WARN";
    reason = "GPS coordinates not provided";
  }

  if (params.isJailbroken) {
    warningLevel = "BLOCK";
    reason = (reason ? reason + "; " : "") + "Device is jailbroken/rooted";
  }

  await tx.geolocationLog.create({
    data: {
      organizationId: params.organizationId,
      locationId: params.locationId,
      cartId: params.cartId,
      paymentId: params.paymentId,
      deviceId: params.deviceId,
      userId: params.userId,
      staffId: params.staffId,
      lat: params.lat,
      lng: params.lng,
      accuracyMeters: params.accuracyMeters,
      distanceFromLocationFeet: distanceFeet,
      withinGeofence,
      isJailbroken: params.isJailbroken,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });

  return { withinGeofence, distanceFromLocationFeet: distanceFeet, warningLevel, reason };
}
