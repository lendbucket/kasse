"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { OnboardingState } from "@/lib/onboarding/types";

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
}

export default function ServicesForm({
  sessionId,
  initialState,
  defaultServices,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const alreadyComplete = initialState === "SERVICES_SEEDED";
  const isResume = initialState === "SERVICES_PENDING";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  async function refreshAndUpdateSession(): Promise<void> {
    const res = await fetch("/api/onboarding/refresh-session", {
      method: "POST",
    });
    if (res.status === 429) {
      await update();
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        `refresh-session failed (${res.status}): ${body.error ?? "unknown"}`,
      );
    }
    await update();
  }

  async function handleSubmit() {
    if (inFlightRef.current) return;
    setError(null);

    inFlightRef.current = true;
    setSubmitting(true);
    try {
      let res = await fetch("/api/onboarding/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      // org_not_in_session edge case: refresh JWT + retry once
      if (res.status === 409) {
        const body409 = await res.clone().json().catch(() => ({}));
        if (body409.error === "org_not_in_session") {
          await refreshAndUpdateSession();
          res = await fetch("/api/onboarding/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
        }
      }

      if (res.ok) {
        router.push("/onboarding/wizard/step-3");
        return;
      }

      const body = await res.json().catch(() => ({}));

      // invalid_transition (409) means state already past LOCATION_CREATED
      // — treat as "already seeded, continue" same as resume case
      if (res.status === 409 && body.error === "invalid_transition") {
        router.push("/onboarding/wizard/step-3");
        return;
      }

      setError(mapServicesError(body.error, res.status));
    } catch (err) {
      console.error("[services-form] submit failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      // Single source of truth for "submit is no longer in flight."
      // setSubmitting and inFlightRef both clear here so adding new
      // early-return paths above doesn't require remembering to clear
      // state — finally runs on every exit (return, throw, fall-through).
      //
      // Navigation race note: on the router.push success paths, this
      // finally fires AFTER router.push schedules navigation but BEFORE
      // navigation completes — re-enabling the button for ~50-200ms. If
      // the user double-clicks in that window, the retry POST hits
      // /api/onboarding/services and gets 409 invalid_transition (state
      // is already past LOCATION_CREATED), which we handle as
      // "already done, continue to step-3" via another router.push.
      // Next.js dedupes the duplicate navigation. Self-recovering, no
      // data corruption.
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  if (alreadyComplete) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "32px",
          marginTop: "8px",
        }}
      >
        <p
          style={{
            margin: "0 0 4px",
            fontSize: "16px",
            color: "#111827",
            fontWeight: 500,
          }}
        >
          Services are set up
        </p>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          {defaultServices.length} services added to your catalog.
        </p>
        <button
          onClick={() => router.push("/onboarding/wizard/step-3")}
          style={{
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#ffffff",
            backgroundColor: "#606E74",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#7a8f96")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#606E74")
          }
        >
          Continue to Team
        </button>
      </div>
    );
  }

  const grouped = groupByCategory(defaultServices);

  return (
    <div style={{ marginTop: "8px" }}>
      {isResume && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: "16px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#1e40af",
          }}
        >
          We&apos;re picking up where you left off.
        </div>
      )}

      <p
        style={{
          margin: "0 0 24px",
          fontSize: "15px",
          color: "#6b7280",
          lineHeight: 1.6,
        }}
      >
        We&apos;ve prepared a starter menu for your salon. Review the services
        below and click &quot;Seed services&quot; to add them to your catalog.
      </p>

      {defaultServices.length === 0 ? (
        <div
          style={{
            padding: "24px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#dc2626",
            textAlign: "center",
          }}
        >
          Couldn&apos;t load the service preview. Please refresh the page.
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "16px",
          }}
        >
          {Object.entries(grouped).map(([category, services], idx) => (
            <div
              key={category}
              style={{
                marginBottom:
                  idx < Object.keys(grouped).length - 1 ? "20px" : "0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {category}
              </h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {services.map((s, sIdx) => (
                  <div
                    key={s.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom:
                        sIdx < services.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#111827",
                        flex: 1,
                      }}
                    >
                      {s.name}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        minWidth: "60px",
                        textAlign: "right",
                      }}
                    >
                      {formatDuration(s.durationMinutes)}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#111827",
                        fontWeight: 500,
                        minWidth: "70px",
                        textAlign: "right",
                      }}
                    >
                      {formatPrice(s.priceCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p
        style={{
          margin: "0 0 24px",
          fontSize: "13px",
          color: "#9ca3af",
          lineHeight: 1.5,
        }}
      >
        These services are a starting point. You can edit, add, or remove
        services anytime from your dashboard.
      </p>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            fontSize: "14px",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || defaultServices.length === 0}
        style={{
          width: "100%",
          padding: "14px 24px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#ffffff",
          backgroundColor:
            submitting || defaultServices.length === 0
              ? "#9ca3af"
              : "#606E74",
          border: "none",
          borderRadius: "8px",
          cursor:
            submitting || defaultServices.length === 0
              ? "not-allowed"
              : "pointer",
        }}
        onMouseOver={(e) => {
          if (!submitting && defaultServices.length > 0)
            e.currentTarget.style.backgroundColor = "#7a8f96";
        }}
        onMouseOut={(e) => {
          if (!submitting && defaultServices.length > 0)
            e.currentTarget.style.backgroundColor = "#606E74";
        }}
      >
        {submitting ? "Setting up..." : "Seed services"}
      </button>
    </div>
  );
}

function groupByCategory(
  services: ServicePreview[],
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
    // Defensive fallback: handleSubmit currently treats
    // invalid_transition (409) as a success path and router.push's
    // to step-3 BEFORE calling mapServicesError, so this branch is
    // unreachable in current code. Kept as belt-and-suspenders for
    // future code paths that might call mapServicesError with this
    // code without the success-handling.
    return "Services have already been set up. Continuing to the next step.";
  }
  if (status === 401) {
    return "Your session expired. Please sign in again.";
  }
  if (status >= 500) {
    return "Something went wrong on our end. Please try again.";
  }
  return "Couldn't set up your services. Please try again.";
}
