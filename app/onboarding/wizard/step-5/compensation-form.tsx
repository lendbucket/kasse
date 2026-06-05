"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, DollarSign, Percent, Home } from "lucide-react";
import type { OnboardingState } from "@/lib/onboarding/types";
import type {
  CompensationModelType,
  BoothRentFrequency,
} from "@/lib/onboarding/compensation-validation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  sessionId: string;
  initialState: OnboardingState;
  staffCount: number;
}

interface StaffCompEntry {
  staffId: string;
  name: string;
  agreementTemplateType: string | null;
  modelType: CompensationModelType;
  baseHourlyRateCents: number;
  baseCommissionPct: number;
  boothRentCents: number;
  boothRentFrequency: BoothRentFrequency;
}

interface StaffFromAPI {
  staffId: string;
  name: string;
  agreementTemplateType: string | null;
  hasCompensation: boolean;
  compensation: {
    modelType: string;
    baseHourlyRateCents: number | null;
    baseCommissionPct: number | null;
    boothRentCents: number | null;
    boothRentFrequency: string | null;
  } | null;
}

const MODEL_LABELS: Record<CompensationModelType, string> = {
  W2: "W-2 Hourly",
  "1099_COMMISSION": "1099 Commission",
  BOOTH_RENT: "Booth Rent",
  HYBRID: "Hourly + Commission",
};

