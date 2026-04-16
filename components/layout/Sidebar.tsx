"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { NAV_ITEMS } from "./nav-items"
import {
  Search,
  CreditCard,
  Bell,
  MessageSquare,
  FileText,
  HelpCircle,
  LogOut,
  ChevronDown,
  Shield,
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
  const initials = (user.name ?? user.email ?? "?")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "#ffffff",
      borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
      boxShadow: "2px 0 8px rgba(0,0,0,0.06)", position: "relative", zIndex: 40,
    }}>
      {/* Business header */}
      <div style={{
        height: 56, padding: "0 16px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid #e5e7eb",
      }}>
        <Image src="/kasse-logo.png" alt="kasse." width={60} height={20}
          style={{ objectFit: "contain", filter: "invert(1)" }} />
        <ChevronDown size={16} strokeWidth={1.5} style={{ color: "#9ca3af", marginLeft: "auto" }} />
      </div>

      {/* Search */}
      <div style={{ padding: "10px 12px", position: "relative" }}>
        <Search size={16} strokeWidth={1.5} style={{
          position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "#9ca3af",
        }} />
        <input type="text" placeholder="Search" style={{
          width: "100%", height: 34, background: "#f7f8fa", border: "1px solid #e5e7eb",
          borderRadius: 6, padding: "0 10px 0 32px", fontSize: 14, color: "#374151", outline: "none",
        }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 8px", display: "flex", flexDirection: "column", gap: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} style={{
              height: 40, display: "flex", alignItems: "center", gap: 10,
              padding: "0 10px", borderRadius: 6, fontSize: 14,
              fontWeight: active ? 600 : 500, textDecoration: "none",
              transition: "all 120ms",
              color: active ? "#606E74" : "#374151",
              background: active ? "rgba(96,110,116,0.10)" : "transparent",
            }}>
              <Icon size={18} strokeWidth={1.5} style={{ color: active ? "#606E74" : "#6b7280", flexShrink: 0 }} />
              {item.label}
            </Link>
          )
        })}

        {/* Admin link — only for superadmin */}
        {user.role === "superadmin" && (
          <Link href="/admin" style={{
            height: 40, display: "flex", alignItems: "center", gap: 10,
            padding: "0 10px", borderRadius: 6, fontSize: 14,
            fontWeight: pathname.startsWith("/admin") ? 600 : 500, textDecoration: "none",
            transition: "all 120ms",
            color: pathname.startsWith("/admin") ? "#606E74" : "#374151",
            background: pathname.startsWith("/admin") ? "rgba(96,110,116,0.10)" : "transparent",
            marginTop: 8, borderTop: "1px solid #e5e7eb", paddingTop: 12,
          }}>
            <Shield size={18} strokeWidth={1.5} style={{ color: "#606E74", flexShrink: 0 }} />
            Admin Portal
          </Link>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: "auto", borderTop: "1px solid #e5e7eb", padding: "12px 8px" }}>
        <a href="/dashboard/pos" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", height: 40, background: "#606E74", color: "white",
          borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: "none",
          transition: "background 140ms", cursor: "pointer",
        }}>
          <CreditCard size={16} strokeWidth={1.5} />
          Take payment
        </a>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
          {[
            { icon: Bell, title: "Notifications" },
            { icon: MessageSquare, title: "Messages" },
            { icon: FileText, title: "Documents" },
            { icon: HelpCircle, title: "Help" },
          ].map(({ icon: Ic, title }) => (
            <button key={title} title={title} aria-label={title} style={{
              width: 36, height: 36, borderRadius: 6, border: "none", background: "transparent",
              color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", transition: "all 120ms",
            }}>
              <Ic size={18} strokeWidth={1.5} />
            </button>
          ))}
          <button title="Sign out" aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              width: 36, height: 36, borderRadius: 6, border: "none", background: "transparent",
              color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", transition: "all 120ms",
            }}>
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
