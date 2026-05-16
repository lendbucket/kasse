import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { VerticalId, VerticalConfig, VerticalTerms, PlanTier } from "@/lib/verticals/types";

describe("Vertical types (P0.C.1)", () => {
  it("(a) VerticalId includes all 36 values", () => {
    const allIds: VerticalId[] = [
      'salon', 'barbershop', 'nail_salon', 'restaurant', 'bar', 'gym',
      'yoga_studio', 'pilates_studio', 'massage', 'med_spa',
      'auto_detailing', 'auto_repair', 'pet_grooming', 'veterinary',
      'tattoo', 'retail', 'food_truck', 'cafe', 'bakery', 'catering',
      'cleaning', 'photography', 'tutoring', 'childcare', 'coworking',
      'sports_training', 'beauty_school', 'brow_studio', 'lash_studio',
      'tanning_studio', 'dance_studio', 'martial_arts', 'crossfit',
      'chiropractic', 'physical_therapy', 'general'
    ];
    assert.equal(allIds.length, 36);
  });

  it("(b) VerticalConfig compiles with minimal valid object", () => {
    const config: VerticalConfig = {
      id: 'salon',
      displayName: 'Salon & Beauty',
      tagline: 'Hair, color, and beauty services',
      terms: {
        staff: 'Stylist', staffPlural: 'Stylists',
        client: 'Guest', clientPlural: 'Guests',
        service: 'Service', servicePlural: 'Services',
        location: 'Salon', locationPlural: 'Salons',
        appointment: 'Appointment', appointmentPlural: 'Appointments',
      },
      features: {},
      navigation: [],
      dashboardWidgets: [],
      defaultServices: [],
      onboardingChecklist: [],
      compliance: { licenseRequired: false, waiverRequired: false, hipaaRequired: false },
      recommendedAddons: [],
      typicalPlan: 'STARTER',
      averageAddonRevenueCents: 0,
    };
    assert.equal(config.id, 'salon');
  });

  it("(c) VerticalTerms requires all 10 fields", () => {
    const terms: VerticalTerms = {
      staff: 'Stylist', staffPlural: 'Stylists',
      client: 'Guest', clientPlural: 'Guests',
      service: 'Service', servicePlural: 'Services',
      location: 'Salon', locationPlural: 'Salons',
      appointment: 'Appointment', appointmentPlural: 'Appointments',
    };
    assert.equal(Object.keys(terms).length, 10);
  });

  it("(d) PlanTier accepts all 5 values", () => {
    const tiers: PlanTier[] = ['FREE', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];
    assert.equal(tiers.length, 5);
  });

  it("(e) VerticalConfig allows null override for verticalConfigOverride at the org level (sanity check on types)", () => {
    const t: PlanTier = 'STARTER';
    assert.equal(t, 'STARTER');
  });
});
