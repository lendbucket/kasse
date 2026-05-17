import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PlanLimitError,
  assertCanAddLocation,
  assertCanAddStaff,
  recommendedUpgrade,
  planLimitErrorResponse,
  type ServerPlanContext,
} from "@/lib/plans/api-helpers";

const makeContext = (overrides: Partial<ServerPlanContext> = {}): ServerPlanContext => ({
  organizationId: 'org_test',
  tier: 'FREE',
  locationCount: 0,
  enabledAddons: [],
  ...overrides,
});

describe("recommendedUpgrade (P0.D.2)", () => {
  it("(a) FREE → PLUS", () => {
    assert.equal(recommendedUpgrade('FREE'), 'PLUS');
  });
  it("(b) PLUS → PREMIUM", () => {
    assert.equal(recommendedUpgrade('PLUS'), 'PREMIUM');
  });
  it("(c) PREMIUM → ENTERPRISE", () => {
    assert.equal(recommendedUpgrade('PREMIUM'), 'ENTERPRISE');
  });
  it("(d) ENTERPRISE → ENTERPRISE (no higher)", () => {
    assert.equal(recommendedUpgrade('ENTERPRISE'), 'ENTERPRISE');
  });
});

describe("assertCanAddLocation (P0.D.2)", () => {
  it("(e) FREE with 0 locations: allowed", () => {
    assert.doesNotThrow(() => assertCanAddLocation(makeContext({ locationCount: 0 })));
  });
  it("(f) FREE with 1 location: throws LOCATION_LIMIT", () => {
    assert.throws(
      () => assertCanAddLocation(makeContext({ locationCount: 1 })),
      (e: unknown) => e instanceof PlanLimitError && e.code === 'LOCATION_LIMIT',
    );
  });
  it("(g) PLUS with 99 locations: allowed (unlimited)", () => {
    assert.doesNotThrow(() => assertCanAddLocation(makeContext({ tier: 'PLUS', locationCount: 99 })));
  });
  it("(h) PREMIUM with 999 locations: allowed (unlimited)", () => {
    assert.doesNotThrow(() => assertCanAddLocation(makeContext({ tier: 'PREMIUM', locationCount: 999 })));
  });
  it("(i) ENTERPRISE with 9999 locations: allowed (unlimited)", () => {
    assert.doesNotThrow(() => assertCanAddLocation(makeContext({ tier: 'ENTERPRISE', locationCount: 9999 })));
  });
  it("(j) PlanLimitError includes recommended upgrade tier", () => {
    try {
      assertCanAddLocation(makeContext({ locationCount: 1 }));
      assert.fail('expected throw');
    } catch (e) {
      assert.ok(e instanceof PlanLimitError);
      assert.equal(e.recommendedTier, 'PLUS');
      assert.equal(e.currentTier, 'FREE');
      assert.equal(e.currentCount, 1);
      assert.equal(e.limit, 1);
    }
  });
});

describe("assertCanAddStaff (P0.D.2)", () => {
  it("(k) all tiers allow staff additions (launch policy)", () => {
    assert.doesNotThrow(() => assertCanAddStaff(makeContext(), 0));
    assert.doesNotThrow(() => assertCanAddStaff(makeContext(), 9999));
    assert.doesNotThrow(() => assertCanAddStaff(makeContext({ tier: 'PLUS' }), 99999));
    assert.doesNotThrow(() => assertCanAddStaff(makeContext({ tier: 'PREMIUM' }), 999999));
    assert.doesNotThrow(() => assertCanAddStaff(makeContext({ tier: 'ENTERPRISE' }), 9999999));
  });
});

describe("planLimitErrorResponse (P0.D.2)", () => {
  it("(l) wraps PlanLimitError as 402 PAYMENT_REQUIRED with structured body", async () => {
    const err = new PlanLimitError('LOCATION_LIMIT', 'FREE', 1, 1, 'PLUS');
    const res = planLimitErrorResponse(err);
    assert.ok(res !== null);
    assert.equal(res!.status, 402);
    const body = await res!.json();
    assert.equal(body.code, 'LOCATION_LIMIT');
    assert.equal(body.currentTier, 'FREE');
    assert.equal(body.currentCount, 1);
    assert.equal(body.limit, 1);
    assert.equal(body.recommendedTier, 'PLUS');
  });
  it("(m) returns null for non-PlanLimitError", () => {
    assert.equal(planLimitErrorResponse(new Error('something else')), null);
    assert.equal(planLimitErrorResponse('not even an error'), null);
    assert.equal(planLimitErrorResponse(undefined), null);
  });
});
