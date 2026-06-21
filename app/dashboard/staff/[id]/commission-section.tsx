"use client";

import { Percent } from "lucide-react";

type StaffMember = {
  id: string; name: string; email: string | null; phone: string | null;
  role: string; locationId: string; isActive: boolean;
  location: { id: string; name: string } | null;
};

export default function CommissionSection({ staffId, staff }: { staffId: string; staff: StaffMember }) {
  return (
    <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
      <Percent size={36} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Commission</p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto" }}>
        Configure how this stylist earns — flat rate, sliding scale, or per-service.
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16, fontStyle: "italic" }}>Coming soon</p>
    </div>
  );
}
