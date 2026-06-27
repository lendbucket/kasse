"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Check, X } from "lucide-react";

interface Location {
  id: string; name: string; address: string | null; city: string | null; state: string | null;
  zip: string | null; phone: string | null; email: string | null; timezone: string; isActive: boolean; bookingSlug: string | null;
}
type Draft = { name: string; address: string; city: string; state: string; zip: string; phone: string; email: string; timezone: string; isActive: boolean };

const TIMEZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu"];
const toDraft = (l: Location): Draft => ({ name: l.name, address: l.address ?? "", city: l.city ?? "", state: l.state ?? "", zip: l.zip ?? "", phone: l.phone ?? "", email: l.email ?? "", timezone: l.timezone, isActive: l.isActive });

const card: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 8, background: "white", marginBottom: 16 };
const label: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" };
const input: React.CSSProperties = { width: "100%", height: 40, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 12px", fontSize: 15, color: "#111827", outline: "none", fontFamily: "inherit", background: "white" };
const primaryBtn: React.CSSProperties = { height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 };
const ghostBtn: React.CSSProperties = { height: 36, padding: "0 16px", background: "white", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 };

export default function LocationsSection() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  async function load() {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/locations");
      if (!r.ok) throw new Error("Failed to load locations");
      const d = await r.json();
      setLocations(d.locations ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function startEdit(l: Location) { setEditId(l.id); setDraft(toDraft(l)); setError(null); }
  function cancelEdit() { setEditId(null); setDraft(null); }

  async function save(id: string) {
    if (!draft) return;
    if (!draft.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError(null);
    try {
      const r = await fetch(`/api/locations/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name.trim(), address: draft.address, city: draft.city, state: draft.state, zip: draft.zip, phone: draft.phone, email: draft.email, timezone: draft.timezone, isActive: draft.isActive }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error === "FORBIDDEN" ? "You don't have permission to edit locations" : (e?.error || "Save failed")); }
      const d = await r.json();
      setLocations((prev) => prev.map((l) => (l.id === id ? d.location : l)));
      cancelEdit();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function addLocation() {
    if (!newName.trim()) return;
    setSaving(true); setError(null);
    try {
      const r = await fetch("/api/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim() }) });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        if (r.status === 402) throw new Error("Your plan's location limit has been reached — upgrade to add more.");
        throw new Error(e?.error === "FORBIDDEN" ? "You don't have permission to add locations" : (e?.error || "Could not add location"));
      }
      const d = await r.json();
      setLocations((prev) => [...prev, d.location].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName(""); setAdding(false);
      startEdit(d.location);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add location"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Locations</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Manage your salon locations, contact details, and time zone.</p>
        </div>
        {!adding && <button style={primaryBtn} onClick={() => { setAdding(true); setError(null); }}><Plus size={15} strokeWidth={2} /> Add location</button>}
      </div>

      {error && <div style={{ padding: "10px 14px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {adding && (
        <div style={{ ...card, padding: 16 }}>
          <label style={label}>New location name</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input autoFocus style={input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Downtown" onKeyDown={(e) => e.key === "Enter" && addLocation()} />
            <button style={primaryBtn} disabled={saving || !newName.trim()} onClick={addLocation}><Check size={15} /> {saving ? "Creating…" : "Create"}</button>
            <button style={ghostBtn} onClick={() => { setAdding(false); setNewName(""); }}><X size={15} /> Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading locations…</p>
      ) : locations.length === 0 && !adding ? (
        <div style={{ ...card, padding: "40px 20px", textAlign: "center" }}>
          <MapPin size={28} style={{ color: "#d1d5db", margin: "0 auto 10px" }} strokeWidth={1.5} />
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>No locations yet. Add your first to get started.</p>
        </div>
      ) : (
        locations.map((l) => {
          const editing = editId === l.id && draft;
          return (
            <div key={l.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: editing ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={18} style={{ color: "#606E74" }} strokeWidth={1.8} />
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>{l.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9ca3af" }}>{[l.city, l.state].filter(Boolean).join(", ") || "No address set"}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: l.isActive ? "rgba(34,197,94,0.1)" : "rgba(156,163,175,0.15)", color: l.isActive ? "#16a34a" : "#6b7280" }}>{l.isActive ? "Active" : "Inactive"}</span>
                </div>
                {!editing && <button style={{ color: "#606E74", background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => startEdit(l)}><Pencil size={14} /> Edit</button>}
              </div>

              {editing && (
                <div style={{ padding: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ gridColumn: "1 / -1" }}><label style={label}>Name</label><input style={input} value={draft!.name} onChange={(e) => setDraft({ ...draft!, name: e.target.value })} /></div>
                    <div style={{ gridColumn: "1 / -1" }}><label style={label}>Street address</label><input style={input} value={draft!.address} onChange={(e) => setDraft({ ...draft!, address: e.target.value })} /></div>
                    <div><label style={label}>City</label><input style={input} value={draft!.city} onChange={(e) => setDraft({ ...draft!, city: e.target.value })} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div><label style={label}>State</label><input style={input} value={draft!.state} onChange={(e) => setDraft({ ...draft!, state: e.target.value })} /></div>
                      <div><label style={label}>ZIP</label><input style={input} value={draft!.zip} onChange={(e) => setDraft({ ...draft!, zip: e.target.value })} /></div>
                    </div>
                    <div><label style={label}>Phone</label><input style={input} value={draft!.phone} onChange={(e) => setDraft({ ...draft!, phone: e.target.value })} /></div>
                    <div><label style={label}>Email</label><input style={input} value={draft!.email} onChange={(e) => setDraft({ ...draft!, email: e.target.value })} /></div>
                    <div><label style={label}>Time zone</label>
                      <select style={{ ...input, padding: "0 10px" }} value={draft!.timezone} onChange={(e) => setDraft({ ...draft!, timezone: e.target.value })}>
                        {!TIMEZONES.includes(draft!.timezone) && <option value={draft!.timezone}>{draft!.timezone}</option>}
                        {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151", cursor: "pointer" }}>
                        <input type="checkbox" checked={draft!.isActive} onChange={(e) => setDraft({ ...draft!, isActive: e.target.checked })} style={{ width: 16, height: 16 }} /> Active (accepting business)
                      </label>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                    <button style={primaryBtn} disabled={saving} onClick={() => save(l.id)}><Check size={15} /> {saving ? "Saving…" : "Save changes"}</button>
                    <button style={ghostBtn} disabled={saving} onClick={cancelEdit}><X size={15} /> Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
