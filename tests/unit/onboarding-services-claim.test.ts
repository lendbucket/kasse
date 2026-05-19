import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_TRANSITIONS,
  ONBOARDING_STATES,
  SKIPPABLE_STATES,
} from "@/lib/onboarding/types";

describe("SERVICES_PENDING sentinel state (P1.A.4)", () => {
  it("ONBOARDING_STATES includes SERVICES_PENDING", () => {
    assert.ok(ONBOARDING_STATES.includes("SERVICES_PENDING"));
  });

  it("has exactly 12 states after adding SERVICES_PENDING", () => {
    assert.equal(ONBOARDING_STATES.length, 12);
  });

  it("LOCATION_CREATED transitions to SERVICES_PENDING", () => {
    assert.equal(ALLOWED_TRANSITIONS.LOCATION_CREATED, "SERVICES_PENDING");
  });

  it("SERVICES_PENDING transitions to SERVICES_SEEDED", () => {
    assert.equal(ALLOWED_TRANSITIONS.SERVICES_PENDING, "SERVICES_SEEDED");
  });

  it("SERVICES_SEEDED transitions to STAFF_INVITED (unchanged)", () => {
    assert.equal(ALLOWED_TRANSITIONS.SERVICES_SEEDED, "STAFF_INVITED");
  });

  it("SERVICES_PENDING is NOT skippable", () => {
    assert.ok(!SKIPPABLE_STATES.has("SERVICES_PENDING"));
  });

  it("transition chain covers all 12 states in order", () => {
    let current: (typeof ONBOARDING_STATES)[number] = "STARTED";
    const visited: (typeof ONBOARDING_STATES)[number][] = [current];
    while (ALLOWED_TRANSITIONS[current] !== null) {
      current = ALLOWED_TRANSITIONS[current]!;
      visited.push(current);
    }
    assert.deepEqual(visited, [...ONBOARDING_STATES]);
  });
});
