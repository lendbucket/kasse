import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateValue, CustomFieldValidationError } from "@/lib/custom-fields/validate";
import type { ValidationRules } from "@/lib/custom-fields/types";

/**
 * Value-level tests that complement the validate.test.ts suite.
 * These focus on the upsert/batch contract documented in values.ts.
 *
 * NOTE: The setValue/setValues/getValues/deleteValue functions depend on
 * a real Prisma transaction client. These are integration tests by nature.
 * Here we test the validation layer that runs before any DB write, which
 * is the unit-testable boundary.
 */

describe("CustomFieldValue — validation before write (P0.I.1)", () => {
  it("TEXT value validates and normalizes to { text } shape", () => {
    const r = validateValue({ fieldType: "TEXT", rules: {}, value: "hello", fieldName: "f" });
    assert.deepEqual(r, { text: "hello" });
  });

  it("NUMBER value validates and normalizes to { number } shape", () => {
    const r = validateValue({ fieldType: "NUMBER", rules: {}, value: 42, fieldName: "f" });
    assert.deepEqual(r, { number: 42 });
  });

  it("BOOLEAN value validates and normalizes to { boolean } shape", () => {
    const r = validateValue({ fieldType: "BOOLEAN", rules: {}, value: false, fieldName: "f" });
    assert.deepEqual(r, { boolean: false });
  });

  it("SELECT value validates against options", () => {
    const rules: ValidationRules = {
      options: [{ value: "opt1", label: "Option 1" }],
    };
    const r = validateValue({ fieldType: "SELECT", rules, value: "opt1", fieldName: "f" });
    assert.deepEqual(r, { selected: "opt1" });
  });

  it("SELECT rejects unknown option", () => {
    const rules: ValidationRules = {
      options: [{ value: "opt1", label: "Option 1" }],
    };
    assert.throws(
      () => validateValue({ fieldType: "SELECT", rules, value: "unknown", fieldName: "f" }),
      CustomFieldValidationError
    );
  });

  it("MULTI_SELECT validates all options and deduplicates", () => {
    const rules: ValidationRules = {
      options: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    };
    const r = validateValue({ fieldType: "MULTI_SELECT", rules, value: ["a", "b", "a"], fieldName: "f" });
    assert.deepEqual(r, { selected: ["a", "b"] });
  });

  it("required field rejects null", () => {
    assert.throws(
      () => validateValue({ fieldType: "TEXT", rules: {}, value: null, fieldName: "f" }),
      CustomFieldValidationError
    );
  });

  it("DATE validates format strictly", () => {
    assert.throws(
      () => validateValue({ fieldType: "DATE", rules: {}, value: "May 18, 2026", fieldName: "f" }),
      CustomFieldValidationError
    );
  });
});

describe("CustomFieldValue — batch validation contract (P0.I.1)", () => {
  it("validates each field type independently — mixed batch", () => {
    // Simulate what setValues does: validate each key's value against its definition
    const fields = [
      { fieldType: "TEXT" as const, rules: {}, value: "hello", fieldName: "name" },
      { fieldType: "NUMBER" as const, rules: { min: 0 }, value: 5, fieldName: "age" },
      { fieldType: "BOOLEAN" as const, rules: {}, value: true, fieldName: "active" },
    ];
    const results = fields.map(f => validateValue(f));
    assert.equal(results.length, 3);
    assert.deepEqual(results[0], { text: "hello" });
    assert.deepEqual(results[1], { number: 5 });
    assert.deepEqual(results[2], { boolean: true });
  });

  it("fails on first invalid field in batch", () => {
    const fields = [
      { fieldType: "TEXT" as const, rules: {}, value: "ok", fieldName: "name" },
      { fieldType: "NUMBER" as const, rules: { min: 10 }, value: 5, fieldName: "age" },
    ];
    // First passes, second fails
    validateValue(fields[0]);
    assert.throws(
      () => validateValue(fields[1]),
      (e: unknown) => e instanceof CustomFieldValidationError && e.field === "age"
    );
  });
});
