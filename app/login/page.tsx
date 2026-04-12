"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Check } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleMagicLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await signIn("email", {
        email,
        callbackUrl: "/dashboard",
        redirect: false,
      });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-[#06080d]">
      {/* Left Hero Panel — 55% on desktop, hidden on mobile */}
      <div
        className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(96,110,116,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Top — Wordmark */}
        <div className="relative z-10">
          <span className="text-[28px] font-bold tracking-[0.2em] text-white">
            KASSE
          </span>
        </div>

        {/* Center — Hero Content */}
        <div className="relative z-10 max-w-[560px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#606e74]">
            SALON MANAGEMENT PLATFORM
          </p>
          <h1 className="mt-4 text-[42px] font-semibold leading-[1.2] text-white">
            The operating system for modern salons.
          </h1>
          <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-[#7a8f96]">
            Everything your team needs — bookings, payments, staff, and reports
            — in one powerful platform.
          </p>

          {/* Social Proof Chips */}
          <div className="mt-8 flex flex-wrap gap-3">
            {["10,000+ stylists", "99.9% uptime", "SOC 2 compliant"].map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[13px] text-[#7a8f96]"
                >
                  {chip}
                </span>
              )
            )}
          </div>
        </div>

        {/* Bottom — Trust Line */}
        <p className="relative z-10 text-[13px] italic text-[#606e74]">
          Trusted by Salon Envy&reg;
        </p>
      </div>

      {/* Right Auth Panel — 45% on desktop, full on mobile */}
      <div
        className="flex w-full flex-1 items-center justify-center bg-[#0d1117] px-6 py-12 lg:w-[45%]"
        style={{ animation: "slideInRight 500ms ease-out both" }}
      >
        <div
          className="w-full max-w-[380px] rounded-2xl border border-white/[0.06] bg-[#0d1117] p-8"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {/* Logo */}
          <div
            className="mb-8 text-center"
            style={{ animation: "fadeInUp 400ms ease-out both" }}
          >
            <p className="text-[20px] font-bold tracking-[0.2em] text-[#7a8f96]">
              KASSE
            </p>
          </div>

          {/* Heading */}
          <div style={{ animation: "fadeInUp 400ms ease-out 50ms both" }}>
            <h2 className="text-[24px] font-semibold text-white">
              Welcome back
            </h2>
            <p className="mt-1 text-[13px] text-[#606e74]">
              Sign in to continue
            </p>
          </div>

          {/* Google Button */}
          <div
            className="mt-6"
            style={{ animation: "fadeInUp 400ms ease-out 100ms both" }}
          >
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex h-[44px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-[#111920] text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#1a2332]"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.97.48 3.82 1.18 5.27l3.66-3.18z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 3.18c.87-2.6 3.3-4.87 6.16-4.87z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div
            className="my-6 flex items-center gap-4"
            style={{ animation: "fadeInUp 400ms ease-out 150ms both" }}
          >
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] text-[#606e74]">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Email Form / Success State */}
          <div style={{ animation: "fadeInUp 400ms ease-out 200ms both" }}>
            {sent ? (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 px-4 py-6"
                style={{ animation: "scaleIn 300ms ease-out both" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22c55e]/10">
                  <Check size={20} className="text-[#22c55e]" />
                </div>
                <p className="text-[14px] font-medium text-[#22c55e]">
                  Magic link sent! Check your inbox.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleMagicLink}
                className="flex flex-col gap-4"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-[44px] w-full rounded-xl border border-white/[0.06] bg-[#06080d] px-4 text-[16px] text-white placeholder:text-white/25 outline-none transition-all duration-150 focus:border-[#606e74] focus:shadow-[0_0_0_3px_rgba(96,110,116,0.15)]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-[44px] w-full cursor-pointer rounded-xl bg-[#606e74] text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#7a8f96] hover:scale-[1.01] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {submitting ? "Sending..." : "Send Magic Link"}
                </button>
              </form>
            )}
          </div>

          {/* Separator */}
          <div
            className="my-6 h-px bg-white/[0.06]"
            style={{ animation: "fadeInUp 400ms ease-out 250ms both" }}
          />

          {/* Sign Up Link */}
          <p
            className="text-center text-[13px] text-[#606e74]"
            style={{ animation: "fadeInUp 400ms ease-out 300ms both" }}
          >
            Don&apos;t have an account?{" "}
            <a
              href="/onboarding"
              className="cursor-pointer font-medium text-[#7a8f96] transition-colors duration-150 hover:text-white"
            >
              Start free trial &rarr;
            </a>
          </p>

          {/* Footer */}
          <p
            className="mt-6 text-center text-[11px] text-[#606e74]"
            style={{ animation: "fadeInUp 400ms ease-out 350ms both" }}
          >
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>

      {/* Mobile: Logo + tagline at top (visible only on small screens) */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex items-center gap-3 bg-gradient-to-b from-[#06080d] to-transparent px-6 py-4 lg:hidden">
        <span className="text-[20px] font-bold tracking-[0.2em] text-white">
          KASSE
        </span>
        <span className="text-[11px] text-[#606e74]">
          Salon Management Platform
        </span>
      </div>
    </main>
  );
}
