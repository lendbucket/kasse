# PHASE 23-26 — VERTICALS DEEP BUILD (Phase 1)

**Scope:** Barbershop full (P23, 50 PRs), Nail Salon (P24, 30 PRs), Restaurant full (P25, 60 PRs), Gym + Med Spa initial (P26, 40 PRs).
**Total PRs:** 180
**Depends on:** P6 (Owner Portal framework), P0.C (VerticalConfig system).
**Parallelizable:** Each vertical can run in parallel after P6.
**Reference docs:** KASSE_VERTICALS_EXPANDED.md (each vertical's full spec), KASSE_VERTICAL_SPECS.md.

---

# P23 — BARBERSHOP FULL BUILD (50 PRs)

Per VERTICAL 2 in KASSE_VERTICALS_EXPANDED.md.

## P23.A — Vertical Config Deepening (5 PRs)

### P23.A.1 — Barbershop config expanded (full nav, dashboard widgets, terminology)
### P23.A.2 — Barbershop-specific Service templates (Men's Haircut, Beard Trim, Hot Towel, etc.)
### P23.A.3 — Barbershop-specific onboarding checklist
### P23.A.4 — Barbershop terminology audit (every UI string)
### P23.A.5 — Barbershop dashboard widgets (queue board, wait times, peak hour tracker)

## P23.B — Walk-In Queue System (15 PRs)

### P23.B.1 — Schema: QueueEntry table
```prisma
model QueueEntry {
  id              String @id @default(cuid())
  organizationId  String
  locationId      String
  clientId        String?  // null for new walk-in
  clientName      String
  clientPhone     String
  serviceIds      String[]
  preferredStaffId String?
  joinedAt        DateTime @default(now())
  estimatedWait   Int  // minutes
  status          String  // WAITING, READY, IN_SERVICE, COMPLETED, ABANDONED
  notifiedAt      DateTime?
  position        Int
}
```

### P23.B.2 — Live queue board UI (owner/staff view)
Files: `app/dashboard/queue/page.tsx`
Real-time cards. Drag-reorder.

### P23.B.3 — Queue admin actions (call next, remove, transfer to staff)
### P23.B.4 — TV board display (kiosk-friendly large screen)
Files: `app/kiosk/queue-board/page.tsx`
Full-screen, large fonts. Shown in shop.

### P23.B.5 — Queue board: current customer in chair per barber
### P23.B.6 — Queue board: next up
### P23.B.7 — Queue board: full queue list
### P23.B.8 — Queue board: auto-refresh every 10s
### P23.B.9 — QR code at door → join queue from phone
Files: `app/(public)/queue/[orgSlug]/page.tsx`
Public page, no login. Enter name + phone + service.

### P23.B.10 — SMS notifications (3 spots away, ready now, etc.)
Twilio SMS via existing infra.

### P23.B.11 — Barber-specific queues (client picks barber line)
### P23.B.12 — Walk-in cancellation
### P23.B.13 — Walk-in conversion to appointment (book future)
### P23.B.14 — Wait time prediction AI (per-barber service time learning)
Logistic regression on past service durations.

### P23.B.15 — Queue analytics (avg wait, abandonment rate, peak times)

## P23.C — Hybrid Appointments + Walk-In Mode (5 PRs)

### P23.C.1 — Appointment slot mixed with walk-in queue
### P23.C.2 — Walk-in pause mode (when booked solid)
### P23.C.3 — Per-barber availability toggle (accepting walk-ins yes/no)
### P23.C.4 — Express service flagging (quick services jump queue)
### P23.C.5 — Reservation priority (appointment > walk-in)

## P23.D — Booth Rent (10 PRs)

### P23.D.1 — Booth Rent classification UI per Staff
(Already in P19.A.3 — verify wired.)

### P23.D.2 — Weekly booth rent schedule
### P23.D.3 — ACH from barber bank account (Checkbook.io)
### P23.D.4 — Pro-rated first-week (mid-week start)
### P23.D.5 — Late fee
### P23.D.6 — Failed payment notification + retry
### P23.D.7 — Booth rent receipts (1099 prep)
### P23.D.8 — Booth rent reports (per barber, per location)
### P23.D.9 — Booth rent dashboard for owner
### P23.D.10 — Barber view of upcoming rent

## P23.E — Barber Profile + Marketplace Hooks (5 PRs)

### P23.E.1 — Public barber profile page
Files: `app/(public)/barber/[slug]/page.tsx`

### P23.E.2 — Portfolio photos
### P23.E.3 — Reviews + ratings
### P23.E.4 — Direct booking link
### P23.E.5 — Marketplace listing hook (P29)

## P23.F — Vertical KPIs + Pilot (10 PRs)

### P23.F.1 — Barbershop KPI: walk-in rate
### P23.F.2 — KPI: average wait time
### P23.F.3 — KPI: chair utilization
### P23.F.4 — KPI: peak hour analysis
### P23.F.5 — KPI: booth rent collection rate
### P23.F.6 — KPI: walk-in vs appointment ratio
### P23.F.7 — Pilot onboard (Robert's network barbershop)
### P23.F.8 — Migration from Square Appointments
### P23.F.9 — Pilot feedback collection
### P23.F.10 — First barbershop case study

---

# P24 — NAIL SALON (30 PRs)

Per VERTICAL 6.

## P24.A — Vertical Config (3 PRs)

### P24.A.1 — Nail salon config (terms: Techs)
### P24.A.2 — Service templates (Manicure, Pedicure, Gel, Acrylic, Dip Powder, Nail Art)
### P24.A.3 — Onboarding checklist nail-specific

## P24.B — Station-Based Layout (5 PRs)

### P24.B.1 — Schema: NailStation
Pedicure chairs vs manicure tables.

### P24.B.2 — Station scheduling (per-station booking)
### P24.B.3 — Station calendar view
### P24.B.4 — Service-to-station mapping (pedicure → ped chair only)
### P24.B.5 — Station utilization KPI

## P24.C — MSDS Log + Chemical Tracking (5 PRs)

### P24.C.1 — Schema: MSDSEntry table
Product, batch, used-on-client, date.

### P24.C.2 — MSDS log UI
### P24.C.3 — MSDS PDF storage (S3)
### P24.C.4 — Chemical product inventory with expiry
### P24.C.5 — Compliance audit report

## P24.D — Nail Art Gallery (5 PRs)

### P24.D.1 — Schema: NailArtPhoto
Linked to client + tech.

### P24.D.2 — Photo upload from appointment
### P24.D.3 — Per-tech gallery
### P24.D.4 — Org-wide gallery (for marketing)
### P24.D.5 — Instagram share

## P24.E — Cash Tip Tracking (3 PRs)

### P24.E.1 — Cash tip manual entry post-service
### P24.E.2 — Cash tip 1099 reporting prep
### P24.E.3 — Cash tip pool option

## P24.F — Walk-In Hybrid (3 PRs)

Reuses P23 queue infrastructure.
### P24.F.1 — Nail-specific queue config
### P24.F.2 — Service-specific wait time
### P24.F.3 — Group bookings (3+ clients together)

## P24.G — Vietnamese-Language UI Option (3 PRs)

### P24.G.1 — vi-VN locale added to P0.H i18n
### P24.G.2 — Translations for top 200 UI strings
### P24.G.3 — Vietnamese onboarding emails

## P24.H — Pilot + Polish (3 PRs)

### P24.H.1 — Nail salon pilot onboard
### P24.H.2 — Onboarding tour customization
### P24.H.3 — First case study

---

# P25 — RESTAURANT FULL BUILD (60 PRs)

Per VERTICAL 3. Major new architecture.

## P25.A — Vertical Config (3 PRs)

### P25.A.1 — Restaurant config (terms: Tables, Guests, Servers, Orders)
### P25.A.2 — Service templates (menu items pre-pop is more involved — see P25.B)
### P25.A.3 — Restaurant onboarding checklist

## P25.B — Menu Management (10 PRs)

### P25.B.1 — Schema: MenuItem (extends Service with restaurant-specific fields)
Allergens, dietary tags, preparation time, station (grill, fry, salad, bar).

### P25.B.2 — Menu builder UI
### P25.B.3 — Categories (appetizers, entrees, desserts, drinks)
### P25.B.4 — Modifiers (no onions, sauce on side, doneness)
### P25.B.5 — Modifier groups (with required/optional, single/multi-select)
### P25.B.6 — Item photos
### P25.B.7 — Item descriptions (rich text)
### P25.B.8 — Allergen tagging
### P25.B.9 — Pricing per location (prices vary)
### P25.B.10 — Item availability scheduling (lunch only, dinner only)

## P25.C — 86 Manager (3 PRs)

### P25.C.1 — Schema: MenuItemStatus (AVAILABLE, 86, SOLD_OUT)
### P25.C.2 — One-tap 86 toggle
### P25.C.3 — Auto-broadcast to all order surfaces (in-person, online, delivery)

## P25.D — Specials + Pricing Rules (4 PRs)

### P25.D.1 — Daily specials editor
### P25.D.2 — Time-based pricing rules (happy hour 4-6pm)
### P25.D.3 — Day-of-week pricing rules (Taco Tuesday)
### P25.D.4 — Limited-time promos

## P25.E — Floor Plan Builder (10 PRs)

### P25.E.1 — Schema: FloorPlan, Table, Seat
Per location.

### P25.E.2 — Floor plan drag-drop builder UI
### P25.E.3 — Table shapes (2-top, 4-top, 6-top, 8-top, round, bar)
### P25.E.4 — Table grouping (zones: patio, bar, main floor)
### P25.E.5 — Table status visualization (available/reserved/occupied/needs-clean)
### P25.E.6 — Drag reservation onto table
### P25.E.7 — Table turn timer
### P25.E.8 — Server section assignment
### P25.E.9 — Multiple floor plans per location (lunch vs dinner layouts)
### P25.E.10 — Print floor plan

## P25.F — Reservations + Waitlist (8 PRs)

### P25.F.1 — Reservation booking (public + internal)
### P25.F.2 — Party size + special requests
### P25.F.3 — Reservation hold time
### P25.F.4 — Walk-in waitlist
### P25.F.5 — SMS "your table's ready"
### P25.F.6 — Waitlist position tracking
### P25.F.7 — Reservation no-show fee
### P25.F.8 — Reservation analytics (cover counts, peak times)

## P25.G — KDS (Kitchen Display System) (10 PRs)

### P25.G.1 — KDS route
Files: `app/kds/[locationId]/page.tsx`
Full-screen kitchen-mounted display.

### P25.G.2 — Order ticket cards (color-coded by time)
### P25.G.3 — Multi-station KDS (grill, fry, salad, etc.)
### P25.G.4 — Item-level bump (mark individual item ready)
### P25.G.5 — Full ticket bump
### P25.G.6 — Unified KDS (dine-in + online + DoorDash + Uber Eats on one screen)
### P25.G.7 — Color coding by elapsed time
### P25.G.8 — Server notification when food is up
### P25.G.9 — Recall ticket (mistake recovery)
### P25.G.10 — KDS analytics (avg ticket time, station performance)

## P25.H — Server Tablet Ordering (5 PRs)

### P25.H.1 — Server tablet POS (touch-optimized)
### P25.H.2 — Table selection
### P25.H.3 — Order entry with modifier flow
### P25.H.4 — Fire course / hold course
### P25.H.5 — Send to KDS

## P25.I — Online Ordering + Delivery Integrations (10 PRs)

### P25.I.1 — Online ordering page (public)
Files: `app/(public)/order/[orgSlug]/page.tsx`

### P25.I.2 — Cart + checkout for pickup
### P25.I.3 — Cart + checkout for delivery
### P25.I.4 — Order routing to KDS
### P25.I.5 — DoorDash integration
### P25.I.6 — Uber Eats integration
### P25.I.7 — GrubHub integration
### P25.I.8 — Delivery dispatch (own drivers vs 3rd party)
### P25.I.9 — Delivery tracking link to customer
### P25.I.10 — Tablet for delivery orders (separate from KDS)

## P25.J — Tab Management + Tip Pool (5 PRs)

### P25.J.1 — Open tab on card swipe
### P25.J.2 — Tab list per server
### P25.J.3 — Tab transfer between servers
### P25.J.4 — Pre-auth on tab open (hold amount)
### P25.J.5 — Tip pool calculation (configurable rules)

---

# P26 — GYM + MED SPA INITIAL (40 PRs)

Initial features. Full HIPAA Med Spa lands in P35. Full Gym features in P33 (per scope plan in 5-year).

## P26.A — Gym Vertical Initial (20 PRs)

### P26.A.1 — Gym config (terms: Members, Classes, Trainers)
### P26.A.2 — Membership tiers (monthly, annual, day pass, family, corporate)
### P26.A.3 — Membership billing engine (Reyna Pay recurring)
### P26.A.4 — Member self-signup flow
### P26.A.5 — PAR-Q form (Physical Activity Readiness Questionnaire)
### P26.A.6 — Liability waiver (digital sign)
### P26.A.7 — Photo capture at signup
### P26.A.8 — Access methods (QR code, key fob, PIN, staff lookup)
### P26.A.9 — Class scheduling
### P26.A.10 — Class registration (member self-serve)
### P26.A.11 — Class capacity
### P26.A.12 — Class waitlist + 5-min claim window
### P26.A.13 — Check-in flow (multiple methods)
### P26.A.14 — Member pause/freeze (P59.RetentionSystems hook)
### P26.A.15 — Failed payment recovery
### P26.A.16 — Personal Training session logging
### P26.A.17 — PT program builder (manual + AI suggestion later)
### P26.A.18 — Corporate membership management
### P26.A.19 — Door access integration `[VERIFY hardware]`
### P26.A.20 — Member health score (engagement-based)

## P26.B — Med Spa Vertical Initial (20 PRs)

### P26.B.1 — Med spa config (terms: Patients, Treatments)
### P26.B.2 — Initial HIPAA mode flag on Organization
### P26.B.3 — Encrypted patient records (KMS column encryption)
### P26.B.4 — Medical intake forms
### P26.B.5 — Treatment-specific informed consent templates
### P26.B.6 — Digital signature with witness
### P26.B.7 — Photo consent (granular: internal vs marketing)
### P26.B.8 — Good Faith Exam documentation
### P26.B.9 — Provider credential management (NP/PA/MD)
### P26.B.10 — Provider supervisor relationships
### P26.B.11 — Treatment room scheduling
### P26.B.12 — Before/after gallery with granular consent
### P26.B.13 — Aftercare automation (post-treatment SMS)
### P26.B.14 — Injectable lot number tracking (basic)
P35 expands fully.

### P26.B.15 — Lot expiry alerts
### P26.B.16 — Interactive injection mapping (basic 2D face diagram)
P35 deepens to full body diagrams.

### P26.B.17 — Patient (vs client) terminology throughout
### P26.B.18 — HIPAA audit log (every PHI access)
### P26.B.19 — Initial BAA template (full program in P49)
### P26.B.20 — Pilot med spa onboard

---

## PHASE 23-26 COMPLETION CRITERIA

- All 180 PRs merged
- Barbershop pilot live with queue board
- Nail salon pilot live
- Restaurant pilot live (full KDS + floor plan + online ordering)
- Gym pilot live with class scheduling
- Med spa pilot live with basic HIPAA
- KASSE_REAL_BUILD_ORDER.md updated

**After P23-26:** P27-P29 (SalonBacked, Franchise Creator, Marketplace) can run.
