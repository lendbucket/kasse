import {
  LayoutDashboard,
  BarChart2,
  ShoppingCart,
  Calendar,
  Users,
  UserCog,
  Scissors,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart2 },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "POS Terminal", href: "/dashboard/pos", icon: ShoppingCart },
      { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
      { label: "Clients", href: "/dashboard/clients", icon: Users },
    ],
  },
  {
    label: "TEAM",
    items: [
      { label: "Staff", href: "/dashboard/staff", icon: UserCog },
      { label: "Services", href: "/dashboard/services", icon: Scissors },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "More", href: "/dashboard/staff", icon: UserCog },
];
