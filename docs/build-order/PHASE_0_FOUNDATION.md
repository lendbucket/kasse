# PHASE 0 — FOUNDATION

**Scope:** Schema, Role, Theme, Vertical, Plan, Engine Client, Observability, Feature Flags, i18n, Custom Fields, Tags, Audit, Status Page.
**Total PRs:** 120
**Status:** `[BLOCKS]` everything else. Cannot start P1 until P0 is fully merged.
**Gates:** P0.E and P0.F have build-only work; their wire-up activation is gated on Reyna Pay engine being live.

This is the foundation that the next 5,055 PRs depend on. Every architectural decision (ABO-001 through ABO-010) lands here. After P0 merges, no PR ever again hardcodes a role string, a vertical-specific term, a plan-tier check, a theme color, or an engine endpoint.

---

## P0.A — Role + Permission System (15 PRs)

**Goal:** Replace `User.role` string with a `Role` enum at the database level. Build the 200+ permission key infrastructure that all subsequent role-gated UI and API will use. Enable custom roles, multi-location hierarchy, and per-resource permission overrides.

**Reference docs:** KASSE_PORTALS.md (4-portal architecture), KASSE_PORTAL_ARCHITECTURE.md (role hierarchy), KASSE_STRATEGIC_DECISIONS.md SD-K-001 (multi-tenant security).

### P0.A.1 — Migration: drop String User.role, add Role enum

Files: `prisma/schema.prisma`, `prisma/migrations/<timestamp>_role_enum/migration.sql`, `prisma/seed.ts`

Add enum at top of schema:
```prisma
enum Role {
  SUPERADMIN
  OWNER
  MANAGER
  STAFF
  STAFF_VIEW_ONLY
  CLIENT
  FRANCHISE_OWNER
  ACCOUNTANT
  BUSINESS_PARTNER
}
```

Change `User.role` from `String @default("staff")` to `Role @default(STAFF)`. Migration must:
1. Add new `role_new` column of type `Role` nullable
2. Backfill: `WHERE role = 'owner'` → `OWNER`, `WHERE role = 'manager'` → `MANAGER`, `WHERE role = 'staff'` → `STAFF`, `WHERE role = 'admin'` → `SUPERADMIN`, else → `STAFF`
3. Drop old `role` column
4. Rename `role_new` to `role`, make non-nullable

Acceptance: All existing users have correct Role enum. Login still works. `npx prisma generate` runs clean.

### P0.A.2 — Seed: backfill org-creator users to OWNER

Files: `prisma/seed.ts`, `scripts/backfill-org-owners.ts`

For each Organization, identify the first User created (smallest createdAt) and ensure their role is OWNER. Any other org-admin-historic users keep current role.

Acceptance: Every Organization has at least one OWNER. Idempotent (running twice is safe).

### P0.A.3 — `lib/permissions/types.ts`: 200+ permission keys

Files: `lib/permissions/types.ts`

Enumerate every permission key by category. Format:
```typescript
export const Permissions = {
  POS: {
    OPEN_CHECKOUT: 'pos.open_checkout',
    PROCESS_PAYMENT: 'pos.process_payment',
    APPLY_DISCOUNT: 'pos.apply_discount',
    OVERRIDE_PRICE: 'pos.override_price',
    REFUND_TRANSACTION: 'pos.refund_transaction',
    VOID_TRANSACTION: 'pos.void_transaction',
    REPRINT_RECEIPT: 'pos.reprint_receipt',
    OPEN_CASH_DRAWER: 'pos.open_cash_drawer',
    CLOSE_BATCH: 'pos.close_batch',
  },
  APPOINTMENTS: {
    VIEW_ALL: 'appointments.view_all',
    VIEW_OWN: 'appointments.view_own',
    CREATE: 'appointments.create',
    EDIT_OWN: 'appointments.edit_own',
    EDIT_ANY: 'appointments.edit_any',
    CANCEL_OWN: 'appointments.cancel_own',
    CANCEL_ANY: 'appointments.cancel_any',
    NO_SHOW: 'appointments.mark_no_show',
    CHECK_IN: 'appointments.check_in',
    OVERRIDE_DOUBLE_BOOK: 'appointments.override_double_book',
  },
  CLIENTS: {
    VIEW_LIST: 'clients.view_list',
    VIEW_DETAIL: 'clients.view_detail',
    CREATE: 'clients.create',
    EDIT: 'clients.edit',
    DELETE: 'clients.delete',
    MERGE: 'clients.merge',
    EXPORT: 'clients.export',
    MESSAGE: 'clients.message',
    VIEW_FAMILY: 'clients.view_family',
    VIEW_NOTES_OTHER_STAFF: 'clients.view_notes_other_staff',
  },
  STAFF: {
    VIEW_LIST: 'staff.view_list',
    VIEW_DETAIL: 'staff.view_detail',
    INVITE: 'staff.invite',
    EDIT: 'staff.edit',
    DEACTIVATE: 'staff.deactivate',
    SET_COMMISSION: 'staff.set_commission',
    VIEW_OTHER_SCHEDULES: 'staff.view_other_schedules',
    EDIT_OTHER_SCHEDULES: 'staff.edit_other_schedules',
  },
  SERVICES: {
    VIEW: 'services.view',
    CREATE: 'services.create',
    EDIT: 'services.edit',
    DELETE: 'services.delete',
    SET_PRICING: 'services.set_pricing',
    SET_COSTS: 'services.set_costs',
  },
  REPORTS: {
    VIEW_OWN: 'reports.view_own',
    VIEW_LOCATION: 'reports.view_location',
    VIEW_ORG: 'reports.view_org',
    EXPORT: 'reports.export',
    VIEW_FINANCIAL: 'reports.view_financial',
    VIEW_COMMISSION_OTHERS: 'reports.view_commission_others',
  },
  FINANCIAL: {
    VIEW_REVENUE: 'financial.view_revenue',
    VIEW_PAYOUTS: 'financial.view_payouts',
    VIEW_DISPUTES: 'financial.view_disputes',
    ISSUE_REFUND: 'financial.issue_refund',
    VIEW_BANK_ACCOUNT: 'financial.view_bank_account',
    EDIT_BANK_ACCOUNT: 'financial.edit_bank_account',
  },
  PAYROLL: {
    VIEW_OWN: 'payroll.view_own',
    VIEW_ALL: 'payroll.view_all',
    RUN_PAYROLL: 'payroll.run_payroll',
    EDIT_RATES: 'payroll.edit_rates',
    APPROVE_TIMECARDS: 'payroll.approve_timecards',
  },
  BILLING: {
    VIEW_PLAN: 'billing.view_plan',
    CHANGE_PLAN: 'billing.change_plan',
    VIEW_INVOICES: 'billing.view_invoices',
    UPDATE_PAYMENT_METHOD: 'billing.update_payment_method',
  },
  MARKETING: {
    VIEW_CAMPAIGNS: 'marketing.view_campaigns',
    CREATE_CAMPAIGN: 'marketing.create_campaign',
    SEND_CAMPAIGN: 'marketing.send_campaign',
    EDIT_AUTOMATIONS: 'marketing.edit_automations',
    RESPOND_REVIEWS: 'marketing.respond_reviews',
  },
  INVENTORY: {
    VIEW: 'inventory.view',
    EDIT_STOCK: 'inventory.edit_stock',
    CREATE_PRODUCT: 'inventory.create_product',
    CREATE_PO: 'inventory.create_po',
    APPROVE_PO: 'inventory.approve_po',
  },
  SETTINGS: {
    VIEW_GENERAL: 'settings.view_general',
    EDIT_GENERAL: 'settings.edit_general',
    EDIT_BRANDING: 'settings.edit_branding',
    EDIT_LOCATIONS: 'settings.edit_locations',
    EDIT_INTEGRATIONS: 'settings.edit_integrations',
    EDIT_TAX: 'settings.edit_tax',
    EDIT_ROLES: 'settings.edit_roles',
  },
  AI: {
    VIEW_RECEPTIONIST: 'ai.view_receptionist',
    EDIT_RECEPTIONIST: 'ai.edit_receptionist',
    VIEW_CALL_LOG: 'ai.view_call_log',
  },
  ADMIN: {
    IMPERSONATE: 'admin.impersonate',
    SUSPEND_MERCHANT: 'admin.suspend_merchant',
    APPLY_CREDIT: 'admin.apply_credit',
    CHANGE_MERCHANT_PLAN: 'admin.change_merchant_plan',
    VIEW_AUDIT_LOG: 'admin.view_audit_log',
    FEATURE_FLAG_TOGGLE: 'admin.feature_flag_toggle',
  },
} as const;

export type PermissionKey = TypedPermissionKeys; // flatten to string union
```

