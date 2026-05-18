import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateValue, CustomFieldValidationError } from "@/lib/custom-fields/validate";
import type { ValidationRules } from "@/lib/custom-fields/types";

// Helper: assert validation throws
function assertThrows(fn: () => void, field: string, msgFragment?: string) {
  try {
    fn();
    assert.fail("expected CustomFieldValidationError");
  } catch (e) {
    assert.ok(e instanceof CustomFieldValidationError, `expected CustomFieldValidationError, got ${e}`);
    assert.equal(e.field, field);
    if (msgFragment) assert.ok(e.message.includes(msgFragment), `message "${e.message}" should include "${msgFragment}"`);
  }
}

describe("validateValue — TEXT/TEXTAREA", () => {
  it("accepts raw string", () => {
    const r = validateValue({ fieldType: "TEXT", rules: {}, value: "hello", fieldName: "f" });
    assert.deepEqual(r, { text: "hello" });
  });

  it("accepts wrapped { text } shape", () => {
    const r = validateValue({ fieldType: "TEXTAREA", rules: {}, value: { text: "wrapped" }, fieldName: "f" });
    assert.deepEqual(r, { text: "wrapped" });
  });

  it("enforces minLength", () => {
    assertThrows(
      () => validateValue({ fieldType: "TEXT", rules: { minLength: 5 }, value: "ab", fieldName: "f" }),
      "f", "minimum length"
    );
  });

  it("enforces maxLength", () => {
    assertThrows(
      () => validateValue({ fieldType: "TEXT", rules: { maxLength: 3 }, value: "toolong", fieldName: "f" }),
      "f", "maximum length"
    );
  });

  it("enforces pattern", () => {
    assertThrows(
      () => validateValue({ fieldType: "TEXT", rules: { pattern: "^[A-Z]+$" }, value: "lowercase", fieldName: "f" }),
      "f", "pattern"
    );
  });

  it("passes pattern when matched", () => {
    const r = validateValue({ fieldType: "TEXT", rules: { pattern: "^[A-Z]+$" }, value: "UPPER", fieldName: "f" });
    assert.deepEqual(r, { text: "UPPER" });
  });

  it("throws CustomFieldValidationError (not SyntaxError) for malformed regex", () => {
    assertThrows(
      () => validateValue({ fieldType: "TEXT", rules: { pattern: "[invalid(" }, value: "test", fieldName: "f" }),
      "f", "invalid pattern"
    );
  });

  it("rejects non-string", () => {
    assertThrows(
      () => validateValue({ fieldType: "TEXT", rules: {}, value: 42, fieldName: "f" }),
      "f", "string"
    );
  });
});

describe("validateValue — NUMBER", () => {
  it("accepts raw number", () => {
    const r = validateValue({ fieldType: "NUMBER", rules: {}, value: 42, fieldName: "n" });
    assert.deepEqual(r, { number: 42 });
  });

  it("accepts wrapped { number } shape", () => {
    const r = validateValue({ fieldType: "NUMBER", rules: {}, value: { number: 3.14 }, fieldName: "n" });
    assert.deepEqual(r, { number: 3.14 });
  });

  it("coerces string to number", () => {
    const r = validateValue({ fieldType: "NUMBER", rules: {}, value: "99.5", fieldName: "n" });
    assert.deepEqual(r, { number: 99.5 });
  });

  it("enforces integer flag", () => {
    assertThrows(
      () => validateValue({ fieldType: "NUMBER", rules: { integer: true }, value: 3.5, fieldName: "n" }),
      "n", "integer"
    );
  });

  it("enforces min", () => {
    assertThrows(
      () => validateValue({ fieldType: "NUMBER", rules: { min: 10 }, value: 5, fieldName: "n" }),
      "n", "minimum"
    );
  });

  it("enforces max", () => {
    assertThrows(
      () => validateValue({ fieldType: "NUMBER", rules: { max: 100 }, value: 150, fieldName: "n" }),
      "n", "maximum"
    );
  });

  it("rejects NaN", () => {
    assertThrows(
      () => validateValue({ fieldType: "NUMBER", rules: {}, value: "not-a-number", fieldName: "n" }),
      "n", "finite number"
    );
  });

  it("rejects Infinity", () => {
    assertThrows(
      () => validateValue({ fieldType: "NUMBER", rules: {}, value: Infinity, fieldName: "n" }),
      "n", "finite number"
    );
  });
});

