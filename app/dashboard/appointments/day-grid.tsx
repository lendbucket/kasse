"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";

type Staff = { id: string; name: string; locationId: string };
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
const HEADER_HEIGHT = 37; // approx header row height

const TIME_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });

const STATUS_STYLE: Record<Appointment["status"], { bg: string; color: string }> = {
  scheduled: { bg: "var(--info-soft)", color: "var(--accent)" },
  completed: { bg: "var(--success-soft)", color: "var(--success)" },
  cancelled: { bg: "var(--error-soft)", color: "var(--error)" },
  no_show: { bg: "var(--warning-soft)", color: "var(--warning)" },
};

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

export default function DayGrid({
  appointments, staff, date, onSlotClick,
}: {
  appointments: Appointment[];
  staff: Staff[];
  date: string;
  onSlotClick: (staffId: string, time: string) => void;
}) {
  const labels = useMemo(timeSlotLabels, []);

  const appointmentsByStaff = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const s of staff) map[s.id] = [];
    for (const a of appointments) {
      if (a.staff?.id && map[a.staff.id]) {
        map[a.staff.id].push(a);
      }
    }
    return map;
  }, [appointments, staff]);

  function handleSlotClick(staffId: string, slotIndex: number) {
    const hour = DAY_START_HOUR + Math.floor(slotIndex / 2);
    const min = (slotIndex % 2) * 30;
    const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    onSlotClick(staffId, time);
  }

  if (staff.length === 0) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <Clock size={36} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>No stylists available</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: `64px repeat(${staff.length}, minmax(140px, 1fr))`, minWidth: 64 + staff.length * 140 }}>
          {/* Header row */}
          <div style={{ position: "sticky", left: 0, zIndex: 3, background: "var(--bg-card)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", height: HEADER_HEIGHT }} />
          {staff.map((s) => (
            <div key={s.id} style={{
              padding: "10px 12px", fontSize: 13, fontWeight: 600,
              color: "var(--text-secondary)", borderBottom: "1px solid var(--border)",
              borderRight: "1px solid var(--border)", textAlign: "center",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{s.name}</div>
          ))}
        </div>

        {/* Grid body: time gutter + stylist columns with relative positioning for blocks */}
        <div style={{ display: "grid", gridTemplateColumns: `64px repeat(${staff.length}, minmax(140px, 1fr))`, minWidth: 64 + staff.length * 140 }}>
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

          {/* Stylist columns */}
          {staff.map((s) => (
            <div key={s.id} style={{ position: "relative", borderRight: "1px solid var(--border)" }}>
              {/* Slot backgrounds (clickable) */}
              {labels.map((label, i) => (
                <div
                  key={i}
                  onClick={() => handleSlotClick(s.id, i)}
                  style={{
                    height: ROW_HEIGHT, borderBottom: "1px solid var(--border)",
                    cursor: "pointer", transition: "background 100ms",
                  }}
                  title={`Book ${s.name} at ${label}`}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--brand-soft)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                />
              ))}

              {/* Appointment blocks */}
              {(appointmentsByStaff[s.id] || []).map((a) => {
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
                      padding: "2px 6px", overflow: "hidden", zIndex: 1,
                      fontSize: 11, lineHeight: "14px", color: st.color,
                    }}
                    title={`${a.clientName || a.client?.name || "Walk-in"} — ${a.serviceName || "Appointment"}`}
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
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.7, fontSize: 10 }}>
                        {a.serviceName || ""}
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
