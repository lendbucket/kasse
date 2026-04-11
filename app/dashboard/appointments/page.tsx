"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Calendar, Check, Clock, Plus, X } from "lucide-react";

type View = "list" | "day" | "week";

type Staff = { id: string; name: string; locationId: string };
type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  locationId: string;
};

type Appointment = {
  id: string;
  clientName: string | null;
  serviceName: string | null;
  price: number | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  startTime: string;
  endTime: string;
  notes: string | null;
  staff: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
};

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const STATUS_STYLES: Record<Appointment["status"], string> = {
  scheduled: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  completed: "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]",
  cancelled: "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]",
  no_show: "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]",
};

const STATUS_LABEL: Record<Appointment["status"], string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

function todayChicago(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function AppointmentsPage() {
  const [date, setDate] = useState<string>(() => todayChicago());
  const [view, setView] = useState<View>("list");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const locationId = services[0]?.locationId ?? staff[0]?.locationId ?? "";

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date });
      if (locationId) params.set("locationId", locationId);
      const res = await fetch(`/api/appointments?${params}`);
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = (await res.json()) as { appointments: Appointment[] };
      setAppointments(data.appointments);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [date, locationId]);

  useEffect(() => {
    let cancelled = false;
    async function loadRefs() {
      try {
        const [svcRes, staffRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/staff"),
        ]);
        const svcData = svcRes.ok
          ? ((await svcRes.json()) as { services: Service[] })
          : { services: [] };
        const staffData = staffRes.ok
          ? ((await staffRes.json()) as { staff: Staff[] })
          : { staff: [] };
        if (cancelled) return;
        setServices(svcData.services);
        setStaff(staffData.staff);
      } catch {
        // ignore; list will still load
      }
    }
    loadRefs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function updateStatus(id: string, status: Appointment["status"]) {
    const prev = appointments;
    setAppointments((list) =>
      list.map((a) => (a.id === id ? { ...a, status } : a)),
    );
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setAppointments(prev);
    }
  }

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-[#1a2332] bg-[#0d1117] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#606e74]">
            Schedule
          </p>
          <h1 className="text-xl font-semibold text-white">Appointments</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-2">
            <Calendar size={16} className="text-[#606e74]" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-base text-white outline-none"
            />
          </div>

          <div className="flex overflow-hidden rounded-lg border border-[#1a2332]">
            {(["list", "day", "week"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-150 ${
                  view === v
                    ? "bg-[#606e74] text-white"
                    : "bg-[#0d1117] text-[#7a8f96] hover:bg-[#1a2332] hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#606e74] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96]"
          >
            <Plus size={16} />
            New Appointment
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        {view === "list" ? (
          <ListView
            loading={loading}
            error={error}
            appointments={appointments}
            onUpdateStatus={updateStatus}
          />
        ) : (
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-10 text-center">
            <Clock size={28} className="mx-auto text-[#606e74]" />
            <p className="mt-3 text-sm text-[#7a8f96]">
              {view === "day" ? "Day" : "Week"} view coming soon
            </p>
          </div>
        )}
      </main>

      {modalOpen && (
        <NewAppointmentModal
          date={date}
          services={services}
          staff={staff}
          locationId={locationId}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            loadAppointments();
          }}
        />
      )}
    </>
  );
}

function ListView({
  loading,
  error,
  appointments,
  onUpdateStatus,
}: {
  loading: boolean;
  error: string | null;
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: Appointment["status"]) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-10 text-center text-sm text-[#606e74]">
        Loading appointments...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/5 p-10 text-center text-sm text-[#ef4444]">
        {error}
      </div>
    );
  }
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-12 text-center">
        <Calendar size={28} className="mx-auto text-[#606e74]" />
        <p className="mt-3 text-sm text-[#7a8f96]">
          No appointments for this date
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1a2332] bg-[#0d1117]">
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-[#1a2332] text-left text-[10px] uppercase tracking-wider text-[#606e74]">
            <th className="px-5 py-3 font-medium">Time</th>
            <th className="px-5 py-3 font-medium">Client</th>
            <th className="px-5 py-3 font-medium">Service</th>
            <th className="px-5 py-3 font-medium">Stylist</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr
              key={a.id}
              className="border-b border-[#1a2332] last:border-b-0"
            >
              <td className="px-5 py-4 font-mono text-sm text-white">
                {TIME_FMT.format(new Date(a.startTime))}
              </td>
              <td className="px-5 py-4 text-sm text-white">
                {a.clientName || a.client?.name || "Walk-in"}
              </td>
              <td className="px-5 py-4 text-sm text-[#7a8f96]">
                {a.serviceName || "—"}
              </td>
              <td className="px-5 py-4 text-sm text-[#7a8f96]">
                {a.staff?.name || "—"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <ActionButtons appointment={a} onUpdate={onUpdateStatus} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-3 p-4 lg:hidden">
        {appointments.map((a) => (
          <li
            key={a.id}
            className="flex flex-col gap-3 rounded-lg border border-[#1a2332] bg-[#06080d] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-white">
                  {TIME_FMT.format(new Date(a.startTime))}
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  {a.clientName || a.client?.name || "Walk-in"}
                </p>
                <p className="text-xs text-[#7a8f96]">
                  {a.serviceName || "—"} · {a.staff?.name || "—"}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="flex gap-2">
              <ActionButtons appointment={a} onUpdate={onUpdateStatus} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function ActionButtons({
  appointment,
  onUpdate,
}: {
  appointment: Appointment;
  onUpdate: (id: string, status: Appointment["status"]) => void;
}) {
  if (appointment.status !== "scheduled") {
    return (
      <span className="text-xs text-[#606e74]">—</span>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => onUpdate(appointment.id, "completed")}
        className="flex items-center gap-1 rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-1.5 text-xs font-medium text-[#22c55e] transition-colors duration-150 hover:border-[#22c55e]"
      >
        <Check size={14} />
        Complete
      </button>
      <button
        type="button"
        onClick={() => onUpdate(appointment.id, "cancelled")}
        className="flex items-center gap-1 rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-1.5 text-xs font-medium text-[#ef4444] transition-colors duration-150 hover:border-[#ef4444]"
      >
        <X size={14} />
        Cancel
      </button>
    </>
  );
}

function NewAppointmentModal({
  date,
  services,
  staff,
  locationId,
  onClose,
  onCreated,
}: {
  date: string;
  services: Service[];
  staff: Staff[];
  locationId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [startDate, setStartDate] = useState(date);
  const [startTime, setStartTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => Boolean(locationId && staffId && startDate && startTime),
    [locationId, staffId, startDate, startTime],
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      const iso = new Date(`${startDate}T${startTime}`).toISOString();
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          staffId,
          serviceId: serviceId || undefined,
          clientName: clientName || undefined,
          startTime: iso,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Create failed");
      }
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex w-full flex-col overflow-hidden border-t border-[#1a2332] bg-[#0d1117] sm:max-w-md sm:rounded-2xl sm:border">
        <div className="flex items-center justify-between border-b border-[#1a2332] px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            New Appointment
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#606e74] transition-colors duration-150 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
        >
          <Field label="Client name">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Walk-in"
              className="input"
            />
          </Field>

          <Field label="Service">
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="input"
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · ${s.price.toFixed(2)} · {s.duration}m
                </option>
              ))}
            </select>
          </Field>

          <Field label="Stylist">
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a stylist</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </Field>
            <Field label="Start time">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input"
                required
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Optional"
            />
          </Field>

          {err && (
            <p className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/5 px-3 py-2 text-xs text-[#ef4444]">
              {err}
            </p>
          )}

          {!staffId && staff.length === 0 && (
            <p className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/5 px-3 py-2 text-xs text-[#f59e0b]">
              Add a staff member first
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#1a2332] bg-[#06080d] px-4 py-3 text-sm font-medium text-[#7a8f96] transition-colors duration-150 hover:border-[#606e74] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex-1 rounded-lg bg-[#606e74] px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #1a2332;
          background: #06080d;
          padding: 0.625rem 0.75rem;
          font-size: 16px;
          color: #ffffff;
          outline: none;
          transition: border-color 150ms;
        }
        .input:focus {
          border-color: #7a8f96;
        }
        .input::placeholder {
          color: #606e74;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[#606e74]">
        {label}
      </span>
      {children}
    </label>
  );
}
