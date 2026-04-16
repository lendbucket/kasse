"use client"

import { useState } from "react"
import { Phone, Calendar, ArrowRightLeft, HelpCircle, XCircle, Zap, BarChart2, Settings, Clock } from "lucide-react"

export default function AiReceptionistPage() {
  const [tab, setTab] = useState("overview")
  const [isEnabled, setIsEnabled] = useState(false)

  return (
    <>
      <div style={{ padding: "28px 32px 0", borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>TOOLS</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>AI Receptionist</h1>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: isEnabled ? "rgba(34,197,94,0.1)" : "#f3f4f6", color: isEnabled ? "#16a34a" : "#9ca3af" }}>
                {isEnabled ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {["overview", "configuration", "call log", "analytics"].map((t) => (
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
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #0a0c0e, #1a2332)", borderRadius: 14, padding: 32, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, border: "1px solid rgba(96,110,116,0.2)" }}>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI-Powered</p>
            <h2 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "white" }}>AI Receptionist</h2>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Answers calls, books appointments, and handles client questions 24/7</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{isEnabled ? "ACTIVE" : "INACTIVE"}</p>
            <button onClick={() => setIsEnabled(!isEnabled)} className="cursor-pointer" style={{
              width: 56, height: 32, borderRadius: 16, border: "none",
              background: isEnabled ? "#16a34a" : "rgba(255,255,255,0.15)", position: "relative", transition: "background 200ms",
            }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "white", position: "absolute", top: 4, left: isEnabled ? 28 : 4, transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
            </button>
          </div>
        </div>

        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Calls handled", value: "0", icon: Phone, color: "#606E74" },
                { label: "Appointments booked", value: "0", icon: Calendar, color: "#16a34a" },
                { label: "Calls transferred", value: "0", icon: ArrowRightLeft, color: "#d97706" },
                { label: "Resolution rate", value: "0%", icon: BarChart2, color: "#2563eb" },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <s.icon size={16} style={{ color: s.color }} strokeWidth={1.5} />
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "var(--font-fira), monospace" }}>{s.value}</p>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>Recent calls</h3>
            <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
              <Phone size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
              <p style={{ fontSize: 14, color: "#9ca3af" }}>No calls yet. Enable the AI Receptionist to start handling calls.</p>
            </div>
          </>
        )}

        {tab === "configuration" && (
          <div style={{ maxWidth: 640 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <div><p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111827" }}>Enable AI Receptionist</p><p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Master switch for AI-powered call handling</p></div>
                <button onClick={() => setIsEnabled(!isEnabled)} className="cursor-pointer" style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: isEnabled ? "#16a34a" : "#d1d5db", position: "relative" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: isEnabled ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
              </div>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Greeting message</label>
                <textarea defaultValue="Hi, you've reached [Business Name]. How can I help you today?" rows={3}
                  style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Transfer phone number</label>
                <input type="tel" placeholder="(555) 000-0000" style={{ width: "100%", height: 44, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 15, fontFamily: "inherit" }} />
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>Calls transfer here when the AI can&apos;t resolve them</p>
              </div>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>Capabilities</p>
                {["Book appointments", "Reschedule / cancel", "Answer FAQs", "Collect client info"].map((cap) => (
                  <label key={cap} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: "#606E74" }} />
                    <span style={{ fontSize: 14, color: "#374151" }}>{cap}</span>
                  </label>
                ))}
              </div>
              <div style={{ padding: "16px 20px" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Voice</label>
                <select defaultValue="female_us" style={{ height: 44, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
                  <option value="female_us">Female (US English)</option>
                  <option value="male_us">Male (US English)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {tab === "call log" && (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <Clock size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No call history</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Call logs will appear here once the AI Receptionist handles its first call.</p>
          </div>
        )}

        {tab === "analytics" && (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <BarChart2 size={40} style={{ color: "#e5e7eb", margin: "0 auto 16px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Analytics</p>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Performance metrics will appear once the AI Receptionist starts handling calls.</p>
          </div>
        )}
      </div>
    </>
  )
}
