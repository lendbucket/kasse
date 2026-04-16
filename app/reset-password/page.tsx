"use client"

import { useState, type FormEvent, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"

function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"]

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordInner /></Suspense>
}

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    if (!token) { setError("Missing reset token"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to reset password")
      } else {
        setSuccess(true)
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = getPasswordStrength(password)
  const inputStyle: React.CSSProperties = {
    height: 44, width: "100%", borderRadius: 12, padding: "0 44px 0 16px",
    fontSize: 16, background: "white", border: "1px solid rgba(0,0,0,0.09)",
    color: "#0a0c0e", outline: "none",
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
          borderRadius: 24, padding: 40,
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

          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
              <CheckCircle2 size={48} strokeWidth={1.5} style={{ color: "#16a34a" }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Password updated!</h2>
              <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", margin: 0 }}>
                Sign in with your new password.
              </p>
              <a href="/login" style={{
                marginTop: 16, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", borderRadius: 12, background: "#606E74", color: "white",
                fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}>
                Go to Sign In
              </a>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0a0c0e", margin: "0 0 4px" }}>Reset your password</h2>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>Enter your new password below.</p>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <label htmlFor="rp-pw" className="sr-only">New password</label>
                  <input id="rp-pw" type={showPw ? "text" : "password"} required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="New password" minLength={8}
                    style={inputStyle} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide" : "Show"}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i < pwStrength ? strengthColors[pwStrength - 1] : "#e5e7eb",
                      }} />
                    ))}
                  </div>
                )}
                <div style={{ position: "relative" }}>
                  <label htmlFor="rp-confirm" className="sr-only">Confirm password</label>
                  <input id="rp-confirm" type={showConfirm ? "text" : "password"} required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" minLength={8}
                    style={inputStyle} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide" : "Show"}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {error && (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{error}</p>
                  </div>
                )}
                <button type="submit" disabled={loading}
                  style={{
                    height: 44, width: "100%", borderRadius: 12, border: "none",
                    background: "#606E74", color: "white", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", opacity: loading ? 0.6 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
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
