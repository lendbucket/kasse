"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Pencil, Power, Tag, X } from "lucide-react";

type Location = { id: string; name: string };
type Service = { id: string; name: string; price: number; duration: number; category: string | null; locationId: string; active: boolean };

const ALL_CAT = "All";
const CAT_SUGGEST = ["Hair", "Color", "Treatment", "Nails", "Waxing", "Other"];
function fmt(n: number) { return `$${n.toFixed(2)}`; }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(ALL_CAT);
  const [modalState, setModalState] = useState<{ open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; service: Service }>({ open: false });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sr, lr] = await Promise.all([fetch("/api/services?active=all"), fetch("/api/locations")]);
      if (!sr.ok) throw new Error("Failed");
      const sd = (await sr.json()) as { services: Service[] };
      const ld = lr.ok ? ((await lr.json()) as { locations: Location[] }) : { locations: [] };
      setServices(sd.services); setLocations(ld.locations);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => { const s = new Set<string>(); services.forEach((sv) => { if (sv.category) s.add(sv.category); }); return [ALL_CAT, ...Array.from(s).sort()]; }, [services]);
  const filtered = useMemo(() => category === ALL_CAT ? services : services.filter((s) => s.category === category), [services, category]);

  async function toggleActive(svc: Service) {
    const next = !svc.active; const prev = services;
    setServices((l) => l.map((s) => (s.id === svc.id ? { ...s, active: next } : s)));
    try { const r = await fetch(`/api/services/${svc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: next }) }); if (!r.ok) throw new Error(); } catch { setServices(prev); }
  }

  return (
    <>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>SERVICES</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Services &amp; items</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModalState({ open: true, mode: "create" })}><Plus size={16} strokeWidth={1.5} /> Create service</button>
      </div>

      {/* Category tabs */}
      <div style={{ padding: "12px 32px", borderBottom: "1px solid #e5e7eb", background: "white", display: "flex", gap: 8, overflowX: "auto" }}>
        {categories.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)} style={{
            height: 28, padding: "0 12px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 120ms",
            border: c === category ? "1px solid #606E74" : "1px solid #e5e7eb",
            background: c === category ? "#606E74" : "white", color: c === category ? "white" : "#6b7280",
          }}>{c}</button>
        ))}
      </div>

      <div style={{ padding: "24px 32px" }}>
        {loading ? <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ color: "#9ca3af" }}>Loading services...</p></div>
        : error ? <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ color: "#dc2626" }}>{error}</p></div>
        : filtered.length === 0 ? (
          <div className="card" style={{ padding: "64px 32px", textAlign: "center" }}>
            <Tag size={40} strokeWidth={1.5} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>No services yet</p>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Add your first service to get started</p>
            <button className="btn btn-primary" onClick={() => setModalState({ open: true, mode: "create" })}>+ Create service</button>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="hidden lg:table">
              <thead><tr><th>Name</th><th>Category</th><th>Duration</th><th>Price</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.category ? <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, background: "rgba(96,110,116,0.08)", color: "#606E74" }}>{s.category}</span> : "\u2014"}</td>
                    <td style={{ fontFamily: "var(--font-fira), monospace", color: "#6b7280" }}>{s.duration} min</td>
                    <td style={{ fontFamily: "var(--font-fira), monospace", fontWeight: 700 }}>{fmt(s.price)}</td>
                    <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.active ? "#16a34a" : "#d1d5db" }} />
                      <span style={{ color: s.active ? "#16a34a" : "#9ca3af" }}>{s.active ? "Active" : "Inactive"}</span>
                    </span></td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <button onClick={() => setModalState({ open: true, mode: "edit", service: s })} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 500, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} /> Edit</button>
                        <button onClick={() => toggleActive(s)} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 500, color: s.active ? "#dc2626" : "#16a34a", cursor: "pointer" }}>{s.active ? "Deactivate" : "Activate"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="lg:hidden" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              {filtered.map((s) => (
                <div key={s.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div><p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{s.name}</p>{s.category && <span style={{ fontSize: 12, color: "#606E74" }}>{s.category}</span>}</div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: s.active ? "#16a34a" : "#9ca3af" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: s.active ? "#16a34a" : "#d1d5db" }} />{s.active ? "Active" : "Inactive"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--font-fira), monospace", fontSize: 14 }}><span style={{ fontWeight: 700, color: "#111827" }}>{fmt(s.price)}</span><span style={{ color: "#6b7280" }}>{s.duration} min</span></div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <button onClick={() => setModalState({ open: true, mode: "edit", service: s })} style={{ flex: 1, height: 32, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 500, color: "#6b7280", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => toggleActive(s)} style={{ flex: 1, height: 32, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 500, color: s.active ? "#dc2626" : "#16a34a", cursor: "pointer" }}>{s.active ? "Deactivate" : "Activate"}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalState.open && <ServiceModal mode={modalState.mode} service={modalState.mode === "edit" ? modalState.service : null} locations={locations} onClose={() => setModalState({ open: false })} onSaved={() => { setModalState({ open: false }); load(); }} />}
    </>
  );
}

function ServiceModal({ mode, service, locations, onClose, onSaved }: { mode: "create" | "edit"; service: Service | null; locations: Location[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(service?.name ?? ""); const [cat, setCat] = useState(service?.category ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : ""); const [duration, setDuration] = useState(service ? String(service.duration) : "");
  const [locationId, setLocationId] = useState(service?.locationId ?? locations[0]?.id ?? "");
  const [active, setActive] = useState(service?.active ?? true);
  const [submitting, setSubmitting] = useState(false); const [err, setErr] = useState<string | null>(null);
  const iS: React.CSSProperties = { width: "100%", height: 40, borderRadius: 6, border: "1px solid #e5e7eb", padding: "0 12px", fontSize: 16, color: "#111827", background: "white", outline: "none" };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pN = parseFloat(price); const dN = parseInt(duration, 10);
    if (!name.trim() || !locationId || submitting) return;
    if (!Number.isFinite(pN) || pN < 0) { setErr("Invalid price"); return; }
    if (!Number.isFinite(dN) || dN <= 0) { setErr("Invalid duration"); return; }
    setSubmitting(true); setErr(null);
    try {
      const r = await fetch(mode === "edit" ? `/api/services/${service!.id}` : "/api/services", { method: mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category: cat || null, price: pN, duration: dN, locationId, active }) });
      if (!r.ok) { const d = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error ?? "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); } finally { setSubmitting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 12, width: 480, maxWidth: "100%", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{mode === "edit" ? "Edit Service" : "Create Service"}</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Name <span style={{ color: "#dc2626" }}>*</span></span><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Haircut" style={iS} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Category</span><input type="text" value={cat} onChange={(e) => setCat(e.target.value)} list="cat-suggest" placeholder="Hair" style={iS} /><datalist id="cat-suggest">{CAT_SUGGEST.map((c) => <option key={c} value={c} />)}</datalist></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Price ($) <span style={{ color: "#dc2626" }}>*</span></span><input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" style={{ ...iS, fontFamily: "var(--font-fira), monospace" }} /></label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Duration (min) <span style={{ color: "#dc2626" }}>*</span></span><input type="number" min="1" step="1" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} required placeholder="45" style={{ ...iS, fontFamily: "var(--font-fira), monospace" }} /></label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Location <span style={{ color: "#dc2626" }}>*</span></span><select value={locationId} onChange={(e) => setLocationId(e.target.value)} required style={iS}><option value="">Select location</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", borderRadius: 6, padding: "12px 16px" }}>
            <div><p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0 }}>Active</p><p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Inactive services hidden from POS</p></div>
            <button type="button" role="switch" aria-checked={active} onClick={() => setActive((v) => !v)} style={{ position: "relative", width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", transition: "background 150ms", background: active ? "#16a34a" : "#e5e7eb" }}>
              <span style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 150ms", transform: active ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>
          {err && <p style={{ fontSize: 13, color: "#dc2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "8px 12px" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!name.trim() || !locationId || submitting} className="btn btn-primary" style={{ opacity: !name.trim() || !locationId || submitting ? 0.5 : 1 }}>{submitting ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
