"use client"

import { useState } from "react"
import {
  Plus, Megaphone, Star, Clock, Gift, Calendar, AlertCircle, RefreshCw, Heart,
  Mail, MessageSquare, Play, Pause, BarChart2, Users, MousePointer,
} from "lucide-react"

const AUTOMATIONS = [
  { id: "post_visit", icon: Star, title: "Post-visit follow-up", desc: "Send a thank you + review request 2 hours after appointment", channel: "SMS + Email", isActive: false, color: "#16a34a" },
  { id: "lapsed_client", icon: Clock, title: "Win back lapsed clients", desc: "Remind clients who haven't visited in 60+ days", channel: "SMS + Email", isActive: false, color: "#d97706" },
  { id: "birthday", icon: Gift, title: "Birthday greeting", desc: "Send birthday wishes with a special offer", channel: "SMS", isActive: false, color: "#2563eb" },
  { id: "appointment_reminder", icon: Calendar, title: "Appointment reminder", desc: "Remind clients 24 hours before their appointment", channel: "SMS + Email", isActive: true, color: "#606E74" },
  { id: "abandoned_booking", icon: AlertCircle, title: "Abandoned booking recovery", desc: "Follow up when a client starts but doesn't complete booking", channel: "SMS", isActive: false, color: "#dc2626" },
  { id: "rebook_reminder", icon: RefreshCw, title: "Rebook reminder", desc: "Suggest rebooking 3 weeks after last visit", channel: "SMS", isActive: false, color: "#7c3aed" },
  { id: "anniversary", icon: Heart, title: "Client anniversary", desc: "Celebrate the anniversary of their first visit each year", channel: "Email", isActive: false, color: "#e11d48" },
]

export default function MarketingPage() {
  const [tab, setTab] = useState("campaigns")
  const [automations, setAutomations] = useState(AUTOMATIONS)

  function toggleAutomation(id: string) {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, isActive: !a.isActive } : a))
  }

  return (
    <>
      <div style={{ padding: "28px 32px 0", borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>GROWTH</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Marketing</h1>
          </div>
          <button style={{ height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Plus size={14} /> Create campaign
          </button>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {["campaigns", "automations", "segments", "analytics"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 20px", fontSize: 13, fontWeight: tab === t ? 600 : 500,
              color: tab === t ? "#606E74" : "#6b7280", background: "transparent", border: "none",
              borderBottom: tab === t ? "2px solid #606E74" : "2px solid transparent",
              cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {tab === "campaigns" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total sent", value: "0", icon: Mail },
                { label: "Open rate", value: "0%", icon: MousePointer },
                { label: "Click rate", value: "0%", icon: MousePointer },
                { label: "Revenue", value: "$0", icon: BarChart2 },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <s.icon size={16} style={{ color: "#9ca3af" }} strokeWidth={1.5} />
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "var(--font-fira), monospace" }}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
              <Megaphone size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>No campaigns yet</p>
              <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Create your first campaign to start engaging clients</p>
              <button style={{ height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>+ Create campaign</button>
            </div>
          </>
        )}

        {tab === "automations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {automations.map((a) => {
              const Icon = a.icon
              return (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "20px 24px", border: "1px solid #e5e7eb",
                  borderRadius: 10, borderLeft: a.isActive ? `3px solid #16a34a` : "3px solid transparent",
                  backgroundColor: a.isActive ? "rgba(22,163,74,0.02)" : "white",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={20} style={{ color: a.color }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#111827" }}>{a.title}</p>
                      <p style={{ margin: "0 0 6px", fontSize: 13, color: "#6b7280" }}>{a.desc}</p>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280" }}>{a.channel}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button style={{ fontSize: 13, color: "#606E74", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Edit</button>
                    <button onClick={() => toggleAutomation(a.id)} className="cursor-pointer" style={{
                      width: 44, height: 24, borderRadius: 12, border: "none",
                      background: a.isActive ? "#16a34a" : "#d1d5db", position: "relative", transition: "background 200ms",
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: a.isActive ? 23 : 3, transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === "segments" && (
          <div>
            <button style={{ height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>+ Create segment</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["All clients", "New clients (first visit < 30 days)", "VIP clients (spent > $500)", "Lapsed (no visit 60+ days)", "Birthday this month"].map((seg) => (
                <div key={seg} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Users size={16} style={{ color: "#9ca3af" }} strokeWidth={1.5} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{seg}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>0 clients</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <BarChart2 size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Marketing analytics</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Data will appear once you start sending campaigns.</p>
          </div>
        )}
      </div>
    </>
  )
}
