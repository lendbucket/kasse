import {
  House,
  Calendar,
  Tag,
  CreditCard,
  Users,
  BarChart2,
  UserCog,
  Settings,
  LayoutDashboard,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: House },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Services & items", href: "/dashboard/services", icon: Tag },
  { label: "Payments & invoices", href: "/dashboard/pos", icon: CreditCard },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart2 },
  { label: "Staff", href: "/dashboard/staff", icon: UserCog },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "More", href: "/dashboard/settings", icon: Settings },
];