Acceptance: All keys typed. No string literals for permissions used anywhere else.

### P0.A.4 — `lib/permissions/check.ts`: helpers

Files: `lib/permissions/check.ts`

Implement:
- `requireRole(session, role: Role): asserts session.user.role === role`
- `requireAnyRole(session, roles: Role[]): asserts session.user.role in roles`
- `can(session, action: PermissionKey, resource?: { ownerId?: string; locationId?: string }): boolean`
- `requirePermission(session, action: PermissionKey, resource?: object): void` (throws 403)

`can()` evaluates in order:
1. SUPERADMIN → always true
2. Check denyList on user
3. Check user-level grant on user
4. Check role default for user.role
5. Apply resource constraints (e.g., "STAFF can only view_own appointments if appointment.staffId === user.staffId")
6. Return false

Acceptance: Unit tests for every role × permission combination. Coverage >95%.

### P0.A.5 — `lib/permissions/defaults.ts`: default permission sets per role

Files: `lib/permissions/defaults.ts`

Map every `Role` to its default `PermissionKey[]` per the matrices in KASSE_PORTAL_ARCHITECTURE.md. OWNER gets ~all permissions, MANAGER gets ~all except Financial/Payroll/Billing/edit_roles, STAFF gets own-scoped permissions, STAFF_VIEW_ONLY gets read-only own-scoped, CLIENT gets only client-portal permissions, ACCOUNTANT gets read-only Financial + Reports, BUSINESS_PARTNER gets read-only everything except settings.

Acceptance: Each role's default set is testable. Manager set is empty for Financial.* / Payroll.run_payroll / Billing.* / Settings.edit_roles.

### P0.A.6 — `PermissionSet` table + seed

Files: `prisma/schema.prisma`, `prisma/migrations/<ts>_permission_sets/migration.sql`, `prisma/seed.ts`

```prisma
model PermissionSet {
  id             String   @id @default(cuid())
  organizationId String?  // null = system default
  name           String
  permissions    String[] // PermissionKey[]
  isSystem       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  organization   Organization? @relation(fields: [organizationId], references: [id])
}
```

Seed system permission sets: "Owner Default", "Manager Default", "Staff Default", "Staff View Only", "Client Default", "Accountant Default", "Business Partner Default".

Acceptance: Seven system PermissionSets exist after seed runs. Idempotent.

### P0.A.7 — `middleware.ts`: route-tree guards

Files: `middleware.ts`

NextJS middleware that gates route trees by role:
- `/admin/*` → requires SUPERADMIN, else redirect to `/`
- `/dashboard/*` → requires OWNER | MANAGER | ACCOUNTANT | BUSINESS_PARTNER, else redirect to role-appropriate portal
- `/staff/*` → requires STAFF | STAFF_VIEW_ONLY, else redirect
- `/client/*` → requires CLIENT, else redirect
- `/kiosk/*` → PIN-protected (validated via kiosk session, not user session)
- `/book/*` → public, no guard
- `/(marketing)/*` → public, no guard
- `/(public)/*` → public, no guard

If user has multiple roles available (e.g., user is both OWNER of one org and STAFF of another), use the active org's role.

Acceptance: Manual test each route tree from each role. 403/redirect for wrong role.

### P0.A.8 — Login redirect-by-role

Files: `app/login/page.tsx`, `lib/auth.ts`

After successful login, redirect user based on their primary role:
- SUPERADMIN → `/admin`
- OWNER → `/dashboard`
- MANAGER → `/dashboard`
- STAFF / STAFF_VIEW_ONLY → `/staff`
- CLIENT → `/client`
- ACCOUNTANT → `/dashboard` (accountant view subset)
- BUSINESS_PARTNER → `/dashboard` (BP view subset)

Acceptance: Login as each role type lands on correct portal. No flash of wrong portal.

### P0.A.9 — `usePermissions()` hook

Files: `lib/permissions/usePermissions.ts`

Client hook that reads current session and exposes:
- `can(action, resource?)`
- `cannot(action, resource?)`
- `role`
- `permissions: PermissionKey[]`

Memoized per session.

Acceptance: Used in 1 component as smoke test. Snapshot matches expected for each role.

### P0.A.10 — `<PermissionGate>` component

