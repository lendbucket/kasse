/**
 * Admin / Command Center pages intentionally use a dark theme (GitHub-style
 * palette: #161b22 / #0d1117 / #8b949e) to visually distinguish platform-admin
 * surfaces from the Kasse main app's light theme (#f7f8fa / #ffffff / #606E74).
 *
 * Rationale: SUPERADMIN users frequently switch between admin and tenant views;
 * the visual contrast prevents accidental cross-context actions. This is a
 * deliberate design system carve-out, not a violation.
 *
 * If admin UI tokens are extracted to a shared file in a future PR, this
 * comment can move there.
 */
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Plus, Flag } from "lucide-react"

type FlagRow = {
  id: string
  key: string
  description: string
  defaultValue: boolean
  rolloutPct: number
  isActive: boolean
  updatedAt: string
  overrides: Record<string, boolean>
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)

  const load = () => {
    fetch("/api/admin/feature-flags")
      .then((r) => r.json())
      .then((d) => setFlags(d.flags || []))
      .catch(() => {})
  }

  useEffect(load, [])

  const filtered = flags.filter(
    (f) =>
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreate = async () => {
    if (!newKey.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), description: newDesc.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Failed to create flag")
        return
      }
      setNewKey("")
      setNewDesc("")
      setShowCreate(false)
      load()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: 0 }}>Feature Flags</h1>
          <p style={{ fontSize: 14, color: "#8b949e", margin: "4px 0 0" }}>
            {flags.length} total &middot; {flags.filter((f) => f.isActive).length} active
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px",
            borderRadius: 8, background: "#606e74", color: "white", border: "none",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Plus size={14} /> New flag
        </button>
      </div>

      {showCreate && (
        <div style={{
          background: "#161b22", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: 20, marginBottom: 16,
        }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <input
              type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)}
              placeholder="flag-key (kebab-case)"
              style={{
                flex: 1, height: 36, background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, padding: "0 12px", fontSize: 13, color: "white", outline: "none",
                fontFamily: "monospace",
              }}
            />
            <input
              type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description"
              style={{
                flex: 2, height: 36, background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, padding: "0 12px", fontSize: 13, color: "white", outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowCreate(false)}
              style={{
                height: 32, padding: "0 14px", borderRadius: 6, background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)", color: "#8b949e", fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate} disabled={creating || !newKey.trim()}
              style={{
                height: 32, padding: "0 14px", borderRadius: 6, background: "#606e74",
                border: "none", color: "white", fontSize: 13, fontWeight: 600,
                cursor: creating ? "wait" : "pointer", opacity: creating ? 0.6 : 1,
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#484f58" }} />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search flags..."
          style={{
            width: "100%", height: 40, background: "#161b22",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
            padding: "0 12px 0 36px", fontSize: 14, color: "white", outline: "none",
          }}
        />
      </div>

      <div style={{
        background: "#161b22", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Key", "Description", "Default", "Rollout %", "Overrides", "Active", "Updated", ""].map((h) => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600,
                  color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <code style={{ fontSize: 13, color: "#e6edf3", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                    {f.key}
                  </code>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.description}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                    background: f.defaultValue ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: f.defaultValue ? "#4ade80" : "#f87171",
                  }}>
                    {f.defaultValue ? "true" : "false"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{f.rolloutPct}%</td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>
                  {Object.keys(f.overrides || {}).length}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                    background: f.isActive ? "#4ade80" : "#484f58",
                  }} />
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>
                  {new Date(f.updatedAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Link
                    href={`/admin/feature-flags/${f.id}`}
                    style={{ fontSize: 13, color: "#606e74", textDecoration: "none", fontWeight: 500 }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", fontSize: 14, color: "#484f58" }}>
                  <Flag size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
                  No flags found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
