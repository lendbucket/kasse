"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { PoweredBySalonTransact } from "@/components/compliance/PoweredBySalonTransact";

type RetentionGrain = "day" | "week" | "month";

interface RetentionRow {
  period: string;
  locationId: string;
  staffId: string | null;
  staffName: string | null;
  checkouts: number;
  rebookedClients: number;
  rebookPct: number;
}

interface RetentionData {
  rows: RetentionRow[];
  totals: { checkouts: number; rebookedClients: number; rebookPct: number };
  range: { startDate: string; endDate: string; grain: RetentionGrain };
}

interface StaffOption {
  id: string;
  name: string;
}

function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatPeriod(period: string, grain: RetentionGrain): string {
  const [y, m, d] = period.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (grain === "day") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (grain === "week") {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function pctColor(pct: number): string {
  if (pct >= 50) return "pill-success";
  if (pct >= 25) return "pill-warning";
  return "pill-error";
}

const controlInputStyle: React.CSSProperties = {
  height: 36,
  borderRadius: 6,
  border: "1px solid var(--border)",
  padding: "0 12px",
  fontSize: 16,
  color: "var(--text-primary)",
  background: "var(--bg-card)",
  outline: "none",
};

export default function ReportsPage() {
  const [grain, setGrain] = useState<RetentionGrain>("month");
  const [startDate, setStartDate] = useState(daysAgoStr(30));
  const [endDate, setEndDate] = useState(todayStr());
  const [staffFilter, setStaffFilter] = useState("");
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch staff list for filter
  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff")
      .then(async (res) => {
        if (!res.ok) {
          console.warn("Failed to load staff for filter", res.status);
          return;
        }
        const d = await res.json();
        if (!cancelled) setStaffList(d.staff ?? []);
      })
      .catch((e) => { console.warn("Failed to load staff for filter", e); });
    return () => { cancelled = true; };
  }, []);

  // Fetch retention data
  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        grain,
      });
      if (staffFilter) params.set("staffId", staffFilter);

      const res = await fetch(`/api/analytics/retention?${params}`, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      if (!res.ok) throw new Error("Failed to load retention data");
      const d = await res.json();
      if (ctrl.signal.aborted) return;
      setData(d.retention);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [startDate, endDate, grain, staffFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      {/* Header */}
      <div style={{
        padding: "28px 32px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            ANALYTICS
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>
            Reports
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Retention &amp; rebooking
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: "16px 32px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
        {/* Grain toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["day", "week", "month"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrain(g)}
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 120ms",
                border: grain === g ? "1px solid var(--brand)" : "1px solid var(--border)",
                background: grain === g ? "var(--brand)" : "var(--bg-card)",
                color: grain === g ? "white" : "var(--text-secondary)",
                textTransform: "capitalize",
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Stylist filter */}
        <select
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
          style={{ ...controlInputStyle, width: 180 }}
        >
          <option value="">All stylists</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ ...controlInputStyle, width: 150 }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ ...controlInputStyle, width: 150 }}
        />

        {/* Refresh */}
        <button
          type="button"
          onClick={fetchData}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Refresh"
        >
          <RefreshCw size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: 14 }}>
            Loading retention data...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--error, #dc2626)", fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && (
          <>
            {/* Summary card */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: "var(--font-fira), monospace",
                  color: "var(--text-primary)",
                  letterSpacing: "-1px",
                }}>
                  {data.totals.rebookPct.toFixed(1)}%
                </span>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  rebook rate
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
                {data.totals.rebookedClients} of {data.totals.checkouts} checkouts rebooked
              </p>
            </div>

            {/* Table */}
            {data.rows.length === 0 ? (
              <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  No checkouts in this range yet
                </p>
              </div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Period", "Stylist", "Checkouts", "Rebooked", "Rebook %"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: h === "Period" || h === "Stylist" ? "left" : "right",
                            padding: "10px 16px",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                            borderBottom: "1px solid var(--border)",
                            background: "var(--bg-page)",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr
                        key={`${row.period}-${row.locationId}-${row.staffId ?? "none"}`}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td style={{ padding: "10px 16px", fontSize: 14, color: "var(--text-primary)" }}>
                          {formatPeriod(row.period, data.range.grain)}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
                          {row.staffName ?? "Unassigned"}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 14, fontFamily: "var(--font-fira), monospace", color: "var(--text-primary)", textAlign: "right" }}>
                          {row.checkouts}
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 14, fontFamily: "var(--font-fira), monospace", color: "var(--text-primary)", textAlign: "right" }}>
                          {row.rebookedClients}
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <span
                            className={pctColor(row.rebookPct)}
                            style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-fira), monospace" }}
                          >
                            {row.rebookPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <PoweredBySalonTransact />
    </>
  );
}
