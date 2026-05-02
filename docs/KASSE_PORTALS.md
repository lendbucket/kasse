# KASSE_PORTALS.md
## Portal Architecture — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## THE CORE CHALLENGE: ONE CODEBASE, 20 INDUSTRIES

Kasse must serve a nail salon and a CrossFit gym and a barbershop and a fine-dining restaurant — from the same codebase, the same database schema, the same UI framework.

But a nail salon has no concept of a "table." A restaurant has no concept of "formula cards." A gym has no concept of "stylists." If we show restaurant operators a screen full of salon terminology, they feel alienated. They feel like they're using the wrong software.

The solution is the **VerticalConfig** system: a configuration object that controls every word, every icon, every section, every default, every automation trigger for a given business type. The underlying Kasse product is identical. The VerticalConfig makes it feel like a purpose-built tool for each industry.

**Build Phase:** Phase 4 — Vertical Config System
**Dependencies:** Core product built (Phases 0-3), at least one vertical live (salon/beauty)

---

## THE TWO PORTAL VIEWS

Every Kasse merchant has access to two portal views that can be toggled from the top nav:

### View A — Time-Based (Calendar View)

The default for appointment-based businesses (salons, spas, barbershops, med spas, gyms with PT, auto service).

What it shows:
- Day/week calendar with time slots
- Booked appointments appear as colored blocks on the calendar
- Staff columns (1 column per staff on duty)
- Available time slots visible at a glance
- Color coding by service type
- Quick-add new booking by clicking any empty slot

```
CALENDAR VIEW — Luxe Hair Studio — Tuesday, October 15

        9 AM     10 AM     11 AM     12 PM     1 PM      2 PM
────────────────────────────────────────────────────────────────
JENNIFER│[Sarah M.         ]│         │[COLOR   ]│[Lunch  ]│[Linda K ]
        │[Balayage — 3.5hr ]│  OPEN   │[Corr.   ]│        │[Root   ]
────────────────────────────────────────────────────────────────
MARIA   │[Tom K.  ]│         │[Walk-in ]│[Open    ]│
        │[Cut+Brd ]│  OPEN   │[9:30    ]│         │
────────────────────────────────────────────────────────────────
ASHLEY  │         │[New Cli ]│         │[Open    ]│
        │  OPEN   │[Consult ]│  OPEN   │         │
────────────────────────────────────────────────────────────────
```

Click any booking block → booking detail slide-in (client info, service, notes, actions)
Click any open slot → quick-book modal opens

### View B — Transaction-Based (Queue / Table View)

The default for non-appointment businesses (restaurants, retail, walk-in barbershops) or appointment businesses that want a queue view.

Restaurant:
```
FLOOR VIEW — The Garden Restaurant — Tuesday 7:23 PM

TABLES:                              WAITLIST:
  T1  [Ramirez — 4 guests — 47min]   1. Thompson x2 — 8 min
  T2  [Available]                    2. Garcia x4 — 3 min
  T3  [Williams — 2 — 1hr 3m]
  T4  [Reserved 7:30 — Chen x6]
  ...

ORDERS IN KITCHEN: 8 open
DOORDASH QUEUE: 2 orders
```

Barbershop:
```
QUEUE VIEW — Fade Factory — Tuesday 3:15 PM

CURRENT CLIENTS:
  Marcus:   John W.     (12 min in)
  DeShawn:  walk-in     (8 min in)
  Carlos:   AVAILABLE ← next
  Ramon:    AVAILABLE ← after

WAITING (6):
  1. Marcus Jr. — 14 min wait
  2. Diego M. — 8 min wait
  3. [+ 4 more]

NEW WALK-IN: [Add to Queue]
```

Toggle between views from the top of any calendar page. Both views always available regardless of vertical. Default view set by VerticalConfig.

---

## THE VERTICALCONFIG SYSTEM

### TypeScript Interface

