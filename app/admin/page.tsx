"use client"

import { useState, useEffect } from "react"
import { Building2, Users, DollarSign, MapPin } from "lucide-react"

type Stats = {
  totalMerchants: number
  activeTrials: number
  mrr: number
  totalLocations: number
  recentSignups: Array<{ id: string; name: string; email: string; plan: string; createdAt: string }>
}

function KpiCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string
}) {
  return (
    <div style={{
      background: "#161b22", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, padding: "20px 24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: `${color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} strokeWidth={1.5} style={{ color }} />
        </div>
        <span style={{ fontSize: 13, color: "#8b949e" }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: "white", margin: 0 }}>{value}</p>
    </div>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 4px" }}>Platform Overview</h1>
      <p style={{ fontSize: 14, color: "#8b949e", margin: "0 0 32px" }}>Kasse admin dashboard</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <KpiCard icon={Building2} label="Total Merchants" value={stats?.totalMerchants ?? 0} color="#606e74" />
        <KpiCard icon={Users} label="Active Trials" value={stats?.activeTrials ?? 0} color="#3b82f6" />
        <KpiCard icon={DollarSign} label="MRR" value={`$${stats?.mrr?.toLocaleString() ?? 0}`} color="#22c55e" />
        <KpiCard icon={MapPin} label="Total Locations" value={stats?.totalLocations ?? 0} color="#f59e0b" />
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, color: "white", margin: "0 0 16px" }}>Recent signups</h2>
      <div style={{
        background: "#161b22", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Business", "Owner Email", "Plan", "Created"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats?.recentSignups?.length ? stats.recentSignups.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "white" }}>{s.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "#8b949e" }}>{s.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                    background: s.plan === "trial" ? "rgba(59,130,246,0.15)" : "rgba(34,197,94,0.15)",
                    color: s.plan === "trial" ? "#60a5fa" : "#4ade80",
                  }}>{s.plan}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={{ padding: "32px 16px", textAlign: "center", fontSize: 14, color: "#484f58" }}>
                  No merchants yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
