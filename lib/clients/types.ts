import type { AllergyEntry } from "@/lib/services/types";

export type PreferredContactChannel = "SMS" | "EMAIL" | "PHONE" | "NO_CONTACT";
export type PreferredLanguage = "en" | "es";

export interface ClientPreferences {
  preferredLanguage: PreferredLanguage;
  preferredContactChannel: PreferredContactChannel;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
}

export interface ClientAllergies {
  allergens: AllergyEntry[];
}
