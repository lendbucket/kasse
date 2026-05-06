# KASSE_PHASE_COMMITS.md
## Living Master — Every Phase, Every Commit, Every File
### Auto-updated every session | Version 2.0 | May 2026

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
- No ServiceCost / ProfitTarget tables (needed for Nisha-inspired profit intelligence)
- No PublicHoliday table
- No GrowthJournal / AIInsight tables
- stripeCustomerId needs abstraction to kassePayCustomerId
- onboardingStep exists but no OnboardingSession table to track flow state

---

## NISHA.COM.AU FEATURE ANALYSIS & INTEGRATION
**Source reviewed:** May 6, 2026 — nisha.com.au (homepage + features page + pricing page)
**What Nisha is:** Australian pre-launch AI booking + business intelligence platform for salons. Still on founders waitlist — not yet live. Their angle: "we show profitability, not just revenue." Sharp positioning that exposes a real gap in existing tools.

**Competitive assessment:**
- Nisha has: profit-per-service intelligence, income target calculator, smart pricing alerts, smart break scheduling, VIP deposit exemptions, public holiday auto-calendar, non-bookable staff at no cost, three-tier reporting, growth journal / AI coaching history, booking page review display, chair utilization as hero metric, service cost tracking
- Nisha does NOT have: payroll, banking, bill pay, AI receptionist (phone), franchise tools, incubator program, migration system, multi-location beyond basic, full commission engine, staff mobile app, walk-in queue
- **Conclusion:** Kasse already has everything Nisha has, plus 10x more depth. The Nisha features that are genuinely novel — profit intelligence, income targets, smart pricing — are being added below into Kasse's roadmap.

---

## NISHA-DERIVED FEATURES — PHASE ASSIGNMENTS

### Features Added to Phase 2 (Core Operations):

**N-1: Service Cost Tracking + Margin Calculations**
Every service gets a "Cost to Deliver" field: product/supply cost + consumable cost. Kasse automatically calculates gross margin % per service. Displayed on service management page. Links to Kasse Color formula cards for automatic cost calculation based on products used.

**N-2: VIP Client Deposit Exemptions**
Clients with relationship score above configurable threshold (default 80) are automatically flagged as VIP and exempted from deposit requirements. Owner can manually set any client as VIP. VIP flag visible on client profile with override toggle.

**N-3: Smart Break Scheduling**
When a staff member needs a break, Kasse finds the optimal gap in their schedule rather than blocking a fixed time. Break appears on calendar only in genuine gaps — never splits an appointment block. Owner sets break duration preference (15, 30, 45 min) and minimum frequency.

**N-4: Public Holiday Auto-Calendar**
Texas state holidays + federal holidays pre-loaded for the current year. System auto-populates them in the location calendar. Owner sees an annual holiday list in Settings → Locations and can one-click block or allow each day. Prevents accidental bookings. Updates automatically each January for the new year.

### Features Added to Phase 4 (Financial Operations / Business Intelligence):

**N-5: Profit Per Service Dashboard**
The flagship Nisha differentiator — fully implemented in Kasse. For every service on the menu:
- Revenue per service (existing)
- Cost to deliver (product cost + consumables — from N-1)
- Staff time cost (hourly equivalent based on service duration × staff cost rate)
- Gross profit per service
- Profit per hour (gross profit ÷ service duration in hours)
- Margin % (gross profit ÷ revenue)

Displayed as a sortable table in Reports → Service Profitability. Color-coded: green (>50% margin), yellow (30-50%), red (<30%). Filters: by staff member, by category, by date range.

**N-6: Income Target Calculator**
Owner inputs personal financial goals once:
- Monthly personal expenses (rent, food, car, insurance, personal bills)
- Business overhead (rent, utilities, supplies, software, marketing)
- Desired owner salary / draw
- Desired savings rate (%)

Kasse calculates:
- Revenue needed per year to hit all goals
- Revenue needed per month
- Revenue needed per week
- Revenue needed per hour of billable time
- Revenue needed per chair per day
- Current performance vs target (live, updates with each transaction)

Displayed as a persistent widget on the owner dashboard: "You need $X/hour. You're currently averaging $Y/hour." Green if on track, red if behind. Full breakdown accessible in Reports → Financial Goals.

**N-7: Smart Pricing Recommendations (AI Pricing Coach)**
Running nightly via cron. For each service where gross margin < target (based on income goal from N-6):
- Identifies underpriced services
- Calculates the price required to hit target margin given actual cost
- Surfaces as an alert: "Your Balayage service has a 31% margin. At your income target, it should be priced at $215 (currently $180)."
- Owner can: update price now (one click), snooze alert 30 days, or dismiss permanently
- Pricing recommendation stored in audit log for reference

**N-8: Three-Tier Financial Reporting**
Financial reports adapt to owner sophistication level. Owner selects their view in Settings → Reports:
- **Simple:** Three numbers. Revenue this month. Expenses this month. Profit this month. Designed for owners who hate numbers.
- **Intermediate:** Revenue by category (services/retail/memberships), expense by category, staff cost as % of revenue, gross profit, net profit, trend vs prior month.
- **Advanced:** Full P&L with variance analysis, per-chair economics, revenue per hour, cost per appointment, year-over-year comparison, export to CSV/PDF/QuickBooks.

**N-9: Business Health Dashboard**
A single-page "health check" for the business. Auto-generated weekly. Metrics with traffic light status:
- Chair utilization: target vs actual (green/yellow/red)
- Rebook rate: target vs actual
- Average ticket size: trend
- No-show rate: trend
- New clients this week vs churn (lapsed)
- Revenue per hour vs income target (N-6)
- Review score trend
AI summary at top: "Your salon had a strong week. Chair utilization hit 82% for the first time. Your biggest opportunity: 3 services have margins below 30% — see pricing recommendations."

**N-10: Growth Journal (AI Coaching History)**
Every AI-generated insight, pricing recommendation, risk flag, and milestone celebration is saved to a permanent log called the Growth Journal. Owner scrolls their journal to see:
- "May 6: Kasse flagged that Tuesday chair utilization was 42% — recommended adding a walk-in slot"
- "May 12: Rebook rate hit 75% for the first time"
- "May 20: Balayage margin alert resolved — price updated to $215"
- "April 28: Win-back campaign sent to 23 lapsed clients — 7 rebooked (30% conversion)"

Accessible from sidebar under AI → Growth Journal. Searchable by date, type, topic. Each entry links to the relevant feature. Like a business diary, automatically written by Kasse.

