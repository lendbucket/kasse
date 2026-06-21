"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";

type Appointment = {
  id: string; clientName: string | null; serviceName: string | null; price: number | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  startTime: string; endTime: string; notes: string | null;
  staff: { id: string; name: string } | null; client: { id: string; name: string } | null;
};

const ROW_HEIGHT = 48;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_SLOTS = (DAY_END_HOUR - DAY_START_HOUR) * 2;

const TIME_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });
const DAY_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric" });

const STATUS_STYLE: Record<Appointment["status"], { bg: string; color: string }> = {
  scheduled: { bg: "var(--info-soft)", color: "var(--accent)" },
  completed: { bg: "var(--success-soft)", color: "var(--success)" },
  cancelled: { bg: "var(--error-soft)", color: "var(--error)" },
  no_show: { bg: "var(--warning-soft)", color: "var(--warning)" },
};

function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const sun = new Date(d);
  sun.setDate(d.getDate() - day);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(sun);
    dd.setDate(sun.getDate() + i);
    dates.push(dd.toISOString().slice(0, 10));
  }
  return dates;
}

function timeSlotLabels(): string[] {
  const labels: string[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const hour = DAY_START_HOUR + Math.floor(i / 2);
    const min = (i % 2) * 30;
    const d = new Date(2000, 0, 1, hour, min);
    labels.push(TIME_FMT.format(d));
  }
  return labels;
}

function getMinutesFromDayStart(iso: string): number {
  const d = new Date(iso);
  const chicagoStr = d.toLocaleString("en-US", { timeZone: "America/Chicago", hour12: false, hour: "2-digit", minute: "2-digit" });
  const [h, m] = chicagoStr.split(":").map(Number);
  return (h - DAY_START_HOUR) * 60 + m;
}

export default function WeekGrid({
  date, locationId, onDayClick,
}: {
  date: string;
  locationId: string;
  onDayClick: (date: string) => void;
}) {
  const weekDates = useMemo(() => getWeekDates(date), [date]);
  const labels = useMemo(timeSlotLabels, []);
  const [appointmentsByDay, setAppointmentsByDay] = useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchWeek = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        weekDates.map(async (d) => {
          const p = new URLSearchParams({ date: d });
          if (locationId) p.set("locationId", locationId);
          const res = await fetch(`/api/appointments?${p}`, { signal });
          if (!res.ok) return { date: d, appointments: [] as Appointment[] };
          const data = (await res.json()) as { appointments: Appointment[] };
          return { date: d, appointments: data.appointments };
        })
      );
      const map: Record<string, Appointment[]> = {};
      for (const r of results) map[r.date] = r.appointments;
      setAppointmentsByDay(map);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  }, [weekDates, locationId]);

  useEffect(() => { const ac = new AbortController(); fetchWeek(ac.signal); return () => ac.abort(); }, [fetchWeek]);

  if (loading) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <Clock size={36} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading week...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: `64px repeat(7, minmax(120px, 1fr))`, minWidth: 64 + 7 * 120 }}>
          <div style={{ position: "sticky", left: 0, zIndex: 3, background: "var(--bg-card)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }} />
          {weekDates.map((d) => (
            <div
              key={d}
              onClick={() => onDayClick(d)}
              style={{
                padding: "10px 8px", fontSize: 12, fontWeight: 600,
                color: d === date ? "var(--brand)" : "var(--text-secondary)",
                borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)",
                textAlign: "center", cursor: "pointer", whiteSpace: "nowrap",
                background: d === date ? "var(--brand-soft)" : "var(--bg-card)",
              }}
              title={`View day: ${d}`}
            >
              {DAY_FMT.format(new Date(d + "T12:00:00"))}
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div style={{ display: "grid", gridTemplateColumns: `64px repeat(7, minmax(120px, 1fr))`, minWidth: 64 + 7 * 120 }}>
          {/* Time gutter */}
          <div style={{ position: "sticky", left: 0, zIndex: 2, background: "var(--bg-card)", borderRight: "1px solid var(--border)" }}>
            {labels.map((label, i) => (
              <div key={i} style={{
                height: ROW_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-fira, monospace)",
                borderBottom: "1px solid var(--border)",
              }}>{label}</div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((d) => (
            <div key={d} style={{ position: "relative", borderRight: "1px solid var(--border)" }}>
              {/* Slot backgrounds */}
              {labels.map((_, i) => (
                <div key={i} style={{ height: ROW_HEIGHT, borderBottom: "1px solid var(--border)" }} />
              ))}

              {/* Appointment blocks */}
              {(appointmentsByDay[d] || []).map((a) => {
                const startMin = getMinutesFromDayStart(a.startTime);
                const endMin = getMinutesFromDayStart(a.endTime);
                const duration = endMin - startMin;
                if (startMin < 0 || duration <= 0) return null;
                const top = (startMin / 30) * ROW_HEIGHT;
                const height = (duration / 30) * ROW_HEIGHT;
                const st = STATUS_STYLE[a.status];
                return (
                  <div
                    key={a.id}
                    style={{
                      position: "absolute", top, left: 2, right: 2, height: Math.max(height - 2, 20),
                      background: st.bg, borderLeft: `3px solid ${st.color}`, borderRadius: "var(--radius-sm)",
                      padding: "2px 4px", overflow: "hidden", zIndex: 1,
                      fontSize: 10, lineHeight: "13px", color: st.color,
                    }}
                    title={`${a.clientName || a.client?.name || "Walk-in"} — ${a.serviceName || "Appointment"} (${a.staff?.name || ""})`}
                  >
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {TIME_FMT.format(new Date(a.startTime))}
                    </div>
                    {height > 28 && (
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.85 }}>
                        {a.clientName || a.client?.name || "Walk-in"}
                      </div>
                    )}
                    {height > 42 && (
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.7 }}>
                        {a.staff?.name || ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
