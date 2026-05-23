"use client"

import { useState, useEffect, useRef, type FormEvent, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Zap, Loader2 } from "lucide-react"
import Image from "next/image"
import Script from "next/script"

type Tab = "signin" | "signup"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}

function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"]
const strengthLabels = ["Weak", "Fair", "Good", "Strong"]

function LoginPageInner() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")

  const [tab, setTab] = useState<Tab>("signin")
  // Sign in state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [signInError, setSignInError] = useState(
    errorParam === "expired_token" ? "Your verification link has expired. Please register again." :
    errorParam === "invalid_token" ? "Invalid verification link." : ""
  )
  const [showResendVerify, setShowResendVerify] = useState(false)
  const [signingInWithGoogle, setSigningInWithGoogle] = useState(false)
  const [signingInWithApple, setSigningInWithApple] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  // Sign up state
  const [regName, setRegName] = useState("")
  const [regBiz, setRegBiz] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPw, setRegPw] = useState("")
  const [showRegPw, setShowRegPw] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [regError, setRegError] = useState("")
  const [regSuccess, setRegSuccess] = useState(false)
  const [regSuccessEmail, setRegSuccessEmail] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // P1.A.14: Turnstile token for sign-up form bot defense
  const [turnstileToken, setTurnstileToken] = useState("")
  const [turnstileScriptLoaded, setTurnstileScriptLoaded] = useState(false)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const turnstileContainerRef = useRef<HTMLDivElement>(null)

  // P1.A.14: Render Turnstile widget on sign-up tab.
  // Gated on turnstileScriptLoaded (set by <Script onLoad>) instead of
  // polling — eliminates race on slow mobile connections.
  useEffect(() => {
    if (tab !== "signup") return
    if (regSuccess) return
    if (!turnstileScriptLoaded) return
    if (!turnstileContainerRef.current) return
    if (typeof window === "undefined" || !window.turnstile) {
      // Defensive: script said it loaded but the global isn't there.
      console.warn("[turnstile] script reported loaded but window.turnstile missing")
      return
    }

    // Clean up any previous widget on this container before re-rendering.
    if (turnstileWidgetIdRef.current) {
      // Bare catch: cleanup of a third-party global widget — if remove()
      // throws (widget already removed), we still want to proceed with render.
      try { window.turnstile.remove(turnstileWidgetIdRef.current) } catch {}
      turnstileWidgetIdRef.current = null
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) {
      console.warn("[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY missing — widget skipped")
      return
    }

    let cancelled = false
    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: siteKey,
      theme: "light",
      size: "flexible",
      action: "register",
      callback: (token) => {
        if (!cancelled) setTurnstileToken(token)
      },
      "error-callback": () => {
        if (!cancelled) setTurnstileToken("")
      },
      "expired-callback": () => {
        if (!cancelled) setTurnstileToken("")
      },
    })

    return () => {
      cancelled = true
      if (turnstileWidgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
        // Bare catch: cleanup of a third-party global widget on unmount.
        try { window.turnstile.remove(turnstileWidgetIdRef.current) } catch {}
        turnstileWidgetIdRef.current = null
      }
    }
  }, [tab, regSuccess, turnstileScriptLoaded])

  // P1.A.14: Reset Turnstile token after 4 minutes (token expires at 5).
  useEffect(() => {
    if (!turnstileToken) return
    const timeout = setTimeout(() => {
      setTurnstileToken("")
      if (turnstileWidgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
        try { window.turnstile.reset(turnstileWidgetIdRef.current) } catch {}
      }
    }, 4 * 60 * 1000)
    return () => clearTimeout(timeout)
  }, [turnstileToken])

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    if (!email || !password || signingIn) return
    setSigningIn(true)
    setSignInError("")
    setShowResendVerify(false)
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        if (res.error.includes("EMAIL_NOT_VERIFIED")) {
          setSignInError("Please verify your email. Check your inbox.")
          setShowResendVerify(true)
        } else if (res.error === "RATE_LIMITED") {
          setSignInError("Too many sign-in attempts. Please wait a few minutes before trying again.")
        } else if (res.error.includes("ACCOUNT_DISABLED")) {
          setSignInError("This account has been disabled. Contact support.")
        } else {
          setSignInError("Invalid email or password")
        }
      } else if (res?.ok) {
        window.location.href = "/dashboard"
      }
    } catch {
      setSignInError("Something went wrong. Please try again.")
    } finally {
      setSigningIn(false)
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    if (!regName || !regBiz || !regEmail || !regPw || registering) return
    if (!acceptedTerms) {
      setRegError("You must accept the Terms of Service and Privacy Policy.")
      return
    }
    setRegistering(true)
    setRegError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPw,
          businessName: regBiz,
          acceptedTerms,
          turnstileToken,  // P1.A.14
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        const retryAfterSec = typeof data.retryAfter === "number" ? data.retryAfter : null
        let message: string
        if (retryAfterSec === null) {
          message = data.error || "Too many registration attempts. Please try again in a few minutes."
        } else if (retryAfterSec < 60) {
          message = `Too many registration attempts. Please try again in ${retryAfterSec} seconds.`
        } else {
          const mins = Math.ceil(retryAfterSec / 60)
          message = `Too many registration attempts. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.`
        }
        setRegError(message)
        setRegistering(false)
        return
      }
      if (!res.ok) {
        setRegError(data.error || "Registration failed")
      } else {
        setRegSuccess(true)
        setRegSuccessEmail(regEmail)
      }
    } catch {
      setRegError("Something went wrong. Please try again.")
    } finally {
      setRegistering(false)
    }
  }

  async function handleResendVerification() {
    if (resendCooldown > 0) return
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
    // Re-register triggers a new verification email
    try {
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName || "User", email: regSuccessEmail || email, password: "resend-only", businessName: "resend" }),
      })
    } catch {
      // Silent fail on resend
    }
  }

  const pwStrength = getPasswordStrength(regPw)
  const pwChecks = [
    { label: "At least 8 characters", met: regPw.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(regPw) },
    { label: "Contains number", met: /[0-9]/.test(regPw) },
  ]

  const inputStyle: React.CSSProperties = {
    height: 44, width: "100%", borderRadius: 12, padding: "0 16px",
    fontSize: 16, background: "white", border: "1px solid rgba(0,0,0,0.09)",
    color: "#0a0c0e", outline: "none", transition: "all 150ms",
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

      {/* Top-left logo */}
      <div className="fixed left-8 top-8 z-30 flex flex-col">
        <Image src="/kasse-logo.png" alt="kasse." width={110} height={38} style={{ objectFit: "contain" }} priority />
        <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
          Salon Management Platform
        </span>
      </div>

      {/* Glass card */}
      <div className="relative z-10 mx-4 w-full max-w-[420px]" style={{ animation: "cardFloat 600ms ease-out both" }}>
        <div style={{
          borderRadius: 24, padding: "32px 40px 28px",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.9)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.10), 0 32px 64px rgba(0,0,0,0.06)",
        }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Image src="/kasse-logo.png" alt="kasse." width={80} height={28}
              style={{ objectFit: "contain", filter: "invert(1)", margin: "0 auto" }} priority />
          </div>

          {/* OAuth error (Apple/Google failures surfaced inline) */}
          {oauthError && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 8 }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{oauthError}</p>
            </div>
          )}

          {/* Google OAuth button */}
          <button
            type="button"
            disabled={signingInWithGoogle}
            onClick={() => {
              setOauthError(null)
              setSigningInWithGoogle(true)
              signIn("google", { callbackUrl: "/dashboard" })
            }}
            style={{
              height: 44, width: "100%", borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)", background: "white",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "all 150ms", color: "#3c4043",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              opacity: signingInWithGoogle ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!signingInWithGoogle) e.currentTarget.style.background = "#f8f9fa" }}
            onMouseLeave={(e) => { if (!signingInWithGoogle) e.currentTarget.style.background = "white" }}
          >
            {signingInWithGoogle ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            )}
            {signingInWithGoogle ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Apple Sign-In: button is rendered unconditionally. If APPLE_CLIENT_ID +
             APPLE_TEAM_ID + APPLE_KEY_ID + APPLE_PRIVATE_KEY env vars aren't set in
             Vercel, the AppleProvider in lib/auth.ts excludes itself from the
             providers array and signIn("apple") returns { error: "OAuthSignin" }
             inline (because redirect: false). We reset signingInWithApple in that
             case and the button visibly stops loading. */}
          <button
            type="button"
            disabled={signingInWithApple}
            onClick={async () => {
              setOauthError(null)
              setSigningInWithApple(true)
              const result = await signIn("apple", { callbackUrl: "/dashboard", redirect: false })
              if (result?.error) {
                // Apple provider not registered (no env vars) or OAuth flow failed.
                // signIn with redirect: false returns the error inline rather than
                // redirecting to /login?error=... — reset state and surface gracefully.
                console.warn("[auth] Apple sign-in failed:", result.error)
                setSigningInWithApple(false)
                // Surface to user — silent un-spin is confusing. The error string from
                // NextAuth is provider-agnostic ("OAuthSignin", "Callback", etc), so we
                // show a user-friendly message instead of leaking provider internals.
                setOauthError("Apple sign-in failed. Try another method or try again.")
              } else if (result?.url) {
                window.location.href = result.url
              }
            }}
            style={{
              height: 44, width: "100%", borderRadius: 12,
              border: "none", background: "#000000",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "all 150ms", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginTop: 8,
              opacity: signingInWithApple ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!signingInWithApple) e.currentTarget.style.background = "#1a1a1a" }}
            onMouseLeave={(e) => { if (!signingInWithApple) e.currentTarget.style.background = "#000000" }}
          >
            {signingInWithApple ? (
              <Loader2 size={16} className="animate-spin" style={{ color: "white" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 384 512" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
            )}
            {signingInWithApple ? "Signing in..." : "Continue with Apple"}
          </button>

          {/* Or divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, borderRadius: 10, background: "#f3f4f6", padding: 3 }}>
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button key={t} onClick={() => { setTab(t); setSignInError(""); setRegError("") }}
                style={{
                  flex: 1, height: 36, borderRadius: 8, border: "none",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 150ms",
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#0a0c0e" : "#6b7280",
                  boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}>
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* SIGN IN TAB */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label htmlFor="si-email" className="sr-only">Email</label>
                <input id="si-email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="Email address"
                  style={inputStyle} />
              </div>
              <div style={{ position: "relative" }}>
                <label htmlFor="si-pw" className="sr-only">Password</label>
                <input id="si-pw" type={showPw ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                  style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0,
                  }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ textAlign: "right" }}>
                <a href="/forgot-password" style={{ fontSize: 13, color: "#606E74", textDecoration: "none", fontWeight: 500 }}>
                  Forgot password?
                </a>
              </div>
              {signInError && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{signInError}</p>
                  {showResendVerify && (
                    <button type="button" onClick={handleResendVerification}
                      style={{ fontSize: 13, color: "#606E74", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0, textDecoration: "underline" }}>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
              <button type="submit" disabled={signingIn}
                style={{
                  height: 44, width: "100%", borderRadius: 12, border: "none",
                  background: "#606E74", color: "white", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", transition: "all 150ms", marginTop: 4,
                  opacity: signingIn ? 0.6 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {signingIn && <Loader2 size={16} className="animate-spin" />}
                {signingIn ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* SIGN UP TAB */}
          {tab === "signup" && !regSuccess && (
            <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label htmlFor="reg-name" className="sr-only">Full name</label>
                <input id="reg-name" type="text" required value={regName}
                  onChange={(e) => setRegName(e.target.value)} placeholder="Full name"
                  style={inputStyle} />
              </div>
              <div>
                <label htmlFor="reg-biz" className="sr-only">Business name</label>
                <input id="reg-biz" type="text" required value={regBiz}
                  onChange={(e) => setRegBiz(e.target.value)} placeholder="Business name"
                  style={inputStyle} />
              </div>
              <div>
                <label htmlFor="reg-email" className="sr-only">Email</label>
                <input id="reg-email" type="email" required value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)} placeholder="Email address"
                  style={inputStyle} />
              </div>
              <div style={{ position: "relative" }}>
                <label htmlFor="reg-pw" className="sr-only">Password</label>
                <input id="reg-pw" type={showRegPw ? "text" : "password"} required value={regPw}
                  onChange={(e) => setRegPw(e.target.value)} placeholder="Password"
                  minLength={8}
                  style={{ ...inputStyle, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowRegPw(!showRegPw)}
                  aria-label={showRegPw ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0,
                  }}>
                  {showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password strength */}
              {regPw.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i < pwStrength ? strengthColors[pwStrength - 1] : "#e5e7eb",
                        transition: "background 200ms",
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: pwStrength > 0 ? strengthColors[pwStrength - 1] : "#9ca3af", margin: 0 }}>
                    {pwStrength > 0 ? strengthLabels[pwStrength - 1] : ""}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {pwChecks.map((c) => (
                      <p key={c.label} style={{ fontSize: 12, margin: 0, color: c.met ? "#16a34a" : "#9ca3af" }}>
                        {c.met ? "\u2713" : "\u25CB"} {c.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {/* P1.A.10: Terms acceptance checkbox */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: 3, accentColor: "#606E74" }}
                />
                <label htmlFor="acceptTerms" style={{ fontSize: 13, color: "#606E74", lineHeight: 1.5 }}>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#606E74", textDecoration: "underline" }}>
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#606E74", textDecoration: "underline" }}>
                    Privacy Policy
                  </a>
                </label>
              </div>
              {/* P1.A.14: Cloudflare Turnstile widget. Renders inline via
                  useEffect after the script loads. The "flexible" size
                  matches our form width. */}
              <div ref={turnstileContainerRef} style={{ minHeight: 65, display: "flex", justifyContent: "center" }} />
              {regError && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{regError}</p>
                </div>
              )}
              <button type="submit" disabled={registering || !acceptedTerms || !turnstileToken}
                style={{
                  height: 44, width: "100%", borderRadius: 12, border: "none",
                  background: "#606E74", color: "white", fontSize: 14, fontWeight: 600,
                  cursor: acceptedTerms && turnstileToken && !registering ? "pointer" : "not-allowed",
                  transition: "all 150ms", marginTop: 4,
                  opacity: registering || !acceptedTerms || !turnstileToken ? 0.6 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {registering && <Loader2 size={16} className="animate-spin" />}
                {registering ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* Sign up success */}
          {tab === "signup" && regSuccess && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "24px 16px", borderRadius: 12,
              border: "1px solid rgba(22,163,74,0.2)", background: "rgba(22,163,74,0.06)",
              animation: "scaleIn 300ms ease-out both",
            }}>
              <CheckCircle2 size={48} strokeWidth={1.5} style={{ color: "#16a34a" }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Check your email!</h3>
              <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                We sent a verification link to <strong>{regSuccessEmail}</strong>. Click it to activate your account.
              </p>
              <button type="button" onClick={handleResendVerification}
                style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
              </button>
            </div>
          )}

          {/* Bottom */}
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "20px 0" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 12 }}>
            <Zap size={10} style={{ color: "#9ca3af" }} />
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Powered by SalonTransact</span>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(0,0,0,0.35)", margin: 0 }}>
            Terms of Service &middot; Privacy Policy
          </p>
        </div>
      </div>

      {/* Social proof pills */}
      <div className="fixed bottom-8 right-8 z-30 hidden items-center gap-2 md:flex">
        {["Trusted by 500+ salons", "PCI Compliant", "SOC 2 Type II"].map((pill) => (
          <span key={pill} style={{
            borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 500,
            background: "rgba(255,255,255,0.88)", border: "1px solid rgba(0,0,0,0.10)",
            color: "#4a5568", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }}>{pill}</span>
        ))}
      </div>

      {/* P1.A.14: Cloudflare Turnstile script. Self-attaches window.turnstile.
          afterInteractive ensures it's available when the widget renders. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileScriptLoaded(true)}
      />

      <style>{`
        @keyframes kenBurns { from { transform: scale(1); } to { transform: scale(1.05); } }
        @keyframes cardFloat { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes kenBurns { from, to { transform: scale(1); } }
          @keyframes cardFloat { from, to { opacity: 1; transform: none; } }
          @keyframes scaleIn { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </main>
  )
}
