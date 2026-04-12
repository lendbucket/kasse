import {
  LayoutDashboard,
  ChartColumn,
  ShoppingCart,
  Calendar,
  Users,
  Scissors,
  Wrench,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reports", href: "/dashboard/reports", icon: ChartColumn },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "POS Terminal", href: "/dashboard/pos", icon: ShoppingCart },
      { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
      { label: "Clients", href: "/dashboard/clients", icon: Users },
    ],
  },
  {
    title: "TEAM",
    items: [
      { label: "Staff", href: "/dashboard/staff", icon: Scissors },
      { label: "Services", href: "/dashboard/services", icon: Wrench },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

// Flat list for backward compat (BottomNav)
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

// Bottom nav subset
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "More", href: "/dashboard/settings", icon: Settings },
];