describe("validateValue — DATE", () => {
  it("accepts valid YYYY-MM-DD", () => {
    const r = validateValue({ fieldType: "DATE", rules: {}, value: "2026-05-18", fieldName: "d" });
    assert.deepEqual(r, { date: "2026-05-18" });
  });

  it("accepts wrapped { date } shape", () => {
    const r = validateValue({ fieldType: "DATE", rules: {}, value: { date: "2026-01-01" }, fieldName: "d" });
    assert.deepEqual(r, { date: "2026-01-01" });
  });

  it("rejects wrong format", () => {
    assertThrows(
      () => validateValue({ fieldType: "DATE", rules: {}, value: "05/18/2026", fieldName: "d" }),
      "d", "YYYY-MM-DD"
    );
  });

  it("enforces minDate", () => {
    assertThrows(
      () => validateValue({ fieldType: "DATE", rules: { minDate: "2026-06-01" }, value: "2026-05-01", fieldName: "d" }),
      "d", "earliest"
    );
  });

  it("enforces maxDate", () => {
    assertThrows(
      () => validateValue({ fieldType: "DATE", rules: { maxDate: "2026-01-01" }, value: "2026-12-31", fieldName: "d" }),
      "d", "latest"
    );
  });
});

describe("validateValue — DATETIME", () => {
  it("accepts valid ISO 8601", () => {
    const r = validateValue({ fieldType: "DATETIME", rules: {}, value: "2026-05-18T14:30:00Z", fieldName: "dt" });
    assert.ok("datetime" in r);
  });

  it("accepts wrapped { datetime } shape", () => {
    const r = validateValue({ fieldType: "DATETIME", rules: {}, value: { datetime: "2026-05-18T00:00:00Z" }, fieldName: "dt" });
    assert.ok("datetime" in r);
  });

  it("rejects invalid datetime", () => {
    assertThrows(
      () => validateValue({ fieldType: "DATETIME", rules: {}, value: "not-a-date", fieldName: "dt" }),
      "dt", "valid datetime"
    );
  });

  it("enforces minDate", () => {
    assertThrows(
      () => validateValue({
        fieldType: "DATETIME",
        rules: { minDate: "2026-06-01T00:00:00Z" },
        value: "2026-05-01T00:00:00Z",
        fieldName: "dt",
      }),
      "dt", "earliest"
    );
  });
});

describe("validateValue — BOOLEAN", () => {
  it("accepts raw boolean true", () => {
    assert.deepEqual(
      validateValue({ fieldType: "BOOLEAN", rules: {}, value: true, fieldName: "b" }),
      { boolean: true }
    );
  });

  it("accepts wrapped { boolean } shape", () => {
    assert.deepEqual(
      validateValue({ fieldType: "BOOLEAN", rules: {}, value: { boolean: false }, fieldName: "b" }),
      { boolean: false }
    );
  });

  it("rejects non-boolean", () => {
    assertThrows(
      () => validateValue({ fieldType: "BOOLEAN", rules: {}, value: "yes", fieldName: "b" }),
      "b", "boolean"
    );
  });
});

describe("validateValue — SELECT", () => {
  const rules: ValidationRules = {
    options: [
      { value: "red", label: "Red" },
      { value: "blue", label: "Blue" },
    ],
  };

  it("accepts valid option", () => {
    assert.deepEqual(
      validateValue({ fieldType: "SELECT", rules, value: "red", fieldName: "s" }),
      { selected: "red" }
    );
  });

  it("accepts wrapped { selected } shape", () => {
    assert.deepEqual(
      validateValue({ fieldType: "SELECT", rules, value: { selected: "blue" }, fieldName: "s" }),
      { selected: "blue" }
    );
  });

  it("rejects invalid option", () => {
    assertThrows(
      () => validateValue({ fieldType: "SELECT", rules, value: "green", fieldName: "s" }),
      "s", "not a valid option"
    );
  });

  it("rejects when no options defined", () => {
    assertThrows(
      () => validateValue({ fieldType: "SELECT", rules: {}, value: "red", fieldName: "s" }),
      "s", "no options"
    );
  });
});

