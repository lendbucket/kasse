"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type FlagDetail = {
  id: string; key: string; description: string; defaultValue: boolean
  rolloutPct: number; overrides: Record<string, boolean>; isActive: boolean
  createdAt: string; updatedAt: string
  createdBy: { name: string | null; email: string } | null
  updatedBy: { name: string | null; email: string } | null
}

type AuditEntry = {
  id: string; changeType: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null
  reason: string | null; createdAt: string
  changedBy: { name: string | null; email: string } | null
}

const inputStyle = {
  height: 36, background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6, padding: "0 12px", fontSize: 13, color: "white", outline: "none",
} as const

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#8b949e", marginBottom: 4, display: "block" } as const

export default function FlagDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [flag, setFlag] = useState<FlagDetail | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [desc, setDesc] = useState("")
  const [defaultVal, setDefaultVal] = useState(false)
  const [rollout, setRollout] = useState(0)
  const [active, setActive] = useState(true)
  const [reason, setReason] = useState("")
  const [overrideOrg, setOverrideOrg] = useState("")
  const [overrideVal, setOverrideVal] = useState<"true" | "false" | "remove">("true")

  const load = useCallback(() => {
    fetch(`/api/admin/feature-flags/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.flag) {
          setFlag(d.flag)
          setDesc(d.flag.description)
          setDefaultVal(d.flag.defaultValue)
          setRollout(d.flag.rolloutPct)
          setActive(d.flag.isActive)
        }
        if (d.audit) setAudit(d.audit)
      })
      .catch(() => {})
  }, [id])

  useEffect(load, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/feature-flags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc, defaultValue: defaultVal,
          rolloutPct: rollout, isActive: active, reason: reason || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Save failed")
        return
      }
      setReason("")
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleOverride = async () => {
    if (!overrideOrg.trim()) return
    const res = await fetch(`/api/admin/feature-flags/${id}/overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: overrideOrg.trim(),
        value: overrideVal === "remove" ? null : overrideVal === "true",
        reason: reason || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(err.error || "Override failed")
      return
    }
    setOverrideOrg("")
    setReason("")
    load()
  }

  if (!flag) {
    return (
      <div style={{ padding: 32, color: "#8b949e" }}>Loading...</div>
    )
  }

  const overrides = (flag.overrides || {}) as Record<string, boolean>

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <Link href="/admin/feature-flags" style={{ display: "flex", alignItems: "center", gap: 6, color: "#8b949e", fontSize: 13, textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to flags
      </Link>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: 0 }}>
          <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6 }}>{flag.key}</code>
        </h1>
        <p style={{ fontSize: 13, color: "#484f58", margin: "6px 0 0" }}>
          Created {new Date(flag.createdAt).toLocaleDateString()} by {flag.createdBy?.email ?? "unknown"}
        </p>
      </div>

      {/* Edit section */}
      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description</label>
          <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Default Value</label>
            <button onClick={() => setDefaultVal(!defaultVal)} style={{
              ...inputStyle, width: "100%", cursor: "pointer", textAlign: "left",
              color: defaultVal ? "#4ade80" : "#f87171",
            }}>
              {defaultVal ? "true" : "false"}
            </button>
          </div>
          <div>
            <label style={labelStyle}>Rollout %</label>
            <input type="range" min={0} max={100} value={rollout} onChange={(e) => setRollout(Number(e.target.value))}
              style={{ width: "100%", marginTop: 8 }} />
            <span style={{ fontSize: 13, color: "#e6edf3" }}>{rollout}%</span>
          </div>
          <div>
            <label style={labelStyle}>Active (Kill Switch)</label>
            <button onClick={() => setActive(!active)} style={{
              ...inputStyle, width: "100%", cursor: "pointer", textAlign: "left",
              color: active ? "#4ade80" : "#f87171",
            }}>
              {active ? "ACTIVE" : "INACTIVE"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Reason (optional)</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you making this change?"
            style={{ ...inputStyle, width: "100%" }} />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={load} style={{
            height: 32, padding: "0 14px", borderRadius: 6, background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)", color: "#8b949e", fontSize: 13, cursor: "pointer",
          }}>
            Reset
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            height: 32, padding: "0 14px", borderRadius: 6, background: "#606e74",
            border: "none", color: "white", fontSize: 13, fontWeight: 600,
            cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
          }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Overrides section */}
      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: "0 0 12px" }}>
          Per-Org Overrides ({Object.keys(overrides).length})
        </h2>
        {Object.entries(overrides).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {Object.entries(overrides).map(([orgId, val]) => (
              <div key={orgId} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <code style={{ fontSize: 12, color: "#8b949e" }}>{orgId}</code>
                <span style={{
                  fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                  background: val ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: val ? "#4ade80" : "#f87171",
                }}>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Organization ID</label>
            <input type="text" value={overrideOrg} onChange={(e) => setOverrideOrg(e.target.value)}
              placeholder="org-id" style={{ ...inputStyle, width: "100%", fontFamily: "monospace" }} />
          </div>
          <div>
            <label style={labelStyle}>Value</label>
            <select value={overrideVal} onChange={(e) => setOverrideVal(e.target.value as "true" | "false" | "remove")}
              style={{ ...inputStyle, width: 100 }}>
              <option value="true">true</option>
              <option value="false">false</option>
              <option value="remove">remove</option>
            </select>
          </div>
          <button onClick={handleOverride} style={{
            height: 36, padding: "0 14px", borderRadius: 6, background: "#606e74",
            border: "none", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Set
          </button>
        </div>
      </div>

      {/* Audit log */}
      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: "0 0 12px" }}>
          Audit Log ({audit.length})
        </h2>
        {audit.length === 0 ? (
          <p style={{ color: "#484f58", fontSize: 13 }}>No changes recorded.</p>
        ) : (
          <div>
            {audit.map((entry) => (
              <div key={entry.id} style={{
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                    background: "rgba(59,130,246,0.15)", color: "#60a5fa",
                  }}>
                    {entry.changeType}
                  </span>
                  <span style={{ fontSize: 12, color: "#484f58" }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#8b949e" }}>
                  by {entry.changedBy?.email ?? "unknown"}
                  {entry.reason && <span style={{ color: "#606e74" }}> &mdash; {entry.reason}</span>}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  {entry.before && (
                    <pre style={{ fontSize: 11, color: "#f87171", background: "rgba(239,68,68,0.08)", padding: "4px 8px", borderRadius: 4, margin: 0, flex: 1, overflow: "auto", maxHeight: 80 }}>
                      {JSON.stringify(entry.before, null, 2)}
                    </pre>
                  )}
                  {entry.after && (
                    <pre style={{ fontSize: 11, color: "#4ade80", background: "rgba(34,197,94,0.08)", padding: "4px 8px", borderRadius: 4, margin: 0, flex: 1, overflow: "auto", maxHeight: 80 }}>
                      {JSON.stringify(entry.after, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