Files: `components/permission/PermissionGate.tsx`

```tsx
<PermissionGate permission="financial.view_revenue" fallback={null}>
  <RevenueCard />
</PermissionGate>
```

Props: `permission` (single) or `anyOf` (array) or `allOf` (array), `resource` (object), `fallback` (ReactNode). Defaults to rendering nothing when permission denied.

Acceptance: Storybook-style isolated test renders correctly for each role.

### P0.A.11 — CustomRole schema

Files: `prisma/schema.prisma`, `prisma/migrations/<ts>_custom_roles/migration.sql`

```prisma
model CustomRole {
  id             String   @id @default(cuid())
  organizationId String
  name           String   // "Receptionist", "Shift Lead", etc.
  basedOn        Role     // template role
  permissions    String[] // PermissionKey[] overrides
  createdAt      DateTime @default(now())
  createdBy      String   // userId
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@unique([organizationId, name])
}

// Add to User:
// customRoleId   String?
// customRole     CustomRole? @relation(fields: [customRoleId], references: [id])
```

Acceptance: Migration applies cleanly. User can be assigned custom role.

### P0.A.12 — Custom Role builder UI

Files: `app/dashboard/settings/team/roles/page.tsx`, `app/dashboard/settings/team/roles/[id]/page.tsx`, `components/settings/CustomRoleBuilder.tsx`

OWNER-only. List existing custom roles, create new, edit permissions checklist grouped by category. Confirm dialog on delete (cannot delete if users assigned).

Acceptance: OWNER can create "Receptionist" role from MANAGER template, remove `staff.view_other_schedules`, save, assign to a user.

### P0.A.13 — Multi-location permission inheritance

Files: `lib/permissions/check.ts` (extend), `prisma/schema.prisma` (Region/Brand/Concept)

Add `Region`, `Brand`, `Concept`, `Location` hierarchy:
```prisma
model Region {
  id             String @id @default(cuid())
  organizationId String
  name           String
  brands         Brand[]
  organization   Organization @relation(fields: [organizationId], references: [id])
}
model Brand {
  id        String @id @default(cuid())
  regionId  String
  name      String
  concepts  Concept[]
  region    Region @relation(fields: [regionId], references: [id])
}
model Concept {
  id        String @id @default(cuid())
  brandId   String
  name      String
  locations Location[]
  brand     Brand @relation(fields: [brandId], references: [id])
}
// Location gets:
// conceptId  String?
```

User can be granted permissions scoped at Region, Brand, Concept, or Location level. Permission check walks up the hierarchy.

Acceptance: User with "Brand Manager: Salon Envy USA" sees both Corpus Christi + San Antonio locations but no others.

### P0.A.14 — Audit log on permission changes

Files: `lib/audit/log.ts`, `lib/permissions/*` (instrument)

Any change to: User.role, User.customRoleId, CustomRole.permissions, PermissionSet.permissions → AuditLog entry with before/after JSON. Actor, IP, user agent captured.

Acceptance: Change a user's role, see AuditLog entry in admin viewer.

### P0.A.15 — Cleanup: remove FINANCIAL string-filter (replaces PR #40)

Files: `components/layout/Sidebar.tsx`, `components/layout/nav-items.ts` (or replacement)

If PR #40 already merged: refactor to use `can('financial.view_revenue')` instead of string role check. If PR #40 not merged: close it, this PR replaces it.

Acceptance: FINANCIAL section visibility now driven by permission check, not role string.

---

## P0.B — Theme System (12 PRs)

**Goal:** Per-org theme overrides via CSS variables. RN-compatible (no DOM coupling in shared theme files). Foundation for white-label deployments later.

**Reference docs:** EMPIRE_ARCHITECTURE.md (shared packages), KASSE_STRATEGIC_DECISIONS.md SD-K-005, SD-K-006.

### P0.B.1 — `lib/theme/types.ts`: ThemeConfig interface

Files: `lib/theme/types.ts`

```typescript
export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;     // brand color
    primaryHover: string;
    background: string;
    surface: string;     // card bg
    border: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  logo: { light: string; dark: string };
  copy: {
    productName: string;       // "Kasse" | "SalonTransact" | etc.
    poweredBy: string;         // "Powered by Reyna Pay"
    supportEmail: string;
  };
  emailTemplates: {
    senderName: string;
    senderEmail: string;
    footerHTML: string;
  };
  legal: {
    privacyUrl: string;
    termsUrl: string;
    dpaUrl: string;
  };
}
```

Acceptance: Types compile. No DOM imports.

### P0.B.2 — `lib/theme/defaults/kasse.ts`

Files: `lib/theme/defaults/kasse.ts`

Default Kasse light theme. Background `#ffffff`, page bg `#f7f8fa`, borders `#e5e7eb`, text `#111827`, accent `#606E74` (Kasse teal slate). Font Inter.

Acceptance: Object validates against `ThemeConfig`.

### P0.B.3 — `lib/theme/defaults/salontransact.ts`

Files: `lib/theme/defaults/salontransact.ts`

SalonTransact dark theme: bg `#0a0a0a`, surface `#1a1a1a`, accent `#C9A84C` gold, text `#fafafa`.

Acceptance: Validates against ThemeConfig.

### P0.B.4 — `lib/theme/defaults/salonbacked.ts`

Files: `lib/theme/defaults/salonbacked.ts`

SalonBacked dark theme: bg `#06080d`, surface `#0d1117`, accent `#606E74`, bright accent `#7a8f96`. Font Inter 14px. Lucide-react icons 16px stroke-width 1.5. No emojis.

Acceptance: Validates against ThemeConfig.

### P0.B.5 — Migration: Organization.themeOverride JSONB

Files: `prisma/schema.prisma`, `prisma/migrations/<ts>_theme_override/migration.sql`

```prisma
// Add to Organization:
// themeOverride  Json?    // Partial<ThemeConfig>
```

Acceptance: Migration applies. Existing orgs unaffected (NULL).

### P0.B.6 — `<ThemeProvider>` component

Files: `components/theme/ThemeProvider.tsx`, `app/layout.tsx` (wrap)

Reads current org's themeOverride, merges with default Kasse theme, injects CSS custom properties at `:root` via inline style tag. Re-renders on org switch.

Acceptance: Switching org with different `themeOverride.colors.primary` changes accent color across app.

### P0.B.7 — `useTheme()` hook

Files: `lib/theme/useTheme.ts`

Returns merged ThemeConfig for current org. Memoized.

Acceptance: Used in 1 component as smoke test.

