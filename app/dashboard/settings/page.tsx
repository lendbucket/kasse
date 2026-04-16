"use client"

import { useState, useEffect, useCallback } from "react"
import {
  User, Lock, SlidersHorizontal, Building2, MapPin, Palette, Shield,
  CreditCard, Receipt, Banknote, Bell, Calendar, Clock, ListOrdered,
  Monitor, Printer, Users, Key, Webhook, Upload, Download,
  ArrowLeftRight, FileText, Trash2, ChevronRight, Zap, ExternalLink, ToggleLeft,
} from "lucide-react"

type SettingsSection = string

const NAV_SECTIONS = [
  {
    title: "Account & Settings",
    items: [
      { id: "personal", label: "Personal information", icon: User },
      { id: "security", label: "Sign in & security", icon: Lock },
      { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
    ],
  },
  {
    title: "My Business",
    items: [
      { id: "about", label: "About", icon: Building2 },
      { id: "locations", label: "Locations", icon: MapPin },
      { id: "branding", label: "Branding", icon: Palette },
    ],
  },
  {
    title: "Pricing & Subscriptions",
    items: [
      { id: "plans", label: "Plans & billing", icon: CreditCard },
    ],
  },
  {
    title: "Payments",
    items: [
      { id: "payment-methods", label: "Payment methods", icon: CreditCard },
      { id: "sales-taxes", label: "Sales taxes", icon: Receipt },
      { id: "receipts", label: "Receipts", icon: Receipt },
    ],
  },
  {
    title: "Banking",
    items: [
      { id: "salontransact", label: "SalonTransact", icon: Banknote },
    ],
  },
  {
    title: "Notifications",
    items: [
      { id: "notif-account", label: "Account", icon: Bell },
      { id: "notif-appointments", label: "Appointments", icon: Calendar },
      { id: "notif-staff", label: "Staff", icon: Users },
    ],
  },
  {
    title: "Fulfillment",
    items: [
      { id: "online-booking", label: "Online booking", icon: Calendar },
      { id: "waitlist", label: "Waitlist", icon: Clock },
      { id: "cancellation", label: "Cancellation policy", icon: ListOrdered },
    ],
  },
  {
    title: "Device Management",
    items: [
      { id: "devices", label: "Devices", icon: Monitor },
      { id: "kiosk", label: "Kiosk settings", icon: Monitor },
      { id: "printers", label: "Printer profiles", icon: Printer },
    ],
  },
  {
    title: "Team",
    items: [
      { id: "permissions", label: "Permissions", icon: Shield },
      { id: "roles", label: "Roles", icon: Users },
    ],
  },
  {
    title: "Integrations",
    items: [
      { id: "api-keys", label: "API keys", icon: Key },
      { id: "webhooks", label: "Webhooks", icon: Webhook },
    ],
  },
  {
    title: "Data",
    items: [
      { id: "import", label: "Import data", icon: Upload },
      { id: "export", label: "Export data", icon: Download },
    ],
  },
  {
    title: "Advanced",
    items: [
      { id: "transfer", label: "Transfer account", icon: ArrowLeftRight },
      { id: "privacy", label: "CCPA / Privacy", icon: FileText },
      { id: "deactivate", label: "Deactivate account", icon: Trash2 },
    ],
  },
]

type OrgData = {
  name?: string; email?: string; phone?: string; website?: string; timezone?: string; language?: string;
  address?: string; city?: string; state?: string; zip?: string;
}
type SettingsData = {
  acceptCash?: boolean; acceptCard?: boolean; acceptGiftCard?: boolean; taxRate?: number;
  tipPromptEnabled?: boolean; tipOptions?: number[];
  autoSendReceipt?: boolean; receiptFooter?: string; receiptLogo?: boolean;
  onlineBookingEnabled?: boolean; bookingLeadTime?: number; bookingMaxAdvance?: number;
  allowWalkIns?: boolean; requireDeposit?: boolean; depositPercentage?: number;
  sendConfirmations?: boolean; sendReminders?: boolean; reminderHours?: number;
  cancellationWindow?: number; cancellationFee?: number; cancellationPolicy?: string;
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="cursor-pointer" aria-label="Toggle"
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none",
        background: on ? "#606e74" : "#d1d5db", position: "relative", transition: "background 200ms", flexShrink: 0,
      }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "white",
        position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 200ms",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  )
}

