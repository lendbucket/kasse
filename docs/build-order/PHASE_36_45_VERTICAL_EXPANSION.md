# PHASE 36-45 — VERTICAL EXPANSION (30+ VERTICALS)

**Scope:** Build out the remaining 30+ verticals per KASSE_VERTICALS_EXPANDED.md from skeleton configs (P0.C.18) to full deep builds.
**Total PRs:** 250
**Depends on:** P0.C (VerticalConfig), P6 (Owner Portal framework), P25 (Restaurant as template for new vertical patterns).
**Parallelizable:** All 30+ verticals can run in parallel after foundation. Group by team.
**Reference docs:** KASSE_VERTICALS_EXPANDED.md (full spec each vertical), KASSE_VERTICAL_SPECS.md.

Each vertical follows the same structure: deepen VerticalConfig (3-5 PRs) + vertical-specific schema (3-5 PRs) + vertical-specific features (5-15 PRs) + pilot (2-3 PRs). PR count varies by complexity.

---

## P36 — MASSAGE THERAPY (10 PRs)

Per VERTICAL 9.

### P36.1 — Massage vertical config deepening
### P36.2 — Treatment room schema (vs stylist station)
### P36.3 — Therapist licensing (state-specific LMT requirements)
### P36.4 — Wellness intake forms (comprehensive)
### P36.5 — Membership models (monthly recurring with rollover)
### P36.6 — Modality tracking (Swedish, deep tissue, hot stone, prenatal, etc.)
### P36.7 — Pressure preference tracking per client
### P36.8 — Body diagram for pain/focus areas (per session)
### P36.9 — Aromatherapy + oil tracking
### P36.10 — Massage pilot onboard

---

## P37 — YOGA + PILATES + DANCE STUDIO (15 PRs)

Per VERTICAL 11 + 12.

### P37.1 — Yoga config deepening
### P37.2 — Pilates config deepening
### P37.3 — Dance studio config (vertical 31)
### P37.4 — Class types (in-person, virtual, hybrid, on-demand, workshop, series, private)
### P37.5 — Class pass management (10-pack, 20-pack)
### P37.6 — Unlimited monthly memberships
### P37.7 — Class scheduling (weekly recurring + one-offs)
### P37.8 — Instructor scheduling
### P37.9 — Waitlist for full classes
### P37.10 — Virtual class integration (Zoom/Vimeo)
### P37.11 — On-demand video library
### P37.12 — Class cancellation policy (24hr notice)
### P37.13 — Late cancel fee enforcement
### P37.14 — Series/program enrollments (8-week beginner course)
### P37.15 — Pilot onboard (yoga + pilates + dance each)

---

## P38 — AUTO DETAIL + AUTO REPAIR (15 PRs)

Per VERTICAL 7 + 18.

### P38.1 — Auto detail config deepening
### P38.2 — Auto repair config deepening
### P38.3 — Vehicle profile schema (year, make, model, VIN, license plate)
### P38.4 — License plate lookup integration (state DMVs where possible)
### P38.5 — VIN decoder integration
### P38.6 — Vehicle photos + condition reports
### P38.7 — Step-by-step technician checklist (per service)
### P38.8 — Fleet account management (multi-vehicle one customer)
### P38.9 — Mobile detailing (geo-tracking technicians)
### P38.10 — Add-on selling at intake (over-the-phone or in-app)
### P38.11 — Auto repair: parts management (separate from products)
### P38.12 — Auto repair: labor hours tracking
### P38.13 — Auto repair: estimate vs final invoice approval workflow
### P38.14 — Auto repair: warranty tracking
### P38.15 — Auto pilots onboard

---

## P39 — PET GROOMING + VETERINARY (15 PRs)

Per VERTICAL 8 + 19.

### P39.1 — Pet grooming config deepening
### P39.2 — Veterinary config deepening
### P39.3 — Pet profile schema (species, breed, temperament, health, age, weight)
### P39.4 — Multi-pet per client
### P39.5 — Vaccination records + expiry alerts
### P39.6 — Vet contact info per pet
### P39.7 — Drop-off / pickup board (kennel mgmt for groomers)
### P39.8 — Photo updates during stay (client peace of mind)
### P39.9 — Vet: medical records (HIPAA-adjacent for pets but no federal mandate)
### P39.10 — Vet: prescription management
### P39.11 — Vet: lab order integration (IDEXX, Antech)
### P39.12 — Vet: surgery scheduling
### P39.13 — Boarding management (multi-day stays)
### P39.14 — Treat / snack inventory
### P39.15 — Pilots onboard

---

## P40 — TATTOO + PHOTOGRAPHY (10 PRs)

Per VERTICAL 20 + 21.

### P40.1 — Tattoo config deepening
### P40.2 — Photography config deepening
### P40.3 — Tattoo: design consultation booking (separate from session)
### P40.4 — Tattoo: deposit-required workflow (non-refundable)
### P40.5 — Tattoo: design library + client preview
### P40.6 — Tattoo: aftercare automation
### P40.7 — Photography: package management (engagement, wedding, family)
### P40.8 — Photography: gallery delivery (Pixieset-style)
### P40.9 — Photography: print fulfillment integration
### P40.10 — Pilots onboard

---

## P41 — CLEANING + CATERING (10 PRs)

Per VERTICAL 25 + 14.

### P41.1 — Cleaning service config
### P41.2 — Catering config
### P41.3 — Cleaning: recurring service contracts (weekly, bi-weekly, monthly)
### P41.4 — Cleaning: estimate-to-booking workflow
### P41.5 — Cleaning: team scheduling + dispatch
### P41.6 — Cleaning: GPS check-in at site
### P41.7 — Catering: menu builder (events, drop-off, full service)
### P41.8 — Catering: event deposit + final payment workflow
### P41.9 — Catering: dietary restriction capture
### P41.10 — Pilots onboard

