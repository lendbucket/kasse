import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import {
  resolveCancellationPolicy,
  calculateCancellationFee,
} from "@/lib/booking/cancellation-policy";
import type { CancellationPolicyResolved } from "@/lib/booking/types";

function makeMockTx(policies: {
  service?: object | null;
  location?: object | null;
  org?: object | null;
}) {
  let callCount = 0;
  return {
    cancellationPolicy: {
      findFirst: mock.fn(async () => {
        callCount++;
        if (callCount === 1) return policies.service ?? null;
        if (callCount === 2) return policies.location ?? null;
        if (callCount === 3) return policies.org ?? null;
        return null;
      }),
    },
  } as unknown as Parameters<typeof resolveCancellationPolicy>[0];
}

const basePolicy = {
  windowHours: 24,
  cancellationFeeFixedCents: 2500,
  cancellationFeePercentage: null,
  cancellationFeeChargeType: "FIXED",
  noShowFeeFixedCents: 5000,
  noShowFeePercentage: null,
  noShowFeeChargeType: "FIXED",
  policyText: "24hr cancellation policy",
  requirePreAuth: true,
  preAuthAmountCents: 5000,
};

describe("resolveCancellationPolicy (P0.G.2)", () => {
  it("returns SERVICE policy when set", async () => {
    const tx = makeMockTx({ service: basePolicy });
    const result = await resolveCancellationPolicy(tx, {
      organizationId: "org1",
      serviceId: "svc1",
      locationId: "loc1",
    });
    assert.equal(result.source, "SERVICE");
    assert.equal(result.windowHours, 24);
    assert.equal(result.cancellationFeeFixedCents, 2500);
  });

  it("falls back to LOCATION when no service policy", async () => {
    const tx = makeMockTx({ service: null, location: basePolicy });
    const result = await resolveCancellationPolicy(tx, {
      organizationId: "org1",
      serviceId: "svc1",
      locationId: "loc1",
    });
    assert.equal(result.source, "LOCATION");
  });

  it("falls back to ORGANIZATION when no location policy", async () => {
    const tx = makeMockTx({ service: null, location: null, org: basePolicy });
    const result = await resolveCancellationPolicy(tx, {
      organizationId: "org1",
      serviceId: "svc1",
      locationId: "loc1",
    });
    assert.equal(result.source, "ORGANIZATION");
  });

  it("returns DEFAULT when none configured", async () => {
    const tx = makeMockTx({ service: null, location: null, org: null });
    const result = await resolveCancellationPolicy(tx, {
      organizationId: "org1",
      serviceId: "svc1",
      locationId: "loc1",
    });
    assert.equal(result.source, "DEFAULT");
    assert.equal(result.cancellationFeeChargeType, "NONE");
  });
});

describe("calculateCancellationFee (P0.G.2)", () => {
  const fixedPolicy: CancellationPolicyResolved = {
    windowHours: 24,
    cancellationFeeFixedCents: 2500,
    cancellationFeePercentage: null,
    cancellationFeeChargeType: "FIXED",
    noShowFeeFixedCents: 5000,
    noShowFeePercentage: null,
    noShowFeeChargeType: "FIXED",
    policyText: null,
    requirePreAuth: false,
    preAuthAmountCents: null,
    source: "SERVICE",
  };

  it("FIXED type returns exact amount", () => {
    const { feeCents } = calculateCancellationFee({
      policy: fixedPolicy,
      appointmentPriceCents: 10000,
      hoursUntilAppointment: 12,
      isNoShow: false,
    });
    assert.equal(feeCents, 2500);
  });

  it("PERCENTAGE type returns rounded percentage", () => {
    const pctPolicy: CancellationPolicyResolved = {
      ...fixedPolicy,
      cancellationFeeChargeType: "PERCENTAGE",
      cancellationFeePercentage: 50,
      cancellationFeeFixedCents: null,
    };
    const { feeCents } = calculateCancellationFee({
      policy: pctPolicy,
      appointmentPriceCents: 8500,
      hoursUntilAppointment: 12,
      isNoShow: false,
    });
    assert.equal(feeCents, 4250); // 50% of 8500
  });

  it("NONE type returns 0", () => {
    const nonePolicy: CancellationPolicyResolved = {
      ...fixedPolicy,
      cancellationFeeChargeType: "NONE",
    };
    const { feeCents } = calculateCancellationFee({
      policy: nonePolicy,
      appointmentPriceCents: 10000,
      hoursUntilAppointment: 12,
      isNoShow: false,
    });
    assert.equal(feeCents, 0);
  });

  it("respects windowHours (outside window = 0 fee)", () => {
    const { feeCents } = calculateCancellationFee({
      policy: fixedPolicy,
      appointmentPriceCents: 10000,
      hoursUntilAppointment: 48, // well outside 24hr window
      isNoShow: false,
    });
    assert.equal(feeCents, 0);
  });

  it("no-show always charges (no window check)", () => {
    const { feeCents } = calculateCancellationFee({
      policy: fixedPolicy,
      appointmentPriceCents: 10000,
      hoursUntilAppointment: 48,
      isNoShow: true,
    });
    assert.equal(feeCents, 5000);
  });
});
