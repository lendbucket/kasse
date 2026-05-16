import type { ThemeConfig, ThemeOverride } from "./types";
import { kasseTheme } from "./defaults/kasse";
import { salonTransactTheme } from "./defaults/salontransact";
import { salonBackedTheme } from "./defaults/salonbacked";

/**
 * Product themes registry. The product (not the org) determines the base
 * theme — Kasse merchants use kasseTheme, SalonTransact merchants use
 * salonTransactTheme, etc. Org-level themeOverride layers on top via
 * mergeThemeConfig().
 *
 * Kasse is the default product. Each app surface that consumes a different
 * product (the SalonTransact admin portal, the SalonBacked dashboard) will
 * import its specific theme directly rather than going through the registry.
 */
export const themes = {
  kasse: kasseTheme,
  salontransact: salonTransactTheme,
  salonbacked: salonBackedTheme,
} as const;

export type ProductThemeId = keyof typeof themes;

/**
 * Returns the default theme for a product. Falls back to kasseTheme for
 * unknown product IDs (defensive — should never happen in normal flow).
 */
export function getProductTheme(product: ProductThemeId | string): ThemeConfig {
  return themes[product as ProductThemeId] ?? kasseTheme;
}

/**
 * Deep-merges an org's themeOverride onto a base theme. Nested objects
 * (colors, fonts, logo, copy, emailTemplates, legal) merge field-by-field
 * — only fields the override specifies are changed; everything else falls
 * back to the base.
 *
 * If override is null/undefined, returns base unchanged.
 */
export function mergeThemeConfig(
  base: ThemeConfig,
  override: ThemeOverride | null | undefined,
): ThemeConfig {
  if (!override) return base;
  return {
    ...base,
    ...(override.id !== undefined && { id: override.id }),
    ...(override.name !== undefined && { name: override.name }),
    colors: { ...base.colors, ...(override.colors ?? {}) },
    fonts: { ...base.fonts, ...(override.fonts ?? {}) },
    logo: { ...base.logo, ...(override.logo ?? {}) },
    copy: { ...base.copy, ...(override.copy ?? {}) },
    emailTemplates: { ...base.emailTemplates, ...(override.emailTemplates ?? {}) },
    legal: { ...base.legal, ...(override.legal ?? {}) },
  };
}
