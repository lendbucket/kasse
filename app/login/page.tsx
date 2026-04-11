"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleMagicLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    await signIn("email", { email, callbackUrl: "/" });
    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#06080d] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#1a2332] bg-[#0d1117] p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#1a2332] bg-[#06080d]">
            <span className="font-mono text-2xl font-semibold tracking-tight text-[#7a8f96]">
              K
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Kasse</h1>
          <p className="mt-1 text-sm text-[#606e74]">
            Sign in to your salon
          </p>
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#1a2332] bg-[#06080d] px-4 py-3 text-sm font-medium text-white transition-colors duration-150 hover:border-[#7a8f96] hover:bg-[#0d1117]"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#1a2332]" />
          <span className="text-xs uppercase tracking-wider text-[#606e74]">
            or
          </span>
          <div className="h-px flex-1 bg-[#1a2332]" />
        </div>

        <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
          <label
            htmlFor="email"
            className="text-sm font-medium text-[#7a8f96]"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@salon.com"
            className="w-full rounded-lg border border-[#1a2332] bg-[#06080d] px-4 py-3 text-base text-white placeholder:text-[#606e74] outline-none transition-colors duration-150 focus:border-[#7a8f96]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-lg bg-[#7a8f96] px-4 py-3 text-sm font-semibold text-[#06080d] transition-colors duration-150 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending link..." : "Send magic link"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[#606e74]">
          Reyna Tech LLC
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.43-1.73 4.2-5.5 4.2-3.31 0-6-2.74-6-6.12s2.69-6.12 6-6.12c1.88 0 3.15.8 3.87 1.5l2.64-2.54C16.84 3.47 14.66 2.5 12 2.5 6.98 2.5 2.92 6.56 2.92 11.58S6.98 20.66 12 20.66c6.93 0 9.5-4.88 9.5-9.22 0-.62-.06-1.1-.14-1.58H12z"
      />
    </svg>
  );
}
