"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function TermsAcceptPage() {
  const router = useRouter()
  const { update: updateSession } = useSession()
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    if (!accepted || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/terms/accept", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to record acceptance. Please try again.")
        setSubmitting(false)
        return
      }

      // Refresh the JWT so middleware sees the updated acceptedTermsVersionId,
      // then navigate via the Next.js router (avoids race between session
      // cookie commit and hard navigation). router.refresh() forces server
      // components to re-fetch with the new JWT state.
      await updateSession()
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f7f8fa",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        background: "#ffffff",
        borderRadius: 16,
        padding: "40px 36px 32px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Image src="/kasse-logo.png" alt="kasse." width={80} height={28}
            style={{ objectFit: "contain", filter: "invert(1)", margin: "0 auto" }} priority />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111827", marginBottom: 8, textAlign: "center" }}>
          Updated Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: "#606E74", lineHeight: 1.6, textAlign: "center", marginBottom: 24 }}>
          We've updated our Terms of Service and Privacy Policy. Please review and accept to continue using Kasse.
        </p>

        {/* Document links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{
            display: "block", padding: "12px 16px", borderRadius: 12,
            border: "1px solid #e5e7eb", background: "#f7f8fa",
            color: "#111827", fontSize: 14, fontWeight: 500, textDecoration: "none",
            transition: "background 150ms",
          }}>
            Read Terms of Service →
          </a>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{
            display: "block", padding: "12px 16px", borderRadius: 12,
            border: "1px solid #e5e7eb", background: "#f7f8fa",
            color: "#111827", fontSize: 14, fontWeight: 500, textDecoration: "none",
            transition: "background 150ms",
          }}>
            Read Privacy Policy →
          </a>
        </div>

        {/* Checkbox */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 24 }}>
          <input
            type="checkbox"
            id="acceptTerms"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ marginTop: 3, accentColor: "#606E74" }}
          />
          <label htmlFor="acceptTerms" style={{ fontSize: 13, color: "#606E74", lineHeight: 1.5 }}>
            I have read and agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#606E74", textDecoration: "underline" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#606E74", textDecoration: "underline" }}>Privacy Policy</a>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            type="button"
            disabled={!accepted || submitting}
            onClick={handleAccept}
            style={{
              height: 44, width: "100%", borderRadius: 12, border: "none",
              background: "#606E74", color: "white", fontSize: 14, fontWeight: 600,
              cursor: accepted && !submitting ? "pointer" : "not-allowed",
              transition: "all 150ms",
              opacity: !accepted || submitting ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Accepting..." : "Accept and Continue"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              height: 44, width: "100%", borderRadius: 12,
              border: "1px solid #e5e7eb", background: "transparent",
              color: "#606E74", fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "all 150ms",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  )
}
