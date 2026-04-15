"use client";

import { useState } from "react";
import { BarChart2 } from "lucide-react";

const RANGES = ["Today", "This week", "This month", "Custom"] as const;

export default function ReportsPage() {
  const [range, setRange] = useState<string>("Today");

  return (
    <>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>ANALYTICS</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Reports</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {RANGES.map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)} style={{
              height: 32, padding: "0 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 120ms",
              border: range === r ? "1px solid #606E74" : "1px solid #e5e7eb",
              background: range === r ? "#606E74" : "white", color: range === r ? "white" : "#6b7280",
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[
          { label: "TOTAL REVENUE", value: "$0.00" },
          { label: "TRANSACTIONS", value: "0" },
          { label: "AVG TICKET", value: "$0.00" },
          { label: "TOTAL TIPS", value: "$0.00" },
        ].map((kpi) => (
          <div key={kpi.label} className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 8 }}>{kpi.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-fira), monospace", color: "#111827", margin: 0, letterSpacing: "-0.5px" }}>{kpi.value}</p>
            <span className="trend-neutral" style={{ marginTop: 8, display: "inline-flex" }}>N/A</span>
          </div>
        ))}
      </div>

      {/* Empty tables */}
      <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Revenue by stylist</h3>
          </div>
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <BarChart2 size={36} strokeWidth={1.5} style={{ color: "#e5e7eb", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Complete transactions to see stylist reports</p>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Recent transactions</h3>
          </div>
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>No transactions for this period</p>
          </div>
        </div>
      </div>
    </>
  );
}
