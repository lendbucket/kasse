import { DashboardClock } from "./DashboardClock";
import {
  DollarSign,
  Calendar,
  Users,
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  ShoppingCart,
  UserPlus,
  MapPin,
} from "lucide-react";
import Link from "next/link";

type KPI = {
  label: string;
  value: string;
  icon: typeof DollarSign;
  trend: string;
  trendUp: boolean;
};

const KPIS: KPI[] = [
  {
    label: "Today's Revenue",
    value: "$1,284.00",
    icon: DollarSign,
    trend: "+12.5%",
    trendUp: true,
  },
  {
    label: "Appointments",
    value: "18",
    icon: Calendar,
    trend: "+3.2%",
    trendUp: true,
  },
  {
    label: "Clients Served",
    value: "14",
    icon: Users,
    trend: "+8.1%",
    trendUp: true,
  },
  {
    label: "Avg Ticket",
    value: "$91.71",
    icon: Receipt,
    trend: "-1.1%",
    trendUp: false,
  },
];

type Appointment = {
  client: string;
  service: string;
  stylist: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
};

const RECENT_APPOINTMENTS: Appointment[] = [
  {
    client: "Maria Gonzalez",
    service: "Balayage + Trim",
    stylist: "Sofia R.",
    time: "9:00 AM",
    status: "completed",
  },
  {
    client: "James Chen",
    service: "Men's Cut",
    stylist: "Robert R.",
    time: "10:30 AM",
    status: "completed",
  },
  {
    client: "Ashley Brooks",
    service: "Full Color",
    stylist: "Sofia R.",
    time: "11:00 AM",
    status: "scheduled",
  },
  {
    client: "David Kim",
    service: "Beard Trim",
    stylist: "Robert R.",
    time: "1:00 PM",
    status: "scheduled",
  },
  {
    client: "Taylor Swift",
    service: "Blowout",
    stylist: "Sofia R.",
    time: "2:30 PM",
    status: "cancelled",
  },
];

const STATUS_STYLES: Record<
  Appointment["status"],
  { label: string; bg: string; text: string }
> = {
  scheduled: {
    label: "Scheduled",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-[var(--success)]/10",
    text: "text-[var(--success)]",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-[var(--error)]/10",
    text: "text-[var(--error)]",
  },
  no_show: {
    label: "No Show",
    bg: "bg-[var(--warning)]/10",
    text: "text-[var(--warning)]",
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  return (
    <>
      {/* Top Bar */}
      <header className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-[20px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {getGreeting()}, Robert
          </h1>
          <DashboardClock />
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px]"
            style={{
              background: "var(--overlay-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <MapPin
              size={12}
              strokeWidth={1.5}
              style={{ color: "var(--text-muted)" }}
            />
            Main Location
          </span>
        </div>
      </header>

      <main className="flex-1 px-4 pb-6 sm:px-6">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-xl p-5 transition-all duration-150"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-[13px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {kpi.label}
                  </p>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: "var(--overlay-subtle)" }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                </div>
                <p
                  className="mt-3 font-mono text-[32px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {kpi.value}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  {kpi.trendUp ? (
                    <TrendingUp
                      size={12}
                      style={{ color: "var(--success)" }}
                    />
                  ) : (
                    <TrendingDown
                      size={12}
                      style={{ color: "var(--error)" }}
                    />
                  )}
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                    style={{
                      background: kpi.trendUp
                        ? "color-mix(in srgb, var(--success) 10%, transparent)"
                        : "color-mix(in srgb, var(--error) 10%, transparent)",
                      color: kpi.trendUp
                        ? "var(--success)"
                        : "var(--error)",
                    }}
                  >
                    {kpi.trend}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    vs last week
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick Actions */}
        <section className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/appointments"
            className="flex h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-[var(--accent)] px-5 text-[14px] font-semibold text-white transition-all duration-150 hover:scale-[1.01] active:scale-[0.995]"
            style={{ boxShadow: "var(--shadow-card)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--accent-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--accent)")
            }
          >
            <Plus size={16} strokeWidth={1.5} />
            New Appointment
          </Link>
          <Link
            href="/dashboard/pos"
            className="flex h-[44px] cursor-pointer items-center gap-2 rounded-xl px-5 text-[14px] font-semibold transition-all duration-150"
            style={{
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--overlay-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <ShoppingCart size={16} strokeWidth={1.5} />
            Quick Sale
          </Link>
          <Link
            href="/dashboard/clients"
            className="flex h-[44px] cursor-pointer items-center gap-2 rounded-xl px-5 text-[14px] font-semibold transition-all duration-150"
            style={{
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--overlay-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <UserPlus size={16} strokeWidth={1.5} />
            Add Client
          </Link>
        </section>

        {/* Recent Activity */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="text-[16px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Activity
            </h2>
          </div>
          <div
            className="overflow-hidden rounded-xl"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="divide-y"
              style={
                {
                  "--tw-divide-color": "var(--overlay-divider)",
                } as React.CSSProperties
              }
            >
              {RECENT_APPOINTMENTS.map((apt, i) => {
                const status = STATUS_STYLES[apt.status];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--overlay-subtle)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {/* Client avatar */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                      style={{
                        background: "var(--overlay-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {apt.client
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-[14px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {apt.client}
                        </p>
                        <p
                          className="truncate text-[13px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {apt.service}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-3 sm:mt-0">
                        <span
                          className="text-[13px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {apt.stylist}
                        </span>
                        <span
                          className="font-mono text-[13px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {apt.time}
                        </span>
                      </div>
                    </div>
                    {/* Status */}
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* View All */}
            <div
              className="px-5 py-3"
              style={{ borderTop: "1px solid var(--overlay-divider)" }}
            >
              <Link
                href="/dashboard/appointments"
                className="cursor-pointer text-[13px] font-medium transition-colors duration-150"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-secondary)")
                }
              >
                View all appointments &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
