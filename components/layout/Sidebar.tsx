"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { NAV_SECTIONS } from "./nav-items";
import { ThemeToggle } from "../ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex lg:w-60 lg:flex-col"
      style={{
        background: "var(--card)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Logo + Location */}
      <div className="flex flex-col gap-1 px-5 pt-5 pb-4">
        <span
          className="text-[16px] font-bold tracking-[0.2em]"
          style={{ color: "var(--text-primary)" }}
        >
          KASSE
        </span>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          Main Location
        </span>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div
          className="flex h-9 items-center gap-2 rounded-lg px-3"
          style={{ background: "var(--search-bg)" }}
        >
          <Search
            size={14}
            strokeWidth={1.5}
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-[13px] outline-none"
            style={{
              color: "var(--text-primary)",
              caretColor: "var(--accent)",
            }}
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p
              className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--text-muted)" }}
            >
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
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
                    className="group flex h-9 cursor-pointer items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors duration-150"
                    style={{
                      background: active
                        ? "var(--nav-active-bg)"
                        : "transparent",
                      color: active
                        ? "var(--nav-active-text)"
                        : "var(--nav-inactive-text)",
                    }}
                    onMouseEnter={(e) => {
                      if (!active)
                        e.currentTarget.style.background =
                          "var(--overlay-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      style={{
                        color: active
                          ? "var(--nav-active-text)"
                          : "var(--nav-icon-inactive)",
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

      {/* User section */}
      <div
        className="p-4"
        style={{ borderTop: "1px solid var(--border-color)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              background: "var(--avatar-bg)",
              color: "var(--text-secondary)",
            }}
          >
            RR
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className="truncate text-[13px] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Robert Reyna
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Owner
            </span>
          </div>
          <ThemeToggle className="text-[var(--text-muted)] hover:bg-[var(--overlay-hover)] hover:text-[var(--text-primary)]" />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--overlay-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
            title="Sign out"
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
