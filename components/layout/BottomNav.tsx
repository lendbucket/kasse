"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "./nav-items";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 50,
      }}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
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
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              paddingTop: 8,
              textDecoration: "none",
              transition: "all 120ms",
              color: active ? "#606E74" : "#9ca3af",
              position: "relative",
            }}
          >
            {active && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  width: 14,
                  height: 2.5,
                  background: "#606E74",
                  borderRadius: 999,
                }}
              />
            )}
            <Icon size={22} strokeWidth={1.5} />
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.02em" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
