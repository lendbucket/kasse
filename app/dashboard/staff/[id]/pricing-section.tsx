"use client";

import { Tag } from "lucide-react";
import type { StaffMember } from "./types";

export default function PricingSection({ staffId, staff }: { staffId: string; staff: StaffMember }) {
  return (
    <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
      <Tag size={36} strokeWidth={1.5} style={{ color: "var(--border)", margin: "0 auto 12px" }} />
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Custom pricing</p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto" }}>
        Set this stylist&apos;s own price and duration for specific services.
      </p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16, fontStyle: "italic" }}>Coming soon</p>
    </div>
  );
}
