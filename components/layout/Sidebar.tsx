"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { NAV_SECTIONS } from "./nav-items"
import {
  Search, CreditCard, Bell, FileText, HelpCircle, LogOut, Shield,
} from "lucide-react"

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    organizationId?: string | null
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "#ffffff",
      borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
      boxShadow: "2px 0 8px rgba(0,0,0,0.06)", position: "relative", zIndex: 40,
    }}>
      {/* Header */}
      <div style={{ height: 56, padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #e5e7eb" }}>
        <Image src="/kasse-logo.png" alt="kasse." width={60} height={20} style={{ objectFit: "contain", filter: "invert(1)" }} />
      </div>

      {/* Search */}
      <div style={{ padding: "10px 12px", position: "relative" }}>
        <Search size={16} strokeWidth={1.5} style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input type="text" placeholder="Search" style={{
          width: "100%", height: 34, background: "#f7f8fa", border: "1px solid #e5e7eb",
          borderRadius: 6, padding: "0 10px 0 32px", fontSize: 14, color: "#374151", outline: "none",
        }} />
      </div>

      {/* Sectioned Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p style={{
              padding: "12px 20px 4px", fontSize: 11, fontWeight: 700, color: "#9ca3af",
              letterSpacing: "0.08em", textTransform: "uppercase", margin: 0,
            }}>{section.label}</p>
            {section.items.map((item) => {
              const active = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} style={{
                  height: 38, display: "flex", alignItems: "center", gap: 10,
                  padding: "0 12px 0 20px", fontSize: 13, textDecoration: "none",
                  fontWeight: active ? 600 : 500, transition: "all 120ms",
                  color: active ? "#606E74" : "#374151",
                  background: active ? "rgba(96,110,116,0.10)" : "transparent",
                  borderLeft: active ? "3px solid #606E74" : "3px solid transparent",
                }}>
                  <Icon size={16} strokeWidth={1.5} style={{ color: active ? "#606E74" : "#9ca3af", flexShrink: 0 }} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}

        {user.role === "superadmin" && (
          <div>
            <p style={{ padding: "12px 20px 4px", fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>ADMIN</p>
            <Link href="/admin" style={{
              height: 38, display: "flex", alignItems: "center", gap: 10,
              padding: "0 12px 0 20px", fontSize: 13, textDecoration: "none",
              fontWeight: pathname.startsWith("/admin") ? 600 : 500,
              color: pathname.startsWith("/admin") ? "#606E74" : "#374151",
              background: pathname.startsWith("/admin") ? "rgba(96,110,116,0.10)" : "transparent",
              borderLeft: pathname.startsWith("/admin") ? "3px solid #606E74" : "3px solid transparent",
            }}>
              <Shield size={16} strokeWidth={1.5} style={{ color: "#606E74", flexShrink: 0 }} />
              Admin Portal
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #e5e7eb", padding: "12px 8px" }}>
        <a href="/dashboard/pos" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", height: 40, background: "#606E74", color: "white",
          borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none", cursor: "pointer",
        }}>
          <CreditCard size={16} strokeWidth={1.5} /> Take payment
        </a>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
          {[{ icon: Bell, title: "Notifications" }, { icon: FileText, title: "Documents" }, { icon: HelpCircle, title: "Help" }].map(({ icon: Ic, title }) => (
            <button key={title} title={title} aria-label={title} style={{
              width: 36, height: 36, borderRadius: 6, border: "none", background: "transparent",
              color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}><Ic size={18} strokeWidth={1.5} /></button>
          ))}
          <button title="Sign out" aria-label="Sign out" onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ width: 36, height: 36, borderRadius: 6, border: "none", background: "transparent", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
