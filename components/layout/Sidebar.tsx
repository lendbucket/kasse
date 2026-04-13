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
        width: 256,
        minHeight: "100vh",
        background: "#f7f8fa",
        borderRight: "1px solid rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 12px rgba(0,0,0,0.05)",
        position: "relative",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          height: 64,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#0a0c0e",
          }}
        >
          KASSE
        </span>
        <span
          style={{
            background: "rgba(96,110,116,0.10)",
            border: "1px solid rgba(96,110,116,0.18)",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 500,
            color: "#606E74",
          }}
        >
          Main Location
        </span>
      </div>

      {/* ── Search ── */}
      <div style={{ margin: "12px 12px", position: "relative" }}>
        <Search
          size={14}
          strokeWidth={1.5}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search..."
          style={{
            width: "100%",
            height: 34,
            background: "white",
            border: "1px solid rgba(0,0,0,0.09)",
            borderRadius: 8,
            padding: "0 10px 0 32px",
            fontSize: 13,
            color: "#0a0c0e",
            outline: "none",
            letterSpacing: "-0.31px",
          }}
        />
      </div>

      {/* ── Nav ── */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p
              style={{
                padding: "12px 20px 4px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "rgba(0,0,0,0.3)",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              {section.label}
            </p>
            <div
              style={{
                padding: "0 8px",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
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
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "0 12px",
                      borderRadius: 9,
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      textDecoration: "none",
                      transition: "all 120ms cubic-bezier(0.4,0,0.2,1)",
                      color: active ? "#606E74" : "#4a5568",
                      background: active
                        ? "rgba(96,110,116,0.10)"
                        : "transparent",
                      position: "relative",
                      letterSpacing: "-0.31px",
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 2.5,
                          height: 18,
                          background: "#606E74",
                          borderRadius: 999,
                        }}
                      />
                    )}
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      style={{
                        color: active ? "#606E74" : "#9ca3af",
                        flexShrink: 0,
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

      {/* ── User ── */}
      <div
        style={{
          borderTop: "1px solid rgba(0,0,0,0.07)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #606E74, #4d5c62)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "white",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#0a0c0e",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name ?? "User"}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#9ca3af",
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
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: "#9ca3af",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 150ms",
            padding: 6,
          }}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
