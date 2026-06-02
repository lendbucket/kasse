"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Check,
  AlertCircle,
  Briefcase,
  FileText,
  Armchair,
  Layers,
} from "lucide-react";
import type { OnboardingState } from "@/lib/onboarding/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TemplateType = "W2" | "CONTRACTOR_1099" | "BOOTH_RENT" | "HYBRID";

interface ClassificationOption {
  id: TemplateType;
  label: string;
  description: string;
  icon: typeof Briefcase;
}

interface Props {
  sessionId: string;
  initialState: OnboardingState;
  staffCount: number;
  staffNames: string[];
}

/* ------------------------------------------------------------------ */
/*  Classification options                                              */
/* ------------------------------------------------------------------ */

const CLASSIFICATIONS: ClassificationOption[] = [
  {
    id: "W2",
    label: "W-2 Employee",
    description: "Employees on payroll. You withhold taxes and may offer benefits.",
    icon: Briefcase,
  },
  {
    id: "CONTRACTOR_1099",
    label: "1099 Contractor",
    description: "Independent contractors. They handle their own taxes.",
    icon: FileText,
  },
  {
    id: "BOOTH_RENT",
    label: "Booth Rent",
    description: "Booth/chair renters. They pay you rent and run their own book.",
    icon: Armchair,
  },
  {
    id: "HYBRID",
    label: "Hybrid",
    description: "A mix — some employees, some contractors or renters.",
    icon: Layers,
  },
];

/* ------------------------------------------------------------------ */
/*  Error mapper                                                        */
/* ------------------------------------------------------------------ */

