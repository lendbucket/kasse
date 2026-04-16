"use client"

import { useState, useEffect, useCallback } from "react"
import {
  User, Lock, Sliders, Building2, MapPin, Palette, Clock, CreditCard, Gift,
  Percent, Tag, Receipt, Zap, Landmark, ArrowUpRight, Bell, Calendar, Users,
  Megaphone, Globe, ListOrdered, XCircle, DollarSign, FileText, Monitor,
  Tablet, Printer, Shield, BarChart2, Target, Star, Crown, Share2, Key,
  Webhook, Puzzle, Upload, Download, Database, ArrowRightLeft, Eye, Trash2,
  Network, ChevronDown, ChevronRight, Check,
} from "lucide-react"

// ═══════════════════════════════════════
// NAV CONFIG
// ═══════════════════════════════════════

const SETTINGS_NAV = [
  { section: "Account & Settings", items: [
    { id: "personal", label: "Personal information", icon: User },
    { id: "security", label: "Sign in & security", icon: Lock },
    { id: "preferences", label: "Preferences", icon: Sliders },
  ]},
  { section: "My Business", items: [
    { id: "about", label: "About", icon: Building2 },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "hours", label: "Business hours", icon: Clock },
  ]},
  { section: "Pricing & Subscriptions", items: [
    { id: "plans", label: "Plans & billing", icon: CreditCard },
    { id: "trial", label: "Free trial", icon: Gift },
  ]},
  { section: "Payments", items: [
    { id: "payment_methods", label: "Payment methods", icon: CreditCard },
    { id: "sales_taxes", label: "Sales taxes", icon: Percent },
    { id: "service_charges", label: "Service charges", icon: Tag },
    { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "salon_transact", label: "SalonTransact", icon: Zap },
  ]},
  { section: "Banking", items: [
    { id: "bank_accounts", label: "Bank accounts", icon: Landmark },
    { id: "payouts", label: "Payouts", icon: ArrowUpRight },
  ]},
  { section: "Notifications", items: [
    { id: "notif_account", label: "Account", icon: Bell },
    { id: "notif_appointments", label: "Appointments", icon: Calendar },
    { id: "notif_staff", label: "Staff", icon: Users },
    { id: "notif_marketing", label: "Marketing", icon: Megaphone },
  ]},
  { section: "Booking & Fulfillment", items: [
    { id: "online_booking", label: "Online booking", icon: Globe },
    { id: "waitlist", label: "Waitlist", icon: ListOrdered },
    { id: "cancellation", label: "Cancellation policy", icon: XCircle },
    { id: "deposits", label: "Deposits", icon: DollarSign },
    { id: "forms", label: "Client forms & waivers", icon: FileText },
  ]},
  { section: "Device Management", items: [
    { id: "devices", label: "Devices", icon: Monitor },
    { id: "kiosk", label: "Kiosk settings", icon: Tablet },
    { id: "printer", label: "Printer profiles", icon: Printer },
  ]},
  { section: "Team", items: [
    { id: "permissions", label: "Permissions & roles", icon: Shield },
    { id: "commission", label: "Commission structure", icon: BarChart2 },
    { id: "goals", label: "Goals & KPIs", icon: Target },
  ]},
  { section: "Marketing & Loyalty", items: [
    { id: "loyalty", label: "Loyalty program", icon: Star },
    { id: "gift_cards", label: "Gift cards", icon: Gift },
    { id: "memberships", label: "Memberships", icon: Crown },
    { id: "referrals", label: "Referral program", icon: Share2 },
  ]},
  { section: "Integrations", items: [
    { id: "api_keys", label: "API keys", icon: Key },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "app_integrations", label: "App integrations", icon: Puzzle },
  ]},
  { section: "Data", items: [
    { id: "import", label: "Import data", icon: Upload },
    { id: "export", label: "Export data", icon: Download },
    { id: "backup", label: "Backup & restore", icon: Database },
  ]},
  { section: "Advanced", items: [
    { id: "franchise", label: "Franchise settings", icon: Network },
    { id: "transfer", label: "Transfer account", icon: ArrowRightLeft },
    { id: "ccpa", label: "CCPA / Privacy", icon: Eye },
    { id: "deactivate", label: "Deactivate account", icon: Trash2 },
  ]},
]

