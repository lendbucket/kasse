import { ChevronRight } from "lucide-react";

const SECTIONS = [
  { title: "Business info", desc: "Name, address, contact details" },
  { title: "Locations", desc: "Manage your salon locations" },
  { title: "Payment types", desc: "Cash, card, and other payment methods" },
  { title: "Receipts", desc: "Customize receipt templates" },
  { title: "Notifications", desc: "Email and SMS notification preferences" },
  { title: "Team permissions", desc: "Roles and access levels" },
];

export default function SettingsPage() {
  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 24px" }}>Settings</h1>
      <div className="card" style={{ overflow: "hidden" }}>
        {SECTIONS.map((section, i) => (
          <a key={section.title} href="#" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", textDecoration: "none",
            borderBottom: i < SECTIONS.length - 1 ? "1px solid #e5e7eb" : "none",
            transition: "background 120ms", cursor: "pointer",
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{section.title}</p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>{section.desc}</p>
            </div>
            <ChevronRight size={16} strokeWidth={1.5} style={{ color: "#9ca3af", flexShrink: 0 }} />
          </a>
        ))}
      </div>
    </div>
  );
}