const BOOTH_FREQ_LABELS: Record<BoothRentFrequency, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function defaultModelForAgreement(
  templateType: string | null
): CompensationModelType {
  switch (templateType) {
    case "W2":
      return "W2";
    case "CONTRACTOR_1099":
      return "1099_COMMISSION";
    case "BOOTH_RENT":
      return "BOOTH_RENT";
    case "HYBRID":
      return "HYBRID";
    default:
      return "W2";
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Error mapper                                                        */
/* ------------------------------------------------------------------ */

function mapCompError(code: string | undefined, status: number): string {
  switch (code) {
    case "session_not_found":
      return "We couldn\u2019t find your signup session. Please refresh the page.";
    case "org_scope_mismatch":
      return "This session doesn\u2019t belong to your account. Please sign in again.";
    case "org_not_in_session":
      return "Your session is missing organization details. Please refresh the page and try again.";
    case "location_not_yet_created":
      return "We\u2019re still finishing your location setup. Please refresh and try again.";
    case "compensations_required":
      return "Compensation data is required. Please try again.";
    case "compensation_fields_incomplete":
      return "Some compensation fields are incomplete. Please check the values and try again.";
    case "compensation_staff_mismatch":
      return "A staff member couldn\u2019t be matched. Please refresh and try again.";
    case "not_all_staff_have_compensation":
      return "All team members need compensation set. Please fill in all entries.";
    case "forbidden":
      return "Only the account owner can set compensation.";
    case "invalid_transition":
      return "This step has already been completed. Finishing setup.";
    default:
      if (status === 401)
        return "Your session expired. Please sign in again.";
      if (status >= 500)
        return "Something went wrong on our end. Please try again.";
      return "Couldn\u2019t save compensation. Please try again.";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function CompensationForm({
  sessionId,
  initialState,
  staffCount,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const alreadyComplete = initialState === "COMPENSATION_CONFIGURED";

  const [staffEntries, setStaffEntries] = useState<StaffCompEntry[]>([]);
  const [loading, setLoading] = useState(staffCount > 0 && !alreadyComplete);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  /* --- JWT refresh (proven pattern) --- */
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
        `refresh-session failed (${res.status}): ${body.error ?? "unknown"}`
      );
    }
    await update();
  }

  /* --- Load staff on mount --- */
  useEffect(() => {
    if (staffCount === 0 || alreadyComplete) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/onboarding/compensation?sessionId=${encodeURIComponent(sessionId)}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(mapCompError(body.error, res.status));
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const entries: StaffCompEntry[] = (data.staff as StaffFromAPI[]).map(
          (s) => ({
            staffId: s.staffId,
            name: s.name,
            agreementTemplateType: s.agreementTemplateType,
            modelType: s.hasCompensation && s.compensation
              ? (s.compensation.modelType as CompensationModelType)
              : defaultModelForAgreement(s.agreementTemplateType),
            baseHourlyRateCents: s.compensation?.baseHourlyRateCents ?? 1500,
            baseCommissionPct: s.compensation?.baseCommissionPct ?? 40,
            boothRentCents: s.compensation?.boothRentCents ?? 50000,
            boothRentFrequency:
              (s.compensation?.boothRentFrequency as BoothRentFrequency) ??
              "WEEKLY",
          })
        );
        setStaffEntries(entries);
      } catch (err) {
        console.error("[compensation-form] load failed", err);
        if (!cancelled) setError("Couldn\u2019t load staff data. Please refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, staffCount, alreadyComplete]);

  /* --- Build compensation payload per the real CompensationInput --- */
  function buildPayload() {
    return staffEntries.map((e) => {
      const base: Record<string, unknown> = {
        staffId: e.staffId,
        modelType: e.modelType,
        effectiveStartDate: todayISO(),
      };

      switch (e.modelType) {
        case "W2":
          base.baseHourlyRateCents = e.baseHourlyRateCents;
          break;
        case "1099_COMMISSION":
          base.baseCommissionPct = e.baseCommissionPct;
          break;
        case "BOOTH_RENT":
          base.boothRentCents = e.boothRentCents;
          base.boothRentFrequency = e.boothRentFrequency;
          break;
        case "HYBRID":
          base.baseHourlyRateCents = e.baseHourlyRateCents;
          base.baseCommissionPct = e.baseCommissionPct;
          break;
      }

      return base;
    });
  }

  /* --- Complete onboarding session --- */
  async function callCompletion(): Promise<boolean> {
    let res = await fetch("/api/onboarding/session-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, force: true }),
    });

    // Retry once on org/location scope errors
    if (res.status === 409) {
      const body409 = await res.clone().json().catch(() => ({}));
      if (
        body409.error === "org_or_location_missing"
      ) {
        await refreshAndUpdateSession();
        res = await fetch("/api/onboarding/session-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, force: true }),
        });
      }
    }

    // Any success or already_completed is fine
    if (res.ok) return true;

    const body = await res.json().catch(() => ({}));
    if (res.status === 409 && body.error === "invalid_transition") return true;

    console.error("[compensation-form] completion failed", body);
    return false;
  }

  /* --- Submit handler --- */
  async function handleSubmit(mode: "save" | "skip") {
    if (inFlightRef.current) return;
    setError(null);

    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const compensations = mode === "skip" ? [] : buildPayload();

      let res = await fetch("/api/onboarding/compensation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, compensations }),
      });

      // org_not_in_session / location_not_yet_created -> refresh + retry once
      if (res.status === 409) {
        const body409 = await res.clone().json().catch(() => ({}));
        if (
          body409.error === "org_not_in_session" ||
          body409.error === "location_not_yet_created"
        ) {
          await refreshAndUpdateSession();
          res = await fetch("/api/onboarding/compensation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, compensations }),
          });
        }
      }

      // 201 or 202 = success
      if (res.status === 201 || res.status === 202) {
        const completed = await callCompletion();
        if (!completed) {
          setError("We saved your information but couldn't finish setup. Please try again.");
          return;
        }
        router.push("/dashboard");
        return;
      }

      if (res.ok) {
        const completed = await callCompletion();
        if (!completed) {
          setError("We saved your information but couldn't finish setup. Please try again.");
          return;
        }
        router.push("/dashboard");
        return;
      }

      const resBody = await res.json().catch(() => ({}));

      // invalid_transition = already past this step
      if (res.status === 409 && resBody.error === "invalid_transition") {
        const completed = await callCompletion();
        if (!completed) {
          setError("We saved your information but couldn't finish setup. Please try again.");
          return;
        }
        router.push("/dashboard");
        return;
      }

      setError(mapCompError(resBody.error, res.status));
    } catch (err) {
      console.error("[compensation-form] submit failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  /* --- Already-complete handler --- */
  async function handleFinish() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const completed = await callCompletion();
      if (!completed) {
        setError("We saved your information but couldn't finish setup. Please try again.");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      console.error("[compensation-form] finish failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  /* --- Update a staff entry --- */
  function updateEntry(
    staffId: string,
    patch: Partial<StaffCompEntry>
  ) {
    setStaffEntries((prev) =>
      prev.map((e) => (e.staffId === staffId ? { ...e, ...patch } : e))
    );
  }

  /* --- Already complete --- */
  if (alreadyComplete) {
    return (
      <div className="card" style={{ marginTop: 8 }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 16,
            color: "var(--text-primary)",
            fontWeight: 500,
          }}
        >
          You&apos;re all set
        </p>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          Compensation has been configured. You can adjust it anytime from
          the dashboard.
        </p>

        {error && (
          <div
            style={{
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
            }}
          >
            <AlertCircle
              size={16}
              strokeWidth={1.5}
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleFinish}
          disabled={submitting}
          style={{
            height: 52,
            padding: "0 24px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            width: "100%",
            opacity: submitting ? 0.55 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Finishing..." : "Finish setup"}
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
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            No team members to set up compensation for
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            Compensation is per team member. You can set it up when you add
            staff from your dashboard.
          </p>
        </div>

        {error && (
          <div
            style={{
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
            }}
          >
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
          {submitting ? "Finishing..." : "Finish setup"}
        </button>
      </div>
    );
  }

  /* --- Loading state --- */
  if (loading) {
    return (
      <div style={{ marginTop: 8 }}>
        <div
          className="skeleton"
          style={{ height: 120, borderRadius: 12, marginBottom: 16 }}
        />
        <div
          className="skeleton"
          style={{ height: 52, borderRadius: 8 }}
        />
      </div>
    );
  }

  /* --- Has staff: per-staff compensation editor --- */
  return (
    <div style={{ marginTop: 8 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          color: "var(--text-muted)",
          margin: "0 0 8px",
        }}
      >
        Compensation
      </p>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 14,
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        Set pay for each team member. You can always adjust these later.
      </p>

      {/* Per-staff cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {staffEntries.map((entry) => (
          <div
            key={entry.staffId}
            className="card"
            style={{ padding: 20 }}
          >
            {/* Name + model selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {entry.name}
              </p>
              <select
                className="input"
                value={entry.modelType}
                onChange={(e) =>
                  updateEntry(entry.staffId, {
                    modelType: e.target.value as CompensationModelType,
                  })
                }
                disabled={submitting}
                style={{
                  width: "auto",
                  minWidth: 180,
                  height: 36,
                  fontSize: 13,
                }}
              >
                {(Object.keys(MODEL_LABELS) as CompensationModelType[]).map(
                  (mt) => (
                    <option key={mt} value={mt}>
                      {MODEL_LABELS[mt]}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Model-specific fields */}
            {(entry.modelType === "W2" || entry.modelType === "HYBRID") && (
              <div style={{ marginBottom: entry.modelType === "HYBRID" ? 12 : 0 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  <DollarSign
                    size={14}
                    strokeWidth={1.5}
                    style={{ color: "var(--text-muted)" }}
                  />
                  Hourly rate
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    className="input"
                    value={(entry.baseHourlyRateCents / 100).toFixed(2)}
                    onChange={(e) => {
                      const cents = Math.round(parseFloat(e.target.value || "0") * 100);
                      updateEntry(entry.staffId, {
                        baseHourlyRateCents: cents > 0 ? cents : 1,
                      });
                    }}
                    disabled={submitting}
                    min="0.01"
                    step="0.25"
                    style={{ maxWidth: 140, height: 36, fontSize: 14 }}
                  />
                  <span
                    style={{ fontSize: 13, color: "var(--text-muted)" }}
                  >
                    /hr
                  </span>
                </div>
              </div>
            )}

            {(entry.modelType === "1099_COMMISSION" ||
              entry.modelType === "HYBRID") && (
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  <Percent
                    size={14}
                    strokeWidth={1.5}
                    style={{ color: "var(--text-muted)" }}
                  />
                  Commission rate
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    className="input"
                    value={entry.baseCommissionPct}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value || "0");
                      updateEntry(entry.staffId, {
                        baseCommissionPct: Math.min(100, Math.max(0, pct)),
                      });
                    }}
                    disabled={submitting}
                    min="0"
                    max="100"
                    step="1"
                    style={{ maxWidth: 100, height: 36, fontSize: 14 }}
                  />
                  <span
                    style={{ fontSize: 13, color: "var(--text-muted)" }}
                  >
                    %
                  </span>
                </div>
              </div>
            )}

            {entry.modelType === "BOOTH_RENT" && (
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  <Home
                    size={14}
                    strokeWidth={1.5}
                    style={{ color: "var(--text-muted)" }}
                  />
                  Booth rent
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="number"
                    className="input"
                    value={(entry.boothRentCents / 100).toFixed(2)}
                    onChange={(e) => {
                      const cents = Math.round(
                        parseFloat(e.target.value || "0") * 100
                      );
                      updateEntry(entry.staffId, {
                        boothRentCents: cents > 0 ? cents : 1,
                      });
                    }}
                    disabled={submitting}
                    min="0.01"
                    step="25"
                    style={{ maxWidth: 140, height: 36, fontSize: 14 }}
                  />
                  <select
                    className="input"
                    value={entry.boothRentFrequency}
                    onChange={(e) =>
                      updateEntry(entry.staffId, {
                        boothRentFrequency:
                          e.target.value as BoothRentFrequency,
                      })
                    }
                    disabled={submitting}
                    style={{ width: "auto", minWidth: 120, height: 36, fontSize: 13 }}
                  >
                    {(
                      Object.keys(BOOTH_FREQ_LABELS) as BoothRentFrequency[]
                    ).map((f) => (
                      <option key={f} value={f}>
                        {BOOTH_FREQ_LABELS[f]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
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
          }}
        >
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
        onClick={() => handleSubmit("save")}
        disabled={submitting}
        style={{
          width: "100%",
          height: 52,
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
          opacity: submitting ? 0.55 : 1,
          cursor: submitting ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}
      >
        {submitting ? "Saving..." : "Save & finish setup"}
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
