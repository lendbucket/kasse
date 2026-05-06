# KASSE_PHASE_COMMITS.md
## Living Master — Every Phase, Every Commit, Every File
### Auto-updated every session | Version 1.0 | May 2026

---

## HOW TO USE THIS DOCUMENT

This is the single source of truth for what has been built, what is in progress, and what comes next. Every time a file is created, edited, or deleted in the Kasse repo, this document is updated. Every commit is logged here with its exact purpose, files touched, and what it unlocks.

**Update protocol:** At the end of every coding session, update this document before pushing. Never let it go stale.

---

## CURRENT STATE SNAPSHOT
**Date:** May 6, 2026
**Kasse Vercel Project:** `prj_slfX8MiakX0YOdsN3kAOZWOefbpN`
**Kasse Supabase Project:** `nknuonxznhshrgfseeqc`
**Live URL:** `portal.kasseapp.com`
**Repo:** `lendbucket/kasse`
**Framework:** Next.js 14, Node 24.x
**Latest Deployment:** `dpl_5x7qqhwcHoR38Tk4LVsX9X3jB6y1`

**Current schema tables (35):**
Account, AiReceptionistCall, AiReceptionistConfig, ApiKey, Appointment,
AppointmentAddon, AuditLog, BusinessSettings, Campaign, CampaignRecipient,
Client, ClientMembership, ClockEvent, Device, FamilyMember, FormSubmission,
FormTemplate, GiftCard, GiftCardRedemption, ImportJob, Location, LoyaltyEvent,
LoyaltyProgram, Membership, Message, Notification, Organization, PerformanceStat,
PermissionSet, ReviewRequest, SavedResponse, Service, Session, Staff, Transaction,
TransactionItem, User, VerificationToken, WaitlistEntry, Webhook

**Critical schema gaps identified:**
- No Payroll / PayPeriod / PayrollRun tables
- No W2 vs 1099 vs booth rent employee type distinction
- No BillPay / Vendor tables
- No IncubatorApplication table
- No KasseGrantProgram table
- stripeCustomerId needs abstraction to kassePayCustomerId
- onboardingStep exists but no OnboardingSession table to track flow state

---

## PHASE 0 — FOUNDATION & REAL DATA WIRING
**Status:** In Progress (blocked on Payroc SDK 1.7.0 resolution)
**Goal:** First real merchant processes first real payment through Kasse

### Phase 0.1 — Design System Implementation
**Status:** Not started
**Commits needed:**

