import type { VerticalConfig } from "../types";

export const nailSalonConfig: VerticalConfig = {
  id: 'nail_salon',
  displayName: 'Nail Salon',
  tagline: 'Manicures, pedicures, and nail art',

  terms: {
    staff: 'Tech',
    staffPlural: 'Techs',
    client: 'Client',
    clientPlural: 'Clients',
    service: 'Service',
    servicePlural: 'Services',
    location: 'Salon',
    locationPlural: 'Salons',
    appointment: 'Appointment',
    appointmentPlural: 'Appointments',
  },

  features: {
    colorStudio: false,
    formulaCards: false,
    commissionTracking: true,
    waiverForms: true,
    boothRent: true,
    walkInQueue: true,
    msdsLog: true,           // chemical handling
    medicalIntake: false,
    injectableTracking: false,
    hipaaMode: false,
    tableManagement: false,
    kitchenDisplay: false,
    recipeBasedInventory: false,
    onlineOrdering: false,
    deliveryIntegrations: false,
    kdsDisplay: false,
    membershipBilling: false,
    classScheduling: false,
    classPasses: false,
    vehicleProfiles: false,
    petProfiles: false,
    vaccinationTracking: false,
    aiReceptionist: true,
    inventoryTracking: true,
    loyaltyProgram: true,
    giftCards: true,
    onlineBooking: true,
  },

  navigation: [],
  dashboardWidgets: [],
  defaultServices: [
    // Manicures
    { name: 'Classic Manicure', durationMinutes: 30, priceCents: 2500, category: 'Manicures' },
    { name: 'Gel Manicure', durationMinutes: 45, priceCents: 3500, category: 'Manicures' },
    { name: 'Polish Change — Hands', durationMinutes: 15, priceCents: 1500, category: 'Manicures' },
    // Pedicures
    { name: 'Classic Pedicure', durationMinutes: 45, priceCents: 4000, category: 'Pedicures' },
    { name: 'Gel Pedicure', durationMinutes: 60, priceCents: 5500, category: 'Pedicures' },
    { name: 'Spa Pedicure', durationMinutes: 60, priceCents: 6000, category: 'Pedicures' },
    { name: 'Polish Change — Feet', durationMinutes: 15, priceCents: 1500, category: 'Pedicures' },
    // Enhancements
    { name: 'Acrylic Full Set', durationMinutes: 75, priceCents: 6500, category: 'Enhancements' },
    { name: 'Acrylic Fill', durationMinutes: 60, priceCents: 4500, category: 'Enhancements' },
    { name: 'Dip Powder Set', durationMinutes: 60, priceCents: 5000, category: 'Enhancements' },
    { name: 'Gel-X / Extensions', durationMinutes: 90, priceCents: 7500, category: 'Enhancements' },
    // Add-Ons
    { name: 'Nail Art (per nail)', durationMinutes: 15, priceCents: 1000, category: 'Add-Ons' },
    { name: 'Paraffin Treatment', durationMinutes: 15, priceCents: 1500, category: 'Add-Ons' },
    { name: 'Gel Removal', durationMinutes: 15, priceCents: 1500, category: 'Add-Ons' },
  ],
  onboardingChecklist: [],

  compliance: {
    licenseRequired: true,
    licenseType: 'TDLR Manicurist License',
    waiverRequired: true,
    waiverContext: 'Acrylic and gel services require an allergy/sensitivity waiver.',
    hipaaRequired: false,
    staffCertifications: ['Manicurist', 'Nail Technician'],
  },

  recommendedAddons: [],
  typicalPlan: 'STARTER',
  averageAddonRevenueCents: 0,
};
