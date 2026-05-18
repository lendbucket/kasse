export interface GeolocationCheckParams {
  organizationId: string;
  locationId: string;
  cartId: string | null;
  paymentId: string | null;
  deviceId: string | null;
  userId: string | null;
  staffId: string | null;
  lat: number | null;
  lng: number | null;
  accuracyMeters: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  isJailbroken: boolean;
}

export interface GeolocationResult {
  withinGeofence: boolean;
  distanceFromLocationFeet: number | null;
  warningLevel: "NONE" | "SOFT_WARN" | "BLOCK";
  reason: string | null;
}
