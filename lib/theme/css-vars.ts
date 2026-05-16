import type { ThemeConfig } from "./types";

/**
 * Builds the CSS variable declarations for a ThemeConfig.
 * Returns the CSS text intended for injection inside a :root { ... } block.
 *
 * Variable naming convention: --color-<key>, --font-<key>.
 *
 * Example output:
 *   --color-primary: #606E74;
 *   --color-primary-hover: #4F5B61;
 *   --color-background: #f7f8fa;
 *   ...
 *   --font-sans: ...;
 *   --font-mono: ...;
 *
 * Camel-case theme keys become kebab-case CSS variable names
 * (primaryHover → --color-primary-hover, textMuted → --color-text-muted).
 */
export function buildThemeCssVars(theme: ThemeConfig): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(theme.colors)) {
    const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    lines.push(`  --color-${kebabKey}: ${value};`);
  }

  for (const [key, value] of Object.entries(theme.fonts)) {
    lines.push(`  --font-${key}: ${value};`);
  }

  return lines.join("\n");
}

/**
 * Builds a complete <style> tag content for :root injection.
 * Used by ThemeProvider to apply the theme to the document.
 */
export function buildThemeStyleContent(theme: ThemeConfig): string {
  return `:root {\n${buildThemeCssVars(theme)}\n}`;
}
