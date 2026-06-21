"use client";

import { Mail, MapPin, Phone, User } from "lucide-react";

type StaffMember = {
  id: string; name: string; email: string | null; phone: string | null;
  role: string; locationId: string; isActive: boolean;
  location: { id: string; name: string } | null;
};

export default function OverviewSection({ staffId, staff }: { staffId: string; staff: StaffMember }) {
  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <User size={14} strokeWidth={1.5} />, label: "Name", value: staff.name },
    { icon: <User size={14} strokeWidth={1.5} />, label: "Role", value: staff.role === "manager" ? "Manager" : "Stylist" },
    { icon: <MapPin size={14} strokeWidth={1.5} />, label: "Location", value: staff.location?.name || "\u2014" },
    { icon: <Mail size={14} strokeWidth={1.5} />, label: "Email", value: staff.email || "\u2014" },
    { icon: <Phone size={14} strokeWidth={1.5} />, label: "Phone", value: staff.phone || "\u2014" },
  ];

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Details</h2>
      </div>
      <div style={{ padding: "8px 0" }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 24px" }}>
            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{r.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", width: 80, flexShrink: 0 }}>{r.label}</span>
            <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
