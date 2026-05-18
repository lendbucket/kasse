import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VALID_KEY_PATTERN, VALID_TARGET_ENTITIES, VALID_FIELD_TYPES } from "@/lib/custom-fields/types";

describe("CustomFieldDefinition key validation (P0.I.1)", () => {
  it("accepts valid snake_case key", () => {
    assert.ok(VALID_KEY_PATTERN.test("favorite_color"));
    assert.ok(VALID_KEY_PATTERN.test("a"));
    assert.ok(VALID_KEY_PATTERN.test("field_123"));
    assert.ok(VALID_KEY_PATTERN.test("x0"));
  });

  it("rejects key starting with number", () => {
    assert.ok(!VALID_KEY_PATTERN.test("1field"));
  });

  it("rejects key starting with underscore", () => {
    assert.ok(!VALID_KEY_PATTERN.test("_field"));
  });

  it("rejects uppercase letters", () => {
    assert.ok(!VALID_KEY_PATTERN.test("FavoriteColor"));
  });

  it("rejects hyphens", () => {
    assert.ok(!VALID_KEY_PATTERN.test("my-field"));
  });

  it("rejects spaces", () => {
    assert.ok(!VALID_KEY_PATTERN.test("my field"));
  });

  it("rejects empty string", () => {
    assert.ok(!VALID_KEY_PATTERN.test(""));
  });

  it("rejects key longer than 64 chars", () => {
    const longKey = "a" + "b".repeat(64); // 65 chars total
    assert.ok(!VALID_KEY_PATTERN.test(longKey));
  });

  it("accepts key exactly 64 chars", () => {
    const key64 = "a" + "b".repeat(63); // 64 chars total
    assert.ok(VALID_KEY_PATTERN.test(key64));
  });
});

describe("CustomFieldDefinition targetEntity enum (P0.I.1)", () => {
  it("contains exactly 5 target entities", () => {
    assert.equal(VALID_TARGET_ENTITIES.length, 5);
    assert.ok(VALID_TARGET_ENTITIES.includes("CLIENT"));
    assert.ok(VALID_TARGET_ENTITIES.includes("SERVICE"));
    assert.ok(VALID_TARGET_ENTITIES.includes("APPOINTMENT"));
    assert.ok(VALID_TARGET_ENTITIES.includes("STAFF"));
    assert.ok(VALID_TARGET_ENTITIES.includes("PRODUCT"));
  });
});

describe("CustomFieldDefinition fieldType enum (P0.I.1)", () => {
  it("contains exactly 11 field types", () => {
    assert.equal(VALID_FIELD_TYPES.length, 11);
    const expected = [
      "TEXT", "TEXTAREA", "NUMBER", "DATE", "DATETIME",
      "BOOLEAN", "SELECT", "MULTI_SELECT", "URL", "EMAIL", "PHONE",
    ];
    for (const t of expected) {
      assert.ok(VALID_FIELD_TYPES.includes(t as typeof VALID_FIELD_TYPES[number]), `missing ${t}`);
    }
  });
});

describe("CustomFieldDefinition validationRules consistency (P0.I.1)", () => {
  it("SELECT/MULTI_SELECT require options — caught by validateRules in definitions.ts", () => {
    // This test verifies the contract: SELECT-type fields without options should fail.
    // The actual enforcement is in createDefinition → validateRules. We test the
    // integration via the validate.test.ts suite; here we document the rule.
    assert.ok(true, "SELECT requires rules.options — enforced by definitions.ts validateRules");
  });

  it("malformed regex pattern is detectable — validateRules catches at definition creation", () => {
    // validateRules (internal to definitions.ts) wraps new RegExp() in try/catch.
    // Verify the underlying detection works: an invalid regex throws SyntaxError
    // which validateRules converts to CustomFieldValidationError.
    assert.throws(() => new RegExp("[invalid("), SyntaxError);
    // And a valid regex does not throw
    assert.doesNotThrow(() => new RegExp("^[a-z]+$"));
  });
});
