import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_TRANSITIONS,
  ONBOARDING_STATES,
  SKIPPABLE_STATES,
} from "@/lib/onboarding/types";

describe("LOCATION_PENDING sentinel state (P1.A.3b cycle 6)", () => {
  it("ONBOARDING_STATES includes LOCATION_PENDING", () => {
    assert.ok(ONBOARDING_STATES.includes("LOCATION_PENDING"));
  });

  it("has exactly 11 states after adding LOCATION_PENDING", () => {
    assert.equal(ONBOARDING_STATES.length, 11);
  });

  it("ORG_CREATED transitions to LOCATION_PENDING", () => {
    assert.equal(ALLOWED_TRANSITIONS.ORG_CREATED, "LOCATION_PENDING");
  });

  it("LOCATION_PENDING transitions to LOCATION_CREATED", () => {
    assert.equal(ALLOWED_TRANSITIONS.LOCATION_PENDING, "LOCATION_CREATED");
  });

  it("LOCATION_CREATED transitions to SERVICES_SEEDED (unchanged)", () => {
    assert.equal(ALLOWED_TRANSITIONS.LOCATION_CREATED, "SERVICES_SEEDED");
  });

  it("LOCATION_PENDING is NOT skippable", () => {
    assert.ok(!SKIPPABLE_STATES.has("LOCATION_PENDING"));
  });

  it("transition chain still covers all states in order", () => {
    let current: typeof ONBOARDING_STATES[number] = "STARTED";
    const visited: (typeof ONBOARDING_STATES[number])[] = [current];
    while (ALLOWED_TRANSITIONS[current] !== null) {
      current = ALLOWED_TRANSITIONS[current]!;
      visited.push(current);
    }
    assert.deepEqual(visited, [...ONBOARDING_STATES]);
  });
});