**Commit 0.1.1** — Apply Kasse design tokens globally
- Files: `styles/globals.css`, `tailwind.config.ts`
- What it does: Replace all hardcoded colors with CSS custom properties matching the design system (#2F5061, #E57F84, #F4EAE6, #4297A0). Set Inter font. Set 8px spacing grid.
- Unlocks: Every subsequent UI component has the correct palette

**Commit 0.1.2** — Sidebar redesign
- Files: `components/layout/Sidebar.tsx`, `components/layout/SidebarItem.tsx`
- What it does: Replace current gray Square-clone sidebar with #2F5061 dark teal sidebar. Active item gets #E57F84 blush left border. Section labels, icon sizing, hover states per design spec.
- Unlocks: Portal feels like Kasse, not Square

**Commit 0.1.3** — Topbar redesign
- Files: `components/layout/Topbar.tsx`
- What it does: Clean topbar with search, notification bell, location switcher dropdown, user avatar. Warm white background, warm border. kasse. wordmark.
- Unlocks: Consistent header across all pages

**Commit 0.1.4** — Card, Button, Input component library
- Files: `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/Input.tsx`, `components/ui/Badge.tsx`, `components/ui/StatusPill.tsx`
- What it does: Build the core component library to spec. All buttons (primary, accent, secondary, ghost, danger, icon). All card variants. All input states. Status pills for every appointment and payment status.
- Unlocks: All pages can be rebuilt using consistent components

**Commit 0.1.5** — Empty states, loading skeletons, toasts
- Files: `components/ui/EmptyState.tsx`, `components/ui/Skeleton.tsx`, `components/ui/Toast.tsx`
- What it does: No more raw $0.00 everywhere. Every empty state has an icon, a title, a subtitle, and a CTA. Skeleton shimmer for loading. Toast system for success/error/info.
- Unlocks: First impressions are no longer dead

### Phase 0.2 — Dashboard Overhaul (No Dummy Data)
**Status:** Not started
**Commits needed:**

**Commit 0.2.1** — Dashboard zero state (new merchant, no data yet)
- Files: `app/dashboard/page.tsx`, `components/dashboard/ZeroState.tsx`
- What it does: When a merchant has no transactions, no appointments, no staff — show the setup checklist instead of a sea of $0.00. Checklist items: Add services → Invite staff → Enable booking → Process first payment → Set up AI Receptionist. Each item links directly to the relevant page. Progress bar at top.
- Unlocks: Onboarding funnel from the dashboard itself

**Commit 0.2.2** — Dashboard live state (real data)
- Files: `app/dashboard/page.tsx`, `components/dashboard/StatsRow.tsx`, `components/dashboard/RevenueChart.tsx`, `components/dashboard/StaffStrip.tsx`, `components/dashboard/AlertsPanel.tsx`
- What it does: When real data exists — show real stats. Revenue today (live), appointments today, staff clocked in, chair utilization, alerts panel (inventory, license expiry, no-shows). Revenue chart compares today vs yesterday. Staff strip shows each stylist's status.
- Unlocks: Dashboard is actually useful

**Commit 0.2.3** — Multi-location switcher
- Files: `components/layout/LocationSwitcher.tsx`, `lib/hooks/useLocation.ts`
- What it does: Dropdown in topbar. "All Locations" (owner view — aggregate data) or specific location. Selection persists in session. All data queries filter by selected location.
- Unlocks: Multi-location owners can actually navigate their business

### Phase 0.3 — Auth & Email Verification
**Status:** Partial (emailVerifyToken exists in schema, flow not enforced)
**Commits needed:**

**Commit 0.3.1** — Email verification enforcement
- Files: `app/auth/verify-email/page.tsx`, `app/api/auth/send-verification/route.ts`, `app/api/auth/verify/route.ts`, `middleware.ts`
- What it does: After signup, user is redirected to verify-email page. Cannot access portal until emailVerified is not null. Resend verification email button. Token expires in 24 hours. Middleware checks emailVerified on every protected route.
- Unlocks: No unverified accounts in the system

**Commit 0.3.2** — Password strength and security
- Files: `components/auth/PasswordInput.tsx`, `lib/auth/password.ts`
- What it does: Password strength meter (weak/fair/strong/very strong). Min 8 chars, 1 uppercase, 1 number required. bcrypt hashing. No plain-text passwords ever.
- Unlocks: Basic security hygiene

**Commit 0.3.3** — 2FA setup (optional, owner-recommended)
- Files: `app/settings/security/page.tsx`, `app/api/auth/2fa/route.ts`
- What it does: TOTP-based 2FA using authenticator apps. QR code setup flow. Backup codes generated and shown once. Owner prompted (not forced) to enable on first login.
- Unlocks: Security-conscious owners can protect their accounts

### Phase 0.4 — SalonTransact / Kasse Pay Integration
**Status:** Blocked (Payroc SDK 1.7.0 issue)
**Commits needed:**

**Commit 0.4.1** — Kasse Pay onboarding trigger
- Files: `app/api/payments/onboard/route.ts`, `lib/kassepay/merchant.ts`
- What it does: When org completes onboarding step 4 (payment setup), automatically create SalonTransact merchant account in background. Store salonTransactId on Organization. Merchant never sees "SalonTransact" or "Reyna Pay" — just "Kasse Pay" throughout the UI.
- Unlocks: Processing capability per merchant

**Commit 0.4.2** — Terminal connection
- Files: `app/settings/devices/page.tsx`, `app/api/devices/route.ts`
- What it does: Device management page. Connect Payroc terminal by entering device code. Terminal status (online/offline). Terminal assigned to location.
- Unlocks: Physical card acceptance

**Commit 0.4.3** — Payment processing via Kasse Pay
- Files: `lib/kassepay/charge.ts`, `lib/kassepay/refund.ts`, `lib/kassepay/tokenize.ts`
- What it does: Wrap SalonTransact Phase 10 API. All payment calls go through this wrapper. UI never sees raw Payroc. Idempotency keys generated per transaction. Error handling with merchant-friendly messages.
- Unlocks: Real payments flow through Kasse

---

## PHASE 1 — COMPLETE ONBOARDING FLOW
**Status:** Not started
**Goal:** Every new merchant goes through a real, guided setup with zero dummy data

### Phase 1.1 — Signup Flow
**Commits needed:**

**Commit 1.1.1** — Signup page (kasseapp.com/signup)
- Files: `app/signup/page.tsx`, `app/api/auth/signup/route.ts`
- What it does: Clean signup form. Business name, your name, email, password, business type (dropdown — Salon, Barbershop, Gym, Restaurant, Other). Phone number. Terms acceptance with real terms link. On submit: create User + Organization, set onboardingStep=1, send verification email, redirect to verify-email page.
- No Google/OAuth signup — email only for business accounts
- Unlocks: Real merchant acquisition

**Commit 1.1.2** — Vertical selection (business type config)
- Files: `app/onboarding/vertical/page.tsx`, `lib/verticals/config.ts`
- What it does: After email verification, merchant selects their vertical with icons and descriptions. Selection sets VerticalConfig on Organization. This controls everything that appears in their sidebar, their terminology, their default services, their dashboard widgets.
- Verticals at launch: Salon, Barbershop, Nail Salon, Gym, Massage, Restaurant (preview), Other
- Unlocks: Every subsequent page adapts to their vertical

**Commit 1.1.3** — Business profile step
- Files: `app/onboarding/business/page.tsx`, `app/api/onboarding/business/route.ts`
- What it does: Business legal name, DBA name, EIN (optional at this stage), address, phone, website, year established, team size. Business hours for location 1. Logo upload (goes to Supabase storage). No dummy data pre-filled — every field blank, every field has real helper text explaining why it's needed.
- Unlocks: Organization profile is real

**Commit 1.1.4** — First location setup
- Files: `app/onboarding/location/page.tsx`, `app/api/onboarding/location/route.ts`
- What it does: Create Location record. Name, address (with Google Places autocomplete), phone, timezone auto-detected from address. Business hours set per day with open/close toggles. This becomes their primary location.
- Unlocks: Appointments and staff can be assigned to a real location

**Commit 1.1.5** — Services setup (vertical-aware)
- Files: `app/onboarding/services/page.tsx`, `app/api/onboarding/services/route.ts`
- What it does: "Start with our [Salon] starter menu" toggle — pre-populates 8 common services for their vertical (with real names, real durations, real prices as starting points — not $0.00). Or add manually. Each service: name, duration, price, category, deposit required Y/N. At least 1 service required to proceed.
- Unlocks: Online booking page is functional

**Commit 1.1.6** — First staff member + invite
- Files: `app/onboarding/team/page.tsx`, `app/api/onboarding/invite/route.ts`
- What it does: Add yourself as a staff member (owner is also a provider for most service businesses). Then invite first team member by email. Invite creates Staff record + sends email with unique signup link. Staff signup link is pre-filled with org + location — they just set password.
- Unlocks: Calendar has actual people on it

**Commit 1.1.7** — Kasse Pay setup (payment activation)
- Files: `app/onboarding/payments/page.tsx`, `app/api/onboarding/payments/route.ts`
- What it does: "Activate Kasse Pay to accept card payments." Business owner info (first/last name, DOB, SSN last 4, ownership %). Bank account for payouts (routing + account number). Monthly processing volume estimate. All stored on Organization (encrypted for sensitive fields). Triggers SalonTransact merchant creation in background. Can skip (use cash-only mode) and complete later.
- Unlocks: Real card payments

**Commit 1.1.8** — Onboarding complete + first-time dashboard
- Files: `app/onboarding/complete/page.tsx`
- What it does: Celebration screen. "Your [Salon] is live on Kasse." Shows: their booking link (copy button + QR code), their team size, their service count. Three CTAs: Share your booking link, Add your first appointment, Explore your dashboard. Sets onboardingCompleted=true.
- Unlocks: Merchant is in the portal for real

### Phase 1.2 — Staff Onboarding Journey
**Commits needed:**

**Commit 1.2.1** — Staff invite acceptance flow
- Files: `app/invite/[token]/page.tsx`, `app/api/invite/accept/route.ts`
- What it does: Staff receives email "You've been invited to join [Business Name] on Kasse." Clicks link → lands on invite acceptance page showing business name, their role, their assigned location. Sets own name, password, phone. Creates User record linked to existing Staff record. Role is pre-set by owner (cannot be changed during acceptance).
- Unlocks: Staff have real accounts

**Commit 1.2.2** — Staff first-login experience (role-aware)
- Files: `app/dashboard/staff-welcome/page.tsx`
- What it does: First login for a staff member shows their personal dashboard, not the owner dashboard. Sees: today's appointments, their personal schedule, their commission settings (view only), and a short "here's how to use Kasse" tour (3 slides).
- Unlocks: Staff aren't confused by owner-level data on first login

**Commit 1.2.3** — Manager onboarding
- Files: `app/dashboard/manager-welcome/page.tsx`
- What it does: Manager first login shows location-level controls they have access to. Tour covers: appointment calendar management, staff schedule management, daily reports, client management. Cannot see org-level financials unless granted permission.
- Unlocks: Managers know what they can and can't do

### Phase 1.3 — Permission System
**Commits needed:**

**Commit 1.3.1** — Permission model and enforcement
- Files: `lib/permissions/types.ts`, `lib/permissions/check.ts`, `middleware.ts`
- What it does: Define the full permission matrix. 6 permission categories, each with granular toggles:
  ```
  FINANCIAL:      view_revenue, view_commissions, view_payroll, manage_payroll,
                  view_banking, process_refunds, apply_discounts
  APPOINTMENTS:   view_all_appointments, manage_appointments, view_own_only
  CLIENTS:        view_clients, edit_clients, delete_clients, view_contact_info
  STAFF:          view_staff, manage_staff, view_others_commissions
  REPORTS:        view_reports, export_reports, view_staff_reports
  SETTINGS:       manage_settings, manage_integrations, manage_billing
  ```
  PermissionSet JSONB stores each toggle as true/false. Middleware checks permission on every API route. UI components receive permission context and hide/disable elements accordingly.
- Unlocks: Real access control

**Commit 1.3.2** — Default permission sets
- Files: `prisma/seed/permissions.ts`, `app/api/permissions/defaults/route.ts`
- What it does: Create 3 default PermissionSets per org on creation: Owner (all true), Manager (financial view only, no billing/payroll manage), Staff (own appointments + own commissions only). Owner can create custom sets. Custom sets can be assigned to any staff member.
- Unlocks: Sane defaults, full customization

**Commit 1.3.3** — Permission management UI
- Files: `app/settings/permissions/page.tsx`, `components/settings/PermissionMatrix.tsx`
- What it does: Settings page where owner builds custom permission sets. Toggle matrix (rows = permission, columns = category). Assign a permission set to any staff member. Preview what a staff member with a given set sees.
- Unlocks: Owner has granular control

---

## PHASE 2 — CORE OPERATIONS
**Status:** Not started
**Goal:** Full daily salon/service operations work end-to-end

### Phase 2.1 — Appointments Calendar
**Commits needed:**

**Commit 2.1.1** — Day view calendar
- Files: `app/appointments/page.tsx`, `components/calendar/DayView.tsx`, `components/calendar/AppointmentBlock.tsx`
- What it does: Vertical timeline, one column per staff member. 30-min slots. Appointment blocks show client name, service, status color. Click to open appointment detail. "Now" indicator. Blocked time shows as gray. Multi-staff view with horizontal scroll if >5 staff.
- Design: Uses #2F5061 for confirmed, #E57F84 for pending, #F4EAE6 for blocked time

**Commit 2.1.2** — Create appointment flow
- Files: `components/calendar/CreateAppointment.tsx`, `app/api/appointments/route.ts`
- What it does: Click time slot → slide-in drawer. Client search (type name/phone/email → live results). If new client, mini inline creation. Service selection. Staff assignment. Duration shown. Deposit collection if required. Confirmation SMS/email toggles. Notes field. Save → appears on calendar immediately.
- No dummy client names, no pre-filled prices — everything real

**Commit 2.1.3** — Appointment detail + management
- Files: `components/calendar/AppointmentDetail.tsx`, `app/api/appointments/[id]/route.ts`
- What it does: Click appointment → full detail view. Client info + history. Service + price. Status controls (confirm, check in, start service, complete, no-show, cancel). Edit service, time, staff. Add notes. Reschedule (drag or date picker). Internal notes visible only to staff.
- Check-in logs checkedInAt timestamp. No-show can auto-charge deposit if configured.

**Commit 2.1.4** — Week view + staff schedule
- Files: `components/calendar/WeekView.tsx`
- What it does: 7-day view per staff member. Owner sees all staff. Staff see only themselves. Blocked times visible. Navigate forward/back by week.

**Commit 2.1.5** — Appointment reminders automation
- Files: `app/api/cron/reminders/route.ts`, `lib/comms/sms.ts`, `lib/comms/email.ts`
- What it does: Vercel cron runs every 30 minutes. Finds appointments starting in 24 hours and 2 hours. Sends SMS via Twilio and email via Resend if not already sent. Sets reminderSent=true. Confirmation sent at booking creation.

### Phase 2.2 — Client Management
**Commits needed:**

**Commit 2.2.1** — Client list page
- Files: `app/clients/page.tsx`, `components/clients/ClientTable.tsx`
- What it does: Searchable, filterable client list. Columns: name, phone, last visit, total spent, visit count, card on file status, relationship score. Sort by any column. Filter by: active/inactive, has card on file, lapsed (no visit in X days), VIP (top spenders). Export to CSV.

**Commit 2.2.2** — Client profile page
- Files: `app/clients/[id]/page.tsx`, `components/clients/ClientProfile.tsx`
- What it does: Full client profile. Contact info. Visit history (every appointment, every service, every transaction). Formula history (salon vertical). Notes and tags. Preferred staff. Communication history (every SMS/email sent). Loyalty points balance and history. Card on file status. Family members. Relationship score with explanation of how it's calculated. Quick actions: book appointment, send message, charge card.

**Commit 2.2.3** — Relationship score engine
- Files: `lib/clients/score.ts`, `app/api/cron/scores/route.ts`
- What it does: Computed nightly. Factors: visit frequency vs expected (based on service type), no-show history, average spend, communication opt-in, card on file, referrals made, review given. Score 0-100. Color coded: 0-40 red (at risk), 41-70 yellow (average), 71-100 green (loyal). Displayed on client profile and client list.

**Commit 2.2.4** — Client merge and deduplication
- Files: `app/clients/duplicates/page.tsx`, `app/api/clients/merge/route.ts`
- What it does: System detects potential duplicate clients (same phone or same email on different records). Shows merge candidates. Owner selects which record is primary, which is duplicate. Merge: all appointments, transactions, messages from duplicate moved to primary. Duplicate archived (not deleted — audit trail).

### Phase 2.3 — Checkout / POS
**Commits needed:**

**Commit 2.3.1** — Checkout flow
- Files: `app/pos/page.tsx`, `components/pos/CheckoutFlow.tsx`, `components/pos/ServiceSelector.tsx`, `components/pos/TipSelector.tsx`, `components/pos/PaymentSelector.tsx`
- What it does: Full checkout. Step 1: Select client (search or walk-in). Step 2: Add services + retail products. Step 3: Apply discount or gift card. Step 4: Tip selection (15/20/25/custom/none). Step 5: Payment method (card on file, new card, cash, split). Step 6: Success + rebook prompt.
- Commission calculated per line item per staff member automatically
- Deposit deducted from total automatically

**Commit 2.3.2** — Receipt delivery
- Files: `lib/comms/receipt.ts`, `app/api/transactions/receipt/route.ts`
- What it does: Email receipt via Resend (itemized: services, retail, tip, discount, tax, total, staff name). SMS receipt option. Receipt includes business logo, contact info, and rebooking link.

**Commit 2.3.3** — Refund flow
- Files: `components/pos/RefundFlow.tsx`, `app/api/transactions/[id]/refund/route.ts`
- What it does: From transaction detail: full or partial refund. Select items to refund. Reason required. Processes through Kasse Pay. Commission reversed automatically. Manager approval required for refunds over configurable threshold.

**Commit 2.3.4** — Cash drawer management
- Files: `components/pos/CashDrawer.tsx`, `app/api/cash-drawer/route.ts`
- What it does: Start of day: enter opening cash amount. Each cash transaction updates running total. End of day: count cash, system shows expected vs actual, any discrepancy flagged with required note. Cash drawer report included in daily summary.

### Phase 2.4 — Staff Management
**Commits needed:**

**Commit 2.4.1** — Staff list and profiles
- Files: `app/staff/page.tsx`, `app/staff/[id]/page.tsx`
- What it does: Staff directory with photo, role, commission rate, location, status. Individual profile: personal info, commission structure, license info with expiry alert, schedule overview, performance stats, goals. Edit from same page.

**Commit 2.4.2** — Commission engine
- Files: `lib/staff/commission.ts`, `app/api/staff/commission/route.ts`
- What it does: Calculate commission per transaction. Supports: flat percentage (e.g., 45% of all services), tiered (e.g., 40% under $3K/month, 45% $3K-5K, 50% over $5K), per-service rates (different rates for color vs cut vs retail), booth rent (flat weekly fee, tech keeps 100%). Commission stored on TransactionItem. Viewable by staff (own only) and owner (all staff).

**Commit 2.4.3** — Schedule and availability management
- Files: `app/staff/[id]/schedule/page.tsx`, `app/api/staff/availability/route.ts`
- What it does: Staff set regular hours (recurring weekly schedule). Individual day overrides. Time-off requests (start date, end date, reason). Owner approval queue for time-off. Approved time off blocks calendar and stops new bookings automatically.

**Commit 2.4.4** — Clock in / clock out
- Files: `app/clock/page.tsx`, `app/api/clock/route.ts`
- What it does: Staff tap "Clock In" on their phone. GPS coordinates captured (optional — can be required by owner). Within geofence check (configurable radius around location). ClockEvent written. Clock out same way. End of week: hours summary per staff member. Foundation for payroll calculation.

---

## PHASE 3 — HCM & PAYROLL
**Status:** Not started
**Goal:** Full human capital management — W2, 1099, booth rent all handled

### Phase 3.1 — Employee Type System
**Commits needed:**

**Commit 3.1.1** — Employee classification schema migration
- Files: `prisma/migrations/[timestamp]_employee_classification/migration.sql`
- What it does: Adds to Staff table:
  ```sql
  employmentType TEXT DEFAULT 'commission' -- 'w2', '1099', 'commission', 'booth_rent', 'hourly'
  hourlyRate DOUBLE PRECISION
  boothRentAmount DOUBLE PRECISION
  boothRentFrequency TEXT DEFAULT 'weekly' -- 'weekly', 'monthly'
  boothRentNextDue TIMESTAMP
  overtimeEligible BOOLEAN DEFAULT false
  benefitsEligible BOOLEAN DEFAULT false
  startDate TIMESTAMP
  endDate TIMESTAMP
  terminationReason TEXT
  ```
  Adds PayPeriod table, PayrollRun table, PayrollLine table.

**Commit 3.1.2** — PayPeriod and PayrollRun models
- Files: `prisma/schema.prisma`, migration file
- What it does:
  ```sql
  PayPeriod: id, organizationId, startDate, endDate, status (open/closed/paid), createdAt
  PayrollRun: id, organizationId, payPeriodId, runDate, totalGross, totalNet, totalTax, status, processedBy, createdAt
  PayrollLine: id, payrollRunId, staffId, employmentType, grossPay, hoursWorked, serviceCommission, retailCommission, tips, boothRent, adjustments, netPay, status, paymentMethod, paymentRef, createdAt
  ```

**Commit 3.1.3** — Commission payroll calculation
- Files: `lib/payroll/calculate.ts`
- What it does: For a given PayPeriod, pull all TransactionItems for each staff member. Sum service commission (rate × service price), retail commission (rate × retail price), tips. Apply any manual adjustments. Output PayrollLine per staff member. Handles tiered commission (checks if threshold crossed during period).

**Commit 3.1.4** — W2 hourly payroll calculation
- Files: `lib/payroll/hourly.ts`
- What it does: Pull ClockEvents for pay period. Calculate total hours. Apply hourly rate. Calculate overtime (>40 hours/week at 1.5x). Add tips. Subtract any advances already issued.

**Commit 3.1.5** — Booth rent billing
- Files: `lib/payroll/boothrент.ts`, `app/api/cron/booth-rent/route.ts`
- What it does: For booth_rent staff: auto-generate booth rent invoice on due date. ACH debit from booth renter's bank account (via Kasse Pay). If payment fails: flag on staff record, owner alerted. Booth renter sees their rent ledger in their staff view.

### Phase 3.2 — Payroll Disbursement
**Commits needed:**

**Commit 3.2.1** — Payroll UI — owner view
- Files: `app/payroll/page.tsx`, `components/payroll/PayrollSummary.tsx`, `components/payroll/PayrollTable.tsx`
- What it does: Payroll dashboard. Shows: current pay period, total payroll owed, per-staff breakdown. Each staff member: gross commission + tips + adjustments = net pay. Owner reviews and approves. Can add one-time adjustments (bonus, deduction, advance). Lock period when approved.

**Commit 3.2.2** — Payroll disbursement via Wise API
- Files: `lib/payroll/disburse.ts`, `app/api/payroll/disburse/route.ts`
- What it does: Integrate Wise Business API for payroll disbursements. Each staff member who has completed Wise bank account setup receives ACH transfer. Wise API: create batch transfer, poll for completion, update PayrollLine status. For staff without Wise: mark as "manual — pay by check/cash." PayrollLine stores payment reference.
- Wise API endpoints: POST /v3/transfers, GET /v3/transfers/{id}

**Commit 3.2.3** — Staff payroll view
- Files: `app/my-pay/page.tsx`
- What it does: Staff see their own pay history. Current period: projected earnings based on services so far (real-time). Past periods: gross, deductions, net, payment date, payment method. Breakdown: services + retail + tips + adjustments. W2 staff see hours worked this period. Cannot see other staff members' pay.

**Commit 3.2.4** — Tax filing foundation (Kasse Tax)
- Files: `lib/tax/w2.ts`, `lib/tax/1099.ts`, `app/settings/tax/page.tsx`
- What it does: At year end, generate W2 data for W2 employees (gross wages, federal/state withholding, FICA) and 1099-NEC data for 1099 contractors earning over $600. Store on PayrollRun. Owner reviews and approves. Kasse handles actual IRS filing (via third-party tax API — Yearli or similar) as part of monthly fee service.
- Monthly fee service (billed as addon): $49/month includes quarterly payroll tax deposits + year-end filing

---

## PHASE 4 — FINANCIAL OPERATIONS
**Status:** Not started
**Goal:** Kasse is the financial operating system — banking, bill pay, QuickBooks-like reporting

### Phase 4.1 — Kasse Banking (BaaS Integration)
**Commits needed:**

**Commit 4.1.1** — Banking schema
- Files: `prisma/migrations/[timestamp]_banking/migration.sql`
- What it does: Adds tables:
  ```sql
  KasseAccount: id, organizationId, externalAccountId, accountType (checking/savings), balance, availableBalance, routingNumber, accountNumberLast4, status, provider (column/evolve), createdAt
  KasseTransaction: id, organizationId, accountId, type, amount, description, category, merchantName, status, settledAt, createdAt
  ```

**Commit 4.1.2** — Banking dashboard
- Files: `app/banking/page.tsx`, `components/banking/AccountCard.tsx`, `components/banking/TransactionFeed.tsx`
- What it does: Banking section in sidebar. Shows Kasse business checking balance, recent transactions, pending Kasse Pay settlements (how much is coming in, when). Transaction feed with merchant names, categories, amounts. Search and filter transactions. Download statement as PDF.

**Commit 4.1.3** — Bill pay
- Files: `prisma/migrations/[timestamp]_billpay/migration.sql`, `app/banking/bill-pay/page.tsx`, `app/api/billing/pay/route.ts`
- What it does: New tables: Vendor (name, type, payment method, account info), Bill (vendorId, amount, dueDate, category, status, paidAt). Pay vendors directly from Kasse banking balance via ACH. Schedule recurring bills (rent, utilities, distributor payments). Bill calendar showing upcoming payments. Owner gets alerts 3 days before due date.

**Commit 4.1.4** — QuickBooks-style P&L
- Files: `app/reports/profit-loss/page.tsx`, `lib/reports/pl.ts`
- What it does: Monthly P&L statement. Revenue: services + retail + memberships + gift cards. Expenses: payroll + booth rent (cost to owner: buildout, equipment) + bills paid through Kasse. Gross profit. Net profit. Compare to previous month. Compare to same month last year. Export as PDF or CSV.

**Commit 4.1.5** — Chart of accounts
- Files: `app/settings/accounts/page.tsx`, `lib/accounting/categories.ts`
- What it does: Owner maps expense categories to their chart of accounts. Default categories pre-built: Payroll, Rent, Utilities, Supplies, Marketing, Equipment. Custom categories allowed. Every bill and transaction tagged to a category. QuickBooks sync maps categories to QBO account codes.

---

## PHASE 5 — AI & AUTOMATION
**Status:** Not started
**Goal:** AI Receptionist live, win-back campaigns running, review automation running

### Phase 5.1 — AI Receptionist
**Commits needed:**

**Commit 5.1.1** — AI Receptionist setup wizard
- Files: `app/ai-receptionist/setup/page.tsx`, `app/api/ai-receptionist/configure/route.ts`
- What it does: Part of onboarding AND accessible from sidebar. 4-step setup: (1) Business voice — name it, pick personality (warm/professional/casual), record or type greeting. (2) Phone number — purchase Twilio number or forward existing number. (3) Capabilities — toggle: book appointments, reschedule, answer FAQs, take messages. (4) Test it — call the number right from the portal to hear it. AiReceptionistConfig record created/updated.

**Commit 5.1.2** — Inbound call handling
- Files: `app/api/ai-receptionist/voice/route.ts`, `lib/ai/receptionist.ts`
- What it does: Twilio webhook receives inbound call. Pass to OpenAI Realtime API with system prompt containing: business name, services + prices, hours, staff names and availability, cancellation policy. AI handles conversation. If booking requested: creates Appointment via internal API. Call logged to AiReceptionistCall. Transcript stored.

**Commit 5.1.3** — AI Receptionist dashboard
- Files: `app/ai-receptionist/page.tsx`, `components/ai/CallLog.tsx`, `components/ai/ReceptionistStats.tsx`
- What it does: Shows: calls handled today/week/month, calls transferred to human, bookings captured, missed calls (went to voicemail after AI). Each call: caller name/number, duration, outcome, transcript, AI summary. Listen to recording. Edit AI config from same page.

### Phase 5.2 — Marketing Automation
**Commits needed:**

**Commit 5.2.1** — Win-back campaign engine
- Files: `app/api/cron/winback/route.ts`, `lib/campaigns/winback.ts`
- What it does: Nightly cron. Finds clients whose last visit was X days ago (configurable, default 45 days for salon). Creates Campaign record, sends SMS/email. Message: "[Business Name] misses you! It's been a while — book your next visit: [link]." Personalized with client first name and last service. Tracks open/click/rebooking outcome.

**Commit 5.2.2** — Review request automation
- Files: `app/api/cron/reviews/route.ts`, `lib/campaigns/review.ts`
- What it does: 2 hours after appointment marked complete, send review request. If client rates 4-5 stars internally: send Google review link. If 1-3 stars: send internal feedback form (owner sees it, client doesn't go to Google). ReviewRequest record tracks all of this.

**Commit 5.2.3** — Birthday automation
- Files: `app/api/cron/birthdays/route.ts`
- What it does: Morning of client's birthday: SMS "Happy Birthday [Name]! 🎂 As our gift to you, enjoy 15% off your next visit this month." Discount code generated automatically. Redemption tracked on next transaction.

---

## PHASE 6 — INCUBATOR PROGRAM
**Status:** Not started
**Goal:** Kasse Grant + Incubator infrastructure live — distribution engine

### Phase 6.1 — Incubator Schema
**Commits needed:**

**Commit 6.1.1** — Incubator data model
- Files: `prisma/migrations/[timestamp]_incubator/migration.sql`
- What it does: New tables:
  ```sql
  IncubatorCohort: id, name, vertical, startDate, endDate, applicationDeadline, maxParticipants, status, createdAt
  IncubatorApplication: id, cohortId, organizationId, businessName, ownerName, monthlyRevenue, processingVolume, teamSize, whyApply (text), businessChallenge (text), videoUrl, status (pending/reviewing/accepted/rejected/waitlisted), aiScore (0-100), aiScoreSummary, reviewedBy, reviewedAt, createdAt
  IncubatorParticipant: id, cohortId, organizationId, applicationId, status (active/graduated/dropped), graduationDate, prizeType, prizeStatus, createdAt
  IncubatorModule: id, cohortId, weekNumber, title, description, contentUrl, isLive, scheduledAt, createdAt
  IncubatorProgress: id, participantId, moduleId, completedAt, score, createdAt
  KasseGrant: id, organizationId, amount, type (cash/credit/prize), status, awardedAt, disbursedAt, disbursementRef, createdAt
  ```

**Commit 6.1.2** — Public application page
- Files: `app/(public)/incubator/apply/page.tsx`, `app/api/incubator/apply/route.ts`
- What it does: Public-facing application page at kasseapp.com/incubator. No login required to apply. Business info, owner info, current software, monthly revenue, processing volume, team size, "Why do you want to join" (500 words), "What is your biggest business challenge" (300 words), video pitch URL (optional). Submit creates IncubatorApplication. Confirmation email sent.

**Commit 6.1.3** — AI application scoring
- Files: `lib/incubator/score.ts`, `app/api/incubator/score/route.ts`
- What it does: When application submitted, Claude API scores it 0-100 based on: processing volume (0-30 points — higher volume = more likely to be profitable partner), business narrative quality (0-25 points — genuine need, clear goals), team size and growth trajectory (0-20 points), challenge specificity (0-15 points), video submission bonus (0-10 points). Score + summary stored on application. Helps Robert prioritize review queue.

**Commit 6.1.4** — Incubator admin dashboard
- Files: `app/admin/incubator/page.tsx`
- What it does: Internal admin view (owner/Robert only). Application queue with AI scores. Filter by score, vertical, processing volume. Review each application: see full submission, AI score breakdown, org's Kasse metrics if they're already a user. Accept/reject/waitlist buttons. Send notification email on status change.

**Commit 6.1.5** — Participant portal
- Files: `app/incubator/page.tsx`, `components/incubator/CohortDashboard.tsx`
- What it does: Accepted participants see their cohort dashboard inside Kasse portal. Module schedule (12 weeks). Current week module with video/content. Progress tracking. Peer directory (cohort members — name, business, vertical). Graduation requirements checklist. Prize status (pending/tracking/awarded).

---

## PHASE 7 — MARKETING SITE
**Status:** Not started
**Goal:** kasseapp.com is a conversion machine for signups and incubator applications

### Phase 7.1 — Marketing Site
**Commits needed:**

**Commit 7.1.1** — Marketing site foundation
- Files: `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`
- What it does: Separate layout from portal. Navigation: Logo, Features, Pricing, Incubator, Blog, Sign In, Get Started (CTA). Hero section. No dummy screenshots — use real portal screenshots once Phase 2 is done.

**Commit 7.1.2** — Pricing page
- Files: `app/(marketing)/pricing/page.tsx`
- What it does: 5-tier plan comparison table. Addon showcase. Monthly/annual toggle (20% discount). CTA for each plan. FAQ section.

**Commit 7.1.3** — Incubator landing page
- Files: `app/(marketing)/incubator/page.tsx`
- What it does: Full incubator program page. Hero: "Kasse Founders Program." How it works. What you get (12 weeks, funded second location prize, capital line). Eligibility. Past cohort stories (Phase 7.2+). Application CTA.

---

## SCHEMA MIGRATIONS NEEDED (Not Yet Written)

The following migrations must be written before their corresponding commits:

| Priority | Migration | Adds |
|----------|-----------|------|
| HIGH | employee_classification | employmentType, hourlyRate, boothRent fields on Staff |
| HIGH | payroll_tables | PayPeriod, PayrollRun, PayrollLine |
| HIGH | banking_tables | KasseAccount, KasseTransaction |
| HIGH | billpay_tables | Vendor, Bill |
| MEDIUM | incubator_tables | IncubatorCohort, Application, Participant, Module, Progress, KasseGrant |
| MEDIUM | vertical_config | verticalId, verticalConfig on Organization |
| LOW | staff_payroll_setup | wiseAccountId, wiseRecipientId on Staff |

---

## FILES CREATED THIS SESSION (docs/)

| File | Lines | Status |
|------|-------|--------|
| KASSE_DESIGN_SYSTEM.md | 1,538 | Complete |
| KASSE_MASTER_BUILDPLAN.md | 848 | Complete |
| KASSE_VERTICALS_EXPANDED.md | 1,614 | Complete |
| KASSE_SUPPORT.md | 604 | Complete |
| KASSE_DAYOPS.md | 1,438 | Complete |
| KASSE_MIGRATION.md | 781 | Complete |
| KASSE_RETENTION.md | 818 | Complete |
| KASSE_FRANCHISE_ALL.md | 811 | Complete |
| KASSE_INTEGRATIONS.md | 1,121 | Complete |
| KASSE_ONBOARDING.md | 647 | Complete |
| KASSE_PORTALS.md | 743 | Complete |
| KASSE_TIERS.md | 420 | Complete |
| KASSE_PHASE_COMMITS.md | this file | Active |
| KASSE_PORTAL_ARCHITECTURE.md | TBD | In progress |
| KASSE_INCUBATOR.md | TBD | In progress |
| KASSE_PAYROLL_BILLPAY.md | TBD | In progress |
| KASSE_MARKETING_SITE.md | TBD | In progress |

---

*This document is updated every session. Last updated: May 6, 2026.*
*Never let this go stale. Every commit gets logged here before it gets pushed.*
