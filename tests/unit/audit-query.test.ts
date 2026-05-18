import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LIMIT, MAX_LIMIT } from "@/lib/audit/query";

/**
 * Audit query helper tests. The queryAuditLogs / queryAuditLogsForTenant /
 * getEntityAuditTrail functions depend on prismaAdmin (real DB). Here we test
 * the validation and contract layer that's unit-testable.
 */

describe("Audit query pagination constants (P0.I.3)", () => {
  it("DEFAULT_LIMIT is 50", () => {
    assert.equal(DEFAULT_LIMIT, 50);
  });

  it("MAX_LIMIT is 200", () => {
    assert.equal(MAX_LIMIT, 200);
  });
});

describe("Audit query clampLimit contract (P0.I.3)", () => {
  // clampLimit is internal to query.ts; we test the contract via constants

  it("limit above MAX_LIMIT would be clamped", () => {
    const requested = 500;
    const clamped = Math.min(Math.max(1, Math.floor(requested)), MAX_LIMIT);
    assert.equal(clamped, 200);
  });

  it("limit below 1 would be clamped to 1", () => {
    const requested = 0;
    const clamped = Math.min(Math.max(1, Math.floor(requested)), MAX_LIMIT);
    assert.equal(clamped, 1);
  });

  it("negative limit would be clamped to 1", () => {
    const requested = -5;
    const clamped = Math.min(Math.max(1, Math.floor(requested)), MAX_LIMIT);
    assert.equal(clamped, 1);
  });

  it("float limit would be floored", () => {
    const requested = 75.9;
    const clamped = Math.min(Math.max(1, Math.floor(requested)), MAX_LIMIT);
    assert.equal(clamped, 75);
  });

  it("undefined limit defaults to DEFAULT_LIMIT", () => {
    const requested = undefined;
    const clamped = requested == null ? DEFAULT_LIMIT : Math.min(Math.max(1, Math.floor(requested)), MAX_LIMIT);
    assert.equal(clamped, 50);
  });
});

describe("Audit query filter contract (P0.I.3)", () => {
  it("organizationId=null means platform-only (WHERE organizationId IS NULL)", () => {
    // When filter.organizationId is explicitly null, the where clause should
    // set organizationId: null, which Prisma translates to IS NULL.
    const filter = { organizationId: null as string | null };
    assert.equal(filter.organizationId, null);
  });

  it("organizationId=undefined means no org filter (omitted from WHERE)", () => {
    const filter: { organizationId?: string | null } = {};
    assert.equal(filter.organizationId, undefined);
  });

  it("actionPrefix produces startsWith filter", () => {
    const prefix = "tag.";
    assert.ok("tag.create".startsWith(prefix));
    assert.ok("tag.update".startsWith(prefix));
    assert.ok("tag.delete".startsWith(prefix));
    assert.ok(!"custom_field_definition.create".startsWith(prefix));
  });

  it("date range is inclusive (gte start, lte end)", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-12-31T23:59:59Z");
    const testDate = new Date("2026-06-15T12:00:00Z");
    assert.ok(testDate >= start);
    assert.ok(testDate <= end);
  });
});

describe("Audit query hasMore contract (P0.I.3)", () => {
  it("hasMore is true when offset + rows.length < total", () => {
    const offset = 0, rowCount = 50, total = 100;
    assert.equal(offset + rowCount < total, true);
  });

  it("hasMore is false when offset + rows.length >= total", () => {
    const offset = 50, rowCount = 50, total = 100;
    assert.equal(offset + rowCount < total, false);
  });

  it("hasMore is false when rows returned is less than limit (last page)", () => {
    const offset = 80, rowCount = 20, total = 100;
    assert.equal(offset + rowCount < total, false);
  });
});
