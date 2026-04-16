"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft, CheckCircle2, Scissors, Sparkles,
  User, Users, Building2, Zap,
} from "lucide-react"

const BUSINESS_TYPES = [
  { id: "hair_salon", label: "Hair Salon", icon: Scissors },
  { id: "barbershop", label: "Barbershop", icon: Scissors },
  { id: "nail_salon", label: "Nail Salon", icon: Sparkles },
  { id: "spa", label: "Spa", icon: Sparkles },
  { id: "multi_service", label: "Multi-service", icon: Building2 },
  { id: "other", label: "Other", icon: Building2 },
]

const TEAM_SIZES = [
  { id: "solo", icon: User, label: "Just me" },
  { id: "small", icon: Users, label: "2\u20135 stylists" },
  { id: "medium", icon: Users, label: "6\u201315 stylists" },
  { id: "large", icon: Building2, label: "15+ stylists" },
]

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
]

const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
]

const TIP_OPTIONS = [15, 18, 20, 25]

type FormData = {
  businessName: string
  businessType: string
  phone: string
  website: string
  address: string
  city: string
  state: string
  zip: string
  timezone: string
  teamSize: string
  multiLocation: boolean
  taxRate: string
  acceptTips: boolean
  tipOptions: number[]
}

export default function OnboardingPage() {
  return <Suspense><OnboardingInner /></Suspense>
}

