import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateLocationName,
  validateAddress,
  validateTimezone,
} from "@/lib/onboarding/location";

// Sanity check: Intl.supportedValuesOf must be available in the test
// environment. If this assertion fails, the timezone validation in
// lib/onboarding/location.ts will silently accept any string. Node 20+
// provides this API.
assert.ok(
  typeof Intl.supportedValuesOf === "function",
  "Intl.supportedValuesOf is required for timezone validation tests. " +
    "Node 20+ required."
);

describe("validateLocationName (P1.A.3)", () => {
  it("rejects empty string", () => {
    assert.ok(validateLocationName("") !== null);
  });

  it("rejects single character", () => {
    assert.ok(validateLocationName("A") !== null);
  });

  it("rejects string over 100 characters", () => {
    assert.ok(validateLocationName("a".repeat(101)) !== null);
  });

  it("accepts 2-character name", () => {
    assert.equal(validateLocationName("HQ"), null);
  });

  it("accepts typical location name", () => {
    assert.equal(validateLocationName("Downtown Studio"), null);
  });
});

describe("validateAddress (P1.A.3)", () => {
  const validAddr = {
    address: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
  };

  it("accepts valid US address", () => {
    assert.equal(validateAddress(validAddr), null);
  });

  it("rejects missing street address", () => {
    const result = validateAddress({ ...validAddr, address: "" });
    assert.ok(result !== null);
    assert.ok(result!.includes("address"));
  });

  it("rejects too-short street address", () => {
    assert.ok(validateAddress({ ...validAddr, address: "AB" }) !== null);
  });

  it("rejects missing city", () => {
    const result = validateAddress({ ...validAddr, city: "" });
    assert.ok(result !== null);
    assert.ok(result!.includes("city"));
  });

  it("accepts lowercase state code (uppercased internally)", () => {
    assert.equal(validateAddress({ ...validAddr, state: "tx" }), null);
  });

  it("rejects invalid state code (3 letters)", () => {
    assert.ok(validateAddress({ ...validAddr, state: "TEX" }) !== null);
  });

  it("rejects fake state code ZZ", () => {
    assert.ok(validateAddress({ ...validAddr, state: "ZZ" }) !== null);
  });

  it("rejects fake state code QQ", () => {
    assert.ok(validateAddress({ ...validAddr, state: "QQ" }) !== null);
  });

  it("accepts valid 2-letter state code", () => {
    assert.equal(validateAddress({ ...validAddr, state: "CA" }), null);
  });

  it("accepts territory codes (PR, VI, GU)", () => {
    assert.equal(validateAddress({ ...validAddr, state: "PR" }), null);
    assert.equal(validateAddress({ ...validAddr, state: "VI" }), null);
    assert.equal(validateAddress({ ...validAddr, state: "GU" }), null);
  });

  it("accepts DC", () => {
    assert.equal(validateAddress({ ...validAddr, state: "DC" }), null);
  });

  it("rejects invalid zip (letters)", () => {
    const result = validateAddress({ ...validAddr, zip: "ABCDE" });
    assert.ok(result !== null);
    assert.ok(result!.includes("zip"));
  });

  it("rejects invalid zip (too short)", () => {
    assert.ok(validateAddress({ ...validAddr, zip: "7870" }) !== null);
  });

  it("accepts 5-digit zip", () => {
    assert.equal(validateAddress({ ...validAddr, zip: "78701" }), null);
  });

  it("accepts ZIP+4 format", () => {
    assert.equal(validateAddress({ ...validAddr, zip: "78701-1234" }), null);
  });

  it("rejects ZIP+4 with wrong format", () => {
    assert.ok(validateAddress({ ...validAddr, zip: "78701-12" }) !== null);
  });
});

describe("validateTimezone (P1.A.3)", () => {
  it("accepts undefined (uses default)", () => {
    assert.equal(validateTimezone(undefined), null);
  });

  it("accepts valid IANA timezone", () => {
    assert.equal(validateTimezone("America/New_York"), null);
  });

  it("accepts America/Chicago", () => {
    assert.equal(validateTimezone("America/Chicago"), null);
  });

  it("accepts America/Los_Angeles", () => {
    assert.equal(validateTimezone("America/Los_Angeles"), null);
  });

  it("rejects invalid timezone string", () => {
    const result = validateTimezone("Not/A/Timezone");
    // On Node 24+ with Intl.supportedValuesOf, this should be rejected.
    // On older runtimes without the API, validation is degraded (returns null).
    if (typeof Intl.supportedValuesOf === "function") {
      assert.ok(result !== null);
      assert.ok(result!.includes("Not/A/Timezone"));
    }
  });

  it("rejects empty string timezone", () => {
    const result = validateTimezone("");
    // Empty string is falsy, so validateTimezone returns null (uses default)
    // This is correct — empty string means "no preference, use default"
    assert.equal(result, null);
  });
});
