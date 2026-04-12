"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Zap, CalendarCheck, UserCog, ChartLine, type LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Zap,
    title: "Fast Checkout",
    desc: "Process transactions in seconds with our streamlined POS terminal",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booking",
    desc: "Manage your salon schedule with drag-and-drop simplicity",
  },
  {
    icon: UserCog,
    title: "Staff Management",
    desc: "Track performance, assign roles, and manage your team",
  },
  {
    icon: ChartLine,
    title: "Real-time Reports",
    desc: "Revenue, trends, and insights updated as they happen",
  },
];

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
    <main className="flex min-h-screen bg-[#06080d]">
      {/* Left — Login */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(42,64,74,0.15) 0%, transparent 70%)",
          }}
        />

        <div
          className="login-card relative z-10 w-full max-w-[420px] rounded-2xl border border-[#1a2332] bg-[#0d1117] shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 px-8 pt-10 pb-6">
            <h1 className="text-3xl font-bold tracking-[0.25em] text-white">
              KASSE
            </h1>
            <p className="text-sm italic text-[#606e74]">
              Salon Management. Simplified.
            </p>
          </div>

          <div className="mx-8 h-px bg-[#1a2332]" />

          {/* Form */}
          <div className="px-8 pb-8 pt-6">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="mb-6 mt-1 text-sm text-[#606e74]">
              Sign in to your Kasse account
            </p>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="login-btn flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#2a3442] bg-[#1a2332] text-sm font-medium text-white transition-all duration-150 hover:bg-[#243040]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#1a2332]" />
              <span className="text-xs uppercase tracking-widest text-[#606e74]">
                or
              </span>
              <div className="h-px flex-1 bg-[#1a2332]" />
            </div>

            {sent ? (
              <div className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/5 px-4 py-4 text-center text-sm font-medium text-[#22c55e]">
                Check your email — magic link sent!
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="login-input h-12 w-full rounded-lg border border-[#1a2332] bg-[#06080d] px-4 text-base text-white placeholder:text-[#606e74] outline-none transition-colors duration-150 focus:border-[#606e74]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="login-btn h-12 w-full rounded-lg bg-[#606e74] text-sm font-semibold text-white transition-all duration-150 hover:bg-[#7a8f96] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send Magic Link"}
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-xs leading-relaxed text-[#606e74]">
              By signing in you agree to Kasse&apos;s Terms of Service
            </p>

            <p className="mt-3 text-center text-[11px] text-[#1a2332]">
              Powered by Reyna Tech LLC
            </p>
          </div>
        </div>
      </div>

      {/* Right — Feature Showcase (desktop only) */}
      <div className="hidden w-1/2 max-w-[640px] items-center border-l border-[#1a2332] bg-[#0d1117] px-16 lg:flex">
        <div className="w-full max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            The modern POS
            <br />
            for salons
          </h2>

          <ul className="mt-12 flex flex-col gap-8">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1a2332] bg-[#06080d]">
                    <Icon size={18} className="text-[#606e74]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {f.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[#606e74]">
                      {f.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-16 text-sm italic text-[#606e74]">
            Trusted by Salon Envy&reg;
          </p>
        </div>
      </div>

      <style>{`
        .login-card {
          animation: cardIn 400ms ease both;
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .login-btn:hover {
          transform: scale(1.01);
        }
        .login-btn:active {
          transform: scale(0.995);
        }
      `}</style>
    </main>
  );
}
