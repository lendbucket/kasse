/**
 * Admin audit log viewer. SUPERADMIN-only (enforced by /admin layout).
 * Same dark theme as /admin/feature-flags per KASSE_DESIGN_SYSTEM.md.
 */
"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react"

type AuditRow = {
  id: string
  userId: string | null
  organizationId: string | null
  action: string
  entity: string | null
  entityId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  changedFields: string[]
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
  route: string | null
  createdAt: string
}

type PageData = {
  rows: AuditRow[]
  total: number
  hasMore: boolean
}

const PAGE_SIZE = 50

const inputStyle: React.CSSProperties = {
  height: 32, background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6, padding: "0 10px", fontSize: 12, color: "white", outline: "none",
  width: "100%",
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "#8b949e", fontWeight: 600, textTransform: "uppercase" as const,
  letterSpacing: "0.05em", marginBottom: 4, display: "block",
}

export default function AuditLogsPage() {
  const [data, setData] = useState<PageData>({ rows: [], total: 0, hasMore: false })
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filters
  const [orgId, setOrgId] = useState("")
  const [userId, setUserId] = useState("")
  const [entity, setEntity] = useState("")
  const [entityId, setEntityId] = useState("")
  const [action, setAction] = useState("")
  const [actionPrefix, setActionPrefix] = useState("")
  const [requestId, setRequestId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (orgId) p.set("organizationId", orgId)
    if (userId) p.set("userId", userId)
    if (entity) p.set("entity", entity)
    if (entityId) p.set("entityId", entityId)
    if (action) p.set("action", action)
    else if (actionPrefix) p.set("actionPrefix", actionPrefix)
    if (requestId) p.set("requestId", requestId)
    if (startDate) p.set("startDate", startDate)
    if (endDate) p.set("endDate", endDate)
    p.set("limit", String(PAGE_SIZE))
    p.set("offset", String(offset))

    try {
      const res = await fetch(`/api/admin/audit-logs?${p}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [orgId, userId, entity, entityId, action, actionPrefix, requestId, startDate, endDate, offset])

  useEffect(() => { load() }, [load])

  // setOffset(0) triggers useEffect via the load dependency chain.
  // Don't call load() directly — it would read the stale closure offset.
  const handleSearch = () => { setOffset(0) }
  const rangeStart = offset + 1
  const rangeEnd = offset + data.rows.length

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: 0 }}>Audit Logs</h1>
        <p style={{ fontSize: 14, color: "#8b949e", margin: "4px 0 0" }}>
          {data.total.toLocaleString()} entries
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: "#161b22", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, padding: 16, marginBottom: 16,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Organization ID</label>
            <input style={inputStyle} value={orgId} onChange={e => setOrgId(e.target.value)} placeholder="org-..." />
          </div>
          <div>
            <label style={labelStyle}>User ID</label>
            <input style={inputStyle} value={userId} onChange={e => setUserId(e.target.value)} placeholder="user-..." />
          </div>
          <div>
            <label style={labelStyle}>Entity</label>
            <input style={inputStyle} value={entity} onChange={e => setEntity(e.target.value)} placeholder="Client, Tag..." />
          </div>
          <div>
            <label style={labelStyle}>Entity ID</label>
            <input style={inputStyle} value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="entity-..." />
          </div>
          <div>
            <label style={labelStyle}>Action (exact)</label>
            <input style={inputStyle} value={action} onChange={e => setAction(e.target.value)} placeholder="tag.create" />
          </div>
          <div>
            <label style={labelStyle}>Action prefix</label>
            <input style={inputStyle} value={actionPrefix} onChange={e => setActionPrefix(e.target.value)} placeholder="tag." />
          </div>
          <div>
            <label style={labelStyle}>Request ID</label>
            <input style={inputStyle} value={requestId} onChange={e => setRequestId(e.target.value)} placeholder="req-..." />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start</label>
              <input style={inputStyle} type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End</label>
              <input style={inputStyle} type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSearch}
            style={{
              display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 16px",
              borderRadius: 6, background: "#606e74", color: "white", border: "none",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Search size={13} /> Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "#161b22", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Time", "Action", "Entity", "User", "Org", "Request ID", ""].map(h => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600,
                  color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map(row => (
              <Fragment key={row.id}>
                <tr style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  background: expandedId === row.id ? "rgba(96,110,116,0.1)" : "transparent",
                }}
                onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                >
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#8b949e", whiteSpace: "nowrap" }}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <code style={{ fontSize: 12, color: "#e6edf3", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                      {row.action}
                    </code>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#8b949e" }}>
                    {row.entity}{row.entityId ? ` / ${row.entityId.slice(0, 12)}...` : ""}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#8b949e", fontFamily: "monospace" }}>
                    {row.userId ? row.userId.slice(0, 12) + "..." : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#8b949e", fontFamily: "monospace" }}>
                    {row.organizationId ? row.organizationId.slice(0, 12) + "..." : "platform"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#484f58", fontFamily: "monospace" }}>
                    {row.requestId ? row.requestId.slice(0, 16) + "..." : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#606e74" }}>
                    Details
                  </td>
                </tr>
                {expandedId === row.id && (
                  <tr>
                    <td colSpan={7} style={{ padding: "0 14px 14px" }}>
                      <div style={{
                        background: "#0d1117", borderRadius: 8, padding: 16,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600 }}>Before</span>
                            <pre style={{ fontSize: 11, color: "#e6edf3", margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                              {row.before ? JSON.stringify(row.before, null, 2) : "—"}
                            </pre>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600 }}>After</span>
                            <pre style={{ fontSize: 11, color: "#e6edf3", margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                              {row.after ? JSON.stringify(row.after, null, 2) : "—"}
                            </pre>
                          </div>
                        </div>
                        {row.changedFields.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600 }}>Changed fields: </span>
                            <span style={{ fontSize: 11, color: "#e6edf3" }}>{row.changedFields.join(", ")}</span>
                          </div>
                        )}
                        {row.metadata && (
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: "#8b949e", fontWeight: 600 }}>Metadata</span>
                            <pre style={{ fontSize: 11, color: "#e6edf3", margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
                              {JSON.stringify(row.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 24, fontSize: 11, color: "#484f58" }}>
                          {row.route && <span>Route: {row.route}</span>}
                          {row.ipAddress && <span>IP: {row.ipAddress}</span>}
                          {row.userAgent && <span title={row.userAgent}>UA: {row.userAgent.slice(0, 40)}...</span>}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {data.rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", fontSize: 14, color: "#484f58" }}>
                  <FileText size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
                  No audit entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 12, padding: "0 4px",
      }}>
        <span style={{ fontSize: 13, color: "#8b949e" }}>
          {data.total > 0 ? `Showing ${rangeStart}–${rangeEnd} of ${data.total.toLocaleString()}` : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            style={{
              height: 32, padding: "0 12px", borderRadius: 6, fontSize: 12,
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: offset === 0 ? "#484f58" : "#8b949e",
              cursor: offset === 0 ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            disabled={!data.hasMore}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            style={{
              height: 32, padding: "0 12px", borderRadius: 6, fontSize: 12,
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: !data.hasMore ? "#484f58" : "#8b949e",
              cursor: !data.hasMore ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
