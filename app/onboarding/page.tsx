"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  CheckCircle2, Scissors, Sparkles, Shield, Zap, Info,
  User, Users, Building2, CreditCard, UserCog, X, Plus,
  MapPin, Grid3X3, Heart,
} from "lucide-react"

export default function OnboardingPage() {
  return <Suspense><OnboardingInner /></Suspense>
}

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

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
]

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

type ServiceItem = { name: string; category: string; price: string; duration: string }

type OnboardingData = {
  // Step 2
  businessName: string; businessType: string; phone: string; email: string; website: string; description: string
  // Step 3
  legalName: string; structure: string; ein: string; ssnInstead: boolean; stateOfFormation: string; yearEstablished: string
  // Step 4
  address: string; suite: string; city: string; state: string; zip: string; country: string; locationPhone: string; timezone: string
  // Step 5
  teamSize: string; multipleLocations: string; locationCount: string; isFranchise: string; currentSystem: string
  // Step 6
  services: ServiceItem[]
  // Step 7
  taxRate: string; tipsEnabled: boolean; tipOptions: number[]; requireDeposit: boolean; depositPercent: string; cancellationFee: boolean; cancellationFeeAmount: string; cancellationWindow: string
}

const iS: React.CSSProperties = {
  width: "100%", height: 44, border: "1px solid #e5e7eb", borderRadius: 8,
  padding: "0 14px", fontSize: 15, color: "#111827", background: "white",
  outline: "none", boxSizing: "border-box", transition: "border-color 150ms",
}

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function StepHeading({ stepNum, title, subtitle }: { stepNum: number; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8 }}>
        Step {stepNum} of 7
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  )
}

function ToggleRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{label}</p>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{desc}</p>
      </div>
      <button onClick={onChange} aria-label={`Toggle ${label}`}
        style={{ width: 44, height: 24, background: on ? "#606E74" : "#e5e7eb", borderRadius: 999, border: "none", cursor: "pointer", position: "relative" as const, transition: "background 150ms", flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute" as const, top: 3, left: on ? 23 : 3, transition: "left 150ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  )
}

