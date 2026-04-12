"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0d1117] lg:hidden safe-area-inset-bottom">
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
                className={`flex h-14 cursor-pointer flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                  active
                    ? "text-[#606e74]"
                    : "text-[#606e74]/50 hover:text-[#7a8f96]"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className={active ? "text-[#7a8f96]" : undefined}
                />
                <span
                  className={`text-[10px] font-medium leading-none ${
                    active ? "text-white" : ""
                  }`}
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
