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
  ListOrdered,
  MessageSquare,
  Megaphone,
  Star,
  Phone,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Home", href: "/dashboard", icon: House },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart2 },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Payments & invoices", href: "/dashboard/pos", icon: CreditCard },
      { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
      { label: "Clients", href: "/dashboard/clients", icon: Users },
      { label: "Waitlist", href: "/dashboard/waitlist", icon: ListOrdered },
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    label: "TEAM",
    items: [
      { label: "Staff", href: "/dashboard/staff", icon: UserCog },
      { label: "Services & items", href: "/dashboard/services", icon: Tag },
    ],
  },
  {
    label: "GROWTH",
    items: [
      { label: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
      { label: "Reputation", href: "/dashboard/reputation", icon: Star },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { label: "AI Receptionist", href: "/dashboard/ai-receptionist", icon: Phone },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

// Flat list for backward compatibility
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "POS", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "More", href: "/dashboard/settings", icon: Settings },
]
