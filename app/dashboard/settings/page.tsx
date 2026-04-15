import {
  Building2,
  MapPin,
  CreditCard,
  Receipt,
  Bell,
  Users,
  Palette,
  Shield,
  ChevronRight,
} from "lucide-react";

const SECTIONS = [
  { icon: Building2, title: "Business information", desc: "Name, address, contact details" },
  { icon: MapPin, title: "Locations", desc: "Manage your salon locations" },
  { icon: CreditCard, title: "Payment types", desc: "Configure accepted payment methods" },
  { icon: Receipt, title: "Receipts", desc: "Customize receipt templates" },
  { icon: Bell, title: "Notifications", desc: "Email and SMS notification preferences" },
  { icon: Users, title: "Team permissions", desc: "Roles and access control" },
  { icon: Palette, title: "Branding", desc: "Logo, colors, and custom domain" },
  { icon: Shield, title: "Security", desc: "Password, 2FA, and session management" },
];

export default function SettingsPage() {
  return (
    <>
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>ACCOUNT</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>Settings</h1>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 640 }}>
        <div className="card" style={{ overflow: "hidden" }}>
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <a key={section.title} href="#" style={{
                display: "flex", alignItems: "center", padding: "18px 24px", gap: 16,
                textDecoration: "none", cursor: "pointer", transition: "background 120ms",
                borderBottom: i < SECTIONS.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <Icon size={18} strokeWidth={1.5} style={{ color: "#606E74", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{section.title}</p>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>{section.desc}</p>
                </div>
                <ChevronRight size={16} strokeWidth={1.5} style={{ color: "#d1d5db", flexShrink: 0 }} />
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
