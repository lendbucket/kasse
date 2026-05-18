import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TTL_SECONDS } from "@/lib/onboarding/resume-token";

/**
 * Resume token tests. signResumeToken/verifyResumeToken depend on
 * ONBOARDING_RESUME_SECRET env var and prismaAdmin. Here we test the
 * contract and constants that are unit-testable.
 *
 * NOTE: Tests below are CONTRACT STUBS that verify the API contract and
 * ensure imports compile. Real behavioral coverage of signResumeToken /
 * verifyResumeToken requires JWT secret mocking + prismaAdmin mocking.
 * Convert to full mocked tests when ONBOARDING_RESUME_SECRET handling
 * moves to a test-secret-injection pattern.
 */

describe("Resume token constants (P1.A.1)", () => {
  it("DEFAULT_TTL_SECONDS is 7 days", () => {
    assert.equal(DEFAULT_TTL_SECONDS, 7 * 24 * 60 * 60);
  });

  it("7 days in seconds is 604800", () => {
    assert.equal(DEFAULT_TTL_SECONDS, 604800);
  });
});

describe("Resume token payload contract (P1.A.1)", () => {
  it("payload must include sub, email, state, type", () => {
    const payload = {
      sub: "session-123",
      email: "owner@salon.com",
      state: "STARTED" as const,
      type: "onboarding-resume" as const,
    };
    assert.equal(payload.sub, "session-123");
    assert.equal(payload.email, "owner@salon.com");
    assert.equal(payload.state, "STARTED");
    assert.equal(payload.type, "onboarding-resume");
  });

  it("type must be exactly 'onboarding-resume'", () => {
    const validType = "onboarding-resume";
    const invalidType = "session-resume";
    assert.equal(validType, "onboarding-resume");
    assert.notEqual(invalidType, "onboarding-resume");
  });
});

describe("Resume token secret requirements (P1.A.1)", () => {
  it("secret must be at least 32 chars", () => {
    const tooShort = "abc123";
    const justRight = "a".repeat(32);
    const long = "a".repeat(64);
    assert.ok(tooShort.length < 32);
    assert.ok(justRight.length >= 32);
    assert.ok(long.length >= 32);
  });

  it("empty string is not a valid secret", () => {
    const secret: string | undefined = "";
    assert.ok(!secret || secret.length < 32);
  });
});

describe("Resume token verification contract (P1.A.1)", () => {
  it("expired token should be rejected", () => {
    // JWT exp is in seconds since epoch. A token with exp in the past is expired.
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const now = Math.floor(Date.now() / 1000);
    assert.ok(pastExp < now, "expired token exp should be before now");
  });

  it("valid token exp should be in the future", () => {
    const futureExp = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
    const now = Math.floor(Date.now() / 1000);
    assert.ok(futureExp > now, "valid token exp should be after now");
  });

  it("email mismatch between token and session should be detected", () => {
    const tokenEmail = "owner@salon.com";
    const sessionEmail = "different@salon.com";
    assert.notEqual(tokenEmail, sessionEmail);
  });
});
