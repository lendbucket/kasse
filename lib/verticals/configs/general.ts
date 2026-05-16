import type { VerticalConfig } from "../types";

export const generalConfig: VerticalConfig = {
  id: 'general',
  displayName: 'General Business',
  tagline: 'A flexible setup for any service business',

  terms: {
    staff: 'Staff',
    staffPlural: 'Staff',
    client: 'Customer',
    clientPlural: 'Customers',
    service: 'Service',
    servicePlural: 'Services',
    location: 'Location',
    locationPlural: 'Locations',
    appointment: 'Appointment',
    appointmentPlural: 'Appointments',
  },

  features: {
    colorStudio: false,
    formulaCards: false,
    commissionTracking: false,
    waiverForms: false,
    boothRent: false,
    walkInQueue: false,
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
    aiReceptionist: false,
    inventoryTracking: false,
    loyaltyProgram: false,
    giftCards: false,
    onlineBooking: true,
  },

  navigation: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/dashboard' },
    { id: 'appointments', label: 'Appointments', icon: 'Calendar', route: '/dashboard/appointments' },
    { id: 'clients', label: 'Customers', icon: 'Users', route: '/dashboard/clients' },
    { id: 'staff', label: 'Staff', icon: 'UserPlus', route: '/dashboard/stylists' },
    { id: 'services', label: 'Services', icon: 'Sparkles', route: '/dashboard/services' },
    { id: 'pos', label: 'POS', icon: 'CreditCard', route: '/dashboard/pos' },
    { id: 'reports', label: 'Reports', icon: 'BarChart2', route: '/dashboard/reports' },
    { id: 'settings', label: 'Settings', icon: 'Settings', route: '/dashboard/settings' },
  ],

  dashboardWidgets: [
    { id: 'revenue-today', order: 1 },
    { id: 'appointments-today', order: 2 },
    { id: 'recent-clients', order: 3 },
  ],

  defaultServices: [],

  onboardingChecklist: [
    { id: 'business-info', title: 'Complete business information', route: '/dashboard/settings#about' },
    { id: 'first-staff', title: 'Add your first team member', route: '/dashboard/stylists/new', completionCheck: 'staff' },
    { id: 'services', title: 'Add services to your menu', route: '/dashboard/services', completionCheck: 'services' },
    { id: 'payment', title: 'Connect payment processing', route: '/dashboard/settings#payment_methods', completionCheck: 'paymentMethod' },
  ],

  compliance: {
    licenseRequired: false,
    waiverRequired: false,
    hipaaRequired: false,
  },

  recommendedAddons: [],
  typicalPlan: 'STARTER',
  averageAddonRevenueCents: 0,
};
