"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";

export interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
}

interface Props {
  onSelect: (parsed: ParsedAddress) => void;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * Simple state-code → IANA timezone mapping. Covers the contiguous US + AK/HI.
 * Defaults to America/Chicago for unknown codes (central US bias — largest
 * timezone by state count). This avoids a paid Google Timezone API call for v1.
 */
const STATE_TO_TIMEZONE: Record<string, string> = {
  CT: "America/New_York", DE: "America/New_York", FL: "America/New_York",
  GA: "America/New_York", MA: "America/New_York", MD: "America/New_York",
  ME: "America/New_York", NC: "America/New_York", NH: "America/New_York",
  NJ: "America/New_York", NY: "America/New_York", OH: "America/New_York",
  PA: "America/New_York", RI: "America/New_York", SC: "America/New_York",
  VA: "America/New_York", VT: "America/New_York", WV: "America/New_York",
  DC: "America/New_York", MI: "America/New_York",
  AL: "America/Chicago", AR: "America/Chicago", IA: "America/Chicago",
  IL: "America/Chicago", IN: "America/Chicago", KS: "America/Chicago",
  KY: "America/Chicago", LA: "America/Chicago", MN: "America/Chicago",
  MO: "America/Chicago", MS: "America/Chicago", NE: "America/Chicago",
  OK: "America/Chicago", TN: "America/Chicago", TX: "America/Chicago",
  WI: "America/Chicago",
  CO: "America/Denver", MT: "America/Denver", NM: "America/Denver",
  UT: "America/Denver", WY: "America/Denver", ND: "America/Denver",
  SD: "America/Denver", ID: "America/Denver",
  AZ: "America/Phoenix",
  CA: "America/Los_Angeles", NV: "America/Los_Angeles",
  OR: "America/Los_Angeles", WA: "America/Los_Angeles",
  AK: "America/Anchorage",
  HI: "Pacific/Honolulu",
};

function deriveTimezone(stateCode: string): string {
  return STATE_TO_TIMEZONE[stateCode] ?? "America/Chicago";
}

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): ParsedAddress {
  let streetNumber = "";
  let route = "";
  let city = "";
  let state = "";
  let zip = "";

  for (const c of components) {
    const type = c.types[0];
    if (type === "street_number") streetNumber = c.long_name;
    else if (type === "route") route = c.long_name;
    else if (type === "locality") city = c.long_name;
    else if (type === "sublocality_level_1" && !city) city = c.long_name;
    else if (type === "administrative_area_level_1") state = c.short_name;
    else if (type === "postal_code") zip = c.long_name;
  }

  const address = streetNumber ? `${streetNumber} ${route}` : route;
  return {
    address,
    city,
    state,
    zip,
    timezone: deriveTimezone(state),
  };
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL",
  "IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE",
  "NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD",
  "TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

/**
 * Google Places Autocomplete for US addresses with graceful degradation.
 *
 * If NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing or the script fails to load,
 * renders manual address + city + state + zip inputs so onboarding still works.
 */
export default function AddressAutocomplete({
  onSelect,
  defaultValue = "",
  disabled = false,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Fallback state
  const [manualAddress, setManualAddress] = useState(defaultValue);
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const [manualZip, setManualZip] = useState("");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load the Google Maps script once
  useEffect(() => {
    if (!apiKey) {
      setUseFallback(true);
      return;
    }

    // Already loaded
    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      return;
    }

    // Check if script tag is already injected (another mount)
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptLoaded(true));
      existingScript.addEventListener("error", () => setUseFallback(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => setScriptLoaded(true));
    script.addEventListener("error", () => setUseFallback(true));
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize autocomplete once script + input are ready
  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) {
      setUseFallback(true);
      return;
    }

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components) return;
      const parsed = parseAddressComponents(place.address_components);
      onSelect(parsed);
    });

    autocompleteRef.current = ac;
  }, [scriptLoaded, onSelect]);

  // Propagate manual fallback changes
  const handleManualChange = useCallback(() => {
    if (
      manualAddress.trim() &&
      manualCity.trim() &&
      manualState &&
      /^\d{5}$/.test(manualZip.trim())
    ) {
      onSelect({
        address: manualAddress.trim(),
        city: manualCity.trim(),
        state: manualState,
        zip: manualZip.trim(),
        timezone: deriveTimezone(manualState),
      });
    }
  }, [manualAddress, manualCity, manualState, manualZip, onSelect]);

  useEffect(() => {
    handleManualChange();
  }, [handleManualChange]);

  if (useFallback) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }} htmlFor="fallback-address">
            Street address
          </label>
          <input
            id="fallback-address"
            type="text"
            className="input"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            disabled={disabled}
            placeholder="123 Main St"
            style={{ height: 40, fontSize: 14 }}
          />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }} htmlFor="fallback-city">
              City
            </label>
            <input
              id="fallback-city"
              type="text"
              className="input"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              disabled={disabled}
              placeholder="City"
              style={{ height: 40, fontSize: 14 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }} htmlFor="fallback-state">
              State
            </label>
            <select
              id="fallback-state"
              className="input"
              value={manualState}
              onChange={(e) => setManualState(e.target.value)}
              disabled={disabled}
              style={{ height: 40, fontSize: 14 }}
            >
              <option value="">State</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }} htmlFor="fallback-zip">
              ZIP
            </label>
            <input
              id="fallback-zip"
              type="text"
              className="input"
              value={manualZip}
              onChange={(e) => setManualZip(e.target.value)}
              disabled={disabled}
              placeholder="78401"
              maxLength={5}
              inputMode="numeric"
              style={{ height: 40, fontSize: 14 }}
            />
          </div>
        </div>
        {error && (
          <p style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "var(--error)", margin: 0,
          }}>
            <AlertCircle size={14} strokeWidth={1.5} />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        className="input"
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder="Start typing an address..."
        style={{ height: 40, fontSize: 14 }}
        autoComplete="off"
      />
      {error && (
        <p style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--error)", margin: "6px 0 0",
        }}>
          <AlertCircle size={14} strokeWidth={1.5} />
          {error}
        </p>
      )}
    </div>
  );
}
