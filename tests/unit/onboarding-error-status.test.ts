import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { onboardingErrorStatus } from "@/lib/onboarding/error-status";

describe("onboardingErrorStatus helper (P1.A.5)", () => {
  it("SESSION_NOT_FOUND → 404", () => {
    assert.equal(onboardingErrorStatus("SESSION_NOT_FOUND"), 404);
  });

  it("INVALID_TOKEN → 404", () => {
    assert.equal(onboardingErrorStatus("INVALID_TOKEN"), 404);
  });

  it("INVITE_NOT_FOUND → 404", () => {
    assert.equal(onboardingErrorStatus("INVITE_NOT_FOUND"), 404);
  });

  it("ORG_SCOPE_MISMATCH → 403", () => {
    assert.equal(onboardingErrorStatus("ORG_SCOPE_MISMATCH"), 403);
  });

  it("NOT_AUTHENTICATED → 401", () => {
    assert.equal(onboardingErrorStatus("NOT_AUTHENTICATED"), 401);
  });

  it("SESSION_EXPIRED → 410", () => {
    assert.equal(onboardingErrorStatus("SESSION_EXPIRED"), 410);
  });

  it("TOKEN_ALREADY_CONSUMED → 410", () => {
    assert.equal(onboardingErrorStatus("TOKEN_ALREADY_CONSUMED"), 410);
  });

  it("INVITE_ALREADY_ACCEPTED → 410", () => {
    assert.equal(onboardingErrorStatus("INVITE_ALREADY_ACCEPTED"), 410);
  });

  it("INVITE_EXPIRED → 410", () => {
    assert.equal(onboardingErrorStatus("INVITE_EXPIRED"), 410);
  });

  it("INVALID_TRANSITION → 409", () => {
    assert.equal(onboardingErrorStatus("INVALID_TRANSITION"), 409);
  });

  it("STEP_NOT_SKIPPABLE → 409", () => {
    assert.equal(onboardingErrorStatus("STEP_NOT_SKIPPABLE"), 409);
  });

  it("SESSION_COMPLETED → 409", () => {
    assert.equal(onboardingErrorStatus("SESSION_COMPLETED"), 409);
  });

  it("ORG_NOT_YET_CREATED → 409", () => {
    assert.equal(onboardingErrorStatus("ORG_NOT_YET_CREATED"), 409);
  });

  it("LOCATION_NOT_YET_CREATED → 409", () => {
    assert.equal(onboardingErrorStatus("LOCATION_NOT_YET_CREATED"), 409);
  });

  it("DUPLICATE_ACTIVE_SESSION → 409", () => {
    assert.equal(onboardingErrorStatus("DUPLICATE_ACTIVE_SESSION"), 409);
  });

  it("EMAIL_ALREADY_REGISTERED → 409", () => {
    assert.equal(onboardingErrorStatus("EMAIL_ALREADY_REGISTERED"), 409);
  });

  it("INVITE_ALREADY_EXISTS → 409", () => {
    assert.equal(onboardingErrorStatus("INVITE_ALREADY_EXISTS"), 409);
  });

  it("INVITE_EMAIL_ALREADY_USER → 409", () => {
    assert.equal(onboardingErrorStatus("INVITE_EMAIL_ALREADY_USER"), 409);
  });

  it("TOO_MANY_MAGIC_LINK_SENDS → 429", () => {
    assert.equal(onboardingErrorStatus("TOO_MANY_MAGIC_LINK_SENDS"), 429);
  });

  it("unknown/validation codes default to 400", () => {
    assert.equal(onboardingErrorStatus("INVALID_EMAIL"), 400);
    assert.equal(onboardingErrorStatus("PASSWORD_TOO_WEAK"), 400);
    assert.equal(onboardingErrorStatus("INVITE_EMAIL_REQUIRED"), 400);
    assert.equal(onboardingErrorStatus("SLUG_COLLISION"), 400);
    assert.equal(onboardingErrorStatus("SOME_UNKNOWN_CODE"), 400);
  });
});
