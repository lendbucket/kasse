/**
 * ThemeConfig — visual identity configuration for a product/org.
 *
 * Every product (Kasse, SalonTransact, SalonBacked) has a default ThemeConfig.
 * Orgs can override fields via Organization.themeOverride (Partial<ThemeConfig>).
 *
 * Pure data — no DOM coupling, no React imports. The same shape works for
 * both web (CSS variable applicator in P0.B.6) and React Native (P8 iPad).
 */
export interface ThemeConfig {
  /** Stable identifier, e.g., "kasse-default", "salontransact-default" */
  id: string;
  /** Human-readable label */
  name: string;
  /** Color palette — all colors as hex strings with leading #. */
  colors: {
    /** Primary brand color, used for CTAs and accents */
    primary: string;
    /** Hovered/pressed state for primary */
    primaryHover: string;
    /** Page background */
    background: string;
    /** Card/surface background — typically slightly different from page bg */
    surface: string;
    /** Border color for cards, dividers */
    border: string;
    /** Primary text color */
    text: string;
    /** Muted text for secondary content */
    textMuted: string;
    /** Success state (green) */
    success: string;
    /** Warning state (amber) */
    warning: string;
    /** Danger/error state (red) */
    danger: string;
    /** Info state (blue) */
    info: string;
    /** Optional brand-specific accent — different from primary. Salon-aware. */
    brand?: string;
    /** Optional hover state for brand */
    brandHover?: string;
    /** Optional secondary accent — used for highlights, links */
    accent?: string;
    /** Optional hover state for accent */
    accentHover?: string;
    /** Optional tertiary accent — used for badges, callouts (e.g., coral blush) */
    blush?: string;
    /** Optional hover state for blush */
    blushHover?: string;
    /** Optional sidebar background (for dark sidebars over light page bg) */
    sidebar?: string;
    /** Optional cream / soft surface tone (e.g., for warm hover states) */
    cream?: string;
  };
  /** Font family stacks */
  fonts: {
    /** Sans-serif stack for body + UI */
    sans: string;
    /** Monospace stack for code, IDs, numbers in fixed-width contexts */
    mono: string;
  };
  /** Logo URLs (or import paths if bundled) */
  logo: {
    /** Logo for light backgrounds */
    light: string;
    /** Logo for dark backgrounds */
    dark: string;
  };
  /** Product copy — strings shown to merchants */
  copy: {
    /** Product name, e.g., "Kasse", "SalonTransact" */
    productName: string;
    /** Footer attribution, e.g., "Powered by Reyna Pay" */
    poweredBy: string;
    /** Customer-facing support email */
    supportEmail: string;
  };
  /** Email template defaults */
  emailTemplates: {
    /** From: name, e.g., "Kasse" */
    senderName: string;
    /** From: email, e.g., "noreply@kasseapp.com" */
    senderEmail: string;
    /** Footer HTML appended to every transactional email */
    footerHtml: string;
  };
  /** Legal URLs */
  legal: {
    privacyUrl: string;
    termsUrl: string;
    /** Data Processing Agreement (for B2B) */
    dpaUrl: string;
  };
}

/**
 * Partial<ThemeConfig> stored as Organization.themeOverride jsonb. Orgs only
 * include fields they're overriding; everything else falls back to the
 * product's default theme.
 *
 * Nested objects (colors, fonts, logo, copy, emailTemplates, legal) can be
 * partially overridden too. The merger (mergeThemeConfig) deep-merges
 * nested objects.
 */
export type ThemeOverride = {
  id?: string;
  name?: string;
  colors?: Partial<ThemeConfig['colors']>;
  fonts?: Partial<ThemeConfig['fonts']>;
  logo?: Partial<ThemeConfig['logo']>;
  copy?: Partial<ThemeConfig['copy']>;
  emailTemplates?: Partial<ThemeConfig['emailTemplates']>;
  legal?: Partial<ThemeConfig['legal']>;
};
