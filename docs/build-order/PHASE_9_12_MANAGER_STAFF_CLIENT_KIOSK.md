# PHASE 9-12 — ROLE-BASED VIEWS + CLIENT + KIOSK

**Scope:** Manager role views (P9, 20 PRs), Staff role views + mobile polish (P10, ~40-60 PRs), Client Portal + public booking + iPhone native (P11, 60 PRs), Kiosk mode (P12, 40 PRs).
**Total PRs:** ~120-140 (depending on whether P10.F iPhone native staff app is kept or deferred)
**Depends on:** P6 (Owner Portal) provides the framework + the permission system. P0 foundation.
**Parallelizable:** All four phases can run in parallel after P6.

## ARCHITECTURAL NOTE (2026-05-26)

Kasse uses ONE portal at `/dashboard` with role-based access control, NOT separate portals per role. This is the standard SaaS pattern (Square, Toast, Vagaro, Mindbody all work this way).

- **Owner role** sees everything
- **Manager role** sees everything except what the owner has restricted via permissions (default: no financial / payroll / billing / role-edit)
- **Staff role** sees permission-gated views: their own appointments (Today, Schedule), clients they've served (My Clients), their own earnings, clock-in/clock-out, mobile POS. NO routes under `/staff/*`. NO separate dashboard. SAME route tree, role-based gates.
- **Front desk role** (future) sees calendar + check-in flow, gated permissions on financial detail

P9 and P10 are about role-based VIEW LAYERS within the single portal: which sidebar items show, which API endpoints respond, which page sections render, what data scope is applied. They are NOT separate portals.

P11 (Client) and P12 (Kiosk) ARE genuinely separate surfaces:
- Client is not an employee role; clients log in via magic-link, see only their own data, never see employee surfaces
- Kiosk is a PIN-locked tablet with a locked-down UX, different from the employee portal entirely

**Reference docs:** KASSE_PORTALS.md and KASSE_PORTAL_ARCHITECTURE.md describe the legacy 4-portal architecture. Those docs should be updated separately to reflect the role-based-views pattern. This doc is the authoritative build sequence.

---

# P9 — MANAGER ROLE VIEWS & PERMISSIONS (20 PRs)

Manager shares route tree with OWNER but layout enforces permission filter. Defense-in-depth at API layer.

### P9.1 — Manager role filter at layout level
Files: `app/dashboard/layout.tsx` (extend)
If user.role === MANAGER, hide Financial / Payroll / Billing / Settings.edit_roles sections from sidebar via permission gates.
Acceptance: MANAGER sees no Financial nav. OWNER does.

### P9.2 — API-layer enforcement (every endpoint)
Files: every `/api/financial/*`, `/api/payroll/*`, `/api/billing/*`, `/api/settings/roles/*`
Each route handler calls `requirePermission()` before any business logic.
Acceptance: MANAGER hitting forbidden API returns 403 with structured error.

### P9.3 — Manager dashboard (location-scoped)
Files: `app/dashboard/page.tsx` (extend with role-aware filtering)
Manager sees only their assigned location(s). KPIs aggregated to that scope.
Acceptance: Multi-location org → manager sees only their location.

### P9.4 — Manager onboarding tour
Files: `lib/tours/manager.ts`
Explains what manager can / cannot see vs owner.
Acceptance: First-time MANAGER login triggers tour.

### P9.5 — Manager-specific KPIs
Files: `components/dashboard/ManagerKPIs.tsx`
Today's appointments, today's revenue (their location), staff utilization, no-show rate, etc.

### P9.6 — Manager location switching
If manager has access to multiple locations, location switcher in top bar.

### P9.7-10 — Manager-specific reports (4 PRs)
Location operational reports. No financial / commission depth.

### P9.11-15 — Manager-specific permissions per page (5 PRs)
Granular: view clients (yes), view client SSN (no). View appointments (yes), view financial detail (no). View staff (yes), view staff compensation (no).

### P9.16-18 — Staff approval workflows (3 PRs)
Manager approves time-off requests, schedule swaps, discount overrides.