```typescript
interface VerticalConfig {
  // Identity
  verticalId: VerticalId;
  displayName: string;         // "Salon" | "Restaurant" | "Gym" | etc.
  
  // Terminology overrides
  terminology: {
    client: string;           // "Client" | "Guest" | "Member" | "Customer" | "Patient"
    clients: string;          // Plural form
    staff: string;            // "Stylist" | "Server" | "Coach" | "Barber" | "Therapist"
    staffMembers: string;     // Plural form
    booking: string;          // "Appointment" | "Reservation" | "Booking" | "Session" | "Class"
    bookings: string;         // Plural form
    service: string;          // "Service" | "Menu Item" | "Class" | "Treatment" | "Product/Service"
    services: string;         // Plural form
    location: string;         // "Location" | "Restaurant" | "Studio" | "Shop"
    checkout: string;         // "Checkout" | "Close Tab" | "Complete Session"
    tip: string;              // "Tip" | "Gratuity"
    schedule: string;         // "Schedule" | "Menu" | "Class Schedule" | "Service Hours"
    noShow: string;           // "No Show" | "No Show" (universal)
    cancellation: string;     // "Cancellation" | "Cancellation"
  };

  // Navigation (which sidebar items appear, in what order)
  navigation: NavItem[];

  // Dashboard (what widgets appear on the home dashboard)
  dashboard: DashboardWidget[];

  // Calendar / Queue default view
  defaultView: 'calendar' | 'queue' | 'floor';

  // Features enabled by default for this vertical
  features: {
    tables: boolean;              // Floor plan and table management
    formulas: boolean;            // Color formula cards (Kasse Color)
    inventory: boolean;           // Physical inventory tracking
    memberships: boolean;         // Recurring membership management
    classes: boolean;             // Class scheduling and registration
    waitlist: boolean;            // Walk-in queue
    deliveryOrders: boolean;      // DoorDash/Uber Eats integration
    kitchenDisplay: boolean;      // KDS
    vehicleProfiles: boolean;     // Auto service vehicle tracking
    petProfiles: boolean;         // Pet grooming animal profiles
    medicalIntake: boolean;       // Med spa intake forms
    paws: boolean;                // PAR-Q and waivers (gym)
    menuManagement: boolean;      // Restaurant menu vs. service catalog
    tipDistribution: boolean;     // Server tip pooling
  };

  // Checkout flow configuration
  checkout: {
    showTip: boolean;             // Show tip prompt at checkout
    defaultTipPercentages: number[];  // e.g. [18, 20, 25]
    requireStaffSelection: boolean;   // Must assign service to staff member
    splitPayEnabled: boolean;         // Split check capability
    tabEnabled: boolean;              // Open tab / pay later
    depositRequired: boolean;         // Default deposit policy
    defaultDepositType: 'none' | 'percent' | 'fixed' | 'full';
    defaultDepositValue: number;      // 0 | 20 | 50 | 100 (percent or dollars)
  };

  // Client profile display configuration
  clientProfile: {
    sections: ClientProfileSection[];  // Which sections show in a client profile
    defaultFirstTabSection: string;    // What tab is highlighted first
    showAllergies: boolean;
    showFormulas: boolean;
    showVehicles: boolean;
    showPets: boolean;
    showMedicalHistory: boolean;
    customFields: CustomField[];       // Vertical-specific extra fields
  };

  // Report names and defaults
  reports: {
    primaryMetric: string;             // "Bookings" | "Covers" | "Members" | "Sessions"
    defaultReportPeriod: 'day' | 'week' | 'month';
    showLaborCostPercent: boolean;     // Restaurant-specific
    showRetentionRate: boolean;        // Gym/salon focused
    showAverageTicket: boolean;
    showTipSummary: boolean;
    showInventoryCostOfGoods: boolean; // Restaurant/retail
  };

  // Booking widget language
  bookingWidget: {
    headline: string;               // "Book an Appointment" | "Make a Reservation" | "Book a Class"
    ctaText: string;                // "Book Now" | "Reserve a Table" | "Join a Class"
    showStaffSelection: boolean;    // Salons yes, restaurants no
    showServiceDuration: boolean;   // Appointments yes, restaurant no
    groupBookingLabel: string;      // "Party size" | "Number of guests" | "Number of members"
    showGroupSize: boolean;         // Restaurant/gym yes, salon less common
  };

  // Automation templates active by default
  automations: AutomationTemplate[];

  // Onboarding wizard configuration
  onboarding: {
    steps: OnboardingStep[];
    primarySetupGoal: string;        // "Take your first booking" | "Take your first order" | etc.
    welcomeVideoUrl?: string;        // Optional vertical-specific welcome video
  };

  // Color scheme (subtle vertical differentiation within Kasse brand)
  theme: {
    accentIcon: string;             // Icon in sidebar header area (scissors, fork+knife, dumbbell, etc.)
    navLabel: string;               // What the sidebar calls the main entity ("Appointments" | "Reservations")
  };
}

type VerticalId = 
  | 'salon'
  | 'barbershop'
  | 'nail_studio'
  | 'spa'
  | 'med_spa'
  | 'tattoo_studio'
  | 'lash_studio'
  | 'brow_studio'
  | 'restaurant'
  | 'bar'
  | 'food_truck'
  | 'cafe'
  | 'bakery'
  | 'gym'
  | 'crossfit'
  | 'yoga_studio'
  | 'pilates_studio'
  | 'martial_arts'
  | 'dance_studio'
  | 'personal_training'
  | 'auto_service'
  | 'auto_detail'
  | 'pet_grooming'
  | 'veterinary'
  | 'retail'
  | 'boutique'
  | 'cleaning_service'
  | 'photography'
  | 'massage_therapy'
  | 'chiropractic'
  | 'cleaning_service'
  | 'childcare'
  | 'tutoring'
  | 'event_venue';

interface NavItem {
  id: string;
  label: string;              // Localized per vertical
  icon: string;               // Icon name
  href: string;               // Route
  plans: PlanTier[];          // Which plans can see this item
  addons?: string[];          // Required addons (if any)
  badge?: 'new' | 'count' | 'alert';  // Badge type
  children?: NavItem[];       // Sub-items
}
```

