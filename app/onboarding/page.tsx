"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft, CheckCircle2, Scissors, Sparkles, Shield, Zap,
  User, Users, Building2, CreditCard, UserCog, ChevronRight, X, Plus,
} from "lucide-react"

export default function OnboardingPage() {
  return <Suspense><OnboardingInner /></Suspense>
}

const BUSINESS_TYPES = [
  { id: "hair_salon", label: "Hair Salon", icon: Scissors },
  { id: "barbershop", label: "Barbershop", icon: Scissors },
  { id: "nail_salon", label: "Nail Salon", icon: Sparkles },
  { id: "spa", label: "Spa", icon: Sparkles },
  { id: "med_spa", label: "Med Spa", icon: Shield },
  { id: "multi_service", label: "Multi-service", icon: Building2 },
]

const TEAM_SIZES = [
  { id: "solo", label: "Just me" },
  { id: "small", label: "2\u20135" },
  { id: "medium", label: "6\u201315" },
  { id: "large", label: "16\u201330" },
  { id: "enterprise", label: "30+" },
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
const SOURCE_SYSTEMS = ["None", "Square", "Zenoti", "Mindbody", "Vagaro", "Booker", "Salon Iris"]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i)

type ServiceItem = { name: string; category: string; price: string; duration: number }

type FormData = {
  businessName: string; businessType: string; phone: string; businessEmail: string
  website: string; description: string
  legalName: string; businessStructure: string; ein: string; useSsn: boolean
  stateOfFormation: string; yearEstablished: string
  address: string; suite: string; city: string; state: string; zip: string
  country: string; locationPhone: string; timezone: string
  teamSize: string; multiLocation: boolean; locationCount: string
  isFranchise: boolean; sourceSystem: string
  services: ServiceItem[]
  taxRate: string; acceptTips: boolean; tipOptions: number[]
  requireDeposit: boolean; depositAmount: string
  cancellationFee: boolean; cancellationFeeAmount: string; cancellationHours: string
}

