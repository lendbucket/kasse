"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Star, Check, MapPin } from "lucide-react";

type Staff = { id: string; name: string; locationId: string; color?: string | null };
type Appointment = {
  id: string;
  clientName: string | null;
  serviceName: string | null;
  price?: number | null;
  estimatedTotalCents?: number | null;
  isWalkIn?: boolean;
  isFirstVisit?: boolean;
  depositPaid?: number | null;
  status: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  staff: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
};

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const SLOT_MIN = 30;
const ROW_HEIGHT = 56;
const PX_PER_MIN = ROW_HEIGHT / SLOT_MIN;
const TOTAL_MIN = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const TOTAL_SLOTS = TOTAL_MIN / SLOT_MIN;
const HEADER_HEIGHT = 52;

const TIME_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "2-digit", hour12: true });
const HOUR_FMT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hour12: true });

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  scheduled:   { bg: "var(--info-soft)",    color: "var(--accent)",  label: "Scheduled" },
  confirmed:   { bg: "var(--info-soft)",    color: "var(--accent)",  label: "Confirmed" },
  checked_in:  { bg: "var(--brand-soft)",   color: "var(--brand)",   label: "Checked in" },
  in_progress: { bg: "var(--brand-soft)",   color: "var(--brand)",   label: "In progress" },
  completed:   { bg: "var(--success-soft)", color: "var(--success)", label: "Completed" },
  cancelled:   { bg: "var(--error-soft)",   color: "var(--error)",   label: "Cancelled" },
  no_show:     { bg: "var(--warning-soft)", color: "var(--warning)", label: "No show" },
};
const DEFAULT_STATUS = STATUS_STYLE.scheduled;
const STAFF_PALETTE = ["#2F5061", "#4297A0", "#E57F84", "#8E7DBE", "#C58940", "#5A8F7B", "#B05F6D", "#3D7EA6"];

