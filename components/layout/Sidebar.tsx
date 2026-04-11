"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#1a2332] lg:bg-[#0d1117]">
      <div className="flex h-16 items-center gap-3 border-b border-[#1a2332] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1a2332] bg-[#06080d]">
          <span className="font-mono text-lg font-semibold text-[#7a8f96]">
            K
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-white">
            Kasse
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#606e74]">
            Reyna Tech
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "border-[#606e74] bg-[#06080d] text-white"
                  : "border-transparent text-[#7a8f96] hover:border-[#1a2332] hover:bg-[#06080d] hover:text-white"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-[#7a8f96]" : "text-[#606e74]"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1a2332] p-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#606e74]">
          v0.1.0
        </p>
      </div>
    </aside>
  );
}