function mapAgreementsError(code: string | undefined, status: number): string {
  switch (code) {
    case "session_not_found":
      return "We couldn't find your signup session. Please refresh the page.";
    case "org_scope_mismatch":
      return "This session doesn't belong to your account. Please sign in again.";
    case "org_not_in_session":
      return "Your session is missing organization details. Please refresh the page and try again.";
    case "location_not_yet_created":
      return "We're still finishing your location setup. Please refresh and try again.";
    case "invite_no_staff_to_agree":
      return "No team members found. You can set up agreements after adding staff from your dashboard.";
    case "invalid_agreement_template_type":
      return "Please select a valid employment classification.";
    case "forbidden":
      return "Only the account owner can configure agreements.";
    case "invalid_transition":
      return "This step has already been completed. Continuing to the next step.";
    default:
      if (status === 401) return "Your session expired. Please sign in again.";
      if (status === 403) return "Only the account owner can configure agreements.";
      if (status >= 500) return "Something went wrong on our end. Please try again.";
      return "Couldn't configure agreements. Please try again.";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function AgreementsForm({
  sessionId,
  initialState,
  staffCount,
  staffNames,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const alreadyComplete = initialState === "AGREEMENTS_CONFIGURED";

  const [templateType, setTemplateType] = useState<TemplateType | null>(null);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  /* --- JWT refresh (proven pattern) --- */
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
  async function handleSubmit(mode: "draft" | "skip") {
    if (inFlightRef.current) return;
    setError(null);

    if (mode === "draft" && !templateType) return;

    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const reqBody =
        mode === "skip"
          ? { sessionId, skip: true }
          : {
              sessionId,
              templateType,
              ...(notes.trim() ? { notes: notes.trim() } : {}),
            };

      let res = await fetch("/api/onboarding/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      // org_not_in_session / location_not_yet_created → refresh + retry once
      if (res.status === 409) {
        const body409 = await res.clone().json().catch(() => ({}));
        if (
          body409.error === "org_not_in_session" ||
          body409.error === "location_not_yet_created"
        ) {
          await refreshAndUpdateSession();
          res = await fetch("/api/onboarding/agreements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody),
          });
        }
      }

      if (res.ok) {
        router.push("/onboarding/wizard/step-5");
        return;
      }

      const resBody = await res.json().catch(() => ({}));

      // invalid_transition (409) = already past this step → advance
      if (res.status === 409 && resBody.error === "invalid_transition") {
        router.push("/onboarding/wizard/step-5");
        return;
      }

      setError(mapAgreementsError(resBody.error, res.status));
    } catch (err) {
      console.error("[agreements-form] submit failed", err);
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
          Agreements configured
        </p>
        <p style={{
          margin: "0 0 24px",
          fontSize: 14,
          color: "var(--text-muted)",
        }}>
          You can manage agreements anytime from the dashboard.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/onboarding/wizard/step-5")}
          style={{ height: 44, padding: "0 24px" }}
        >
          Continue to Compensation
        </button>
      </div>
    );
  }

  /* --- No staff variant --- */
  if (staffCount === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <div
          className="card"
          style={{
            marginBottom: 24,
            backgroundColor: "var(--bg-cream)",
          }}
        >
          <p style={{
            margin: "0 0 8px",
            fontSize: 15,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}>
            No team members to set up agreements for
          </p>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}>
            Employment agreements are for your team. You haven&apos;t added any
            team members yet, so there&apos;s nothing to set up here — you can
            create agreements anytime from your dashboard once you add staff.
          </p>
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

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleSubmit("skip")}
          disabled={submitting}
          style={{
            width: "100%",
            height: 52,
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            opacity: submitting ? 0.55 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Continuing..." : "Continue"}
        </button>
      </div>
    );
  }

  /* --- Has staff: classification picker --- */
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
        Employment Agreements
      </p>
      <p style={{
        margin: "0 0 16px",
        fontSize: 14,
        color: "var(--text-muted)",
        lineHeight: 1.5,
      }}>
        Choose how your team is classified. We&apos;ll draft a {staffCount}-person
        agreement set you can finalize and e-sign later.
      </p>

      {/* Staff names */}
      {staffNames.length > 0 && (
        <p style={{
          margin: "0 0 20px",
          fontSize: 13,
          color: "var(--text-muted)",
        }}>
          For:{" "}
          {staffNames.map((name, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <span style={{
                fontWeight: 500,
                color: "var(--text-primary)",
              }}>
                {name}
              </span>
            </span>
          ))}
        </p>
      )}

      {/* Classification cards */}
      <div
        role="radiogroup"
        aria-label="Employment classification"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {CLASSIFICATIONS.map((c) => {
          const selected = templateType === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => setTemplateType(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setTemplateType(c.id);
                }
              }}
              disabled={submitting}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 16px",
                border: selected
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border)",
                borderRadius: 10,
                backgroundColor: selected
                  ? "var(--accent-soft)"
                  : "var(--bg-card)",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 160ms ease",
                textAlign: "left",
                width: "100%",
                outline: "none",
                fontFamily: "inherit",
              }}
            >
              {/* Check badge */}
              {selected && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: "var(--blush)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "scaleIn 200ms ease-out",
                  }}
                >
                  <Check size={13} strokeWidth={2.5} color="white" />
                </span>
              )}

              {/* Icon */}
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-cream)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} strokeWidth={1.5} style={{ color: "var(--brand)" }} />
              </span>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.1px",
                }}>
                  {c.label}
                </p>
                <p style={{
                  margin: "2px 0 0",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                }}>
                  {c.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Optional notes */}
      <div style={{ marginBottom: 24 }}>
        <label
          htmlFor="agreementNotes"
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          Notes
          <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>
            (optional)
          </span>
        </label>
        <textarea
          id="agreementNotes"
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          placeholder="Any specifics about commission splits, benefits, etc."
          rows={3}
          style={{
            height: "auto",
            padding: "10px 12px",
            fontSize: 14,
            resize: "vertical",
          }}
        />
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
        onClick={() => handleSubmit("draft")}
        disabled={submitting || !templateType}
        style={{
          width: "100%",
          height: 52,
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
          opacity: submitting || !templateType ? 0.55 : 1,
          cursor: submitting || !templateType ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}
      >
        {submitting ? "Setting up..." : "Draft agreements & continue"}
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
        Skip for now — I&apos;ll set these up later
      </button>
    </div>
  );
}