function OnboardingInner() {
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified") === "true"
  const [step, setStep] = useState(verified ? 1 : 2)
  const totalSteps = 8
  const [saving, setSaving] = useState(false)

  // Service form inline state
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [svcName, setSvcName] = useState("")
  const [svcCat, setSvcCat] = useState("Hair")
  const [svcPrice, setSvcPrice] = useState("")
  const [svcDuration, setSvcDuration] = useState(45)

  const [form, setForm] = useState<FormData>({
    businessName: "", businessType: "", phone: "", businessEmail: "",
    website: "", description: "",
    legalName: "", businessStructure: "", ein: "", useSsn: false,
    stateOfFormation: "", yearEstablished: "",
    address: "", suite: "", city: "", state: "", zip: "",
    country: "US", locationPhone: "", timezone: "America/Chicago",
    teamSize: "", multiLocation: false, locationCount: "",
    isFranchise: false, sourceSystem: "None",
    services: [],
    taxRate: "8.25", acceptTips: true, tipOptions: [15, 20, 25],
    requireDeposit: false, depositAmount: "25",
    cancellationFee: false, cancellationFeeAmount: "25", cancellationHours: "24",
  })

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function next() { if (step < totalSteps) setStep(step + 1) }
  function back() { if (step > 1) setStep(step - 1) }

  async function saveStep(stepNum: number) {
    setSaving(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, data: form }),
      })
    } catch { /* continue even if save fails */ }
    finally { setSaving(false) }
  }

  async function handleContinue() {
    await saveStep(step)
    next()
  }

  function addService() {
    if (!svcName.trim() || !svcPrice) return
    update("services", [...form.services, { name: svcName.trim(), category: svcCat, price: svcPrice, duration: svcDuration }])
    setSvcName(""); setSvcPrice(""); setSvcDuration(45); setShowServiceForm(false)
  }

  function removeService(idx: number) {
    update("services", form.services.filter((_, i) => i !== idx))
  }

  const canContinue = (() => {
    switch (step) {
      case 1: return true
      case 2: return form.businessName.trim().length > 0 && form.businessType.length > 0 && form.phone.length > 0 && form.businessEmail.length > 0
      case 3: return form.legalName.trim().length > 0 && form.businessStructure.length > 0
      case 4: return form.city.trim().length > 0 && form.state.length > 0 && form.address.trim().length > 0
      case 5: return form.teamSize.length > 0
      case 6: return true
      case 7: return true
      default: return true
    }
  })()

  const inputStyle = "h-[44px] w-full rounded-lg border border-[#e5e7eb] bg-white px-[14px] text-[15px] text-[#111827] placeholder:text-[#9ca3af] outline-none transition-all duration-150 focus:border-[#606e74] focus:shadow-[0_0_0_3px_rgba(96,110,116,0.12)]"
  const labelStyle = "block text-[13px] font-semibold text-[#374151] mb-1.5"

  // Step 1 — Verified welcome (full viewport)
  if (step === 1) {
    return (
      <main style={{ minHeight: "100vh", background: "#f7f8fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <Image src="/kasse-logo.png" alt="kasse." width={80} height={28} style={{ objectFit: "contain", filter: "invert(1)" }} priority />
        </div>
        <div style={{
          background: "white", borderRadius: 16, padding: "48px 40px", maxWidth: 440, width: "100%",
          textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6",
        }}>
          <div style={{
            width: 72, height: 72, background: "rgba(22,163,74,0.08)", border: "2px solid rgba(22,163,74,0.2)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", animation: "scaleIn 400ms ease-out",
          }}>
            <CheckCircle2 size={36} style={{ color: "#16a34a" }} strokeWidth={1.5} />
          </div>
          <div style={{
            display: "inline-block", background: "rgba(22,163,74,0.08)", color: "#16a34a",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "4px 12px", borderRadius: 999, marginBottom: 16,
          }}>Email Verified</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 12px" }}>
            Welcome to Kasse!
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, margin: "0 0 32px" }}>
            Your email has been verified. Let&apos;s set up your salon &mdash; it only takes a few minutes.
          </p>
          <button onClick={() => setStep(2)} className="cursor-pointer" style={{
            width: "100%", height: 48, background: "#606E74", color: "white", border: "none",
            borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.2px",
            transition: "background 150ms",
          }}>Let&apos;s go &rarr;</button>
          <p style={{ margin: "20px 0 0", fontSize: 12, color: "#9ca3af" }}>14-day free trial &middot; No credit card required</p>
        </div>
        <p style={{ marginTop: 24, fontSize: 12, color: "#9ca3af" }}>
          Powered by <strong style={{ color: "#606E74" }}>SalonTransact</strong>
        </p>
        <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
          @media (prefers-reduced-motion: reduce) { @keyframes scaleIn { from, to { opacity: 1; transform: none; } } }
          @media (max-width: 480px) { main > div:nth-child(2) { padding: 40px 24px !important; } }`}
        </style>
      </main>
    )
  }

  // Steps 2-8
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#f7f8fa]">
      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-[#e5e7eb]">
        <div className="h-full bg-[#606e74] transition-all duration-500 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      {/* Header */}
      <div className="flex w-full max-w-[560px] items-center justify-between px-6 pt-12">
        {step > 1 && step < 8 ? (
          <button onClick={back} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] transition-colors hover:bg-white hover:text-[#111827]">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        ) : <div className="w-9" />}
        <Image src="/kasse-logo.png" alt="kasse." width={60} height={20} style={{ objectFit: "contain", filter: "invert(1)" }} priority />
        <span className="text-[13px] text-[#9ca3af]">{step < 8 ? `Step ${step} of ${totalSteps}` : ""}</span>
      </div>

      {/* Card */}
      <div className="mt-8 mb-12 w-full max-w-[560px] rounded-2xl border border-[#e5e7eb] bg-white p-8 sm:p-10" style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)" }} key={step}>

        {/* STEP 2 — Business Basics */}
        {step === 2 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Tell us about your business</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">This information appears on your receipts and client communications.</p>
            <div className="mt-8 flex flex-col gap-5">
              <div><label className={labelStyle}>Business Name *</label>
                <input type="text" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Luxe Hair Studio" className={inputStyle} autoFocus /></div>
              <div>
                <label className={labelStyle}>Business Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map((bt) => {
                    const Icon = bt.icon; const selected = form.businessType === bt.id
                    return (
                      <button key={bt.id} onClick={() => update("businessType", bt.id)}
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 transition-all ${selected ? "border-[#606e74] bg-[#606e74]/[0.06]" : "border-[#e5e7eb] hover:border-[#d1d5db]"}`}>
                        <Icon size={16} strokeWidth={1.5} className={selected ? "text-[#606e74]" : "text-[#9ca3af]"} />
                        <span className={`text-[11px] font-medium ${selected ? "text-[#606e74]" : "text-[#6b7280]"}`}>{bt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div><label className={labelStyle}>Business Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(512) 555-0100" className={inputStyle} /></div>
              <div><label className={labelStyle}>Business Email *</label>
                <input type="email" value={form.businessEmail} onChange={(e) => update("businessEmail", e.target.value)} placeholder="hello@luxehairstudio.com" className={inputStyle} /></div>
              <div><label className={labelStyle}>Website <span className="font-normal text-[#9ca3af]">(optional)</span></label>
                <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://luxehairstudio.com" className={inputStyle} /></div>
              <div><label className={labelStyle}>Business Description <span className="font-normal text-[#9ca3af]">(optional)</span></label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe your salon for clients..." rows={3}
                  className="w-full rounded-lg border border-[#e5e7eb] bg-white p-3 text-[15px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#606e74] focus:shadow-[0_0_0_3px_rgba(96,110,116,0.12)]" /></div>
            </div>
          </div>
        )}

        {/* STEP 3 — Legal & Tax */}
        {step === 3 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Legal & tax information</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">Required for payment processing and tax reporting. This information is kept secure.</p>
            <div className="mt-8 flex flex-col gap-5">
              <div><label className={labelStyle}>Legal Business Name *</label>
                <input type="text" value={form.legalName} onChange={(e) => update("legalName", e.target.value)} placeholder="The name registered with the IRS" className={inputStyle} /></div>
              <div>
                <label className={labelStyle}>Business Structure *</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Sole Proprietor", "LLC", "Corporation", "Partnership"].map((s) => (
                    <button key={s} onClick={() => update("businessStructure", s)}
                      className={`cursor-pointer rounded-lg border p-3 text-center text-[13px] font-medium transition-all ${form.businessStructure === s ? "border-[#606e74] bg-[#606e74]/[0.06] text-[#606e74]" : "border-[#e5e7eb] text-[#6b7280] hover:border-[#d1d5db]"}`}>{s}</button>
                  ))}
                </div>
              </div>
              {form.businessStructure !== "Sole Proprietor" && (
                <div><label className={labelStyle}>EIN / Tax ID {form.businessStructure === "Sole Proprietor" ? "" : "*"}</label>
                  <input type="text" value={form.ein} onChange={(e) => update("ein", e.target.value)} placeholder="XX-XXXXXXX" className={inputStyle} />
                  <p className="mt-1 text-[12px] text-[#9ca3af]">Your Employer Identification Number from the IRS</p></div>
              )}
              {form.businessStructure === "Sole Proprietor" && (
                <div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={form.useSsn} onChange={(e) => update("useSsn", e.target.checked)}
                      className="h-4 w-4 rounded border-[#d1d5db] accent-[#606e74]" />
                    <span className="text-[13px] text-[#374151]">I use my SSN instead of an EIN</span>
                  </label>
                  {!form.useSsn && (
                    <div className="mt-3"><label className={labelStyle}>EIN / Tax ID <span className="font-normal text-[#9ca3af]">(optional)</span></label>
                      <input type="text" value={form.ein} onChange={(e) => update("ein", e.target.value)} placeholder="XX-XXXXXXX" className={inputStyle} /></div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>State of Formation</label>
                  <select value={form.stateOfFormation} onChange={(e) => update("stateOfFormation", e.target.value)}
                    className={`${inputStyle} appearance-none cursor-pointer ${!form.stateOfFormation ? "text-[#9ca3af]" : ""}`}>
                    <option value="" disabled>Select state</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div><label className={labelStyle}>Year Established</label>
                  <select value={form.yearEstablished} onChange={(e) => update("yearEstablished", e.target.value)}
                    className={`${inputStyle} appearance-none cursor-pointer ${!form.yearEstablished ? "text-[#9ca3af]" : ""}`}>
                    <option value="" disabled>Select year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select></div>
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Shield size={16} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} strokeWidth={1.5} />
                <p style={{ margin: 0, fontSize: 13, color: "#15803d", lineHeight: 1.5 }}>
                  Your legal and tax information is encrypted and used only for payment processing compliance and tax reporting through SalonTransact.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Location */}
        {step === 4 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Where is your salon located?</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">Your primary location. You can add more locations later.</p>
            <div className="mt-8 flex flex-col gap-4">
              <div><label className={labelStyle}>Street Address *</label>
                <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main St" className={inputStyle} /></div>
              <div><label className={labelStyle}>Suite / Unit <span className="font-normal text-[#9ca3af]">(optional)</span></label>
                <input type="text" value={form.suite} onChange={(e) => update("suite", e.target.value)} placeholder="Suite 200" className={inputStyle} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>City *</label>
                  <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Austin" className={inputStyle} /></div>
                <div><label className={labelStyle}>State *</label>
                  <select value={form.state} onChange={(e) => update("state", e.target.value)}
                    className={`${inputStyle} appearance-none cursor-pointer ${!form.state ? "text-[#9ca3af]" : ""}`}>
                    <option value="" disabled>Select</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>ZIP Code *</label>
                  <input type="text" value={form.zip} onChange={(e) => update("zip", e.target.value)} placeholder="78701" className={inputStyle} /></div>
                <div><label className={labelStyle}>Timezone *</label>
                  <select value={form.timezone} onChange={(e) => update("timezone", e.target.value)}
                    className={`${inputStyle} appearance-none cursor-pointer`}>
                    {US_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select></div>
              </div>
              <div><label className={labelStyle}>Location Phone</label>
                <input type="tel" value={form.locationPhone || form.phone} onChange={(e) => update("locationPhone", e.target.value)} className={inputStyle} /></div>
            </div>
          </div>
        )}

        {/* STEP 5 — Team & Operations */}
        {step === 5 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">About your team</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">Help us configure Kasse for how your salon operates.</p>
            <div className="mt-8 flex flex-col gap-6">
              <div>
                <label className={labelStyle}>Number of stylists *</label>
                <div className="flex gap-2">
                  {TEAM_SIZES.map((ts) => (
                    <button key={ts.id} onClick={() => update("teamSize", ts.id)}
                      className={`flex-1 cursor-pointer rounded-lg border p-3 text-center text-[13px] font-medium transition-all ${form.teamSize === ts.id ? "border-[#606e74] bg-[#606e74]/[0.06] text-[#606e74]" : "border-[#e5e7eb] text-[#6b7280] hover:border-[#d1d5db]"}`}>{ts.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelStyle}>Multiple locations?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[false, true].map((v) => (
                    <button key={String(v)} onClick={() => update("multiLocation", v)}
                      className={`cursor-pointer rounded-lg border p-4 text-center text-[14px] font-semibold transition-all ${form.multiLocation === v ? "border-[#606e74] bg-[#606e74]/[0.06] text-[#111827]" : "border-[#e5e7eb] text-[#6b7280] hover:border-[#d1d5db]"}`}>
                      {v ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
                {form.multiLocation && (
                  <div className="mt-3">
                    <label className={labelStyle}>How many total locations?</label>
                    <div className="flex gap-2">
                      {["2", "3-5", "6-10", "10+"].map((v) => (
                        <button key={v} onClick={() => update("locationCount", v)}
                          className={`flex-1 cursor-pointer rounded-lg border p-2 text-center text-[13px] font-medium transition-all ${form.locationCount === v ? "border-[#606e74] bg-[#606e74]/[0.06] text-[#606e74]" : "border-[#e5e7eb] text-[#6b7280]"}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={labelStyle}>Franchise model?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[false, true].map((v) => (
                    <button key={String(v)} onClick={() => update("isFranchise", v)}
                      className={`cursor-pointer rounded-lg border p-4 text-center text-[14px] font-semibold transition-all ${form.isFranchise === v ? "border-[#606e74] bg-[#606e74]/[0.06] text-[#111827]" : "border-[#e5e7eb] text-[#6b7280] hover:border-[#d1d5db]"}`}>
                      {v ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
                {form.isFranchise && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#1d4ed8", lineHeight: 1.5 }}>You&apos;ll be able to set up franchise fees and sub-accounts in Settings.</p>
                  </div>
                )}
              </div>
              <div>
                <label className={labelStyle}>Do you currently use another system?</label>
                <select value={form.sourceSystem} onChange={(e) => update("sourceSystem", e.target.value)}
                  className={`${inputStyle} appearance-none cursor-pointer`}>
                  {SOURCE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {form.sourceSystem !== "None" && (
                  <p className="mt-2 text-[12px] text-[#606e74]">We&apos;ll help you import your data from {form.sourceSystem} after setup.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6 — Services */}
        {step === 6 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">What services do you offer?</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">Add your most popular services now. You can add more in your dashboard.</p>
            <div className="mt-8">
              {/* Service list */}
              {form.services.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  {form.services.map((svc, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-[#e5e7eb] p-3">
                      <div>
                        <p className="text-[14px] font-semibold text-[#111827]">{svc.name}</p>
                        <p className="text-[12px] text-[#6b7280]">{svc.category} &middot; {svc.duration}min &middot; ${svc.price}</p>
                      </div>
                      <button onClick={() => removeService(i)} className="cursor-pointer text-[#9ca3af] hover:text-[#dc2626]" style={{ background: "none", border: "none" }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline add form */}
              {showServiceForm ? (
                <div className="rounded-lg border border-[#606e74] bg-[#f9fafb] p-4">
                  <div className="flex flex-col gap-3">
                    <input type="text" value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Service name" className={inputStyle} autoFocus />
                    <div className="grid grid-cols-3 gap-3">
                      <select value={svcCat} onChange={(e) => setSvcCat(e.target.value)} className={`${inputStyle} appearance-none cursor-pointer`}>
                        {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="number" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} placeholder="$35" min="0" step="0.01" className={inputStyle} />
                      <select value={svcDuration} onChange={(e) => setSvcDuration(parseInt(e.target.value))} className={`${inputStyle} appearance-none cursor-pointer`}>
                        {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d >= 60 ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ""}` : `${d}min`}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addService} disabled={!svcName.trim() || !svcPrice}
                        className="cursor-pointer rounded-lg bg-[#606e74] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40">Add service</button>
                      <button onClick={() => setShowServiceForm(false)}
                        className="cursor-pointer rounded-lg border border-[#e5e7eb] px-4 py-2 text-[13px] font-medium text-[#6b7280]" style={{ background: "white" }}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowServiceForm(true)}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d1d5db] p-4 text-[14px] font-medium text-[#6b7280] transition-colors hover:border-[#606e74] hover:text-[#606e74]" style={{ background: "transparent" }}>
                  <Plus size={16} /> Add a service
                </button>
              )}

              {form.services.length === 0 && (
                <button onClick={() => { next(); saveStep(6) }}
                  className="mt-4 cursor-pointer text-[13px] font-medium text-[#9ca3af] underline" style={{ background: "none", border: "none" }}>
                  Set up services later
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 7 — Payment Setup */}
        {step === 7 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Set up payments</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">All payments are processed securely.</p>

            <div style={{
              background: "linear-gradient(135deg, #0a0c0e, #1a2332)", borderRadius: 12,
              padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 24, marginBottom: 24,
            }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Payments powered by</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>SalonTransact</p>
              </div>
              <Zap size={32} style={{ color: "#606E74" }} strokeWidth={1.5} />
            </div>

            <div className="flex flex-col gap-5">
              <div><label className={labelStyle}>Sales tax rate %</label>
                <input type="number" step="0.01" value={form.taxRate} onChange={(e) => update("taxRate", e.target.value)} className={`${inputStyle} max-w-[200px]`} /></div>

              <ToggleRow label="Accept tips" on={form.acceptTips} onChange={() => update("acceptTips", !form.acceptTips)} />
              {form.acceptTips && (
                <div>
                  <label className={labelStyle}>Tip options</label>
                  <div className="flex gap-2">
                    {[15, 18, 20, 25].map((tip) => {
                      const selected = form.tipOptions.includes(tip)
                      return <button key={tip} onClick={() => update("tipOptions", selected ? form.tipOptions.filter((t) => t !== tip) : [...form.tipOptions, tip])}
                        className={`cursor-pointer rounded-lg border px-4 py-2 text-[13px] font-medium transition-all ${selected ? "border-[#606e74] bg-[#606e74]/[0.06] text-[#606e74]" : "border-[#e5e7eb] text-[#6b7280]"}`}>{tip}%</button>
                    })}
                    <button className="cursor-pointer rounded-lg border border-[#e5e7eb] px-4 py-2 text-[13px] font-medium text-[#6b7280]">Custom</button>
                  </div>
                </div>
              )}

              <ToggleRow label="Require deposit for bookings" on={form.requireDeposit} onChange={() => update("requireDeposit", !form.requireDeposit)} />
              {form.requireDeposit && (
                <div><label className={labelStyle}>Deposit amount (%)</label>
                  <input type="number" value={form.depositAmount} onChange={(e) => update("depositAmount", e.target.value)} className={`${inputStyle} max-w-[160px]`} /></div>
              )}

              <ToggleRow label="Cancellation fee" on={form.cancellationFee} onChange={() => update("cancellationFee", !form.cancellationFee)} />
              {form.cancellationFee && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Fee amount ($)</label>
                    <input type="number" value={form.cancellationFeeAmount} onChange={(e) => update("cancellationFeeAmount", e.target.value)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Hours notice required</label>
                    <input type="number" value={form.cancellationHours} onChange={(e) => update("cancellationHours", e.target.value)} className={inputStyle} /></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 8 — All Set */}
        {step === 8 && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#22c55e]">
                <path d="M8 16.5L13.5 22L24 11" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: 50, strokeDashoffset: 0, animation: "checkmark 500ms ease-out both" }} />
              </svg>
            </div>
            <h1 className="text-[26px] font-bold text-[#111827]">
              You&apos;re all set{form.businessName ? `, ${form.businessName}` : ""}!
            </h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">Your Kasse portal is ready. Here&apos;s what to do next:</p>

            <div className="mt-8 flex w-full flex-col gap-3">
              {[
                { icon: UserCog, title: "Add your team", desc: "Invite staff and set their roles", href: "/dashboard/staff", color: "#606E74" },
                { icon: Scissors, title: "Set up services", desc: "Add services and pricing", href: "/dashboard/services", color: "#2563eb" },
                { icon: CreditCard, title: "Try the POS", desc: "Take your first payment", href: "/dashboard/pos", color: "#16a34a" },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <a key={item.href} href={item.href}
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#e5e7eb] p-5 text-left transition-all hover:border-[#606e74]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${item.color}12` }}>
                      <Icon size={18} strokeWidth={1.5} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-[#111827]">{item.title}</p>
                      <p className="text-[13px] text-[#6b7280]">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#d1d5db]" />
                  </a>
                )
              })}
            </div>

            <a href="/dashboard"
              className="mt-8 flex h-[52px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#606e74] text-[18px] font-bold text-white transition-all hover:bg-[#7a8f96]"
              style={{ boxShadow: "0 4px 12px rgba(96,110,116,0.3)" }}>
              Go to Dashboard &rarr;
            </a>
            <p className="mt-4 text-[12px] text-[#9ca3af]">
              Powered by <strong className="text-[#606e74]">SalonTransact</strong>
            </p>
          </div>
        )}

        {/* Continue button (steps 2-7) */}
        {step >= 2 && step <= 7 && (
          <button onClick={handleContinue} disabled={!canContinue || saving}
            className="mt-8 flex h-[44px] w-full cursor-pointer items-center justify-center rounded-lg bg-[#606e74] text-[14px] font-semibold text-white transition-all hover:bg-[#7a8f96] disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? "Saving..." : "Continue"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes checkmark { from { stroke-dashoffset: 50; } to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) { @keyframes checkmark { from, to { stroke-dashoffset: 0; } } }
      `}</style>
    </main>
  )
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e5e7eb] p-4">
      <span className="text-[14px] font-medium text-[#374151]">{label}</span>
      <button onClick={onChange} className="cursor-pointer" aria-label={`Toggle ${label}`}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none",
          background: on ? "#606e74" : "#d1d5db", position: "relative", transition: "background 200ms",
        }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "white",
          position: "absolute", top: 3, left: on ? 23 : 3, transition: "left 200ms",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  )
}
