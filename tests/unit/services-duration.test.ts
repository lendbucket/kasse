import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { getServiceDurationForBooking } from "@/lib/services/pricing";

function makeMockTx(opts: {
  service?: { duration: number; bufferTime: number; processingMinutes: number | null } | null;
  serviceLocation?: { durationOverrideMinutes: number | null } | null;
  serviceStaffOverride?: { durationMinutes: number | null } | null;
}) {
  return {
    service: {
      findUnique: mock.fn(async () => opts.service ?? null),
    },
    serviceLocation: {
      findUnique: mock.fn(async () => opts.serviceLocation ?? null),
    },
    serviceStaffOverride: {
      findUnique: mock.fn(async () => opts.serviceStaffOverride ?? null),
    },
  } as unknown as Parameters<typeof getServiceDurationForBooking>[0];
}

describe("getServiceDurationForBooking (P0.G.1)", () => {
  it("returns base duration + buffer + processing", async () => {
    const tx = makeMockTx({
      service: { duration: 45, bufferTime: 10, processingMinutes: 30 },
    });
    const result = await getServiceDurationForBooking(tx, { serviceId: "svc1" });
    assert.equal(result.baseMinutes, 45);
    assert.equal(result.bufferMinutes, 10);
    assert.equal(result.processingMinutes, 30);
    assert.equal(result.effectiveTotalMinutes, 85); // 45 + 10 + 30
  });

  it("processing is 0 when null", async () => {
    const tx = makeMockTx({
      service: { duration: 30, bufferTime: 5, processingMinutes: null },
    });
    const result = await getServiceDurationForBooking(tx, { serviceId: "svc1" });
    assert.equal(result.effectiveTotalMinutes, 35); // 30 + 5 + 0
    assert.equal(result.processingMinutes, null);
  });

  it("location override beats base duration", async () => {
    const tx = makeMockTx({
      service: { duration: 45, bufferTime: 10, processingMinutes: null },
      serviceLocation: { durationOverrideMinutes: 60 },
    });
    const result = await getServiceDurationForBooking(tx, {
      serviceId: "svc1",
      locationId: "loc1",
    });
    assert.equal(result.locationOverrideMinutes, 60);
    assert.equal(result.effectiveTotalMinutes, 70); // 60 + 10 + 0
  });

  it("staff override beats location override", async () => {
    const tx = makeMockTx({
      service: { duration: 45, bufferTime: 10, processingMinutes: null },
      serviceLocation: { durationOverrideMinutes: 60 },
      serviceStaffOverride: { durationMinutes: 50 },
    });
    const result = await getServiceDurationForBooking(tx, {
      serviceId: "svc1",
      locationId: "loc1",
      staffId: "staff1",
    });
    assert.equal(result.staffOverrideMinutes, 50);
    assert.equal(result.effectiveTotalMinutes, 60); // 50 + 10 + 0
  });

  it("throws when service not found", async () => {
    const tx = makeMockTx({ service: null });
    await assert.rejects(
      () => getServiceDurationForBooking(tx, { serviceId: "missing" }),
      /Service missing not found/,
    );
  });
});
