export interface ServicePricing {
  baseCents: number;
  locationOverrideCents: number | null;
  staffOverrideCents: number | null;
  effectiveCents: number; // computed: staff > location > base
}

export interface ServiceDuration {
  baseMinutes: number;
  locationOverrideMinutes: number | null;
  staffOverrideMinutes: number | null;
  bufferMinutes: number;
  processingMinutes: number | null;
  effectiveTotalMinutes: number; // duration + buffer + processing
}

export interface ServiceAddOnConfig {
  isAddon: boolean;
  visibleOnBookingMenu: boolean;
  addsTime: boolean;
  maxAddonTime: number | null;
}

export interface AllergyEntry {
  allergen: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  notes: string | null;
  addedAt: string; // ISO
}
