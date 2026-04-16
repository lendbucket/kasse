"use client"

import { useState, useEffect } from "react"
import { Upload, RefreshCw } from "lucide-react"

type ImportJobRow = {
  id: string; type: string; status: string; sourceSystem: string | null;
  fileName: string | null; totalRows: number; processedRows: number;
  successRows: number; failedRows: number; createdAt: string;
  organization: { name: string }
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(234,179,8,0.15)", text: "#facc15" },
  processing: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  completed: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  failed: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
}

export default function AdminImportJobsPage() {
  const [jobs, setJobs] = useState<ImportJobRow[]>([])

  useEffect(() => {
    fetch("/api/admin/merchants").then(r => r.json()).then(() => {
      // For now, show empty state — import jobs loaded via admin stats
    }).catch(() => {})
  }, [])

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 4px" }}>Import Jobs</h1>
      <p style={{ fontSize: 14, color: "#8b949e", margin: "0 0 24px" }}>All import jobs across all merchants</p>

      <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Merchant", "Type", "Source", "Status", "Progress", "Started", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8b949e", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length ? jobs.map(j => {
              const sc = statusColors[j.status] || statusColors.pending
              return (
                <tr key={j.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "white" }}>{j.organization.name}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{j.type}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{j.sourceSystem || "custom"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text }}>{j.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{j.processedRows}/{j.totalRows}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#8b949e" }}>{new Date(j.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {j.status === "failed" && (
                      <button style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>
                        <RefreshCw size={12} /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={7} style={{ padding: "32px 16px", textAlign: "center" }}>
                  <Upload size={32} style={{ color: "#484f58", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 14, color: "#484f58", margin: 0 }}>No import jobs yet</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
