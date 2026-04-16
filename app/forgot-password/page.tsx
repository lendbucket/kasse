"use client"

import { useState, type FormEvent } from "react"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06080d]">
      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80')",
          backgroundSize: "cover", backgroundPosition: "center",
          animation: "kenBurns 20s ease-in-out infinite alternate",
        }} />
      <div className="absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.40) 100%)" }} />

      <div className="relative z-10 mx-4 w-full max-w-[420px]" style={{ animation: "cardFloat 600ms ease-out both" }}>
        <div style={{
          borderRadius: 24, padding: "40px",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.9)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.10)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Image src="/kasse-logo.png" alt="kasse." width={80} height={28}
              style={{ objectFit: "contain", filter: "invert(1)", margin: "0 auto" }} priority />
          </div>

          {sent ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
              <CheckCircle2 size={48} strokeWidth={1.5} style={{ color: "#16a34a" }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Check your email</h2>
              <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                If an account exists for <strong>{email}</strong>, we sent reset instructions.
              </p>
              <a href="/login" style={{
                marginTop: 16, fontSize: 14, color: "#606E74", fontWeight: 600, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <ArrowLeft size={14} /> Back to sign in
              </a>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0a0c0e", margin: "0 0 4px" }}>Forgot your password?</h2>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label htmlFor="fp-email" className="sr-only">Email</label>
                <input id="fp-email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="Email address"
                  style={{
                    height: 44, width: "100%", borderRadius: 12, padding: "0 16px",
                    fontSize: 16, background: "white", border: "1px solid rgba(0,0,0,0.09)",
                    color: "#0a0c0e", outline: "none",
                  }} />
                <button type="submit" disabled={loading}
                  style={{
                    height: 44, width: "100%", borderRadius: 12, border: "none",
                    background: "#606E74", color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", opacity: loading ? 0.6 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <a href="/login" style={{ fontSize: 13, color: "#606E74", fontWeight: 500, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ArrowLeft size={12} /> Back to sign in
                </a>
              </div>
            </>
          )}
        </div>
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
  )
}
