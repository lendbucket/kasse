import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { getServicePriceForBooking } from "@/lib/services/pricing";

function makeMockTx(opts: {
  service?: { price: number } | null;
  serviceLocation?: { priceOverrideCents: number | null; isAvailable: boolean } | null;
  serviceStaffOverride?: { priceCents: number | null } | null;
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
  } as unknown as Parameters<typeof getServicePriceForBooking>[0];
}

describe("getServicePriceForBooking (P0.G.1)", () => {
  it("returns base price when no overrides", async () => {
    const tx = makeMockTx({ service: { price: 65.0 } });
    const result = await getServicePriceForBooking(tx, { serviceId: "svc1" });
    assert.equal(result.baseCents, 6500);
    assert.equal(result.locationOverrideCents, null);
    assert.equal(result.staffOverrideCents, null);
    assert.equal(result.effectiveCents, 6500);
  });

  it("location override beats base", async () => {
    const tx = makeMockTx({
      service: { price: 65.0 },
      serviceLocation: { priceOverrideCents: 7000, isAvailable: true },
    });
    const result = await getServicePriceForBooking(tx, {
      serviceId: "svc1",
      locationId: "loc1",
    });
    assert.equal(result.effectiveCents, 7000);
    assert.equal(result.locationOverrideCents, 7000);
  });

  it("staff override beats location override", async () => {
    const tx = makeMockTx({
      service: { price: 65.0 },
      serviceLocation: { priceOverrideCents: 7000, isAvailable: true },
      serviceStaffOverride: { priceCents: 8000 },
    });
    const result = await getServicePriceForBooking(tx, {
      serviceId: "svc1",
      locationId: "loc1",
      staffId: "staff1",
    });
    assert.equal(result.effectiveCents, 8000);
    assert.equal(result.staffOverrideCents, 8000);
  });

  it("staff override beats base when no location override", async () => {
    const tx = makeMockTx({
      service: { price: 65.0 },
      serviceStaffOverride: { priceCents: 5500 },
    });
    const result = await getServicePriceForBooking(tx, {
      serviceId: "svc1",
      staffId: "staff1",
    });
    assert.equal(result.effectiveCents, 5500);
  });

  it("throws when service not found", async () => {
    const tx = makeMockTx({ service: null });
    await assert.rejects(
      () => getServicePriceForBooking(tx, { serviceId: "missing" }),
      /Service missing not found/,
    );
  });

  it("throws when service not available at location", async () => {
    const tx = makeMockTx({
      service: { price: 65.0 },
      serviceLocation: { priceOverrideCents: null, isAvailable: false },
    });
    await assert.rejects(
      () =>
        getServicePriceForBooking(tx, {
          serviceId: "svc1",
          locationId: "loc1",
        }),
      /not available at this location/,
    );
  });
});
