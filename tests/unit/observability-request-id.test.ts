import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getRequestId,
  REQUEST_ID_HEADER,
} from "@/lib/observability/request-id";

describe("getRequestId (P0.H.1)", () => {
  it("returns the incoming request ID when valid", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { [REQUEST_ID_HEADER]: "abc-123-def-456" },
    });
    assert.equal(getRequestId(req), "abc-123-def-456");
  });

  it("generates a fresh UUID when no header present", () => {
    const req = new Request("http://localhost/api/test");
    const id = getRequestId(req);
    assert.match(
      id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("rejects oversize IDs and generates fresh", () => {
    const longId = "a".repeat(200);
    const req = new Request("http://localhost/api/test", {
      headers: { [REQUEST_ID_HEADER]: longId },
    });
    const id = getRequestId(req);
    assert.notEqual(id, longId);
    assert.ok(id.length < 128);
  });

  it("rejects IDs with special characters", () => {
    const badId = "abc;DROP TABLE users";
    const req = new Request("http://localhost/api/test", {
      headers: { [REQUEST_ID_HEADER]: badId },
    });
    const id = getRequestId(req);
    assert.notEqual(id, badId);
  });

  it("rejects empty string IDs", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { [REQUEST_ID_HEADER]: "" },
    });
    const id = getRequestId(req);
    assert.notEqual(id, "");
    assert.ok(id.length > 0);
  });

  it("accepts hex IDs from CDN-style request IDs", () => {
    const cdnId = "a1b2c3d4e5f6";
    const req = new Request("http://localhost/api/test", {
      headers: { [REQUEST_ID_HEADER]: cdnId },
    });
    assert.equal(getRequestId(req), cdnId);
  });

  it("accepts underscore-separated IDs", () => {
    const id = "req_abc_123";
    const req = new Request("http://localhost/api/test", {
      headers: { [REQUEST_ID_HEADER]: id },
    });
    assert.equal(getRequestId(req), id);
  });
});
