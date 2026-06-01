"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Mail, AlertCircle } from "lucide-react";
import type { OnboardingState } from "@/lib/onboarding/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  sessionId: string;
  initialState: OnboardingState;
  staffTerm: string;
  staffTermPlural: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/*  Error mapper                                                        */
/* ------------------------------------------------------------------ */

function mapInviteError(code: string | undefined, status: number): string {
  switch (code) {
    case "session_not_found":
      return "We couldn't find your signup session. Please refresh the page.";
    case "org_scope_mismatch":
      return "This session doesn't belong to your account. Please sign in again.";
    case "org_not_in_session":
      return "Your session is missing organization details. Please refresh the page and try again.";
    case "location_not_yet_created":
      return "We're still finishing your location setup. Please refresh and try again.";
    case "invite_email_required":
      return "Please enter an email address for the invite.";
    case "invite_name_required":
      return "Please enter a name for the team member.";
    case "invite_already_exists":
      return "An invite has already been sent to this email address.";
    case "invite_email_already_user":
      return "This email is already registered. They can log in directly.";
    case "invalid_role":
      return "Invalid role specified. Please try again.";
    case "invalid_transition":
      return "This step has already been completed. Continuing to the next step.";
    default:
      if (status === 401) return "Your session expired. Please sign in again.";
      if (status >= 500) return "Something went wrong on our end. Please try again.";
      return "Couldn't send the invite. Please try again.";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function TeamForm({
  sessionId,
  initialState,
  staffTerm,
  staffTermPlural,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const alreadyComplete = initialState === "STAFF_INVITED";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const emailValid = EMAIL_REGEX.test(email.trim());
  const nameValid = name.trim().length >= 1;
  const canInvite = nameValid && emailValid;

  /* --- JWT refresh (proven pattern from steps 1-2) --- */
  async function refreshAndUpdateSession(): Promise<void> {
    const res = await fetch("/api/onboarding/refresh-session", { method: "POST" });
    if (res.status === 429) {
      await update();
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        `refresh-session failed (${res.status}): ${body.error ?? "unknown"}`
      );
    }
    await update();
  }

  /* --- Submit handler --- */
  async function handleSubmit(mode: "invite" | "skip") {
    if (inFlightRef.current) return;
    setError(null);

    if (mode === "invite" && !canInvite) return;

    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const body =
        mode === "skip"
          ? { sessionId, skip: true }
          : { sessionId, email: email.trim(), name: name.trim() };

      let res = await fetch("/api/onboarding/staff-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // org_not_in_session or location_not_yet_created → refresh + retry once
      if (res.status === 409) {
        const body409 = await res.clone().json().catch(() => ({}));
        if (
          body409.error === "org_not_in_session" ||
          body409.error === "location_not_yet_created"
        ) {
          await refreshAndUpdateSession();
          res = await fetch("/api/onboarding/staff-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
      }

      if (res.ok) {
        router.push("/onboarding/wizard/step-4");
        return;
      }

      const resBody = await res.json().catch(() => ({}));

      // invalid_transition (409) = already past this step → advance
      if (res.status === 409 && resBody.error === "invalid_transition") {
        router.push("/onboarding/wizard/step-4");
        return;
      }

      setError(mapInviteError(resBody.error, res.status));
    } catch (err) {
      console.error("[team-form] submit failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  /* --- Already complete --- */
  if (alreadyComplete) {
    return (
      <div className="card" style={{ marginTop: 8 }}>
        <p style={{
          margin: "0 0 4px",
          fontSize: 16,
          color: "var(--text-primary)",
          fontWeight: 500,
        }}>
          {staffTermPlural} are set up
        </p>
        <p style={{
          margin: "0 0 24px",
          fontSize: 14,
          color: "var(--text-muted)",
        }}>
          You can manage your team anytime from the dashboard.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/onboarding/wizard/step-4")}
          style={{ height: 44, padding: "0 24px" }}
        >
          Continue
        </button>
      </div>
    );
  }

  /* --- Main form --- */
  return (
    <div style={{ marginTop: 8 }}>
      {/* Section label */}
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        color: "var(--text-muted)",
        margin: "0 0 8px",
      }}>
        Add Your Team
      </p>
      <p style={{
        margin: "0 0 24px",
        fontSize: 14,
        color: "var(--text-muted)",
        lineHeight: 1.5,
      }}>
        Invite your first {staffTerm.toLowerCase()} to join — they&apos;ll get
        an email to set up their account. You can add the rest anytime from
        your dashboard.
      </p>

      {/* Invite card */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: 24,
        }}
      >
        {/* Name field */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="staffName"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Full name
          </label>
          <div style={{ position: "relative" }}>
            <User
              size={16}
              strokeWidth={1.5}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              id="staffName"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder={`e.g. Jane Doe`}
              maxLength={100}
              style={{ height: 40, fontSize: 14, paddingLeft: 36 }}
            />
          </div>
        </div>

        {/* Email field */}
        <div>
          <label
            htmlFor="staffEmail"
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Email address
          </label>
          <div style={{ position: "relative" }}>
            <Mail
              size={16}
              strokeWidth={1.5}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              id="staffEmail"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              disabled={submitting}
              placeholder="jane@example.com"
              maxLength={200}
              style={{
                height: 40,
                fontSize: 14,
                paddingLeft: 36,
                borderColor:
                  emailTouched && email.trim() && !emailValid
                    ? "var(--error)"
                    : undefined,
              }}
            />
          </div>
          {emailTouched && email.trim() && !emailValid && (
            <p style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "6px 0 0",
              fontSize: 13,
              color: "var(--error)",
            }}>
              <AlertCircle size={14} strokeWidth={1.5} />
              Enter a valid email address
            </p>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 16px",
          marginBottom: 16,
          backgroundColor: "var(--error-soft)",
          border: "1px solid var(--error)",
          borderRadius: 8,
          fontSize: 14,
          color: "var(--error)",
        }}>
          <AlertCircle
            size={16}
            strokeWidth={1.5}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          {error}
        </div>
      )}

      {/* Primary CTA */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => handleSubmit("invite")}
        disabled={submitting || !canInvite}
        style={{
          width: "100%",
          height: 52,
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
          opacity: submitting || !canInvite ? 0.55 : 1,
          cursor: submitting || !canInvite ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}
      >
        {submitting ? "Sending..." : "Send invite & continue"}
      </button>

      {/* Skip action */}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => handleSubmit("skip")}
        disabled={submitting}
        style={{
          width: "100%",
          height: 40,
          fontSize: 14,
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        Skip for now — I&apos;ll add my team later
      </button>
    </div>
  );
}
