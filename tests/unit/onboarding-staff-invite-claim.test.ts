import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_TRANSITIONS,
  ONBOARDING_STATES,
  SKIPPABLE_STATES,
} from "@/lib/onboarding/types";

describe("STAFF_PENDING sentinel state (P1.A.5)", () => {
  it("ONBOARDING_STATES includes STAFF_PENDING", () => {
    assert.ok(ONBOARDING_STATES.includes("STAFF_PENDING"));
  });

  it("has exactly 14 states after adding STAFF_PENDING + AGREEMENTS_PENDING", () => {
    assert.equal(ONBOARDING_STATES.length, 14);
  });

  it("SERVICES_SEEDED transitions to STAFF_PENDING", () => {
    assert.equal(ALLOWED_TRANSITIONS.SERVICES_SEEDED, "STAFF_PENDING");
  });

  it("STAFF_PENDING transitions to STAFF_INVITED", () => {
    assert.equal(ALLOWED_TRANSITIONS.STAFF_PENDING, "STAFF_INVITED");
  });

  it("STAFF_INVITED transitions to AGREEMENTS_PENDING (updated P1.A.6)", () => {
    assert.equal(ALLOWED_TRANSITIONS.STAFF_INVITED, "AGREEMENTS_PENDING");
  });

  it("STAFF_PENDING is NOT skippable", () => {
    assert.ok(!SKIPPABLE_STATES.has("STAFF_PENDING"));
  });

  it("STAFF_INVITED remains skippable", () => {
    assert.ok(SKIPPABLE_STATES.has("STAFF_INVITED"));
  });

  it("transition chain covers all 14 states in order", () => {
    let current: (typeof ONBOARDING_STATES)[number] = "STARTED";
    const visited: (typeof ONBOARDING_STATES)[number][] = [current];
    while (ALLOWED_TRANSITIONS[current] !== null) {
      current = ALLOWED_TRANSITIONS[current]!;
      visited.push(current);
    }
    assert.deepEqual(visited, [...ONBOARDING_STATES]);
  });
});