function OnboardingInner() {
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified") === "true"
  const [step, setStep] = useState(verified ? 1 : 2)
  const [saving, setSaving] = useState(false)

  // Service form
  const [svcName, setSvcName] = useState("")
  const [svcCat, setSvcCat] = useState("Hair")
  const [svcPrice, setSvcPrice] = useState("")
  const [svcDuration, setSvcDuration] = useState("60")

  const [data, setData] = useState<OnboardingData>({
    businessName: "", businessType: "", phone: "", email: "", website: "", description: "",
    legalName: "", structure: "", ein: "", ssnInstead: false, stateOfFormation: "", yearEstablished: "",
    address: "", suite: "", city: "", state: "", zip: "", country: "United States", locationPhone: "", timezone: "America/Chicago",
    teamSize: "", multipleLocations: "no", locationCount: "", isFranchise: "no", currentSystem: "None (starting fresh)",
    services: [],
    taxRate: "8.25", tipsEnabled: true, tipOptions: [15, 18, 20, 25], requireDeposit: false, depositPercent: "25", cancellationFee: false, cancellationFeeAmount: "25", cancellationWindow: "24",
  })

  function upd<K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  async function saveStep(stepNum: number) {
    setSaving(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, data }),
      })
    } catch { /* continue */ }
    finally { setSaving(false) }
  }

  async function handleNext() {
    if (step === 8) {
      await saveStep(8)
      window.location.href = "/dashboard"
      return
    }
    await saveStep(step)
    setStep((s) => s + 1)
  }

  function addService() {
    if (!svcName.trim() || !svcPrice) return
    upd("services", [...data.services, { name: svcName.trim(), category: svcCat, price: svcPrice, duration: svcDuration }])
    setSvcName(""); setSvcPrice(""); setSvcDuration("60")
  }

  const canContinue = (() => {
    switch (step) {
      case 2: return data.businessName.trim() && data.businessType && data.phone && data.email
      case 3: return data.legalName.trim() && data.structure
      case 4: return data.address.trim() && data.city.trim() && data.state
      case 5: return !!data.teamSize
      default: return true
    }
  })()

  // ═══════════════════════════════════════
  // STEP 1 — Email Verified Welcome
  // ═══════════════════════════════════════
  if (step === 1) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f8fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ marginBottom: 32 }}>
          <Image src="/kasse-logo.png" alt="kasse." width={80} height={28} style={{ objectFit: "contain", filter: "invert(1)" }} priority />
        </div>
        <div style={{
          background: "white", borderRadius: 16,
          padding: "clamp(32px, 5vw, 48px) clamp(24px, 5vw, 40px)",
          maxWidth: 440, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6",
        }}>
          <div style={{ width: 72, height: 72, background: "rgba(22,163,74,0.08)", border: "2px solid rgba(22,163,74,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle2 size={36} style={{ color: "#16a34a" }} strokeWidth={1.5} />
          </div>
          <div style={{ display: "inline-block", background: "rgba(22,163,74,0.08)", color: "#16a34a", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, padding: "4px 12px", borderRadius: 999, marginBottom: 16 }}>
            Email Verified
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 12px" }}>Welcome to Kasse!</h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, margin: "0 0 32px" }}>
            Your email has been verified. Let&apos;s set up your salon &mdash; it only takes a few minutes.
          </p>
          <button onClick={() => setStep(2)} style={{ width: "100%", height: 48, background: "#606E74", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.2px", transition: "background 150ms" }}>
            Let&apos;s go &rarr;
          </button>
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#9ca3af" }}>14-day free trial &middot; No credit card required</p>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: "#9ca3af" }}>Powered by <strong style={{ color: "#606E74" }}>SalonTransact</strong></p>
        <style>{`@keyframes scaleIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
          @media (prefers-reduced-motion:reduce) { @keyframes scaleIn { from,to { opacity:1; transform:none; } } }`}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════
  // STEPS 2-8 — Main wizard layout
  // ═══════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <Image src="/kasse-logo.png" alt="kasse." width={72} height={24} style={{ objectFit: "contain", filter: "invert(1)" }} priority />
        <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>{step <= 8 ? `Step ${step - 1} of 7` : ""}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#f3f4f6" }}>
        <div style={{ height: "100%", background: "#606E74", width: `${((step - 1) / 7) * 100}%`, transition: "width 300ms ease" }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(24px, 4vw, 48px) 24px" }}>
        {/* White card */}
        <div style={{ background: "white", borderRadius: 16, padding: "clamp(28px, 4vw, 48px) clamp(24px, 4vw, 40px)", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>

          {/* ═══ STEP 2 — Business Basics ═══ */}
          {step === 2 && (<div>
            <StepHeading stepNum={1} title="Tell us about your business" subtitle="This information appears on your receipts and client communications." />
            <InputField label="Business Name" required>
              <input type="text" value={data.businessName} onChange={(e) => upd("businessName", e.target.value)} placeholder="Luxe Hair Studio" style={iS} autoFocus
                onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
            </InputField>
            <InputField label="Business Type" required>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                {BUSINESS_TYPES.map((opt) => (
                  <button key={opt.value} onClick={() => upd("businessType", opt.value)} style={{
                    padding: "16px 12px", borderRadius: 10, cursor: "pointer",
                    border: data.businessType === opt.value ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: data.businessType === opt.value ? "rgba(96,110,116,0.06)" : "white",
                    textAlign: "center" as const, transition: "all 150ms", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8,
                  }}>
                    <opt.icon size={22} strokeWidth={1.5} style={{ color: data.businessType === opt.value ? "#606E74" : "#9ca3af" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: data.businessType === opt.value ? "#606E74" : "#374151" }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </InputField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InputField label="Business Phone" required>
                <input type="tel" value={data.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="(512) 555-0100" style={iS}
                  onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
              </InputField>
              <InputField label="Business Email" required>
                <input type="email" value={data.email} onChange={(e) => upd("email", e.target.value)} placeholder="hello@studio.com" style={iS}
                  onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
              </InputField>
            </div>
            <InputField label="Website">
              <input type="url" value={data.website} onChange={(e) => upd("website", e.target.value)} placeholder="https://luxehairstudio.com" style={iS}
                onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
            </InputField>
            <InputField label="Description">
              <textarea value={data.description} onChange={(e) => upd("description", e.target.value)} placeholder="Describe your salon for clients..." rows={3}
                style={{ ...iS, height: "auto", padding: "12px 14px", resize: "vertical" as const }}
                onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
            </InputField>
          </div>)}

          {/* ═══ STEP 3 — Legal & Tax ═══ */}
          {step === 3 && (<div>
            <StepHeading stepNum={2} title="Legal & tax information" subtitle="Required for payment processing and tax reporting. This information is kept secure." />
            <InputField label="Legal Business Name" required>
              <input type="text" value={data.legalName} onChange={(e) => upd("legalName", e.target.value)} placeholder="The name registered with the IRS" style={iS}
                onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
            </InputField>
            <InputField label="Business Structure" required>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {["Sole Proprietor", "LLC", "Corporation", "Partnership"].map((s) => (
                  <button key={s} onClick={() => upd("structure", s)} style={{
                    padding: "14px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    border: data.structure === s ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: data.structure === s ? "rgba(96,110,116,0.06)" : "white",
                    color: data.structure === s ? "#606E74" : "#374151", transition: "all 150ms",
                  }}>{s}</button>
                ))}
              </div>
            </InputField>
            {data.structure === "Sole Proprietor" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={data.ssnInstead} onChange={(e) => upd("ssnInstead", e.target.checked)} style={{ width: 16, height: 16, accentColor: "#606E74" }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>I&apos;m a sole proprietor using my SSN instead</span>
                </label>
              </div>
            )}
            {!(data.structure === "Sole Proprietor" && data.ssnInstead) && (
              <InputField label="EIN / Tax ID" required={data.structure !== "Sole Proprietor"}>
                <input type="text" value={data.ein} onChange={(e) => {
                  let v = e.target.value.replace(/[^0-9-]/g, "")
                  if (v.length === 2 && !v.includes("-") && data.ein.length < v.length) v += "-"
                  if (v.length > 10) v = v.slice(0, 10)
                  upd("ein", v)
                }} placeholder="XX-XXXXXXX" maxLength={10} style={iS}
                  onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>Your Employer Identification Number from the IRS</p>
              </InputField>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InputField label="State of Formation">
                <select value={data.stateOfFormation} onChange={(e) => upd("stateOfFormation", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer", color: data.stateOfFormation ? "#111827" : "#9ca3af" }}>
                  <option value="" disabled>Select state</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </InputField>
              <InputField label="Year Established">
                <select value={data.yearEstablished} onChange={(e) => upd("yearEstablished", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer", color: data.yearEstablished ? "#111827" : "#9ca3af" }}>
                  <option value="" disabled>Select year</option>
                  {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </InputField>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginTop: 20 }}>
              <Shield size={16} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} strokeWidth={1.5} />
              <p style={{ margin: 0, fontSize: 13, color: "#15803d", lineHeight: 1.5 }}>
                Your legal and tax information is encrypted and used only for payment processing compliance through SalonTransact.
              </p>
            </div>
          </div>)}

          {/* ═══ STEP 4 — Location ═══ */}
          {step === 4 && (<div>
            <StepHeading stepNum={3} title="Where is your salon located?" subtitle="Your primary location. You can add more locations later." />
            <InputField label="Street Address" required>
              <input type="text" value={data.address} onChange={(e) => upd("address", e.target.value)} placeholder="123 Main St" style={iS}
                onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
            </InputField>
            <InputField label="Suite / Unit">
              <input type="text" value={data.suite} onChange={(e) => upd("suite", e.target.value)} placeholder="Suite 200" style={iS}
                onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
            </InputField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InputField label="City" required>
                <input type="text" value={data.city} onChange={(e) => upd("city", e.target.value)} placeholder="Austin" style={iS}
                  onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
              </InputField>
              <InputField label="State" required>
                <select value={data.state} onChange={(e) => upd("state", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer", color: data.state ? "#111827" : "#9ca3af" }}>
                  <option value="" disabled>Select</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </InputField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InputField label="ZIP Code" required>
                <input type="text" value={data.zip} onChange={(e) => upd("zip", e.target.value)} placeholder="78701" style={iS}
                  onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
              </InputField>
              <InputField label="Country">
                <select value={data.country} onChange={(e) => upd("country", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                  <option value="United States">United States</option>
                </select>
              </InputField>
            </div>
            <InputField label="Timezone" required>
              <select value={data.timezone} onChange={(e) => upd("timezone", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                {US_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </InputField>
          </div>)}

          {/* ═══ STEP 5 — Team & Operations ═══ */}
          {step === 5 && (<div>
            <StepHeading stepNum={4} title="About your team" subtitle="Help us configure Kasse for how your salon operates." />
            <InputField label="Number of stylists" required>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10 }}>
                {TEAM_SIZES.map((opt) => (
                  <button key={opt.value} onClick={() => upd("teamSize", opt.value)} style={{
                    padding: "16px 12px", borderRadius: 10, cursor: "pointer",
                    border: data.teamSize === opt.value ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: data.teamSize === opt.value ? "rgba(96,110,116,0.06)" : "white",
                    textAlign: "center" as const, transition: "all 150ms", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8,
                  }}>
                    <opt.icon size={20} strokeWidth={1.5} style={{ color: data.teamSize === opt.value ? "#606E74" : "#9ca3af" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: data.teamSize === opt.value ? "#606E74" : "#374151" }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </InputField>
            <InputField label="Multiple locations?">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ v: "no", label: "No", ic: MapPin }, { v: "yes", label: "Yes", ic: Building2 }].map((o) => (
                  <button key={o.v} onClick={() => upd("multipleLocations", o.v)} style={{
                    padding: "16px 12px", borderRadius: 10, cursor: "pointer",
                    border: data.multipleLocations === o.v ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: data.multipleLocations === o.v ? "rgba(96,110,116,0.06)" : "white",
                    textAlign: "center" as const, transition: "all 150ms", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8,
                  }}>
                    <o.ic size={20} strokeWidth={1.5} style={{ color: data.multipleLocations === o.v ? "#606E74" : "#9ca3af" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: data.multipleLocations === o.v ? "#606E74" : "#374151" }}>{o.label}</span>
                  </button>
                ))}
              </div>
            </InputField>
            {data.multipleLocations === "yes" && (
              <InputField label="How many total locations?">
                <div style={{ display: "flex", gap: 8 }}>
                  {["2", "3-5", "6-10", "10+"].map((v) => (
                    <button key={v} onClick={() => upd("locationCount", v)} style={{
                      flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                      border: data.locationCount === v ? "2px solid #606E74" : "1px solid #e5e7eb",
                      background: data.locationCount === v ? "rgba(96,110,116,0.06)" : "white",
                      color: data.locationCount === v ? "#606E74" : "#374151", transition: "all 150ms",
                    }}>{v}</button>
                  ))}
                </div>
              </InputField>
            )}
            <InputField label="Franchise model?">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {["no", "yes"].map((v) => (
                  <button key={v} onClick={() => upd("isFranchise", v)} style={{
                    padding: "14px 12px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
                    border: data.isFranchise === v ? "2px solid #606E74" : "1px solid #e5e7eb",
                    background: data.isFranchise === v ? "rgba(96,110,116,0.06)" : "white",
                    color: data.isFranchise === v ? "#111827" : "#6b7280", transition: "all 150ms", textTransform: "capitalize" as const,
                  }}>{v === "yes" ? "Yes" : "No"}</button>
                ))}
              </div>
            </InputField>
            {data.isFranchise === "yes" && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10, marginBottom: 16 }}>
                <Info size={16} style={{ color: "#2563eb", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#1d4ed8", lineHeight: 1.5 }}>
                  You&apos;ll be able to configure franchise fees, royalties, and sub-accounts in your Settings after setup.
                </p>
              </div>
            )}
            <InputField label="Do you currently use another system?">
              <select value={data.currentSystem} onChange={(e) => upd("currentSystem", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                {SOURCE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </InputField>
            {data.currentSystem !== "None (starting fresh)" && data.currentSystem !== "Other" && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10 }}>
                <Info size={16} style={{ color: "#2563eb", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: "#1d4ed8", lineHeight: 1.5 }}>We&apos;ll help you import your data from {data.currentSystem} after setup.</p>
              </div>
            )}
          </div>)}

          {/* ═══ STEP 6 — Services ═══ */}
          {step === 6 && (<div>
            <StepHeading stepNum={5} title="What services do you offer?" subtitle="Add your most popular services to get started. You can add more after setup." />
            {/* Inline add form */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input type="text" value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Service name" style={iS}
                  onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
                <select value={svcCat} onChange={(e) => setSvcCat(e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                  {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <input type="number" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} placeholder="Price ($)" min="0" step="0.01" style={iS}
                  onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
                <select value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                  {DURATION_OPTIONS.map((d) => <option key={d} value={String(d)}>{d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ""}` : `${d} min`}</option>)}
                </select>
              </div>
              <button onClick={addService} disabled={!svcName.trim() || !svcPrice} style={{
                width: "100%", height: 40, borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                border: "1px solid #e5e7eb", background: "white", color: "#374151", transition: "all 150ms",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: !svcName.trim() || !svcPrice ? 0.4 : 1,
              }}>
                <Plus size={14} /> Add Service
              </button>
            </div>
            {/* Service list */}
            {data.services.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {data.services.map((svc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{svc.name}</span>
                      <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "rgba(96,110,116,0.08)", color: "#606E74" }}>{svc.category}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{parseInt(svc.duration) >= 60 ? `${Math.floor(parseInt(svc.duration) / 60)}h${parseInt(svc.duration) % 60 ? ` ${parseInt(svc.duration) % 60}m` : ""}` : `${svc.duration} min`}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>${svc.price}</span>
                      <button onClick={() => upd("services", data.services.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ textAlign: "center", marginTop: 8 }}>
              <button onClick={() => { handleNext() }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#9ca3af" }}>
                Skip for now, I&apos;ll add services later &rarr;
              </button>
            </p>
          </div>)}

          {/* ═══ STEP 7 — Payment Setup ═══ */}
          {step === 7 && (<div>
            <StepHeading stepNum={6} title="Set up payments" subtitle="Configure how you accept and process payments." />
            <div style={{ background: "linear-gradient(135deg, #0a0c0e 0%, #1a2332 100%)", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Payments powered by</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>SalonTransact</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>2.4% + $0.10 per transaction &middot; Same-day payouts</p>
              </div>
              <Zap size={36} style={{ color: "#606E74", flexShrink: 0 }} strokeWidth={1.5} />
            </div>
            <InputField label="Sales tax rate (%)">
              <input type="number" step="0.01" value={data.taxRate} onChange={(e) => upd("taxRate", e.target.value)} style={{ ...iS, maxWidth: 160 }}
                onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
            </InputField>
            <ToggleRow label="Accept tips" desc="Show tip prompt at checkout" on={data.tipsEnabled} onChange={() => upd("tipsEnabled", !data.tipsEnabled)} />
            {data.tipsEnabled && (
              <div style={{ padding: "12px 0 16px", borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Tip options</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[15, 18, 20, 25].map((tip) => {
                    const sel = data.tipOptions.includes(tip)
                    return <button key={tip} onClick={() => upd("tipOptions", sel ? data.tipOptions.filter((t) => t !== tip) : [...data.tipOptions, tip])} style={{
                      padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                      border: sel ? "2px solid #606E74" : "1px solid #e5e7eb", background: sel ? "rgba(96,110,116,0.06)" : "white", color: sel ? "#606E74" : "#6b7280", transition: "all 150ms",
                    }}>{tip}%</button>
                  })}
                  <button style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "1px solid #e5e7eb", background: "white", color: "#6b7280" }}>Custom</button>
                </div>
              </div>
            )}
            <ToggleRow label="Require deposit" desc="Collected at booking, applied at checkout" on={data.requireDeposit} onChange={() => upd("requireDeposit", !data.requireDeposit)} />
            {data.requireDeposit && (
              <div style={{ padding: "12px 0 16px", borderBottom: "1px solid #f3f4f6" }}>
                <InputField label="Deposit amount (%)">
                  <input type="number" value={data.depositPercent} onChange={(e) => upd("depositPercent", e.target.value)} style={{ ...iS, maxWidth: 120 }}
                    onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
                </InputField>
              </div>
            )}
            <ToggleRow label="Cancellation fee" desc="Charge clients for late cancellations" on={data.cancellationFee} onChange={() => upd("cancellationFee", !data.cancellationFee)} />
            {data.cancellationFee && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12 }}>
                <InputField label="Fee amount ($)">
                  <input type="number" value={data.cancellationFeeAmount} onChange={(e) => upd("cancellationFeeAmount", e.target.value)} style={iS}
                    onFocus={(e) => e.target.style.borderColor = "#606E74"} onBlur={(e) => e.target.style.borderColor = "#e5e7eb"} />
                </InputField>
                <InputField label="Notice required (hours)">
                  <select value={data.cancellationWindow} onChange={(e) => upd("cancellationWindow", e.target.value)} style={{ ...iS, appearance: "none" as const, cursor: "pointer" }}>
                    {[2, 4, 12, 24, 48].map((h) => <option key={h} value={String(h)}>{h} hours</option>)}
                  </select>
                </InputField>
              </div>
            )}
          </div>)}

          {/* ═══ STEP 8 — All Set ═══ */}
          {step === 8 && (<div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ width: 80, height: 80, background: "rgba(22,163,74,0.08)", border: "2px solid rgba(22,163,74,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", animation: "scaleIn 500ms ease-out" }}>
              <CheckCircle2 size={40} style={{ color: "#16a34a" }} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 8px" }}>
              You&apos;re all set{data.businessName ? `, ${data.businessName}` : ""}!
            </h2>
            <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 40px", lineHeight: 1.6 }}>
              Your Kasse portal is ready. Here&apos;s what to do next:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
              {[
                { icon: UserCog, title: "Add your team", desc: "Invite staff and set roles", href: "/dashboard/staff", color: "#606E74" },
                { icon: Scissors, title: "Set up services", desc: "Add services and pricing", href: "/dashboard/services", color: "#2563eb" },
                { icon: CreditCard, title: "Try the POS", desc: "Take your first payment", href: "/dashboard/pos", color: "#16a34a" },
              ].map((action) => (
                <a key={action.href} href={action.href} style={{ display: "block", padding: "20px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, textDecoration: "none", transition: "border-color 150ms, box-shadow 150ms", cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, background: `${action.color}15`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <action.icon size={20} style={{ color: action.color }} strokeWidth={1.5} />
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{action.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{action.desc}</p>
                </a>
              ))}
            </div>
            <a href="/dashboard" style={{ display: "block", width: "100%", height: 52, background: "#606E74", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px", cursor: "pointer", textDecoration: "none", lineHeight: "52px", textAlign: "center" as const, transition: "background 150ms" }}>
              Go to Dashboard &rarr;
            </a>
            <p style={{ margin: "20px 0 0", fontSize: 12, color: "#9ca3af" }}>Powered by <strong style={{ color: "#606E74" }}>SalonTransact</strong></p>
          </div>)}

        </div>

        {/* Navigation buttons (outside card, steps 2-7) */}
        {step >= 2 && step <= 7 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            {step > 2 ? (
              <button onClick={() => setStep((s) => s - 1)} style={{ height: 44, padding: "0 20px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                &larr; Back
              </button>
            ) : <div />}
            <button onClick={handleNext} disabled={!canContinue || saving} style={{
              height: 44, padding: "0 28px", background: "#606E74", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.2px", opacity: !canContinue || saving ? 0.5 : 1,
            }}>
              {saving ? "Saving..." : "Continue \u2192"}
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes scaleIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @media (prefers-reduced-motion:reduce) { @keyframes scaleIn { from,to { opacity:1; transform:none; } } }
        @media (max-width:640px) { div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
