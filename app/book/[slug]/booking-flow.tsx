"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ServiceOption {
  id: string;
  name: string;
  price: number | null;
  duration: number | null;
}

interface StaffOption {
  id: string;
  name: string;
}

interface OptionsResponse {
  organization: { name: string };
  location: { id: string; name: string | null; timezone: string };
  services: ServiceOption[];
  staff: StaffOption[];
}

interface AvailabilityResponse {
  date: string;
  serviceDurationMinutes: number;
  slots: string[];
}

interface BookingResult {
  appointment: {
    id: string;
    startTime: string;
    endTime: string;
    serviceName: string | null;
    staffId: string;
  };
  client: { id: string };
}

type Step = "service" | "staff" | "datetime" | "details" | "confirm";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatPrice(dollars: number | null): string {
  if (dollars == null) return "";
  return `$${dollars.toFixed(2)}`;
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatSlotTime(iso: string, timeZone: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function todayStr(timeZone: string): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function maxDateStr(timeZone: string): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function timeFromISO(iso: string, timeZone: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function dateFromISO(iso: string, timeZone: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function BookingFlow({
  slug,
  locationSlug,
  organizationName,
  locationName,
}: {
  slug: string;
  locationSlug?: string;
  organizationName: string;
  locationName: string | null;
}) {
  const [step, setStep] = useState<Step>("service");
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffOption | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const tz = options?.location.timezone ?? "America/Chicago";

  /* ---------- Fetch options on mount ---------- */

  useEffect(() => {
    const ctrl = new AbortController();
    setOptionsLoading(true);
    setOptionsError(null);

    const optUrl = `/api/public/${encodeURIComponent(slug)}/options` + (locationSlug ? `?location=${encodeURIComponent(locationSlug)}` : "");

    fetch(optUrl, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load options");
        const data: OptionsResponse = await res.json();
        setOptions(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setOptionsError("Failed to load booking options. Please try again.");
      })
      .finally(() => setOptionsLoading(false));

    return () => ctrl.abort();
  }, [slug, locationSlug]);

  /* ---------- Fetch slots when date changes ---------- */

  const fetchSlots = useCallback(
    (date: string) => {
      if (!selectedService || !selectedStaff) return;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setSlotsLoading(true);
      setSlotsError(null);
      setSlots([]);
      setSelectedSlot(null);

      const qs = new URLSearchParams({
        staffId: selectedStaff.id,
        serviceId: selectedService.id,
        date,
      });
      if (locationSlug) qs.set("location", locationSlug);

      fetch(`/api/public/${encodeURIComponent(slug)}/availability?${qs}`, {
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || "Failed to load availability");
          }
          const data: AvailabilityResponse = await res.json();
          setSlots(data.slots);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setSlotsError("Failed to load available times.");
        })
        .finally(() => setSlotsLoading(false));
    },
    [slug, locationSlug, selectedService, selectedStaff],
  );

  useEffect(() => {
    if (step === "datetime" && selectedDate) {
      fetchSlots(selectedDate);
    }
    return () => abortRef.current?.abort();
  }, [step, selectedDate, fetchSlots]);

  /* ---------- Submit booking ---------- */

  const handleSubmit = async () => {
    if (!selectedService || !selectedStaff || !selectedSlot || !clientName.trim()) return;
    if (!clientPhone.trim() && !clientEmail.trim()) {
      setSubmitError("Please provide a phone number or email.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Extract location-local date+time from the selected UTC slot ISO
    const slotDate = new Date(selectedSlot);
    const localParts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(slotDate);
    const p = Object.fromEntries(localParts.map((x) => [x.type, x.value]));
    const bookDate = `${p.year}-${p.month}-${p.day}`;
    const hr = Number(p.hour) === 24 ? 0 : Number(p.hour);
    const bookTime = `${String(hr).padStart(2, "0")}:${p.minute}`;

    try {
      const res = await fetch(`/api/public/${encodeURIComponent(slug)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          serviceId: selectedService.id,
          date: bookDate,
          time: bookTime,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          clientPhone: clientPhone.trim() || undefined,
          locationSlug: locationSlug || undefined,
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        setBookingResult(data);
        setStep("confirm");
      } else if (res.status === 429) {
        setSubmitError("You've made several booking attempts in a short time. Please wait a moment and try again.");
      } else if (res.status === 409) {
        setSubmitError("That time was just taken. Please go back and pick another.");
        setSelectedSlot(null);
        setStep("datetime");
        if (selectedDate) fetchSlots(selectedDate);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.message || data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Render ---------- */

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-inter), sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        padding: "16px 24px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>{organizationName}</h1>
          {locationName && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {locationName}
            </p>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>

        {/* Step indicators */}
        {step !== "confirm" && (
          <div style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
          }}>
            {(["service", "staff", "datetime", "details"] as const).map((s, i) => (
              <div key={s} style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: (["service", "staff", "datetime", "details"] as const).indexOf(step) >= i
                  ? "var(--brand)"
                  : "var(--border)",
                transition: "background 0.2s",
              }} />
            ))}
          </div>
        )}

        {/* Loading / Error */}
        {optionsLoading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-secondary)" }}>
            Loading...
          </div>
        )}
        {optionsError && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--error, #dc2626)" }}>
            {optionsError}
          </div>
        )}

        {/* Step 1: Service */}
        {!optionsLoading && !optionsError && step === "service" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Choose a service</h2>
            {options?.services.length === 0 && (
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No services available for online booking.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {options?.services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep("staff"); }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: selectedService?.id === svc.id ? "var(--brand-soft)" : "var(--bg-card)",
                    border: `1px solid ${selectedService?.id === svc.id ? "var(--brand)" : "var(--border)"}`,
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontSize: 14,
                    color: "var(--text-primary)",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{svc.name}</div>
                    {svc.duration != null && (
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                        {formatDuration(svc.duration)}
                      </div>
                    )}
                  </div>
                  {svc.price != null && (
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {formatPrice(svc.price)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Staff */}
        {!optionsLoading && !optionsError && step === "staff" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Choose a stylist</h2>
            <button
              onClick={() => setStep("service")}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand)",
                cursor: "pointer",
                fontSize: 13,
                marginBottom: 12,
                padding: 0,
              }}
            >
              &larr; Back
            </button>
            {options?.staff.length === 0 && (
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No stylists available.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {options?.staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s); setSelectedDate(""); setSelectedSlot(null); setStep("datetime"); }}
                  style={{
                    padding: "16px",
                    background: selectedStaff?.id === s.id ? "var(--brand-soft)" : "var(--bg-card)",
                    border: `1px solid ${selectedStaff?.id === s.id ? "var(--brand)" : "var(--border)"}`,
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date + Time */}
        {!optionsLoading && !optionsError && step === "datetime" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Pick a date & time</h2>
            <button
              onClick={() => setStep("staff")}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand)",
                cursor: "pointer",
                fontSize: 13,
                marginBottom: 12,
                padding: 0,
              }}
            >
              &larr; Back
            </button>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={todayStr(tz)}
                max={maxDateStr(tz)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
                style={{ width: "100%", padding: "10px 12px", fontSize: 14 }}
              />
            </div>

            {selectedDate && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Available times for {formatDate(selectedDate)}
                </p>

                {slotsLoading && (
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, padding: "16px 0" }}>
                    Loading available times...
                  </p>
                )}

                {slotsError && (
                  <p style={{ color: "var(--error, #dc2626)", fontSize: 14, padding: "16px 0" }}>
                    {slotsError}
                  </p>
                )}

                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, padding: "16px 0" }}>
                    No times available. Try another day.
                  </p>
                )}

                {!slotsLoading && !slotsError && slots.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: 8,
                  }}>
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => { setSelectedSlot(slot); setStep("details"); }}
                        style={{
                          padding: "12px 8px",
                          background: selectedSlot === slot ? "var(--brand)" : "var(--bg-card)",
                          color: selectedSlot === slot ? "white" : "var(--text-primary)",
                          border: `1px solid ${selectedSlot === slot ? "var(--brand)" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 500,
                          textAlign: "center",
                          transition: "all 0.15s",
                        }}
                      >
                        {formatSlotTime(slot, tz)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Details */}
        {!optionsLoading && !optionsError && step === "details" && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Your details</h2>
            <button
              onClick={() => setStep("datetime")}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand)",
                cursor: "pointer",
                fontSize: 13,
                marginBottom: 16,
                padding: 0,
              }}
            >
              &larr; Back
            </button>

            {/* Summary */}
            <div style={{
              background: "var(--brand-soft)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              marginBottom: 20,
              fontSize: 14,
            }}>
              <div><strong>{selectedService?.name}</strong></div>
              <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                with {selectedStaff?.name}
              </div>
              {selectedSlot && (
                <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>
                  {dateFromISO(selectedSlot, tz)} at {timeFromISO(selectedSlot, tz)}
                </div>
              )}
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "var(--text-secondary)" }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Your name"
                  className="input"
                  style={{ width: "100%", padding: "12px", fontSize: 15 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "var(--text-secondary)" }}>
                  Phone *
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(555) 555-1234"
                  className="input"
                  style={{ width: "100%", padding: "12px", fontSize: 15 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 4, color: "var(--text-secondary)" }}>
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  style={{ width: "100%", padding: "12px", fontSize: 15 }}
                />
              </div>
            </div>

            {submitError && (
              <p style={{ color: "var(--error, #dc2626)", fontSize: 13, marginTop: 12 }}>
                {submitError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !clientName.trim() || (!clientPhone.trim() && !clientEmail.trim())}
              className="btn btn-primary"
              style={{
                width: "100%",
                marginTop: 20,
                padding: "14px",
                fontSize: 15,
                fontWeight: 600,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === "confirm" && bookingResult && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--success-soft, rgba(22,163,74,0.10))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 28,
              color: "#16a34a",
            }}>
              &#10003;
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
              You&apos;re booked!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
              Your appointment has been confirmed.
            </p>

            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
              textAlign: "left",
              fontSize: 14,
            }}>
              {bookingResult.appointment.serviceName && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>Service</div>
                  <div style={{ fontWeight: 500 }}>{bookingResult.appointment.serviceName}</div>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>Stylist</div>
                <div style={{ fontWeight: 500 }}>
                  {options?.staff.find((s) => s.id === bookingResult.appointment.staffId)?.name ?? "Your stylist"}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>Date</div>
                <div style={{ fontWeight: 500 }}>{dateFromISO(bookingResult.appointment.startTime, tz)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 2 }}>Time</div>
                <div style={{ fontWeight: 500 }}>
                  {timeFromISO(bookingResult.appointment.startTime, tz)} &ndash; {timeFromISO(bookingResult.appointment.endTime, tz)}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStep("service");
                setSelectedService(null);
                setSelectedStaff(null);
                setSelectedDate("");
                setSelectedSlot(null);
                setClientName("");
                setClientPhone("");
                setClientEmail("");
                setBookingResult(null);
                setSubmitError(null);
              }}
              className="btn btn-secondary"
              style={{ marginTop: 20, padding: "12px 24px", fontSize: 14 }}
            >
              Book another appointment
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
