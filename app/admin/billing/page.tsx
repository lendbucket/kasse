"use client"

import { DollarSign, AlertCircle, Calendar } from "lucide-react"

export default function AdminBillingPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 4px" }}>Billing</h1>
      <p style={{ fontSize: 14, color: "#8b949e", margin: "0 0 32px" }}>Platform billing overview</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { icon: DollarSign, label: "MRR", value: "$0", color: "#22c55e" },
          { icon: Calendar, label: "Upcoming Renewals", value: "0", color: "#3b82f6" },
          { icon: AlertCircle, label: "Failed Payments", value: "0", color: "#ef4444" },
        ].map(c => (
          <div key={c.label} style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <c.icon size={16} style={{ color: c.color }} />
              <span style={{ fontSize: 13, color: "#8b949e" }}>{c.label}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: "white", margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "32px", textAlign: "center" }}>
        <DollarSign size={32} style={{ color: "#484f58", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: "#8b949e" }}>Billing data will appear here once merchants are on paid plans.</p>
      </div>
    </div>
  )
}