---

## VERTICAL CONFIG IMPLEMENTATIONS

### Salon / Beauty

```typescript
const salonConfig: VerticalConfig = {
  verticalId: 'salon',
  displayName: 'Salon',
  terminology: {
    client: 'Client',
    clients: 'Clients',
    staff: 'Stylist',
    staffMembers: 'Stylists',
    booking: 'Appointment',
    bookings: 'Appointments',
    service: 'Service',
    services: 'Services',
    location: 'Salon',
    checkout: 'Checkout',
    tip: 'Tip',
    schedule: 'Schedule',
    noShow: 'No Show',
    cancellation: 'Cancellation'
  },
  navigation: [
    { id: 'home', label: 'Home', icon: 'home', href: '/dashboard' },
    { id: 'appointments', label: 'Appointments', icon: 'calendar', href: '/appointments' },
    { id: 'clients', label: 'Clients', icon: 'users', href: '/clients' },
    { id: 'color', label: 'Color Studio', icon: 'palette', href: '/color', addons: ['kasse_color'] },
    { id: 'staff', label: 'Stylists', icon: 'scissors', href: '/staff' },
    { id: 'services', label: 'Services', icon: 'list', href: '/services' },
    { id: 'inventory', label: 'Inventory', icon: 'package', href: '/inventory' },
    { id: 'marketing', label: 'Marketing', icon: 'megaphone', href: '/marketing' },
    { id: 'reputation', label: 'Reputation', icon: 'star', href: '/reputation' },
    { id: 'reports', label: 'Reports', icon: 'chart-bar', href: '/reports' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' }
  ],
  defaultView: 'calendar',
  features: {
    tables: false,
    formulas: true,         // ← KEY DIFFERENTIATOR
    inventory: true,
    memberships: false,
    classes: false,
    waitlist: false,
    deliveryOrders: false,
    kitchenDisplay: false,
    vehicleProfiles: false,
    petProfiles: false,
    medicalIntake: false,
    paws: false,
    menuManagement: false,
    tipDistribution: false
  },
  checkout: {
    showTip: true,
    defaultTipPercentages: [18, 20, 25],
    requireStaffSelection: true,
    splitPayEnabled: false,
    tabEnabled: false,
    depositRequired: false,
    defaultDepositType: 'none',
    defaultDepositValue: 0
  }
  // ... etc
};
```

