"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type { VerticalConfig, VerticalId } from "./types";
import { getVerticalConfig, mergeVerticalConfig, generalConfig } from "./registry";

/**
 * Hook returning the effective VerticalConfig for the current session's
 * organization. Reads:
 *   1. session.user.verticalId → base config from registry
 *   2. session.user.verticalConfigOverride → merged on top of base
 *
 * Returns generalConfig if no session OR no verticalId on session.
 *
 * Memoized per session — recomputes only when session data changes.
 *
 * SECURITY NOTE: session.user.verticalId is set in lib/auth.ts JWT callback
 * from User → Organization → verticalId. Even if a user is malicious and
 * forges their verticalId, the worst they can do is change which terms
 * render in their own UI — they cannot access another org's data because
 * the permission and tenant systems are layered separately.
 */
export function useVerticalConfig(): VerticalConfig {
  const { data: session } = useSession();

  return useMemo(() => {
    const verticalId = (session?.user as { verticalId?: VerticalId } | undefined)?.verticalId;
    const override = (session?.user as { verticalConfigOverride?: Partial<VerticalConfig> | null } | undefined)?.verticalConfigOverride;

    if (!verticalId) return generalConfig;

    const base = getVerticalConfig(verticalId);
    return mergeVerticalConfig(base, override);
  }, [session]);
}

/**
 * Hook returning just the terms for the current vertical. Convenience
 * for components that only need term translations (e.g., a button label
 * that says "Add Stylist" / "Add Barber" / "Add Tech" depending on vertical).
 */
export function useVerticalTerms() {
  const config = useVerticalConfig();
  return config.terms;
}