type OrgData = Record<string, any>
type SettingsData = Record<string, any>

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="cursor-pointer" aria-label="Toggle" style={{
      width: 44, height: 24, borderRadius: 12, border: "none",
      background: on ? "#606e74" : "#d1d5db", position: "relative", transition: "background 200ms", flexShrink: 0,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  )
}

export default function SettingsPage() {
  const [section, setSection] = useState("about")
  const [org, setOrg] = useState<OrgData>({})
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        if (data.organization) setOrg(data.organization)
        if (data.settings) setSettings(data.settings)
      }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function saveOrgField(field: string) {
    const value = editValues[field]
    setOrg((p) => ({ ...p, [field]: value }))
    setEditingField(null)
    await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationUpdates: { [field]: value } }),
    })
  }

  async function saveSettings(updates: Partial<SettingsData>) {
    setSettings((p) => ({ ...p, ...updates }))
    await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settingsUpdates: updates }),
    })
  }

  function toggleSection(s: string) {
    setCollapsed((p) => ({ ...p, [s]: !p[s] }))
  }

  function renderContent() {
    if (loading) return <p style={{ color: "#9ca3af" }}>Loading...</p>

    switch (section) {
      case "about": return (<div>
        <SH title="About" sub="Manage your business account and settings." />
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 32 }}>
          {[
            { label: "Display Business Name", value: org.name, field: "name" },
            { label: "Legal Business Name", value: org.legalName, field: "legalName" },
            { label: "Business Type", value: org.businessType, field: "businessType" },
            { label: "Phone", value: org.phone, field: "phone" },
            { label: "Email", value: org.email, field: "email" },
            { label: "Website", value: org.website, field: "website" },
            { label: "Language", value: "English", field: null },
            { label: "Timezone", value: org.timezone || "America/Chicago", field: "timezone" },
          ].map((row, i) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: i < 7 ? "1px solid #f3f4f6" : "none", background: editingField === row.field ? "#f9fafb" : "white" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>{row.label}</p>
                {editingField === row.field ? (
                  <input autoFocus value={editValues[row.field!] || ""} onChange={(e) => setEditValues((v) => ({ ...v, [row.field!]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && saveOrgField(row.field!)}
                    style={{ fontSize: 15, color: "#111827", border: "none", background: "transparent", outline: "none", width: "100%", fontFamily: "inherit" }} />
                ) : (
                  <p style={{ margin: 0, fontSize: 15, color: "#111827", fontWeight: 500 }}>{row.value || "\u2014"}</p>
                )}
              </div>
              {row.field && (editingField === row.field ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => saveOrgField(row.field!)} style={{ height: 32, padding: "0 14px", background: "#606E74", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
                  <button onClick={() => setEditingField(null)} style={{ height: 32, padding: "0 14px", background: "white", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setEditingField(row.field); setEditValues((v) => ({ ...v, [row.field!]: row.value || "" })) }}
                  style={{ color: "#606E74", background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
              ))}
            </div>
          ))}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Transfer business</h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>Transfer ownership to another user.</p>
        <button style={{ height: 36, padding: "0 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit" }}>Transfer business</button>
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", margin: "0 0 8px" }}>Deactivate your business</h3>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>This will permanently deactivate your account and cancel your subscription.</p>
          <button style={{ height: 36, padding: "0 16px", background: "white", border: "1px solid #fecaca", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>Deactivate your business</button>
        </div>
      </div>)

      case "payment_methods": return (<div>
        <SH title="Payment methods" sub="Configure which payment methods you accept." />
        <Card>
          <TR label="Accept cash payments" desc="Allow clients to pay with cash" on={settings.acceptCash !== false} onChange={() => saveSettings({ acceptCash: !(settings.acceptCash !== false) })} />
          <TR label="Accept card payments" desc="Process cards via SalonTransact" on={settings.acceptCard !== false} onChange={() => saveSettings({ acceptCard: !(settings.acceptCard !== false) })} badge={settings.acceptCard !== false ? "Connected" : "Pending"} />
          <TR label="Accept gift cards" desc="Allow gift card payments" on={settings.acceptGiftCard !== false} onChange={() => saveSettings({ acceptGiftCard: !(settings.acceptGiftCard !== false) })} />
          <TR label="Accept loyalty points" desc="Redeem loyalty points at checkout" on={settings.loyaltyEnabled === true} onChange={() => saveSettings({ loyaltyEnabled: !settings.loyaltyEnabled })} />
        </Card>
      </div>)

      case "sales_taxes": return (<div>
        <SH title="Sales taxes" sub="Configure tax rates for your locations." />
        <Card>
          <div style={{ padding: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Tax rate (%)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" step="0.01" value={settings.taxRate ?? 8.25} onChange={(e) => saveSettings({ taxRate: parseFloat(e.target.value) })}
                style={{ width: 120, height: 44, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 15, color: "#111827", fontFamily: "var(--font-fira), monospace" }} />
              <span style={{ fontSize: 14, color: "#9ca3af" }}>% applied to all taxable services</span>
            </div>
          </div>
        </Card>
      </div>)

      case "receipts": return (<div>
        <SH title="Receipts" sub="Customize receipt settings." />
        <Card>
          <TR label="Auto-send receipts" desc="Email receipt after every transaction" on={settings.autoSendReceipt !== false} onChange={() => saveSettings({ autoSendReceipt: !settings.autoSendReceipt })} />
          <TR label="Include logo" desc="Show your business logo on receipts" on={settings.receiptLogo !== false} onChange={() => saveSettings({ receiptLogo: !settings.receiptLogo })} />
          <TR label="Include tip line" desc="Show tip options on receipt" on={settings.tipPromptEnabled !== false} onChange={() => saveSettings({ tipPromptEnabled: !settings.tipPromptEnabled })} />
          <div style={{ padding: "16px 20px" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Receipt footer text</label>
            <textarea value={settings.receiptFooter ?? ""} onChange={(e) => saveSettings({ receiptFooter: e.target.value })} placeholder="Thank you for your visit!" rows={3}
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, fontSize: 14, color: "#111827", fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
        </Card>
      </div>)

      case "salon_transact": return (<div>
        <SH title="SalonTransact" sub="Your payment processing account." />
        <div style={{ background: "linear-gradient(135deg, #0a0c0e, #1a2332)", borderRadius: 14, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, border: "1px solid rgba(96,110,116,0.2)" }}>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Payments powered by</p>
            <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "white" }}>SalonTransact</p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>2.4% + $0.10 per transaction &middot; Same-day payouts</p>
          </div>
          <Zap size={40} style={{ color: "#606E74" }} strokeWidth={1.5} />
        </div>
        <Card>
          <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#111827" }}>Status</p>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>Connected</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Processing since {new Date().toLocaleDateString()}</p>
          </div>
        </Card>
      </div>)

      case "online_booking": return (<div>
        <SH title="Online booking" sub="Configure your online booking experience." />
        <Card>
          <TR label="Enable online booking" desc="Allow clients to book online" on={settings.onlineBookingEnabled !== false} onChange={() => saveSettings({ onlineBookingEnabled: !settings.onlineBookingEnabled })} />
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Booking lead time</label>
            <select value={settings.bookingLeadTime ?? 60} onChange={(e) => saveSettings({ bookingLeadTime: parseInt(e.target.value) })}
              style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 14, color: "#111827", cursor: "pointer", fontFamily: "inherit" }}>
              <option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2 hours</option><option value={1440}>24 hours</option>
            </select>
          </div>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Max advance booking</label>
            <select value={settings.bookingMaxAdvance ?? 60} onChange={(e) => saveSettings({ bookingMaxAdvance: parseInt(e.target.value) })}
              style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 14, color: "#111827", cursor: "pointer", fontFamily: "inherit" }}>
              <option value={7}>1 week</option><option value={14}>2 weeks</option><option value={30}>1 month</option><option value={90}>3 months</option>
            </select>
          </div>
          <TR label="Allow walk-in requests" desc="Accept walk-in appointment requests" on={settings.allowWalkIns !== false} onChange={() => saveSettings({ allowWalkIns: !settings.allowWalkIns })} />
          <TR label="Require deposit" desc="Require a deposit when booking" on={settings.requireDeposit === true} onChange={() => saveSettings({ requireDeposit: !settings.requireDeposit })} />
          <TR label="Show stylist availability" desc="Let clients see stylist schedules" on={true} onChange={() => {}} />
          <TR label="Allow stylist preference" desc="Let clients choose their stylist" on={true} onChange={() => {}} />
        </Card>
      </div>)

      case "cancellation": return (<div>
        <SH title="Cancellation policy" sub="Configure cancellation and no-show policies." />
        <Card>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Cancellation window (hours)</label>
            <input type="number" value={settings.cancellationWindow ?? 24} onChange={(e) => saveSettings({ cancellationWindow: parseInt(e.target.value) })}
              style={{ width: 120, height: 44, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 15, color: "#111827", fontFamily: "var(--font-fira), monospace" }} />
          </div>
          <TR label="Cancellation fee" desc="Charge clients for late cancellations" on={!!settings.cancellationFee} onChange={() => saveSettings({ cancellationFee: settings.cancellationFee ? null : 25 })} />
          <div style={{ padding: "16px 20px" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Policy text (shown to clients)</label>
            <textarea value={settings.cancellationPolicy ?? ""} onChange={(e) => saveSettings({ cancellationPolicy: e.target.value })} placeholder="Cancellations must be made at least 24 hours in advance..." rows={3}
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, fontSize: 14, color: "#111827", fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
        </Card>
      </div>)

      case "permissions": return (<div>
        <SH title="Permissions & roles" sub="Control what each role can access." />
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Feature</th>
                {["Owner", "Manager", "Stylist", "Front Desk", "Read Only"].map((r) => (
                  <th key={r} style={{ padding: "12px 8px", textAlign: "center", fontWeight: 600 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(96,110,116,0.08)", color: "#606E74" }}>{r}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Dashboard", "Reports", "POS Terminal", "Appointments", "Clients", "Staff", "Services", "Marketing", "Reputation", "Loyalty", "Settings", "Billing", "Data import", "API access"].map((feat, fi) => (
                <tr key={feat} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 16px", color: "#374151", fontWeight: 500 }}>{feat}</td>
                  {[true, fi < 10, fi < 6, fi < 5, fi < 2].map((on, ri) => (
                    <td key={ri} style={{ padding: "10px 8px", textAlign: "center" }}>
                      {on ? <Check size={16} style={{ color: "#16a34a" }} strokeWidth={2} /> : <span style={{ color: "#d1d5db" }}>&mdash;</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>)

      case "loyalty": return (<div>
        <SH title="Loyalty program" sub="Reward your clients for their loyalty." />
        <Card>
          <TR label="Enable loyalty program" desc="Clients earn points on every visit" on={settings.loyaltyEnabled === true} onChange={() => saveSettings({ loyaltyEnabled: !settings.loyaltyEnabled })} />
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Points per dollar spent</label>
            <input type="number" defaultValue={1} style={{ width: 120, height: 44, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 15, fontFamily: "var(--font-fira), monospace" }} />
          </div>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Dollar value per point</label>
            <input type="number" step="0.01" defaultValue={0.01} style={{ width: 120, height: 44, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 15, fontFamily: "var(--font-fira), monospace" }} />
          </div>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Minimum redemption points</label>
            <input type="number" defaultValue={100} style={{ width: 120, height: 44, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 14px", fontSize: 15, fontFamily: "var(--font-fira), monospace" }} />
          </div>
          <TR label="Show balance to clients" desc="Display points balance at checkout" on={true} onChange={() => {}} />
        </Card>
      </div>)

      case "import": return (<div>
        <SH title="Import data" sub="Import data from another system or CSV file." />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {["Square", "Zenoti", "Mindbody", "Vagaro", "Booker", "Custom CSV"].map((src) => (
            <button key={src} style={{ height: 36, padding: "0 16px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", background: "white", fontFamily: "inherit" }}>{src}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40, border: "2px dashed #d1d5db", borderRadius: 10, cursor: "pointer", marginBottom: 20 }}>
          <Upload size={32} style={{ color: "#d1d5db", marginBottom: 12 }} strokeWidth={1.5} />
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#374151" }}>Click to upload or drag and drop</p>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>CSV, XLSX up to 50MB</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["Clients", "Staff", "Services", "Transactions", "Gift Cards"].map((t) => (
            <button key={t} style={{ height: 32, padding: "0 12px", border: "1px solid #e5e7eb", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#6b7280", cursor: "pointer", background: "white", fontFamily: "inherit" }}>{t}</button>
          ))}
        </div>
      </div>)

      case "api_keys": return (<div>
        <SH title="API keys" sub="Manage API keys for third-party integrations." />
        <button style={{ height: 36, padding: "0 16px", background: "#606e74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>Create new key</button>
        <Card>
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <Key size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>No API keys yet</p>
          </div>
        </Card>
      </div>)

      case "webhooks": return (<div>
        <SH title="Webhooks" sub="Configure webhook endpoints for real-time events." />
        <button style={{ height: 36, padding: "0 16px", background: "#606e74", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>Create webhook</button>
        <Card>
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <Webhook size={32} style={{ color: "#d1d5db", margin: "0 auto 12px" }} strokeWidth={1.5} />
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>No webhooks configured</p>
          </div>
        </Card>
      </div>)

      default: {
        const item = SETTINGS_NAV.flatMap((s) => s.items).find((i) => i.id === section)
        return (<div>
          <SH title={item?.label || section} sub="This section is coming soon." />
          <Card><div style={{ padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>Configuration options will be available here.</p>
          </div></Card>
        </div>)
      }
    }
  }

  return (
    <>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>ACCOUNT</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Settings</h1>
      </div>
      <div className="flex" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Left nav */}
        <nav className="hidden md:block" style={{ width: 240, borderRight: "1px solid #e5e7eb", background: "white", overflowY: "auto", flexShrink: 0 }}>
          {SETTINGS_NAV.map((group) => (
            <div key={group.section}>
              <button onClick={() => toggleSection(group.section)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                padding: "16px 20px 4px", fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em",
                textTransform: "uppercase", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit",
              }}>
                {group.section}
                {collapsed[group.section] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>
              {!collapsed[group.section] && group.items.map((item) => {
                const active = section === item.id
                const Icon = item.icon
                return (
                  <button key={item.id} onClick={() => setSection(item.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", height: 38,
                    padding: "0 12px 0 20px", border: "none", fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? "#606e74" : "#374151", background: active ? "rgba(96,110,116,0.08)" : "transparent",
                    borderLeft: active ? "3px solid #606E74" : "3px solid transparent",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  }}>
                    <Icon size={15} strokeWidth={1.5} style={{ color: active ? "#606e74" : "#9ca3af", flexShrink: 0 }} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        {/* Right content */}
        <div style={{ flex: 1, padding: "40px 48px", maxWidth: 800, overflowY: "auto" }}>
          {renderContent()}
        </div>
      </div>
    </>
  )
}

function SH({ title, sub }: { title: string; sub: string }) {
  return (<div style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{title}</h2>
    <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>{sub}</p>
  </div>)
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "white" }}>{children}</div>
}

function TR({ label, desc, on, onChange, badge }: { label: string; desc: string; on: boolean; onChange: () => void; badge?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{label}</p>
          {badge && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: on ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)", color: on ? "#16a34a" : "#d97706" }}>{badge}</span>}
        </div>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{desc}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}
