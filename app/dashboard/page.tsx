import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClock from "./DashboardClock";
import {
  DollarSign,
  CalendarDays,
  Users,
  TrendingUp,
  CalendarX,
  Receipt,
} from "lucide-react";

const SHADOW_HERO =
  "0 0 0 1px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(96,110,116,0.06)";
const SHADOW_CARD =
  "0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.03)";

type KpiDef = {
  label: string;
  value: string;
  icon: typeof DollarSign;
  trend: string | null;
  positive: boolean;
};

const STATUS_MAP: Record<string, { bg: string; color: string; border: string }> = {
  scheduled: { bg: "rgba(37,99,235,0.10)", color: "#2563eb", border: "rgba(37,99,235,0.2)" },
  completed: { bg: "rgba(22,163,74,0.10)", color: "#16a34a", border: "rgba(22,163,74,0.2)" },
  cancelled: { bg: "rgba(220,38,38,0.10)", color: "#dc2626", border: "rgba(220,38,38,0.2)" },
  no_show:   { bg: "rgba(217,119,6,0.10)", color: "#d97706", border: "rgba(217,119,6,0.2)" },
};

const ACTIVITY = [
  { dot: "#16a34a", text: "Quick sale completed — $45.00", time: "2m ago" },
  { dot: "#2563eb", text: "Appointment scheduled — 2:00 PM", time: "15m ago" },
  { dot: "#a855f7", text: "New client added — Sarah M.", time: "1h ago" },
  { dot: "#606E74", text: "Clarissa clocked in", time: "3h ago" },
  { dot: "#d97706", text: "Low product inventory", time: "Today" },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let appointments: {
    id: string; clientName: string | null; serviceName: string | null;
    status: string; startTime: Date;
    staff: { name: string } | null; client: { name: string } | null;
  }[] = [];
  let todayRevenue = 0;
  let transactionCount = 0;

  try {
    const now = new Date();
    const sod = new Date(now); sod.setHours(0, 0, 0, 0);
    const eod = new Date(now); eod.setHours(23, 59, 59, 999);

    appointments = await prisma.appointment.findMany({
      where: { startTime: { gte: sod, lte: eod } },
      include: { staff: true, client: true },
      orderBy: { startTime: "asc" },
      take: 5,
    });

    const txn = await prisma.transaction.aggregate({
      where: { createdAt: { gte: sod, lte: eod }, status: "completed" },
      _sum: { total: true }, _count: true,
    });
    todayRevenue = txn._sum.total ?? 0;
    transactionCount = txn._count;
  } catch (e) {
    console.error("Dashboard data error:", e);
  }

  const avgTicket = transactionCount > 0 ? todayRevenue / transactionCount : 0;
  const userName = session.user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const kpis: KpiDef[] = [
    { label: "TODAY'S REVENUE", value: `$${todayRevenue.toFixed(2)}`, icon: DollarSign, trend: todayRevenue > 0 ? "+12.5%" : null, positive: true },
    { label: "APPOINTMENTS", value: String(appointments.length), icon: CalendarDays, trend: appointments.length > 0 ? `${appointments.length} today` : null, positive: true },
    { label: "TRANSACTIONS", value: String(transactionCount), icon: Receipt, trend: transactionCount > 0 ? "+8.1%" : null, positive: true },
    { label: "AVG TICKET", value: `$${avgTicket.toFixed(2)}`, icon: TrendingUp, trend: avgTicket > 0 ? "vs yesterday" : null, positive: false },
  ];

  return (
    <div style={{ fontFamily: "var(--font-jakarta), sans-serif", minHeight: "100vh" }}>
      {/* ── Top bar ── */}
      <div style={{
        padding: "28px 32px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        borderBottom: "1px solid rgba(0,0,0,0.06)", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#0a0c0e", margin: 0, lineHeight: 1.2 }}>
            {greeting}, {userName}
          </h1>
          <DashboardClock />
        </div>
        <a href="/dashboard/appointments" className="btn btn-primary">New Appointment</a>
      </div>

      {/* ── KPI grid ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16, padding: "24px 32px",
      }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: "white", border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 14, padding: "22px 24px",
              boxShadow: SHADOW_HERO, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", bottom: -20, right: -20,
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(96,110,116,0.06)", pointerEvents: "none",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{
                  fontSize: 11, fontWeight: 600, color: "#9ca3af",
                  letterSpacing: "0.08em", margin: 0,
                }}>{kpi.label}</p>
                <Icon size={20} strokeWidth={1.5} style={{ color: "rgba(96,110,116,0.5)" }} />
              </div>
              <p style={{
                fontSize: 34, fontWeight: 700, fontFamily: "var(--font-fira), monospace",
                color: "#0a0c0e", margin: "10px 0 6px", letterSpacing: "-1px", lineHeight: 1.2,
              }}>{kpi.value}</p>
              {kpi.trend ? (
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                  background: kpi.positive ? "rgba(22,163,74,0.10)" : "rgba(0,0,0,0.04)",
                  color: kpi.positive ? "#16a34a" : "#9ca3af",
                }}>{kpi.trend}</span>
              ) : (
                <span style={{
                  display: "inline-flex", padding: "2px 8px", borderRadius: 999,
                  fontSize: 11, fontWeight: 600, background: "rgba(0,0,0,0.04)", color: "#9ca3af",
                }}>No data yet</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: "flex", gap: 10, padding: "0 32px 24px", flexWrap: "wrap" }}>
        <a href="/dashboard/appointments" className="btn btn-primary">New Appointment</a>
        <a href="/dashboard/pos" className="btn btn-ghost">Quick Sale</a>
        <a href="/dashboard/clients" className="btn btn-ghost">Add Client</a>
      </div>

      {/* ── Two columns ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr", gap: 20, padding: "0 32px 32px",
      }} className="lg:grid-cols-[3fr_2fr]">
        {/* Left — Appointments */}
        <div className="card">
          <div style={{
            padding: "20px 24px", display: "flex",
            justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0a0c0e", margin: 0 }}>
                Today&apos;s Appointments
              </h2>
              {appointments.length > 0 && (
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", background: "#606E74",
                  color: "white", fontSize: 11, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>{appointments.length}</span>
              )}
            </div>
            <a href="/dashboard/appointments" style={{
              fontSize: 13, color: "#606E74", textDecoration: "none", fontWeight: 600,
            }}>View all &rarr;</a>
          </div>
          <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

          {appointments.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <CalendarX size={36} strokeWidth={1.5} style={{ color: "rgba(0,0,0,0.15)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "#9ca3af", margin: "0 0 8px" }}>No appointments today</p>
              <a href="/dashboard/appointments" style={{ fontSize: 13, color: "#606E74", textDecoration: "none", fontWeight: 600 }}>
                New Appointment &rarr;
              </a>
            </div>
          ) : (
            <div style={{ padding: "4px 0" }}>
              {appointments.map((apt) => {
                const st = STATUS_MAP[apt.status] ?? STATUS_MAP.scheduled;
                const ini = (apt.clientName ?? apt.client?.name ?? "WI")
                  .split(" ").map((w) => w[0]).join("").slice(0, 2);
                return (
                  <div key={apt.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 24px", transition: "background 120ms",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "linear-gradient(135deg, #606E74, #4d5c62)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 600, color: "white", flexShrink: 0,
                      }}>{ini}</div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#0a0c0e", margin: 0 }}>
                          {apt.clientName ?? apt.client?.name ?? "Walk-in"}
                        </p>
                        <p style={{ fontSize: 12, color: "#9ca3af", margin: "1px 0 0" }}>
                          {apt.serviceName} &middot; {apt.staff?.name}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        fontSize: 12, fontFamily: "var(--font-fira), monospace", color: "#606E74",
                      }}>
                        {new Date(apt.startTime).toLocaleTimeString("en-US", {
                          hour: "numeric", minute: "2-digit", timeZone: "America/Chicago",
                        })}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
                        background: st.bg, color: st.color,
                        border: `1px solid ${st.border}`,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>{apt.status.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Mini stat */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", margin: 0 }}>THIS WEEK</p>
            <p style={{
              fontSize: 24, fontWeight: 700, fontFamily: "var(--font-fira), monospace",
              color: "#0a0c0e", margin: "6px 0 4px", letterSpacing: "-0.5px",
            }}>${todayRevenue.toFixed(2)}</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              in {transactionCount} transaction{transactionCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Activity feed */}
          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0a0c0e", margin: 0 }}>Recent Activity</h2>
            </div>
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />
            <div style={{ flex: 1, padding: "4px 0" }}>
              {ACTIVITY.map((item, i) => (
                <div key={i} style={{
                  height: 40, padding: "0 24px", display: "flex",
                  alignItems: "center", gap: 12, transition: "background 120ms",
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: item.dot, flexShrink: 0,
                  }} />
                  <span style={{
                    flex: 1, fontSize: 13, color: "#4a5568",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{item.text}</span>
                  <span style={{
                    fontSize: 11, fontFamily: "var(--font-fira), monospace",
                    color: "#9ca3af", flexShrink: 0,
                  }}>{item.time}</span>
                </div>
              ))}
            </div>
            <div style={{
              borderTop: "1px solid rgba(0,0,0,0.06)", padding: "14px 24px",
            }}>
              <a href="#" style={{ fontSize: 13, color: "#606E74", textDecoration: "none", fontWeight: 600 }}>
                View full audit log &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
