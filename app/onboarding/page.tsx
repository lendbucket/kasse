"use client"

import { useState, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  CheckCircle2, Scissors, Sparkles, Shield, Zap, Info, Check, Lock,
  User, Users, Building2, CreditCard, UserCog, X, Plus, AlertCircle,
  MapPin, Grid3X3, Heart, Send, FileText, Smartphone, Download, Upload,
  Receipt, Gift,
} from "lucide-react"
import { formatPhone, formatEIN, formatZip, validateStep } from "@/lib/validation"

export default function OnboardingPage() {
  return <Suspense><OnboardingInner /></Suspense>
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const ONBOARDING_STEPS = [
  { label: "Business Details", desc: "Name, type, contact" },
  { label: "Legal & Tax", desc: "EIN, business structure" },
  { label: "Your Location", desc: "Address and timezone" },
  { label: "Your Team", desc: "Size and operations" },
  { label: "Services", desc: "What you offer" },
  { label: "Payment Setup", desc: "SalonTransact application" },
  { label: "Import Data", desc: "Migrate from your current system" },
]

const BUSINESS_TYPES = [
  { value: "hair_salon", label: "Hair Salon", icon: Scissors },
  { value: "barbershop", label: "Barbershop", icon: User },
  { value: "nail_salon", label: "Nail Salon", icon: Sparkles },
  { value: "spa", label: "Spa", icon: Heart },
  { value: "med_spa", label: "Med Spa", icon: Shield },
  { value: "multi_service", label: "Multi-service", icon: Grid3X3 },
]

const TEAM_SIZES = [
  { value: "solo", label: "Just me", icon: User },
  { value: "small", label: "2\u20135", icon: Users },
  { value: "medium", label: "6\u201315", icon: Users },
  { value: "large", label: "16\u201330", icon: Building2 },
  { value: "enterprise", label: "30+", icon: Building2 },
]

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]
const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
]
const SERVICE_CATEGORIES = ["Hair", "Color", "Nails", "Waxing", "Spa", "Other"]
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, i) => (i + 1) * 15)
const SOURCE_SYSTEMS = ["None (starting fresh)", "Square", "Zenoti", "Mindbody", "Vagaro", "Booker", "Salon Iris", "Other"]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i)

const IMPORT_TYPES = [
  { id: "clients", label: "Clients", icon: Users, description: "Import your client list with contact info", columns: ["first_name", "last_name", "email", "phone", "notes", "created_at"] },
  { id: "transactions", label: "Transactions", icon: Receipt, description: "Import historical revenue data", columns: ["date", "client_name", "service", "amount", "tip", "payment_method"] },
  { id: "gift_cards", label: "Gift Cards", icon: Gift, description: "Import existing gift card balances", columns: ["code", "balance", "issued_date", "expiry_date"] },
  { id: "staff", label: "Staff", icon: UserCog, description: "Import your team members", columns: ["name", "email", "phone", "role", "commission_rate"] },
]

// ═══════════════════════════════════════════
// FORM DATA TYPE
// ═══════════════════════════════════════════

type FormData = {
  businessName: string; businessType: string; phone: string; email: string; website: string; description: string
  legalName: string; structure: string; ein: string; ssnInstead: boolean; stateOfFormation: string; yearEstablished: string
  address: string; suite: string; city: string; state: string; zip: string; timezone: string
  teamSize: string; multipleLocations: string; locationCount: string; isFranchise: string; currentSystem: string
  services: Array<{ name: string; category: string; price: string; duration: string }>
  taxRate: string; tipsEnabled: boolean; tipOptions: number[]; requireDeposit: boolean; depositPercent: string; cancellationFee: boolean; cancellationFeeAmount: string; cancellationWindow: string
  paymentChoice: string; ownerFirstName: string; ownerLastName: string; monthlyVolume: string; avgTicket: string
}

// ═══════════════════════════════════════════
// INPUT STYLE
// ═══════════════════════════════════════════

