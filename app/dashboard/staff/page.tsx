"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Pencil, Power, Shield, Scissors, MapPin, X, Users, Settings, CalendarOff } from "lucide-react";

type Location = { id: string; name: string };
type Role = "manager" | "stylist";
type StaffMember = { id: string; name: string; email: string | null; phone: string | null; role: string; locationId: string; isActive: boolean; bookableByCustomers: boolean; location: { id: string; name: string } | null };

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; member: StaffMember }>({ open: false });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [sr, lr] = await Promise.all([fetch("/api/staff?active=all"), fetch("/api/locations")]);
      if (!sr.ok) throw new Error("Failed");
      const sd = (await sr.json()) as { staff: StaffMember[] };
      const ld = lr.ok ? ((await lr.json()) as { locations: Location[] }) : { locations: [] };
      setStaff(sd.staff); setLocations(ld.locations);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(m: StaffMember) {
    const next = !m.isActive; const prev = staff;
    setStaff((l) => l.map((s) => (s.id === m.id ? { ...s, isActive: next } : s)));
    try { const r = await fetch(`/api/staff/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: next }) }); if (!r.ok) throw new Error(); } catch { setStaff(prev); }
  }

  return (
    <>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>TEAM</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>Staff</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModalState({ open: true, mode: "create" })}><Plus size={16} strokeWidth={1.5} /> Add team member</button>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {loading ? <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ color: "var(--text-muted)" }}>Loading staff...</p></div>
        : error ? <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ color: "var(--error)" }}>{error}</p></div>
        : staff.length === 0 ? (
          <div className="card" style={{ padding: "64px 32px", textAlign: "center" }}>
            <Users size={40} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>No team members yet</p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>Add your first team member</p>
            <button className="btn btn-primary" onClick={() => setModalState({ open: true, mode: "create" })}>+ Add team member</button>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="hidden lg:table">
              <thead><tr><th>Name</th><th>Role</th><th>Location</th><th>Email</th><th>Phone</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "white", flexShrink: 0 }}>{s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                    </div></td>
                    <td><span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                      background: s.role === "manager" ? "var(--brand-soft)" : "rgba(0,0,0,0.04)",
                      color: s.role === "manager" ? "var(--brand)" : "var(--text-secondary)",
                      border: s.role === "manager" ? "1px solid var(--brand-ring)" : "1px solid rgba(0,0,0,0.1)",
                    }}>{s.role === "manager" ? <Shield size={11} /> : <Scissors size={11} />}{s.role === "manager" ? "Manager" : "Stylist"}</span></td>
                    <td style={{ color: "var(--text-secondary)" }}>{s.location?.name || "\u2014"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{s.email || "\u2014"}</td>
                    <td style={{ fontFamily: "var(--font-fira), monospace", color: "var(--text-secondary)" }}>{s.phone || "\u2014"}</td>
                    <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.isActive ? "var(--success)" : "var(--border-strong)", display: "inline-block" }} />
                      <span style={{ color: s.isActive ? "var(--success)" : "var(--text-muted)" }}>{s.isActive ? "Active" : "Inactive"}</span>
                      {!s.bookableByCustomers && (
                        <span title="Hidden from online booking" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8, padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                          <CalendarOff size={11} /> No online booking
                        </span>
                      )}
                    </span></td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <Link href={`/dashboard/staff/${s.id}`} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Settings size={12} /> Configure</Link>
                        <button onClick={() => setModalState({ open: true, mode: "edit", member: s })} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} /> Edit</button>
                        <button onClick={() => toggleActive(s)} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 12, fontWeight: 500, color: s.isActive ? "var(--error)" : "var(--success)", cursor: "pointer" }}>{s.isActive ? "Deactivate" : "Activate"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="lg:hidden" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              {staff.map((s) => (
                <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div><p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.role === "manager" ? "var(--brand-soft)" : "rgba(0,0,0,0.04)", color: s.role === "manager" ? "var(--brand)" : "var(--text-secondary)" }}>{s.role === "manager" ? "Manager" : "Stylist"}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: s.isActive ? "var(--success)" : "var(--text-muted)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: s.isActive ? "var(--success)" : "var(--border-strong)" }} />{s.isActive ? "Active" : "Inactive"}</span>
                        {!s.bookableByCustomers && (
                          <span title="Hidden from online booking" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                            <CalendarOff size={11} /> No online booking
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {s.location?.name && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}><MapPin size={12} />{s.location.name}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <Link href={`/dashboard/staff/${s.id}`} style={{ flex: 1, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Configure</Link>
                    <button onClick={() => setModalState({ open: true, mode: "edit", member: s })} style={{ flex: 1, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => toggleActive(s)} style={{ flex: 1, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontWeight: 500, color: s.isActive ? "var(--error)" : "var(--success)", cursor: "pointer" }}>{s.isActive ? "Deactivate" : "Activate"}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalState.open && <StaffModal mode={modalState.mode} member={modalState.mode === "edit" ? modalState.member : null} locations={locations} onClose={() => setModalState({ open: false })} onSaved={() => { setModalState({ open: false }); load(); }} />}
    </>
  );
}

function StaffModal({ mode, member, locations, onClose, onSaved }: { mode: "create" | "edit"; member: StaffMember | null; locations: Location[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(member?.name ?? ""); const [email, setEmail] = useState(member?.email ?? ""); const [phone, setPhone] = useState(member?.phone ?? "");
  const [role, setRole] = useState<Role>((member?.role as Role) === "manager" ? "manager" : "stylist");
  const [locationId, setLocationId] = useState(member?.locationId ?? locations[0]?.id ?? "");
  const [active, setActive] = useState(member?.isActive ?? true);
  const [bookable, setBookable] = useState(member?.bookableByCustomers ?? true);
  const [submitting, setSubmitting] = useState(false); const [err, setErr] = useState<string | null>(null);
  const iS: React.CSSProperties = { width: "100%", height: 40, borderRadius: 6, border: "1px solid var(--border)", padding: "0 12px", fontSize: 16, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none" };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!name.trim() || !locationId || submitting) return;
    setSubmitting(true); setErr(null);
    try {
      const r = await fetch(mode === "edit" ? `/api/staff/${member!.id}` : "/api/staff", { method: mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined, role, locationId, active, bookableByCustomers: bookable }) });
      if (!r.ok) { const d = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error ?? "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); } finally { setSubmitting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", borderRadius: 12, width: 480, maxWidth: "100%", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{mode === "edit" ? "Edit Staff" : "Add Team Member"}</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Name <span style={{ color: "var(--error)" }}>*</span></span><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" style={iS} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={iS} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Phone</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...iS, fontFamily: "var(--font-fira), monospace" }} /></label>
          <div><span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Role</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["manager", "stylist"] as Role[]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} style={{
                  height: 40, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 120ms",
                  border: role === r ? "1px solid var(--brand)" : "1px solid var(--border)",
                  background: role === r ? "var(--brand-soft)" : "var(--bg-card)",
                  color: role === r ? "var(--brand)" : "var(--text-secondary)",
                }}>{r === "manager" ? <Shield size={14} /> : <Scissors size={14} />}{r === "manager" ? "Manager" : "Stylist"}</button>
              ))}
            </div>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Location <span style={{ color: "var(--error)" }}>*</span></span>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)} required style={iS}><option value="">Select location</option>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
          </label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 16px" }}>
            <div><p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>Active</p><p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Inactive staff hidden from POS</p></div>
            <button type="button" role="switch" aria-checked={active} onClick={() => setActive((v) => !v)} style={{ position: "relative", width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", transition: "background 150ms", background: active ? "var(--success)" : "var(--border)" }}>
              <span style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 150ms", transform: active ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 16px" }}>
            <div><p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>Bookable online</p><p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Show on your public booking page</p></div>
            <button type="button" role="switch" aria-checked={bookable} onClick={() => setBookable((v) => !v)} style={{ position: "relative", width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", transition: "background 150ms", background: bookable ? "var(--success)" : "var(--border)" }}>
              <span style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 150ms", transform: bookable ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>
          {err && <p style={{ fontSize: 13, color: "var(--error)", background: "var(--error-soft)", border: "1px solid var(--error)", borderRadius: 6, padding: "8px 12px" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!name.trim() || !locationId || submitting} className="btn btn-primary" style={{ opacity: !name.trim() || !locationId || submitting ? 0.5 : 1 }}>{submitting ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