### P9.19 — Manager limits
Single discount limit per transaction (above which OWNER approval needed). Set in OWNER settings.

### P9.20 — Manager activity report
Files: `app/admin/managers/page.tsx`
SUPERADMIN view of manager actions (approvals, discounts applied, etc.).

---

# P10 — STAFF ROLE VIEWS + MOBILE POLISH + (OPTIONAL) iPhone NATIVE (~40-60 PRs)

## ARCHITECTURAL CORRECTION

The legacy doc structure described `/staff/*` as a separate route tree. **Strike that.** Staff sees the SAME `/dashboard/*` routes as owner and manager, with role-based permission gates restricting what they see and do.

The components below are real (Today screen, Schedule, My Clients, Earnings, Clock-In, Mobile POS) — what changes is they live as PERMISSION-GATED VIEWS within the existing dashboard, not under a separate `/staff/*` prefix.

Specifically:
- **DROP P10.A.1** (`/staff/*` route tree) — no separate route prefix
- **DROP P10.A.2** (mobile-optimized base layout for staff) — mobile responsiveness applies portal-wide
- **CHANGE P10.A.3** (auth gate) to a role-based permission gate in middleware
- **KEEP P10.A.4-10** (onboarding tour, PWA install, offline indicator, push notifications, etc.) — these apply portal-wide, not staff-only
- **KEEP P10.A.11-15** (settings) — these apply to all roles
- **KEEP P10.B** (Today + Schedule, 15 PRs) — but as views under `/dashboard/today` and `/dashboard/schedule` with permission gates scoping to own-staff for staff role, all-staff for owner/manager
- **KEEP P10.C** (My Clients, 10 PRs) — same: `/dashboard/clients` with permission scope filter
- **KEEP P10.D** (My Earnings, 10 PRs) — `/dashboard/earnings` with permission scope filter
- **KEEP P10.E** (Clock In/Out + Mobile POS, 10 PRs) — `/dashboard/clock`, `/dashboard/checkout` with permission gates
- **OPTIONAL P10.F** (Staff iPhone native, 20 PRs) — defer post-launch if PWA-first is acceptable

## P10.A — Staff Portal Web Routes (15 PRs)

### P10.A.1 — `/staff/*` route tree — **REMOVED (see Architectural Correction above)**
Files: `app/staff/layout.tsx`
Bottom-nav layout (mobile-first). Tabs: Today, Schedule, Clients, Earnings, More.

### P10.A.2 — Mobile-optimized base layout — **REMOVED (see Architectural Correction above)**
Large touch targets. Sticky bottom nav.

### P10.A.3 — Auth gate
Only STAFF / STAFF_VIEW_ONLY can access.

### P10.A.4 — Staff onboarding tour
Files: `lib/tours/staff.ts`

### P10.A.5 — PWA install prompt
"Add to Home Screen" prompt after 3 visits.

### P10.A.6 — Offline indicator
Banner when offline.

### P10.A.7 — Push notification opt-in
Web Push API. Prompt after first appointment view.

### P10.A.8 — Pull-to-refresh
Standard gesture.

### P10.A.9 — Loading states
Skeletons.

### P10.A.10 — Empty states
"No appointments today" CTAs.

### P10.A.11-15 — Settings (5 PRs)
Profile edit, password change, notification prefs, locale, sign out.

## P10.B — My Today + Schedule (15 PRs)

### P10.B.1 — Today screen
Files: `app/staff/page.tsx`
Today's appointments for this staff. Cards with client, service, time, notes.

### P10.B.2 — Pull-to-refresh today
### P10.B.3 — Tap appointment → detail
Client info, service, notes, photos, history.
### P10.B.4 — Check-in client from staff app
Tap "Check In" → status flip.
### P10.B.5 — Add note inline
### P10.B.6 — Upload photo inline (before/after)
### P10.B.7 — Mark complete
### P10.B.8 — Quick rebook from appointment
### P10.B.9 — Schedule view (week)
This week, 7 days, own appointments.
### P10.B.10 — Schedule view (month)
### P10.B.11 — Schedule next-week peek
### P10.B.12 — Time-off request
Submit dates + reason. Owner approves.
### P10.B.13 — Availability set
Recurring weekly availability.
### P10.B.14 — Schedule swap request
With another staff member. Owner approves.
### P10.B.15 — Schedule push notifications
Reminder 15min before appt. Schedule changed notifications.

