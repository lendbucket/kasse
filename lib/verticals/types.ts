import type { Role } from "@prisma/client";

/**
 * VerticalId — the canonical list of supported verticals. Matches the
 * VerticalId enum in prisma/schema.prisma. New verticals added here MUST
 * also be added to the schema enum (via a migration) and registered in
 * lib/verticals/registry.ts.
 *
 * Launch scope (locked 2026-05-14):
 *   - 'salon' — full config shipped P0.C.2
 *   - 'barbershop', 'nail_salon', 'med_spa' — stub configs shipped P0.C.2,
 *     content filled month 2-3 post-launch
 *   - 'general' — fallback config for verticals not yet built
 *   - All others — defer to post-launch phases (P36-P45)
 */
export type VerticalId =
  | 'salon'
  | 'barbershop'
  | 'nail_salon'
  | 'restaurant'
  | 'bar'
  | 'gym'
  | 'yoga_studio'
  | 'pilates_studio'
  | 'massage'
  | 'med_spa'
  | 'auto_detailing'
  | 'auto_repair'
  | 'pet_grooming'
  | 'veterinary'
  | 'tattoo'
  | 'retail'
  | 'food_truck'
  | 'cafe'
  | 'bakery'
  | 'catering'
  | 'cleaning'
  | 'photography'
  | 'tutoring'
  | 'childcare'
  | 'coworking'
  | 'sports_training'
  | 'beauty_school'
  | 'brow_studio'
  | 'lash_studio'
  | 'tanning_studio'
  | 'dance_studio'
  | 'martial_arts'
  | 'crossfit'
  | 'chiropractic'
  | 'physical_therapy'
  | 'general';

/**
 * Vertical-specific terminology. Different industries use different words
 * for the same concepts: a salon has "Stylists" and "Guests"; a gym has
 * "Trainers" and "Members"; a med spa has "Clinicians" and "Patients".
 *
 * These terms drive the <VerticalTerm> component (P0.C.4) so every label
 * in the UI auto-translates to the org's vertical without hard-coded
 * strings sprinkled across components.
 */
export interface VerticalTerms {
  staff: string;            // "Stylist", "Barber", "Tech", "Trainer", "Clinician"
  staffPlural: string;
  client: string;           // "Guest", "Member", "Patient"
  clientPlural: string;
  service: string;          // "Service", "Treatment", "Class"
  servicePlural: string;
  location: string;         // "Salon", "Studio", "Gym", "Clinic"
  locationPlural: string;
  appointment: string;      // "Appointment", "Booking", "Session", "Class"
  appointmentPlural: string;
}

/**
 * Feature flags for which capabilities are enabled by default for this
 * vertical. UI components check these flags to decide whether to render
 * a feature surface (e.g., colorStudio only renders for salon vertical).
 *
 * Plan tier may further gate features (P0.D) — both must be true for a
 * feature to render: VerticalConfig.features.X AND plan limit allows it.
 */
export interface VerticalFeatures {
  // Beauty-vertical features
  colorStudio?: boolean;            // hair color formula library
  formulaCards?: boolean;           // per-client formula tracking
  commissionTracking?: boolean;     // staff commission percentages
  waiverForms?: boolean;            // pre-service waivers (chemical, etc)
  boothRent?: boolean;              // booth-rent billing instead of commission
  walkInQueue?: boolean;            // walk-in queue + TV board display
  msdsLog?: boolean;                // MSDS sheet tracking (nail salons)

  // Med-spa specific
  medicalIntake?: boolean;          // patient medical history forms
  injectableTracking?: boolean;     // injectable inventory by lot
  hipaaMode?: boolean;              // HIPAA-compliant UX + audit

  // Restaurant specific
  tableManagement?: boolean;        // floor plan + reservations
  kitchenDisplay?: boolean;         // KDS for cooks
  recipeBasedInventory?: boolean;   // deduct inventory by recipe yield
  onlineOrdering?: boolean;
  deliveryIntegrations?: boolean;
  kdsDisplay?: boolean;

  // Gym specific
  membershipBilling?: boolean;      // recurring membership charges
  classScheduling?: boolean;        // group class roster
  classPasses?: boolean;            // multi-class punch passes

  // Auto / pet specific
  vehicleProfiles?: boolean;        // per-vehicle history (auto)
  petProfiles?: boolean;            // per-pet record (grooming, vet)
  vaccinationTracking?: boolean;    // pet vaccine records