---

## P42 — TUTORING + CHILDCARE (15 PRs)

Per VERTICAL 22 + 23.

### P42.1 — Tutoring config
### P42.2 — Childcare config
### P42.3 — Tutoring: subject + grade tracking
### P42.4 — Tutoring: parent + student dual accounts
### P42.5 — Tutoring: progress reports (parent-facing)
### P42.6 — Tutoring: virtual session integration (Zoom)
### P42.7 — Childcare: parent + child dual accounts
### P42.8 — Childcare: enrollment forms (medical, allergies, emergency contacts)
### P42.9 — Childcare: daily report (food, naps, activities, bathroom)
### P42.10 — Childcare: pickup authorization tracking
### P42.11 — Childcare: state licensing compliance
### P42.12 — Childcare: ratio monitoring (staff:child)
### P42.13 — Childcare: subsidy programs (CCMS in TX)
### P42.14 — Childcare: tax document generation (Form 2441)
### P42.15 — Pilots onboard

---

## P43 — COWORKING + EVENT VENUE + BEAUTY SCHOOL (20 PRs)

Per VERTICAL 24 + 26 + 27.

### P43.1 — Coworking config
### P43.2 — Event venue config
### P43.3 — Beauty school config
### P43.4 — Coworking: membership tiers (hot desk, dedicated, private office)
### P43.5 — Coworking: meeting room booking
### P43.6 — Coworking: 24/7 access (keycard/code integration)
### P43.7 — Coworking: WiFi password + community announcements
### P43.8 — Event venue: room/space inventory
### P43.9 — Event venue: package builder
### P43.10 — Event venue: vendor management (catering, AV)
### P43.11 — Event venue: floor plan / setup planner
### P43.12 — Event venue: BEO (Banquet Event Order) generation
### P43.13 — Beauty school: student profile + license tracking
### P43.14 — Beauty school: clinic floor service booking (students serve public at reduced rates)
### P43.15 — Beauty school: instructor supervision tracking
### P43.16 — Beauty school: student progress (hours, services performed)
### P43.17 — Beauty school: state board exam prep tracking
### P43.18 — Beauty school: practical exam workflow
### P43.19 — Beauty school: graduation + license endorsement
### P43.20 — Pilots onboard

---

## P44 — SPORTS TRAINING + BAR + CAFE + BAKERY (20 PRs)

Per VERTICAL 13 + 28 + 29 + 30.

### P44.1 — Sports training config
### P44.2 — Bar config
### P44.3 — Cafe config
### P44.4 — Bakery config
### P44.5 — Sports: skill assessment intake
### P44.6 — Sports: team/individual training plans
### P44.7 — Sports: session-tracking metrics
### P44.8 — Bar: tab management (extension of restaurant P25)
### P44.9 — Bar: liquor inventory (TX TABC compliance)
### P44.10 — Bar: ID verification at door
### P44.11 — Cafe: morning rush mode (faster checkout)
### P44.12 — Cafe: subscription model (10 coffees/month)
### P44.13 — Bakery: pre-order workflow
### P44.14 — Bakery: wedding cake / custom cake order management
### P44.15 — Bakery: production scheduling (need 3 days notice for custom)
### P44.16 — Cafe + Bakery: loyalty + rewards heavy use
### P44.17 — Bar + Cafe: KDS reuse (P25)
### P44.18 — Bar + Cafe: floor plan reuse (P25)
### P44.19 — Sports + Bar + Cafe + Bakery: each addresses unique walk-in vs reservation mix
### P44.20 — Pilots onboard

---

## P45 — REMAINING VERTICALS (20 PRs)

Brow Studio (32), Lash Studio (33), Tanning (34), Martial Arts (35), CrossFit (36), Chiropractic (37), Physical Therapy (38), Retail (16), Boutique (17), Food Truck (15).

### P45.1 — Brow studio config
### P45.2 — Lash studio config
### P45.3 — Tanning studio config
### P45.4 — Martial arts config
### P45.5 — CrossFit config
### P45.6 — Chiropractic config
### P45.7 — Physical therapy config
### P45.8 — Retail config
### P45.9 — Boutique config
### P45.10 — Food truck config
### P45.11 — Brow/Lash: per-service consent + photo documentation
### P45.12 — Tanning: FDA-required exposure schedule tracking
### P45.13 — Martial arts: belt progression tracking
### P45.14 — Martial arts: tournament scheduling
### P45.15 — CrossFit: WOD (workout of the day) tracking
### P45.16 — Chiro/PT: HIPAA-adjacent workflows (reuse P35 patterns)
### P45.17 — Chiro/PT: insurance billing integration (separate from cash-pay)
### P45.18 — Retail: barcode scanning + e-commerce hybrid
### P45.19 — Food truck: location/route tracking, geo-broadcast "we're here"
### P45.20 — Pilots onboard each vertical

---

## PHASE 36-45 COMPLETION CRITERIA

- All 250 PRs merged
- 30+ verticals operational with deep features
- At least 1 pilot per vertical
- KASSE_REAL_BUILD_ORDER.md updated
- Each vertical's KPIs measurable
- Per-vertical onboarding flows complete

**After P36-45:** P46-P52 (Enterprise SSO, SOC 2, Advanced Security, HIPAA Full audit, Agent Ecosystem, Voice Commerce, Kasse Capital) can run.
