import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  VALID_SLUG_PATTERN,
  VALID_COLOR_PATTERN,
  MAX_NAME_LENGTH,
  DEFAULT_TAG_COLOR,
  VALID_TAG_TARGET_ENTITIES,
} from "@/lib/tags/types";

describe("Tag slug validation (P0.I.2)", () => {
  it("accepts valid kebab-case slug", () => {
    assert.ok(VALID_SLUG_PATTERN.test("vip"));
    assert.ok(VALID_SLUG_PATTERN.test("color-specialist"));
    assert.ok(VALID_SLUG_PATTERN.test("out-of-stock"));
    assert.ok(VALID_SLUG_PATTERN.test("a1"));
    assert.ok(VALID_SLUG_PATTERN.test("123"));
  });

  it("rejects slug starting with hyphen", () => {
    assert.ok(!VALID_SLUG_PATTERN.test("-invalid"));
  });

  it("rejects uppercase letters", () => {
    assert.ok(!VALID_SLUG_PATTERN.test("VIP"));
    assert.ok(!VALID_SLUG_PATTERN.test("Color-Specialist"));
  });

  it("rejects spaces", () => {
    assert.ok(!VALID_SLUG_PATTERN.test("has space"));
  });

  it("rejects underscores", () => {
    assert.ok(!VALID_SLUG_PATTERN.test("under_score"));
  });

  it("rejects empty string", () => {
    assert.ok(!VALID_SLUG_PATTERN.test(""));
  });

  it("rejects slug longer than 64 chars", () => {
    const longSlug = "a" + "-b".repeat(32); // 65 chars
    assert.ok(!VALID_SLUG_PATTERN.test(longSlug));
  });

  it("accepts slug exactly 64 chars", () => {
    // 'a' + 63 more chars = 64 total
    const slug64 = "a" + "b".repeat(63);
    assert.ok(VALID_SLUG_PATTERN.test(slug64));
  });
});

describe("Tag color validation (P0.I.2)", () => {
  it("accepts valid 6-char hex color", () => {
    assert.ok(VALID_COLOR_PATTERN.test("#FF0000"));
    assert.ok(VALID_COLOR_PATTERN.test("#606E74"));
    assert.ok(VALID_COLOR_PATTERN.test("#ffffff"));
    assert.ok(VALID_COLOR_PATTERN.test("#C9A84c"));
  });

  it("rejects 3-char hex shorthand", () => {
    assert.ok(!VALID_COLOR_PATTERN.test("#FFF"));
  });

  it("rejects missing hash", () => {
    assert.ok(!VALID_COLOR_PATTERN.test("606E74"));
  });

  it("rejects 8-char hex (with alpha)", () => {
    assert.ok(!VALID_COLOR_PATTERN.test("#FF0000FF"));
  });

  it("rejects non-hex chars", () => {
    assert.ok(!VALID_COLOR_PATTERN.test("#GGHHII"));
  });

  it("default tag color is valid", () => {
    assert.ok(VALID_COLOR_PATTERN.test(DEFAULT_TAG_COLOR));
    assert.equal(DEFAULT_TAG_COLOR, "#606E74");
  });
});

describe("Tag name validation (P0.I.2)", () => {
  it("MAX_NAME_LENGTH is 50", () => {
    assert.equal(MAX_NAME_LENGTH, 50);
  });
});

describe("Tag target entities (P0.I.2)", () => {
  it("contains exactly 5 entities matching custom fields", () => {
    assert.equal(VALID_TAG_TARGET_ENTITIES.length, 5);
    assert.ok(VALID_TAG_TARGET_ENTITIES.includes("CLIENT"));
    assert.ok(VALID_TAG_TARGET_ENTITIES.includes("SERVICE"));
    assert.ok(VALID_TAG_TARGET_ENTITIES.includes("APPOINTMENT"));
    assert.ok(VALID_TAG_TARGET_ENTITIES.includes("STAFF"));
    assert.ok(VALID_TAG_TARGET_ENTITIES.includes("PRODUCT"));
  });
});