### Restaurant

```typescript
const restaurantConfig: VerticalConfig = {
  verticalId: 'restaurant',
  displayName: 'Restaurant',
  terminology: {
    client: 'Guest',
    clients: 'Guests',
    staff: 'Server',
    staffMembers: 'Staff',
    booking: 'Reservation',
    bookings: 'Reservations',
    service: 'Menu Item',
    services: 'Menu',
    location: 'Restaurant',
    checkout: 'Close Tab',
    tip: 'Gratuity',
    schedule: 'Reservations',
    noShow: 'No Show',
    cancellation: 'Cancellation'
  },
  navigation: [
    { id: 'home', label: 'Home', icon: 'home', href: '/dashboard' },
    { id: 'floor', label: 'Floor Plan', icon: 'grid', href: '/floor', addons: ['table_management'] },
    { id: 'orders', label: 'Orders', icon: 'receipt', href: '/orders' },
    { id: 'reservations', label: 'Reservations', icon: 'calendar', href: '/reservations' },
    { id: 'menu', label: 'Menu', icon: 'menu-alt', href: '/menu' },
    { id: 'kds', label: 'Kitchen Display', icon: 'monitor', href: '/kds', addons: ['kitchen_display'] },
    { id: 'delivery', label: 'Delivery', icon: 'truck', href: '/delivery', addons: ['doordash'] },
    { id: 'staff', label: 'Staff', icon: 'users', href: '/staff' },
    { id: 'guests', label: 'Guest Book', icon: 'book', href: '/clients' },
    { id: 'reports', label: 'Reports', icon: 'chart-bar', href: '/reports' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' }
  ],
  defaultView: 'floor',
  features: {
    tables: true,           // ← RESTAURANT SPECIFIC
    formulas: false,
    inventory: true,        // Food inventory
    memberships: false,
    classes: false,
    waitlist: true,         // Walk-in waitlist
    deliveryOrders: true,   // ← RESTAURANT SPECIFIC
    kitchenDisplay: true,   // ← RESTAURANT SPECIFIC
    vehicleProfiles: false,
    petProfiles: false,
    medicalIntake: false,
    paws: false,
    menuManagement: true,   // ← RESTAURANT SPECIFIC
    tipDistribution: true   // ← RESTAURANT SPECIFIC
  },
  checkout: {
    showTip: true,
    defaultTipPercentages: [18, 20, 25],
    requireStaffSelection: false,   // Tabs don't require server attribution
    splitPayEnabled: true,          // ← RESTAURANT SPECIFIC
    tabEnabled: true,               // ← RESTAURANT SPECIFIC
    depositRequired: false,
    defaultDepositType: 'none',
    defaultDepositValue: 0
  }
};
```

### Gym / Fitness

