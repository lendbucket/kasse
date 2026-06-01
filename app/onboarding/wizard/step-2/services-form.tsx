"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Clock, AlertCircle } from "lucide-react";
import type { OnboardingState } from "@/lib/onboarding/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ServicePreview {
  name: string;
  category: string | null;
  durationMinutes: number;
  priceCents: number;
}

interface Props {
  sessionId: string;
  initialState: OnboardingState;
  defaultServices: ServicePreview[];
  verticalTerms: { service: string; servicePlural: string };
  verticalDisplayName: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function groupByCategory(
  services: ServicePreview[]
): Record<string, ServicePreview[]> {
  const out: Record<string, ServicePreview[]> = {};
  for (const s of services) {
    const cat = s.category ?? "Other";
    if (!out[cat]) out[cat] = [];
    out[cat].push(s);
  }
  return out;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

function formatPrice(cents: number): string {
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
}

function mapServicesError(code: string | undefined, status: number): string {
  if (code === "session_not_found") {
    return "We couldn't find your signup session. Please refresh the page.";
  }
  if (code === "org_scope_mismatch") {
    return "This session doesn't belong to your account. Please sign in again.";
  }
  if (code === "org_not_in_session") {
    return "Your session is missing organization details. Please refresh the page and try again.";
  }
  if (code === "invalid_transition") {
    return "Services have already been set up. Continuing to the next step.";
  }
  if (code === "invalid_selected_names") {
    return "Invalid service selection. Please try again.";
  }
  if (status === 401) {
    return "Your session expired. Please sign in again.";
  }
  if (status >= 500) {
    return "Something went wrong on our end. Please try again.";
  }
  return "Couldn't set up your services. Please try again.";
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function ServicesForm({
  sessionId,
  initialState,
  defaultServices,
  verticalTerms,
  verticalDisplayName,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const alreadyComplete = initialState === "SERVICES_SEEDED";
  const isResume = initialState === "SERVICES_PENDING";

  // Selection state — all services start selected (recommended default)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultServices.map((s) => s.name))
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const selectedCount = selected.size;
  const grouped = groupByCategory(defaultServices);

  /* --- Toggle helpers --- */
  function toggleService(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleCategory(category: string, services: ServicePreview[]) {
    const allSelected = services.every((s) => selected.has(s.name));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of services) {
        if (allSelected) next.delete(s.name);
        else next.add(s.name);
      }
      return next;
    });
  }

  /* --- JWT refresh (same proven pattern) --- */
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
  async function handleSubmit(mode: "seed" | "skip") {
    if (inFlightRef.current) return;
    setError(null);

    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const body =
        mode === "skip"
          ? { sessionId, skip: true }
          : { sessionId, selectedNames: [...selected] };

      let res = await fetch("/api/onboarding/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // org_not_in_session edge case: refresh JWT + retry once
      if (res.status === 409) {
        const body409 = await res.clone().json().catch(() => ({}));
        if (body409.error === "org_not_in_session") {
          await refreshAndUpdateSession();
          res = await fetch("/api/onboarding/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }
      }

      if (res.ok) {
        router.push("/onboarding/wizard/step-3");
        return;
      }

      const resBody = await res.json().catch(() => ({}));

      // invalid_transition (409) = state already past LOCATION_CREATED
      if (res.status === 409 && resBody.error === "invalid_transition") {
        router.push("/onboarding/wizard/step-3");
        return;
      }

      setError(mapServicesError(resBody.error, res.status));
    } catch (err) {
      console.error("[services-form] submit failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  /* --- Already complete state --- */
  if (alreadyComplete) {
    return (
      <div className="card" style={{ marginTop: 8 }}>
        <p style={{
          margin: "0 0 4px",
          fontSize: 16,
          color: "var(--text-primary)",
          fontWeight: 500,
        }}>
          {verticalTerms.servicePlural} are set up
        </p>
        <p style={{
          margin: "0 0 24px",
          fontSize: 14,
          color: "var(--text-muted)",
        }}>
          Your service catalog has been added.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/onboarding/wizard/step-3")}
          style={{ height: 44, padding: "0 24px" }}
        >
          Continue to Team
        </button>
      </div>
    );
  }

  /* --- Empty catalog state --- */
  if (defaultServices.length === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <div
          className="card"
          style={{
            textAlign: "left",
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
            No starter menu available
          </p>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}>
            We don&apos;t have a starter menu for {verticalDisplayName} yet.
            You can build your service menu anytime from the dashboard.
          </p>
        </div>
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

  /* --- Main interactive form --- */
  return (
    <div style={{ marginTop: 8 }}>
      {/* Resume banner */}
      {isResume && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            backgroundColor: "var(--info-soft)",
            border: "1px solid var(--accent)",
            borderRadius: 8,
            fontSize: 14,
            color: "var(--accent)",
          }}
        >
          We&apos;re picking up where you left off.
        </div>
      )}

      {/* Section label */}
      <p style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        color: "var(--text-muted)",
        margin: "0 0 8px",
      }}>
        Your {verticalTerms.service} Menu
      </p>
      <p style={{
        margin: "0 0 20px",
        fontSize: 14,
        color: "var(--text-muted)",
        lineHeight: 1.5,
      }}>
        We&apos;ve prepared a starter menu. Pick the {verticalTerms.servicePlural.toLowerCase()} you
        offer — you can fine-tune everything later.
      </p>

      {/* Service categories */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 20 }}>
        {Object.entries(grouped).map(([category, services]) => {
          const allInCategorySelected = services.every((s) => selected.has(s.name));
          return (
            <div key={category}>
              {/* Category header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}>
                  {category}
                </h3>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => toggleCategory(category, services)}
                  disabled={submitting}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    fontSize: 12,
                  }}
                >
                  {allInCategorySelected ? "Deselect all" : "Select all"}
                </button>
              </div>

              {/* Service toggle cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {services.map((s) => {
                  const isSelected = selected.has(s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleService(s.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleService(s.name);
                        }
                      }}
                      disabled={submitting}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        border: isSelected
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                        borderRadius: 10,
                        backgroundColor: isSelected
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
                      {/* Checkbox indicator */}
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          border: isSelected
                            ? "none"
                            : "1.5px solid var(--border-strong)",
                          backgroundColor: isSelected
                            ? "var(--blush)"
                            : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 160ms ease",
                        }}
                      >
                        {isSelected && (
                          <Check size={13} strokeWidth={2.5} color="white" />
                        )}
                      </span>

                      {/* Service info */}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          display: "block",
                          fontSize: 14,
                          fontWeight: 500,
                          color: isSelected
                            ? "var(--text-primary)"
                            : "var(--text-muted)",
                          letterSpacing: "-0.1px",
                        }}>
                          {s.name}
                        </span>
                      </span>

                      {/* Duration */}
                      <span style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}>
                        <Clock size={13} strokeWidth={1.5} />
                        {formatDuration(s.durationMinutes)}
                      </span>

                      {/* Price */}
                      <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isSelected
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                        minWidth: 56,
                        textAlign: "right",
                        flexShrink: 0,
                      }}>
                        {formatPrice(s.priceCents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live count + footnote */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--text-primary)",
        }}>
          {selectedCount} {selectedCount === 1 ? verticalTerms.service.toLowerCase() : verticalTerms.servicePlural.toLowerCase()} selected
        </p>
        <p style={{
          margin: 0,
          fontSize: 12,
          color: "var(--text-muted)",
        }}>
          Edit anytime from your dashboard
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

      {/* Primary CTA */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => handleSubmit("seed")}
        disabled={submitting || selectedCount === 0}
        style={{
          width: "100%",
          height: 52,
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
          opacity: submitting || selectedCount === 0 ? 0.55 : 1,
          cursor: submitting || selectedCount === 0 ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}
      >
        {submitting
          ? "Setting up..."
          : `Add ${selectedCount} ${selectedCount === 1 ? verticalTerms.service.toLowerCase() : verticalTerms.servicePlural.toLowerCase()} & continue`}
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
        Skip for now — I&apos;ll add these later
      </button>
    </div>
  );
}
