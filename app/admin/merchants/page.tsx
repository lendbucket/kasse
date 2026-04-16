"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Plus } from "lucide-react"

type Merchant = {
  id: string; name: string; slug: string; plan: string; planStatus: string;
  createdAt: string; _count: { locations: number; users: number }
  users: Array<{ email: string; name: string | null }>
}

const statusColors: Record<string, { bg: string; text: string }> = {
  trial: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  active: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  suspended: { bg: "rgba(234,179,8,0.15)", text: "#facc15" },
  cancelled: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/merchants").then(r => r.json()).then(d => setMerchants(d.merchants || [])).catch(() => {})
  }, [])

  const filtered = merchants.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.users.some(u => u.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: 0 }}>Merchants</h1>
          <p style={{ fontSize: 14, color: "#8b949e", margin: "4px 0 0" }}>{merchants.length} total</p>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px",
          borderRadius: 8, background: "#606e74", color: "white", border: "none",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <Plus size={14} /> Add merchant
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#484f58" }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{
            width: "100%", height: 40, background: "#161b22", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8, padding: "0 12px 0 36px", fontSize: 14, color: "white", outline: "none",
          }} />
      </div>

      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Business Name", "Owner", "Plan", "Locations", "Status", "Created", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const sc = statusColors[m.planStatus] || statusColors.trial
              const owner = m.users[0]
              return (
                <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: "white" }}>{m.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{owner?.email || "\u2014"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text }}>{m.plan}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{m._count.locations}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text }}>{m.planStatus}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/admin/merchants/${m.id}`}
                      style={{ fontSize: 13, color: "#606e74", textDecoration: "none", fontWeight: 500 }}>View</Link>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", fontSize: 14, color: "#484f58" }}>No merchants found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
