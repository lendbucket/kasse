"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Search, Plus, X, Eye, Pencil, Mail, Phone, User, Users } from "lucide-react";

type ClientListItem = { id: string; name: string; email: string | null; phone: string | null; notes: string | null; locationId: string; visitCount: number; lastVisit: string | null };
type AppointmentHistoryItem = { id: string; startTime: string; status: string; serviceName: string | null; price: number | null; staff: { name: string } | null };
type ClientDetail = { id: string; name: string; email: string | null; phone: string | null; notes: string | null; locationId: string; totalSpent: number; appointments: AppointmentHistoryItem[] };

const DATE_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" });
const DATETIME_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
function fmt(n: number) { return `$${n.toFixed(2)}`; }

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [locationId, setLocationId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { let c = false; (async () => { try { const r = await fetch("/api/services"); if (!r.ok) return; const d = (await r.json()) as { services: { locationId: string }[] }; if (!c && d.services[0]) setLocationId(d.services[0].locationId); } catch {} })(); return () => { c = true; }; }, []);

  const loadClients = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams(); if (query.trim()) p.set("q", query.trim()); if (locationId) p.set("locationId", locationId);
      const r = await fetch(`/api/clients?${p}`); if (!r.ok) throw new Error("Failed"); const d = (await r.json()) as { clients: ClientListItem[] }; setClients(d.clients);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); } finally { setLoading(false); }
  }, [query, locationId]);

  useEffect(() => { const t = setTimeout(() => loadClients(), 200); return () => clearTimeout(t); }, [loadClients]);

  const iS: React.CSSProperties = { width: "100%", height: 40, borderRadius: 6, border: "1px solid #e5e7eb", padding: "0 12px", fontSize: 16, color: "#111827", background: "white", outline: "none" };

  return (
    <>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>CLIENTS</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Clients</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} strokeWidth={1.5} /> Add Client</button>
      </div>

      <div style={{ padding: "16px 32px", borderBottom: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", width: 280 }}>
          <Search size={16} strokeWidth={1.5} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clients..." style={{ ...iS, height: 36, paddingLeft: 36, background: "#f7f8fa" }} />
        </div>
        <span style={{ fontSize: 13, color: "#9ca3af", marginLeft: "auto" }}>{clients.length} client{clients.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {loading ? <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ color: "#9ca3af" }}>Loading clients...</p></div>
        : error ? <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ color: "#dc2626" }}>{error}</p></div>
        : clients.length === 0 ? (
          <div className="card" style={{ padding: "64px 32px", textAlign: "center" }}>
            <Users size={40} strokeWidth={1.5} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>No clients yet</p>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Add your first client to get started</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Add Client</button>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="hidden lg:table">
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Visits</th><th>Last Visit</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#606E74,#4d5c62)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "white", flexShrink: 0 }}>{c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div></td>
                    <td style={{ fontFamily: "var(--font-fira), monospace", color: "#6b7280" }}>{c.phone || "\u2014"}</td>
                    <td style={{ color: "#6b7280" }}>{c.email || "\u2014"}</td>
                    <td style={{ fontWeight: 600 }}>{c.visitCount}</td>
                    <td style={{ fontSize: 13, fontFamily: "var(--font-fira), monospace", color: "#9ca3af" }}>{c.lastVisit ? DATE_FMT.format(new Date(c.lastVisit)) : "\u2014"}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <button onClick={() => { setEditMode(false); setOpenClientId(c.id); }} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 500, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} /> View</button>
                        <button onClick={() => { setEditMode(true); setOpenClientId(c.id); }} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 500, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} /> Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="lg:hidden" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              {clients.map((c) => (
                <div key={c.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{c.name}</p>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{c.phone && <span style={{ fontFamily: "var(--font-fira), monospace" }}>{c.phone}</span>}{c.email && <span style={{ marginLeft: 8 }}>{c.email}</span>}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", marginTop: 8 }}><span>{c.visitCount} visit{c.visitCount !== 1 ? "s" : ""}</span><span>{c.lastVisit ? DATE_FMT.format(new Date(c.lastVisit)) : "\u2014"}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && <NewClientModal locationId={locationId} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); loadClients(); }} />}
      {openClientId && <ClientDrawer clientId={openClientId} startInEdit={editMode} onClose={() => setOpenClientId(null)} onSaved={loadClients} />}
    </>
  );
}

function NewClientModal({ locationId, onClose, onCreated }: { locationId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false); const [err, setErr] = useState<string | null>(null);
  const iS: React.CSSProperties = { width: "100%", height: 40, borderRadius: 6, border: "1px solid #e5e7eb", padding: "0 12px", fontSize: 16, color: "#111827", background: "white", outline: "none" };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!name.trim() || submitting) return; if (!locationId) { setErr("No location"); return; }
    setSubmitting(true); setErr(null);
    try {
      const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined, notes: notes || undefined, locationId }) });
      if (!r.ok) { const d = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(d.error ?? "Create failed"); }
      onCreated();
    } catch (e) { setErr(e instanceof Error ? e.message : "Create failed"); } finally { setSubmitting(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 12, width: 480, maxWidth: "100%", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>New Client</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Name <span style={{ color: "#dc2626" }}>*</span></span><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" style={iS} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" style={iS} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Phone</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" style={{ ...iS, fontFamily: "var(--font-fira), monospace" }} /></label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Notes</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional" style={{ ...iS, height: "auto", padding: "10px 12px", resize: "none" }} /></label>
          {err && <p style={{ fontSize: 13, color: "#dc2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6, padding: "8px 12px" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!name.trim() || submitting} className="btn btn-primary" style={{ opacity: !name.trim() || submitting ? 0.5 : 1 }}>{submitting ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientDrawer({ clientId, startInEdit, onClose, onSaved }: { clientId: string; startInEdit: boolean; onClose: () => void; onSaved: () => void }) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState(startInEdit);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedId = useRef<string | null>(null);

  useEffect(() => {
    let c = false; setLoading(true); setErr(null);
    fetch(`/api/clients/${clientId}`).then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<{ client: ClientDetail }>; })
      .then((d) => { if (c) return; setDetail(d.client); setName(d.client.name); setEmail(d.client.email ?? ""); setPhone(d.client.phone ?? ""); setNotes(d.client.notes ?? ""); loadedId.current = clientId; })
      .catch((e) => { if (!c) setErr(e instanceof Error ? e.message : "Load failed"); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [clientId]);

  function onNotesChange(v: string) {
    setNotes(v); if (loadedId.current !== clientId) return;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => { setNotesSaving(true); try { await fetch(`/api/clients/${clientId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: v }) }); onSaved(); } finally { setNotesSaving(false); } }, 600);
  }

  async function saveFields() {
    if (!name.trim()) return;
    const r = await fetch(`/api/clients/${clientId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone }) });
    if (r.ok) { setEdit(false); onSaved(); const d = (await r.json()) as { client: ClientDetail }; setDetail((p) => (p ? { ...p, ...d.client } : p)); }
  }

  const iS: React.CSSProperties = { width: "100%", height: 40, borderRadius: 6, border: "1px solid #e5e7eb", padding: "0 12px", fontSize: 16, color: "#111827", background: "white", outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.3)" }} onClick={onClose}>
      <div style={{ width: 400, maxWidth: "100%", height: "100%", background: "white", borderLeft: "1px solid #e5e7eb", boxShadow: "-4px 0 24px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Client Details</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {loading && <p style={{ color: "#9ca3af" }}>Loading...</p>}
          {err && <p style={{ color: "#dc2626" }}>{err}</p>}
          {detail && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 20 }}>
                {edit ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={iS} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={iS} placeholder="Email" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...iS, fontFamily: "var(--font-fira), monospace" }} placeholder="Phone" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => { setEdit(false); setName(detail.name); setEmail(detail.email ?? ""); setPhone(detail.phone ?? ""); }} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                      <button type="button" onClick={saveFields} className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#606E74,#4d5c62)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "white" }}>{detail.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                        <div><p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>{detail.name}</p><p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{detail.appointments.length} visit{detail.appointments.length !== 1 ? "s" : ""}</p></div>
                      </div>
                      <button type="button" onClick={() => setEdit(true)} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 500, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Pencil size={12} /> Edit</button>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                      {detail.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6b7280" }}><Phone size={14} style={{ color: "#9ca3af" }} /><span style={{ fontFamily: "var(--font-fira), monospace" }}>{detail.phone}</span></div>}
                      {detail.email && <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6b7280" }}><Mail size={14} style={{ color: "#9ca3af" }} />{detail.email}</div>}
                    </div>
                  </>
                )}
              </div>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "16px 20px" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Spent</p>
                <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-fira), monospace", color: "#111827", margin: "4px 0 0" }}>{fmt(detail.totalSpent)}</p>
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Appointment History</h3>
                {detail.appointments.length === 0 ? <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "24px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No appointments</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{detail.appointments.map((a) => (
                  <div key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <div><p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0 }}>{a.serviceName || "Service"}</p><p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{DATETIME_FMT.format(new Date(a.startTime))}{a.staff?.name ? ` \u00b7 ${a.staff.name}` : ""}</p></div>
                    {a.price !== null && <span style={{ fontSize: 14, fontFamily: "var(--font-fira), monospace", color: "#6b7280" }}>{fmt(a.price)}</span>}
                  </div>
                ))}</div>}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</h3>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{notesSaving ? "Saving..." : "Auto-saves"}</span>
                </div>
                <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={5} placeholder="Add notes..." style={{ ...iS, height: "auto", padding: "10px 12px", resize: "none" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
