"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PoweredBySalonTransact } from "@/components/compliance/PoweredBySalonTransact";

type Grain = "day" | "week" | "month";
type Tab = "sales" | "team" | "retention";

const fmtD = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const todayStr = () => fmtD(new Date());
const daysAgoStr = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return fmtD(d); };
const fmtCents = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function formatPeriod(period: string, grain: Grain): string {
  const [y, m, d] = period.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (grain === "day") return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (grain === "week") { const e = new Date(date); e.setDate(e.getDate() + 6); return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`; }
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
const pctColor = (p: number) => (p >= 50 ? "pill-success" : p >= 25 ? "pill-warning" : "pill-error");

interface SalesSeriesPoint { period: string; orders: number; grossCents: number; netCents: number; taxCents: number; tipCents: number; }
interface StaffSalesRow { staffId: string | null; staffName: string; revenueCents: number; items: number; orders: number; pctOfRevenue: number; }
interface ServiceSalesRow { displayName: string; revenueCents: number; quantity: number; }
interface PaymentMixRow { method: string; amountCents: number; count: number; }
interface SalesSummary { orders: number; grossCents: number; netCents: number; subtotalCents: number; discountCents: number; taxCents: number; tipCents: number; itemsSold: number; avgTicketCents: number; }
interface SalesData { summary: SalesSummary; series: SalesSeriesPoint[]; byStaff: StaffSalesRow[]; byService: ServiceSalesRow[]; byPaymentMethod: PaymentMixRow[]; range: { startDate: string; endDate: string; grain: Grain }; }
interface RetentionRow { period: string; locationId: string; staffId: string | null; staffName: string | null; checkouts: number; rebookedClients: number; rebookPct: number; }
interface RetentionData { rows: RetentionRow[]; totals: { checkouts: number; rebookedClients: number; rebookPct: number }; range: { startDate: string; endDate: string; grain: Grain }; }
interface StaffOption { id: string; name: string; }

const ctrlStyle: React.CSSProperties = { height: 36, borderRadius: 6, border: "1px solid var(--border)", padding: "0 12px", fontSize: 16, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none" };
const methodLabel: Record<string, string> = { CASH: "Cash", CARD: "Card", GIFT_CARD: "Gift card", OTHER: "Other" };
function thStyle(left: boolean): React.CSSProperties { return { textAlign: left ? "left" : "right", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", background: "var(--bg-page)", letterSpacing: "0.04em", textTransform: "uppercase" }; }
const tdStyle: React.CSSProperties = { padding: "10px 16px", fontSize: 14, color: "var(--text-primary)" };
const tdNum: React.CSSProperties = { padding: "10px 16px", fontSize: 14, fontFamily: "var(--font-fira), monospace", color: "var(--text-primary)", textAlign: "right" };

function Loading() { return <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>; }
function ErrorBox({ msg }: { msg: string }) { return <div style={{ textAlign: "center", padding: "48px 0", color: "var(--error)", fontSize: 14 }}>{msg}</div>; }
function Empty({ msg }: { msg: string }) { return <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>{msg}</div>; }

function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true); setError(null);
    fetch(url, { signal: c.signal })
      .then(async (r) => { if (!r.ok) throw new Error("Failed to load"); return (await r.json()) as T; })
      .then((d) => { if (!c.signal.aborted) setData(d); })
      .catch((e) => { if (e?.name !== "AbortError" && !c.signal.aborted) setError(e instanceof Error ? e.message : "Load failed"); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [url]);
  return { data, loading, error };
}

function SalesTab({ startDate, endDate, grain, reloadKey }: { startDate: string; endDate: string; grain: Grain; reloadKey: number }) {
  const { data, loading, error } = useApi<{ sales: SalesData }>(`/api/analytics/sales?startDate=${startDate}&endDate=${endDate}&grain=${grain}&_r=${reloadKey}`);
  if (loading) return <Loading />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;
  const s = data.sales;
  const maxGross = Math.max(1, ...s.series.map((p) => p.grossCents));
  const kpis: Array<[string, string]> = [
    ["Gross sales", fmtCents(s.summary.grossCents)], ["Net sales", fmtCents(s.summary.netCents)],
    ["Orders", String(s.summary.orders)], ["Avg ticket", fmtCents(s.summary.avgTicketCents)],
    ["Tax collected", fmtCents(s.summary.taxCents)], ["Tips", fmtCents(s.summary.tipCents)],
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {kpis.map(([label, val]) => (
          <div key={label} className="card" style={{ padding: 18 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-fira), monospace", color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>{val}</p>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Revenue by {grain}</p>
        {s.series.length === 0 ? <Empty msg="No sales in this range yet" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {s.series.map((p) => (
              <div key={p.period} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 96, flexShrink: 0, fontSize: 12, color: "var(--text-secondary)" }}>{formatPeriod(p.period, grain)}</span>
                <div style={{ flex: 1, height: 22, background: "var(--bg-page)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(p.grossCents / maxGross) * 100}%`, height: "100%", background: "var(--brand)", borderRadius: 4, minWidth: p.grossCents > 0 ? 2 : 0 }} />
                </div>
                <span style={{ width: 92, flexShrink: 0, textAlign: "right", fontSize: 13, fontFamily: "var(--font-fira), monospace", color: "var(--text-primary)" }}>{fmtCents(p.grossCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", padding: "16px 16px 0" }}>Top services</p>
          {s.byService.length === 0 ? <Empty msg="No services sold" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead><tr>{["Service", "Qty", "Revenue"].map((h, i) => <th key={h} style={thStyle(i === 0)}>{h}</th>)}</tr></thead>
              <tbody>{s.byService.map((r) => (
                <tr key={r.displayName} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={tdStyle}>{r.displayName}</td><td style={tdNum}>{r.quantity}</td><td style={tdNum}>{fmtCents(r.revenueCents)}</td>
                </tr>))}</tbody>
            </table>
          )}
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", padding: "16px 16px 0" }}>Payment mix</p>
          {s.byPaymentMethod.length === 0 ? <Empty msg="No payments" /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
              <thead><tr>{["Method", "Count", "Amount"].map((h, i) => <th key={h} style={thStyle(i === 0)}>{h}</th>)}</tr></thead>
              <tbody>{s.byPaymentMethod.map((r) => (
                <tr key={r.method} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={tdStyle}>{methodLabel[r.method] ?? r.method}</td><td style={tdNum}>{r.count}</td><td style={tdNum}>{fmtCents(r.amountCents)}</td>
                </tr>))}</tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function TeamTab({ startDate, endDate, grain, reloadKey }: { startDate: string; endDate: string; grain: Grain; reloadKey: number }) {
  const { data, loading, error } = useApi<{ sales: SalesData }>(`/api/analytics/sales?startDate=${startDate}&endDate=${endDate}&grain=${grain}&_r=${reloadKey}`);
  if (loading) return <Loading />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;
  const rows = data.sales.byStaff;
  if (rows.length === 0) return <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ fontSize: 14, color: "var(--text-muted)" }}>No sales in this range yet</p></div>;
  const maxRev = Math.max(1, ...rows.map((r) => r.revenueCents));
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Stylist", "Orders", "Items", "Revenue", "% of revenue"].map((h, i) => <th key={h} style={thStyle(i === 0)}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.staffId ?? "unassigned"} style={{ borderBottom: "1px solid var(--border)" }}>
            <td style={{ ...tdStyle, fontWeight: 500 }}>{r.staffName}</td>
            <td style={tdNum}>{r.orders}</td><td style={tdNum}>{r.items}</td><td style={tdNum}>{fmtCents(r.revenueCents)}</td>
            <td style={{ padding: "10px 16px", width: 170 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 8, background: "var(--bg-page)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(r.revenueCents / maxRev) * 100}%`, height: "100%", background: "var(--brand)" }} />
                </div>
                <span style={{ fontSize: 13, fontFamily: "var(--font-fira), monospace", color: "var(--text-secondary)", width: 46, textAlign: "right" }}>{r.pctOfRevenue.toFixed(1)}%</span>
              </div>
            </td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}

function RetentionTab({ startDate, endDate, grain, reloadKey }: { startDate: string; endDate: string; grain: Grain; reloadKey: number }) {
  const [staffFilter, setStaffFilter] = useState("");
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff").then(async (r) => { if (!r.ok) return; const d = await r.json(); if (!cancelled) setStaffList(d.staff ?? []); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const params = new URLSearchParams({ startDate, endDate, grain, _r: String(reloadKey) });
  if (staffFilter) params.set("staffId", staffFilter);
  const { data, loading, error } = useApi<{ retention: RetentionData }>(`/api/analytics/retention?${params.toString()}`);
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={{ ...ctrlStyle, width: 200 }}>
          <option value="">All stylists</option>
          {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {loading && <Loading />}
      {!loading && error && <ErrorBox msg={error} />}
      {!loading && !error && data && (
        <>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--font-fira), monospace", color: "var(--text-primary)", letterSpacing: "-1px" }}>{data.retention.totals.rebookPct.toFixed(1)}%</span>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>rebook rate</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{data.retention.totals.rebookedClients} of {data.retention.totals.checkouts} checkouts rebooked</p>
          </div>
          {data.retention.rows.length === 0 ? (
            <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}><p style={{ fontSize: 14, color: "var(--text-muted)" }}>No checkouts in this range yet</p></div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Period", "Stylist", "Checkouts", "Rebooked", "Rebook %"].map((h, i) => <th key={h} style={thStyle(i < 2)}>{h}</th>)}</tr></thead>
                <tbody>{data.retention.rows.map((row) => (
                  <tr key={`${row.period}-${row.locationId}-${row.staffId ?? "none"}`} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={tdStyle}>{formatPeriod(row.period, grain)}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{row.staffName ?? "Unassigned"}</td>
                    <td style={tdNum}>{row.checkouts}</td><td style={tdNum}>{row.rebookedClients}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}><span className={pctColor(row.rebookPct)} style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-fira), monospace" }}>{row.rebookPct.toFixed(1)}%</span></td>
                  </tr>))}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("sales");
  const [grain, setGrain] = useState<Grain>("day");
  const [startDate, setStartDate] = useState(daysAgoStr(30));
  const [endDate, setEndDate] = useState(todayStr());
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      <div style={{ padding: "28px 32px 0", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>ANALYTICS</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>Reports</h1>
        <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
          {([["sales", "Sales"], ["team", "Team"], ["retention", "Retention"]] as const).map(([t, label]) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              height: 38, padding: "0 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 600,
              color: tab === t ? "var(--brand)" : "var(--text-secondary)", borderBottom: tab === t ? "2px solid var(--brand)" : "2px solid transparent", marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 32px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["day", "week", "month"] as const).map((g) => (
            <button key={g} type="button" onClick={() => setGrain(g)} style={{
              height: 32, padding: "0 14px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer", textTransform: "capitalize",
              border: grain === g ? "1px solid var(--brand)" : "1px solid var(--border)", background: grain === g ? "var(--brand)" : "var(--bg-card)", color: grain === g ? "white" : "var(--text-secondary)",
            }}>{g}</button>
          ))}
        </div>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...ctrlStyle, width: 150 }} />
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...ctrlStyle, width: 150 }} />
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} aria-label="Refresh" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center" }}>
          <RefreshCw size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div style={{ padding: "24px 32px" }}>
        {tab === "sales" && <SalesTab startDate={startDate} endDate={endDate} grain={grain} reloadKey={reloadKey} />}
        {tab === "team" && <TeamTab startDate={startDate} endDate={endDate} grain={grain} reloadKey={reloadKey} />}
        {tab === "retention" && <RetentionTab startDate={startDate} endDate={endDate} grain={grain} reloadKey={reloadKey} />}
      </div>
      <PoweredBySalonTransact />
    </>
  );
}
