"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tag } from "lucide-react";
import type { StaffMember } from "./types";

type PricingService = {
  serviceId: string; name: string; category: string | null;
  basePriceCents: number; baseDurationMinutes: number;
  overridePriceCents: number | null; overrideDurationMinutes: number | null;
};

type WorkingOverride = { priceDollars: string; durationMin: string };

export default function PricingSection({ staffId, staff }: { staffId: string; staff: StaffMember }) {
  const [services, setServices] = useState<PricingService[]>([]);
  const [working, setWorking] = useState<Record<string, WorkingOverride>>({});
  const [saved, setSaved] = useState<Record<string, WorkingOverride>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/staff/${staffId}/pricing`);
      if (!res.ok) throw new Error("Failed to load pricing");
      const data = (await res.json()) as { services: PricingService[] };
      setServices(data.services);

      const map: Record<string, WorkingOverride> = {};
      for (const s of data.services) {
        map[s.serviceId] = {
          priceDollars: s.overridePriceCents != null ? (s.overridePriceCents / 100).toFixed(2) : "",
          durationMin: s.overrideDurationMinutes != null ? String(s.overrideDurationMinutes) : "",
        };
      }
      setWorking(map);
      setSaved(JSON.parse(JSON.stringify(map)));
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, [staffId]);

  useEffect(() => { load(); }, [load]);

  const isDirty = useMemo(() => JSON.stringify(working) !== JSON.stringify(saved), [working, saved]);

  function setField(serviceId: string, field: "priceDollars" | "durationMin", value: string) {
    setSaveMsg(null);
    setWorking((prev) => ({ ...prev, [serviceId]: { ...prev[serviceId], [field]: value } }));
  }

  // Validation
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const [id, w] of Object.entries(working)) {
      if (w.priceDollars.trim() !== "") {
        const n = parseFloat(w.priceDollars);
        if (isNaN(n) || n < 0) errs[id] = "Invalid price";
      }
      if (w.durationMin.trim() !== "") {
        const n = parseInt(w.durationMin, 10);
        if (isNaN(n) || n < 1) errs[id] = "Invalid duration";
      }
    }
    return errs;
  }, [working]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  async function handleSave() {
    if (hasErrors) return;
    setSaving(true); setSaveMsg(null);
    const overrides = Object.entries(working).map(([serviceId, w]) => {
      const priceCents = w.priceDollars.trim() !== ""
        ? Math.round(parseFloat(w.priceDollars) * 100)
        : null;
      const durationMinutes = w.durationMin.trim() !== ""
        ? Math.round(parseInt(w.durationMin, 10))
        : null;
      return { serviceId, priceCents, durationMinutes };
    });
    try {
      const res = await fetch(`/api/staff/${staffId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || "Save failed");
      }
      setSaved(JSON.parse(JSON.stringify(working)));
      setSaveMsg("Saved");
    } catch (e) { setSaveMsg(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, PricingService[]> = {};
    for (const s of services) {
      const cat = s.category || "Uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    }
    return Object.entries(map);
  }, [services]);

  if (loading) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading pricing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--error)" }}>{error}</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <Tag size={36} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No eligible services</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto" }}>
          Set up this stylist&apos;s services first in the Services tab, then come back to set custom pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Custom pricing</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Override the base price or duration per service. Leave blank to use the base.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saveMsg && (
            <span style={{ fontSize: 12, color: saveMsg === "Saved" ? "var(--success)" : "var(--error)" }}>
              {saveMsg}
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!isDirty || saving || hasErrors}
            style={{ opacity: !isDirty || saving || hasErrors ? 0.5 : 1, fontSize: 13, height: 32, padding: "0 14px" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {grouped.map(([category, svcs]) => (
        <div key={category}>
          <div style={{ padding: "10px 24px", background: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {category}
            </span>
          </div>
          {svcs.map((svc) => {
            const w = working[svc.serviceId];
            if (!w) return null;
            const hasCustom = w.priceDollars.trim() !== "" || w.durationMin.trim() !== "";
            const err = validationErrors[svc.serviceId];
            return (
              <div
                key={svc.serviceId}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 24px", borderBottom: "1px solid var(--border)",
                  flexWrap: "wrap",
                }}
              >
                {/* Service info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{svc.name}</span>
                    {hasCustom && (
                      <span style={{ padding: "1px 6px", borderRadius: "var(--radius-sm)", fontSize: 10, fontWeight: 600, background: "var(--blush-soft)", color: "var(--blush)" }}>
                        Custom
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Base ${(svc.basePriceCents / 100).toFixed(2)} &middot; {svc.baseDurationMinutes} min
                  </span>
                </div>

                {/* Price input */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={w.priceDollars}
                    onChange={(e) => setField(svc.serviceId, "priceDollars", e.target.value)}
                    placeholder={(svc.basePriceCents / 100).toFixed(2)}
                    style={{
                      width: 80, height: 32, borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-strong)", padding: "0 8px",
                      fontSize: 13, color: "var(--text-primary)", background: "var(--bg-card)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Duration input */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={w.durationMin}
                    onChange={(e) => setField(svc.serviceId, "durationMin", e.target.value)}
                    placeholder={String(svc.baseDurationMinutes)}
                    style={{
                      width: 56, height: 32, borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-strong)", padding: "0 8px",
                      fontSize: 13, color: "var(--text-primary)", background: "var(--bg-card)",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>min</span>
                </div>

                {/* Validation error */}
                {err && (
                  <span style={{ fontSize: 11, color: "var(--error)", width: "100%", paddingLeft: 0, marginTop: -4 }}>
                    {err}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