const iS: React.CSSProperties = {
  width: "100%", height: 44, border: "1px solid #e5e7eb", borderRadius: 8,
  padding: "0 14px", fontSize: 15, color: "#111827", background: "white",
  outline: "none", boxSizing: "border-box", transition: "border-color 150ms", fontFamily: "inherit",
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

function OnboardingInner() {
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified") === "true"
  const [step, setStep] = useState(verified ? 1 : 2)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [applicationSent, setApplicationSent] = useState(false)
  const [activeImport, setActiveImport] = useState("clients")
  const [importedFiles, setImportedFiles] = useState<Record<string, File | null>>({})
  const rightPanelRef = useRef<HTMLDivElement>(null)

  // Service form
  const [svcName, setSvcName] = useState("")
  const [svcCat, setSvcCat] = useState("Hair")
  const [svcPrice, setSvcPrice] = useState("")
  const [svcDuration, setSvcDuration] = useState("60")

  const [formData, setFormData] = useState<FormData>({
    businessName: "", businessType: "", phone: "", email: "", website: "", description: "",
    legalName: "", structure: "", ein: "", ssnInstead: false, stateOfFormation: "", yearEstablished: "",
    address: "", suite: "", city: "", state: "", zip: "", timezone: "America/Chicago",
    teamSize: "", multipleLocations: "no", locationCount: "", isFranchise: "no", currentSystem: "None (starting fresh)",
    services: [],
    taxRate: "8.25", tipsEnabled: true, tipOptions: [15, 18, 20, 25], requireDeposit: false, depositPercent: "25", cancellationFee: false, cancellationFeeAmount: "25", cancellationWindow: "24",
    paymentChoice: "apply_now", ownerFirstName: "", ownerLastName: "", monthlyVolume: "", avgTicket: "",
  })

  function upd<K extends keyof FormData>(k: K, v: FormData[K]) { setFormData((p) => ({ ...p, [k]: v })) }
  function touch(field: string) { setTouched((p) => ({ ...p, [field]: true })) }

  const handleNext = async () => {
    // Validate
    const allTouched = Object.keys(formData).reduce<Record<string, boolean>>((a, k) => ({ ...a, [k]: true }), {})
    setTouched(allTouched)
    const newErrors = validateStep(step, formData)
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    // Save + advance
    setIsLoading(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data: formData }),
      })
      if (step === 9) { window.location.href = "/dashboard"; return }
      setStep((s) => s + 1)
      setErrors({}); setTouched({})
      rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  const handleSendApplication = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/onboarding/send-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerFirstName: formData.ownerFirstName, ownerLastName: formData.ownerLastName,
          monthlyVolume: formData.monthlyVolume, avgTicket: formData.avgTicket,
          businessName: formData.businessName, ein: formData.ein, email: formData.email,
        }),
      })
      setApplicationSent(true)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  function addService() {
    if (!svcName.trim() || !svcPrice) return
    upd("services", [...formData.services, { name: svcName.trim(), category: svcCat, price: svcPrice, duration: svcDuration }])
    setSvcName(""); setSvcPrice(""); setSvcDuration("60")
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, typeId: string) {
    const file = e.target.files?.[0]
    if (file) setImportedFiles((p) => ({ ...p, [typeId]: file }))
  }

  function errEl(field: string) {
    if (!errors[field] || !touched[field]) return null
    return (<div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
      <AlertCircle size={13} style={{ color: "#dc2626", flexShrink: 0 }} strokeWidth={2} />
      <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 500 }}>{errors[field]}</span>
    </div>)
  }

  function errBorder(field: string): React.CSSProperties {
    return errors[field] && touched[field] ? { border: "1px solid #fca5a5", background: "#fff5f5" } : {}
  }

  // ═══════════════════════════════════
  // STEP 1 — Verified Welcome
  // ═══════════════════════════════════
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f8fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ marginBottom: 32 }}><Image src="/kasse-logo.png" alt="kasse." width={80} height={28} style={{ objectFit: "contain", filter: "invert(1)" }} priority /></div>
        <div style={{ background: "white", borderRadius: 16, padding: "clamp(32px, 5vw, 48px) clamp(24px, 5vw, 40px)", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}>
          <div style={{ width: 72, height: 72, background: "rgba(22,163,74,0.08)", border: "2px solid rgba(22,163,74,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle2 size={36} style={{ color: "#16a34a" }} strokeWidth={1.5} />
          </div>
          <div style={{ display: "inline-block", background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, padding: "4px 12px", borderRadius: 999, marginBottom: 16 }}>Email Verified</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 12px" }}>Welcome to Kasse!</h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, margin: "0 0 32px" }}>Your email has been verified. Let&apos;s set up your salon &mdash; it only takes a few minutes.</p>
          <button onClick={() => setStep(2)} style={{ width: "100%", height: 48, background: "#606E74", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Let&apos;s go &rarr;</button>
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#9ca3af" }}>14-day free trial &middot; No credit card required</p>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: "#9ca3af" }}>Powered by <strong style={{ color: "#606E74" }}>SalonTransact</strong></p>
      </div>
    )
  }

  // ═══════════════════════════════════
  // STEPS 2-9 — Two-column layout
  // ═══════════════════════════════════
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ──── LEFT PANEL (dark, fixed) ──── */}
      <div className="hidden md:flex" style={{
        width: 420, minHeight: "100vh", background: "linear-gradient(160deg, #0a0c0e 0%, #111920 100%)",
        flexDirection: "column", padding: "48px 40px", position: "fixed", top: 0, left: 0, bottom: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ marginBottom: 48 }}>
          <Image src="/kasse-logo.png" alt="kasse." width={90} height={32} style={{ objectFit: "contain" }} priority />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Salon Management Platform</p>
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 20 }}>Setup Progress</p>
          {ONBOARDING_STEPS.map((s, i) => {
            const sn = i + 2
            const isCompleted = step > sn
            const isCurrent = step === sn
            return (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 14, marginBottom: 8, padding: "10px 12px", borderRadius: 8,
                background: isCurrent ? "rgba(96,110,116,0.15)" : "transparent",
                border: isCurrent ? "1px solid rgba(96,110,116,0.25)" : "1px solid transparent",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: isCompleted ? "#606E74" : isCurrent ? "rgba(96,110,116,0.3)" : "rgba(255,255,255,0.05)",
                  border: isCompleted ? "none" : isCurrent ? "2px solid #606E74" : "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isCompleted ? <Check size={14} strokeWidth={2.5} style={{ color: "white" }} /> :
                    <span style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? "#7a8f96" : "rgba(255,255,255,0.2)" }}>{i + 1}</span>}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: isCurrent ? 600 : 500, color: isCurrent ? "#e5e7eb" : isCompleted ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)", letterSpacing: "-0.2px" }}>{s.label}</p>
                  {isCurrent && <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{s.desc}</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ icon: Shield, text: "Bank-grade encryption" }, { icon: Lock, text: "SOC 2 Type II compliant" }, { icon: Zap, text: "Powered by SalonTransact" }].map((item) => (
            <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <item.icon size={14} strokeWidth={1.5} style={{ color: "#606E74", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ──── RIGHT PANEL ──── */}
      <div ref={rightPanelRef} className="md:ml-[420px]" style={{ flex: 1, minHeight: "100vh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ height: 64, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(24px, 4vw, 48px)", flexShrink: 0 }}>
          {/* Mobile logo */}
          <div className="md:hidden"><Image src="/kasse-logo.png" alt="kasse." width={60} height={20} style={{ objectFit: "contain", filter: "invert(1)" }} priority /></div>
          <div className="hidden md:block" style={{ height: 3, background: "#f3f4f6", flex: 1, borderRadius: 999, marginRight: 24 }}>
            <div style={{ height: "100%", background: "#606E74", width: `${((step - 1) / 7) * 100}%`, borderRadius: 999, transition: "width 400ms ease" }} />
          </div>
          <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, flexShrink: 0 }}>{step <= 8 ? `Step ${step - 1} of 7` : ""}</span>
        </div>

        {/* Form content */}
        <div style={{ flex: 1, padding: "clamp(32px, 4vw, 64px) clamp(24px, 4vw, 64px)", maxWidth: 640 }}>

          {/* ═══ STEP 2 — Business Details ═══ */}
          {step === 2 && (<div>
            <H title="Tell us about your business" sub="This information appears on your receipts and client communications." />
            <Field label="Business Name" required error={errEl("businessName")}>
              <input type="text" value={formData.businessName} onChange={(e) => upd("businessName", e.target.value)} onBlur={() => touch("businessName")} placeholder="Luxe Hair Studio" style={{ ...iS, ...errBorder("businessName") }} autoFocus />
            </Field>
            <Field label="Business Type" required error={errEl("businessType")}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {BUSINESS_TYPES.map((bt) => (
                  <button key={bt.value} onClick={() => { upd("businessType", bt.value); touch("businessType") }} style={{
                    padding: "16px 12px", borderRadius: 10, cursor: "pointer", textAlign: "center" as const, transition: "all 150ms",
                    border: formData.businessType === bt.value ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: formData.businessType === bt.value ? "rgba(96,110,116,0.06)" : "white",
                    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8,
                  }}>
                    <bt.icon size={22} strokeWidth={1.5} style={{ color: formData.businessType === bt.value ? "#606E74" : "#9ca3af" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: formData.businessType === bt.value ? "#606E74" : "#374151" }}>{bt.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Business Phone" required error={errEl("phone")}>
                <input type="tel" value={formData.phone} onChange={(e) => upd("phone", formatPhone(e.target.value))} onBlur={() => touch("phone")} placeholder="(512) 555-0100" style={{ ...iS, ...errBorder("phone") }} />
              </Field>
              <Field label="Business Email" required error={errEl("email")}>
                <input type="email" value={formData.email} onChange={(e) => upd("email", e.target.value)} onBlur={() => touch("email")} placeholder="hello@studio.com" style={{ ...iS, ...errBorder("email") }} />
              </Field>
            </div>
            <Field label="Website">
              <input type="url" value={formData.website} onChange={(e) => upd("website", e.target.value)} placeholder="https://luxehairstudio.com" style={iS} />
            </Field>
            <Field label="Description">
              <textarea value={formData.description} onChange={(e) => upd("description", e.target.value)} placeholder="Describe your salon for clients..." rows={3} style={{ ...iS, height: "auto", padding: "12px 14px" }} />
            </Field>
          </div>)}

          {/* ═══ STEP 3 — Legal & Tax ═══ */}
          {step === 3 && (<div>
            <H title="Legal & tax information" sub="Required for payment processing and tax reporting." />
            <Field label="Legal Business Name" required error={errEl("legalName")}>
              <input type="text" value={formData.legalName} onChange={(e) => upd("legalName", e.target.value)} onBlur={() => touch("legalName")} placeholder="The name registered with the IRS" style={{ ...iS, ...errBorder("legalName") }} />
            </Field>
            <Field label="Business Structure" required error={errEl("structure")}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {["Sole Proprietor", "LLC", "Corporation", "Partnership"].map((s) => (
                  <button key={s} onClick={() => { upd("structure", s); touch("structure") }} style={{
                    padding: "14px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    border: formData.structure === s ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: formData.structure === s ? "rgba(96,110,116,0.06)" : "white",
                    color: formData.structure === s ? "#606E74" : "#374151", transition: "all 150ms", fontFamily: "inherit",
                  }}>{s}</button>
                ))}
              </div>
            </Field>
            {formData.structure === "Sole Proprietor" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={formData.ssnInstead} onChange={(e) => upd("ssnInstead", e.target.checked)} style={{ width: 16, height: 16, accentColor: "#606E74" }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>I use my SSN instead of an EIN</span>
                </label>
              </div>
            )}
            {!(formData.structure === "Sole Proprietor" && formData.ssnInstead) && formData.structure && (
              <Field label="EIN / Tax ID" required={formData.structure !== "Sole Proprietor"} error={errEl("ein")}>
                <input type="text" value={formData.ein} onChange={(e) => upd("ein", formatEIN(e.target.value))} onBlur={() => touch("ein")} placeholder="XX-XXXXXXX" maxLength={10} style={{ ...iS, ...errBorder("ein"), fontFamily: "var(--font-fira), monospace" }} />
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>Your Employer Identification Number from the IRS</p>
              </Field>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="State of Formation">
                <select value={formData.stateOfFormation} onChange={(e) => upd("stateOfFormation", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer", color: formData.stateOfFormation ? "#111827" : "#9ca3af" }}>
                  <option value="" disabled>Select state</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Year Established">
                <select value={formData.yearEstablished} onChange={(e) => upd("yearEstablished", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer", color: formData.yearEstablished ? "#111827" : "#9ca3af" }}>
                  <option value="" disabled>Select year</option>
                  {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 8 }}>
              <Shield size={16} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} strokeWidth={1.5} />
              <p style={{ margin: 0, fontSize: 13, color: "#15803d", lineHeight: 1.5 }}>Your legal and tax information is encrypted and used only for payment processing compliance through SalonTransact.</p>
            </div>
          </div>)}

          {/* ═══ STEP 4 — Location ═══ */}
          {step === 4 && (<div>
            <H title="Where is your salon located?" sub="Your primary location. You can add more locations later." />
            <Field label="Street Address" required error={errEl("address")}>
              <input type="text" value={formData.address} onChange={(e) => upd("address", e.target.value)} onBlur={() => touch("address")} placeholder="123 Main St" style={{ ...iS, ...errBorder("address") }} />
            </Field>
            <Field label="Suite / Unit">
              <input type="text" value={formData.suite} onChange={(e) => upd("suite", e.target.value)} placeholder="Suite 200" style={iS} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="City" required error={errEl("city")}>
                <input type="text" value={formData.city} onChange={(e) => upd("city", e.target.value)} onBlur={() => touch("city")} placeholder="Austin" style={{ ...iS, ...errBorder("city") }} />
              </Field>
              <Field label="State" required error={errEl("state")}>
                <select value={formData.state} onChange={(e) => { upd("state", e.target.value); touch("state") }} style={{ ...iS, ...errBorder("state"), appearance: "none" as const, cursor: "pointer", color: formData.state ? "#111827" : "#9ca3af" }}>
                  <option value="" disabled>Select</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="ZIP Code" required error={errEl("zip")}>
                <input type="text" value={formData.zip} onChange={(e) => upd("zip", formatZip(e.target.value))} onBlur={() => touch("zip")} placeholder="78701" maxLength={5} style={{ ...iS, ...errBorder("zip") }} />
              </Field>
              <Field label="Timezone" required error={errEl("timezone")}>
                <select value={formData.timezone} onChange={(e) => { upd("timezone", e.target.value); touch("timezone") }} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                  {US_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </Field>
            </div>
          </div>)}

          {/* ═══ STEP 5 — Team ═══ */}
          {step === 5 && (<div>
            <H title="About your team" sub="Help us configure Kasse for how your salon operates." />
            <Field label="Number of stylists" required error={errEl("teamSize")}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {TEAM_SIZES.map((t) => (
                  <button key={t.value} onClick={() => { upd("teamSize", t.value); touch("teamSize") }} style={{
                    padding: "16px 8px", borderRadius: 10, cursor: "pointer", textAlign: "center" as const, transition: "all 150ms",
                    border: formData.teamSize === t.value ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: formData.teamSize === t.value ? "rgba(96,110,116,0.06)" : "white",
                    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6,
                  }}>
                    <t.icon size={18} strokeWidth={1.5} style={{ color: formData.teamSize === t.value ? "#606E74" : "#9ca3af" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: formData.teamSize === t.value ? "#606E74" : "#374151" }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Multiple locations?">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ v: "no", label: "No", ic: MapPin }, { v: "yes", label: "Yes", ic: Building2 }].map((o) => (
                  <button key={o.v} onClick={() => upd("multipleLocations", o.v)} style={{
                    padding: "16px 12px", borderRadius: 10, cursor: "pointer", textAlign: "center" as const, transition: "all 150ms",
                    border: formData.multipleLocations === o.v ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: formData.multipleLocations === o.v ? "rgba(96,110,116,0.06)" : "white",
                    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8,
                  }}>
                    <o.ic size={20} strokeWidth={1.5} style={{ color: formData.multipleLocations === o.v ? "#606E74" : "#9ca3af" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: formData.multipleLocations === o.v ? "#606E74" : "#374151" }}>{o.label}</span>
                  </button>
                ))}
              </div>
            </Field>
            {formData.multipleLocations === "yes" && (
              <Field label="How many total?"><div style={{ display: "flex", gap: 8 }}>
                {["2", "3-5", "6-10", "10+"].map((v) => (
                  <button key={v} onClick={() => upd("locationCount", v)} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: formData.locationCount === v ? "2px solid #606E74" : "1px solid #e5e7eb", background: formData.locationCount === v ? "rgba(96,110,116,0.06)" : "white", color: formData.locationCount === v ? "#606E74" : "#374151", transition: "all 150ms", fontFamily: "inherit" }}>{v}</button>
                ))}
              </div></Field>
            )}
            <Field label="Franchise model?">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {["no", "yes"].map((v) => (
                  <button key={v} onClick={() => upd("isFranchise", v)} style={{ padding: "14px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, border: formData.isFranchise === v ? "2px solid #606E74" : "1px solid #e5e7eb", background: formData.isFranchise === v ? "rgba(96,110,116,0.06)" : "white", color: formData.isFranchise === v ? "#111827" : "#6b7280", transition: "all 150ms", textTransform: "capitalize" as const, fontFamily: "inherit" }}>{v === "yes" ? "Yes" : "No"}</button>
                ))}
              </div>
            </Field>
            {formData.isFranchise === "yes" && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10, marginBottom: 16 }}>
                <Info size={16} style={{ color: "#2563eb", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#1d4ed8", lineHeight: 1.5 }}>You&apos;ll be able to configure franchise fees, royalties, and sub-accounts in your Settings after setup.</p>
              </div>
            )}
            <Field label="Current system?">
              <select value={formData.currentSystem} onChange={(e) => upd("currentSystem", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                {SOURCE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            {formData.currentSystem !== "None (starting fresh)" && formData.currentSystem !== "Other" && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10 }}>
                <Info size={16} style={{ color: "#2563eb", flexShrink: 0, marginTop: 2 }} /><p style={{ margin: 0, fontSize: 13, color: "#1d4ed8", lineHeight: 1.5 }}>We&apos;ll help you import your data from {formData.currentSystem} after setup.</p>
              </div>
            )}
          </div>)}

          {/* ═══ STEP 6 — Services ═══ */}
          {step === 6 && (<div>
            <H title="What services do you offer?" sub="Add your most popular services to get started. You can add more after setup." />
            <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input type="text" value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Service name" style={iS} />
              <select value={svcCat} onChange={(e) => setSvcCat(e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>{SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input type="number" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} placeholder="Price ($)" min="0" step="0.01" style={iS} />
              <select value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                {DURATION_OPTIONS.map((d) => <option key={d} value={String(d)}>{d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ""}` : `${d} min`}</option>)}
              </select>
              <button onClick={addService} disabled={!svcName.trim() || !svcPrice} style={{ ...iS, background: !svcName.trim() || !svcPrice ? "#f3f4f6" : "white", color: !svcName.trim() || !svcPrice ? "#9ca3af" : "#374151", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
                <Plus size={14} /> Add
              </button>
            </div>
            {formData.services.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {formData.services.map((svc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{svc.name}</span>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "rgba(96,110,116,0.08)", color: "#606E74" }}>{svc.category}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{parseInt(svc.duration) >= 60 ? `${Math.floor(parseInt(svc.duration) / 60)}h${parseInt(svc.duration) % 60 ? ` ${parseInt(svc.duration) % 60}m` : ""}` : `${svc.duration} min`}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "var(--font-fira), monospace" }}>${svc.price}</span>
                      <button onClick={() => upd("services", formData.services.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={handleNext} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9ca3af", fontFamily: "inherit" }}>Skip for now, I&apos;ll add services later &rarr;</button>
            </p>
          </div>)}

          {/* ═══ STEP 7 — Payment Setup (SalonTransact Application) ═══ */}
          {step === 7 && (<div>
            <H title="Payment processing setup" sub="Kasse payments are powered by SalonTransact. Complete your merchant application to accept card payments." />
            {/* SalonTransact banner */}
            <div style={{ background: "linear-gradient(135deg, #0a0c0e 0%, #1a2332 100%)", borderRadius: 14, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, border: "1px solid rgba(96,110,116,0.2)" }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Payments powered by</p>
                <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "0.03em" }}>SalonTransact</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>2.4% + $0.10 per transaction &middot; Same-day payouts &middot; No monthly fees</p>
              </div>
              <Zap size={40} style={{ color: "#606E74", flexShrink: 0 }} strokeWidth={1.5} />
            </div>
            {/* Feature grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
              {[{ icon: CreditCard, title: "All major cards", desc: "Visa, MC, Amex, Discover" }, { icon: Smartphone, title: "Tap to pay", desc: "Apple Pay & Google Pay" }, { icon: Zap, title: "Same-day payouts", desc: "Funds daily" }, { icon: Shield, title: "PCI compliant", desc: "Bank-grade security" }].map((f) => (
                <div key={f.title} style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, background: "rgba(96,110,116,0.10)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><f.icon size={18} style={{ color: "#606E74" }} strokeWidth={1.5} /></div>
                  <div><p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{f.title}</p><p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{f.desc}</p></div>
                </div>
              ))}
            </div>
            {/* Application choice */}
            <div style={{ border: "2px solid #e5e7eb", borderRadius: 12, padding: 28, background: "white", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={22} style={{ color: "#16a34a" }} strokeWidth={1.5} /></div>
                <div><h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#111827" }}>Merchant Application</h3><p style={{ margin: 0, fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>To accept card payments, complete a merchant application through Payroc, our payment processor.</p></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {[{ v: "apply_now", title: "Apply now — Send me the application", desc: "We'll send the SalonTransact merchant application to your email. Approval typically takes 1-3 business days." },
                  { v: "apply_later", title: "I'll apply later", desc: "Continue setup now and complete the payment application from Settings. You can still use cash payment." }
                ].map((opt) => (
                  <label key={opt.v} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 20px", border: formData.paymentChoice === opt.v ? "2px solid #606E74" : "1px solid #e5e7eb", borderRadius: 10, background: formData.paymentChoice === opt.v ? "rgba(96,110,116,0.04)" : "white", cursor: "pointer", transition: "all 150ms" }}>
                    <input type="radio" name="paymentChoice" value={opt.v} checked={formData.paymentChoice === opt.v} onChange={() => upd("paymentChoice", opt.v)} style={{ marginTop: 2, accentColor: "#606E74" }} />
                    <div><p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, color: "#111827" }}>{opt.title}</p><p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{opt.desc}</p></div>
                  </label>
                ))}
              </div>
              {formData.paymentChoice === "apply_now" && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #f3f4f6" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Application details</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <Field label="Owner First Name" required><input type="text" value={formData.ownerFirstName} onChange={(e) => upd("ownerFirstName", e.target.value)} placeholder="Robert" style={iS} /></Field>
                    <Field label="Owner Last Name" required><input type="text" value={formData.ownerLastName} onChange={(e) => upd("ownerLastName", e.target.value)} placeholder="Reyna" style={iS} /></Field>
                    <Field label="Est. Monthly Volume" required><select value={formData.monthlyVolume} onChange={(e) => upd("monthlyVolume", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer", background: "white" }}><option value="">Select range</option><option value="Under $5,000">Under $5,000/mo</option><option value="$5k-$15k">$5,000-$15,000/mo</option><option value="$15k-$50k">$15,000-$50,000/mo</option><option value="$50k-$100k">$50,000-$100,000/mo</option><option value="Over $100k">Over $100,000/mo</option></select></Field>
                    <Field label="Avg Ticket Size" required><select value={formData.avgTicket} onChange={(e) => upd("avgTicket", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer", background: "white" }}><option value="">Select range</option><option value="Under $50">Under $50</option><option value="$50-$100">$50-$100</option><option value="$100-$200">$100-$200</option><option value="Over $200">Over $200</option></select></Field>
                  </div>
                  <button onClick={handleSendApplication} disabled={applicationSent || isLoading} style={{
                    width: "100%", height: 48, marginTop: 20,
                    background: applicationSent ? "#f0fdf4" : "#606E74", color: applicationSent ? "#16a34a" : "white",
                    border: applicationSent ? "1px solid #bbf7d0" : "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                    cursor: applicationSent ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {applicationSent ? <><CheckCircle2 size={18} strokeWidth={2} /> Application sent to your email!</> : <><Send size={18} strokeWidth={1.5} /> Send Merchant Application</>}
                  </button>
                  {applicationSent && <p style={{ margin: "12px 0 0", fontSize: 13, color: "#6b7280", textAlign: "center" as const }}>Check your email for the SalonTransact merchant application.</p>}
                </div>
              )}
            </div>
            {/* Tax & tips */}
            <Field label="Sales tax rate (%)" error={errEl("taxRate")}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" step="0.01" min="0" max="30" value={formData.taxRate} onChange={(e) => upd("taxRate", e.target.value)} onBlur={() => touch("taxRate")} style={{ ...iS, ...errBorder("taxRate"), width: 120, fontFamily: "var(--font-fira), monospace" }} />
                <span style={{ fontSize: 14, color: "#9ca3af" }}>% applied to taxable services</span>
              </div>
            </Field>
            <ToggleRow label="Accept tips" desc="Show tip prompt at checkout" on={formData.tipsEnabled} onChange={() => upd("tipsEnabled", !formData.tipsEnabled)} />
            {formData.tipsEnabled && (
              <div style={{ padding: "12px 0 16px", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Tip options</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[15, 18, 20, 25].map((tip) => { const sel = formData.tipOptions.includes(tip); return <button key={tip} onClick={() => upd("tipOptions", sel ? formData.tipOptions.filter((t) => t !== tip) : [...formData.tipOptions, tip])} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: sel ? "2px solid #606E74" : "1px solid #e5e7eb", background: sel ? "rgba(96,110,116,0.06)" : "white", color: sel ? "#606E74" : "#6b7280", transition: "all 150ms", fontFamily: "inherit" }}>{tip}%</button> })}
                </div>
              </div>
            )}
            <ToggleRow label="Require deposit" desc="Collected at booking, applied at checkout" on={formData.requireDeposit} onChange={() => upd("requireDeposit", !formData.requireDeposit)} />
          </div>)}

          {/* ═══ STEP 8 — Import Data ═══ */}
          {step === 8 && (<div>
            <H title="Import your data" sub="Bring your clients, history, and financials from your current system. You can also do this later from Settings." />
            {formData.currentSystem !== "None (starting fresh)" && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                <Info size={18} style={{ color: "#2563eb", flexShrink: 0 }} strokeWidth={1.5} />
                <p style={{ margin: 0, fontSize: 14, color: "#1d4ed8", lineHeight: 1.5 }}>We detected you&apos;re migrating from <strong>{formData.currentSystem}</strong>. We&apos;ve pre-configured the import templates to match their export format.</p>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>
              {IMPORT_TYPES.map((t) => (
                <button key={t.id} onClick={() => setActiveImport(t.id)} style={{
                  height: 36, padding: "0 16px", background: activeImport === t.id ? "#606E74" : "white", color: activeImport === t.id ? "white" : "#6b7280",
                  border: activeImport === t.id ? "none" : "1px solid #e5e7eb", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 150ms", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <t.icon size={14} strokeWidth={1.5} />{t.label}
                  {importedFiles[t.id] && <CheckCircle2 size={13} strokeWidth={2} style={{ color: activeImport === t.id ? "white" : "#16a34a" }} />}
                </button>
              ))}
            </div>
            {IMPORT_TYPES.filter((t) => t.id === activeImport).map((t) => (
              <div key={t.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "#f9fafb", padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#111827" }}>{t.label}</h3><p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{t.description}</p></div>
                  <a href={`/api/onboarding/template?type=${t.id}`} style={{ height: 36, padding: "0 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Download size={14} strokeWidth={1.5} />Template
                  </a>
                </div>
                <div style={{ padding: 24 }}>
                  {!importedFiles[t.id] ? (
                    <label style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "40px 24px", border: "2px dashed #e5e7eb", borderRadius: 10, cursor: "pointer", background: "white", transition: "all 150ms" }}>
                      <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => handleFileSelect(e, t.id)} />
                      <Upload size={32} style={{ color: "#d1d5db", marginBottom: 12 }} strokeWidth={1.5} />
                      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#374151" }}>Drop your file here or click to browse</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Supports CSV, XLS, XLSX &middot; Max 50MB</p>
                    </label>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 20, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                      <CheckCircle2 size={24} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2} />
                      <div style={{ flex: 1 }}><p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{importedFiles[t.id]!.name}</p><p style={{ margin: 0, fontSize: 13, color: "#16a34a" }}>Ready to import &middot; {(importedFiles[t.id]!.size / 1024).toFixed(0)} KB</p></div>
                      <button onClick={() => setImportedFiles((f) => ({ ...f, [t.id]: null }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={16} /></button>
                    </div>
                  )}
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Expected columns</p>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                      {t.columns.map((col) => (<span key={col} style={{ padding: "4px 10px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "var(--font-fira), monospace" }}>{col}</span>))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <p style={{ textAlign: "center" as const, marginTop: 24, fontSize: 14, color: "#9ca3af" }}>
              You can also import from <a href="/dashboard/settings" style={{ color: "#606E74", fontWeight: 600, textDecoration: "none" }}>Settings &rarr; Import Data</a> after setup.
            </p>
          </div>)}

          {/* ═══ STEP 9 — All Set ═══ */}
          {step === 9 && (<div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: 100, height: 100, background: "rgba(22,163,74,0.08)", border: "2px solid rgba(22,163,74,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <CheckCircle2 size={48} style={{ color: "#16a34a" }} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 8px" }}>You&apos;re all set{formData.businessName ? `, ${formData.businessName}` : ""}!</h2>
            <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>Your Kasse portal is ready.</p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, textAlign: "left" as const, marginBottom: 32, padding: "20px 24px", background: "#f9fafb", borderRadius: 12, border: "1px solid #f3f4f6" }}>
              {[
                { ok: true, text: "Business profile complete" },
                { ok: true, text: "Location added" },
                { ok: formData.services.length > 0, text: `${formData.services.length} service${formData.services.length !== 1 ? "s" : ""} added` },
                { ok: applicationSent, text: applicationSent ? "Payment application sent" : "Payment application pending" },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {item.ok ? <CheckCircle2 size={16} style={{ color: "#16a34a" }} strokeWidth={2} /> : <AlertCircle size={16} style={{ color: "#f59e0b" }} strokeWidth={2} />}
                  <span style={{ fontSize: 14, color: "#374151" }}>{item.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
              {[{ icon: UserCog, title: "Add your team", desc: "Invite staff and set roles", href: "/dashboard/staff", color: "#606E74" }, { icon: Scissors, title: "Set up services", desc: "Add services and pricing", href: "/dashboard/services", color: "#2563eb" }, { icon: CreditCard, title: "Try the POS", desc: "Take your first payment", href: "/dashboard/pos", color: "#16a34a" }].map((a) => (
                <a key={a.href} href={a.href} style={{ display: "block", padding: "20px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, textDecoration: "none", cursor: "pointer", textAlign: "center" as const, transition: "border-color 150ms" }}>
                  <div style={{ width: 40, height: 40, background: `${a.color}15`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><a.icon size={20} style={{ color: a.color }} strokeWidth={1.5} /></div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{a.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{a.desc}</p>
                </a>
              ))}
            </div>
            <a href="/dashboard" style={{ display: "block", width: "100%", height: 52, background: "#606E74", color: "white", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", lineHeight: "52px", textAlign: "center" as const }}>Go to Dashboard &rarr;</a>
            <p style={{ margin: "20px 0 0", fontSize: 12, color: "#9ca3af" }}>Powered by <strong style={{ color: "#606E74" }}>SalonTransact</strong></p>
          </div>)}

          {/* ──── Navigation (steps 2-8) ──── */}
          {step >= 2 && step <= 8 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 24, borderTop: "1px solid #f3f4f6" }}>
              {step > 2 ? (
                <button onClick={() => setStep((s) => s - 1)} style={{ height: 44, padding: "0 20px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>&larr; Back</button>
              ) : <div />}
              <button onClick={handleNext} disabled={isLoading} style={{
                height: 44, padding: "0 32px", background: isLoading ? "#e5e7eb" : "#606E74", color: isLoading ? "#9ca3af" : "white",
                border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
                letterSpacing: "-0.2px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, transition: "background 150ms",
              }}>
                {isLoading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />Saving...</> : "Continue \u2192"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) { .md\\:ml-\\[420px\\] { margin-left: 0 !important; } .hidden.md\\:flex { display: none !important; } }
        @media (max-width: 640px) { div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; } div[style*="grid-template-columns: repeat(5"] { grid-template-columns: repeat(3, 1fr) !important; } }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════

function H({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 15, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>{sub}</p>
    </div>
  )
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }} data-error={error ? "true" : undefined}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
      {error}
    </div>
  )
}

function ToggleRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div><p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{label}</p><p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{desc}</p></div>
      <button onClick={onChange} aria-label={`Toggle ${label}`} style={{ width: 44, height: 24, background: on ? "#606E74" : "#e5e7eb", borderRadius: 999, border: "none", cursor: "pointer", position: "relative" as const, transition: "background 150ms", flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute" as const, top: 3, left: on ? 23 : 3, transition: "left 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  )
}
