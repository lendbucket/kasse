"use client"

import { useState, useEffect, useRef, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Building2, User, MapPin, Landmark, SlidersHorizontal, ClipboardCheck,
  CheckCircle2, CreditCard, Globe, AlertCircle, RefreshCw, FileText,
  DollarSign, Lock, Eye, EyeOff, Check,
} from "lucide-react"

export default function OnboardingPage() {
  return <Suspense><OnboardingWizard /></Suspense>
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const STEPS = [
  { label: "Business Info", icon: Building2 },
  { label: "Owner Info", icon: User },
  { label: "Location", icon: MapPin },
  { label: "Banking", icon: Landmark },
  { label: "Processing", icon: SlidersHorizontal },
  { label: "Review", icon: ClipboardCheck },
  { label: "Complete", icon: CheckCircle2 },
]

const BIZ_TYPES = [
  { id: "hair_salon", label: "Hair Salon" },
  { id: "barbershop", label: "Barbershop" },
  { id: "nail_salon", label: "Nail Salon" },
  { id: "spa", label: "Spa" },
  { id: "suite_rental", label: "Suite Rental" },
  { id: "other", label: "Other" },
]

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const YEARS_DOB = Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i)
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

const VOLUMES = ["Under $10,000", "$10,000 – $50,000", "$50,000 – $100,000", "Over $100,000"]
const PAYMENT_METHODS_OPT = [
  { id: "in_person", label: "In-Person Payments", icon: CreditCard },
  { id: "online_deposits", label: "Online Booking Deposits", icon: Globe },
  { id: "no_show", label: "No-Show Fees", icon: AlertCircle },
  { id: "subscriptions", label: "Recurring Subscriptions", icon: RefreshCw },
  { id: "invoicing", label: "Invoicing", icon: FileText },
  { id: "tips", label: "Tips", icon: DollarSign },
]
const AVG_TX = ["Under $50", "$50–$100", "$100–$200", "$200–$500", "Over $500"]
const TITLES = ["Owner", "Co-Owner", "President", "CEO", "Managing Partner", "Other"]

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════

const inputBase: React.CSSProperties = {
  width: "100%", height: 48, background: "#0d1f3c", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "0 16px", fontSize: 15, color: "white", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 200ms, box-shadow 200ms",
}

const labelBase: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6,
}

// ═══════════════════════════════════════
// MAIN WIZARD
// ═══════════════════════════════════════

function OnboardingWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showAcct, setShowAcct] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const addressRef = useRef<HTMLInputElement>(null)

  const [d, setD] = useState({
    legalName: "", dbaName: "", businessType: "", ein: "", phone: "", website: "",
    ownerFirst: "", ownerLast: "", dobMonth: "", dobDay: "", dobYear: "",
    ssnLast4: "", ownerTitle: "", ownershipPct: "", ownerAddress: "",
    address: "", city: "", state: "", zip: "",
    bankHolder: "", routing: "", account: "", accountConfirm: "", accountType: "checking", fundingSpeed: "next_day",
    volume: "", paymentMethods: [] as string[], avgTx: "",
  })

  function upd(field: string, val: string | string[]) { setD((p) => ({ ...p, [field]: val })); setErrors((e) => ({ ...e, [field]: "" })) }

  // Google Places
  useEffect(() => {
    if (step !== 3 || typeof window === "undefined") return
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (!key || document.querySelector("script[data-gp]")) return
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.dataset.gp = "1"
    script.onload = () => initAutocomplete()
    document.head.appendChild(script)
    if ((window as any).google?.maps?.places) initAutocomplete()
  }, [step])

  const initAutocomplete = useCallback(() => {
    if (!addressRef.current || !(window as any).google?.maps?.places) return
    const ac = new (window as any).google.maps.places.Autocomplete(addressRef.current, {
      componentRestrictions: { country: "us" }, types: ["address"],
    })
    ac.addListener("place_changed", () => {
      const place = ac.getPlace()
      if (!place.address_components) return
      let street = "", city = "", state = "", zip = ""
      for (const c of place.address_components) {
        const t = c.types[0]
        if (t === "street_number") street = c.long_name + " "
        if (t === "route") street += c.long_name
        if (t === "locality") city = c.long_name
        if (t === "administrative_area_level_1") state = c.short_name
        if (t === "postal_code") zip = c.long_name
      }
      setD((p) => ({ ...p, address: street.trim(), city, state, zip }))
    })
  }, [])

  // Formatting helpers
  function fmtEIN(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 9)
    return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits
  }
  function fmtPhone(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // Validation
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!d.legalName.trim()) e.legalName = "Legal business name is required"
      if (!d.businessType) e.businessType = "Select a business type"
      if (d.ein.replace(/\D/g, "").length !== 9) e.ein = "EIN must be 9 digits"
      if (d.phone.replace(/\D/g, "").length !== 10) e.phone = "Phone must be 10 digits"
    }
    if (step === 2) {
      if (!d.ownerFirst.trim()) e.ownerFirst = "First name is required"
      if (!d.ownerLast.trim()) e.ownerLast = "Last name is required"
      if (!d.dobMonth || !d.dobDay || !d.dobYear) e.dob = "Date of birth is required"
      if (d.ssnLast4.length !== 4) e.ssnLast4 = "Enter last 4 digits"
      if (!d.ownerTitle) e.ownerTitle = "Select a title"
      const pct = parseInt(d.ownershipPct)
      if (!pct || pct < 1 || pct > 100) e.ownershipPct = "Enter 1-100"
      if (!d.ownerAddress.trim()) e.ownerAddress = "Home address is required"
    }
    if (step === 3) {
      if (!d.address.trim()) e.address = "Street address is required"
      if (!d.city.trim()) e.city = "City is required"
      if (!d.state) e.state = "State is required"
      if (d.zip.replace(/\D/g, "").length !== 5) e.zip = "ZIP must be 5 digits"
    }
    if (step === 4) {
      if (!d.bankHolder.trim()) e.bankHolder = "Account holder name is required"
      if (d.routing.replace(/\D/g, "").length !== 9) e.routing = "Routing number must be 9 digits"
      if (!d.account.trim()) e.account = "Account number is required"
      if (d.account !== d.accountConfirm) e.accountConfirm = "Account numbers don't match"
    }
    if (step === 5) {
      if (!d.volume) e.volume = "Select processing volume"
      if (d.paymentMethods.length === 0) e.paymentMethods = "Select at least one"
      if (!d.avgTx) e.avgTx = "Select average transaction"
    }
    if (step === 6) {
      if (!agreed) e.agreed = "You must agree to proceed"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    if (step === 6) {
      setLoading(true)
      try {
        await fetch("/api/onboarding/complete", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        })
        setStep(7)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
      return
    }
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function Err({ field }: { field: string }) {
    if (!errors[field]) return null
    return <p style={{ margin: "6px 0 0", fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 4 }}>
      <AlertCircle size={12} strokeWidth={2} /> {errors[field]}
    </p>
  }

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 80px" }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
        {STEPS.map((s, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#22c55e" : active ? "#635bff" : "#1f2937",
                border: active ? "2px solid #635bff" : "none", transition: "all 300ms",
              }}>
                {done ? <Check size={14} strokeWidth={3} style={{ color: "white" }} /> :
                  <span style={{ fontSize: 12, fontWeight: 700, color: active ? "white" : "#4b5563" }}>{num}</span>}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 32, height: 2, background: done ? "#22c55e" : "#1f2937", borderRadius: 1 }} />}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 600, height: 3, background: "#1f2937", borderRadius: 999, marginBottom: 32 }}>
        <div style={{ height: "100%", background: "#635bff", borderRadius: 999, width: `${(step / 7) * 100}%`, transition: "width 400ms ease" }} />
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 600, background: "#111827", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: "clamp(32px, 5vw, 48px)",
      }}>

        {/* ═══ STEP 1 — Business Info ═══ */}
        {step === 1 && (<div>
          <StepHeader icon={Building2} title="Tell us about your business" />
          <Fld label="Legal Business Name" required error={<Err field="legalName" />}>
            <input value={d.legalName} onChange={(e) => upd("legalName", e.target.value)} placeholder="Your registered business name" style={inputBase} />
          </Fld>
          <Fld label="DBA / Doing Business As" helper="Leave blank if same as legal name">
            <input value={d.dbaName} onChange={(e) => upd("dbaName", e.target.value)} placeholder="Optional" style={inputBase} />
          </Fld>
          <Fld label="Business Type" required error={<Err field="businessType" />}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {BIZ_TYPES.map((bt) => (
                <button key={bt.id} onClick={() => upd("businessType", bt.id)} style={{
                  padding: "14px 8px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                  border: d.businessType === bt.id ? "2px solid #635bff" : "1px solid rgba(255,255,255,0.1)",
                  background: d.businessType === bt.id ? "rgba(99,91,255,0.1)" : "#0d1f3c",
                  color: d.businessType === bt.id ? "#a5b4fc" : "rgba(255,255,255,0.6)",
                  fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all 150ms",
                }}>{bt.label}</button>
              ))}
            </div>
          </Fld>
          <Fld label="EIN / Tax ID" required helper="Your 9-digit federal tax ID" error={<Err field="ein" />}>
            <input value={d.ein} onChange={(e) => upd("ein", fmtEIN(e.target.value))} placeholder="XX-XXXXXXX" maxLength={10} style={{ ...inputBase, fontFamily: "var(--font-fira), monospace", letterSpacing: 1 }} />
          </Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="Business Phone" required error={<Err field="phone" />}>
              <input value={d.phone} onChange={(e) => upd("phone", fmtPhone(e.target.value))} placeholder="(512) 555-0100" style={inputBase} />
            </Fld>
            <Fld label="Website">
              <input value={d.website} onChange={(e) => upd("website", e.target.value)} placeholder="https://yoursalon.com" style={inputBase} />
            </Fld>
          </div>
        </div>)}

        {/* ═══ STEP 2 — Owner Info ═══ */}
        {step === 2 && (<div>
          <StepHeader icon={User} title="About the owner" sub="Required for payment processing compliance and identity verification" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="First Name" required error={<Err field="ownerFirst" />}>
              <input value={d.ownerFirst} onChange={(e) => upd("ownerFirst", e.target.value)} placeholder="Robert" style={inputBase} />
            </Fld>
            <Fld label="Last Name" required error={<Err field="ownerLast" />}>
              <input value={d.ownerLast} onChange={(e) => upd("ownerLast", e.target.value)} placeholder="Reyna" style={inputBase} />
            </Fld>
          </div>
          <Fld label="Date of Birth" required error={<Err field="dob" />}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr", gap: 8 }}>
              <select value={d.dobMonth} onChange={(e) => upd("dobMonth", e.target.value)} style={{ ...inputBase, appearance: "none", cursor: "pointer", color: d.dobMonth ? "white" : "rgba(255,255,255,0.3)" }}>
                <option value="" disabled>Month</option>
                {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
              </select>
              <select value={d.dobDay} onChange={(e) => upd("dobDay", e.target.value)} style={{ ...inputBase, appearance: "none", cursor: "pointer", color: d.dobDay ? "white" : "rgba(255,255,255,0.3)" }}>
                <option value="" disabled>Day</option>
                {DAYS.map((day) => <option key={day} value={String(day)}>{day}</option>)}
              </select>
              <select value={d.dobYear} onChange={(e) => upd("dobYear", e.target.value)} style={{ ...inputBase, appearance: "none", cursor: "pointer", color: d.dobYear ? "white" : "rgba(255,255,255,0.3)" }}>
                <option value="" disabled>Year</option>
                {YEARS_DOB.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </Fld>
          <Fld label="SSN Last 4" required helper="Last 4 digits of your Social Security Number. Used for identity verification only." error={<Err field="ssnLast4" />}>
            <input value={d.ssnLast4} onChange={(e) => upd("ssnLast4", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="****" maxLength={4}
              type="password" style={{ ...inputBase, fontFamily: "var(--font-fira), monospace", letterSpacing: 4, maxWidth: 160 }} />
          </Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="Job Title" required error={<Err field="ownerTitle" />}>
              <select value={d.ownerTitle} onChange={(e) => upd("ownerTitle", e.target.value)} style={{ ...inputBase, appearance: "none", cursor: "pointer", color: d.ownerTitle ? "white" : "rgba(255,255,255,0.3)" }}>
                <option value="" disabled>Select title</option>
                {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Fld>
            <Fld label="Ownership %" required error={<Err field="ownershipPct" />}>
              <input type="number" value={d.ownershipPct} onChange={(e) => upd("ownershipPct", e.target.value)} placeholder="100" min={1} max={100} style={inputBase} />
            </Fld>
          </div>
          <Fld label="Home Address" required helper="Personal address for identity verification (not your business address)" error={<Err field="ownerAddress" />}>
            <input value={d.ownerAddress} onChange={(e) => upd("ownerAddress", e.target.value)} placeholder="123 Main St, Austin, TX 78701" style={inputBase} />
          </Fld>
        </div>)}

        {/* ═══ STEP 3 — Location ═══ */}
        {step === 3 && (<div>
          <StepHeader icon={MapPin} title="Where is your business located?" sub="Used for payment processing compliance" />
          <Fld label="Street Address" required error={<Err field="address" />}>
            <input ref={addressRef} value={d.address} onChange={(e) => upd("address", e.target.value)} placeholder="Start typing to search..." style={inputBase} />
          </Fld>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fld label="City" required error={<Err field="city" />}>
              <input value={d.city} onChange={(e) => upd("city", e.target.value)} placeholder="Austin" style={inputBase} />
            </Fld>
            <Fld label="State" required error={<Err field="state" />}>
              <select value={d.state} onChange={(e) => upd("state", e.target.value)} style={{ ...inputBase, appearance: "none", cursor: "pointer", color: d.state ? "white" : "rgba(255,255,255,0.3)" }}>
                <option value="" disabled>Select</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Fld>
          </div>
          <Fld label="ZIP Code" required error={<Err field="zip" />}>
            <input value={d.zip} onChange={(e) => upd("zip", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="78701" maxLength={5} style={{ ...inputBase, maxWidth: 160 }} />
          </Fld>
        </div>)}

        {/* ═══ STEP 4 — Banking ═══ */}
        {step === 4 && (<div>
          <StepHeader icon={Landmark} title="Where should we send your payouts?" sub="Your bank account for receiving daily settlements from Payroc" />
          <Fld label="Account Holder Name" required helper="Name exactly as it appears on your bank account" error={<Err field="bankHolder" />}>
            <input value={d.bankHolder} onChange={(e) => upd("bankHolder", e.target.value)} placeholder="Robert Reyna" style={inputBase} />
          </Fld>
          <Fld label="Bank Routing Number" required error={<Err field="routing" />}>
            <input value={d.routing} onChange={(e) => upd("routing", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="9 digits" maxLength={9} style={{ ...inputBase, fontFamily: "var(--font-fira), monospace", letterSpacing: 1 }} />
          </Fld>
          <Fld label="Bank Account Number" required error={<Err field="account" />}>
            <div style={{ position: "relative" }}>
              <input type={showAcct ? "text" : "password"} value={d.account} onChange={(e) => upd("account", e.target.value)} placeholder="Account number" style={{ ...inputBase, paddingRight: 48 }} />
              <button onClick={() => setShowAcct(!showAcct)} aria-label={showAcct ? "Hide" : "Show"} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
                {showAcct ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Fld>
          <Fld label="Confirm Account Number" required error={<Err field="accountConfirm" />}>
            <input type="password" value={d.accountConfirm} onChange={(e) => upd("accountConfirm", e.target.value)} placeholder="Re-enter account number" style={inputBase} />
          </Fld>
          <Fld label="Account Type" required>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["checking", "savings"] as const).map((t) => (
                <button key={t} onClick={() => upd("accountType", t)} style={{
                  padding: "16px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                  border: d.accountType === t ? "2px solid #635bff" : "1px solid rgba(255,255,255,0.1)",
                  background: d.accountType === t ? "rgba(99,91,255,0.1)" : "#0d1f3c",
                  color: d.accountType === t ? "#a5b4fc" : "rgba(255,255,255,0.6)",
                  fontSize: 14, fontWeight: 600, fontFamily: "inherit", textTransform: "capitalize",
                }}>{t}</button>
              ))}
            </div>
          </Fld>
          <Fld label="Funding Speed" required>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: "next_day", label: "Next Day", desc: "Funds arrive next business day", badge: "Recommended" },
                { id: "same_day", label: "Same Day", desc: "Funds arrive same business day" },
                { id: "standard", label: "Standard", desc: "Funds arrive in 2-3 business days" },
              ].map((fs) => (
                <button key={fs.id} onClick={() => upd("fundingSpeed", fs.id)} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px",
                  borderRadius: 8, cursor: "pointer", textAlign: "left",
                  border: d.fundingSpeed === fs.id ? "2px solid #635bff" : "1px solid rgba(255,255,255,0.1)",
                  background: d.fundingSpeed === fs.id ? "rgba(99,91,255,0.1)" : "#0d1f3c",
                  fontFamily: "inherit",
                }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: d.fundingSpeed === fs.id ? "#a5b4fc" : "rgba(255,255,255,0.7)" }}>{fs.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{fs.desc}</p>
                  </div>
                  {fs.badge && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "#635bff", color: "white", letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>{fs.badge}</span>}
                </button>
              ))}
            </div>
          </Fld>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", background: "rgba(99,91,255,0.06)", border: "1px solid rgba(99,91,255,0.15)", borderRadius: 8, marginTop: 8 }}>
            <Lock size={16} style={{ color: "#635bff", flexShrink: 0, marginTop: 2 }} strokeWidth={1.5} />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Your banking information is encrypted with 256-bit AES encryption and transmitted securely to Payroc for payment processing setup.</p>
          </div>
        </div>)}

        {/* ═══ STEP 5 — Processing ═══ */}
        {step === 5 && (<div>
          <StepHeader icon={SlidersHorizontal} title="How will you use SalonTransact?" />
          <Fld label="Monthly Processing Volume" required error={<Err field="volume" />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {VOLUMES.map((v) => (
                <button key={v} onClick={() => upd("volume", v)} style={{
                  padding: "16px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                  border: d.volume === v ? "2px solid #635bff" : "1px solid rgba(255,255,255,0.1)",
                  background: d.volume === v ? "rgba(99,91,255,0.1)" : "#0d1f3c",
                  color: d.volume === v ? "#a5b4fc" : "rgba(255,255,255,0.6)",
                  fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                }}>{v}</button>
              ))}
            </div>
          </Fld>
          <Fld label="Payment Methods" required error={<Err field="paymentMethods" />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PAYMENT_METHODS_OPT.map((pm) => {
                const sel = d.paymentMethods.includes(pm.id)
                return (
                  <button key={pm.id} onClick={() => upd("paymentMethods", sel ? d.paymentMethods.filter((x) => x !== pm.id) : [...d.paymentMethods, pm.id])} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                    border: sel ? "2px solid #635bff" : "1px solid rgba(255,255,255,0.1)",
                    background: sel ? "rgba(99,91,255,0.1)" : "#0d1f3c", fontFamily: "inherit",
                  }}>
                    <pm.icon size={18} strokeWidth={1.5} style={{ color: sel ? "#635bff" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: sel ? "#a5b4fc" : "rgba(255,255,255,0.6)" }}>{pm.label}</span>
                  </button>
                )
              })}
            </div>
          </Fld>
          <Fld label="Average Transaction Amount" required error={<Err field="avgTx" />}>
            <select value={d.avgTx} onChange={(e) => upd("avgTx", e.target.value)} style={{ ...inputBase, appearance: "none", cursor: "pointer", color: d.avgTx ? "white" : "rgba(255,255,255,0.3)" }}>
              <option value="" disabled>Select range</option>
              {AVG_TX.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Fld>
        </div>)}

        {/* ═══ STEP 6 — Review ═══ */}
        {step === 6 && (<div>
          <StepHeader icon={ClipboardCheck} title="Review your application" sub="Please review all information before submitting" />
          {[
            { title: "Business Information", goTo: 1, rows: [
              ["Legal Name", d.legalName], ["DBA", d.dbaName || "\u2014"], ["Type", BIZ_TYPES.find((b) => b.id === d.businessType)?.label || ""], ["EIN", d.ein], ["Phone", d.phone],
            ]},
            { title: "Owner Information", goTo: 2, rows: [
              ["Name", `${d.ownerFirst} ${d.ownerLast}`], ["DOB", d.dobMonth && d.dobDay && d.dobYear ? `${MONTHS[parseInt(d.dobMonth) - 1]} ${d.dobDay}, ${d.dobYear}` : ""], ["SSN Last 4", "\u2022\u2022\u2022\u2022"], ["Title", d.ownerTitle], ["Ownership", `${d.ownershipPct}%`],
            ]},
            { title: "Business Location", goTo: 3, rows: [["Address", `${d.address}, ${d.city}, ${d.state} ${d.zip}`]] },
            { title: "Banking", goTo: 4, rows: [
              ["Account Holder", d.bankHolder], ["Routing", d.routing], ["Account", `\u2022\u2022\u2022\u2022\u2022\u2022${d.account.slice(-4)}`], ["Type", d.accountType], ["Funding", d.fundingSpeed.replace("_", " ")],
            ]},
            { title: "Processing", goTo: 5, rows: [
              ["Volume", d.volume], ["Methods", d.paymentMethods.map((pm) => PAYMENT_METHODS_OPT.find((o) => o.id === pm)?.label).join(", ")], ["Avg Transaction", d.avgTx],
            ]},
          ].map((sec) => (
            <div key={sec.title} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{sec.title}</p>
                <button onClick={() => setStep(sec.goTo)} style={{ fontSize: 13, color: "#635bff", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Edit</button>
              </div>
              <div style={{ background: "#0d1f3c", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                {sec.rows.map(([label, value], i) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < sec.rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                    <span style={{ fontSize: 13, color: "white", fontWeight: 500, textAlign: "right" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "16px", background: "#0d1f3c", borderRadius: 8, border: errors.agreed ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", marginTop: 12 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((er) => ({ ...er, agreed: "" })) }} style={{ width: 18, height: 18, accentColor: "#635bff", marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
              I certify that all information provided is accurate and complete. I authorize Reyna Pay LLC and Payroc to verify this information and process my merchant application.
            </span>
          </label>
          <Err field="agreed" />
        </div>)}

        {/* ═══ STEP 7 — Complete ═══ */}
        {step === 7 && (<div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", animation: "pulseRing 2s ease-in-out infinite" }}>
            <CheckCircle2 size={48} style={{ color: "#22c55e" }} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "white", margin: "0 0 8px" }}>Application Submitted!</h2>
          <p style={{ fontSize: 16, color: "#635bff", fontWeight: 600, margin: "0 0 16px" }}>{d.legalName}</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            Your application has been submitted to our payment processing team. We&apos;ll review your information within 1-2 business days and reach out to complete your setup.
          </p>
          <div style={{ textAlign: "left", marginBottom: 40 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>What happens next</p>
            {[
              { title: "Application Review", desc: "Our team reviews your business information", time: "1-2 business days" },
              { title: "Payroc Underwriting", desc: "Payroc verifies your business and banking information", time: "2-3 business days" },
              { title: "Start Processing", desc: "Receive your merchant ID and begin accepting payments", time: "After approval" },
            ].map((item, i) => (
              <div key={item.title} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#635bff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{i + 1}</span>
                  </div>
                  {i < 2 && <div style={{ width: 2, height: 24, background: "rgba(99,91,255,0.2)", marginTop: 4 }} />}
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "white" }}>{item.title}</p>
                  <p style={{ margin: "0 0 2px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#635bff", fontWeight: 500 }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => router.push("/dashboard")} style={{
              width: "100%", height: 52, background: "#635bff", color: "white", border: "none",
              borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>Go to Dashboard</button>
            <button onClick={() => router.push("/dashboard/settings")} style={{
              width: "100%", height: 44, background: "transparent", color: "#635bff", border: "1px solid rgba(99,91,255,0.3)",
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>Add Team Members</button>
          </div>
        </div>)}

        {/* Nav buttons (steps 1-6) */}
        {step >= 1 && step <= 6 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)} style={{
                height: 44, padding: "0 20px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit",
              }}>&larr; Back</button>
            ) : <div />}
            <button onClick={handleNext} disabled={loading} style={{
              height: 44, padding: "0 32px", background: loading ? "#1f2937" : "#635bff", color: "white",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
            }}>
              {loading ? "Submitting..." : step === 6 ? "Submit Application" : "Continue \u2192"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
          50% { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulseRing { from, to { box-shadow: none; } }
        }
        /* Google Places dropdown styling */
        .pac-container { background: #111827 !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 8px !important; margin-top: 4px !important; }
        .pac-item { border: none !important; padding: 10px 16px !important; color: white !important; cursor: pointer !important; }
        .pac-item:hover { background: rgba(99,91,255,0.1) !important; }
        .pac-item-query { color: white !important; }
        .pac-matched { color: #635bff !important; }
        .pac-icon { display: none !important; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════

function StepHeader({ icon: Icon, title, sub }: { icon: any; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(99,91,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon size={24} strokeWidth={1.5} style={{ color: "#635bff" }} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 6px", letterSpacing: "-0.3px" }}>{title}</h2>
      {sub && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  )
}

function Fld({ label, required, helper, error, children }: { label: string; required?: boolean; helper?: string; error?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {children}
      {helper && !error && <p style={{ margin: "5px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{helper}</p>}
      {error}
    </div>
  )
}