### Features Added to Phase 5 (AI & Automation):

**N-11: Cancellation Risk Alerts**
AI monitors upcoming appointments and flags clients at high risk of cancelling or no-showing before they actually do:
- Client has cancelled or no-showed 2+ times in prior 6 months → "high risk" flag on appointment block
- It's been more than their usual rebook interval by 20%+ → "may not show" warning
- Client hasn't confirmed reminder → alert fires 4 hours before appointment
- Owner sees these on the appointment calendar as amber warning badges
- One-tap action: "Send personal reminder" → personalized SMS from owner's number

**N-12: AI-Generated Forms and Documents**
Powered by Claude API. Owner describes what they need; Kasse generates it:
- "Create a chemical service waiver for Brazilian blowouts"
- "Create a consultation form for new color clients"
- "Create a patch test acknowledgment form"
- "Create a COVID screening questionnaire"
Generated form appears in Forms & Waivers → draft mode. Owner reviews, edits, and activates. No starting from scratch.

**N-13: AI Marketing Content Generation**
For Pro and Enterprise plans. Owner selects: campaign type (win-back / seasonal / product launch / event), channel (SMS / email / both), and tone (warm / professional / exciting). Claude API generates:
- Subject line options (email)
- Message body
- Personalization suggestions
- Best send time recommendation based on their client engagement data
Owner edits and sends. Full campaign builder is still there — this just removes the blank page problem.

**N-14: Client Retention + Rebooking Insights with AI Recommendations**
Weekly AI analysis of rebooking patterns:
- Identifies which staff members have highest rebook rates (and what they do differently)
- Identifies which services have lowest rebooking (potential pricing or experience issue)
- Identifies which client segments are lapsing fastest
- Generates specific recommended actions: "Your Monday 2pm slot has rebooking rate 40% lower than Tuesday 2pm. Consider offering a Monday loyalty discount."

### Features Added to Phase 1 (Onboarding):

**N-15: Financial Literacy Explanations**
Every financial metric in Kasse has a "?" tooltip that explains what it means, why it matters, and what a good number looks like. Written for business owners who are great at their craft but not at accounting:
- "Chair utilization" → "This is the percentage of your available appointment hours that were actually booked. Industry average is 65-75%. Above 80% means you should consider adding staff or raising prices."
- "Average ticket" → "The average amount a client spends per visit. Increasing this by 10% (without seeing more clients) is the fastest way to grow revenue."
- "Profit margin" → "What percentage of every dollar you earn is actually profit after paying for the service. Below 30% on a service usually means you're underpriced or your costs are too high."
No jargon. No assumptions. Built for a salon owner who has never taken a business class.

---

## SCHEMA ADDITIONS REQUIRED FOR NISHA FEATURES

```sql
-- Service cost tracking (N-1, N-5)
ALTER TABLE "Service" ADD COLUMN productCost DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Service" ADD COLUMN consumableCost DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Service" ADD COLUMN targetMarginPct DOUBLE PRECISION;

-- Income target (N-6)
CREATE TABLE "IncomeTarget" (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId        TEXT NOT NULL REFERENCES "Organization"(id),
  monthlyPersonalExpenses DOUBLE PRECISION DEFAULT 0,
  monthlyBusinessOverhead DOUBLE PRECISION DEFAULT 0,
  desiredSalary         DOUBLE PRECISION DEFAULT 0,
  savingsRatePct        DOUBLE PRECISION DEFAULT 0,
  targetRevenueAnnual   DOUBLE PRECISION GENERATED ALWAYS AS (
    (monthlyPersonalExpenses + monthlyBusinessOverhead + desiredSalary) * 12 / (1 - savingsRatePct/100)
  ) STORED,
  createdAt             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt             TIMESTAMP
);

-- Pricing recommendations (N-7)
CREATE TABLE "PricingAlert" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId  TEXT NOT NULL REFERENCES "Organization"(id),
  serviceId       TEXT NOT NULL REFERENCES "Service"(id),
  currentPrice    DOUBLE PRECISION NOT NULL,
  recommendedPrice DOUBLE PRECISION NOT NULL,
  currentMarginPct DOUBLE PRECISION NOT NULL,
  targetMarginPct  DOUBLE PRECISION NOT NULL,
  reason          TEXT NOT NULL,
  status          TEXT DEFAULT 'active', -- 'active', 'snoozed', 'dismissed', 'applied'
  snoozedUntil    TIMESTAMP,
  appliedAt       TIMESTAMP,
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Growth Journal (N-10)
CREATE TABLE "GrowthJournal" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId  TEXT NOT NULL REFERENCES "Organization"(id),
  entryType       TEXT NOT NULL, -- 'insight', 'alert', 'milestone', 'recommendation', 'win'
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  linkedFeature   TEXT,          -- e.g., 'pricing', 'retention', 'utilization'
  linkedEntityId  TEXT,          -- e.g., serviceId, staffId, clientId
  isRead          BOOLEAN DEFAULT false,
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public holidays (N-4)
CREATE TABLE "PublicHoliday" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  country         TEXT NOT NULL DEFAULT 'US',
  state           TEXT,           -- 'TX' for Texas-specific
  date            DATE NOT NULL,
  name            TEXT NOT NULL,
  year            INTEGER NOT NULL,
  isBlocked       BOOLEAN DEFAULT false, -- per-org override stored in BusinessSettings
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cancellation risk (N-11)
ALTER TABLE "Appointment" ADD COLUMN cancellationRiskScore INTEGER DEFAULT 0;
ALTER TABLE "Appointment" ADD COLUMN riskAlertSent BOOLEAN DEFAULT false;
```

---

## FULL PHASE ROADMAP

---

## PHASE 0 — FOUNDATION & REAL DATA WIRING
**Status:** In Progress (blocked on Payroc SDK 1.7.0 resolution)
**Goal:** First real merchant processes first real payment through Kasse

### Phase 0.1 — Design System Implementation

