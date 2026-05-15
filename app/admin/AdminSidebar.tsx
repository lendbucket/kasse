"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard, Building2, Users, CreditCard, Upload,
} from "lucide-react"

// NAV — admin sidebar nav items.
// Pages must exist before they're added here. Removed in P0.A.12.1:
//   - /admin/ai-receptionist (planned for P15)
//   - /admin/platform-settings (planned for P0.B Command Center)
//   - /admin/audit-log (planned for P0.A.14)
// Add each back when its page ships.
const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/merchants", label: "Merchants", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/import-jobs", label: "Import Jobs", icon: Upload },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "#0d1117",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        height: 56, padding: "0 16px",
        display: "flex", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
          color: "#606e74", textTransform: "uppercase",
        }}>
          KASSE ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} style={{
              height: 38, display: "flex", alignItems: "center", gap: 10,
              padding: "0 10px", borderRadius: 6, fontSize: 13,
              fontWeight: active ? 600 : 400, textDecoration: "none",
              color: active ? "white" : "#8b949e",
              background: active ? "rgba(96,110,116,0.2)" : "transparent",
              transition: "all 120ms",
            }}>
              <Icon size={16} strokeWidth={1.5} style={{
                color: active ? "#606e74" : "#484f58", flexShrink: 0,
              }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Link href="/dashboard" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: 36, borderRadius: 6, fontSize: 12, fontWeight: 500,
          color: "#8b949e", textDecoration: "none",
          border: "1px solid rgba(255,255,255,0.08)",
          transition: "all 120ms",
        }}>
          Back to Dashboard
        </Link>
      </div>
    </aside>
  )
}
