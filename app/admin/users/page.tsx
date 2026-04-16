"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"

type AdminUser = {
  id: string; name: string | null; email: string; role: string;
  isActive: boolean; lastLoginAt: string | null; createdAt: string;
  organization: { name: string } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {})
  }, [])

  const filtered = users.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleUser(userId: string, isActive: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !isActive } : u))
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 4px" }}>Users</h1>
      <p style={{ fontSize: 14, color: "#8b949e", margin: "0 0 24px" }}>All users across all organizations</p>

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
              {["Name", "Email", "Role", "Organization", "Last Login", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8b949e", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 16px", fontSize: 14, color: "white" }}>{u.name || "\u2014"}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "rgba(96,110,116,0.15)", color: "#8b949e" }}>{u.role}</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{u.organization?.name || "\u2014"}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: u.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: u.isActive ? "#4ade80" : "#f87171" }}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => toggleUser(u.id, u.isActive)}
                    style={{ fontSize: 13, color: u.isActive ? "#f87171" : "#4ade80", background: "none", border: "none", cursor: "pointer" }}>
                    {u.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", fontSize: 14, color: "#484f58" }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
