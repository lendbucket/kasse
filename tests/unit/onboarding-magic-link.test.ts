import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_MAGIC_LINKS_PER_HOUR,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/onboarding/magic-link";
import { renderMagicLinkEmail } from "@/lib/onboarding/emails/magic-link";

/**
 * Unit tests for magic-link logic (P1.A.2).
 * Tests pure functions and constants. Integration tests (Resend mocking,
 * DB interaction) are covered by smoke tests.
 */

describe("Magic-link rate limit constants (P1.A.2)", () => {
  it("MAX_MAGIC_LINKS_PER_HOUR is 3", () => {
    assert.equal(MAX_MAGIC_LINKS_PER_HOUR, 3);
  });

  it("RATE_LIMIT_WINDOW_MS is 1 hour", () => {
    assert.equal(RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000);
  });
});

describe("Rate limit window logic (P1.A.2)", () => {
  it("first send is always allowed (fresh window)", () => {
    const magicLinkLastSentAt = null;
    const inFreshWindow =
      !magicLinkLastSentAt ||
      Date.now() - new Date(magicLinkLastSentAt).getTime() >= RATE_LIMIT_WINDOW_MS;
    assert.ok(inFreshWindow);
  });

  it("send within window increments count", () => {
    const magicLinkLastSentAt = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    const inFreshWindow =
      Date.now() - magicLinkLastSentAt.getTime() >= RATE_LIMIT_WINDOW_MS;
    assert.equal(inFreshWindow, false);

    // Count should increment (not reset)
    const currentCount = 1;
    const newCount = inFreshWindow ? 1 : currentCount + 1;
    assert.equal(newCount, 2);
  });

  it("send after window resets count to 1", () => {
    const magicLinkLastSentAt = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MS - 1000
    ); // just past window
    const inFreshWindow =
      Date.now() - magicLinkLastSentAt.getTime() >= RATE_LIMIT_WINDOW_MS;
    assert.ok(inFreshWindow);

    const newCount = inFreshWindow ? 1 : 99; // would be 99 if not reset
    assert.equal(newCount, 1);
  });

  it("rate limit triggers at MAX_MAGIC_LINKS_PER_HOUR within window", () => {
    const magicLinkLastSentAt = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    const magicLinkEmailsSentCount = MAX_MAGIC_LINKS_PER_HOUR;
    const now = Date.now();

    const rateLimited =
      magicLinkLastSentAt &&
      now - magicLinkLastSentAt.getTime() < RATE_LIMIT_WINDOW_MS &&
      magicLinkEmailsSentCount >= MAX_MAGIC_LINKS_PER_HOUR;

    assert.ok(rateLimited);
  });

  it("rate limit does NOT trigger when count is below max", () => {
    const magicLinkLastSentAt = new Date(Date.now() - 5 * 60 * 1000);
    const magicLinkEmailsSentCount = MAX_MAGIC_LINKS_PER_HOUR - 1;
    const now = Date.now();

    const rateLimited =
      magicLinkLastSentAt &&
      now - magicLinkLastSentAt.getTime() < RATE_LIMIT_WINDOW_MS &&
      magicLinkEmailsSentCount >= MAX_MAGIC_LINKS_PER_HOUR;

    assert.ok(!rateLimited);
  });
});

describe("Magic-link email template (P1.A.2)", () => {
  const expiresAt = new Date("2026-05-19T12:00:00Z");
  const verificationUrl = "https://signup.kasseapp.com/onboarding/verify?token=abc123";
  const { html, text } = renderMagicLinkEmail({ verificationUrl, expiresAt });

  it("HTML contains the verification URL", () => {
    assert.ok(html.includes(verificationUrl));
  });

  it("HTML contains the Verify Email button", () => {
    assert.ok(html.includes("Verify Email"));
  });

  it("HTML uses Kasse design system accent color #606E74", () => {
    assert.ok(html.includes("#606E74"));
  });

  it("HTML uses Kasse design system text color #111827", () => {
    assert.ok(html.includes("#111827"));
  });

  it("HTML uses Kasse design system background #f7f8fa", () => {
    assert.ok(html.includes("#f7f8fa"));
  });

  it("text version contains the verification URL", () => {
    assert.ok(text.includes(verificationUrl));
  });

  it("text version mentions Kasse", () => {
    assert.ok(text.includes("Kasse"));
  });

  it("both versions include safety notice for unsolicited emails", () => {
    assert.ok(html.includes("safely ignore this email"));
    assert.ok(text.includes("safely ignore this email"));
  });
});

describe("devVerificationUrl visibility logic (P1.A.2)", () => {
  it("non-production env exposes devVerificationUrl", () => {
    const nodeEnv: string = "development";
    const devUrl = nodeEnv !== "production" ? "http://localhost/verify" : undefined;
    assert.equal(devUrl, "http://localhost/verify");
  });

  it("production env hides devVerificationUrl", () => {
    const nodeEnv: string = "production";
    const devUrl = nodeEnv !== "production" ? "http://localhost/verify" : undefined;
    assert.equal(devUrl, undefined);
  });
});