### P0.B.8 — Replace hardcoded colors in `globals.css` with CSS vars

Files: `app/globals.css`

Every color that uses Kasse design system becomes `var(--color-primary)`, `var(--color-bg)`, etc. Bound to ThemeProvider output.

Acceptance: No literal hex codes in globals.css for theme-able colors. Visual diff before/after: zero.

### P0.B.9 — Replace hardcoded colors in `tailwind.config.ts` with CSS var references

Files: `tailwind.config.ts`

```typescript
colors: {
  primary: 'var(--color-primary)',
  background: 'var(--color-bg)',
  // ...
}
```

Acceptance: Tailwind compiles. Classes like `bg-primary` resolve correctly.

### P0.B.10 — Cross-product compat layer (RN-ready)

Files: `lib/theme/native.ts`

Same `ThemeConfig` shape, but native consumer (P8 iPad) uses a different applicator (React Native StyleSheet rather than CSS variables). This PR establishes the interface boundary; native applicator lands in P8.

Acceptance: TypeScript interface unchanged. Native layer is a thin wrapper.

### P0.B.11 — Theme preview UI in Settings

Files: `app/dashboard/settings/branding/page.tsx`, `components/settings/ThemePreview.tsx`

OWNER-only. Edit colors (color picker), logo upload, sender name, receipt footer. Live preview pane shows mock checkout, mock receipt, mock email. Save persists to `Organization.themeOverride`.

Acceptance: OWNER can change primary color, see immediate preview, save, see change applied across portal.

### P0.B.12 — Custom domain + sender per org

Files: `app/dashboard/settings/branding/domain/page.tsx`, `lib/email-template.ts` (extend)

Capture custom domain (for white-label), capture sender domain (must be DKIM-verified before activation), DNS verification flow. Status field on Organization.

Acceptance: OWNER enters domain, sees DNS records to add, status moves from PENDING → VERIFIED after DNS propagates.

---

## P0.C — VerticalConfig System (18 PRs)

**Goal:** All vertical-specific behavior (terminology, navigation, default services, KPIs, compliance) lives in TypeScript config files. Switching verticals or adding a new vertical = adding a new config object, not changing UI code.

**Reference docs:** KASSE_PORTALS.md (full VerticalConfig spec), KASSE_VERTICAL_SPECS.md, KASSE_VERTICALS_EXPANDED.md (33 verticals).

### P0.C.1 — `lib/verticals/types.ts`: VerticalConfig interface

Files: `lib/verticals/types.ts`

Full TypeScript interface from KASSE_VERTICALS_EXPANDED.md "VERTICAL CONFIGURATION SYSTEM" section:
```typescript
export interface VerticalConfig {
  id: VerticalId;
  displayName: string;
  terms: VerticalTerms;
  features: VerticalFeatures;
  navigation: NavigationItem[];
  dashboardWidgets: DashboardWidget[];
  defaultServices: ServiceTemplate[];
  onboardingChecklist: ChecklistItem[];
  compliance: VerticalCompliance;
  recommendedAddons: AddonId[];
  typicalPlan: PlanTier;
  averageAddonRevenue: number;
}

export type VerticalId =
  | 'salon' | 'barbershop' | 'nail_salon' | 'restaurant' | 'bar'
  | 'gym' | 'yoga_studio' | 'pilates_studio' | 'massage' | 'med_spa'
  | 'auto_detailing' | 'auto_repair' | 'pet_grooming' | 'veterinary'
  | 'tattoo' | 'retail' | 'food_truck' | 'cafe' | 'bakery'
  | 'catering' | 'cleaning' | 'photography' | 'tutoring'
  | 'childcare' | 'coworking' | 'sports_training' | 'beauty_school'
  | 'brow_studio' | 'lash_studio' | 'tanning_studio' | 'dance_studio'
  | 'martial_arts' | 'crossfit' | 'chiropractic' | 'physical_therapy'
  | 'general';
```

Acceptance: Types compile, exhaustive switch on VerticalId is enforced.

### P0.C.2 — Migration: Organization.verticalId + verticalConfigOverride

Files: `prisma/schema.prisma`, `prisma/migrations/<ts>_organization_vertical/migration.sql`

```prisma
enum VerticalId {
  salon
  barbershop
  // ... all 33
  general
}
// Add to Organization:
// verticalId               VerticalId @default(salon)
// verticalConfigOverride   Json?
```

Backfill existing orgs to `verticalId = 'salon'`.

Acceptance: Migration applies. Existing org-pickers default to salon.

### P0.C.3 — `lib/verticals/configs/salon.ts`

Files: `lib/verticals/configs/salon.ts`

