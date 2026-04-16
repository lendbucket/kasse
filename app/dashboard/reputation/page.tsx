"use client"

import { useState } from "react"
import { Star, MessageSquare, Send, TrendingUp, BarChart2, ExternalLink } from "lucide-react"

export default function ReputationPage() {
  const [tab, setTab] = useState("overview")

  return (
    <>
      <div style={{ padding: "28px 32px 0", borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>GROWTH</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Reputation</h1>
          </div>
          <button style={{ height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
            <Send size={14} /> Request reviews
          </button>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {["overview", "reviews", "requests", "settings"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 20px", fontSize: 13, fontWeight: tab === t ? 600 : 500,
              color: tab === t ? "#606E74" : "#6b7280", background: "transparent", border: "none",
              borderBottom: tab === t ? "2px solid #606E74" : "2px solid transparent",
              cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Average rating", value: "0.0", icon: Star, color: "#f59e0b" },
                { label: "Total reviews", value: "0", icon: MessageSquare, color: "#606E74" },
                { label: "Response rate", value: "0%", icon: TrendingUp, color: "#16a34a" },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.icon size={18} style={{ color: s.color }} strokeWidth={1.5} />
                    </div>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: 32, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "var(--font-fira), monospace" }}>{s.value}</p>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Platform breakdown</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[{ name: "Google", reviews: 0, avg: "0.0" }, { name: "Yelp", reviews: 0, avg: "0.0" }].map((p) => (
                <div key={p.name} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#111827" }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{p.reviews} reviews &middot; {p.avg} avg</p>
                  </div>
                  <ExternalLink size={16} style={{ color: "#9ca3af" }} strokeWidth={1.5} />
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>Review sentiment</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {[{ label: "Positive", pct: 0, color: "#16a34a" }, { label: "Neutral", pct: 0, color: "#d97706" }, { label: "Negative", pct: 0, color: "#dc2626" }].map((s) => (
                <div key={s.label} style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{s.label}</span>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "var(--font-fira), monospace" }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 999 }}>
                    <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "reviews" && (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <Star size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No reviews yet</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Reviews from Google and Yelp will appear here.</p>
          </div>
        )}

        {tab === "requests" && (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <Send size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No review requests sent</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Request reviews from clients after their appointment.</p>
          </div>
        )}

        {tab === "settings" && (
          <div className="card" style={{ overflow: "hidden" }}>
            {[
              { label: "Auto-request reviews", desc: "Automatically send review requests after appointments", on: false },
              { label: "Push positive reviews to Google", desc: "Route 4+ star reviews to Google", on: false },
              { label: "Auto-respond to positive reviews", desc: "Send an automated thank you response", on: false },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <div><p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{row.label}</p><p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{row.desc}</p></div>
                <button className="cursor-pointer" style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: row.on ? "#606e74" : "#d1d5db", position: "relative" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: row.on ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