  // Universal features (most verticals)
  aiReceptionist?: boolean;
  inventoryTracking?: boolean;
  loyaltyProgram?: boolean;
  giftCards?: boolean;
  onlineBooking?: boolean;
}

/**
 * A single navigation item shown in the vertical's portal sidebar. Each
 * item maps to a route; permission/role visibility is layered separately
 * via the existing PermissionGate / role-landing system.
 */
export interface NavigationItem {
  id: string;               // stable key, e.g., "appointments"
  label: string;            // display label, e.g., "Appointments"
  icon: string;             // lucide-react icon name, e.g., "Calendar"
  route: string;            // absolute path, e.g., "/dashboard/appointments"
  /** Optional: only show this item if the named feature is enabled */
  requiresFeature?: keyof VerticalFeatures;
  /** Optional: nested sub-navigation, one level deep */
  children?: NavigationItem[];
}

/**
 * A dashboard widget definition. The vertical config declares which
 * widgets should appear on the org's dashboard and in what order. Widget
 * implementations live in components/widgets/* and are looked up by id.
 */
export interface DashboardWidget {
  id: string;               // stable widget id, e.g., "revenue-today"
  /** Display order on the dashboard (lower = higher up) */
  order: number;
  /** Optional: only show if feature enabled */
  requiresFeature?: keyof VerticalFeatures;
}

/**
 * A pre-defined service template shipped with the vertical. Used at
 * org onboarding to seed a starter service catalog so the org isn't
 * staring at an empty menu on day one.
 */
export interface ServiceTemplate {
  name: string;             // "Women's Haircut"
  durationMinutes: number;  // 45
  priceCents: number;       // 6500
  category?: string;        // "Haircuts", "Color", "Treatments"
}

/**
 * Onboarding checklist item shown to a new org during their first session.
 * Each step has a title, short description, and a route to take them to.
 */
export interface ChecklistItem {
  id: string;
  title: string;            // "Add your first stylist"
  description?: string;
  route: string;            // "/dashboard/staff/new"
  /** Optional: completed when this entity has at least one row */
  completionCheck?: 'staff' | 'services' | 'clients' | 'paymentMethod' | 'location';
}

/**
 * Vertical-specific compliance metadata. Drives UI affordances like
 * license-number capture fields, required waivers, and HIPAA mode.
 */
export interface VerticalCompliance {
  licenseRequired: boolean;
  licenseType?: string;     // "TDLR Cosmetology License", "TX Massage License"
  waiverRequired: boolean;
  waiverContext?: string;   // "Chemical services require a signed waiver"
  hipaaRequired: boolean;
  /** Specific certifications shown on staff profile */
  staffCertifications?: string[];
}

/**
 * Plan tier (P0.D will define the full enum). For now this is a type-only
 * placeholder so the typical-plan field can compile. Extend in P0.D.
 */
export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';

/**
 * Recommended addons for this vertical. Used at onboarding to surface
 * vertical-appropriate addons (e.g., "Kasse Color" for salons, "HIPAA
 * Mode" for med spas). AddonId will be a string union once P0.D defines
 * the addon catalog — for now, plain string.
 */
export type AddonId = string;

/**
 * Top-level VerticalConfig — the structure every vertical config file
 * conforms to. Pure data; no React, no Prisma, no side effects.
 */
export interface VerticalConfig {
  /** Matches the VerticalId enum value */
  id: VerticalId;
  /** Human-readable name, e.g., "Salon & Beauty" */
  displayName: string;
  /** Short tagline shown in vertical pickers */
  tagline: string;
  /** Vertical-specific terminology */
  terms: VerticalTerms;
  /** Which features are enabled by default for this vertical */
  features: VerticalFeatures;
  /** Default navigation items shown in the portal sidebar */
  navigation: NavigationItem[];
  /** Dashboard widgets shown on the org's home page */
  dashboardWidgets: DashboardWidget[];
  /** Starter service catalog seeded at onboarding */
  defaultServices: ServiceTemplate[];
  /** Onboarding checklist shown to new orgs */
  onboardingChecklist: ChecklistItem[];
  /** Compliance metadata */
  compliance: VerticalCompliance;
  /** Vertical-appropriate addons to surface at onboarding */
  recommendedAddons: AddonId[];
  /** The plan tier most orgs in this vertical pick */
  typicalPlan: PlanTier;
  /** Average monthly addon revenue (for analytics, not displayed to merchants) */
  averageAddonRevenueCents: number;
}
