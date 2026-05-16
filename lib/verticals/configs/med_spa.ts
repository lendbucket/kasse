import type { VerticalConfig } from "../types";

export const medSpaConfig: VerticalConfig = {
  id: 'med_spa',
  displayName: 'Med Spa',
  tagline: 'Medical aesthetics and wellness',

  terms: {
    staff: 'Clinician',
    staffPlural: 'Clinicians',
    client: 'Patient',
    clientPlural: 'Patients',
    service: 'Treatment',
    servicePlural: 'Treatments',
    location: 'Clinic',
    locationPlural: 'Clinics',
    appointment: 'Appointment',
    appointmentPlural: 'Appointments',
  },

  features: {
    colorStudio: false,
    formulaCards: false,
    commissionTracking: true,
    waiverForms: true,
    boothRent: false,
    walkInQueue: false,
    msdsLog: false,
    medicalIntake: true,      // patient histories
    injectableTracking: true, // botox / filler inventory by lot
    hipaaMode: true,          // HIPAA-compliant UX + audit
    tableManagement: false,
    kitchenDisplay: false,
    recipeBasedInventory: false,
    onlineOrdering: false,
    deliveryIntegrations: false,
    kdsDisplay: false,
    membershipBilling: true,  // membership programs common
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
    licenseType: 'Medical Director + RN/NP/PA licensure',
    waiverRequired: true,
    waiverContext: 'All injectable treatments require a Good Faith Exam and signed consent before each session.',
    hipaaRequired: true,
    staffCertifications: ['RN', 'NP', 'PA', 'MD', 'Aesthetician', 'Laser Specialist'],
  },

  recommendedAddons: [],
  typicalPlan: 'PRO',
  averageAddonRevenueCents: 0,
};
