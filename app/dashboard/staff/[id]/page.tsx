"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Scissors } from "lucide-react";
import OverviewSection from "./overview-section";
import ServicesSection from "./services-section";
import PricingSection from "./pricing-section";
import CommissionSection from "./commission-section";
import type { StaffMember } from "./types";

type Tab = "overview" | "services" | "pricing" | "commission";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "services", label: "Services" },
  { key: "pricing", label: "Pricing" },
  { key: "commission", label: "Commission" },
];

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const staffId = params.id;
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/staff/${staffId}`);
      if (res.status === 404) { setError("Staff member not found"); return; }
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { staff: StaffMember };
      setStaff(data.staff);
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, [staffId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ padding: "24px 32px" }}>
        <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div style={{ padding: "24px 32px" }}>
        <Link href="/dashboard/staff" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Staff
        </Link>
        <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--error)" }}>{error || "Not found"}</p>
        </div>
      </div>
    );
  }

  const initials = staff.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Header */}
      <div style={{ padding: "20px 32px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <Link href="/dashboard/staff" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 12 }}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Staff
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Avatar */}
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white", flexShrink: 0 }}>
            {initials}
          </div>
          {/* Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" }}>{staff.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              {/* Role pill */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", background: "var(--brand-soft)", color: "var(--brand)" }}>
                {staff.role === "manager" ? <Shield size={11} strokeWidth={1.5} /> : <Scissors size={11} strokeWidth={1.5} />}
                {staff.role === "manager" ? "Manager" : "Stylist"}
              </span>
              {/* Location */}
              {staff.location && (
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{staff.location.name}</span>
              )}
              {/* Status dot */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: staff.isActive ? "var(--success)" : "var(--border-strong)" }} />
                <span style={{ color: staff.isActive ? "var(--success)" : "var(--text-muted)" }}>{staff.isActive ? "Active" : "Inactive"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: "0 32px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", gap: 0, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "none", background: "transparent",
              color: activeTab === t.key ? "var(--brand)" : "var(--text-muted)",
              borderBottom: activeTab === t.key ? "2px solid var(--brand)" : "2px solid transparent",
              transition: "all 120ms", whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "24px 32px" }}>
        {activeTab === "overview" && <OverviewSection staffId={staffId} staff={staff} />}
        {activeTab === "services" && <ServicesSection staffId={staffId} staff={staff} />}
        {activeTab === "pricing" && <PricingSection staffId={staffId} staff={staff} />}
        {activeTab === "commission" && <CommissionSection staffId={staffId} staff={staff} />}
      </div>
    </>
  );
}
