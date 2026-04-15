"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "./nav-items";

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 56,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)", borderTop: "1px solid #e5e7eb",
      display: "flex", paddingBottom: "env(safe-area-inset-bottom)", zIndex: 50,
    }}>
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 2, paddingTop: 6, textDecoration: "none",
            color: active ? "#606E74" : "#9ca3af", transition: "all 120ms",
          }}>
            <Icon size={22} strokeWidth={1.5} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