**Commit 0.1.1** — Apply Kasse design tokens globally
- Files: `styles/globals.css`, `tailwind.config.ts`
- What it does: Replace all hardcoded colors with CSS custom properties (#2F5061, #E57F84, #F4EAE6, #4297A0). Inter font. 8px spacing grid.
- Unlocks: Every subsequent component has the correct palette

**Commit 0.1.2** — Sidebar redesign
- Files: `components/layout/Sidebar.tsx`, `components/layout/SidebarItem.tsx`
- What it does: #2F5061 dark teal sidebar. Active item gets #E57F84 blush left border. Section labels, icon sizing, hover states per design spec.
- Unlocks: Portal feels like Kasse, not Square

**Commit 0.1.3** — Topbar redesign
- Files: `components/layout/Topbar.tsx`
- What it does: Search, notification bell, location switcher, user avatar. Warm white background. kasse. wordmark.
- Unlocks: Consistent header

**Commit 0.1.4** — Core component library
- Files: `components/ui/Button.tsx`, `components/ui/Card.tsx`, `components/ui/Input.tsx`, `components/ui/Badge.tsx`, `components/ui/StatusPill.tsx`
- What it does: All button variants, card variants, input states, status pills for every appointment and payment status.
- Unlocks: All pages can be rebuilt using consistent components

**Commit 0.1.5** — Empty states, skeletons, toasts
- Files: `components/ui/EmptyState.tsx`, `components/ui/Skeleton.tsx`, `components/ui/Toast.tsx`
- What it does: No raw $0.00 anywhere. Every empty state has icon, title, subtitle, CTA. Skeleton shimmer. Toast system.
- Unlocks: First impressions are professional

### Phase 0.2 — Dashboard Overhaul (No Dummy Data)

**Commit 0.2.1** — Dashboard zero state
- Files: `app/dashboard/page.tsx`, `components/dashboard/ZeroState.tsx`
- What it does: Setup checklist replaces $0.00 sea. Progress bar. Each item links to relevant page.
- Unlocks: Onboarding funnel from dashboard

**Commit 0.2.2** — Dashboard live state
- Files: `app/dashboard/page.tsx`, `components/dashboard/StatsRow.tsx`, `components/dashboard/RevenueChart.tsx`, `components/dashboard/StaffStrip.tsx`, `components/dashboard/AlertsPanel.tsx`
- What it does: Real stats when data exists. Revenue today, appointments, chair utilization, alerts, revenue chart today vs yesterday, staff strip.
- Includes: Income target widget (N-6) shown when configured — "You need $X/hr · Currently averaging $Y/hr"
- Unlocks: Dashboard is actually useful

**Commit 0.2.3** — Multi-location switcher
- Files: `components/layout/LocationSwitcher.tsx`, `lib/hooks/useLocation.ts`
- What it does: All Locations aggregate view or per-location. Persists in session.
- Unlocks: Multi-location navigation

**Commit 0.2.4** — Business health widget (Nisha N-9)
- Files: `components/dashboard/BusinessHealth.tsx`
- What it does: Weekly health score card on dashboard. Chair utilization, rebook rate, average ticket, no-show rate — each with traffic light status. AI one-line summary. Links to full Business Health report.
- Unlocks: Owner sees business health at a glance, not just revenue

### Phase 0.3 — Auth & Email Verification

**Commit 0.3.1** — Email verification enforcement
- Files: `app/auth/verify-email/page.tsx`, `app/api/auth/send-verification/route.ts`, `app/api/auth/verify/route.ts`, `middleware.ts`
- What it does: Cannot access portal until emailVerified. Token expires 24 hours. Middleware checks on every protected route.
- Unlocks: No unverified accounts

**Commit 0.3.2** — Password strength
- Files: `components/auth/PasswordInput.tsx`, `lib/auth/password.ts`
- What it does: Strength meter. Min requirements. bcrypt hashing.
- Unlocks: Basic security hygiene

**Commit 0.3.3** — 2FA (optional)
- Files: `app/settings/security/page.tsx`, `app/api/auth/2fa/route.ts`
- What it does: TOTP via authenticator apps. QR setup. Backup codes. Owner prompted (not forced) on first login.
- Unlocks: Security-conscious owners protected

### Phase 0.4 — Kasse Pay Integration
**Status:** Blocked on Payroc SDK 1.7.0

**Commit 0.4.1** — Kasse Pay merchant onboarding trigger
- Files: `app/api/payments/onboard/route.ts`, `lib/kassepay/merchant.ts`
- What it does: Completion of payment setup step auto-creates SalonTransact merchant account. Stores salonTransactId. UI only ever says "Kasse Pay."
- Unlocks: Processing capability

**Commit 0.4.2** — Terminal connection
- Files: `app/settings/devices/page.tsx`, `app/api/devices/route.ts`
- What it does: Device management. Connect Payroc terminal by code. Status monitoring.
- Unlocks: Physical card acceptance

**Commit 0.4.3** — Payment processing wrapper
- Files: `lib/kassepay/charge.ts`, `lib/kassepay/refund.ts`, `lib/kassepay/tokenize.ts`
- What it does: Wraps SalonTransact Phase 10 API. Idempotency keys. Merchant-friendly error messages.
- Unlocks: Real payments flow

---

## PHASE 1 — COMPLETE ONBOARDING FLOW
**Goal:** Every new merchant goes through a real, guided setup with zero dummy data

### Phase 1.1 — Signup Flow

**Commit 1.1.1** — Signup page
- Files: `app/signup/page.tsx`, `app/api/auth/signup/route.ts`
- What it does: Business name, owner name, email, password, business type, phone, terms. Creates User + Organization, onboardingStep=1, sends verification email.
- Unlocks: Real merchant acquisition

**Commit 1.1.2** — Vertical selection
- Files: `app/onboarding/vertical/page.tsx`, `lib/verticals/config.ts`
- What it does: Select vertical with icons and descriptions. Sets VerticalConfig. Controls everything in their sidebar, terminology, default services, dashboard widgets.
- Launch verticals: Salon, Barbershop, Nail Salon, Gym, Massage, Restaurant (preview), Other
- Unlocks: Portal adapts to their business

**Commit 1.1.3** — Business profile step
- Files: `app/onboarding/business/page.tsx`, `app/api/onboarding/business/route.ts`
- What it does: Legal name, DBA, EIN (optional), address, phone, website, year established, team size. Logo upload. No dummy data — every field blank with real helper text.
- Includes: Financial literacy tooltip system first deployment (N-15) — "Why do we need this?" links on every field
- Unlocks: Real org profile

**Commit 1.1.4** — First location setup
- Files: `app/onboarding/location/page.tsx`, `app/api/onboarding/location/route.ts`
- What it does: Location name, address (Google Places autocomplete), phone, timezone auto-detected. Business hours per day.
- Includes: Public holiday auto-calendar seeded on location creation (N-4) — Texas holidays pre-populated, owner sees them in confirmation step
- Unlocks: Calendar has a real location

**Commit 1.1.5** — Services setup
- Files: `app/onboarding/services/page.tsx`, `app/api/onboarding/services/route.ts`
- What it does: Starter menu option (8 common services pre-populated for vertical). Or add manually. Each service: name, duration, price, category, deposit Y/N.
- Includes: Service cost fields (N-1) visible from the start — "What does this service cost you to deliver? (product + supplies)" with tooltip explaining why it matters
- Unlocks: Booking page is functional with real prices

**Commit 1.1.6** — First staff member + invite
- Files: `app/onboarding/team/page.tsx`, `app/api/onboarding/invite/route.ts`
- What it does: Add self as staff. Invite first team member. Unique signup link pre-filled with org + location.
- Unlocks: Calendar has real people

**Commit 1.1.7** — Income target setup (Nisha N-6 — first deployment)
- Files: `app/onboarding/goals/page.tsx`, `app/api/onboarding/goals/route.ts`
- What it does: New onboarding step between services and payments. "Let's figure out what your business needs to earn." Owner enters: monthly personal expenses, business overhead, desired salary. Kasse immediately shows: "You need to generate $X/month to hit your goals." Creates IncomeTarget record. Skippable (revisit in Settings → Financial Goals).
- Unlocks: Profit intelligence features are seeded with real data from day one

**Commit 1.1.8** — Kasse Pay setup
- Files: `app/onboarding/payments/page.tsx`, `app/api/onboarding/payments/route.ts`
- What it does: Activate Kasse Pay. Owner info, bank account for payouts. Monthly volume estimate. Triggers SalonTransact merchant creation. Skippable for cash-only mode.
- Unlocks: Real card payments

**Commit 1.1.9** — Onboarding complete
- Files: `app/onboarding/complete/page.tsx`
- What it does: Celebration screen. Booking link + QR code. Three CTAs: Share link, Add appointment, Explore dashboard. Sets onboardingCompleted=true.
- Unlocks: Merchant is in the portal for real

### Phase 1.2 — Staff Onboarding Journey

**Commit 1.2.1** — Staff invite acceptance
- Files: `app/invite/[token]/page.tsx`, `app/api/invite/accept/route.ts`
- What it does: Staff accepts invite, sets own name/password/phone. Creates User linked to Staff record.
- Unlocks: Staff have real accounts

**Commit 1.2.2** — Staff first-login (role-aware)
- Files: `app/dashboard/staff-welcome/page.tsx`
- What it does: Personal dashboard on first login. Today's appointments, schedule, commission settings (view only), 3-slide tour.
- Unlocks: Staff not confused by owner data

**Commit 1.2.3** — Manager onboarding
- Files: `app/dashboard/manager-welcome/page.tsx`
- What it does: Location-level controls. Tour: calendar management, staff schedules, reports, client management.
- Unlocks: Managers know their scope

### Phase 1.3 — Permission System

**Commit 1.3.1** — Permission model
- Files: `lib/permissions/types.ts`, `lib/permissions/check.ts`, `middleware.ts`
- What it does: Full permission matrix (FINANCIAL, APPOINTMENTS, CLIENTS, STAFF, REPORTS, SETTINGS). JSONB storage. Middleware enforcement on every API route and UI component.
- Unlocks: Real access control

**Commit 1.3.2** — Default permission sets
- Files: `prisma/seed/permissions.ts`
- What it does: Owner (all true), Manager (view financial, no billing/payroll manage), Staff (own appointments + own commissions only). Non-bookable staff designation (N-extra — no calendar, no commission, unlimited at no cost).
- Unlocks: Sane defaults

**Commit 1.3.3** — Permission management UI
- Files: `app/settings/permissions/page.tsx`, `components/settings/PermissionMatrix.tsx`
- What it does: Custom permission sets. Toggle matrix. Assign to staff member. Preview mode.
- Unlocks: Owner has granular control

---

## PHASE 2 — CORE OPERATIONS
**Goal:** Full daily service operations end-to-end

### Phase 2.1 — Appointments Calendar

**Commit 2.1.1** — Day view calendar
- Files: `app/appointments/page.tsx`, `components/calendar/DayView.tsx`, `components/calendar/AppointmentBlock.tsx`
- What it does: Vertical timeline, one column per staff. 30-min slots. #2F5061 confirmed, #E57F84 pending, #F4EAE6 blocked. Click to open detail. "Now" indicator.
- Includes: Cancellation risk badge on high-risk appointments (N-11) — amber ⚠️ badge if client has 2+ prior no-shows

**Commit 2.1.2** — Create appointment flow
- Files: `components/calendar/CreateAppointment.tsx`, `app/api/appointments/route.ts`
- What it does: Click slot → drawer. Client search. New client inline. Service selection. Staff assignment. Duration. Deposit if required. Confirmation SMS/email toggles. Notes.
- Includes: VIP client deposit exemption (N-2) — if client is VIP, deposit checkbox is pre-unchecked with "VIP — no deposit required" label

**Commit 2.1.3** — Appointment detail + management
- Files: `components/calendar/AppointmentDetail.tsx`, `app/api/appointments/[id]/route.ts`
- What it does: Full detail. Status controls. Edit. Reschedule. Notes. No-show auto-charges deposit.

**Commit 2.1.4** — Week view
- Files: `components/calendar/WeekView.tsx`
- What it does: 7-day view. Owner sees all staff. Staff see own only.

**Commit 2.1.5** — Smart break scheduling (Nisha N-3)
- Files: `lib/calendar/smart-breaks.ts`, `components/calendar/BreakScheduler.tsx`
- What it does: Owner sets break preferences (duration + frequency). System finds optimal gaps in each staff member's schedule. Breaks appear on calendar only in genuine gaps between appointments. Never splits a service block. Staff can view their scheduled breaks in the app.
- Unlocks: Efficient scheduling without dead chair time from poorly placed breaks

**Commit 2.1.6** — Appointment reminders automation
- Files: `app/api/cron/reminders/route.ts`, `lib/comms/sms.ts`, `lib/comms/email.ts`
- What it does: Every 30 minutes: send 24hr and 2hr reminders. Track reminderSent. Confirmation at booking.

**Commit 2.1.7** — Cancellation risk alerts (Nisha N-11)
- Files: `lib/ai/cancellation-risk.ts`, `app/api/cron/risk-alerts/route.ts`
- What it does: Nightly cron scores each upcoming appointment for cancellation risk. Factors: prior no-show history, days since last visit vs usual interval, reminder not confirmed. High-risk appointments get amber badge on calendar. Owner gets daily alert: "3 appointments today are at high risk of no-show." One-tap "Send personal reminder" fires personalized SMS.
- Unlocks: Proactive no-show prevention (Nisha flagged this as a key differentiator)

**Commit 2.1.8** — Public holiday auto-calendar (Nisha N-4)
- Files: `lib/calendar/holidays.ts`, `app/settings/holidays/page.tsx`, `app/api/cron/holidays/route.ts`
- What it does: Texas + federal holidays loaded into PublicHoliday table for current year. Each January 1, next year's holidays auto-seeded. Settings → Holidays shows full year list — owner toggles each open/closed with one click. Closed days block all new bookings. Open days work normally. Existing appointments on newly closed days shown as conflicts requiring resolution.
- Unlocks: Zero manual holiday management ever again

### Phase 2.2 — Client Management

**Commit 2.2.1** — Client list page
- Files: `app/clients/page.tsx`, `components/clients/ClientTable.tsx`
- What it does: Searchable, filterable. Columns: name, phone, last visit, total spent, visits, relationship score, card on file. Sort, filter (active/lapsed/VIP/card on file). Export CSV.

**Commit 2.2.2** — Client profile page
- Files: `app/clients/[id]/page.tsx`, `components/clients/ClientProfile.tsx`
- What it does: Full profile. Tabs: Overview, Visits, Transactions, Communications, Notes, Forms. VIP badge visible. Loyalty points. Card on file. Family members. Relationship score explained.

**Commit 2.2.3** — VIP client system (Nisha N-2 full implementation)
- Files: `lib/clients/vip.ts`, `app/api/clients/vip/route.ts`
- What it does: VIP flag on Client table. Auto-set when relationship score crosses configurable threshold (default 80). Owner can manually set/unset from client profile. VIP clients: deposit automatically waived, shown at top of client search results, get VIP badge in all staff views, eligible for exclusive promotions.

**Commit 2.2.4** — Relationship score engine
- Files: `lib/clients/score.ts`, `app/api/cron/scores/route.ts`
- What it does: Computed nightly. Visit frequency vs expected, no-show history, spend, opt-ins, card on file, referrals, reviews. 0-100. Red/yellow/green displayed everywhere.

**Commit 2.2.5** — Client merge and deduplication
- Files: `app/clients/duplicates/page.tsx`, `app/api/clients/merge/route.ts`
- What it does: Detects same phone/email duplicates. Merge candidates shown. Primary selection. All history merged. Duplicate archived.

### Phase 2.3 — Services & Pricing Intelligence

**Commit 2.3.1** — Service management with cost tracking (Nisha N-1)
- Files: `app/services/page.tsx`, `app/services/[id]/page.tsx`, `app/api/services/route.ts`
- What it does: Full service CRUD. Each service: name, category, duration, price, buffer time, deposit settings, color, taxable toggle. **New fields (Nisha N-1):** product/consumable cost to deliver, target margin %. Service card shows margin % immediately after cost entered. Financial literacy tooltip: "Why does this matter? Your margin is what you actually keep after paying for the service."
- Unlocks: Profit intelligence has real data to work with

**Commit 2.3.2** — Service profitability table (Nisha N-5)
- Files: `app/reports/service-profitability/page.tsx`, `lib/reports/service-profit.ts`
- What it does: Dedicated report page. For each service: revenue (period), cost to deliver, staff time cost (duration × staff cost rate), gross profit, profit per hour, margin %. Sortable by any column. Color coded by margin. Filter by staff, category, date range. Export CSV.
- Unlocks: Owner sees which services are actually making money

### Phase 2.4 — Checkout / POS

**Commit 2.4.1** — Checkout flow
- Files: `app/pos/page.tsx`, `components/pos/CheckoutFlow.tsx`, `components/pos/ServiceSelector.tsx`, `components/pos/TipSelector.tsx`, `components/pos/PaymentSelector.tsx`
- What it does: Full checkout. Client → Services + Retail → Discount/Gift Card → Tip → Payment → Success + Rebook. Commission per line item. Deposit auto-deducted. VIP deposit exemption respected.

**Commit 2.4.2** — Receipt delivery
- Files: `lib/comms/receipt.ts`, `app/api/transactions/receipt/route.ts`
- What it does: Email receipt via Resend (itemized). SMS option. Logo, contact info, rebooking link.

**Commit 2.4.3** — Refund flow
- Files: `components/pos/RefundFlow.tsx`, `app/api/transactions/[id]/refund/route.ts`
- What it does: Full or partial refund. Reason required. Commission reversed. Manager approval threshold.

**Commit 2.4.4** — Cash drawer management
- Files: `components/pos/CashDrawer.tsx`, `app/api/cash-drawer/route.ts`
- What it does: Opening count, running total, end-of-day count, expected vs actual, discrepancy notes.

### Phase 2.5 — Staff Management

**Commit 2.5.1** — Staff profiles with cost rates
- Files: `app/staff/page.tsx`, `app/staff/[id]/page.tsx`
- What it does: Directory, profiles, commission, license tracking, schedule, performance, goals.
- Includes: Staff cost rate field (hourly equivalent — used for profit-per-service calculations in N-5). Auto-calculated for commission staff based on average earnings per hour.

**Commit 2.5.2** — Commission engine
- Files: `lib/staff/commission.ts`
- What it does: Flat %, tiered, per-service, booth rent. Commission on TransactionItem. Viewable by role.

**Commit 2.5.3** — Schedule and availability
- Files: `app/staff/[id]/schedule/page.tsx`, `app/api/staff/availability/route.ts`
- What it does: Regular hours, day overrides, time-off requests, owner approval queue.

**Commit 2.5.4** — Clock in / clock out
- Files: `app/clock/page.tsx`, `app/api/clock/route.ts`
- What it does: GPS optional, geofence check, ClockEvent written, weekly hours summary.

**Commit 2.5.5** — Staff KPI tracking (Nisha Team feature)
- Files: `components/staff/KPICard.tsx`, `lib/staff/kpis.ts`
- What it does: Per-staff metrics computed weekly: revenue generated, appointments completed, rebook rate, average ticket, new clients acquired, retail sold, review score. Displayed on staff profile (owner view). Staff see their own KPIs on their personal dashboard. Goals set by owner → progress bar shows % to target.
- Unlocks: Performance conversations backed by data, not gut feel

---

## PHASE 3 — HCM & PAYROLL
**Goal:** Full human capital management

### Phase 3.1 — Employee Classification

**Commit 3.1.1** — Employee classification schema
- Files: `prisma/migrations/[timestamp]_employee_classification/migration.sql`
- What it does: employmentType, hourlyRate, boothRentAmount, boothRentFrequency, boothRentNextDue, overtimeEligible, benefitsEligible, startDate, endDate, terminationReason on Staff. PayPeriod, PayrollRun, PayrollLine tables.

**Commit 3.1.2** — Commission payroll calculation
- Files: `lib/payroll/calculate.ts`
- What it does: Sum TransactionItems per period. Service commission, retail commission, tips. Tiered commission threshold check.

**Commit 3.1.3** — W2 hourly payroll calculation
- Files: `lib/payroll/hourly.ts`
- What it does: ClockEvents → total hours → overtime → tax withholding.

**Commit 3.1.4** — Booth rent billing
- Files: `lib/payroll/boothrент.ts`, `app/api/cron/booth-rent/route.ts`
- What it does: Auto-generate booth rent on due date. ACH debit via Kasse Pay. Fail → alert owner.

### Phase 3.2 — Payroll Disbursement

**Commit 3.2.1** — Payroll UI
- Files: `app/payroll/page.tsx`, `components/payroll/PayrollSummary.tsx`
- What it does: Current period breakdown, adjustments, lock period, disburse button.

**Commit 3.2.2** — Wise API disbursement
- Files: `lib/payroll/disburse.ts`, `app/api/payroll/disburse/route.ts`
- What it does: Wise batch transfer. SMS to each staff member. Webhook updates status.

**Commit 3.2.3** — Staff pay view
- Files: `app/my-pay/page.tsx`
- What it does: Own earnings only. Projected current period (real-time). Past periods with full breakdown.

**Commit 3.2.4** — Kasse Tax Service ($49/month addon)
- Files: `lib/tax/w2.ts`, `lib/tax/1099.ts`, `app/settings/tax/page.tsx`
- What it does: Quarterly 941, annual W2/1099-NEC via third-party tax API. Owner reviews and approves. Kasse files.

---

## PHASE 4 — FINANCIAL OPERATIONS & PROFIT INTELLIGENCE
**Goal:** Kasse is the financial operating system + the business intelligence layer that Nisha is trying to build

### Phase 4.1 — Income Target + Profit Intelligence (Nisha N-5, N-6, N-7, N-8, N-9)

**Commit 4.1.1** — Income target schema + API
- Files: `prisma/migrations/[timestamp]_income_target/migration.sql`, `app/api/income-target/route.ts`
- What it does: IncomeTarget table. PricingAlert table. CRUD endpoints. Calculation logic (monthly needs → hourly rate needed).

**Commit 4.1.2** — Income target UI
- Files: `app/settings/financial-goals/page.tsx`, `components/finance/IncomeTargetCalculator.tsx`
- What it does: Owner enters personal expenses, business overhead, desired salary, savings rate. Kasse instantly shows: monthly revenue needed, weekly needed, per-hour needed, per-chair-per-day needed. Saves to IncomeTarget. Financial literacy tooltips everywhere (N-15).

**Commit 4.1.3** — Profit per service report (Nisha N-5)
- Files: `app/reports/service-profitability/page.tsx`, `lib/reports/service-profit.ts`
- What it does: Full service profitability table. Revenue, cost, staff time cost, gross profit, profit/hr, margin %. Color coded. Sortable. Filterable. Exportable.

**Commit 4.1.4** — Smart pricing alerts engine (Nisha N-7)
- Files: `lib/ai/pricing-alerts.ts`, `app/api/cron/pricing-alerts/route.ts`
- What it does: Nightly cron. Compares each service's actual margin vs target from income goal. Creates PricingAlert for any service below target. Owner sees alerts on dashboard and in Reports → Pricing. Alert shows current price, recommended price, current margin, target margin, and explanation in plain English. Owner actions: Update Price Now (one click), Snooze 30 Days, Dismiss.

**Commit 4.1.5** — Three-tier financial reporting (Nisha N-8)
- Files: `app/reports/page.tsx`, `components/reports/ReportingTierSelector.tsx`, `components/reports/SimpleReport.tsx`, `components/reports/IntermediateReport.tsx`, `components/reports/AdvancedReport.tsx`
- What it does: Owner selects reporting sophistication level in Settings. Simple (3 numbers), Intermediate (category breakdown + trends), Advanced (full P&L with variance analysis, per-chair economics, YoY, export).

**Commit 4.1.6** — Business health dashboard (Nisha N-9)
- Files: `app/reports/health/page.tsx`, `components/dashboard/BusinessHealthWidget.tsx`, `lib/ai/health-score.ts`
- What it does: Weekly auto-generated health report. Chair utilization, rebook rate, average ticket, no-show rate, new client vs lapsed ratio, revenue per hour vs income target. Traffic light per metric. AI summary paragraph. Historical trend (last 12 weeks per metric). Emailed to owner every Monday morning.

**Commit 4.1.7** — Growth Journal (Nisha N-10)
- Files: `app/ai/journal/page.tsx`, `components/ai/JournalFeed.tsx`, `lib/ai/journal.ts`
- What it does: GrowthJournal table populated automatically. Every pricing alert created, milestone hit, win-back result, rebook rate milestone, cancellation risk caught → journal entry created. Owner sees chronological feed of AI-generated business insights. Searchable by topic. Each entry links to relevant feature. "Kasse noticed X, took action Y, result was Z" format.

### Phase 4.2 — Banking & Bill Pay

**Commit 4.2.1** — Banking schema
- Files: `prisma/migrations/[timestamp]_banking/migration.sql`
- What it does: KasseAccount, KasseTransaction tables.

**Commit 4.2.2** — Banking dashboard
- Files: `app/banking/page.tsx`, `components/banking/AccountCard.tsx`, `components/banking/TransactionFeed.tsx`
- What it does: Balance, settlements incoming, transaction feed, statement download.

**Commit 4.2.3** — Bill pay
- Files: `prisma/migrations/[timestamp]_billpay/migration.sql`, `app/banking/bill-pay/page.tsx`
- What it does: Vendor management, bill creation, recurring bills, ACH payment, bill calendar, 3-day alerts.

**Commit 4.2.4** — P&L report
- Files: `app/reports/profit-loss/page.tsx`, `lib/reports/pl.ts`
- What it does: Monthly P&L. Revenue, COGS, expenses, gross profit, net profit. Month vs prior month, month vs same month last year. PDF/CSV export.

**Commit 4.2.5** — Chart of accounts + QuickBooks sync
- Files: `app/settings/accounts/page.tsx`, `lib/accounting/categories.ts`, `lib/integrations/quickbooks.ts`
- What it does: Default categories, custom categories allowed. QuickBooks Online two-way sync.

---

## PHASE 5 — AI & AUTOMATION
**Goal:** AI Receptionist live, full automation suite running, AI content generation

### Phase 5.1 — AI Receptionist

**Commit 5.1.1** — AI Receptionist setup wizard
- Files: `app/ai-receptionist/setup/page.tsx`, `app/api/ai-receptionist/configure/route.ts`
- What it does: 4-step setup. Voice personality, Twilio number, capabilities toggle, test call from portal.

**Commit 5.1.2** — Inbound call handling
- Files: `app/api/ai-receptionist/voice/route.ts`, `lib/ai/receptionist.ts`
- What it does: Twilio webhook → OpenAI Realtime → books appointment → logs call.

**Commit 5.1.3** — AI Receptionist dashboard
- Files: `app/ai-receptionist/page.tsx`, `components/ai/CallLog.tsx`
- What it does: Calls handled, bookings captured, missed calls, transcripts, recordings.

### Phase 5.2 — Marketing Automation

**Commit 5.2.1** — Win-back campaign engine
- Files: `app/api/cron/winback/route.ts`, `lib/campaigns/winback.ts`
- What it does: Nightly cron. Lapsed clients → personalized SMS/email. Tracks rebooking outcome.

**Commit 5.2.2** — Review request automation
- Files: `app/api/cron/reviews/route.ts`, `lib/campaigns/review.ts`
- What it does: 2 hours post-appointment. 4-5 stars → Google. 1-3 → internal form. ReviewRequest tracks everything.

**Commit 5.2.3** — Birthday automation
- Files: `app/api/cron/birthdays/route.ts`
- What it does: Morning of birthday. Discount code auto-generated. Redemption tracked.

**Commit 5.2.4** — Cancellation risk alert delivery (Nisha N-11)
- Files: `app/api/cron/risk-alerts/route.ts`, `lib/ai/cancellation-risk.ts`
- What it does: Scores appointments for no-show risk. Daily digest to owner. One-tap personal reminder SMS. Updates riskAlertSent flag.

**Commit 5.2.5** — Retention + rebooking insights with AI (Nisha N-14)
- Files: `lib/ai/retention-insights.ts`, `app/reports/retention/page.tsx`
- What it does: Weekly AI analysis. Which staff have highest rebook rates, which services have lowest rebooking, which client segments are lapsing. Specific AI recommendations: "Your Monday 2pm slot has 40% lower rebook rate than Tuesday 2pm — consider a Monday loyalty discount." Each recommendation actionable from the report.

**Commit 5.2.6** — AI-generated forms and documents (Nisha N-12)
- Files: `app/forms/generate/page.tsx`, `app/api/forms/generate/route.ts`, `lib/ai/form-generator.ts`
- What it does: Owner types what they need. Claude API generates form fields. Draft mode. Owner reviews, edits, activates. Pre-prompts for common types: chemical service waiver, new client intake, patch test, consultation form. Saves to FormTemplate table.

**Commit 5.2.7** — AI marketing content generation (Nisha N-13)
- Files: `components/campaigns/AIContentGenerator.tsx`, `app/api/campaigns/generate/route.ts`
- What it does: In campaign builder: select type, channel, tone → Claude generates subject line, message body, personalization suggestions, best send time. Owner edits and sends. Removes blank page problem from every campaign.

---

## PHASE 6 — INCUBATOR PROGRAM

**Commit 6.1.1** — Incubator schema
- Files: `prisma/migrations/[timestamp]_incubator/migration.sql`
- What it does: IncubatorCohort, IncubatorApplication, IncubatorParticipant, IncubatorModule, IncubatorProgress, KasseGrant tables.

**Commit 6.1.2** — Public application page
- Files: `app/(public)/incubator/apply/page.tsx`, `app/api/incubator/apply/route.ts`
- What it does: No login required. Full application form. Creates IncubatorApplication. Confirmation email.

**Commit 6.1.3** — AI application scoring
- Files: `lib/incubator/score.ts`
- What it does: Claude API scores application 0-100. Score + summary stored. Helps Robert prioritize review.

**Commit 6.1.4** — Incubator admin dashboard
- Files: `app/admin/incubator/page.tsx`
- What it does: Application queue with AI scores. Review, accept/reject/waitlist, notifications.

**Commit 6.1.5** — Participant cohort portal
- Files: `app/incubator/page.tsx`, `components/incubator/CohortDashboard.tsx`
- What it does: Module schedule, current week content, progress, peer directory, graduation checklist, prize status.

---

## PHASE 7 — MARKETING SITE

**Commit 7.1.1** — Marketing site foundation
- Files: `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`
- What it does: Separate layout. Navigation. Hero. Real product screenshots (not mockups).
- Key positioning: Kasse vs Nisha — "We show profitability AND handle payroll, banking, and payroll. Not just charts."

**Commit 7.1.2** — Pricing page
- Files: `app/(marketing)/pricing/page.tsx`
- What it does: 5-tier comparison. Addons. Monthly/annual toggle. FAQ.

**Commit 7.1.3** — Incubator landing page
- Files: `app/(marketing)/incubator/page.tsx`
- What it does: Full program page. Prize structure. How it works. Application CTA.

**Commit 7.1.4** — Compare pages (SEO)
- Files: `app/(marketing)/compare/vs-square/page.tsx`, `app/(marketing)/compare/vs-vagaro/page.tsx`, `app/(marketing)/compare/vs-nisha/page.tsx`
- What it does: Direct feature comparison tables. "Why Kasse" vs each competitor. Targets high-intent search traffic.

---

## COMPLETE FEATURE INVENTORY — NISHA VS KASSE

| Nisha Feature | Nisha Status | Kasse Phase | Kasse Status |
|--------------|-------------|-------------|-------------|
| Profit per service | ✓ Core | Phase 4.1.3 | Planned |
| Income target calculator | ✓ Core | Phase 4.1.2 | Planned |
| Smart pricing alerts | ✓ Core | Phase 4.1.4 | Planned |
| AI business coach | ✓ Core | Phase 5.2.5 | Planned |
| Smart break scheduling | ✓ Team | Phase 2.1.5 | Planned |
| VIP client deposit exemptions | ✓ Core | Phase 2.2.3 | Planned |
| Public holiday auto-calendar | ✓ Core | Phase 2.1.8 | Planned |
| Non-bookable staff free | ✓ Core | Phase 1.3.2 | Planned |
| Three-tier reporting | ✓ Pro | Phase 4.1.5 | Planned |
| Growth journal | ✓ All | Phase 4.1.7 | Planned |
| Review display on booking page | ✓ All | Phase 3 (booking page) | Planned |
| Chair utilization as hero metric | ✓ All | Phase 0.2.2 | Planned |
| Service cost tracking | ✓ Core | Phase 2.3.1 | Planned |
| Cancellation risk alerts | ✓ All | Phase 5.2.4 | Planned |
| AI-generated forms | ✓ All | Phase 5.2.6 | Planned |
| AI marketing content | ✓ Pro | Phase 5.2.7 | Planned |
| Staff KPI tracking | ✓ Team | Phase 2.5.5 | Planned |
| Financial literacy explanations | ✓ All | Phase 1.1.3+ | Planned |
| Wage cost tracking | ✓ Team | Phase 3.2.1 | Planned |
| Client retention insights | ✓ Pro | Phase 5.2.5 | Planned |
| Payroll | ✗ Not offered | Phase 3 | Planned |
| Banking | ✗ Not offered | Phase 4.2 | Planned |
| Bill pay | ✗ Not offered | Phase 4.2 | Planned |
| AI Receptionist (phone) | ✗ Not offered | Phase 5.1 | Planned |
| Franchise tools | ✗ Not offered | Phase 7 | Planned |
| Incubator program | ✗ Not offered | Phase 6 | Planned |
| Migration system | ✗ Not offered | Phase 3.5 | Planned |
| Multi-location | Limited | All phases | Core |
| Walk-in queue | ✗ Not offered | Phase 4 | Planned |
| Staff mobile app | ✗ Not offered | Phase 3 | Planned |
| Formula cards | ✗ Not offered | Phase 2 | Planned |

**Summary:** Kasse does everything Nisha does, plus everything Nisha doesn't. Nisha is a sharp analytics layer. Kasse is the full financial operating system.

---

## SCHEMA MIGRATIONS MASTER LIST

| Priority | Migration | Adds | Phase |
|----------|-----------|------|-------|
| CRITICAL | employee_classification | employmentType, hourlyRate, boothRent on Staff | Phase 3 |
| CRITICAL | payroll_tables | PayPeriod, PayrollRun, PayrollLine | Phase 3 |
| HIGH | income_target | IncomeTarget, PricingAlert | Phase 4.1 |
| HIGH | growth_journal | GrowthJournal | Phase 4.1.7 |
| HIGH | banking_tables | KasseAccount, KasseTransaction | Phase 4.2 |
| HIGH | billpay_tables | Vendor, Bill | Phase 4.2 |
| HIGH | public_holidays | PublicHoliday | Phase 2.1.8 |
| MEDIUM | service_costs | productCost, consumableCost, targetMarginPct on Service | Phase 2.3.1 |
| MEDIUM | cancellation_risk | cancellationRiskScore, riskAlertSent on Appointment | Phase 2.1.7 |
| MEDIUM | staff_kpis | staffCostRate on Staff | Phase 2.5.5 |
| MEDIUM | incubator_tables | IncubatorCohort + all related | Phase 6 |
| MEDIUM | vertical_config | verticalId, verticalConfig on Organization | Phase 1.1.2 |
| LOW | staff_payroll_setup | wiseAccountId, wiseRecipientId on Staff | Phase 3.2.2 |
| LOW | vip_client | isVip, vipSetAt, vipReason on Client | Phase 2.2.3 |

---

## DOCS INVENTORY — lendbucket/kasse/docs/

| File | Lines | Status | Last Updated |
|------|-------|--------|-------------|
| KASSE_PHASE_COMMITS.md | this file | Active — update every session | May 6, 2026 |
| KASSE_DESIGN_SYSTEM.md | 1,538 | Complete | May 6, 2026 |
| KASSE_MASTER_BUILDPLAN.md | 848 | Complete | May 6, 2026 |
| KASSE_VERTICALS_EXPANDED.md | 1,614 | Complete | May 6, 2026 |
| KASSE_SUPPORT.md | 604 | Complete | May 6, 2026 |
| KASSE_DAYOPS.md | 1,438 | Complete | May 6, 2026 |
| KASSE_MIGRATION.md | 781 | Complete | May 6, 2026 |
| KASSE_RETENTION.md | 818 | Complete | May 6, 2026 |
| KASSE_FRANCHISE_ALL.md | 811 | Complete | May 6, 2026 |
| KASSE_INTEGRATIONS.md | 1,121 | Complete | May 6, 2026 |
| KASSE_ONBOARDING.md | 647 | Complete | May 6, 2026 |
| KASSE_PORTALS.md | 743 | Complete | May 6, 2026 |
| KASSE_TIERS.md | 420 | Complete | May 6, 2026 |
| KASSE_PORTAL_ARCHITECTURE.md | 997 | Complete | May 6, 2026 |
| KASSE_INCUBATOR.md | 494 | Complete | May 6, 2026 |
| KASSE_PAYROLL_BILLPAY.md | 929 | Complete | May 6, 2026 |
| KASSE_MARKETING_SITE.md | 621 | Complete | May 6, 2026 |

---

## THE COMPETITIVE MOAT — WHAT NOBODY ELSE HAS ALL OF

When Phase 5 is complete, Kasse will have simultaneously:

1. **Profit intelligence** (what Nisha is trying to build) — profit per service, income targets, smart pricing alerts, growth journal
2. **Full financial operations** (what QuickBooks + Gusto + Bill.com do separately) — banking, payroll, bill pay, P&L, tax filing
3. **AI-native operations** (what nobody has built for this market) — AI receptionist, AI forms, AI campaigns, AI coaching, cancellation risk prediction
4. **Distribution infrastructure** (unique in market) — incubator program, franchise creator, migration center, referral flywheel
5. **Hardware + software vertical integration** (unique) — Kasse Pay + Kasse terminal + Kasse banking on same rails

No single competitor has more than 2 of these 5. Kasse will have all 5.

---

*Document version 2.0 — Living document. Updated every session.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Last updated: May 6, 2026 — Added full Nisha.com.au feature analysis and integration*
