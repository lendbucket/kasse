"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1a2332] bg-[#0d1117] lg:hidden">
      <ul className="flex items-stretch overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-[72px] flex-1">
              <Link
                href={item.href}
                className={`flex h-16 flex-col items-center justify-center gap-1 px-2 transition-colors duration-150 ${
                  active ? "text-[#606e74]" : "text-[#606e74]/60 hover:text-[#7a8f96]"
                }`}
              >
                <Icon
                  size={20}
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