function SettingRow({ icon: Icon, label, desc, children }: {
  icon: any; label: string; desc?: string; children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f3f4f6] px-6 py-4 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={18} strokeWidth={1.5} className="shrink-0 text-[#9ca3af]" />
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#111827]">{label}</p>
          {desc && <p className="text-[13px] text-[#6b7280] truncate">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("about")
  const [org, setOrg] = useState<OrgData>({})
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        if (data.organization) setOrg(data.organization)
        if (data.settings) setSettings(data.settings)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function saveSettings(orgUpdates?: Partial<OrgData>, settingsUpdates?: Partial<SettingsData>) {
    if (orgUpdates) setOrg((prev) => ({ ...prev, ...orgUpdates }))
    if (settingsUpdates) setSettings((prev) => ({ ...prev, ...settingsUpdates }))
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationUpdates: orgUpdates, settingsUpdates }),
    })
  }

  function renderContent() {
    if (loading) return <div className="p-8 text-[14px] text-[#9ca3af]">Loading...</div>

    switch (section) {
      case "about":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">About</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Manage your business account and settings.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              {[
                { label: "Display Business Name", value: org.name },
                { label: "Email", value: org.email },
                { label: "Phone", value: org.phone },
                { label: "Website", value: org.website },
                { label: "Address", value: [org.address, org.city, org.state, org.zip].filter(Boolean).join(", ") },
                { label: "Language", value: org.language || "English" },
                { label: "Timezone", value: org.timezone || "America/Chicago" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-4 last:border-b-0">
                  <div>
                    <p className="text-[13px] text-[#6b7280]">{row.label}</p>
                    <p className="text-[14px] font-medium text-[#111827]">{row.value || "\u2014"}</p>
                  </div>
                  <button className="cursor-pointer text-[13px] font-medium text-[#606e74] hover:underline"
                    style={{ background: "none", border: "none" }}>Edit</button>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h3 className="text-[18px] font-bold text-[#111827]">Transfer business</h3>
              <p className="mt-1 text-[13px] text-[#6b7280]">Transfer ownership of this business to another user.</p>
              <button className="mt-4 cursor-pointer rounded-lg border border-[#e5e7eb] px-4 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
                style={{ background: "white" }}>Transfer business</button>
            </div>

            <div className="mt-10">
              <h3 className="text-[18px] font-bold text-[#dc2626]">Deactivate your business</h3>
              <p className="mt-1 text-[13px] text-[#6b7280]">This will permanently deactivate your account and cancel your subscription.</p>
              <button className="mt-4 cursor-pointer rounded-lg border border-[#fecaca] px-4 py-2 text-[13px] font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
                style={{ background: "white" }}>Deactivate your business</button>
            </div>
          </div>
        )

      case "payment-methods":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Payment methods</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Configure which payment methods you accept.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <SettingRow icon={Banknote} label="Accept cash" desc="Allow cash payments at checkout">
                <Toggle on={settings.acceptCash !== false} onChange={() => saveSettings(undefined, { acceptCash: !settings.acceptCash })} />
              </SettingRow>
              <SettingRow icon={CreditCard} label="Accept card" desc="Process card payments via SalonTransact">
                <Toggle on={settings.acceptCard !== false} onChange={() => saveSettings(undefined, { acceptCard: !settings.acceptCard })} />
              </SettingRow>
              <SettingRow icon={CreditCard} label="Accept gift cards" desc="Allow gift card payments">
                <Toggle on={settings.acceptGiftCard !== false} onChange={() => saveSettings(undefined, { acceptGiftCard: !settings.acceptGiftCard })} />
              </SettingRow>
            </div>
          </div>
        )

      case "sales-taxes":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Sales taxes</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Configure tax rates for your location.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-6">
              <label className="mb-2 block text-[13px] font-medium text-[#374151]">Tax rate (%)</label>
              <input type="number" step="0.01" value={settings.taxRate ?? 8.25}
                onChange={(e) => saveSettings(undefined, { taxRate: parseFloat(e.target.value) })}
                className="h-[44px] w-full max-w-[200px] rounded-xl border border-[#e5e7eb] px-4 text-[16px] text-[#111827] outline-none focus:border-[#606e74]" />
            </div>
          </div>
        )

      case "receipts":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Receipts</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Customize receipt settings.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <SettingRow icon={Receipt} label="Auto-send receipt" desc="Email receipt after every transaction">
                <Toggle on={settings.autoSendReceipt !== false} onChange={() => saveSettings(undefined, { autoSendReceipt: !settings.autoSendReceipt })} />
              </SettingRow>
              <SettingRow icon={Palette} label="Show logo on receipt" desc="Display your business logo">
                <Toggle on={settings.receiptLogo !== false} onChange={() => saveSettings(undefined, { receiptLogo: !settings.receiptLogo })} />
              </SettingRow>
              <div className="border-b border-[#f3f4f6] px-6 py-4 last:border-b-0">
                <label className="mb-2 block text-[13px] font-medium text-[#374151]">Receipt footer text</label>
                <textarea value={settings.receiptFooter ?? ""}
                  onChange={(e) => saveSettings(undefined, { receiptFooter: e.target.value })}
                  placeholder="Thank you for your visit!"
                  rows={3}
                  className="w-full rounded-xl border border-[#e5e7eb] p-4 text-[14px] text-[#111827] outline-none focus:border-[#606e74]" />
              </div>
              <div className="flex items-center gap-2 px-6 py-3">
                <Zap size={12} className="text-[#9ca3af]" />
                <span className="text-[11px] text-[#9ca3af]">Powered by SalonTransact</span>
              </div>
            </div>
          </div>
        )

      case "online-booking":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Online booking</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Configure your online booking experience.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <SettingRow icon={Calendar} label="Enable online booking" desc="Allow clients to book online">
                <Toggle on={settings.onlineBookingEnabled !== false} onChange={() => saveSettings(undefined, { onlineBookingEnabled: !settings.onlineBookingEnabled })} />
              </SettingRow>
              <div className="border-b border-[#f3f4f6] px-6 py-4">
                <label className="mb-2 block text-[13px] font-medium text-[#374151]">Booking lead time</label>
                <select value={settings.bookingLeadTime ?? 60}
                  onChange={(e) => saveSettings(undefined, { bookingLeadTime: parseInt(e.target.value) })}
                  className="h-[40px] cursor-pointer rounded-lg border border-[#e5e7eb] px-3 text-[14px] text-[#111827] outline-none">
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={1440}>24 hours</option>
                </select>
              </div>
              <div className="border-b border-[#f3f4f6] px-6 py-4">
                <label className="mb-2 block text-[13px] font-medium text-[#374151]">Maximum advance booking</label>
                <select value={settings.bookingMaxAdvance ?? 60}
                  onChange={(e) => saveSettings(undefined, { bookingMaxAdvance: parseInt(e.target.value) })}
                  className="h-[40px] cursor-pointer rounded-lg border border-[#e5e7eb] px-3 text-[14px] text-[#111827] outline-none">
                  <option value={7}>1 week</option>
                  <option value={14}>2 weeks</option>
                  <option value={30}>1 month</option>
                  <option value={90}>3 months</option>
                </select>
              </div>
              <SettingRow icon={ToggleLeft} label="Allow walk-ins" desc="Accept walk-in appointments">
                <Toggle on={settings.allowWalkIns !== false} onChange={() => saveSettings(undefined, { allowWalkIns: !settings.allowWalkIns })} />
              </SettingRow>
              <SettingRow icon={Banknote} label="Require deposit" desc="Require a deposit when booking">
                <Toggle on={settings.requireDeposit === true} onChange={() => saveSettings(undefined, { requireDeposit: !settings.requireDeposit })} />
              </SettingRow>
              {settings.requireDeposit && (
                <div className="px-6 py-4">
                  <label className="mb-2 block text-[13px] font-medium text-[#374151]">Deposit percentage</label>
                  <input type="number" step="1" value={settings.depositPercentage ?? 25}
                    onChange={(e) => saveSettings(undefined, { depositPercentage: parseFloat(e.target.value) })}
                    className="h-[40px] w-[120px] rounded-lg border border-[#e5e7eb] px-3 text-[14px] text-[#111827] outline-none" />
                  <span className="ml-2 text-[14px] text-[#6b7280]">%</span>
                </div>
              )}
            </div>
          </div>
        )

      case "notif-appointments":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Appointment notifications</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Configure appointment notification settings.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <SettingRow icon={Bell} label="Send confirmations" desc="Email confirmation when an appointment is booked">
                <Toggle on={settings.sendConfirmations !== false} onChange={() => saveSettings(undefined, { sendConfirmations: !settings.sendConfirmations })} />
              </SettingRow>
              <SettingRow icon={Clock} label="Send reminders" desc="Send reminder before the appointment">
                <Toggle on={settings.sendReminders !== false} onChange={() => saveSettings(undefined, { sendReminders: !settings.sendReminders })} />
              </SettingRow>
              {settings.sendReminders !== false && (
                <div className="border-b border-[#f3f4f6] px-6 py-4">
                  <label className="mb-2 block text-[13px] font-medium text-[#374151]">Reminder timing</label>
                  <select value={settings.reminderHours ?? 24}
                    onChange={(e) => saveSettings(undefined, { reminderHours: parseInt(e.target.value) })}
                    className="h-[40px] cursor-pointer rounded-lg border border-[#e5e7eb] px-3 text-[14px] text-[#111827] outline-none">
                    <option value={24}>24 hours before</option>
                    <option value={48}>48 hours before</option>
                    <option value={168}>1 week before</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )

      case "permissions":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Permissions</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Manage permission sets for your team.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              {["Owner", "Manager", "Stylist", "Front Desk", "Read Only"].map((role) => (
                <div key={role} className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-4 last:border-b-0">
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">{role}</p>
                    <p className="text-[13px] text-[#6b7280]">
                      {role === "Owner" ? "Full access to all features" :
                       role === "Manager" ? "Staff, clients, appointments, POS" :
                       role === "Stylist" ? "Own appointments, clients, POS" :
                       role === "Front Desk" ? "Appointments, check-in, POS" :
                       "View-only access to dashboard and reports"}
                    </p>
                  </div>
                  <button className="cursor-pointer text-[13px] font-medium text-[#606e74] hover:underline"
                    style={{ background: "none", border: "none" }}>Edit</button>
                </div>
              ))}
            </div>
          </div>
        )

      case "import":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Import data</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Import data from another system or CSV file.</p>
            <div className="mt-6">
              <label className="mb-2 block text-[13px] font-medium text-[#374151]">Source system</label>
              <div className="flex flex-wrap gap-2">
                {["Square", "Zenoti", "Mindbody", "Vagaro", "Booker", "Custom CSV"].map((src) => (
                  <button key={src} className="cursor-pointer rounded-lg border border-[#e5e7eb] px-4 py-2 text-[13px] font-medium text-[#374151] transition-colors hover:border-[#606e74] hover:bg-[#606e74]/[0.04]"
                    style={{ background: "white" }}>{src}</button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <div className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#d1d5db] p-10 transition-colors hover:border-[#606e74] hover:bg-[#f9fafb]">
                <Upload size={32} strokeWidth={1.5} className="text-[#9ca3af]" />
                <p className="text-[14px] font-medium text-[#6b7280]">Click to upload or drag and drop</p>
                <p className="text-[12px] text-[#9ca3af]">CSV, XLSX up to 10MB</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="mb-3 text-[13px] font-medium text-[#374151]">Import type</p>
              <div className="flex gap-2">
                {["Clients", "Staff", "Services", "Transactions", "Gift Cards"].map((t) => (
                  <button key={t} className="cursor-pointer rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-[12px] font-medium text-[#6b7280] transition-colors hover:border-[#606e74]"
                    style={{ background: "white" }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )

      case "api-keys":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">API keys</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Manage API keys for third-party integrations.</p>
            <button className="mt-4 cursor-pointer rounded-lg bg-[#606e74] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#7a8f96]">
              Create new key
            </button>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <div className="px-6 py-8 text-center">
                <Key size={32} strokeWidth={1.5} className="mx-auto text-[#d1d5db]" />
                <p className="mt-3 text-[14px] text-[#6b7280]">No API keys yet</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Zap size={12} className="text-[#9ca3af]" />
              <span className="text-[11px] text-[#9ca3af]">Payment API powered by SalonTransact</span>
            </div>
          </div>
        )

      case "webhooks":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Webhooks</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Configure webhook endpoints for real-time events.</p>
            <button className="mt-4 cursor-pointer rounded-lg bg-[#606e74] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#7a8f96]">
              Create webhook
            </button>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <div className="px-6 py-8 text-center">
                <Webhook size={32} strokeWidth={1.5} className="mx-auto text-[#d1d5db]" />
                <p className="mt-3 text-[14px] text-[#6b7280]">No webhooks configured</p>
              </div>
            </div>
          </div>
        )

      case "locations":
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Locations</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">Manage your salon locations.</p>
            <button className="mt-4 cursor-pointer rounded-lg bg-[#606e74] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#7a8f96]">
              Add location
            </button>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
              <div className="px-6 py-8 text-center">
                <MapPin size={32} strokeWidth={1.5} className="mx-auto text-[#d1d5db]" />
                <p className="mt-3 text-[14px] text-[#6b7280]">Locations will appear here after onboarding</p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">{NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === section)?.label ?? section}</h2>
            <p className="mt-1 text-[14px] text-[#6b7280]">This section is coming soon.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white px-6 py-8 text-center">
              <ExternalLink size={32} strokeWidth={1.5} className="mx-auto text-[#d1d5db]" />
              <p className="mt-3 text-[14px] text-[#6b7280]">Configuration options will be available here.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      {/* Header */}
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>ACCOUNT</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Settings</h1>
      </div>

      {/* Mobile section picker */}
      <div className="md:hidden" style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[14px] font-medium text-[#111827]">
          {NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === section)?.label ?? "About"}
          <ChevronRight size={16} className={`text-[#9ca3af] transition-transform ${mobileNavOpen ? "rotate-90" : ""}`} />
        </button>
        {mobileNavOpen && (
          <div className="mt-2 max-h-[50vh] overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white">
            {NAV_SECTIONS.map((group) => (
              <div key={group.title}>
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">{group.title}</p>
                {group.items.map((item) => (
                  <button key={item.id} onClick={() => { setSection(item.id); setMobileNavOpen(false) }}
                    className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors ${
                      section === item.id ? "bg-[#606e74]/[0.06] font-semibold text-[#606e74]" : "text-[#374151] hover:bg-[#f9fafb]"
                    }`} style={{ border: "none", background: section === item.id ? "rgba(96,110,116,0.06)" : "transparent" }}>
                    <item.icon size={16} strokeWidth={1.5} className={section === item.id ? "text-[#606e74]" : "text-[#9ca3af]"} />
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Left nav — desktop */}
        <nav className="hidden md:block" style={{
          width: 220, borderRight: "1px solid #e5e7eb", background: "white",
          overflowY: "auto", flexShrink: 0,
        }}>
          {NAV_SECTIONS.map((group) => (
            <div key={group.title} style={{ padding: "8px 0" }}>
              <p style={{ padding: "4px 16px", fontSize: 11, fontWeight: 600, color: "#9ca3af",
                letterSpacing: "0.06em", textTransform: "uppercase" }}>{group.title}</p>
              {group.items.map((item) => {
                const active = section === item.id
                const Icon = item.icon
                return (
                  <button key={item.id} onClick={() => setSection(item.id)}
                    className="cursor-pointer"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", height: 34, padding: "0 16px", border: "none",
                      fontSize: 13, fontWeight: active ? 600 : 400, textAlign: "left",
                      color: active ? "#606e74" : "#374151",
                      background: active ? "rgba(96,110,116,0.08)" : "transparent",
                      transition: "all 120ms",
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
        <div style={{ flex: 1, padding: "32px", maxWidth: 720, overflowY: "auto" }}>
          {renderContent()}
        </div>
      </div>
    </>
  )
}
