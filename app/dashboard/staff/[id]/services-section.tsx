"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Scissors, Check } from "lucide-react";
import type { StaffMember } from "./types";
import { SKILL_LEVELS, type SkillLevel } from "./types";

type Service = {
  id: string; name: string; price: number; duration: number;
  category: string | null; isActive: boolean;
};
type EligibilityItem = { serviceId: string; skillLevel: string | null };
type WorkingItem = { checked: boolean; skillLevel: SkillLevel };

export default function ServicesSection({ staffId, staff }: { staffId: string; staff: StaffMember }) {
  const [services, setServices] = useState<Service[]>([]);
  const [working, setWorking] = useState<Record<string, WorkingItem>>({});
  const [saved, setSaved] = useState<Record<string, WorkingItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [svcRes, eligRes] = await Promise.all([
        fetch("/api/services?active=true"),
        fetch(`/api/staff/${staffId}/services`),
      ]);
      if (!svcRes.ok) throw new Error("Failed to load services");
      if (!eligRes.ok) throw new Error("Failed to load eligibility");
      const svcData = (await svcRes.json()) as { services: Service[] };
      const eligData = (await eligRes.json()) as { eligibility: EligibilityItem[] };

      setServices(svcData.services);

      // Build working state from current eligibility
      const map: Record<string, WorkingItem> = {};
      for (const s of svcData.services) {
        const elig = eligData.eligibility.find((e) => e.serviceId === s.id);
        map[s.id] = {
          checked: !!elig,
          skillLevel: (elig?.skillLevel as SkillLevel) || "stylist",
        };
      }
      setWorking(map);
      setSaved(JSON.parse(JSON.stringify(map)));
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, [staffId]);

  useEffect(() => { load(); }, [load]);

  const isDirty = useMemo(() => JSON.stringify(working) !== JSON.stringify(saved), [working, saved]);

  function toggle(serviceId: string) {
    setSaveMsg(null);
    setWorking((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], checked: !prev[serviceId].checked },
    }));
  }

  function setSkill(serviceId: string, level: SkillLevel) {
    setSaveMsg(null);
    setWorking((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], skillLevel: level },
    }));
  }

  async function handleSave() {
    setSaving(true); setSaveMsg(null);
    const items = Object.entries(working)
      .filter(([, v]) => v.checked)
      .map(([serviceId, v]) => ({ serviceId, skillLevel: v.skillLevel }));
    try {
      const res = await fetch(`/api/staff/${staffId}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
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
    const map: Record<string, Service[]> = {};
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
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading services...</p>
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
        <Scissors size={36} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No services yet</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          Create services first, then assign them to this stylist.
        </p>
        <Link href="/dashboard/services" className="btn btn-primary" style={{ textDecoration: "none" }}>
          Go to Services
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Service eligibility</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              Select which services {staff.name.split(" ")[0]} can perform
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
              disabled={!isDirty || saving}
              style={{ opacity: !isDirty || saving ? 0.5 : 1, fontSize: 13, height: 32, padding: "0 14px" }}
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
              const item = working[svc.id];
              if (!item) return null;
              return (
                <div
                  key={svc.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 24px", borderBottom: "1px solid var(--border)",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggle(svc.id)}
                    style={{
                      width: 20, height: 20, borderRadius: "var(--radius-sm)", flexShrink: 0,
                      border: item.checked ? "none" : "1.5px solid var(--border-strong)",
                      background: item.checked ? "var(--brand)" : "var(--bg-card)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 120ms",
                    }}
                    aria-label={`Toggle ${svc.name}`}
                  >
                    {item.checked && <Check size={13} strokeWidth={2.5} color="white" />}
                  </button>

                  {/* Service info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{svc.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                      ${svc.price.toFixed(2)} &middot; {svc.duration}min
                    </span>
                  </div>

                  {/* Skill level pills */}
                  {item.checked && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {SKILL_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSkill(svc.id, level)}
                          style={{
                            height: 24, padding: "0 8px", borderRadius: "var(--radius-sm)",
                            fontSize: 11, fontWeight: 600, cursor: "pointer",
                            border: "none", textTransform: "capitalize",
                            background: item.skillLevel === level ? "var(--brand-soft)" : "transparent",
                            color: item.skillLevel === level ? "var(--brand)" : "var(--text-muted)",
                            transition: "all 100ms",
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