```typescript
const gymConfig: VerticalConfig = {
  verticalId: 'gym',
  displayName: 'Gym',
  terminology: {
    client: 'Member',
    clients: 'Members',
    staff: 'Coach',
    staffMembers: 'Coaches',
    booking: 'Session',
    bookings: 'Sessions',
    service: 'Class',
    services: 'Classes',
    location: 'Gym',
    checkout: 'Checkout',
    tip: 'Tip',
    schedule: 'Class Schedule',
    noShow: 'No Show',
    cancellation: 'Cancellation'
  },
  navigation: [
    { id: 'home', label: 'Home', icon: 'home', href: '/dashboard' },
    { id: 'schedule', label: 'Class Schedule', icon: 'calendar', href: '/classes', addons: ['class_management'] },
    { id: 'checkin', label: 'Check-In', icon: 'check-circle', href: '/checkin' },
    { id: 'members', label: 'Members', icon: 'users', href: '/clients' },
    { id: 'memberships', label: 'Memberships', icon: 'badge', href: '/memberships', addons: ['membership_management'] },
    { id: 'trainers', label: 'Coaches', icon: 'dumbbell', href: '/staff' },
    { id: 'sessions', label: 'PT Sessions', icon: 'clipboard', href: '/appointments' },
    { id: 'marketing', label: 'Marketing', icon: 'megaphone', href: '/marketing' },
    { id: 'reports', label: 'Reports', icon: 'chart-bar', href: '/reports' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' }
  ],
  defaultView: 'calendar',
  features: {
    tables: false,
    formulas: false,
    inventory: true,        // Equipment/supplement inventory
    memberships: true,      // ← GYM SPECIFIC
    classes: true,          // ← GYM SPECIFIC
    waitlist: false,
    deliveryOrders: false,
    kitchenDisplay: false,
    vehicleProfiles: false,
    petProfiles: false,
    medicalIntake: false,
    paws: true,             // ← GYM SPECIFIC (health screening)
    menuManagement: false,
    tipDistribution: false
  },
  checkout: {
    showTip: false,         // Gyms don't typically tip
    defaultTipPercentages: [],
    requireStaffSelection: true,
    splitPayEnabled: false,
    tabEnabled: false,
    depositRequired: false,
    defaultDepositType: 'none',
    defaultDepositValue: 0
  }
};
```

---

## FULL SIDEBAR NAVIGATION — ALL VERTICALS

### How the sidebar renders