Full salon config per KASSE_VERTICALS_EXPANDED.md "VERTICAL 1: SALON & BEAUTY (CORE)". Navigation includes: Dashboard, Appointments (Calendar, Today's Schedule, Waitlist), Clients (List, Relationship Scores, Win-Back), Stylists (Schedule, Commissions, Performance), Color Studio (Formula Library, Before/After, Analytics), Services, Inventory, POS, Reports, Marketing, AI Receptionist, Settings.

Terms: staff = "Stylists", client = "Guest", service = "Service", location = "Salon", formula = "Color Formula".

Features: colorStudio, formulaCards, commissionTracking, waiverForms, aiReceptionist, inventoryTracking, loyaltyProgram, giftCards all true. walkInQueue false. medicalIntake false.

Default services: Women's Haircut 45min $65, Men's Haircut 30min $35, Color (Single Process) 90min $85, Highlights 150min $145, Balayage 180min $200, Blowout 30min $40, Treatment 30min $35.

Compliance: licenseRequired true, licenseType "TDLR Cosmetology", waiverRequired true (chemical services).

Acceptance: Config validates against VerticalConfig type.

### P0.C.4 — `lib/verticals/configs/barbershop.ts`

Full barbershop config per VERTICAL 2. Walk-in queue features enabled. TV board navigation. Booth rent billing enabled. Terms: staff = "Barbers".

### P0.C.5 — `lib/verticals/configs/nail_salon.ts`

Full nail salon config per VERTICAL 6. MSDS log feature. Walk-in + appointment hybrid. Terms: staff = "Techs".

### P0.C.6 — `lib/verticals/configs/restaurant.ts`

Full restaurant config per VERTICAL 3. Features: tableManagement, kitchenDisplay, recipeBasedInventory, onlineOrdering, deliveryIntegrations, reservations, kdsDisplay all true. Navigation: Floor Plan (LIVE), Orders, Menu, KDS, Online Ordering, Delivery Integrations, Reservations, Staff, Inventory, Reports.

### P0.C.7 — `lib/verticals/configs/gym.ts`

Full gym config per VERTICAL 4. Features: membershipBilling, classScheduling, waiverForms (PAR-Q). Navigation: Dashboard, Members, Classes, Personal Training, Memberships, Front Desk, Waivers & Forms, Inventory (Retail), Reports.

### P0.C.8 — `lib/verticals/configs/med_spa.ts`

Full med spa config per VERTICAL 5. Features: medicalIntake, injectableTracking, hipaaMode all true. Terms: client = "Patient", service = "Treatment". Navigation includes Treatment Logs, Good Faith Exams, HIPAA Log.

### P0.C.9 — `lib/verticals/configs/massage.ts`

Per VERTICAL 9. Membership model emphasis. Wellness intake forms. Treatment room mgmt.

### P0.C.10 — `lib/verticals/configs/yoga_studio.ts`

Per VERTICAL 11. Class types: in-person, virtual, hybrid, on-demand, workshop, series, private. Class pass management.

### P0.C.11 — `lib/verticals/configs/auto_detailing.ts`

Per VERTICAL 7. Vehicle profiles model. License plate lookup. Step-by-step technician checklist. Fleet account management.

### P0.C.12 — `lib/verticals/configs/pet_grooming.ts`

Per VERTICAL 8. Pet profiles (species, breed, temperament, health conditions, vet contact). Vaccination tracking + alerts. Drop-off board.

### P0.C.13 — `lib/verticals/configs/general.ts`

Fallback config. Generic POS, generic appointments, no vertical-specific features. Used for verticals not yet built or for "Other" selection at signup.

### P0.C.14 — `lib/verticals/registry.ts`: getVerticalConfig(verticalId)

Files: `lib/verticals/registry.ts`

```typescript
const configs: Record<VerticalId, VerticalConfig> = {
  salon, barbershop, nail_salon, restaurant, gym, med_spa,
  massage, yoga_studio, auto_detailing, pet_grooming, general,
  // stubs for the rest in P0.C.18:
  bar, food_truck, cafe, bakery, /* ... */
};

export function getVerticalConfig(id: VerticalId): VerticalConfig {
  return configs[id] || configs.general;
}
```

Acceptance: Returns correct config for each vertical. Falls back to general for invalid.

### P0.C.15 — `useVerticalConfig()` hook

Files: `lib/verticals/useVerticalConfig.ts`

Returns merged config (base + org's `verticalConfigOverride`) for current organization. Memoized.

Acceptance: Used in 1 component as smoke test.

### P0.C.16 — `<VerticalTerm name="...">` component

Files: `components/vertical/VerticalTerm.tsx`

```tsx
<VerticalTerm name="client" /> // renders "Guest" for salon, "Patient" for med spa, "Member" for gym
<VerticalTerm name="client" plural /> // renders "Guests" / "Patients" / "Members"
```

Acceptance: Snapshot tests for salon, barbershop, restaurant, gym, med spa.

### P0.C.17 — Migration: backfill existing orgs to verticalId='salon'

Files: `prisma/migrations/<ts>_backfill_vertical_salon/migration.sql`, `scripts/backfill-vertical.ts`

UPDATE existing Organization rows SET verticalId = 'salon' WHERE verticalId IS NULL.

Acceptance: All existing orgs have salon vertical. Salon Envy locations confirmed salon.

### P0.C.18 — Add 20 skeleton vertical configs

Files: `lib/verticals/configs/{bar,food_truck,cafe,bakery,crossfit,pilates_studio,martial_arts,dance_studio,personal_training,auto_repair,tattoo,retail,boutique,cleaning_service,photography,chiropractic,childcare,tutoring,event_venue,coworking}.ts`

Each is a stub config: extends general with vertical-appropriate terms and basic navigation. Full features land in their respective phases (P36-P45).

Acceptance: All 33 verticals selectable in signup wizard. Each renders a functional portal even if features are minimal.

---

## P0.D — Plan Tier System (10 PRs)

**Goal:** Enforce plan tier limits (transactions/staff/locations/SMS) and addon enablement. UI shows upgrade prompts when feature is plan-locked.

**Reference docs:** KASSE_TIERS.md (5-tier structure: FREE, STARTER, GROWTH, PRO, ENTERPRISE + 40+ addons).

### P0.D.1 — Migration: Plan enum + Organization plan fields

Files: `prisma/schema.prisma`, `prisma/migrations/<ts>_plan_tier/migration.sql`

```prisma
enum Plan {
  FREE
  STARTER
  GROWTH
  PRO
  ENTERPRISE
}
// Add to Organization:
// planTier       Plan      @default(FREE)
// planStartedAt  DateTime?
// trialEndsAt    DateTime?
// planRenewsAt   DateTime?
```

Backfill existing orgs to `planTier = 'FREE'`.

Acceptance: Migration applies.

### P0.D.2 — `Addon` table

Files: `prisma/schema.prisma`, `prisma/migrations/<ts>_addon/migration.sql`

```prisma
model Addon {
  id                  String  @id        // "ai_receptionist_growth"
  name                String             // "AI Receptionist - Growth"
  category            String             // "AI" | "Marketing" | "Compliance" | etc.
  monthlyPrice        Int                // in cents
  requiredPlan        Plan               // minimum plan to enable
  verticalRestriction VerticalId[]       // empty array = all verticals
  description         String
  isActive            Boolean @default(true)
}
```

### P0.D.3 — `OrganizationAddon` table

Files: `prisma/schema.prisma`, `prisma/migrations/<ts>_org_addon/migration.sql`

```prisma
model OrganizationAddon {
  id              String   @id @default(cuid())
  organizationId  String
  addonId         String
  status          String   // "active" | "paused" | "canceled" | "trial"
  startedAt       DateTime @default(now())
  endsAt          DateTime?
  monthlyPriceCents Int             // captured at time of purchase
  organization    Organization @relation(fields: [organizationId], references: [id])
  addon           Addon @relation(fields: [addonId], references: [id])
  @@unique([organizationId, addonId])
}
```

### P0.D.4 — Seed: 40+ addons per KASSE_TIERS.md

Files: `prisma/seed.ts`, `prisma/seed-addons.ts`

Include at minimum:
- AI Receptionist (Lite $49, Standard $99, Growth $199)
- Kasse Color (Lite $19, Standard $39, Pro $69)
- Kasse Sites ($29)
- SMS Pack 1k ($25), SMS Pack 5k ($89)
- SalonBacked modules (Tax $19, Insurance $29, Payroll $49, Benefits $19)
- Accountant Access ($9)
- Business Partner Access ($9)
- Franchise Creator ($199 base + $29/franchisee)
- Reseller subscription ($499/mo)
- Kasse Connect (B2B Supply) ($0 + transaction margin)
- Marketplace Featured ($50)
- Independent Stylist tier ($29)
- Chemical Service Waivers Enhanced ($9)
- TDLR License Auto-Verify ($9)
- A2P 10DLC Dedicated Short Code ($499 setup + $99/mo)
- ... full list from KASSE_TIERS.md

Acceptance: All addons seeded. Catalog renders in pricing page.

### P0.D.5 — `lib/plan/limits.ts`: full limit definitions

Files: `lib/plan/limits.ts`

Per-plan limits from KASSE_TIERS.md:
```typescript
export const planLimits: Record<Plan, PlanLimits> = {
  FREE: { maxStaff: 1, maxLocations: 1, maxMonthlyTransactions: 50, smsPerMonth: 0, /* ... */ },
  STARTER: { maxStaff: 3, maxLocations: 1, maxMonthlyTransactions: 500, smsPerMonth: 200, /* ... */ },
  GROWTH: { maxStaff: 10, maxLocations: 2, maxMonthlyTransactions: 5000, smsPerMonth: 1000, /* ... */ },
  PRO: { maxStaff: 50, maxLocations: 10, maxMonthlyTransactions: 50000, smsPerMonth: 5000, /* ... */ },
  ENTERPRISE: { maxStaff: -1, maxLocations: -1, maxMonthlyTransactions: -1, smsPerMonth: -1, /* unlimited */ },
};
```

### P0.D.6 — `lib/plan/can.ts`: gating helpers

Files: `lib/plan/can.ts`

```typescript
export function canUseFeature(orgId: string, feature: PlanFeatureKey): boolean
export async function canAddResource(orgId: string, resourceType: 'staff' | 'location'): Promise<boolean>
export async function getCurrentUsage(orgId: string): Promise<UsageReport>
export function getRequiredPlan(feature: PlanFeatureKey): Plan
```

Acceptance: All gates testable. Returns false when limit hit.

### P0.D.7 — `usePlan()` hook

Files: `lib/plan/usePlan.ts`

Returns current org's `planTier`, active addons, usage, limits.

### P0.D.8 — `<PlanGate>` component

Files: `components/plan/PlanGate.tsx`

```tsx
<PlanGate feature="ai_receptionist" fallback={<UpgradePrompt feature="ai_receptionist" />}>
  <AIReceptionistSettings />
</PlanGate>
```

### P0.D.9 — Plan limit enforcement at API layer

Files: `app/api/staff/route.ts`, `app/api/locations/route.ts`, every relevant route

Every POST that creates a resource checks `canAddResource()`. Returns 402 (Payment Required) with `{ error: 'plan_limit_exceeded', requiredPlan: 'GROWTH' }` if blocked.

### P0.D.10 — `<UpgradePrompt>` component

Files: `components/plan/UpgradePrompt.tsx`

Standard component shown when feature is plan-locked. Shows: "This feature requires the X plan. [Compare plans]". Tracks impression for product analytics.

Acceptance: User on STARTER hits AI Receptionist setting → sees prompt → clicks → routed to plan comparison page.

---

## P0.E — Reyna Pay Engine Client (10 PRs) `[GATED: REYNA_PAY for wire-up]`

**Goal:** Build the typed engine client matching REYNA_PAY_API_SPEC.md. Code lands now; live wiring waits for Robert's signal that engine endpoints are deployed.

**Reference docs:** REYNA_PAY_API_SPEC.md (2397 lines, locked complete), KASSE_ENGINE_BOUNDARY.md.

### P0.E.1 — `lib/engine/client.ts`: base fetch wrapper

Files: `lib/engine/client.ts`

Implements: auth (Bearer token from env), idempotency key support, retries with exponential backoff (3 attempts, 1s/2s/4s), error mapping (engine error codes → typed errors), request ID generation, structured logging.

### P0.E.2 — `lib/engine/types.ts`: types from REYNA_PAY_API_SPEC.md

Files: `lib/engine/types.ts`

All TypeScript types matching the spec: Merchant, Customer, Card, Charge, Refund, Payout, Dispute, Webhook, CheckoutSession, Transaction, Report, ApiKey.

### P0.E.3 — `lib/engine/merchants.ts`

Implements: `createMerchant()`, `getMerchant()`, `updateMerchant()`, `listMerchants()`. All `[VERIFY]` — wire-up gated.

### P0.E.4 — `lib/engine/customers.ts`

`createCustomer()`, `getCustomer()`, `updateCustomer()`, `listCustomers()`, `deleteCustomer()`.

### P0.E.5 — `lib/engine/cards.ts`

`createCard()` (tokenization), `listCards()`, `chargeCard()`, `deleteCard()`. Also `createSecureToken()` for repeat customer flow.

### P0.E.6 — `lib/engine/charges.ts`

`createCharge()`, `getCharge()`, `captureCharge()` (for auth-only flows), `voidCharge()`.

### P0.E.7 — `lib/engine/refunds.ts`

`createRefund()`, `listRefunds()`.

### P0.E.8 — `lib/engine/payouts.ts`

`listPayouts()`, `getPayout()`.

### P0.E.9 — `lib/engine/disputes,checkout-sessions,webhooks,transactions,reports,api-keys.ts`

Remaining clients per spec.

### P0.E.10 — ESLint rule: only `app/api/**` imports `lib/engine/*`

Files: `eslint.config.mjs`

Custom rule that fails CI if any file outside `app/api/**` imports from `lib/engine/*`. Enforces the engine boundary architecturally.

Acceptance: Adding `import { engine } from '@/lib/engine/charges'` to a component throws lint error.

---

## P0.F — Reyna Pay Application Embedding (8 PRs) `[GATED: REYNA_PAY]`

**Goal:** Embed SalonTransact's public merchant application form in Kasse onboarding flow. Built now, activated when SalonTransact ships endpoints.

### P0.F.1 — `lib/engine/application.ts`: typed client

Application status types: NOT_STARTED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, APPROVED, DECLINED, NEEDS_INFO. Webhook handler signatures.

### P0.F.2 — Application status webhooks handler

Files: `app/api/webhooks/reynapay/application/route.ts`

Receives status transitions from SalonTransact. Updates `Organization.reynaPayApplicationStatus`. Triggers downstream actions (terminal ship, account boarding) on APPROVED.

### P0.F.3 — Document upload S3 integration

Files: `lib/storage/s3.ts`, `app/api/upload/route.ts`

S3 bucket for application docs (driver's license, voided check, etc.). Pre-signed URL flow. Server-side virus scan (ClamAV).

### P0.F.4 — E-sign infrastructure

Files: `lib/esign/index.ts`, `components/esign/SignaturePad.tsx`

DocuSign integration OR built-in pen-on-canvas with `react-signature-canvas`. Whichever is cleaner.

### P0.F.5 — OFAC + KYC/AML webhook handler

Files: `app/api/webhooks/reynapay/kyc/route.ts`

Updates application status on KYC clear/flag from SalonTransact.

### P0.F.6 — Application iframe component

Files: `components/onboarding/ApplicationEmbed.tsx`

Renders SalonTransact's public application form embedded in Kasse onboarding wizard (P1.C step 4). Pass orgId, return URL, callback webhook URL.

### P0.F.7 — Approval webhook → merchant activation

Files: `app/api/webhooks/reynapay/application/route.ts` (extend)

On APPROVED: set `Organization.reynaPayActive = true`, ship terminal (P5 trigger), send welcome email, enable POS routes.

### P0.F.8 — Terminal boarding webhook

Files: `app/api/webhooks/reynapay/terminal/route.ts`

Receives terminal-ready event. Creates `Terminal` record. Triggers in-app prompt to pair device.

---

## P0.G — Schema Foundations (15 PRs)

**Goal:** Add the 25 missing tables and fields needed by P1-P12.

### P0.G.1 — OnboardingSession table

```prisma
model OnboardingSession {
  id              String   @id @default(cuid())
  organizationId  String   @unique
  currentStep     Int      @default(1)
  stepData        Json     @default("{}")
  completedSteps  Int[]    @default([])
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  resumeToken     String   @unique @default(cuid())
  organization    Organization @relation(fields: [organizationId], references: [id])
}
```

### P0.G.2 — Organization onboarding + business fields

Add: `onboardingCompleted Boolean @default(false)`, `businessName String?`, `legalName String?`, `ein String?`, `dba String?`, `websiteUrl String?`.

### P0.G.3 — Location operational fields

Add: `timezone String` (required, default "America/Chicago"), `openingHours Json @default("{}")`, `taxRate Decimal @db.Decimal(5,4) @default(0)`, `addressLine2 String?`.

### P0.G.4 — User verification + 2FA fields

Add: `emailVerifiedAt DateTime?`, `twoFactorEnabled Boolean @default(false)`, `twoFactorSecret String?`, `isOwner Boolean @default(false)` (denormalized cache).

### P0.G.5 — CustomField table (polymorphic)

```prisma
model CustomField {
  id             String  @id @default(cuid())
  organizationId String
  entityType     String  // "client" | "appointment" | "staff" | "service"
  name           String
  type           String  // "text" | "number" | "date" | "select" | "checkbox"
  options        String[]
  required       Boolean @default(false)
  order          Int
}
model CustomFieldValue {
  id           String @id @default(cuid())
  customFieldId String
  entityId     String
  value        Json
  customField  CustomField @relation(fields: [customFieldId], references: [id])
  @@unique([customFieldId, entityId])
}
```

### P0.G.6 — Tag table (polymorphic taggable)

```prisma
model Tag {
  id             String @id @default(cuid())
  organizationId String
  name           String
  color          String?
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@unique([organizationId, name])
}
model TagAssignment {
  id         String @id @default(cuid())
  tagId      String
  entityType String
  entityId   String
  tag        Tag @relation(fields: [tagId], references: [id])
  @@unique([tagId, entityType, entityId])
}
```

### P0.G.7 — AuditLog enhancements

Extend existing AuditLog with: `entityType String`, `entityId String`, `before Json?`, `after Json?`, `ipAddress String?`, `userAgent String?`. Add indexes.

### P0.G.8 — Notification enhancements

Extend Notification with: `deliveryChannels String[]` (push, email, sms, in_app), `readAt DateTime?`, `actionUrl String?`, `category String`.

### P0.G.9 — FeatureFlag table

```prisma
model FeatureFlag {
  id            String  @id // "kasse_color_v2"
  description   String
  defaultValue  Boolean @default(false)
  rolloutPct    Int     @default(0)
  overrides     Json    @default("{}")  // { orgId: boolean }
  isActive      Boolean @default(true)
}
```

### P0.G.10 — SavedView table

```prisma
model SavedView {
  id             String   @id @default(cuid())
  userId         String
  entityType     String   // "clients" | "appointments" | ...
  name           String
  filters        Json
  sort           Json
  createdAt      DateTime @default(now())
  user           User @relation(fields: [userId], references: [id])
}
```

### P0.G.11 — EmailTemplate table

```prisma
model EmailTemplate {
  id              String  @id @default(cuid())
  organizationId  String?  // null = system template
  key             String  // "appointment_reminder" | "welcome"
  version         Int     @default(1)
  subject         String
  bodyHtml        String  @db.Text
  bodyText        String  @db.Text
  variables       Json    @default("[]")
  isActive        Boolean @default(true)
  @@unique([organizationId, key])
}
```

### P0.G.12 — Locale field on User and Organization

Add: `User.locale String @default("en-US")`, `Organization.defaultLocale String @default("en-US")`.

### P0.G.13 — Region / Brand / Concept hierarchy

(Covered in P0.A.13 — confirm tables exist.) Wire `Location.conceptId` foreign key. Backfill: every existing Location → default Concept → default Brand → default Region per org.

### P0.G.14 — Index every organizationId column

Files: `prisma/migrations/<ts>_idx_organization_id/migration.sql`

`CREATE INDEX idx_<table>_organization_id ON "<Table>"(organization_id);` for every table that has it. Critical for RLS performance later.

### P0.G.15 — MultiTenantCheck helpers

Files: `lib/tenant/check.ts`

Helper that asserts a fetched entity's `organizationId` matches session's active org. Used in every dynamic-route handler as defense-in-depth on top of RLS.

---

## P0.H — Observability + Feature Flags + i18n (15 PRs)

### P0.H.1 — Sentry integration (web)

Files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

Capture errors, performance traces, session replays. Per-org tagging.

### P0.H.2 — Structured logging

Files: `lib/log/index.ts`

Pino-based logger. JSON output. Fields: timestamp, level, requestId, userId, orgId, route, message, error.

### P0.H.3 — Request ID middleware

Files: `middleware.ts` (extend), `lib/request-id.ts`

Generate UUID per request. Set in response header `X-Request-Id`. Include in all logs.

### P0.H.4 — `lib/flags/`: evaluation infrastructure

Files: `lib/flags/index.ts`, `lib/flags/types.ts`

`evaluate(flagKey, context)` checks DB FeatureFlag → percentage rollout (hash userId/orgId) → org override → default.

### P0.H.5 — Percentage rollout logic

Files: `lib/flags/rollout.ts`

Stable hash of (flagKey + entityId) mod 100 → if < rolloutPct, return true. Same entity always gets same result.

### P0.H.6 — Per-org overrides

Files: `lib/flags/overrides.ts`

Look up `overrides[orgId]` in FeatureFlag JSON. Boolean override beats percentage.

### P0.H.7 — `useFlag(key)` hook

Files: `lib/flags/useFlag.ts`

### P0.H.8 — Feature flag admin UI (Master Portal stub)

Files: `app/admin/feature-flags/page.tsx`

SUPERADMIN-only. List flags, edit rollout %, toggle org overrides.

### P0.H.9 — next-i18next setup

Files: `next-i18next.config.js`, `app/i18n.ts`

### P0.H.10 — Locale detection

Files: `middleware.ts` (extend)

Priority: User.locale → Organization.defaultLocale → Accept-Language → "en-US".

### P0.H.11 — English translations (en-US)

Files: `locales/en-US/common.json`, `locales/en-US/onboarding.json`, etc.

Every UI string used in P0-P12 has an en-US translation.

### P0.H.12 — Spanish translations (es-MX, es-US)

Files: `locales/es-MX/*.json`, `locales/es-US/*.json`

Professional translation, not machine. Critical for Texas-first market with significant Spanish-speaking owner base.

### P0.H.13 — `<T id="key">` wrapper

Files: `components/i18n/T.tsx`

```tsx
<T id="onboarding.welcome.title" values={{ name: user.firstName }} />
```

### P0.H.14 — `useTranslation()` hook

Files: `lib/i18n/useTranslation.ts`

### P0.H.15 — Date/time/number localization

Files: `lib/i18n/format.ts`

`formatDate`, `formatCurrency`, `formatNumber`, `formatRelativeTime` using Intl API + user's locale + org's currency.

---

## P0.I — Custom Fields + Tags + Audit (12 PRs)

### P0.I.1 — Custom field UI builder

Files: `app/dashboard/settings/custom-fields/page.tsx`, `components/settings/CustomFieldBuilder.tsx`

OWNER-only. List existing custom fields by entity type, create new with type picker, set required + order.

### P0.I.2 — Custom field rendering in forms

Files: `components/forms/CustomFieldsSection.tsx`

Appended to every entity create/edit form (Client form, Appointment form, etc.). Pulls fields for that entityType. Validates required.

### P0.I.3 — Custom field filtering in lists

Files: `components/filters/CustomFieldFilter.tsx`

In list views (Clients, Appointments), filter chips for each custom field. Supports text contains, equals, select options.

### P0.I.4 — Custom field reporting

Files: `app/dashboard/reports/custom-fields/page.tsx`

Group/segment reports by custom field value. E.g., "Clients by Hair Type" if a custom field on Client is "Hair Type" with options [Straight, Wavy, Curly, Coily].

### P0.I.5 — Tag UI on any entity

Files: `components/tags/TagPicker.tsx`, `components/tags/TagList.tsx`

Inline tag editor on entity detail views. Autocomplete from existing org tags. Create-on-the-fly with color picker.

### P0.I.6 — Tag filtering everywhere

Files: list view filter integrations

Filter Clients by tag, Appointments by tag, etc.

### P0.I.7 — Tag-based segmentation

Files: `app/dashboard/marketing/segments/page.tsx`

Build marketing segments where tags are a primary filter dimension.

### P0.I.8 — Audit log viewer

Files: `app/admin/audit/page.tsx`

SUPERADMIN-only. Search by user, org, entity type, action, date range. Show before/after JSON diff.

### P0.I.9 — Audit log export

Files: `app/api/admin/audit/export/route.ts`

CSV export. Stream large result sets.

### P0.I.10 — Audit log retention policy

Files: `prisma/scheduled/audit-retention.ts`, Vercel cron

7-year retention. Older entries archived to cold storage S3. Hot DB only holds last 18 months.

### P0.I.11 — Audit log search + filter

Files: `app/admin/audit/page.tsx` (extend)

Full-text search on AuditLog (Postgres tsvector). Saved searches.

### P0.I.12 — Audit log API endpoint

Files: `app/api/v1/audit/route.ts`

SUPERADMIN-scoped. Queryable via API for forensics, compliance integrations.

---

## P0.J — Status Page + Error Tracking (5 PRs)

### P0.J.1 — status.kasseapp.com

Files: separate Next.js app or BetterStack/Statuspage integration

Public status page. Components: Web Portal, API, Webhooks, Mobile Apps, AI Receptionist, Email/SMS Delivery, Payment Processing (linked from SalonTransact).

### P0.J.2 — Incident communication workflow

Files: status page admin

When incident declared, post update template. Auto-fanout to email + SMS subscribers + RSS + webhook subscribers.

### P0.J.3 — Component-level uptime tracking

Files: `scripts/uptime-monitor.ts`

External uptime monitor pings each component endpoint. Auto-updates status page on failures.

### P0.J.4 — Webhook from monitoring → status page

Files: `app/api/internal/uptime-webhook/route.ts`

When monitor detects component degradation, auto-marks component as "Degraded performance" on status page.

### P0.J.5 — Email subscriber list

Files: status page integration

Customers can subscribe to status updates via email. SMS subscription deferred to Phase 1+ when A2P 10DLC is registered.

---

## PHASE 0 COMPLETION CRITERIA

- All 120 PRs merged to main
- All migrations applied to production (Supabase project nknuonxznhshrgfseeqc)
- All seed scripts run successfully
- Salon Envy Corpus Christi & San Antonio still functional (no regressions)
- ESLint engine-boundary rule enforced
- TypeScript builds clean (0 errors)
- All Phase 0 tests pass
- KASSE_REAL_BUILD_ORDER.md updated marking P0 ✅

**After P0:** Phase 1 (Onboarding) starts. Foundation is locked.
