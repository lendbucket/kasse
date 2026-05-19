import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ONBOARDING_STATES,
  ALLOWED_TRANSITIONS,
  SKIPPABLE_STATES,
  V1_LAUNCH_VERTICALS,
  OnboardingError,
} from "@/lib/onboarding/types";
import type { OnboardingState } from "@/lib/onboarding/types";

describe("Onboarding state machine constants (P1.A.1)", () => {
  it("has exactly 12 states", () => {
    assert.equal(ONBOARDING_STATES.length, 12);
  });

  it("starts with STARTED and ends with COMPLETED", () => {
    assert.equal(ONBOARDING_STATES[0], "STARTED");
    assert.equal(ONBOARDING_STATES[ONBOARDING_STATES.length - 1], "COMPLETED");
  });

  it("every state has a transition entry", () => {
    for (const state of ONBOARDING_STATES) {
      assert.ok(state in ALLOWED_TRANSITIONS, `missing transition for ${state}`);
    }
  });

  it("COMPLETED has null as next state (terminal)", () => {
    assert.equal(ALLOWED_TRANSITIONS.COMPLETED, null);
  });

  it("all non-COMPLETED states have a non-null next state", () => {
    for (const state of ONBOARDING_STATES) {
      if (state === "COMPLETED") continue;
      assert.ok(ALLOWED_TRANSITIONS[state] !== null, `${state} should have a next state`);
    }
  });

  it("transition chain covers all states in order", () => {
    let current: OnboardingState = "STARTED";
    const visited: OnboardingState[] = [current];
    while (ALLOWED_TRANSITIONS[current] !== null) {
      current = ALLOWED_TRANSITIONS[current]!;
      visited.push(current);
    }
    assert.deepEqual(visited, [...ONBOARDING_STATES]);
  });
});

describe("Onboarding skippable states (P1.A.1)", () => {
  it("has exactly 3 skippable states", () => {
    assert.equal(SKIPPABLE_STATES.size, 3);
  });

  it("STAFF_INVITED is skippable", () => {
    assert.ok(SKIPPABLE_STATES.has("STAFF_INVITED"));
  });

  it("AGREEMENTS_CONFIGURED is skippable", () => {
    assert.ok(SKIPPABLE_STATES.has("AGREEMENTS_CONFIGURED"));
  });

  it("COMPENSATION_CONFIGURED is skippable", () => {
    assert.ok(SKIPPABLE_STATES.has("COMPENSATION_CONFIGURED"));
  });

  it("STARTED is NOT skippable", () => {
    assert.ok(!SKIPPABLE_STATES.has("STARTED"));
  });

  it("EMAIL_VERIFIED is NOT skippable", () => {
    assert.ok(!SKIPPABLE_STATES.has("EMAIL_VERIFIED"));
  });

  it("ACCOUNT_CREATED is NOT skippable", () => {
    assert.ok(!SKIPPABLE_STATES.has("ACCOUNT_CREATED"));
  });
});

describe("Onboarding transition validation contract (P1.A.1)", () => {
  it("backwards transition is detected as invalid", () => {
    const current: OnboardingState = "ORG_CREATED";
    const attempted: OnboardingState = "ACCOUNT_CREATED"; // backwards
    const expected = ALLOWED_TRANSITIONS[current];
    assert.notEqual(expected, attempted, "backwards move should not match expected next");
  });

  it("skip transition is detected as invalid for required states", () => {
    // Trying to go from STARTED to ACCOUNT_CREATED (skipping EMAIL_VERIFIED)
    const current: OnboardingState = "STARTED";
    const attempted: OnboardingState = "ACCOUNT_CREATED";
    const expected = ALLOWED_TRANSITIONS[current];
    assert.notEqual(expected, attempted, "skipping a required state should not match");
  });

  it("forward transition to correct next state is valid", () => {
    const current: OnboardingState = "STARTED";
    const attempted: OnboardingState = "EMAIL_VERIFIED";
    const expected = ALLOWED_TRANSITIONS[current];
    assert.equal(expected, attempted);
  });
});

describe("Onboarding email validation pattern (P1.A.1)", () => {
  const pattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  it("accepts valid email", () => {
    assert.ok(pattern.test("owner@salon.com"));
  });

  it("accepts email with dots in local part", () => {
    assert.ok(pattern.test("first.last@example.com"));
  });

  it("rejects email without @", () => {
    assert.ok(!pattern.test("notanemail"));
  });

  it("rejects email without domain", () => {
    assert.ok(!pattern.test("user@"));
  });

  it("rejects empty string", () => {
    assert.ok(!pattern.test(""));
  });

  it("rejects email with spaces", () => {
    assert.ok(!pattern.test("user @example.com"));
  });
});

describe("Onboarding verticals (P1.A.1)", () => {
  it("V1 launches with SALON only", () => {
    assert.deepEqual([...V1_LAUNCH_VERTICALS], ["SALON"]);
  });
});

describe("OnboardingError (P1.A.1)", () => {
  it("carries code and message", () => {
    const err = new OnboardingError("INVALID_TRANSITION", "test message");
    assert.equal(err.code, "INVALID_TRANSITION");
    assert.equal(err.message, "test message");
    assert.equal(err.name, "OnboardingError");
  });

  it("is instanceof Error", () => {
    const err = new OnboardingError("SESSION_NOT_FOUND", "not found");
    assert.ok(err instanceof Error);
  });
});
