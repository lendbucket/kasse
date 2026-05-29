import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLandingForRole } from "@/lib/permissions/role-landing";
import { getActiveOnboardingSessionForOwner } from "@/lib/onboarding/sessions";
import { Role } from "@prisma/client";
import Link from "next/link";
import DashboardClock from "./DashboardClock";
import {
  TrendingDown,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // P0.A.8: redirect users whose role has a more specific landing page
  const userRole = session.user.role as Role;
  const fullDashboardRoles: Role[] = [
    Role.OWNER,
    Role.FRANCHISE_OWNER,
    Role.MANAGER,
    Role.BUSINESS_PARTNER,
  ];
  if (!fullDashboardRoles.includes(userRole)) {
    redirect(getLandingForRole(userRole));
  }

  // Option C routing: owners who haven't completed onboarding AND have an
  // active onboarding session get sent into the wizard. BOTH conditions
  // required — legacy orgs (no session) must fall through to the dashboard
  // to avoid an infinite wizard<->dashboard redirect loop. onboardingCompleted
  // is the authoritative done-flag (set true by the wizard's final step).
  if (userRole === Role.OWNER && session.user.organizationId) {
    let shouldRedirectToWizard = false;
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { onboardingCompleted: true },
      });
      if (org && org.onboardingCompleted === false) {
        const activeSession = await getActiveOnboardingSessionForOwner({
          userId: session.user.id,
          organizationId: session.user.organizationId,
        });
        if (activeSession) shouldRedirectToWizard = true;
      }
    } catch (e) {
      // Fail-soft: never block dashboard access on an onboarding-routing
      // lookup error. Worst case the user sees the dashboard with the
      // existing "Finish onboarding" tile instead of being auto-routed.
      console.error("onboarding routing check failed:", e);
    }
    if (shouldRedirectToWizard) {
      redirect("/onboarding/wizard");
    }
  }

  let todayRevenue = 0;
  let transactionCount = 0;
  let appointmentCount = 0;

  try {
    const now = new Date();
    const sod = new Date(now); sod.setHours(0, 0, 0, 0);
    const eod = new Date(now); eod.setHours(23, 59, 59, 999);
    const txn = await prisma.transaction.aggregate({
      where: { createdAt: { gte: sod, lte: eod }, status: "completed" },
      _sum: { total: true }, _count: true,
    });
    todayRevenue = txn._sum.total ?? 0;
    transactionCount = txn._count;
    appointmentCount = await prisma.appointment.count({
      where: { startTime: { gte: sod, lte: eod } },
    });
  } catch (e) { console.error("Dashboard data error:", e); }

  // Onboarding session check — surface the completion tile for owners.
  // Uses the sessions.ts helper which wraps the prismaAdmin read with
  // explicit documentation about the SUPERADMIN_PROTECTED bypass.
  let onboardingSession: { id: string; state: string } | null = null;
  if (session.user.organizationId && userRole === Role.OWNER) {
    try {
      onboardingSession = await getActiveOnboardingSessionForOwner({
        userId: session.user.id,
        organizationId: session.user.organizationId,
      });
    } catch {
      // fail-soft — dashboard loads without the tile if helper fails
    }
  }

  const avgTicket = transactionCount > 0 ? todayRevenue / transactionCount : 0;

  const hours = ["10am", "11", "12", "1pm", "2", "3", "4", "5", "6", "7pm"];
  const todayBars = [10, 20, 35, 70, 30, 25, 15, 45, 80, 40];
  const yesterdayBars = [15, 10, 25, 40, 50, 80, 60, 30, 15, 20];

  const stats = [
    { label: "Gross sales", value: `$${todayRevenue.toFixed(2)}` },
    { label: "Transactions", value: String(transactionCount) },
    { label: "Average sale", value: `$${avgTicket.toFixed(2)}` },
    { label: "Appointments", value: String(appointmentCount) },
    { label: "Tips", value: "$0.00" },
    { label: "Comps & discounts", value: "$0.00" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Main content */}
      <div style={{ flex: 1, padding: "32px", maxWidth: "100%" }} className="lg:mr-[280px]">
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Home</h1>
            <span style={{ color: "#606E74", fontSize: 22, fontWeight: 700 }}>:</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#606E74", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 4 }}>
              All locations <ChevronDown size={18} strokeWidth={1.5} />
            </span>
          </div>
          <DashboardClock />
        </div>

        {/* AI bar */}
        <div style={{
          background: "white", border: "1px solid #e5e7eb", borderRadius: 8,
          padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer",
        }}>
          <span style={{ fontSize: 14, color: "#374151" }}>Ask Kasse AI anything about your business...</span>
          <Sparkles size={18} strokeWidth={1.5} style={{ color: "#606E74", flexShrink: 0 }} />
        </div>

        {/* Onboarding status tile — shown when owner has in-progress session */}
        {onboardingSession && onboardingSession.state === 'COMPENSATION_CONFIGURED' && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>
                Finish onboarding
              </h3>
              <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
                Review employment agreement signing progress and complete setup.
              </p>
            </div>
            <Link
              href={`/dashboard/admin/agreements/${onboardingSession.id}`}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
                background: '#92400e',
                borderRadius: 8,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Review agreements
            </Link>
          </div>
        )}

        {/* Performance card */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Performance</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 12px", border: "1px solid #e5e7eb", borderRadius: 999, background: "white", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>Date</span> <span style={{ fontWeight: 600 }}>Today</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, height: 30, padding: "0 12px", border: "1px solid #e5e7eb", borderRadius: 999, background: "white", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>vs</span> <span style={{ fontWeight: 600 }}>Prior day</span>
              </span>
            </div>
          </div>

          {/* Net sales */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Net sales</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: "#111827", fontFamily: "var(--font-fira), 'Fira Code', monospace", letterSpacing: "-1px" }}>
                ${todayRevenue.toFixed(2)}
              </span>
              <span className="trend-neutral">N/A</span>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 16, paddingBottom: 20, position: "relative", borderBottom: "1px solid #f3f4f6" }}>
            {hours.map((hour, i) => (
              <div key={hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", gap: 1 }}>
                  <div style={{ flex: 1, background: todayBars[i] > 50 ? "#606E74" : "rgba(96,110,116,0.20)", borderRadius: "2px 2px 0 0", height: `${todayBars[i]}%`, minHeight: 2 }} />
                  <div style={{ flex: 1, background: "#e5e7eb", borderRadius: "2px 2px 0 0", height: `${yesterdayBars[i]}%`, minHeight: 2 }} />
                </div>
                <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{hour}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, background: "#606E74", borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: "#6b7280" }}>Today</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, background: "#e5e7eb", borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Yesterday</span>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid #f3f4f6" }}>
            {stats.map((stat, i) => (
              <div key={stat.label} style={{
                padding: "18px 0",
                borderRight: i % 3 !== 2 ? "1px solid #f3f4f6" : "none",
                borderBottom: i < 3 ? "1px solid #f3f4f6" : "none",
                paddingLeft: i % 3 === 0 ? 0 : 20,
                paddingRight: i % 3 === 2 ? 0 : 20,
              }}>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{stat.label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#111827", fontFamily: "var(--font-fira), 'Fira Code', monospace", letterSpacing: "-0.5px" }}>{stat.value}</span>
                  <span className="trend-neutral">N/A</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locations table */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: 0 }}>Locations</h3>
            <div style={{ position: "relative" }}>
              <Search size={14} strokeWidth={1.5} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input placeholder="Search" style={{ height: 32, paddingLeft: 32, paddingRight: 12, border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, color: "#374151", background: "#f9fafb", width: 180, outline: "none" }} />
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name <ChevronsUpDown size={12} style={{ display: "inline", marginLeft: 4, color: "#9ca3af" }} /></th>
                <th>Net sales <ChevronsUpDown size={12} style={{ display: "inline", marginLeft: 4, color: "#9ca3af" }} /></th>
                <th>Transactions <ChevronsUpDown size={12} style={{ display: "inline", marginLeft: 4, color: "#9ca3af" }} /></th>
                <th>Avg sale <ChevronsUpDown size={12} style={{ display: "inline", marginLeft: 4, color: "#9ca3af" }} /></th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Salon Envy\u00ae Corpus Christi", sales: "$0.00", txn: "0", avg: "$0.00" },
                { name: "Salon Envy\u00ae San Antonio", sales: `$${todayRevenue.toFixed(2)}`, txn: String(transactionCount), avg: `$${avgTicket.toFixed(2)}` },
              ].map((loc) => (
                <tr key={loc.name}>
                  <td style={{ fontWeight: 600 }}>{loc.name}</td>
                  <td>
                    <div style={{ fontFamily: "var(--font-fira), monospace", fontWeight: 600 }}>{loc.sales}</div>
                    <span className="trend-neutral" style={{ fontSize: 11 }}>N/A</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{loc.txn}</div>
                    <span className="trend-neutral" style={{ fontSize: 11 }}>N/A</span>
                  </td>
                  <td>
                    <div style={{ fontFamily: "var(--font-fira), monospace" }}>{loc.avg}</div>
                    <span className="trend-neutral" style={{ fontSize: 11 }}>N/A</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Results per page</span>
              <select style={{ height: 28, padding: "0 8px", border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 13, background: "white" }}>
                <option>10</option><option>25</option><option>50</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Page 1 of 1</span>
              <button style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 4, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={14} />
              </button>
              <button style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 4, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — desktop only */}
      <div className="hidden lg:flex" style={{
        width: 260, flexShrink: 0, padding: "32px 24px 24px 0",
        flexDirection: "column", gap: 16, position: "fixed", right: 0, top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Banking */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 16 }}>Banking</h3>
          {[
            { label: "Total balance", value: "$0.00" },
            { label: "Checking", value: "$0.00" },
            { label: "Loans balance", value: "$0.00" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 14, color: "#374151" }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-fira), monospace", color: "#111827" }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Quick actions</h3>
          {[
            { label: "Take payment", href: "/dashboard/pos" },
            { label: "New appointment", href: "/dashboard/appointments" },
            { label: "Add client", href: "/dashboard/clients" },
            { label: "View reports", href: "/dashboard/reports" },
          ].map((action) => (
            <a key={action.label} href={action.href} style={{
              display: "block", padding: "10px 0", fontSize: 14, color: "#606E74",
              fontWeight: 500, textDecoration: "none", borderBottom: "1px solid #f3f4f6",
            }}>{action.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
