"use client"

import { useState } from "react"
import { MessageSquare, Send, Search, Calendar, Phone, Plus, Zap } from "lucide-react"

type Conversation = {
  id: string; name: string; initials: string; lastMessage: string; time: string; unread: number
}

const MOCK_CONVERSATIONS: Conversation[] = []

export default function MessagesPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [filter, setFilter] = useState("all")

  return (
    <div style={{ display: "flex", height: "calc(100vh - 0px)", background: "white" }}>
      {/* Left — Conversation list */}
      <div style={{ width: 320, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Messages</h2>
            <button style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={16} style={{ color: "#6b7280" }} />
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..."
              style={{ width: "100%", height: 36, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 10px 0 32px", fontSize: 13, color: "#111827", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {["all", "unread", "appointments"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                height: 28, padding: "0 10px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                border: filter === f ? "1px solid #606E74" : "1px solid #e5e7eb",
                background: filter === f ? "rgba(96,110,116,0.08)" : "white",
                color: filter === f ? "#606E74" : "#6b7280", cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {MOCK_CONVERSATIONS.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <MessageSquare size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} strokeWidth={1.5} />
              <p style={{ fontSize: 13, color: "#9ca3af" }}>No conversations yet</p>
            </div>
          )}
          {MOCK_CONVERSATIONS.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 16px",
              border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", fontFamily: "inherit",
              background: selected === c.id ? "rgba(96,110,116,0.08)" : "white",
              borderLeft: selected === c.id ? "2px solid #606E74" : "2px solid transparent",
              textAlign: "left",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#606E74", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "white", flexShrink: 0 }}>{c.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "var(--font-fira), monospace" }}>{c.time}</span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMessage}</p>
              </div>
              {c.unread > 0 && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>{c.unread}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Center — Active conversation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={48} style={{ color: "#e5e7eb", marginBottom: 16 }} strokeWidth={1.5} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Select a conversation</p>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Or start a new conversation</p>
            <button style={{ height: 36, padding: "0 16px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>New message</button>
          </div>
        ) : (
          <>
            <div style={{ height: 60, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Client Name</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>(555) 123-4567</span>
              </div>
              <button style={{ height: 32, padding: "0 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", background: "white", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                <Calendar size={12} /> Book appointment
              </button>
            </div>
            <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
              <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No messages yet</p>
            </div>
            <div style={{ padding: "12px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
              <button title="Saved responses" style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} style={{ color: "#6b7280" }} />
              </button>
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..."
                style={{ flex: 1, height: 36, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 14, color: "#111827", outline: "none" }} />
              <button style={{ width: 36, height: 36, borderRadius: 8, background: "#606E74", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={16} style={{ color: "white" }} strokeWidth={1.5} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right — Client details (only when conversation selected) */}
      {selected && (
        <div style={{ width: 260, borderLeft: "1px solid #e5e7eb", padding: "24px 20px", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#606E74", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "white", margin: "0 auto 12px" }}>JD</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>Client Name</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>(555) 123-4567</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[{ label: "Spent", value: "$0" }, { label: "Visits", value: "0" }, { label: "Last", value: "\u2014" }].map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: 8, background: "#f9fafb", borderRadius: 6 }}>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9ca3af" }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["Book appointment", "Send review request", "Add note"].map((a) => (
              <button key={a} style={{ height: 32, width: "100%", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", background: "white", fontFamily: "inherit" }}>{a}</button>
            ))}
          </div>
          <a href="#" style={{ display: "block", textAlign: "center", marginTop: 16, fontSize: 13, color: "#606E74", fontWeight: 600, textDecoration: "none" }}>View full profile &rarr;</a>
        </div>
      )}
    </div>
  )
}