function todayChicago() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function chicagoNowMinutes(): number {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(p.find((x) => x.type === "hour")?.value ?? "0");
  const m = Number(p.find((x) => x.type === "minute")?.value ?? "0");
  return (h - DAY_START_HOUR) * 60 + m;
}
function minutesFromDayStart(iso: string): number {
  const s = new Date(iso).toLocaleString("en-US", { timeZone: "America/Chicago", hour12: false, hour: "2-digit", minute: "2-digit" });
  const [h, m] = s.split(":").map(Number);
  return (h - DAY_START_HOUR) * 60 + m;
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
function colorForStaff(s: Staff): string {
  if (s.color) return s.color;
  let h = 0;
  for (let i = 0; i < s.id.length; i++) h = (h * 31 + s.id.charCodeAt(i)) >>> 0;
  return STAFF_PALETTE[h % STAFF_PALETTE.length];
}
function money(a: Appointment): string | null {
  const cents = a.estimatedTotalCents != null ? a.estimatedTotalCents : a.price != null ? Math.round(a.price * 100) : null;
  if (cents == null) return null;
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

type Packed = Appointment & { _startMin: number; _endMin: number; _lane: number; _lanes: number };

function packLanes(appts: Appointment[]): Packed[] {
  const items = appts
    .map((a) => ({ ...a, _startMin: minutesFromDayStart(a.startTime), _endMin: minutesFromDayStart(a.endTime), _lane: 0, _lanes: 1 }))
    .filter((a) => a._endMin > a._startMin)
    .sort((a, b) => a._startMin - b._startMin || a._endMin - b._endMin);
  const out: Packed[] = [];
  let cluster: typeof items = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    if (!cluster.length) return;
    const laneEnds: number[] = [];
    for (const it of cluster) {
      let placed = false;
      for (let l = 0; l < laneEnds.length; l++) {
        if (it._startMin >= laneEnds[l]) { it._lane = l; laneEnds[l] = it._endMin; placed = true; break; }
      }
      if (!placed) { it._lane = laneEnds.length; laneEnds.push(it._endMin); }
    }
    for (const it of cluster) { it._lanes = laneEnds.length; out.push(it); }
    cluster = []; clusterEnd = -Infinity;
  };
  for (const it of items) {
    if (cluster.length && it._startMin >= clusterEnd) flush();
    cluster.push(it); clusterEnd = Math.max(clusterEnd, it._endMin);
  }
  flush();
  return out;
}

export default function DayGrid({
  appointments, staff, date, onSlotClick,
}: {
  appointments: Appointment[];
  staff: Staff[];
  date: string;
  onSlotClick: (staffId: string, time: string) => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 60_000); return () => clearInterval(id); }, []);

  const isToday = date === todayChicago();
  const nowMin = chicagoNowMinutes();
  const showNow = isToday && nowMin >= 0 && nowMin <= TOTAL_MIN;

  const byStaff = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const s of staff) map[s.id] = [];
    for (const a of appointments) if (a.staff?.id && map[a.staff.id]) map[a.staff.id].push(a);
    return map;
  }, [appointments, staff]);

  const slots = useMemo(() => Array.from({ length: TOTAL_SLOTS }, (_, i) => i), []);

  function handleSlot(staffId: string, i: number) {
    const hour = DAY_START_HOUR + Math.floor(i / 2);
    const min = (i % 2) * 30;
    onSlotClick(staffId, `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }

  if (staff.length === 0) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <Clock size={36} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>No stylists available</p>
      </div>
    );
  }

  const gridCols = `72px repeat(${staff.length}, minmax(168px, 1fr))`;
  const minWidth = 72 + staff.length * 168;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", boxShadow: "0 1px 2px rgba(2,6,23,0.04), 0 4px 16px rgba(2,6,23,0.04)" }}>
      <div style={{ overflowX: "auto", position: "relative" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, minWidth, position: "sticky", top: 0, zIndex: 4, background: "var(--bg-card)" }}>
          <div style={{ height: HEADER_HEIGHT, borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 5 }} />
          {staff.map((s) => {
            const c = colorForStaff(s);
            const count = (byStaff[s.id] || []).filter((a) => a.status !== "cancelled").length;
            return (
              <div key={s.id} style={{ height: HEADER_HEIGHT, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: c, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials(s.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{count} {count === 1 ? "appt" : "appts"}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, minWidth, position: "relative" }}>
          {/* Time gutter */}
          <div style={{ position: "sticky", left: 0, zIndex: 3, background: "var(--bg-card)", borderRight: "1px solid var(--border)" }}>
            {slots.map((i) => {
              const onHour = i % 2 === 0;
              const hour = DAY_START_HOUR + Math.floor(i / 2);
              return (
                <div key={i} style={{ height: ROW_HEIGHT, position: "relative", borderBottom: onHour ? "1px solid rgba(2,6,23,0.05)" : "1px solid var(--border)" }}>
                  {onHour && (
                    <span style={{ position: "absolute", top: -8, right: 10, fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-fira, monospace)", background: "var(--bg-card)", padding: "0 2px" }}>
                      {HOUR_FMT.format(new Date(2000, 0, 1, hour, 0))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stylist columns */}
          {staff.map((s) => {
            const c = colorForStaff(s);
            const packed = packLanes(byStaff[s.id] || []);
            return (
              <div key={s.id} style={{ position: "relative", borderRight: "1px solid var(--border)" }}>
                {slots.map((i) => {
                  const onHour = i % 2 === 0;
                  const past = isToday && (i + 1) * SLOT_MIN <= nowMin;
                  return (
                    <div
                      key={i}
                      onClick={() => handleSlot(s.id, i)}
                      title={`Book ${s.name}`}
                      style={{ height: ROW_HEIGHT, borderBottom: onHour ? "1px solid rgba(2,6,23,0.05)" : "1px solid var(--border)", cursor: "pointer", background: past ? "rgba(2,6,23,0.015)" : "transparent", transition: "background 100ms" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--brand-soft)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = past ? "rgba(2,6,23,0.015)" : "transparent"; }}
                    />
                  );
                })}

                {packed.map((a) => {
                  if (a._startMin < 0 || a._startMin > TOTAL_MIN) return null;
                  const top = a._startMin * PX_PER_MIN;
                  const height = Math.max((a._endMin - a._startMin) * PX_PER_MIN - 3, 22);
                  const st = STATUS_STYLE[a.status] ?? DEFAULT_STATUS;
                  const leftPct = (a._lane / a._lanes) * 100;
                  const widthPct = 100 / a._lanes;
                  const dim = a.status === "cancelled" || a.status === "no_show";
                  const name = a.clientName || a.client?.name || (a.isWalkIn ? "Walk-in" : "Appointment");
                  const amt = money(a);
                  return (
                    <div key={a.id}
                      style={{
                        position: "absolute", top, height, left: `calc(${leftPct}% + 3px)`, width: `calc(${widthPct}% - 6px)`,
                        background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `3px solid ${st.color}`,
                        borderRadius: 8, padding: "5px 8px", overflow: "hidden", zIndex: 1, cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(2,6,23,0.06)", opacity: dim ? 0.6 : 1,
                        display: "flex", flexDirection: "column", gap: 1,
                      }}
                      title={`${name} — ${a.serviceName || "Appointment"} · ${TIME_FMT.format(new Date(a.startTime))}–${TIME_FMT.format(new Date(a.endTime))}${amt ? ` · ${amt}` : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-fira, monospace)", whiteSpace: "nowrap" }}>{TIME_FMT.format(new Date(a.startTime))}</span>
                        {a.status !== "scheduled" && height > 30 && (
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: st.color, background: st.bg, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap" }}>{st.label}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                        {a.isFirstVisit && <Star size={11} strokeWidth={2} style={{ color: "var(--blush)", fill: "var(--blush)", flexShrink: 0 }} />}
                        {a.isWalkIn && <MapPin size={11} strokeWidth={2} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                      </div>
                      {height > 44 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.serviceName || "—"}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            {!!(a.depositPaid && a.depositPaid > 0) && <Check size={11} strokeWidth={2.5} style={{ color: "var(--success)" }} />}
                            {amt && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-fira, monospace)" }}>{amt}</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* dim a faint stylist tint at the column top edge for identity */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c, opacity: 0.5 }} />
              </div>
            );
          })}

          {/* Now line (spans full width over columns) */}
          {showNow && (
            <div style={{ position: "absolute", top: nowMin * PX_PER_MIN, left: 72, right: 0, height: 0, zIndex: 2, pointerEvents: "none", borderTop: "2px solid var(--error)" }}>
              <div style={{ position: "absolute", left: -6, top: -5, width: 10, height: 10, borderRadius: "50%", background: "var(--error)" }} />
              <div style={{ position: "absolute", left: -66, top: -8, fontSize: 10, fontWeight: 700, color: "var(--error)", fontFamily: "var(--font-fira, monospace)" }}>
                {TIME_FMT.format(new Date())}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