function OnboardingInner() {
  const searchParams = useSearchParams()
  const verified = searchParams.get("verified") === "true"
  const [step, setStep] = useState(verified ? 1 : 2)
  const totalSteps = 6
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FormData>({
    businessName: "",
    businessType: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    timezone: "America/Chicago",
    teamSize: "",
    multiLocation: false,
    taxRate: "8.25",
    acceptTips: true,
    tipOptions: [15, 20, 25],
  })

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function next() { if (step < totalSteps) setStep(step + 1) }
  function back() { if (step > 1) setStep(step - 1) }

  async function finishOnboarding() {
    setSaving(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    } catch {
      // Continue even if save fails
    } finally {
      setSaving(false)
      next()
    }
  }

  const canContinue = (() => {
    switch (step) {
      case 1: return true
      case 2: return form.businessName.trim().length > 0 && form.businessType.length > 0
      case 3: return form.city.trim().length > 0 && form.state.length > 0
      case 4: return form.teamSize.length > 0
      case 5: return true
      default: return true
    }
  })()

  const inputClass = "h-[44px] w-full rounded-xl border border-[#e5e7eb] bg-white px-4 text-[16px] text-[#111827] placeholder:text-[#9ca3af] outline-none transition-all duration-150 focus:border-[#606e74] focus:shadow-[0_0_0_3px_rgba(96,110,116,0.12)]"
  const cardShadow = "0 0 0 1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)"

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#f7f8fa]">
      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-[#e5e7eb]">
        <div className="h-full bg-[#606e74] transition-all duration-500 ease-out"
          style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      {/* Header */}
      <div className="flex w-full max-w-[560px] items-center justify-between px-6 pt-12">
        {step > 1 && step < 6 ? (
          <button onClick={back}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] transition-colors hover:bg-white hover:text-[#111827]">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        ) : <div className="w-9" />}
        <Image src="/kasse-logo.png" alt="kasse." width={60} height={20}
          style={{ objectFit: "contain", filter: "invert(1)" }} priority />
        <span className="text-[13px] text-[#9ca3af]">
          {step < 6 ? `Step ${step} of ${totalSteps}` : ""}
        </span>
      </div>

      {/* Card */}
      <div className="mt-8 w-full max-w-[560px] rounded-2xl border border-[#e5e7eb] bg-white p-8 sm:p-10"
        style={{ boxShadow: cardShadow }} key={step}>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10"
              style={{ animation: "scaleIn 400ms ease-out both" }}>
              <CheckCircle2 size={32} strokeWidth={1.5} style={{ color: "#22c55e" }} />
            </div>
            <p className="text-[14px] font-medium text-[#22c55e]">Email verified!</p>
            <h1 className="mt-2 text-[28px] font-bold text-[#111827]">Welcome to Kasse!</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">
              Let&apos;s set up your salon in just a few minutes.
            </p>
            <button onClick={next}
              className="mt-10 flex h-[44px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-xl bg-[#606e74] text-[14px] font-semibold text-white transition-all hover:bg-[#7a8f96]"
              style={{ boxShadow: cardShadow }}>
              Let&apos;s go &rarr;
            </button>
          </div>
        )}

        {/* Step 2 — Business Details */}
        {step === 2 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Tell us about your business</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">Basic info to set up your account</p>
            <div className="mt-8 flex flex-col gap-4">
              <input type="text" value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                placeholder="Business name" className={inputClass} autoFocus />

              <div>
                <p className="mb-2 text-[13px] font-medium text-[#374151]">Business type</p>
                <div className="grid grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map((bt) => {
                    const Icon = bt.icon
                    const selected = form.businessType === bt.id
                    return (
                      <button key={bt.id} onClick={() => update("businessType", bt.id)}
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                          selected ? "border-[#606e74] bg-[#606e74]/[0.06]" : "border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]"
                        }`}>
                        <Icon size={18} strokeWidth={1.5} className={selected ? "text-[#606e74]" : "text-[#9ca3af]"} />
                        <span className={`text-[12px] font-medium ${selected ? "text-[#606e74]" : "text-[#6b7280]"}`}>{bt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <input type="tel" value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Phone number" className={inputClass} />
              <input type="url" value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="Website (optional)" className={inputClass} />
            </div>
          </div>
        )}

        {/* Step 3 — Location */}
        {step === 3 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Where is your salon?</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">We&apos;ll use this for booking and receipts</p>
            <div className="mt-8 flex flex-col gap-4">
              <input type="text" value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street address" className={inputClass} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="City" className={inputClass} />
                <select value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer ${!form.state ? "text-[#9ca3af]" : ""}`}>
                  <option value="" disabled>State</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  placeholder="ZIP code" className={inputClass} />
                <select value={form.timezone}
                  onChange={(e) => update("timezone", e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}>
                  {US_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Team */}
        {step === 4 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">How big is your team?</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">We&apos;ll configure the right plan for you</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {TEAM_SIZES.map((size) => {
                const Icon = size.icon
                const selected = form.teamSize === size.id
                return (
                  <button key={size.id} onClick={() => update("teamSize", size.id)}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-6 transition-all ${
                      selected ? "border-[#606e74] bg-[#606e74]/[0.06]" : "border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9fafb]"
                    }`}>
                    <Icon size={20} strokeWidth={1.5} className={selected ? "text-[#606e74]" : "text-[#9ca3af]"} />
                    <span className={`text-[14px] font-semibold ${selected ? "text-[#111827]" : "text-[#6b7280]"}`}>{size.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl border border-[#e5e7eb] p-4">
              <span className="text-[14px] text-[#374151]">Do you have multiple locations?</span>
              <button onClick={() => update("multiLocation", !form.multiLocation)}
                className="cursor-pointer"
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none",
                  background: form.multiLocation ? "#606e74" : "#d1d5db",
                  position: "relative", transition: "background 200ms",
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "white",
                  position: "absolute", top: 3,
                  left: form.multiLocation ? 23 : 3,
                  transition: "left 200ms",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Payments */}
        {step === 5 && (
          <div>
            <h1 className="text-[24px] font-bold text-[#111827]">Set up payments</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">Payments are processed securely by SalonTransact</p>

            <div className="mt-4 flex items-center justify-center">
              <span className="flex items-center gap-2 rounded-full border border-[#606e74]/20 px-4 py-2 text-[12px] font-medium text-[#606e74]">
                <Zap size={12} /> Powered by SalonTransact
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-5">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#374151]">Tax rate (%)</label>
                <input type="number" step="0.01" value={form.taxRate}
                  onChange={(e) => update("taxRate", e.target.value)}
                  className={inputClass} />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#e5e7eb] p-4">
                <span className="text-[14px] text-[#374151]">Accept tips</span>
                <button onClick={() => update("acceptTips", !form.acceptTips)}
                  className="cursor-pointer"
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: form.acceptTips ? "#606e74" : "#d1d5db",
                    position: "relative", transition: "background 200ms",
                  }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "white",
                    position: "absolute", top: 3,
                    left: form.acceptTips ? 23 : 3,
                    transition: "left 200ms",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {form.acceptTips && (
                <div>
                  <p className="mb-2 text-[13px] font-medium text-[#374151]">Tip options</p>
                  <div className="flex gap-2">
                    {TIP_OPTIONS.map((tip) => {
                      const selected = form.tipOptions.includes(tip)
                      return (
                        <button key={tip} onClick={() => {
                          update("tipOptions", selected
                            ? form.tipOptions.filter((t) => t !== tip)
                            : [...form.tipOptions, tip]
                          )
                        }}
                          className={`cursor-pointer rounded-lg border px-4 py-2 text-[13px] font-medium transition-all ${
                            selected ? "border-[#606e74] bg-[#606e74]/[0.06] text-[#606e74]" : "border-[#e5e7eb] text-[#6b7280] hover:border-[#d1d5db]"
                          }`}>
                          {tip}%
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6 — All Set */}
        {step === 6 && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#22c55e]">
                <path d="M8 16.5L13.5 22L24 11" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: 50, strokeDashoffset: 0, animation: "checkmark 500ms ease-out both" }} />
              </svg>
            </div>
            <h1 className="text-[28px] font-bold text-[#111827]">
              You&apos;re all set{form.businessName ? `, ${form.businessName}` : ""}!
            </h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">Your Kasse portal is ready.</p>

            <div className="mt-8 flex w-full flex-col gap-3">
              {[
                { label: "Add your first staff member", href: "/dashboard/staff", icon: Users },
                { label: "Set up your services", href: "/dashboard/services", icon: Scissors },
                { label: "Try the POS terminal", href: "/dashboard/pos", icon: Zap },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <a key={item.href} href={item.href}
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-[#e5e7eb] p-4 text-left transition-all hover:border-[#d1d5db] hover:bg-[#f9fafb]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#606e74]/[0.08]">
                      <Icon size={18} strokeWidth={1.5} className="text-[#606e74]" />
                    </div>
                    <span className="text-[14px] font-medium text-[#111827]">{item.label}</span>
                  </a>
                )
              })}
            </div>

            <a href="/dashboard"
              className="mt-8 flex h-[48px] w-full max-w-[320px] cursor-pointer items-center justify-center rounded-xl bg-[#606e74] text-[14px] font-semibold text-white transition-all hover:bg-[#7a8f96]"
              style={{ boxShadow: cardShadow }}>
              Go to Dashboard &rarr;
            </a>
          </div>
        )}

        {/* Continue (steps 2-5) */}
        {step >= 2 && step <= 5 && (
          <button
            onClick={step === 5 ? finishOnboarding : next}
            disabled={!canContinue || saving}
            className="mt-8 flex h-[44px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#606e74] text-[14px] font-semibold text-white transition-all hover:bg-[#7a8f96] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ boxShadow: cardShadow }}>
            {saving ? "Saving..." : "Continue"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes checkmark { from { stroke-dashoffset: 50; } to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes scaleIn { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </main>
  )
}
