"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Clock, Bell, Calendar, CheckCircle2, X, Users, AlertCircle } from "lucide-react"

type WaitlistItem = {
  id: string; clientName: string | null; serviceName: string | null; status: string; createdAt: string; notes: string | null
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/waitlist")
      if (res.ok) { const d = await res.json(); setEntries(d.entries || []) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const statusBadge = (s: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      waiting: { bg: "#f3f4f6", color: "#374151" },
      notified: { bg: "rgba(59,130,246,0.1)", color: "#2563eb" },
      booked: { bg: "rgba(34,197,94,0.1)", color: "#16a34a" },
      expired: { bg: "rgba(239,68,68,0.1)", color: "#dc2626" },
      cancelled: { bg: "rgba(156,163,175,0.1)", color: "#6b7280" },
    }
    const st = map[s] || map.waiting
    return <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: st.bg, color: st.color, textTransform: "capitalize" }}>{s}</span>
  }

  return (
    <>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>OPERATIONS</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Waitlist</h1>
        </div>
        <button style={{ height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
          <Plus size={14} /> Add to waitlist
        </button>
      </div>

      <div style={{ padding: "24px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Currently waiting", value: entries.filter((e) => e.status === "waiting").length.toString(), icon: Clock, color: "#606E74" },
            { label: "Notified today", value: entries.filter((e) => e.status === "notified").length.toString(), icon: Bell, color: "#2563eb" },
            { label: "Booked from waitlist", value: entries.filter((e) => e.status === "booked").length.toString(), icon: Calendar, color: "#16a34a" },
            { label: "Avg wait time", value: "\u2014", icon: Clock, color: "#d97706" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <s.icon size={16} style={{ color: s.color }} strokeWidth={1.5} />
                <span style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "var(--font-fira), monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Info bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(96,110,116,0.06)", border: "1px solid rgba(96,110,116,0.15)", borderRadius: 8, marginBottom: 20 }}>
          <AlertCircle size={16} style={{ color: "#606E74", flexShrink: 0 }} strokeWidth={1.5} />
          <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>Auto-notify is <strong>ON</strong> &mdash; clients are notified automatically when a matching slot opens. <a href="/dashboard/settings" style={{ color: "#606E74", fontWeight: 600, textDecoration: "none" }}>Configure in Settings</a></p>
        </div>

        {loading ? (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ color: "#9ca3af" }}>Loading...</p></div>
        ) : entries.length === 0 ? (
          <div className="card" style={{ padding: "64px 32px", textAlign: "center" }}>
            <Users size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Waitlist is empty</p>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Add clients to the waitlist when preferred slots aren&apos;t available</p>
            <button style={{ height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Add to waitlist</button>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                {["Client", "Service", "Added", "Status", "Notes", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{e.clientName || "\u2014"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280" }}>{e.serviceName || "\u2014"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af", fontFamily: "var(--font-fira), monospace" }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "12px 16px" }}>{statusBadge(e.status)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.notes || "\u2014"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ height: 28, padding: "0 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#2563eb", cursor: "pointer", background: "white", fontFamily: "inherit" }}>Notify</button>
                        <button style={{ height: 28, padding: "0 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#16a34a", cursor: "pointer", background: "white", fontFamily: "inherit" }}>Book</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