## P10.C — My Clients (10 PRs)

### P10.C.1 — Clients screen (own only)
Files: `app/staff/clients/page.tsx`
List of clients this staff has served. Sort by last visit DESC.

### P10.C.2 — Search own clients
### P10.C.3 — Client detail (limited)
Same tabs as owner view BUT redacted financial info per role permissions.
### P10.C.4 — Add note to client
### P10.C.5 — Add photo to client
### P10.C.6 — Message client (SMS)
### P10.C.7 — View formula history (salon)
### P10.C.8 — Mark VIP (request to OWNER)
### P10.C.9 — Client preferences (notes for future)
### P10.C.10 — Family member visibility
Only clients assigned to this staff. Family members shown if assigned.

## P10.D — My Earnings (10 PRs)

### P10.D.1 — Earnings dashboard
Files: `app/staff/earnings/page.tsx`
This pay period: services performed, commission earned, tips, total.

### P10.D.2 — Pay history (past periods)
### P10.D.3 — Tip breakdown
Per appointment.
### P10.D.4 — Commission breakdown
Per service. Per category.
### P10.D.5 — Pay stub (PDF download)
### P10.D.6 — Tax document access (1099/W-2)
Annual.
### P10.D.7 — Earnings goal tracking
### P10.D.8 — Comparison to last period
### P10.D.9 — Direct deposit setup (link to SalonBacked payroll P27)
Stub for now.
### P10.D.10 — Earnings notifications (end of day)

## P10.E — Clock In/Out + Mobile POS (10 PRs)

### P10.E.1 — Clock-in screen
Files: `app/staff/clock/page.tsx`
GPS-verified. Geofence around location.

### P10.E.2 — Clock-out screen
Same. Confirm hours.

### P10.E.3 — Break tracking
Start/end break.

### P10.E.4 — Time card view
This pay period hours.

### P10.E.5 — Adjustment requests (forgot to clock)
Submit to manager for approval.

### P10.E.6-10 — Mobile POS (5 PRs)
Take Payment screen. Permission-gated. Card-not-present primary. Cash. Tip. Receipt. Past transactions own only.

## P10.F — Staff iPhone Native App (20 PRs) — **OPTIONAL** — defer post-launch unless explicitly prioritized

### P10.F.1 — iPhone target in `lendbucket/kasse-native`
Same monorepo. Different entry point.

### P10.F.2 — iPhone-specific layouts
Portrait-first. Single column.

### P10.F.3 — Tab navigation (bottom)
Today / Schedule / Clients / Earnings / More.

### P10.F.4 — Push notifications (APNs)
Server sends via Expo Push.

### P10.F.5 — Today screen (RN)
### P10.F.6 — Appointment detail (RN)
### P10.F.7 — Check-in (RN)
### P10.F.8 — Client search (RN)
### P10.F.9 — Client detail (RN)
### P10.F.10 — Add note (RN)
### P10.F.11 — Add photo (RN)
### P10.F.12 — Camera permission flow
### P10.F.13 — Earnings (RN)
### P10.F.14 — Pay stub view (RN)
### P10.F.15 — Clock in/out (RN)
### P10.F.16 — Geolocation permission
### P10.F.17 — Schedule (RN)
### P10.F.18 — Time-off request (RN)
### P10.F.19 — Offline cache (WatermelonDB)
Same patterns as iPad.
### P10.F.20 — App Store submission (Staff app, separate Bundle ID)

---

# P11 — CLIENT PORTAL + PUBLIC BOOKING + iPhone NATIVE (60 PRs)

## P11.A — Public Booking Page (15 PRs)

### P11.A.1 — `/book/[slug]` route
Files: `app/book/[slug]/page.tsx`
Per-org public page. Vertical-aware flow.

### P11.A.2 — Booking flow: select service
Hero, services grid by category, descriptions, prices, durations.

