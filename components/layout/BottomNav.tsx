"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{
        background: "var(--card)",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      <ul className="flex items-stretch">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="flex h-14 cursor-pointer flex-col items-center justify-center gap-1 transition-colors duration-150"
                style={{
                  color: active
                    ? "var(--accent)"
                    : "var(--text-muted)",
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  style={{
                    color: active
                      ? "var(--accent-hover)"
                      : undefined,
                  }}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{
                    color: active
                      ? "var(--text-primary)"
                      : undefined,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
