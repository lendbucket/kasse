import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClock from "./DashboardClock";
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  CalendarX,
} from "lucide-react";

const SHADOW_HERO =
  "inset 0 1px 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(255,255,255,0.02), 0 0 0 1px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(96,110,116,0.08), 0 0 32px rgba(96,110,116,0.04)";
const SHADOW_CARD =
  "inset 0 1px 0 rgba(255,255,255,0.03), inset 1px 0 0 rgba(255,255,255,0.01), 0 0 0 1px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.1)";

type KpiDef = {
  label: string;
  value: string;
  icon: typeof DollarSign;
  trend: string | null;
  up: boolean;
};

const STATUS_MAP: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  scheduled: {
    bg: "rgba(59,130,246,0.12)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.2)",
  },
  completed: {
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "rgba(34,197,94,0.2)",
  },
  cancelled: {
    bg: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.2)",
  },
  no_show: {
    bg: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.2)",
  },
};

const ACTIVITY = [
  { dot: "#22c55e", text: "Quick sale completed — $45.00", time: "2 min ago" },
  {
    dot: "#3b82f6",
    text: "Appointment scheduled for 2:00 PM",
    time: "15 min ago",
  },
  { dot: "#a855f7", text: "New client added — Sarah M.", time: "1 hr ago" },
  { dot: "#7a8f96", text: "Clarissa clocked in", time: "3 hrs ago" },
  { dot: "#f59e0b", text: "Low product inventory alert", time: "Today" },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let appointments: {
    id: string;
    clientName: string | null;
    serviceName: string | null;
    status: string;
    startTime: Date;
    staff: { name: string } | null;
    client: { name: string } | null;
  }[] = [];
  let todayRevenue = 0;
  let transactionCount = 0;

  try {
    const now = new Date();
    const sod = new Date(now);
    sod.setHours(0, 0, 0, 0);
    const eod = new Date(now);
    eod.setHours(23, 59, 59, 999);

    appointments = await prisma.appointment.findMany({
      where: { startTime: { gte: sod, lte: eod } },
      include: { staff: true, client: true },
      orderBy: { startTime: "asc" },
      take: 5,
    });

    const txn = await prisma.transaction.aggregate({
      where: { createdAt: { gte: sod, lte: eod }, status: "completed" },
      _sum: { total: true },
      _count: true,
    });
    todayRevenue = txn._sum.total ?? 0;
    transactionCount = txn._count;
  } catch (e) {
    console.error("Dashboard data error:", e);
  }

  const avgTicket = transactionCount > 0 ? todayRevenue / transactionCount : 0;
  const userName = session.user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const kpis: KpiDef[] = [
    {
      label: "TODAY'S REVENUE",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: todayRevenue > 0 ? "+12.5%" : null,
      up: true,
    },
    {
      label: "APPOINTMENTS",
      value: String(appointments.length),
      icon: Calendar,
      trend: appointments.length > 0 ? `${appointments.length} today` : null,
      up: true,
    },
    {
      label: "CLIENTS SERVED",
      value: String(transactionCount),
      icon: Users,
      trend: transactionCount > 0 ? "+8.1%" : null,
      up: true,
    },
    {
      label: "AVG TICKET",
      value: `$${avgTicket.toFixed(2)}`,
      icon: TrendingUp,
      trend: avgTicket > 0 ? "vs yesterday" : null,
      up: false,
    },
  ];

  return (
    <div style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>
      {/* ── Top bar ── */}
      <div
        style={{
          padding: "24px 32px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#f0f4f8",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {greeting}, {userName}
          </h1>
          <DashboardClock />
        </div>
        <a href="/dashboard/appointments" className="btn btn-primary">
          New Appointment
        </a>
      </div>

      {/* ── KPI grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          margin: "24px 32px",
        }}
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14,
                padding: 24,
                boxShadow: SHADOW_HERO,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle corner glow */}
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  right: -40,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(96,110,116,0.04)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.45)",
                    letterSpacing: "0.06em",
                    margin: 0,
                  }}
                >
                  {kpi.label}
                </p>
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  style={{ color: "rgba(96,110,116,0.6)" }}
                />
              </div>
              <p
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  fontFamily: "var(--font-fira), monospace",
                  color: "#f0f4f8",
                  margin: "12px 0 8px",
                  letterSpacing: "-1px",
                  lineHeight: 1.2,
                }}
              >
                {kpi.value}
              </p>
              {kpi.trend && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: kpi.up
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(255,255,255,0.06)",
                    color: kpi.up ? "#22c55e" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {kpi.trend}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Quick actions ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          margin: "0 32px 24px",
          flexWrap: "wrap",
        }}
      >
        <a href="/dashboard/appointments" className="btn btn-primary">
          New Appointment
        </a>
        <a href="/dashboard/pos" className="btn btn-ghost">
          Quick Sale
        </a>
        <a href="/dashboard/clients" className="btn btn-ghost">
          Add Client
        </a>
      </div>

      {/* ── Two-column layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
          margin: "0 32px 32px",
        }}
        className="lg:grid-cols-[1.5fr_1fr]"
      >
        {/* Left — Appointments */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            boxShadow: SHADOW_CARD,
          }}
        >
          <div
            style={{
              padding: "20px 24px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              Today&apos;s Appointments
            </h2>
            <a
              href="/dashboard/appointments"
              style={{
                fontSize: 13,
                color: "#7a8f96",
                textDecoration: "none",
              }}
            >
              View all &rarr;
            </a>
          </div>

          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.05)",
              margin: "16px 0",
            }}
          />

          {appointments.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
              }}
            >
              <CalendarX
                size={32}
                strokeWidth={1.5}
                style={{
                  color: "rgba(255,255,255,0.1)",
                  margin: "0 auto 12px",
                }}
              />
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.3)",
                  margin: 0,
                }}
              >
                No appointments today
              </p>
              <a
                href="/dashboard/appointments"
                style={{
                  fontSize: 13,
                  color: "#7a8f96",
                  textDecoration: "none",
                  marginTop: 8,
                  display: "inline-block",
                }}
              >
                Schedule your first appointment &rarr;
              </a>
            </div>
          ) : (
            <div style={{ padding: "0 24px 20px" }}>
              {appointments.map((apt) => {
                const st = STATUS_MAP[apt.status] ?? STATUS_MAP.scheduled;
                const initials = (
                  apt.clientName ??
                  apt.client?.name ??
                  "WI"
                )
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2);
                return (
                  <div
                    key={apt.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: 9,
                      marginBottom: 2,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #606E74, #3d4f56)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#f0f4f8",
                            margin: 0,
                          }}
                        >
                          {apt.clientName ?? apt.client?.name ?? "Walk-in"}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.4)",
                            margin: "1px 0 0",
                          }}
                        >
                          {apt.serviceName} &middot; {apt.staff?.name}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-fira), monospace",
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        {new Date(apt.startTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Chicago",
                        })}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 5,
                          background: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {apt.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Activity feed */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            boxShadow: SHADOW_CARD,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "20px 24px 0" }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f4f8",
                margin: 0,
              }}
            >
              Recent Activity
            </h2>
          </div>
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.05)",
              margin: "16px 0",
            }}
          />
          <div style={{ flex: 1, padding: "0 0 4px" }}>
            {ACTIVITY.map((item, i) => (
              <div
                key={i}
                style={{
                  height: 40,
                  padding: "0 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: item.dot,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.text}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-fira), monospace",
                    color: "rgba(255,255,255,0.25)",
                    flexShrink: 0,
                  }}
                >
                  {item.time}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "16px 24px",
            }}
          >
            <a
              href="#"
              style={{
                fontSize: 13,
                color: "#7a8f96",
                textDecoration: "none",
              }}
            >
              View audit log &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
