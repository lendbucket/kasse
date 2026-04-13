"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { NAV_SECTIONS } from "./nav-items";
import { Search, LogOut } from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "#0d1117",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px" }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#ffffff",
          }}
        >
          KASSE
        </span>
        <p
          style={{
            fontSize: 12,
            color: "#606E74",
            marginTop: 2,
          }}
        >
          Main Location
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: "0 16px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            borderRadius: 8,
            background: "#06080d",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "0 12px",
          }}
        >
          <Search size={14} strokeWidth={1.5} color="#606E74" />
          <input
            type="text"
            placeholder="Search..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: 13,
              letterSpacing: "-0.31px",
            }}
          />
        </div>
      </div>

      {/* Nav Sections */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#606E74",
                padding: "0 12px",
                marginBottom: 6,
              }}
            >
              {section.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      height: 36,
                      borderRadius: 8,
                      padding: "0 12px",
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: "none",
                      letterSpacing: "-0.31px",
                      transition: "background 150ms, color 150ms",
                      background: active
                        ? "rgba(96,110,116,0.15)"
                        : "transparent",
                      color: active ? "#ffffff" : "rgba(255,255,255,0.5)",
                      borderLeft: active
                        ? "2px solid #606E74"
                        : "2px solid transparent",
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      style={{
                        color: active ? "#7a8f96" : "#606E74",
                      }}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#606E74",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
                letterSpacing: "-0.31px",
              }}
            >
              {user.name ?? "User"}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#606E74",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email ?? ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "#606E74",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
