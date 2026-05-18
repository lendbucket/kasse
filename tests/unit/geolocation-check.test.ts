import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { haversineFeet, checkGeolocationAndLog } from "@/lib/geolocation/check";

describe("Geolocation check (P0.G.3)", () => {
  describe("haversineFeet", () => {
    it("returns reasonable distance for known coordinates (~1 mile apart)", () => {
      // Downtown Dallas to ~1 mile north
      const lat1 = 32.7767;
      const lng1 = -96.7970;
      const lat2 = 32.7912; // ~0.0145 degrees north ~ 1 mile
      const lng2 = -96.7970;
      const distance = haversineFeet(lat1, lng1, lat2, lng2);
      // 1 mile = 5280 feet, allow 10% tolerance
      assert.ok(distance > 4750, `Expected > 4750ft, got ${distance}`);
      assert.ok(distance < 5800, `Expected < 5800ft, got ${distance}`);
    });
  });

  describe("checkGeolocationAndLog", () => {
    function makeTx(locationData: { lat: number | null; lng: number | null; geofenceRadius: number }) {
      return {
        location: {
          findUnique: mock.fn(async () => locationData),
        },
        geolocationLog: {
          create: mock.fn(async () => ({ id: "log-1" })),
        },
      } as unknown as Parameters<typeof checkGeolocationAndLog>[0];
    }

    it("returns withinGeofence=true when within radius", async () => {
      const tx = makeTx({ lat: 32.7767, lng: -96.7970, geofenceRadius: 200 });
      const result = await checkGeolocationAndLog(tx, {
        organizationId: "org-1",
        locationId: "loc-1",
        cartId: null,
        paymentId: null,
        deviceId: null,
        userId: null,
        staffId: null,
        lat: 32.7767,
        lng: -96.7970,
        accuracyMeters: 5,
        ipAddress: null,
        userAgent: null,
        isJailbroken: false,
      });
      assert.equal(result.withinGeofence, true);
      assert.equal(result.warningLevel, "NONE");
    });

    it("returns SOFT_WARN when outside geofence", async () => {
      const tx = makeTx({ lat: 32.7767, lng: -96.7970, geofenceRadius: 100 });
      const result = await checkGeolocationAndLog(tx, {
        organizationId: "org-1",
        locationId: "loc-1",
        cartId: null,
        paymentId: null,
        deviceId: null,
        userId: null,
        staffId: null,
        lat: 33.0, // far away
        lng: -96.7970,
        accuracyMeters: 5,
        ipAddress: null,
        userAgent: null,
        isJailbroken: false,
      });
      assert.equal(result.withinGeofence, false);
      assert.equal(result.warningLevel, "SOFT_WARN");
    });

    it("returns BLOCK when jailbroken", async () => {
      const tx = makeTx({ lat: 32.7767, lng: -96.7970, geofenceRadius: 99999 });
      const result = await checkGeolocationAndLog(tx, {
        organizationId: "org-1",
        locationId: "loc-1",
        cartId: null,
        paymentId: null,
        deviceId: null,
        userId: null,
        staffId: null,
        lat: 32.7767,
        lng: -96.7970,
        accuracyMeters: 5,
        ipAddress: null,
        userAgent: null,
        isJailbroken: true,
      });
      assert.equal(result.warningLevel, "BLOCK");
    });

    it("returns SOFT_WARN when GPS not provided", async () => {
      const tx = makeTx({ lat: 32.7767, lng: -96.7970, geofenceRadius: 100 });
      const result = await checkGeolocationAndLog(tx, {
        organizationId: "org-1",
        locationId: "loc-1",
        cartId: null,
        paymentId: null,
        deviceId: null,
        userId: null,
        staffId: null,
        lat: null,
        lng: null,
        accuracyMeters: null,
        ipAddress: null,
        userAgent: null,
        isJailbroken: false,
      });
      assert.equal(result.warningLevel, "SOFT_WARN");
      assert.ok(result.reason?.includes("GPS coordinates not provided"));
    });
  });
});
