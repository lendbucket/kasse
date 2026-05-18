import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDate,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/i18n/format";

describe("formatCurrency (P0.H.3)", () => {
  it("formats USD with en-US locale", () => {
    assert.equal(formatCurrency(2900, "en-US"), "$29.00");
    assert.equal(formatCurrency(0, "en-US"), "$0.00");
    assert.equal(formatCurrency(12345, "en-US"), "$123.45");
  });

  it("formats USD with es-MX locale", () => {
    const result = formatCurrency(2900, "es-MX");
    // es-MX uses different formatting but should contain 29
    assert.ok(result.includes("29"), `Expected '29' in '${result}'`);
  });

  it("handles negative amounts (refunds)", () => {
    assert.equal(formatCurrency(-2900, "en-US"), "-$29.00");
  });

  it("rounds cents correctly at boundary", () => {
    assert.equal(formatCurrency(1, "en-US"), "$0.01");
    assert.equal(formatCurrency(99, "en-US"), "$0.99");
    assert.equal(formatCurrency(100, "en-US"), "$1.00");
  });
});

describe("formatNumber (P0.H.3)", () => {
  it("formats with thousand separators in en-US", () => {
    assert.equal(formatNumber(1000, "en-US"), "1,000");
    assert.equal(formatNumber(1234567, "en-US"), "1,234,567");
  });

  it("formats small numbers without separator", () => {
    assert.equal(formatNumber(42, "en-US"), "42");
  });
});

describe("formatRelativeTime (P0.H.3)", () => {
  it("formats past times in English", () => {
    const now = new Date("2026-05-18T12:00:00Z");
    const past = new Date("2026-05-18T11:00:00Z");
    const result = formatRelativeTime(past, "en-US", now);
    assert.ok(result.match(/hour/i), `Expected 'hour' in '${result}'`);
  });

  it("formats future times", () => {
    const now = new Date("2026-05-18T12:00:00Z");
    const future = new Date("2026-05-18T13:00:00Z");
    const result = formatRelativeTime(future, "en-US", now);
    assert.ok(result.match(/hour/i), `Expected 'hour' in '${result}'`);
  });

  it("handles yesterday boundary", () => {
    const now = new Date("2026-05-18T12:00:00Z");
    const yesterday = new Date("2026-05-17T12:00:00Z");
    const result = formatRelativeTime(yesterday, "en-US", now);
    assert.ok(
      result.match(/yesterday|1 day ago/i),
      `Expected 'yesterday' or '1 day ago' in '${result}'`,
    );
  });

  it("formats minutes", () => {
    const now = new Date("2026-05-18T12:00:00Z");
    const past = new Date("2026-05-18T11:30:00Z");
    const result = formatRelativeTime(past, "en-US", now);
    assert.ok(result.match(/minute/i), `Expected 'minute' in '${result}'`);
  });
});

describe("formatDate (P0.H.3)", () => {
  it("formats with default short month in en-US", () => {
    const result = formatDate(new Date("2026-05-18T00:00:00Z"), "en-US");
    assert.ok(result.match(/May/), `Expected 'May' in '${result}'`);
    assert.ok(result.match(/2026/), `Expected '2026' in '${result}'`);
  });

  it("respects custom options", () => {
    const result = formatDate(new Date("2026-05-18T00:00:00Z"), "en-US", {
      year: "numeric",
      month: "long",
    });
    assert.ok(result.match(/May/), `Expected 'May' in '${result}'`);
    assert.ok(result.match(/2026/), `Expected '2026' in '${result}'`);
  });

  it("accepts string dates", () => {
    const result = formatDate("2026-05-18T00:00:00Z", "en-US");
    assert.ok(result.match(/2026/), `Expected '2026' in '${result}'`);
  });

  it("accepts timestamps", () => {
    const ts = new Date("2026-05-18T00:00:00Z").getTime();
    const result = formatDate(ts, "en-US");
    assert.ok(result.match(/2026/), `Expected '2026' in '${result}'`);
  });
});
