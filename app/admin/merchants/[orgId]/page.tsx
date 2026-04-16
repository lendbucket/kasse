"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Users, MapPin, CreditCard } from "lucide-react"

type OrgDetail = {
  id: string; name: string; slug: string; plan: string; planStatus: string;
  email: string | null; phone: string | null; createdAt: string; trialEndsAt: string | null;
  locations: Array<{ id: string; name: string; address: string | null; isActive: boolean }>
  users: Array<{ id: string; name: string | null; email: string; role: string; isActive: boolean; lastLoginAt: string | null }>
}

export default function MerchantDetailPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const [org, setOrg] = useState<OrgDetail | null>(null)

  useEffect(() => {
    fetch(`/api/admin/merchants/${orgId}`).then(r => r.json()).then(d => setOrg(d.organization)).catch(() => {})
  }, [orgId])

  if (!org) return <div style={{ padding: 32, color: "#8b949e" }}>Loading...</div>

  return (
    <div style={{ padding: 32 }}>
      <Link href="/admin/merchants" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#8b949e", textDecoration: "none", marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to merchants
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(96,110,116,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 size={24} strokeWidth={1.5} style={{ color: "#606e74" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: 0 }}>{org.name}</h1>
          <p style={{ fontSize: 13, color: "#8b949e", margin: "2px 0 0" }}>{org.slug} &middot; {org.plan} ({org.planStatus})</p>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { icon: CreditCard, label: "Plan", value: `${org.plan} (${org.planStatus})` },
          { icon: MapPin, label: "Locations", value: org.locations.length.toString() },
          { icon: Users, label: "Users", value: org.users.length.toString() },
        ].map(c => (
          <div key={c.label} style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <c.icon size={14} style={{ color: "#606e74" }} />
              <span style={{ fontSize: 12, color: "#8b949e" }}>{c.label}</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 600, color: "white", margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Users */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "white", margin: "0 0 12px" }}>Users</h2>
      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Name", "Email", "Role", "Status", "Last Login"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8b949e" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {org.users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 16px", fontSize: 14, color: "white" }}>{u.name || "\u2014"}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#8b949e" }}>{u.email}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#8b949e" }}>{u.role}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: u.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: u.isActive ? "#4ade80" : "#f87171" }}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#8b949e" }}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Locations */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "white", margin: "0 0 12px" }}>Locations</h2>
      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        {org.locations.length ? org.locations.map(l => (
          <div key={l.id} style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "white", margin: 0 }}>{l.name}</p>
              <p style={{ fontSize: 13, color: "#8b949e", margin: "2px 0 0" }}>{l.address || "No address"}</p>
            </div>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: l.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: l.isActive ? "#4ade80" : "#f87171" }}>
              {l.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        )) : (
          <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 14, color: "#484f58" }}>No locations</div>
        )}
      </div>
    </div>
  )
}
