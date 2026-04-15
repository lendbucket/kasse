import { BarChart2 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Reports</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["Today", "This week", "This month"].map((label) => (
            <button key={label} className="btn btn-secondary" style={{ height: 32, fontSize: 13, padding: "0 12px" }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <BarChart2 size={36} strokeWidth={1.5} style={{ color: "#d1d5db", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 4 }}>No report data yet</p>
        <p style={{ fontSize: 14, color: "#6b7280" }}>Complete some transactions to see your reports here.</p>
      </div>
    </div>
  );
}
