import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveVerticalTerm } from "@/components/vertical/VerticalTerm";
import { salonConfig } from "@/lib/verticals/configs/salon";
import { medSpaConfig } from "@/lib/verticals/configs/med_spa";

describe("resolveVerticalTerm (P0.C.16)", () => {
  it("(a) salon: 'client' resolves to 'Guest'", () => {
    assert.equal(
      resolveVerticalTerm({ terms: salonConfig.terms, name: 'client' }),
      'Guest'
    );
  });

  it("(b) salon: 'client' plural resolves to 'Guests'", () => {
    assert.equal(
      resolveVerticalTerm({ terms: salonConfig.terms, name: 'client', plural: true }),
      'Guests'
    );
  });

  it("(c) med_spa: 'client' resolves to 'Patient', plural 'Patients'", () => {
    assert.equal(resolveVerticalTerm({ terms: medSpaConfig.terms, name: 'client' }), 'Patient');
    assert.equal(resolveVerticalTerm({ terms: medSpaConfig.terms, name: 'client', plural: true }), 'Patients');
  });

  it("(d) med_spa: 'service' resolves to 'Treatment'", () => {
    assert.equal(resolveVerticalTerm({ terms: medSpaConfig.terms, name: 'service' }), 'Treatment');
  });

  it("(e) case='lower': 'Stylist' becomes 'stylist'", () => {
    assert.equal(
      resolveVerticalTerm({ terms: salonConfig.terms, name: 'staff', caseTransform: 'lower' }),
      'stylist'
    );
  });

  it("(f) case='upper': 'Stylist' becomes 'STYLIST'", () => {
    assert.equal(
      resolveVerticalTerm({ terms: salonConfig.terms, name: 'staff', caseTransform: 'upper' }),
      'STYLIST'
    );
  });

  it("(g) case='title' preserves existing title case", () => {
    assert.equal(
      resolveVerticalTerm({ terms: salonConfig.terms, name: 'staff', caseTransform: 'title' }),
      'Stylist'
    );
  });

  it("(h) all 5 term names resolve cleanly for salon", () => {
    const names = ['staff', 'client', 'service', 'location', 'appointment'] as const;
    for (const name of names) {
      const result = resolveVerticalTerm({ terms: salonConfig.terms, name });
      assert.ok(result.length > 0, `term '${name}' should resolve to non-empty string`);
    }
  });
});
