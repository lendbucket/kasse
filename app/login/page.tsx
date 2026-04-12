"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { CheckCircle2 } from "lucide-react";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06080d]">
      {/* Background photo with Ken Burns */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "kenBurns 20s ease-in-out infinite alternate",
        }}
      />

      {/* Dark overlay gradient */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,8,13,0.85) 0%, rgba(6,8,13,0.65) 50%, rgba(6,8,13,0.80) 100%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top-left wordmark */}
      <div className="fixed left-8 top-8 z-30 flex flex-col">
        <span className="text-[22px] font-bold tracking-[0.25em] text-white">
          KASSE
        </span>
        <span className="mt-0.5 text-[11px] tracking-[0.12em] text-white/50">
          Salon Management Platform
        </span>
      </div>

      {/* Center — Glass auth card */}
      <div
        className="relative z-10 mx-4 w-full max-w-[420px]"
        style={{
          animation: "cardFloat 600ms ease-out both",
        }}
      >
        <div
          className="rounded-3xl border border-white/[0.08] p-10"
          style={{
            background: "rgba(13,17,23,0.85)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.4), 0 24px 48px rgba(0,0,0,0.3), 0 48px 96px rgba(0,0,0,0.2)",
          }}
        >
          {/* Logo */}
          <p
            className="text-center text-[18px] font-bold tracking-[0.2em] text-white"
            style={{ animation: "fadeInUp 400ms ease-out 60ms both" }}
          >
            KASSE
          </p>

          {/* Divider line */}
          <div
            className="my-5 h-px w-full bg-white/[0.06]"
            style={{ animation: "fadeInUp 400ms ease-out 120ms both" }}
          />

          {/* Heading */}
          <div style={{ animation: "fadeInUp 400ms ease-out 180ms both" }}>
            <h1 className="text-[22px] font-semibold text-white">
              Welcome back
            </h1>
            <p className="mt-1 mb-6 text-[13px] text-white/50">
              Sign in to your account
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex h-[44px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.06] text-[14px] font-medium text-white transition-all duration-150 hover:bg-white/[0.1]"
            style={{ animation: "fadeInUp 400ms ease-out 240ms both" }}
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

          {/* Divider — or — */}
          <div
            className="my-5 flex items-center gap-4"
            style={{ animation: "fadeInUp 400ms ease-out 300ms both" }}
          >
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] text-white/30">&mdash; or &mdash;</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          {/* Email form / Success state */}
          <div style={{ animation: "fadeInUp 400ms ease-out 360ms both" }}>
            {sent ? (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 px-4 py-6"
                style={{ animation: "scaleIn 300ms ease-out both" }}
              >
                <CheckCircle2
                  size={28}
                  strokeWidth={1.5}
                  className="text-[#22c55e]"
                />
                <p className="text-[14px] font-medium text-[#22c55e]">
                  Magic link sent! Check your inbox.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleMagicLink}
                className="flex flex-col gap-3"
              >
                <label htmlFor="email-input" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-[44px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-[16px] text-white placeholder:text-white/30 outline-none transition-all duration-150 focus:border-[#606e74] focus:shadow-[0_0_0_3px_rgba(96,110,116,0.2)]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 h-[44px] w-full cursor-pointer rounded-xl bg-[#606e74] text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#7a8f96] hover:scale-[1.01] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send Magic Link"}
                </button>
              </form>
            )}
          </div>

          {/* Bottom divider */}
          <div
            className="my-5 h-px w-full bg-white/[0.06]"
            style={{ animation: "fadeInUp 400ms ease-out 420ms both" }}
          />

          {/* Sign up link */}
          <p
            className="text-center text-[13px] text-white/50"
            style={{ animation: "fadeInUp 400ms ease-out 480ms both" }}
          >
            New to Kasse?{" "}
            <a
              href="/onboarding"
              className="cursor-pointer font-medium text-[#7a8f96] transition-colors duration-150 hover:text-white"
            >
              Create an account &rarr;
            </a>
          </p>

          {/* Terms */}
          <p
            className="mt-5 text-center text-[11px] text-white/30"
            style={{ animation: "fadeInUp 400ms ease-out 540ms both" }}
          >
            Terms of Service &middot; Privacy Policy
          </p>
        </div>
      </div>

      {/* Bottom-right social proof pills */}
      <div className="fixed bottom-8 right-8 z-30 hidden items-center gap-2 md:flex">
        {["Trusted by 500+ salons", "PCI Compliant", "SOC 2 Type II"].map(
          (pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/60"
              style={{
                background: "rgba(13,17,23,0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              {pill}
            </span>
          )
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes kenBurns {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        @keyframes cardFloat {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes kenBurns { from, to { transform: scale(1); } }
          @keyframes cardFloat { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </main>
  );
}
