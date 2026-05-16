"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme/useTheme";
import { buildThemeStyleContent } from "@/lib/theme/css-vars";

/**
 * ThemeProvider injects the current effective theme as CSS variables
 * on the document root. Place near the top of your root layout, INSIDE
 * the next-auth SessionProvider (it depends on useSession).
 *
 * Implementation: writes a <style> tag with id "kasse-theme-vars" to the
 * document head. On theme change, the style content is updated in place
 * (no flicker, no duplicate tags).
 *
 * SSR: returns a server-rendered <style> tag with the default Kasse theme
 * so the initial paint matches before client hydration. After hydration,
 * the effect updates the style if the org has an override.
 *
 * Children pass through unchanged — this component is render-transparent
 * except for the injected style tag.
 */
export type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useTheme();

  useEffect(() => {
    // Find or create the style tag on the document head
    const STYLE_ID = "kasse-theme-vars";
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildThemeStyleContent(theme);
  }, [theme]);

  // Server-side render the initial style content so SSR matches the
  // default theme on first paint. The useEffect above takes over on
  // hydration and updates the style if the org has an override.
  return (
    <>
      <style
        id="kasse-theme-vars"
        dangerouslySetInnerHTML={{
          __html: buildThemeStyleContent(theme),
        }}
      />
      {children}
    </>
  );
}