The sidebar is rendered from the active VerticalConfig. Each nav item is:
1. Filtered by plan (if user's plan doesn't include it, it's hidden entirely — not grayed out)
2. Filtered by addon (if addon not active, shown with "upgrade" indicator)
3. Ordered by VerticalConfig.navigation array

The sidebar never shows navigation items that are irrelevant to the vertical. A restaurant owner never sees "Color Studio." A gym never sees "Floor Plan" unless they explicitly enable table management for class layouts.

### Sidebar Visual Design

```
┌─────────────────────────────────────┐
│  kasse.                             │ ← Logo
│  Luxe Hair Studio          ▾        │ ← Business name + location picker
├─────────────────────────────────────┤
│                                     │
│  ⌂  Home                           │
│  📅  Appointments            ← ACTIVE
│  👥  Clients                        │
│  🎨  Color Studio           · NEW   │ ← With badge
│  ✂️  Stylists                       │
│  📋  Services                       │
│  📦  Inventory              ⚠ 2    │ ← Alert badge
│  📢  Marketing                      │
│  ⭐  Reputation              1      │ ← Count badge
│  📊  Reports                        │
│                                     │
├─────────────────────────────────────┤
│  ⚙️  Settings                       │
│  ❓  Help                           │
│  👤  Jennifer (you)          ▾      │ ← Current user + role
└─────────────────────────────────────┘
```

The sidebar is the same visual design regardless of vertical. Only the labels and items change.

---

## DASHBOARD WIDGETS — PER VERTICAL

### Dashboard Widget Registry

Every dashboard is a grid of configurable widgets. Merchants can drag/reorder widgets (Phase 6+). Default configuration is set per vertical.

```typescript
type DashboardWidget = 
  | 'today_schedule'          // Today's appointments/reservations/classes
  | 'today_revenue'           // Running total today
  | 'quick_actions'           // Most common actions for this vertical
  | 'staff_status'            // Who's in, who's out, who's busy
  | 'active_tables'           // Restaurant: floor at a glance
  | 'queue_status'            // Barbershop: walk-in queue
  | 'class_fill_rates'        // Gym: today's class capacity
  | 'member_check_ins'        // Gym: today's member check-in count
  | 'active_orders'           // Restaurant: open orders
  | 'delivery_queue'          // Restaurant: delivery orders pending
  | 'low_inventory_alerts'    // Any vertical with inventory
  | 'upcoming_appointments'   // Client list of next 5 appointments
  | 'ai_receptionist_log'     // AI receptionist: last 24 hour summary
  | 'lapsed_clients'          // Clients who haven't visited (configurable threshold)
  | 'revenue_chart_7d'        // 7-day revenue trend line
  | 'top_services_today'      // Most sold services today
  | 'reviews_recent'          // Latest Google/Yelp reviews
  | 'marketing_performance'   // Campaign metrics
  | 'expiring_memberships'    // Gym: memberships expiring soon
  | 'birthday_today'          // Clients with birthday today
```

**Salon default dashboard:**
1. Today's Schedule (full width)
2. Today Revenue (half) + Staff Status (half)
3. AI Receptionist Log (half) + Low Inventory Alerts (half)
4. Lapsed Clients to Re-engage (full width — proactive)
5. Recent Reviews (half) + Revenue Chart 7d (half)

**Restaurant default dashboard:**
1. Active Tables (full width)
2. Today Revenue + Covers (half) + Active Orders (half)
3. Delivery Queue (half) + Staff Status (half)
4. Today's Reservations Upcoming (full width)
5. Low Inventory Alerts (half) + Top Menu Items Today (half)

**Gym default dashboard:**
1. Class Fill Rates (today's classes — full width)
2. Member Check-Ins Today + Expiring Memberships (half each)
3. Today Revenue + New Members This Month (half each)
4. Lapsed Members (30+ days inactive) (full width)
5. AI Receptionist Log (half) + Revenue Chart 7d (half)

**Barbershop default dashboard:**
1. Queue Status (full width — most important)
2. Today Revenue + Barbers Active (half each)
3. Today's Schedule (appointments, if any) (full width)
4. Recent Reviews (half) + Lapsed Clients (half)

---

## MULTI-LOCATION PORTAL

For Pro+ merchants with multiple locations:

**Location picker (top of sidebar):**

```
  Luxe Hair Studio          ▾
  ──────────────────────────
  📍 Corpus Christi (active)
  📍 San Antonio
  ──────────────────────────
  📊 All Locations (aggregate view)
  ──────────────────────────
  ⚙ Manage Locations
```

When "All Locations" is selected:
- Dashboard shows aggregate revenue, aggregate appointments, aggregate staff count
- Each widget shows data broken down by location with comparison bars
- Cannot take actions on individual appointments (must switch to specific location)

**Per-location settings:**
Each location has its own:
- Service menu (can inherit from master or customize)
- Staff assignments
- Operating hours
- Booking page URL
- Payment processing (same Reyna Pay account, separate location IDs)
- Inventory (not shared — each location has its own)

**Cross-location features:**
- Client profiles are shared across locations (client who visits Corpus Christi can book at San Antonio and their history is visible)
- Gift cards work across locations
- Staff can be assigned to multiple locations (appears on both locations' schedules)

---

## SUPERADMIN VIEW (Kasse Internal — Master Portal)

The "master portal" is Robert's view across all Kasse merchants. This is the SalonTransact master portal model applied to the full Kasse platform.

The superadmin has access to:
- All merchant accounts (read-only impersonation — can view any merchant's portal as an admin overlay)
- Platform-wide revenue, transaction volume, MRR
- Merchant churn/retention analytics
- Franchise system oversight across all franchise merchants
- Support ticket escalation triage
- Billing management
- Feature flag control
- Platform health monitoring

The superadmin dashboard is an entirely separate application at admin.kasseapp.com (not accessible from the merchant portal).

---

## CLIENT-FACING PORTAL (client.kasseapp.com)

Separate from the merchant portal, clients have their own lightweight portal:

```
[BUSINESS NAME] — Client Portal

Welcome back, Sarah! 👋

YOUR UPCOMING APPOINTMENTS:
  Tuesday, Oct 22 at 10:00 AM
  Balayage with Jennifer
  Luxe Hair Studio — 123 Main St, Corpus Christi
  [Reschedule]  [Cancel]

YOUR RECENT VISITS:
  Oct 14 — Balayage + Toner — $185 ⭐⭐⭐⭐⭐
  Aug 14 — Balayage + Toner — $160
  Jun 3  — Root Touch-up — $95

GIFT CARDS:
  Balance: $50.00
  Card #: ****8234

LOYALTY:
  847 points — $8.47 toward next visit
  
[Book a New Appointment]
```

The client portal URL is:
- Default: [businessname].kasseapp.com/clients
- Custom domain: book.[yourdomain].com/clients

Client logs in via:
- Magic link (email) — most common
- Phone number + SMS OTP
- No password required

Client can:
- View upcoming appointments
- Cancel or reschedule (within cancellation policy)
- View visit history
- Check gift card balance
- Check loyalty points
- Update contact information

Client cannot:
- See other clients
- See staff personal information
- See business financial data

---

## STAFF-FACING PORTAL (Mobile-Optimized)

Staff members log in to a mobile-first version of Kasse.

Staff can:
- View their own schedule
- View client profiles for their upcoming appointments
- See their daily commission and tip total
- Check in and check out clients
- Add formula cards (if Color addon active)
- Take payment (if given checkout permissions by owner)
- Clock in and clock out (if Time & Attendance addon active)
- Request time off

Staff cannot (by default):
- View other staff's earnings
- View business financial reports
- Modify business settings
- Access client contact information beyond what's needed for their appointment

**Permission levels (configurable by owner):**

| Permission | Default Staff | Senior Staff | Manager |
|-----------|--------------|--------------|---------|
| View own schedule | ✅ | ✅ | ✅ |
| View all staff schedules | ❌ | ✅ | ✅ |
| Process checkout | ✅ | ✅ | ✅ |
| Issue refunds | ❌ | ❌ | ✅ |
| Access client contact info | Limited | ✅ | ✅ |
| View financial reports | ❌ | ❌ | ✅ |
| Modify service menu | ❌ | ❌ | ✅ |
| Add/edit staff | ❌ | ❌ | ✅ |
| Manage inventory | ❌ | ✅ | ✅ |
| Override no-show fees | ❌ | ❌ | ✅ |

---

## BUILD PLAN — PORTAL ARCHITECTURE

### Phase 4 — Vertical Config System (3 commits)

**Commit 1: VerticalConfig schema + registry**
- Define VerticalConfig TypeScript interface
- Implement all config values for: salon, barbershop, restaurant, gym, retail
- Wire terminology to all existing UI strings (replace hardcoded "Appointment" with `config.terminology.booking` throughout)

**Commit 2: Dynamic navigation**
- Render sidebar from VerticalConfig.navigation
- Apply plan-gating to nav items
- Apply addon-gating with upgrade prompts

**Commit 3: Dashboard widget system**
- Widget registry
- Dashboard layout config per vertical
- Widget data fetching layer
- Drag-to-reorder (optional — can be Phase 6)

### Phase 5 — Floor Plan View (Restaurant)
- Table map renderer (canvas or SVG-based)
- Table status management
- Waitlist integration with floor plan

### Phase 6 — Multi-Location Portal
- Location picker
- Aggregate view
- Cross-location client profiles

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 4 kickoff*