### P11.A.3 — Booking flow: select staff (optional)
Anyone or specific. Staff bios.

### P11.A.4 — Booking flow: select date/time
Available slots. Real-time check against calendar.

### P11.A.5 — Booking flow: client info
Existing client (magic link) or new client signup. Required fields per vertical.

### P11.A.6 — Booking flow: deposit (if required)
Apple Pay / Google Pay / Card. Engine charge for deposit.

### P11.A.7 — Booking flow: confirmation
Email + SMS sent. Add to calendar (.ics).

### P11.A.8 — Booking flow: forms (intake, waiver)
If service requires, prompt to fill.

### P11.A.9 — Booking page customization (from P1.C.5)
Per-org branding. Logo, hero, color, message.

### P11.A.10 — Custom domain support
book.{merchantdomain}.com via reverse proxy.

### P11.A.11 — Reviews display on booking page
Aggregated rating + recent reviews.

### P11.A.12 — Staff portfolios
Per-stylist photos visible.

### P11.A.13 — Trust badges (Powered by Reyna Pay, etc.)
Per memory: SalonTransact footer required.

### P11.A.14 — Mobile optimization
Booking page is mobile-first by definition.

### P11.A.15 — Accessibility (WCAG 2.1 AA)
Screen reader support, keyboard nav, color contrast.

## P11.B — Client Portal (Magic-Link Login, No Password) (15 PRs)

### P11.B.1 — `/client/*` route tree
Magic-link auth. No password.

### P11.B.2 — Magic-link email
Sent on demand (login form has just email field).

### P11.B.3 — Magic-link expiry (15min)
### P11.B.4 — Session persistence
30-day session cookie.

### P11.B.5 — Client home
Upcoming appointments, recent visits, quick book.

### P11.B.6 — Reschedule (within policy)
### P11.B.7 — Cancel (within policy)
### P11.B.8 — Add to calendar
.ics download.

### P11.B.9 — Visit history
### P11.B.10 — Receipt download
PDF.

### P11.B.11 — Gift card balance
### P11.B.12 — Loyalty points
### P11.B.13 — Saved cards
View, remove (cannot edit per PCI).

### P11.B.14 — Profile (name, phone, email, communication prefs)
### P11.B.15 — Data export (GDPR/CCPA)

## P11.C — Forms + Booking Widget (10 PRs)

### P11.C.1 — Client intake forms (mobile)
Pre-appointment forms render on phone.

### P11.C.2 — Digital signature on intake
### P11.C.3 — Form submission audit
### P11.C.4 — Form completion reminder
### P11.C.5 — Booking widget v1 (embed script)
`<script src="kasseapp.com/widget.js" data-org="..."></script>`
### P11.C.6 — Widget v1 themes (light/dark)
### P11.C.7 — Widget v1 service pre-select
### P11.C.8 — Widget v1 size variants (inline / sidebar / modal)
### P11.C.9 — Apple Pay on booking page
### P11.C.10 — Google Pay on booking page

## P11.D — Native Client iPhone App (20 PRs)

### P11.D.1 — Client app target in kasse-native
Bundle `com.kasseapp.client`.

### P11.D.2 — Onboarding (3-screen tutorial)
### P11.D.3 — Sign in / sign up
Magic link or phone OTP.

### P11.D.4 — Phone OTP via Twilio Verify
### P11.D.5 — Browse merchants (if signed in via marketplace, future P29)
For now, single-merchant focus per booking link.

### P11.D.6 — Book service (RN)
### P11.D.7 — Pick staff (RN)
### P11.D.8 — Pick time (RN)
### P11.D.9 — Apple Pay (RN, native)
### P11.D.10 — Confirmation (RN)
### P11.D.11 — Upcoming appointments
### P11.D.12 — Reschedule (RN)
### P11.D.13 — Cancel (RN)
### P11.D.14 — Visit history (RN)
### P11.D.15 — Saved cards (RN)
### P11.D.16 — Loyalty + gift card (RN)
### P11.D.17 — Profile (RN)
### P11.D.18 — Push notifications (reminders)
### P11.D.19 — Apple Wallet pass for upcoming appointments
.pkpass file. Adds to Wallet.

