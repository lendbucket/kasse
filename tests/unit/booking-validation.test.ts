import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  validateBookingWindow,
  staffCanPerformService,
  hasTimeConflict,
} from "@/lib/booking/validation";

describe("validateBookingWindow (P0.G.2)", () => {
  const baseWindow = {
    locationId: "loc1",
    maxDaysAhead: 60,
    minHoursAhead: 1,
    slotGranularityMinutes: 15,
    allowSameDayBooking: true,
    allowOnlineBooking: true,
    requireDepositForNewClients: false,
    requireConsultationForNewClients: false,
    bufferBetweenAppointmentsMinutes: 0,
    maxConcurrentBookingsPerClient: 5,
  };

  it("returns valid when no window configured", async () => {
    const tx = {
      bookingWindow: { findUnique: mock.fn(async () => null) },
    } as unknown as Parameters<typeof validateBookingWindow>[0];

    const result = await validateBookingWindow(tx, {
      locationId: "loc1",
      requestedStartTime: new Date("2026-06-15T10:00:00Z"),
      isOnlineBooking: true,
    });
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
  });

  it("rejects when online booking disabled", async () => {
    const tx = {
      bookingWindow: {
        findUnique: mock.fn(async () => ({ ...baseWindow, allowOnlineBooking: false })),
      },
    } as unknown as Parameters<typeof validateBookingWindow>[0];

    const result = await validateBookingWindow(tx, {
      locationId: "loc1",
      requestedStartTime: new Date("2026-06-15T10:00:00Z"),
      isOnlineBooking: true,
      now: new Date("2026-05-18T10:00:00Z"),
    });
    assert.equal(result.isValid, false);
    assert.equal(result.errors[0].code, "ONLINE_BOOKING_DISABLED");
  });

  it("rejects when beyond maxDaysAhead", async () => {
    const tx = {
      bookingWindow: {
        findUnique: mock.fn(async () => ({ ...baseWindow, maxDaysAhead: 30 })),
      },
    } as unknown as Parameters<typeof validateBookingWindow>[0];

    const now = new Date("2026-05-18T10:00:00Z");
    const requestedStartTime = new Date("2026-07-20T10:00:00Z"); // 63 days away

    const result = await validateBookingWindow(tx, {
      locationId: "loc1",
      requestedStartTime,
      isOnlineBooking: false,
      now,
    });
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.code === "OUTSIDE_BOOKING_WINDOW"));
  });

  it("rejects when below minHoursAhead", async () => {
    const tx = {
      bookingWindow: {
        findUnique: mock.fn(async () => ({ ...baseWindow, minHoursAhead: 4 })),
      },
    } as unknown as Parameters<typeof validateBookingWindow>[0];

    const now = new Date("2026-05-18T10:00:00Z");
    const requestedStartTime = new Date("2026-05-18T12:00:00Z"); // 2 hours away

    const result = await validateBookingWindow(tx, {
      locationId: "loc1",
      requestedStartTime,
      isOnlineBooking: false,
      now,
    });
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.code === "BELOW_MIN_LEAD_TIME"));
  });

  it("rejects same-day when disabled", async () => {
    const tx = {
      bookingWindow: {
        findUnique: mock.fn(async () => ({
          ...baseWindow,
          allowSameDayBooking: false,
          minHoursAhead: 0,
        })),
      },
    } as unknown as Parameters<typeof validateBookingWindow>[0];

    const now = new Date("2026-05-18T08:00:00Z");
    const requestedStartTime = new Date("2026-05-18T15:00:00Z");

    const result = await validateBookingWindow(tx, {
      locationId: "loc1",
      requestedStartTime,
      isOnlineBooking: false,
      now,
    });
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.code === "NOT_ALLOWED_SAME_DAY"));
  });
});

describe("staffCanPerformService (P0.G.2)", () => {
  it("returns true when StylistService exists", async () => {
    const tx = {
      stylistService: { findUnique: mock.fn(async () => ({ id: "ss1" })) },
    } as unknown as Parameters<typeof staffCanPerformService>[0];

    const result = await staffCanPerformService(tx, { staffId: "s1", serviceId: "svc1" });
    assert.equal(result, true);
  });

  it("returns false when no link", async () => {
    const tx = {
      stylistService: { findUnique: mock.fn(async () => null) },
    } as unknown as Parameters<typeof staffCanPerformService>[0];

    const result = await staffCanPerformService(tx, { staffId: "s1", serviceId: "svc1" });
    assert.equal(result, false);
  });
});

describe("hasTimeConflict (P0.G.2)", () => {
  it("detects overlap", async () => {
    const tx = {
      appointmentItem: {
        findMany: mock.fn(async () => [{ id: "item1" }]),
      },
    } as unknown as Parameters<typeof hasTimeConflict>[0];

    const result = await hasTimeConflict(tx, {
      staffId: "s1",
      startTime: new Date("2026-05-18T10:00:00Z"),
      endTime: new Date("2026-05-18T11:00:00Z"),
    });
    assert.equal(result, true);
  });

  it("returns false when no conflicts", async () => {
    const tx = {
      appointmentItem: {
        findMany: mock.fn(async () => []),
      },
    } as unknown as Parameters<typeof hasTimeConflict>[0];

    const result = await hasTimeConflict(tx, {
      staffId: "s1",
      startTime: new Date("2026-05-18T10:00:00Z"),
      endTime: new Date("2026-05-18T11:00:00Z"),
    });
    assert.equal(result, false);
  });

  it("excludes specified appointment ID", async () => {
    const mockFindMany = mock.fn(async () => []);
    const tx = {
      appointmentItem: { findMany: mockFindMany },
    } as unknown as Parameters<typeof hasTimeConflict>[0];

    await hasTimeConflict(tx, {
      staffId: "s1",
      startTime: new Date("2026-05-18T10:00:00Z"),
      endTime: new Date("2026-05-18T11:00:00Z"),
      excludeAppointmentId: "appt-123",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args = (mockFindMany.mock.calls[0] as any).arguments[0];
    assert.equal(args.where.appointmentId.not, "appt-123");
  });
});
