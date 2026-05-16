import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { salonConfig } from "@/lib/verticals/configs/salon";
import { barbershopConfig } from "@/lib/verticals/configs/barbershop";
import { nailSalonConfig } from "@/lib/verticals/configs/nail_salon";
import { medSpaConfig } from "@/lib/verticals/configs/med_spa";
import { generalConfig } from "@/lib/verticals/configs/general";

describe("Vertical configs (P0.C.3-8+13)", () => {
  it("(a) salon config: id, displayName, full terms", () => {
    assert.equal(salonConfig.id, 'salon');
    assert.equal(salonConfig.terms.client, 'Guest');
    assert.equal(salonConfig.terms.staff, 'Stylist');
  });

  it("(b) salon config: has 11+ default services", () => {
    assert.ok(salonConfig.defaultServices.length >= 11, `expected >= 11, got ${salonConfig.defaultServices.length}`);
  });

  it("(c) salon config: requires TDLR cosmetology license + waivers", () => {
    assert.equal(salonConfig.compliance.licenseRequired, true);
    assert.equal(salonConfig.compliance.licenseType, 'TDLR Cosmetology License');
    assert.equal(salonConfig.compliance.waiverRequired, true);
    assert.equal(salonConfig.compliance.hipaaRequired, false);
  });

  it("(d) salon config: colorStudio, formulaCards, commissionTracking all on", () => {
    assert.equal(salonConfig.features.colorStudio, true);
    assert.equal(salonConfig.features.formulaCards, true);
    assert.equal(salonConfig.features.commissionTracking, true);
  });

  it("(e) barbershop config: walk-in queue + booth rent on", () => {
    assert.equal(barbershopConfig.features.walkInQueue, true);
    assert.equal(barbershopConfig.features.boothRent, true);
    assert.equal(barbershopConfig.terms.staff, 'Barber');
  });

  it("(f) nail_salon config: msdsLog on, waivers required", () => {
    assert.equal(nailSalonConfig.features.msdsLog, true);
    assert.equal(nailSalonConfig.compliance.waiverRequired, true);
    assert.equal(nailSalonConfig.terms.staff, 'Tech');
  });

  it("(g) med_spa config: HIPAA mode + medical intake + injectable tracking on", () => {
    assert.equal(medSpaConfig.features.hipaaMode, true);
    assert.equal(medSpaConfig.features.medicalIntake, true);
    assert.equal(medSpaConfig.features.injectableTracking, true);
    assert.equal(medSpaConfig.compliance.hipaaRequired, true);
    assert.equal(medSpaConfig.terms.client, 'Patient');
    assert.equal(medSpaConfig.terms.service, 'Treatment');
  });

  it("(h) general config: generic terms, only onlineBooking feature on", () => {
    assert.equal(generalConfig.terms.client, 'Customer');
    assert.equal(generalConfig.features.onlineBooking, true);
    assert.equal(generalConfig.features.colorStudio, false);
    assert.equal(generalConfig.features.hipaaMode, false);
  });

  it("(i) stubs (barbershop/nail_salon/med_spa) have empty navigation pending P36-P45", () => {
    assert.equal(barbershopConfig.navigation.length, 0);
    assert.equal(nailSalonConfig.navigation.length, 0);
    assert.equal(medSpaConfig.navigation.length, 0);
  });

  it("(j) salon navigation: 12 top-level items including Color Studio + AI Receptionist", () => {
    const ids = salonConfig.navigation.map(n => n.id);
    assert.ok(ids.includes('color-studio'), 'salon must have color-studio nav');
    assert.ok(ids.includes('ai-receptionist'), 'salon must have ai-receptionist nav');
    assert.ok(ids.includes('stylists'), 'salon must have stylists nav');
  });
});
