import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  Users,
  Scissors,
  Wrench,
  ChartColumn,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS Terminal", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Staff", href: "/dashboard/staff", icon: Scissors },
  { label: "Services", href: "/dashboard/services", icon: Wrench },
  { label: "Reports", href: "/dashboard/reports", icon: ChartColumn },
];
