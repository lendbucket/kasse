"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
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

const SIDEBAR_BG = "#2f5061"
const SIDEBAR_BG_HOVER = "rgba(255,255,255,0.06)"
const SIDEBAR_BG_ACTIVE = "rgba(255,255,255,0.10)"
const TEXT_ACTIVE = "#ffffff"
const TEXT_INACTIVE = "rgba(255,255,255,0.70)"
const TEXT_LABEL = "rgba(255,255,255,0.45)"
const TEXT_ICON_INACTIVE = "rgba(255,255,255,0.55)"
const BORDER_SUBTLE = "rgba(255,255,255,0.08)"
const BLUSH = "#e57f84"

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: SIDEBAR_BG,
      display: "flex", flexDirection: "column",
      boxShadow: "2px 0 8px rgba(15,30,40,0.08)",
      position: "relative", zIndex: 40,
    }}>
      {/* Header — kasse. wordmark as text */}
      <div style={{
        height: 56, padding: "0 20px", display: "flex", alignItems: "center",
        borderBottom: `1px solid ${BORDER_SUBTLE}`,
      }}>
        <span style={{
          fontFamily: "inherit", fontSize: 20, fontWeight: 800, color: "#ffffff",
          letterSpacing: "-0.5px", lineHeight: 1, userSelect: "none",
        }}>
          kasse<span style={{ color: BLUSH }}>.</span>
        </span>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 12px 8px", position: "relative" }}>
        <Search size={14} strokeWidth={1.75} style={{
          position: "absolute", left: 22, top: "50%", transform: "translateY(-30%)",
          color: "rgba(255,255,255,0.50)", pointerEvents: "none",
        }} />
        <input type="text" placeholder="Search" style={{
          width: "100%", height: 32,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 6, padding: "0 10px 0 30px",
          fontSize: 13, color: "#ffffff", outline: "none",
        }} />
      </div>

      {/* Sectioned Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p style={{
              padding: "12px 20px 4px", fontSize: 10, fontWeight: 700,
              color: TEXT_LABEL, letterSpacing: "0.10em",
              textTransform: "uppercase", margin: 0,
            }}>{section.label}</p>
            {section.items.map((item) => {
              const active = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} style={{
                  height: 36, display: "flex", alignItems: "center", gap: 10,
                  padding: "0 12px 0 17px", fontSize: 13, textDecoration: "none",
                  fontWeight: active ? 600 : 500,
                  color: active ? TEXT_ACTIVE : TEXT_INACTIVE,
                  background: active ? SIDEBAR_BG_ACTIVE : "transparent",
                  borderLeft: active ? `3px solid ${BLUSH}` : "3px solid transparent",
                  transition: "background 120ms, color 120ms",
                }}>
                  <Icon size={16} strokeWidth={1.75} style={{
                    color: active ? TEXT_ACTIVE : TEXT_ICON_INACTIVE,
                    flexShrink: 0,
                  }} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}

        {user.role === "superadmin" && (
          <div>
            <p style={{
              padding: "12px 20px 4px", fontSize: 10, fontWeight: 700,
              color: TEXT_LABEL, letterSpacing: "0.10em",
              textTransform: "uppercase", margin: 0,
            }}>ADMIN</p>
            <Link href="/admin" style={{
              height: 36, display: "flex", alignItems: "center", gap: 10,
              padding: "0 12px 0 17px", fontSize: 13, textDecoration: "none",
              fontWeight: pathname.startsWith("/admin") ? 600 : 500,
              color: pathname.startsWith("/admin") ? TEXT_ACTIVE : TEXT_INACTIVE,
              background: pathname.startsWith("/admin") ? SIDEBAR_BG_ACTIVE : "transparent",
              borderLeft: pathname.startsWith("/admin") ? `3px solid ${BLUSH}` : "3px solid transparent",
              transition: "background 120ms, color 120ms",
            }}>
              <Shield size={16} strokeWidth={1.75} style={{
                color: pathname.startsWith("/admin") ? TEXT_ACTIVE : TEXT_ICON_INACTIVE,
                flexShrink: 0,
              }} />
              Admin Portal
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom — Take Payment CTA + utility row */}
      <div style={{
        marginTop: "auto", borderTop: `1px solid ${BORDER_SUBTLE}`,
        padding: "12px 8px",
      }}>
        <a href="/dashboard/pos" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", height: 38, background: BLUSH, color: "white",
          borderRadius: 6, fontSize: 13, fontWeight: 600,
          textDecoration: "none", cursor: "pointer",
          transition: "background 120ms",
        }}>
          <CreditCard size={15} strokeWidth={2} /> Take payment
        </a>
        <div style={{
          display: "flex", justifyContent: "center", gap: 4, marginTop: 8,
        }}>
          {[
            { icon: Bell, title: "Notifications" },
            { icon: FileText, title: "Documents" },
            { icon: HelpCircle, title: "Help" },
          ].map(({ icon: Ic, title }) => (
            <button key={title} title={title} aria-label={title} style={{
              width: 34, height: 34, borderRadius: 6, border: "none",
              background: "transparent", color: TEXT_INACTIVE, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 120ms, color 120ms",
            }}>
              <Ic size={17} strokeWidth={1.75} />
            </button>
          ))}
          <button title="Sign out" aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              width: 34, height: 34, borderRadius: 6, border: "none",
              background: "transparent", color: TEXT_INACTIVE, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 120ms, color 120ms",
            }}>
            <LogOut size={17} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}
