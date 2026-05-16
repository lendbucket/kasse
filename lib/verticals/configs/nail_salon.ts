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
  defaultServices: [],
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