### P11.D.20 — App Store submission (Client app)

---

# P12 — KIOSK MODE (40 PRs)

Per OQ-002: start with PWA, native later. PIN-locked iPad use case.

## P12.A — Kiosk Route Tree + PIN Lock (10 PRs)

### P12.A.1 — `/kiosk/*` route tree
Files: `app/kiosk/layout.tsx`
Full-screen layout. No portal sidebar.

### P12.A.2 — Kiosk PIN setup
Manager sets 6-digit PIN. Required to exit kiosk mode.

### P12.A.3 — Kiosk session (separate from user session)
Browser session keyed to org + location + PIN.

### P12.A.4 — Fullscreen lock attempt (browser API)
JS fullscreen request. Some browsers limit.

### P12.A.5 — Exit kiosk → PIN prompt
Tap "Exit" → PIN entry → web portal.

### P12.A.6 — Kiosk timeout (return to home screen after 60s idle)
### P12.A.7 — Kiosk admin override (master PIN)
SUPERADMIN can override location PIN.

### P12.A.8 — Kiosk activity log
Sessions, check-ins, checkouts logged.

### P12.A.9 — Kiosk mode visual differentiation
Different background. "Welcome" branding.

### P12.A.10 — Kiosk language selector
English / Spanish per memory.

## P12.B — Self-Check-In Flow (10 PRs)

### P12.B.1 — Welcome screen
"Welcome! Check in here."

### P12.B.2 — Phone lookup
Enter phone → match existing client → confirm name.

### P12.B.3 — New client signup inline
Required: name, phone, email. Form fits screen.

### P12.B.4 — Confirm appointment (if has)
Show today's appt → "Check in?" → Yes → done.

### P12.B.5 — No appointment flow → join walk-in queue
### P12.B.6 — Form fill (intake, waiver)
If service requires.

### P12.B.7 — Notify stylist
Push to staff app: "Sarah just checked in."

### P12.B.8 — Confirmation screen
"You're checked in! Sarah will be with you shortly."

### P12.B.9 — Return to welcome (auto after 10s)
### P12.B.10 — Audit log of check-ins

## P12.C — Self-Service Walk-In (10 PRs)

### P12.C.1 — Walk-in service picker
Available services for walk-in (configurable per Service.walkInAvailable).

### P12.C.2 — Staff picker (optional)
"Anyone" or specific available staff.

### P12.C.3 — Wait time estimate
AI per P23 (barbershop) or simple average.

### P12.C.4 — Join queue confirmation
"You're #3. Estimated wait 25 min."

### P12.C.5 — SMS subscribe for "you're up" text
### P12.C.6 — Position-in-line updates
### P12.C.7 — Cancel queue spot
### P12.C.8 — Walk-in conversion to appointment (if slot opens)
### P12.C.9 — Walk-in analytics
### P12.C.10 — Walk-in handoff to staff

## P12.D — Self-Checkout (10 PRs)

### P12.D.1 — Checkout code from staff
Staff generates 4-digit code → customer enters at kiosk → bill pulled up.

### P12.D.2 — Review ticket
Itemized.

### P12.D.3 — Tip prompt (large buttons)
### P12.D.4 — Payment method (card-present, Apple Pay, Google Pay)
### P12.D.5 — Card-present (terminal)
### P12.D.6 — Signature on screen
### P12.D.7 — Receipt: email / SMS / print
### P12.D.8 — "Thank you!" screen
### P12.D.9 — Return to welcome (auto)
### P12.D.10 — Audit log of self-checkouts

---

## PHASE 9-12 COMPLETION CRITERIA

- All ~120-140 PRs merged
- Manager role views restrictive per spec
- Staff role views accessible within single portal, mobile-responsive + optional iPhone native
- Public booking page live for Salon Envy
- Client portal accessible via magic link
- Kiosk mode functional at Salon Envy front desk
- KASSE_REAL_BUILD_ORDER.md updated

**After P9-12:** Foundation complete. P13-P22 (intelligence, AI, automation, financial) can run in parallel.
