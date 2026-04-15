"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  Scissors,
  User,
  Users,
  Building2,
} from "lucide-react";

const ROLES = [
  {
    id: "owner",
    icon: Crown,
    title: "Owner",
    desc: "I own or co-own the salon and manage everything.",
  },
  {
    id: "manager",
    icon: ShieldCheck,
    title: "Manager",
    desc: "I manage daily operations and staff scheduling.",
  },
  {
    id: "stylist",
    icon: Scissors,
    title: "Stylist",
    desc: "I provide services and manage my own bookings.",
  },
];

const TEAM_SIZES = [
  { id: "solo", icon: User, label: "Just me" },
  { id: "small", icon: Users, label: "2\u20135" },
  { id: "medium", icon: Users, label: "6\u201315" },
  { id: "large", icon: Building2, label: "15+" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

type FormData = {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  role: string;
  teamSize: string;
};

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    businessName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    role: "",
    teamSize: "",
  });

  const totalSteps = 5;

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    if (step < totalSteps) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  const canContinue = (() => {
    switch (step) {
      case 1:
        return form.businessName.trim().length > 0;
      case 2:
        return form.city.trim().length > 0 && form.state.length > 0;
      case 3:
        return form.role.length > 0;
      case 4:
        return form.teamSize.length > 0;
      default:
        return true;
    }
  })();

  const cardShadow =
    "inset 0 1px 0 rgba(255,255,255,0.02), inset 1px 0 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.25), 0 2px 2px rgba(0,0,0,0.12), 0 4px 4px rgba(0,0,0,0.08), 0 8px 8px rgba(0,0,0,0.06)";

  const inputClass =
    "h-[44px] w-full rounded-xl border border-white/[0.06] bg-[#06080d] px-4 text-[16px] text-white placeholder:text-white/25 outline-none transition-all duration-150 focus:border-[#606e74] focus:shadow-[0_0_0_3px_rgba(96,110,116,0.15)]";

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#06080d]">
      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-white/[0.04]">
        <div
          className="h-full bg-[#606e74] transition-all duration-500 ease-out"
          style={{
            width: `${(step / totalSteps) * 100}%`,
            animation: "progressFill 600ms ease-out",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex w-full max-w-[560px] items-center justify-between px-6 pt-12">
        {step > 1 ? (
          <button
            onClick={back}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/[0.06] text-[#7a8f96] transition-colors duration-150 hover:bg-white/[0.04] hover:text-white"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <span className="text-[13px] text-[#606e74]">
          Step {step} of {totalSteps}
        </span>
      </div>

      {/* Card */}
      <div
        className="mt-8 w-full max-w-[560px] rounded-2xl border border-white/[0.06] bg-[#0d1117] p-8 sm:p-10"
        style={{ boxShadow: cardShadow, animation: "scaleIn 300ms ease-out both" }}
        key={step}
      >
        {/* Logo */}
        <Image
          src="/kasse-logo.png"
          alt="kasse."
          width={80}
          height={28}
          style={{ objectFit: "contain", margin: "0 auto 24px", display: "block" }}
        />

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-[32px] font-semibold text-white">
              Let&apos;s set up your salon
            </h1>
            <p className="mt-2 text-[14px] text-[#606e74]">
              This takes about 2 minutes
            </p>
            <div className="mt-10 w-full max-w-[400px]">
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                placeholder="Business name"
                className="h-[56px] w-full rounded-xl border border-white/[0.06] bg-[#06080d] px-5 text-center text-[24px] font-medium text-white placeholder:text-white/25 outline-none transition-all duration-150 focus:border-[#606e74] focus:shadow-[0_0_0_3px_rgba(96,110,116,0.15)]"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div>
            <h1 className="text-[24px] font-semibold text-white">
              Where are you located?
            </h1>
            <p className="mt-1 text-[13px] text-[#606e74]">
              We&apos;ll use this for your booking page and receipts
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <input
                type="text"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Street address"
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="City"
                  className={inputClass}
                />
                <select
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer ${
                    !form.state ? "text-white/25" : ""
                  }`}
                >
                  <option value="" disabled>
                    State
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  placeholder="ZIP code"
                  className={inputClass}
                />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="Phone"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Role */}
        {step === 3 && (
          <div>
            <h1 className="text-[24px] font-semibold text-white">
              What&apos;s your role?
            </h1>
            <p className="mt-1 text-[13px] text-[#606e74]">
              This helps us customize your experience
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const selected = form.role === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => update("role", role.id)}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150 ${
                      selected
                        ? "border-[#606e74] bg-[#606e74]/[0.08]"
                        : "border-white/[0.06] bg-[#06080d] hover:border-white/[0.12] hover:bg-white/[0.02]"
                    }`}
                    style={{ boxShadow: cardShadow }}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-[#606e74]/20 text-[#7a8f96]"
                          : "bg-white/[0.04] text-[#606e74]"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-white">
                        {role.title}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[#606e74]">
                        {role.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4 — Team Size */}
        {step === 4 && (
          <div>
            <h1 className="text-[24px] font-semibold text-white">
              How many stylists work with you?
            </h1>
            <p className="mt-1 text-[13px] text-[#606e74]">
              We&apos;ll configure the right plan for your team
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {TEAM_SIZES.map((size) => {
                const Icon = size.icon;
                const selected = form.teamSize === size.id;
                return (
                  <button
                    key={size.id}
                    onClick={() => update("teamSize", size.id)}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-6 transition-all duration-150 ${
                      selected
                        ? "border-[#606e74] bg-[#606e74]/[0.08]"
                        : "border-white/[0.06] bg-[#06080d] hover:border-white/[0.12] hover:bg-white/[0.02]"
                    }`}
                    style={{ boxShadow: cardShadow }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      className={
                        selected ? "text-[#7a8f96]" : "text-[#606e74]"
                      }
                    />
                    <span className="text-[14px] font-semibold text-white">
                      {size.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5 — Ready */}
        {step === 5 && (
          <div className="flex flex-col items-center py-6 text-center">
            {/* Animated checkmark */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="text-[#22c55e]"
              >
                <path
                  d="M8 16.5L13.5 22L24 11"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 50,
                    strokeDashoffset: 0,
                    animation: "checkmark 500ms ease-out both",
                  }}
                />
              </svg>
            </div>
            <h1 className="text-[32px] font-semibold text-white">
              You&apos;re all set, {form.businessName || "there"}!
            </h1>
            <p className="mt-2 text-[14px] text-[#606e74]">
              Your Kasse portal is ready.
            </p>
            <a
              href="/dashboard"
              className="mt-10 flex h-[48px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-xl bg-[#606e74] text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#7a8f96] hover:scale-[1.01] active:scale-[0.995]"
              style={{ boxShadow: cardShadow }}
            >
              Go to Dashboard &rarr;
            </a>
          </div>
        )}

        {/* Continue Button (steps 1-4) */}
        {step < 5 && (
          <button
            onClick={next}
            disabled={!canContinue}
            className="mt-8 flex h-[44px] w-full cursor-pointer items-center justify-center rounded-xl bg-[#606e74] text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#7a8f96] hover:scale-[1.01] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ boxShadow: cardShadow }}
          >
            Continue
          </button>
        )}
      </div>
    </main>
  );
}
