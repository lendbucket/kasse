import type { ThemeConfig } from "./types";

/**
 * Maps the ThemeConfig color keys to the LEGACY CSS variable names used
 * across the existing Kasse codebase (globals.css, components, etc).
 *
 * When ThemeProvider injects vars at runtime, both naming conventions
 * are emitted so existing var(--brand) consumers keep working AND new
 * code can use the var(--color-*) convention.
 *
 * Adding a key here means that color also gets emitted as the legacy
 * variable name. Omitting means only the modern --color-* form is emitted.
 */
const LEGACY_COLOR_VAR_MAP: Record<string, string> = {
  primary: 'brand',          // --color-primary AND --brand
  primaryHover: 'brand-hover',
  background: 'bg-page',
  surface: 'bg-card',
  text: 'text-primary',
  textMuted: 'text-muted',
  border: 'border',
  success: 'success',
  warning: 'warning',
  danger: 'error',           // existing CSS uses --error not --danger
  info: 'info',
  // Kasse-specific extras (emit as legacy-name)
  brand: 'brand',
  brandHover: 'brand-hover',
  accent: 'accent',
  accentHover: 'accent-hover',
  blush: 'blush',
  blushHover: 'blush-hover',
  sidebar: 'bg-sidebar',
  cream: 'bg-cream',
};

/**
 * Builds the CSS variable declarations for a ThemeConfig.
 * Returns CSS text suitable for injection inside a :root { } block.
 *
 * Emits BOTH the modern --color-<key> name AND, for keys in
 * LEGACY_COLOR_VAR_MAP, the legacy --<legacy-name> form. This dual
 * emission lets ThemeProvider serve both old and new code paths.
 *
 * camelCase keys are kebab-cased: primaryHover -> --color-primary-hover.
 */
export function buildThemeCssVars(theme: ThemeConfig): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(theme.colors)) {
    if (value === undefined) continue;  // optional fields may be omitted

    // Modern form: --color-<kebab-key>
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    lines.push(`  --color-${kebabKey}: ${value};`);

    // Legacy form: --<legacy-name> (if mapped)
    const legacyName = LEGACY_COLOR_VAR_MAP[key];
    if (legacyName) {
      lines.push(`  --${legacyName}: ${value};`);
    }
  }

  for (const [key, value] of Object.entries(theme.fonts)) {
    lines.push(`  --font-${key}: ${value};`);
  }

  return lines.join('\n');
}

/**
 * Builds a complete <style> tag content for :root injection.
 * Used by ThemeProvider to apply the theme to the document.
 */
export function buildThemeStyleContent(theme: ThemeConfig): string {
  return `:root {\n${buildThemeCssVars(theme)}\n}`;
}
