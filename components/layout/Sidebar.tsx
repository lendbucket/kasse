"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { NAV_SECTIONS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-white/[0.06] lg:bg-[#0d1117]">
      {/* Logo + Location */}
      <div className="flex flex-col gap-1 px-5 pt-5 pb-4">
        <span className="text-[16px] font-bold tracking-[0.2em] text-white">
          KASSE
        </span>
        <span className="text-[12px] text-[#606e74]">Main Location</span>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex h-9 items-center gap-2 rounded-lg bg-[#06080d] px-3">
          <Search size={14} strokeWidth={1.5} className="text-[#606e74]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-[13px] text-white placeholder:text-[#606e74] outline-none"
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#606e74]">
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
                    className={`group flex h-9 cursor-pointer items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors duration-150 ${
                      active
                        ? "bg-[#606e74]/[0.15] text-white"
                        : "text-[#7a8f96] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      className={
                        active ? "text-white" : "text-[#606e74]"
                      }
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
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#606e74]/20 text-[12px] font-semibold text-[#7a8f96]">
            RR
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium text-white">
              Robert Reyna
            </span>
            <span className="text-[11px] text-[#606e74]">Owner</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#606e74] transition-colors duration-150 hover:bg-white/[0.04] hover:text-white"
            title="Sign out"
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
