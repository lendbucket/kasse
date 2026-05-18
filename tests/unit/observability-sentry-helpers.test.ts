import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  setSentryTenantContext,
  captureException,
} from "@/lib/observability/sentry-helpers";

/**
 * These tests verify the sentry-helpers module exports the expected functions
 * with correct signatures. Full integration testing (verifying Sentry scope
 * mutations) requires a running Sentry instance — those are covered by the
 * production verification steps in docs/OBSERVABILITY.md.
 *
 * We validate:
 * 1. Functions exist and are callable
 * 2. They don't throw when called with valid arguments
 * 3. They accept all documented parameter shapes
 */

describe("setSentryTenantContext (P0.H.1)", () => {
  it("is a function", () => {
    assert.equal(typeof setSentryTenantContext, "function");
  });

  it("does not throw with required args", () => {
    assert.doesNotThrow(() => {
      setSentryTenantContext({
        organizationId: "org-1",
        requestId: "req-1",
      });
    });
  });

  it("does not throw with all args including userId", () => {
    assert.doesNotThrow(() => {
      setSentryTenantContext({
        organizationId: "org-1",
        userId: "user-1",
        requestId: "req-1",
      });
    });
  });

  it("does not throw when userId is null", () => {
    assert.doesNotThrow(() => {
      setSentryTenantContext({
        organizationId: "org-1",
        userId: null,
        requestId: "req-1",
      });
    });
  });
});

describe("captureException (P0.H.1)", () => {
  it("is a function", () => {
    assert.equal(typeof captureException, "function");
  });

  it("does not throw with full context", () => {
    assert.doesNotThrow(() => {
      captureException(new Error("test error"), {
        requestId: "req-1",
        organizationId: "org-1",
        userId: "user-1",
        extra: { foo: "bar" },
      });
    });
  });

  it("does not throw with minimal context", () => {
    assert.doesNotThrow(() => {
      captureException(new Error("test"), { requestId: "req-2" });
    });
  });

  it("handles non-Error values", () => {
    assert.doesNotThrow(() => {
      captureException("string error", { requestId: "req-3" });
    });
  });
});
