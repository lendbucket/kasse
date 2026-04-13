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
      await signIn("email", { email, callbackUrl: "/dashboard", redirect: false });
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06080d]">
      {/* Background photo */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "kenBurns 20s ease-in-out infinite alternate",
        }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.40) 100%)" }}
      />

      {/* Top-left wordmark */}
      <div className="fixed left-8 top-8 z-30 flex flex-col">
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.25em", color: "white" }}>KASSE</span>
        <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          Salon Management Platform
        </span>
      </div>

      {/* Glass card */}
      <div
        className="relative z-10 mx-4 w-full max-w-[420px]"
        style={{ animation: "cardFloat 600ms ease-out both" }}
      >
        <div
          style={{
            borderRadius: 24,
            padding: 40,
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(28px) saturate(200%)",
            WebkitBackdropFilter: "blur(28px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.10), 0 32px 64px rgba(0,0,0,0.06)",
          }}
        >
          {/* Logo */}
          <p
            style={{
              textAlign: "center", fontSize: 18, fontWeight: 700,
              letterSpacing: "0.2em", color: "#0a0c0e",
              animation: "fadeInUp 400ms ease-out 60ms both",
            }}
          >KASSE</p>

          {/* Divider */}
          <div style={{
            height: 1, background: "rgba(0,0,0,0.08)", margin: "20px 0",
            animation: "fadeInUp 400ms ease-out 120ms both",
          }} />

          {/* Heading */}
          <div style={{ animation: "fadeInUp 400ms ease-out 180ms both" }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "#0a0c0e", margin: 0 }}>Welcome back</h1>
            <p style={{ fontSize: 13, color: "#4a5568", margin: "4px 0 24px" }}>Sign in to your account</p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex h-[44px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl text-[14px] font-medium transition-all duration-150"
            style={{
              background: "white", border: "1px solid rgba(0,0,0,0.10)",
              color: "#0a0c0e", animation: "fadeInUp 400ms ease-out 240ms both",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.97.48 3.82 1.18 5.27l3.66-3.18z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 3.18c.87-2.6 3.3-4.87 6.16-4.87z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-4" style={{ animation: "fadeInUp 400ms ease-out 300ms both" }}>
            <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,0.08)" }} />
            <span style={{ fontSize: 11, color: "#9ca3af" }}>&mdash; or &mdash;</span>
            <div style={{ height: 1, flex: 1, background: "rgba(0,0,0,0.08)" }} />
          </div>

          {/* Form */}
          <div style={{ animation: "fadeInUp 400ms ease-out 360ms both" }}>
            {sent ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                borderRadius: 12, padding: "24px 16px",
                border: "1px solid rgba(22,163,74,0.2)", background: "rgba(22,163,74,0.06)",
                animation: "scaleIn 300ms ease-out both",
              }}>
                <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: "#16a34a" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#16a34a", margin: 0 }}>
                  Magic link sent! Check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                <label htmlFor="email-input" className="sr-only">Email address</label>
                <input
                  id="email-input" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"
                  style={{
                    height: 44, width: "100%", borderRadius: 12, padding: "0 16px",
                    fontSize: 16, background: "white", border: "1px solid rgba(0,0,0,0.09)",
                    color: "#0a0c0e", outline: "none", transition: "all 150ms",
                    letterSpacing: "-0.31px",
                  }}
                />
                <button
                  type="submit" disabled={submitting}
                  style={{
                    height: 44, width: "100%", borderRadius: 12, border: "none",
                    background: "#606E74", color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", transition: "all 150ms", marginTop: 4,
                    opacity: submitting ? 0.6 : 1,
                  }}
                >{submitting ? "Sending..." : "Send Magic Link"}</button>
              </form>
            )}
          </div>

          {/* Divider */}
          <div style={{
            height: 1, background: "rgba(0,0,0,0.08)", margin: "20px 0",
            animation: "fadeInUp 400ms ease-out 420ms both",
          }} />

          {/* Links */}
          <p style={{
            textAlign: "center", fontSize: 13, color: "#4a5568",
            animation: "fadeInUp 400ms ease-out 480ms both", margin: 0,
          }}>
            New to Kasse?{" "}
            <a href="/onboarding" style={{ color: "#606E74", fontWeight: 600, textDecoration: "none" }}>
              Create an account &rarr;
            </a>
          </p>
          <p style={{
            textAlign: "center", fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 20,
            animation: "fadeInUp 400ms ease-out 540ms both",
          }}>
            Terms of Service &middot; Privacy Policy
          </p>
        </div>
      </div>

      {/* Social proof */}
      <div className="fixed bottom-8 right-8 z-30 hidden items-center gap-2 md:flex">
        {["Trusted by 500+ salons", "PCI Compliant", "SOC 2 Type II"].map((pill) => (
          <span key={pill} style={{
            borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 500,
            background: "rgba(255,255,255,0.88)", border: "1px solid rgba(0,0,0,0.10)",
            color: "#4a5568", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }}>{pill}</span>
        ))}
      </div>

      <style>{`
        @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.05); } }
        @keyframes cardFloat { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes kenBurns { from, to { transform: scale(1); } }
          @keyframes cardFloat { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </main>
  );
}
