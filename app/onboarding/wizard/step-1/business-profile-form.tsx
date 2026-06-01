"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Scissors, Sparkles, Check, AlertCircle } from "lucide-react";
import type { OnboardingState } from "@/lib/onboarding/types";
import AddressAutocomplete from "@/components/onboarding/AddressAutocomplete";
import type { ParsedAddress } from "@/components/onboarding/AddressAutocomplete";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VerticalId = "salon" | "nail_salon";

interface VerticalOption {
  id: VerticalId;
  displayName: string;
  tagline: string;
  icon: typeof Scissors;
}

interface Props {
  sessionId: string;
  initialState: OnboardingState;
  prefill: {
    vertical: VerticalId | "";
    legalName: string;
    dbaName: string;
    displayName: string;
    locationName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    timezone: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Vertical options                                                    */
/* ------------------------------------------------------------------ */

const VERTICALS: VerticalOption[] = [
  {
    id: "salon",
    displayName: "Salon & Beauty",
    tagline: "Full-service hair, color, and beauty",
    icon: Scissors,
  },
  {
    id: "nail_salon",
    displayName: "Nail Salon",
    tagline: "Manicures, pedicures, and nail art",
    icon: Sparkles,
  },
];

/* ------------------------------------------------------------------ */
/*  Error mappers                                                       */
/* ------------------------------------------------------------------ */

function mapOrgError(code: string | undefined, status: number): string {
  switch (code) {
    case "invalid_org_name":
      return "Name must be between 2 and 100 characters.";
    case "invalid_vertical":
      return "Please select a business type.";
    case "vertical_required":
      return "Please select a business type.";
    case "legal_name_required":
      return "Legal business name is required.";
    case "display_name_required":
      return "Display name is required.";
    case "org_scope_mismatch":
      return "Session error. Please refresh the page and try again.";
    case "session_not_found":
      return "Your onboarding session was not found. Please start over.";
    case "org_not_yet_created":
      return "Organization setup incomplete. Please refresh and try again.";
    case "session_completed":
      return "This onboarding session is already complete.";
    default:
      if (status === 500) return "Something went wrong. Please try again.";
      return "Could not save your business profile. Please try again.";
  }
}

function mapLocationError(code: string | undefined, status: number): string {
  switch (code) {
    case "session_id_required":
      return "Session error. Please refresh the page and try again.";
    case "invalid_location_name":
      return "Location name must be between 2 and 100 characters.";
    case "invalid_address":
      return "Please enter a valid street address.";
    case "not_authenticated":
    case "invalid_session":
      return "Your session has expired. Please refresh the page.";
    case "org_not_in_session":
      return "Session sync issue. Please refresh the page and try again.";
    case "invalid_transition":
      return "This step may already be complete. Please refresh the page.";
    default:
      if (status === 500) return "Something went wrong saving your location. Please try again.";
      return "Could not save location. Please try again.";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function BusinessProfileForm({ sessionId, initialState, prefill }: Props) {
  const router = useRouter();
  const { update } = useSession();

  const alreadyComplete = initialState === "LOCATION_CREATED";

  /* --- Form state --- */
  const [vertical, setVertical] = useState<VerticalId | "">(prefill.vertical);
  const [legalName, setLegalName] = useState(prefill.legalName);
  const [dbaName, setDbaName] = useState(prefill.dbaName);
  const [displayName, setDisplayName] = useState(prefill.displayName);
  const [locationName, setLocationName] = useState(prefill.locationName);

  // Address from Places or fallback
  const [addressData, setAddressData] = useState<ParsedAddress | null>(
    prefill.address
      ? {
          address: prefill.address,
          city: prefill.city,
          state: prefill.state,
          zip: prefill.zip,
          timezone: prefill.timezone || "America/Chicago",
        }
      : null
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  /* --- Address callback --- */
  const handleAddressSelect = useCallback((parsed: ParsedAddress) => {
    setAddressData(parsed);
  }, []);

  /* --- Validation --- */
  function validate(): string | null {
    if (!vertical) return "Please select a business type.";
    if (legalName.trim().length < 2 || legalName.trim().length > 100) {
      return "Legal business name must be between 2 and 100 characters.";
    }
    if (displayName.trim().length < 2 || displayName.trim().length > 100) {
      return "Display name must be between 2 and 100 characters.";
    }
    if (dbaName.trim().length > 100) {
      return "DBA name must be at most 100 characters.";
    }
    if (locationName.trim().length < 2 || locationName.trim().length > 100) {
      return "Location name must be between 2 and 100 characters.";
    }
    if (!addressData || !addressData.address.trim()) {
      return "Please select an address from the suggestions, or fill in all address fields.";
    }
    if (!addressData.city.trim() || !addressData.state || !/^\d{5}$/.test(addressData.zip.trim())) {
      return "Address is incomplete. Please select from the suggestions or fill in all fields.";
    }
    return null;
  }

  const isFormValid =
    vertical !== "" &&
    legalName.trim().length >= 2 &&
    displayName.trim().length >= 2 &&
    locationName.trim().length >= 2 &&
    addressData !== null &&
    addressData.address.trim() !== "" &&
    addressData.city.trim() !== "" &&
    addressData.state !== "" &&
    /^\d{5}$/.test(addressData.zip.trim());

  /* --- JWT refresh helper (same pattern as before) --- */
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

  /* --- Location creation helper --- */
  async function createLocation(): Promise<{ ok: boolean; reason?: string; message?: string }> {
    const res = await fetch("/api/onboarding/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        locationName: locationName.trim(),
        address: addressData!.address.trim(),
        city: addressData!.city.trim(),
        state: addressData!.state,
        zip: addressData!.zip.trim(),
        timezone: addressData!.timezone,
      }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, reason: body.error, message: mapLocationError(body.error, res.status) };
  }

  /* --- Submit handler --- */
  async function handleSubmit() {
    if (inFlightRef.current) return;
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);
    try {
      // CALL 1 — update org profile
      const orgRes = await fetch("/api/onboarding/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          vertical,
          legalName: legalName.trim(),
          dbaName: dbaName.trim() || undefined,
          displayName: displayName.trim(),
        }),
      });

      if (!orgRes.ok) {
        const body = await orgRes.json().catch(() => ({}));
        // 409 invalid_transition = state already past ORG_CREATED (revisit) — continue
        if (orgRes.status === 409 && body.error === "invalid_transition") {
          // already saved, fall through
        } else {
          setError(mapOrgError(body.error, orgRes.status));
          return;
        }
      }

      // CALL 2 — refresh JWT so organizationId lands in session token
      await refreshAndUpdateSession();

      // CALL 3 — create location (with one retry on org_not_in_session)
      let locationResult = await createLocation();
      if (!locationResult.ok && locationResult.reason === "org_not_in_session") {
        await refreshAndUpdateSession();
        locationResult = await createLocation();
      }

      if (!locationResult.ok) {
        // 409 invalid_transition on location = already created (revisit step 1)
        if (locationResult.reason === "invalid_transition") {
          // fall through to navigation
        } else {
          setError(locationResult.message ?? "Could not save your location. Please try again.");
          return;
        }
      }

      setSubmitting(false);
      router.push("/onboarding/wizard/step-2");
    } catch (err) {
      console.error("[business-profile-form] submit failed", err);
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
          margin: "0 0 24px",
          fontSize: 16,
          color: "var(--text-primary)",
          fontWeight: 500,
        }}>
          Business profile complete.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/onboarding/wizard/step-2")}
          style={{ height: 44, padding: "0 24px" }}
        >
          Continue to Services
        </button>
      </div>
    );
  }

  /* --- Main form --- */
  return (
    <div style={{ marginTop: 8 }}>
      {/* SECTION 1 — Vertical Picker */}
      <div style={{ marginBottom: 32 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          color: "var(--text-muted)",
          margin: "0 0 8px",
        }}>
          Business Type
        </p>
        <p style={{
          fontSize: 13,
          color: "var(--text-muted)",
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}>
          This personalizes your entire workspace.
        </p>

        <div
          role="radiogroup"
          aria-label="Business type"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {VERTICALS.map((v) => {
            const selected = vertical === v.id;
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => setVertical(v.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setVertical(v.id);
                  }
                }}
                disabled={submitting}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "20px 18px",
                  border: selected
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  borderRadius: 12,
                  backgroundColor: selected
                    ? "var(--accent-soft)"
                    : "var(--bg-card)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 200ms ease",
                  transform: selected ? "translateY(-2px)" : "none",
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

                {/* Icon circle */}
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "var(--bg-cream)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} style={{ color: "var(--brand)" }} />
                </span>

                {/* Text */}
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.2px",
                  }}>
                    {v.displayName}
                  </p>
                  <p style={{
                    margin: "3px 0 0",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                  }}>
                    {v.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 — Business Profile (appears after vertical selection) */}
      {vertical !== "" && (
        <div style={{ animation: "fadeInUp 250ms ease-out" }}>
          {/* Business details */}
          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              color: "var(--text-muted)",
              margin: "0 0 8px",
            }}>
              About Your Business
            </p>

            {/* Legal name */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="legalName"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                Legal business name
              </label>
              <input
                id="legalName"
                type="text"
                className="input"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={submitting}
                placeholder="e.g. Reyna Tech LLC"
                maxLength={100}
                style={{ height: 40, fontSize: 14 }}
              />
              <p style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-muted)",
              }}>
                Your registered legal entity name.
              </p>
            </div>

            {/* DBA name */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="dbaName"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                DBA / brand name
                <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>
                  (optional)
                </span>
              </label>
              <input
                id="dbaName"
                type="text"
                className="input"
                value={dbaName}
                onChange={(e) => setDbaName(e.target.value)}
                disabled={submitting}
                placeholder='e.g. "Salon Envy"'
                maxLength={100}
                style={{ height: 40, fontSize: 14 }}
              />
              <p style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-muted)",
              }}>
                What customers know you as, if different.
              </p>
            </div>

            {/* Display name */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="displayName"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
                placeholder="e.g. Salon Envy"
                maxLength={100}
                style={{ height: 40, fontSize: 14 }}
              />
              <p style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--text-muted)",
              }}>
                Shown across your Kasse workspace.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            backgroundColor: "var(--border)",
            margin: "0 0 28px",
          }} />

          {/* First location */}
          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.4px",
              color: "var(--text-muted)",
              margin: "0 0 8px",
            }}>
              Your First Location
            </p>

            {/* Location name */}
            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor="locationName"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                Location name
              </label>
              <input
                id="locationName"
                type="text"
                className="input"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={submitting}
                placeholder='e.g. "Downtown" or "Main Street"'
                maxLength={100}
                style={{ height: 40, fontSize: 14 }}
              />
            </div>

            {/* Address */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 6,
                }}
              >
                Address
              </label>
              <AddressAutocomplete
                onSelect={handleAddressSelect}
                defaultValue={prefill.address}
                disabled={submitting}
              />
            </div>

            {/* Show parsed address confirmation chips */}
            {addressData && addressData.city && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  padding: "10px 12px",
                  backgroundColor: "var(--accent-soft)",
                  borderRadius: 8,
                  marginBottom: 8,
                  animation: "fadeInUp 200ms ease-out",
                }}
              >
                {[
                  addressData.address,
                  addressData.city,
                  addressData.state,
                  addressData.zip,
                ].filter(Boolean).map((part, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--accent)",
                      backgroundColor: "var(--bg-card)",
                      padding: "3px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--accent-soft)",
                    }}
                  >
                    {part}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                marginBottom: 20,
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

          {/* Submit CTA */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
            style={{
              width: "100%",
              height: 52,
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              opacity: submitting || !isFormValid ? 0.55 : 1,
              cursor: submitting || !isFormValid ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Saving..." : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
