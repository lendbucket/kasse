import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getVerticalConfig,
  getLaunchVerticals,
  getAvailableVerticals,
  mergeVerticalConfig,
} from "@/lib/verticals/registry";
import { salonConfig } from "@/lib/verticals/configs/salon";
import { generalConfig } from "@/lib/verticals/configs/general";

describe("Vertical registry (P0.C.14)", () => {
  it("(a) getVerticalConfig('salon') returns salon config with full content", () => {
    const c = getVerticalConfig('salon');
    assert.equal(c.id, 'salon');
    assert.ok(c.defaultServices.length >= 11);
  });

  it("(b) getVerticalConfig('barbershop') returns barbershop stub (correct terms, empty nav)", () => {
    const c = getVerticalConfig('barbershop');
    assert.equal(c.id, 'barbershop');
    assert.equal(c.terms.staff, 'Barber');
    assert.equal(c.navigation.length, 0);
  });

  it("(c) getVerticalConfig falls back to general for unimplemented verticals", () => {
    const c = getVerticalConfig('restaurant');
    assert.equal(c.id, 'general');
  });

  it("(d) getVerticalConfig falls back to general for an unknown id (defensive)", () => {
    // @ts-expect-error intentionally passing invalid id
    const c = getVerticalConfig('not_a_real_vertical');
    assert.equal(c.id, 'general');
  });

  it("(e) getLaunchVerticals returns only salon at launch", () => {
    const launch = getLaunchVerticals();
    assert.equal(launch.length, 1);
    assert.equal(launch[0].id, 'salon');
  });

  it("(f) getAvailableVerticals returns 4 verticals (salon + 3 beauty-adjacent stubs)", () => {
    const available = getAvailableVerticals();
    assert.equal(available.length, 4);
    const ids = available.map(c => c.id).sort();
    assert.deepEqual(ids, ['barbershop', 'med_spa', 'nail_salon', 'salon']);
  });

  it("(g) mergeVerticalConfig with null override returns base unchanged", () => {
    const merged = mergeVerticalConfig(salonConfig, null);
    assert.equal(merged, salonConfig);
  });

  it("(h) mergeVerticalConfig with terms override deep-merges term fields", () => {
    const merged = mergeVerticalConfig(salonConfig, {
      terms: { ...salonConfig.terms, client: 'Member', clientPlural: 'Members' },
    });
    assert.equal(merged.terms.client, 'Member');
    assert.equal(merged.terms.staff, 'Stylist'); // unchanged from base
  });

  it("(i) mergeVerticalConfig with features override deep-merges feature flags", () => {
    const merged = mergeVerticalConfig(salonConfig, {
      features: { ...salonConfig.features, walkInQueue: true },
    });
    assert.equal(merged.features.walkInQueue, true);
    assert.equal(merged.features.colorStudio, true); // unchanged from base
  });

  it("(j) mergeVerticalConfig with compliance override deep-merges compliance fields", () => {
    const merged = mergeVerticalConfig(generalConfig, {
      compliance: { ...generalConfig.compliance, licenseRequired: true, licenseType: 'Custom License' },
    });
    assert.equal(merged.compliance.licenseRequired, true);
    assert.equal(merged.compliance.licenseType, 'Custom License');
  });
});
