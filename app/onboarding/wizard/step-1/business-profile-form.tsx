"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { OnboardingState } from "@/lib/onboarding/types";

interface Props {
  sessionId: string;
  initialState: OnboardingState;
  prefill: {
    orgName: string;
    planTier: "FREE" | "PREMIUM";
    locationName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    timezone: string;
  };
}

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
] as const;

const PLAN_TIERS = [
  {
    value: "FREE" as const,
    label: "Free",
    description: "Get started with core booking and payments.",
  },
  {
    value: "PREMIUM" as const,
    label: "Premium",
    description: "Advanced reporting, multi-location, and priority support.",
  },
] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  color: "#111827",
  backgroundColor: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 500,
  color: "#111827",
  marginBottom: "6px",
};

function mapOrgError(code: string | undefined, status: number): string {
  switch (code) {
    case "invalid_org_name":
      return "Organization name must be between 2 and 100 characters.";
    case "invalid_plan_tier":
      return "Please select a valid plan.";
    case "org_name_required":
      return "Organization name is required.";
    case "plan_tier_required":
      return "Please select a plan tier.";
    case "org_scope_mismatch":
      return "Session error. Please refresh the page and try again.";
    case "session_not_found":
      return "Your onboarding session was not found. Please start over.";
    case "slug_collision":
      return "Could not create organization. Please try again.";
    default:
      if (status === 500) return "Something went wrong creating your organization. Please try again.";
      return "Could not create organization. Please try again.";
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

export default function BusinessProfileForm({ sessionId, initialState, prefill }: Props) {
  const router = useRouter();
  const { update } = useSession();

  const alreadyComplete = initialState === "LOCATION_CREATED";
  const orgAlreadyCreated =
    initialState === "ORG_CREATED" ||
    initialState === "LOCATION_PENDING" ||
    initialState === "LOCATION_CREATED";

  const [orgName, setOrgName] = useState(prefill.orgName);
  const [planTier, setPlanTier] = useState<"FREE" | "PREMIUM">(prefill.planTier);
  const [locationName, setLocationName] = useState(prefill.locationName);
  const [address, setAddress] = useState(prefill.address);
  const [city, setCity] = useState(prefill.city);
  const [stateCode, setStateCode] = useState(prefill.state);
  const [zip, setZip] = useState(prefill.zip);
  const [timezone, setTimezone] = useState(prefill.timezone || "America/Chicago");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!orgAlreadyCreated) {
      const trimmedOrg = orgName.trim();
      if (trimmedOrg.length < 2 || trimmedOrg.length > 100) {
        return "Organization name must be between 2 and 100 characters.";
      }
    }
    const trimmedLoc = locationName.trim();
    if (trimmedLoc.length < 2 || trimmedLoc.length > 100) {
      return "Location name must be between 2 and 100 characters.";
    }
    if (!address.trim()) {
      return "Street address is required.";
    }
    if (!city.trim()) {
      return "City is required.";
    }
    if (!stateCode) {
      return "Please select a state.";
    }
    if (!/^\d{5}$/.test(zip.trim())) {
      return "ZIP code must be 5 digits.";
    }
    return null;
  }

  async function refreshAndUpdateSession(): Promise<void> {
    const res = await fetch("/api/onboarding/refresh-session", { method: "POST" });
    if (res.status === 429) {
      await update();
      return;
    }
    await update();
  }

  async function createLocation(): Promise<{ ok: boolean; reason?: string; message?: string }> {
    const res = await fetch("/api/onboarding/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        locationName: locationName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateCode,
        zip: zip.trim(),
        timezone,
      }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, reason: body.error, message: mapLocationError(body.error, res.status) };
  }

  async function handleSubmit() {
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      // CALL 1 — create org (skip if already created)
      if (!orgAlreadyCreated) {
        let orgRes = await fetch("/api/onboarding/org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, orgName: orgName.trim(), planTier }),
        });

        // SLUG_COLLISION (503) is transient — auto-retry once after 500ms
        if (orgRes.status === 503) {
          await new Promise((r) => setTimeout(r, 500));
          orgRes = await fetch("/api/onboarding/org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, orgName: orgName.trim(), planTier }),
          });
        }

        if (!orgRes.ok) {
          const body = await orgRes.json().catch(() => ({}));
          // 409 invalid_transition means org already exists — continue to location
          if (orgRes.status === 409 && body.error === "invalid_transition") {
            // org already created in a prior attempt; fall through
          } else {
            setError(mapOrgError(body.error, orgRes.status));
            setSubmitting(false);
            return;
          }
        }
      }

      // CALL 2 — refresh JWT so organizationId lands in the session token
      await refreshAndUpdateSession();

      // CALL 3 — create location (with one retry on org_not_in_session)
      let locationResult = await createLocation();
      if (!locationResult.ok && locationResult.reason === "org_not_in_session") {
        // JWT didn't propagate — refresh + update once more, then retry
        await refreshAndUpdateSession();
        locationResult = await createLocation();
      }

      if (!locationResult.ok) {
        setError(locationResult.message ?? "Couldn't save your location. Please refresh and try again.");
        setSubmitting(false);
        return;
      }

      // Success — advance to step 2
      router.push("/onboarding/wizard/step-2");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
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
            margin: "0 0 24px",
            fontSize: "16px",
            color: "#111827",
            fontWeight: 500,
          }}
        >
          Business profile complete.
        </p>
        <button
          onClick={() => router.push("/onboarding/wizard/step-2")}
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
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7a8f96")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#606E74")}
        >
          Continue to Services
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "8px" }}>
      {/* Organization section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Organization
        </h2>

        {/* Org name */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle} htmlFor="orgName">
            Organization name
          </label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            disabled={orgAlreadyCreated || submitting}
            placeholder="e.g., Salon Envy"
            maxLength={100}
            style={{
              ...inputStyle,
              ...(orgAlreadyCreated
                ? { backgroundColor: "#f9fafb", color: "#6b7280", cursor: "not-allowed" }
                : {}),
            }}
            onFocus={(e) => {
              if (!orgAlreadyCreated) e.currentTarget.style.borderColor = "#606E74";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          />
          {orgAlreadyCreated && (
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>
              Organization already created.
            </p>
          )}
        </div>

        {/* Plan tier */}
        <div>
          <label style={{ ...labelStyle, marginBottom: "10px" }}>Plan</label>
          <div style={{ display: "flex", gap: "12px" }}>
            {PLAN_TIERS.map((tier) => {
              const selected = planTier === tier.value;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => {
                    if (!orgAlreadyCreated && !submitting) setPlanTier(tier.value);
                  }}
                  disabled={orgAlreadyCreated || submitting}
                  style={{
                    flex: 1,
                    padding: "16px",
                    border: selected ? "2px solid #606E74" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    backgroundColor: selected ? "#f0f3f4" : "#ffffff",
                    cursor: orgAlreadyCreated || submitting ? "not-allowed" : "pointer",
                    textAlign: "left",
                    opacity: orgAlreadyCreated ? 0.7 : 1,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {tier.label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    {tier.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Location section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Location
        </h2>

        {/* Location name */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle} htmlFor="locationName">
            Location name
          </label>
          <input
            id="locationName"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            disabled={submitting}
            placeholder="e.g., Main Street"
            maxLength={100}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#606E74";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          />
        </div>

        {/* Street address */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle} htmlFor="address">
            Street address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={submitting}
            placeholder="123 Main St"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#606E74";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          />
        </div>

        {/* City + State row */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <div style={{ flex: 2 }}>
            <label style={labelStyle} htmlFor="city">
              City
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={submitting}
              placeholder="Corpus Christi"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#606E74";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="stateCode">
              State
            </label>
            <select
              id="stateCode"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              disabled={submitting}
              style={{
                ...inputStyle,
                appearance: "auto",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#606E74";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ZIP + Timezone row */}
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="zip">
              ZIP code
            </label>
            <input
              id="zip"
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              disabled={submitting}
              placeholder="78401"
              maxLength={5}
              inputMode="numeric"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#606E74";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle} htmlFor="timezone">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={submitting}
              style={{
                ...inputStyle,
                appearance: "auto",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#606E74";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "24px",
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

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: "100%",
          padding: "14px 24px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#ffffff",
          backgroundColor: submitting ? "#9ca3af" : "#606E74",
          border: "none",
          borderRadius: "8px",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
        onMouseOver={(e) => {
          if (!submitting) e.currentTarget.style.backgroundColor = "#7a8f96";
        }}
        onMouseOut={(e) => {
          if (!submitting) e.currentTarget.style.backgroundColor = "#606E74";
        }}
      >
        {submitting ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
