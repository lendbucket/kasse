"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Calendar, Check, ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
import DayGrid from "./day-grid";
import WeekGrid from "./week-grid";

type View = "list" | "day" | "week";
type Staff = { id: string; name: string; locationId: string };
type Service = { id: string; name: string; price: number; duration: number; locationId: string };
type Appointment = {
  id: string; clientName: string | null; serviceName: string | null; price: number | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  startTime: string; endTime: string; notes: string | null;
  staff: { id: string; name: string } | null; client: { id: string; name: string } | null;
};

const TIME_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });

const STATUS: Record<Appointment["status"], { label: string; bg: string; color: string; border: string }> = {
  scheduled: { label: "Scheduled", bg: "var(--info-soft)", color: "var(--accent)", border: "var(--accent)" },
  completed: { label: "Completed", bg: "var(--success-soft)", color: "var(--success)", border: "var(--success)" },
  cancelled: { label: "Cancelled", bg: "var(--error-soft)", color: "var(--error)", border: "var(--error)" },
  no_show: { label: "No Show", bg: "var(--warning-soft)", color: "var(--warning)", border: "var(--warning)" },
};

function todayChicago() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AppointmentsPage() {
  const [date, setDate] = useState(() => todayChicago());
  const [view, setView] = useState<View>("list");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalInitialStaffId, setModalInitialStaffId] = useState<string | undefined>();
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>();

  const locationId = services[0]?.locationId ?? staff[0]?.locationId ?? "";

  const loadAppointments = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams({ date });
      if (locationId) p.set("locationId", locationId);
      const res = await fetch(`/api/appointments?${p}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { appointments: Appointment[] };
      setAppointments(data.appointments);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, [date, locationId]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [s, st] = await Promise.all([fetch("/api/services"), fetch("/api/staff")]);
        const sd = s.ok ? ((await s.json()) as { services: Service[] }) : { services: [] };
        const std = st.ok ? ((await st.json()) as { staff: Staff[] }) : { staff: [] };
        if (!c) { setServices(sd.services); setStaff(std.staff); }
      } catch { /* ignore */ }
    })();
    return () => { c = true; };
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  async function updateStatus(id: string, status: Appointment["status"]) {
    const prev = appointments;
    setAppointments((l) => l.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      const r = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error();
    } catch { setAppointments(prev); }
  }

  function openModalFromSlot(staffId: string, time: string) {
    setModalInitialStaffId(staffId);
    setModalInitialTime(time);
    setShowModal(true);
  }

  function openModalDefault() {
    setModalInitialStaffId(undefined);
    setModalInitialTime(undefined);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setModalInitialStaffId(undefined);
    setModalInitialTime(undefined);
  }

  function handleDayClickFromWeek(d: string) {
    setDate(d);
    setView("day");
  }

  const navStep = view === "week" ? 7 : 1;

  return (
    <>
      {/* Header */}
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>SCHEDULE</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>Appointments</h1>
        </div>
        <button className="btn btn-primary" onClick={openModalDefault}><Plus size={16} strokeWidth={1.5} /> New Appointment</button>
      </div>

      {/* Toolbar */}
      <div style={{ padding: "12px 32px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Date nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, -navStep))}
            className="btn btn-ghost"
            style={{ height: 32, width: 32, padding: 0 }}
            aria-label="Previous"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 6, padding: "0 12px", height: 32 }}>
            <Calendar size={14} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, color: "var(--text-primary)", background: "transparent" }} />
          </div>
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, navStep))}
            className="btn btn-ghost"
            style={{ height: 32, width: 32, padding: 0 }}
            aria-label="Next"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", overflow: "hidden", borderRadius: 6, border: "1px solid var(--border)" }}>
          {(["list", "day", "week"] as View[]).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} style={{
              height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
              background: view === v ? "var(--brand)" : "var(--bg-card)", color: view === v ? "white" : "var(--text-secondary)",
              transition: "all 120ms", textTransform: "capitalize",
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 32px" }}>
        {view === "day" ? (
          <DayGrid
            appointments={appointments}
            staff={staff}
            date={date}
            onSlotClick={openModalFromSlot}
          />
        ) : view === "week" ? (
          <WeekGrid
            date={date}
            locationId={locationId}
            onDayClick={handleDayClickFromWeek}
          />
        ) : loading ? (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: "48px 32px", textAlign: "center", borderColor: "var(--error-soft)" }}>
            <p style={{ fontSize: 14, color: "var(--error)" }}>{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="card" style={{ padding: "64px 32px", textAlign: "center" }}>
            <Calendar size={40} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>No appointments for this date</p>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>Schedule appointments and they&apos;ll appear here</p>
            <button className="btn btn-primary" onClick={openModalDefault}>+ New Appointment</button>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            {/* Desktop table */}
            <table className="hidden lg:table">
              <thead><tr>
                <th>Time</th><th>Client</th><th>Service</th><th>Stylist</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>
                {appointments.map((a) => {
                  const s = STATUS[a.status];
                  return (
                    <tr key={a.id}>
                      <td style={{ fontFamily: "var(--font-fira), monospace", fontSize: 13 }}>{TIME_FMT.format(new Date(a.startTime))}</td>
                      <td style={{ fontWeight: 500 }}>{a.clientName || a.client?.name || "Walk-in"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{a.serviceName || "\u2014"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{a.staff?.name || "\u2014"}</td>
                      <td><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "uppercase" }}>{s.label}</span></td>
                      <td style={{ textAlign: "right" }}>
                        {a.status === "scheduled" && (
                          <span style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <button onClick={() => updateStatus(a.id, "completed")} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 12, fontWeight: 500, color: "var(--success)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Complete</button>
                            <button onClick={() => updateStatus(a.id, "cancelled")} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 12, fontWeight: 500, color: "var(--error)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><X size={12} /> Cancel</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Mobile cards */}
            <div className="lg:hidden" style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              {appointments.map((a) => {
                const s = STATUS[a.status];
                return (
                  <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, fontFamily: "var(--font-fira), monospace", color: "var(--text-secondary)" }}>{TIME_FMT.format(new Date(a.startTime))}</p>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{a.clientName || a.client?.name || "Walk-in"}</p>
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{a.serviceName || "\u2014"} &middot; {a.staff?.name || "\u2014"}</p>
                      </div>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "uppercase", height: "fit-content" }}>{s.label}</span>
                    </div>
                    {a.status === "scheduled" && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button onClick={() => updateStatus(a.id, "completed")} style={{ flex: 1, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontWeight: 500, color: "var(--success)", cursor: "pointer" }}>Complete</button>
                        <button onClick={() => updateStatus(a.id, "cancelled")} style={{ flex: 1, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, fontWeight: 500, color: "var(--error)", cursor: "pointer" }}>Cancel</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewAppointmentModal
          date={date}
          services={services}
          staff={staff}
          locationId={locationId}
          initialStaffId={modalInitialStaffId}
          initialStartTime={modalInitialTime}
          onClose={handleModalClose}
          onCreated={() => { handleModalClose(); loadAppointments(); }}
        />
      )}
    </>
  );
}

function NewAppointmentModal({ date, services, staff, locationId, initialStaffId, initialStartTime, onClose, onCreated }: {
  date: string; services: Service[]; staff: Staff[]; locationId: string;
  initialStaffId?: string; initialStartTime?: string;
  onClose: () => void; onCreated: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(initialStaffId || (staff[0]?.id ?? ""));
  const [startDate, setStartDate] = useState(date);
  const [startTime, setStartTime] = useState(initialStartTime || "10:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canSubmit = useMemo(() => Boolean(locationId && staffId && startDate && startTime), [locationId, staffId, startDate, startTime]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true); setErr(null);
    try {
      const iso = new Date(`${startDate}T${startTime}`).toISOString();
      const r = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locationId, staffId, serviceId: serviceId || undefined, clientName: clientName || undefined, startTime: iso, notes: notes || undefined }) });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string; conflicts?: Array<{ type: string; conflictStart?: string; conflictEnd?: string }> };
        if (d.error === "booking_conflict" && d.conflicts?.length) {
          const msgs = d.conflicts.map((c) => {
            switch (c.type) {
              case "STYLIST_DOUBLE_BOOKED": {
                const fmt = (iso: string) => TIME_FMT.format(new Date(iso));
                return `This stylist is already booked from ${fmt(c.conflictStart!)}–${fmt(c.conflictEnd!)}.`;
              }
              case "STYLIST_NOT_WORKING":
                return "This stylist isn\u2019t scheduled to work then.";
              case "SERVICE_NOT_OFFERED_BY_STYLIST":
                return "This stylist doesn\u2019t offer the selected service.";
              case "INVALID_TIME_RANGE":
                return "Please choose a valid time.";
              default:
                return "Booking conflict.";
            }
          });
          throw new Error(msgs.join(" "));
        }
        throw new Error(d.error ?? "Create failed");
      }
      onCreated();
    } catch (e) { setErr(e instanceof Error ? e.message : "Create failed"); }
    finally { setSubmitting(false); }
  }

  const inputStyle: React.CSSProperties = { width: "100%", height: 40, borderRadius: 6, border: "1px solid var(--border)", padding: "0 12px", fontSize: 16, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", borderRadius: 12, width: 480, maxWidth: "100%", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>New Appointment</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Client name</span>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Walk-in" style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Service</span>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={inputStyle}>
              <option value="">Select a service</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} &middot; ${s.price.toFixed(2)}</option>)}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Stylist <span style={{ color: "var(--error)" }}>*</span></span>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} required style={inputStyle}>
              <option value="">Select a stylist</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Date</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={inputStyle} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Time</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required style={inputStyle} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional" style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "none" }} />
          </label>
          {err && <p style={{ fontSize: 13, color: "var(--error)", background: "var(--error-soft)", border: "1px solid var(--error)", borderRadius: 6, padding: "8px 12px" }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={!canSubmit || submitting} className="btn btn-primary" style={{ opacity: !canSubmit || submitting ? 0.5 : 1 }}>{submitting ? "Saving..." : "Save Appointment"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
