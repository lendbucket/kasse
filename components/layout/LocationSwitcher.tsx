"use client";

import { MapPin, ChevronDown } from "lucide-react";
import { useActiveLocation } from "@/lib/locations/context";

const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontWeight: 500 };

export function LocationSwitcher() {
  const { locations, activeLocationId, activeLocation, setActiveLocationId } = useActiveLocation();

  if (locations.length === 0) {
    return <span style={{ ...pill, color: "var(--text-muted)", fontWeight: 400 }}><MapPin size={14} strokeWidth={1.5} /> No location</span>;
  }
  if (locations.length === 1) {
    return <span style={{ ...pill, color: "var(--text-secondary)" }}><MapPin size={14} strokeWidth={1.5} /> {activeLocation?.name ?? locations[0].name}</span>;
  }
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <MapPin size={14} strokeWidth={1.5} style={{ position: "absolute", left: 12, color: "var(--text-muted)", pointerEvents: "none" }} />
      <ChevronDown size={14} strokeWidth={1.5} style={{ position: "absolute", right: 10, color: "var(--text-muted)", pointerEvents: "none" }} />
      <select value={activeLocationId} onChange={(e) => setActiveLocationId(e.target.value)} aria-label="Active location"
        style={{ appearance: "none", height: 36, padding: "0 30px 0 32px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", cursor: "pointer", outline: "none" }}>
        {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </div>
  );
}
