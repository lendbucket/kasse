import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClock from "./DashboardClock";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Safe data fetching with fallbacks
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
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    appointments = await prisma.appointment.findMany({
      where: {
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: { staff: true, client: true },
      orderBy: { startTime: "asc" },
      take: 5,
    });

    const transactions = await prisma.transaction.aggregate({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: "completed",
      },
      _sum: { total: true },
      _count: true,
    });

    todayRevenue = transactions._sum.total ?? 0;
    transactionCount = transactions._count;
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
  }

  const avgTicket =
    transactionCount > 0 ? todayRevenue / transactionCount : 0;
  const userName = session.user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1200,
        fontFamily: "var(--font-jakarta), sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.31px",
          }}
        >
          {greeting}, {userName}
        </h1>
        <DashboardClock />
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}` },
          { label: "Appointments", value: String(appointments.length) },
          { label: "Transactions", value: String(transactionCount) },
          { label: "Avg Ticket", value: `$${avgTicket.toFixed(2)}` },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "#0d1117",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: 24,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.02), 0 4px 8px rgba(0,0,0,0.2)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "#606E74",
                margin: "0 0 8px 0",
                letterSpacing: "-0.31px",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "#ffffff",
                margin: 0,
                fontFamily: "var(--font-fira), monospace",
                letterSpacing: "-0.5px",
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <a
          href="/dashboard/appointments"
          style={{
            background: "#606E74",
            color: "#ffffff",
            padding: "0 20px",
            height: 44,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.31px",
          }}
        >
          New Appointment
        </a>
        <a
          href="/dashboard/pos"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "#ffffff",
            padding: "0 20px",
            height: 44,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.08)",
            letterSpacing: "-0.31px",
          }}
        >
          Quick Sale
        </a>
        <a
          href="/dashboard/clients"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "#ffffff",
            padding: "0 20px",
            height: 44,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.08)",
            letterSpacing: "-0.31px",
          }}
        >
          Add Client
        </a>
      </div>

      {/* Recent Appointments */}
      <div
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          padding: 24,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.02), 0 4px 8px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-0.31px",
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

        {appointments.length === 0 ? (
          <p
            style={{
              color: "#606E74",
              fontSize: 14,
              textAlign: "center",
              padding: "32px 0",
              margin: 0,
            }}
          >
            No appointments today
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {appointments.map((apt) => (
              <div
                key={apt.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#ffffff",
                      letterSpacing: "-0.31px",
                    }}
                  >
                    {apt.clientName ?? apt.client?.name ?? "Walk-in"}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 12,
                      color: "#606E74",
                      letterSpacing: "-0.31px",
                    }}
                  >
                    {apt.serviceName} &middot; {apt.staff?.name}
                  </p>
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
                      color: "#7a8f96",
                      fontFamily: "var(--font-fira), monospace",
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
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background:
                        apt.status === "completed"
                          ? "rgba(34,197,94,0.15)"
                          : apt.status === "cancelled"
                            ? "rgba(239,68,68,0.15)"
                            : apt.status === "no_show"
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(96,110,116,0.15)",
                      color:
                        apt.status === "completed"
                          ? "#22c55e"
                          : apt.status === "cancelled"
                            ? "#ef4444"
                            : apt.status === "no_show"
                              ? "#f59e0b"
                              : "#7a8f96",
                    }}
                  >
                    {apt.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
