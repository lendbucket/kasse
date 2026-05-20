import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_TRANSITIONS,
  ONBOARDING_STATES,
  SKIPPABLE_STATES,
} from "@/lib/onboarding/types";

describe("AGREEMENTS_PENDING sentinel state (P1.A.6)", () => {
  it("ONBOARDING_STATES includes AGREEMENTS_PENDING", () => {
    assert.ok(ONBOARDING_STATES.includes("AGREEMENTS_PENDING"));
  });

  it("has exactly 14 states after adding AGREEMENTS_PENDING", () => {
    assert.equal(ONBOARDING_STATES.length, 14);
  });

  it("STAFF_INVITED transitions to AGREEMENTS_PENDING", () => {
    assert.equal(ALLOWED_TRANSITIONS.STAFF_INVITED, "AGREEMENTS_PENDING");
  });

  it("AGREEMENTS_PENDING transitions to AGREEMENTS_CONFIGURED", () => {
    assert.equal(ALLOWED_TRANSITIONS.AGREEMENTS_PENDING, "AGREEMENTS_CONFIGURED");
  });

  it("AGREEMENTS_CONFIGURED transitions to COMPENSATION_CONFIGURED (unchanged)", () => {
    assert.equal(ALLOWED_TRANSITIONS.AGREEMENTS_CONFIGURED, "COMPENSATION_CONFIGURED");
  });

  it("AGREEMENTS_PENDING is NOT skippable", () => {
    assert.ok(!SKIPPABLE_STATES.has("AGREEMENTS_PENDING"));
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
