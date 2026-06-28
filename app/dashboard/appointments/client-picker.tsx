"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Plus, X, Check } from "lucide-react";

type ClientLite = { id: string; name: string; email?: string | null; phone?: string | null; visitCount?: number; lastVisit?: string | null };

export default function ClientPicker({
  locationId, value, onChange,
}: {
  locationId: string;
  value: { id: string; name: string } | null;
  onChange: (c: { id: string; name: string } | null) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) return;
    const term = q.trim();
    if (term.length < 1) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const p = new URLSearchParams({ q: term });
        if (locationId) p.set("locationId", locationId);
        const r = await fetch(`/api/clients?${p}`);
        const d = await r.json();
        setResults(Array.isArray(d.clients) ? d.clients : []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, locationId, value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (boxRef.current && !boxRef.current.contains(e.target as Node)) { setOpen(false); setCreating(false); } }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function createClient() {
    const name = q.trim();
    if (!name) return;
    setErr(null);
    try {
      const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone: newPhone || undefined, email: newEmail || undefined, locationId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Create failed");
      onChange({ id: d.client.id, name: d.client.name });
      setOpen(false); setCreating(false); setQ(""); setNewPhone(""); setNewEmail("");
    } catch (e) { setErr(e instanceof Error ? e.message : "Create failed"); }
  }

  const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: 6, border: "1px solid var(--border)", padding: "0 12px", fontSize: 16, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none" };

  if (value) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 40, borderRadius: 6, border: "1px solid var(--border)", padding: "0 8px 0 12px", background: "var(--bg-card)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{value.name.slice(0, 1).toUpperCase()}</span>
          <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value.name}</span>
        </span>
        <button type="button" onClick={() => { onChange(null); setQ(""); }} aria-label="Clear client" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4, flexShrink: 0 }}><X size={16} /></button>
      </div>
    );
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={15} strokeWidth={1.5} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input type="text" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); setCreating(false); }} onFocus={() => setOpen(true)} placeholder="Search clients or leave blank for walk-in" style={{ ...inputStyle, paddingLeft: 34 }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: 44, left: 0, right: 0, zIndex: 20, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(2,6,23,0.12)", maxHeight: 280, overflowY: "auto" }}>
          {loading && <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-muted)" }}>Searching…</div>}
          {!loading && results.map((c) => (
            <button key={c.id} type="button" onClick={() => { onChange({ id: c.id, name: c.name }); setOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", gap: 8 }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--brand-soft)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{c.name.slice(0, 1).toUpperCase()}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  {(c.phone || c.email) && <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.phone || c.email}</span>}
                </span>
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>{c.visitCount ? `${c.visitCount} visit${c.visitCount === 1 ? "" : "s"}` : "New"}</span>
            </button>
          ))}
          {!loading && q.trim() && !creating && (
            <button type="button" onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", border: "none", borderTop: results.length ? "1px solid var(--border)" : "none", background: "transparent", cursor: "pointer", color: "var(--brand)", fontSize: 13, fontWeight: 600 }}>
              <Plus size={15} strokeWidth={2} /> Create &ldquo;{q.trim()}&rdquo;
            </button>
          )}
          {creating && (
            <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone (optional)" style={inputStyle} />
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email (optional)" style={inputStyle} />
              {err && <span style={{ fontSize: 12, color: "var(--error)" }}>{err}</span>}
              <button type="button" onClick={createClient} className="btn btn-primary" style={{ height: 36 }}><Check size={15} /> Add client</button>
            </div>
          )}
          {!loading && !q.trim() && results.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-muted)" }}>Type a name to search, or leave blank for a walk-in.</div>
          )}
        </div>
      )}
    </div>
  );
}
