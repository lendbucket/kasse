"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type { ThemeConfig, ThemeOverride } from "./types";
import { kasseTheme } from "./defaults/kasse";
import { mergeThemeConfig } from "./registry";

/**
 * Returns the effective ThemeConfig for the current session's org. Reads:
 *   1. Product default (kasseTheme — this is the Kasse portal)
 *   2. session.user.themeOverride — merged on top of product default
 *
 * Returns kasseTheme unchanged if no session or no override.
 *
 * Memoized per session — recomputes only when session data changes.
 *
 * NOTE: This hook is for the Kasse portal. SalonTransact and SalonBacked
 * portals each have their own product theme baked into their root layouts;
 * they would use a similar hook with their respective product default.
 */
export function useTheme(): ThemeConfig {
  const { data: session } = useSession();

  return useMemo(() => {
    const override = (session?.user as { themeOverride?: ThemeOverride | null } | undefined)?.themeOverride;
    return mergeThemeConfig(kasseTheme, override);
  }, [session]);
}

/**
 * Convenience hook returning just the color palette. Use when a component
 * only needs colors and doesn't care about fonts/logo/copy.
 */
export function useThemeColors(): ThemeConfig["colors"] {
  const theme = useTheme();
  return theme.colors;
}
