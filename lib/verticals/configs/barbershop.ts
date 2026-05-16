import type { VerticalConfig } from "../types";

export const barbershopConfig: VerticalConfig = {
  id: 'barbershop',
  displayName: 'Barbershop',
  tagline: 'Cuts, fades, and walk-ins',

  terms: {
    staff: 'Barber',
    staffPlural: 'Barbers',
    client: 'Client',
    clientPlural: 'Clients',
    service: 'Service',
    servicePlural: 'Services',
    location: 'Shop',
    locationPlural: 'Shops',
    appointment: 'Appointment',
    appointmentPlural: 'Appointments',
  },

  features: {
    colorStudio: false,
    formulaCards: false,
    commissionTracking: true,
    waiverForms: false,
    boothRent: true,        // common in barbershops
    walkInQueue: true,      // walk-in heavy
    msdsLog: false,
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

  // Stub — content fills month 2-3 post-launch
  navigation: [],
  dashboardWidgets: [],
  defaultServices: [],
  onboardingChecklist: [],

  compliance: {
    licenseRequired: true,
    licenseType: 'TDLR Barber License',
    waiverRequired: false,
    hipaaRequired: false,
    staffCertifications: ['Barber'],
  },

  recommendedAddons: [],
  typicalPlan: 'STARTER',
  averageAddonRevenueCents: 0,
};