describe("validateValue — MULTI_SELECT", () => {
  const rules: ValidationRules = {
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
      { value: "c", label: "C" },
    ],
  };

  it("accepts valid array", () => {
    const r = validateValue({ fieldType: "MULTI_SELECT", rules, value: ["a", "b"], fieldName: "ms" });
    assert.deepEqual(r, { selected: ["a", "b"] });
  });

  it("accepts wrapped { selected } shape", () => {
    const r = validateValue({ fieldType: "MULTI_SELECT", rules, value: { selected: ["c"] }, fieldName: "ms" });
    assert.deepEqual(r, { selected: ["c"] });
  });

  it("deduplicates values", () => {
    const r = validateValue({ fieldType: "MULTI_SELECT", rules, value: ["a", "a", "b"], fieldName: "ms" });
    assert.deepEqual(r, { selected: ["a", "b"] });
  });

  it("rejects invalid option in array", () => {
    assertThrows(
      () => validateValue({ fieldType: "MULTI_SELECT", rules, value: ["a", "x"], fieldName: "ms" }),
      "ms", "not a valid option"
    );
  });

  it("enforces minSelections", () => {
    assertThrows(
      () => validateValue({ fieldType: "MULTI_SELECT", rules: { ...rules, minSelections: 2 }, value: ["a"], fieldName: "ms" }),
      "ms", "at least"
    );
  });

  it("enforces maxSelections", () => {
    assertThrows(
      () => validateValue({ fieldType: "MULTI_SELECT", rules: { ...rules, maxSelections: 1 }, value: ["a", "b"], fieldName: "ms" }),
      "ms", "at most"
    );
  });
});

describe("validateValue — URL", () => {
  it("accepts valid URL", () => {
    const r = validateValue({ fieldType: "URL", rules: {}, value: "https://example.com", fieldName: "u" });
    assert.deepEqual(r, { text: "https://example.com" });
  });

  it("rejects invalid URL", () => {
    assertThrows(
      () => validateValue({ fieldType: "URL", rules: {}, value: "not a url", fieldName: "u" }),
      "u", "valid URL"
    );
  });
});

describe("validateValue — EMAIL", () => {
  it("accepts valid email", () => {
    const r = validateValue({ fieldType: "EMAIL", rules: {}, value: "a@b.com", fieldName: "e" });
    assert.deepEqual(r, { text: "a@b.com" });
  });

  it("rejects invalid email", () => {
    assertThrows(
      () => validateValue({ fieldType: "EMAIL", rules: {}, value: "notanemail", fieldName: "e" }),
      "e", "valid email"
    );
  });
});

describe("validateValue — PHONE", () => {
  it("accepts valid phone", () => {
    const r = validateValue({ fieldType: "PHONE", rules: {}, value: "+1 (555) 123-4567", fieldName: "p" });
    assert.deepEqual(r, { text: "+1 (555) 123-4567" });
  });

  it("rejects too-short phone", () => {
    assertThrows(
      () => validateValue({ fieldType: "PHONE", rules: {}, value: "123", fieldName: "p" }),
      "p", "valid phone"
    );
  });
});

describe("validateValue — null/undefined", () => {
  it("rejects null value", () => {
    assertThrows(
      () => validateValue({ fieldType: "TEXT", rules: {}, value: null, fieldName: "f" }),
      "f", "required"
    );
  });

  it("rejects undefined value", () => {
    assertThrows(
      () => validateValue({ fieldType: "TEXT", rules: {}, value: undefined, fieldName: "f" }),
      "f", "required"
    );
  });
});
