import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRequestLogger } from "@/lib/observability/logger";

describe("getRequestLogger (P0.H.1)", () => {
  it("returns a logger with request context bound", () => {
    const log = getRequestLogger({
      requestId: "req-123",
      organizationId: "org-abc",
      userId: "user-xyz",
    });

    // Pino child loggers have a bindings() method
    const bindings = log.bindings();
    assert.equal(bindings.requestId, "req-123");
    assert.equal(bindings.organizationId, "org-abc");
    assert.equal(bindings.userId, "user-xyz");
  });

  it("omits optional fields when not provided", () => {
    const log = getRequestLogger({ requestId: "req-456" });
    const bindings = log.bindings();
    assert.equal(bindings.requestId, "req-456");
    assert.equal(bindings.organizationId, undefined);
    assert.equal(bindings.userId, undefined);
  });

  it("accepts null for optional fields (treats as not provided)", () => {
    const log = getRequestLogger({
      requestId: "req-789",
      organizationId: null,
      userId: null,
    });
    const bindings = log.bindings();
    assert.equal(bindings.organizationId, undefined);
    assert.equal(bindings.userId, undefined);
  });

  it("includes path and method when provided", () => {
    const log = getRequestLogger({
      requestId: "req-999",
      path: "/api/test",
      method: "POST",
    });
    const bindings = log.bindings();
    assert.equal(bindings.path, "/api/test");
    assert.equal(bindings.method, "POST");
  });
});
