"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type LocationLite = { id: string; name: string };

type LocationContextValue = {
  locations: LocationLite[];
  activeLocationId: string;
  activeLocation: LocationLite | null;
  setActiveLocationId: (id: string) => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);
const COOKIE = "kasse_active_location";

function writeCookie(id: string) {
  if (typeof document === "undefined") return;
  // Non-sensitive UI preference (which location the user is viewing). 1yr, lax.
  document.cookie = `${COOKIE}=${encodeURIComponent(id)}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export function LocationProvider({
  locations,
  initialActiveId,
  children,
}: {
  locations: LocationLite[];
  initialActiveId: string;
  children: ReactNode;
}) {
  const [activeLocationId, setActive] = useState(initialActiveId);
  const setActiveLocationId = useCallback((id: string) => {
    setActive(id);
    writeCookie(id);
  }, []);
  const activeLocation = locations.find((l) => l.id === activeLocationId) ?? null;
  return (
    <LocationContext.Provider value={{ locations, activeLocationId, activeLocation, setActiveLocationId }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useActiveLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  // Defensive: a stray call outside the provider returns an empty shape instead of throwing.
  if (!ctx) return { locations: [], activeLocationId: "", activeLocation: null, setActiveLocationId: () => {} };
  return ctx;
}
