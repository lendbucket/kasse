> **ARCHIVED — SEE docs/build-order/KASSE_REAL_BUILD_ORDER.md**
>
> **Status:** ARCHIVED 2026-05-17
> **Reason:** Superseded by the more granular phase plan in docs/build-order/.
> This document remains for historical reference but is NOT the source of truth
> for build sequencing.
>
> **Current build plan:**
> - Foundation: docs/build-order/PHASE_0_FOUNDATION.md
> - Onboarding: docs/build-order/PHASE_1_ONBOARDING.md
> - ...all 22 phase docs in docs/build-order/
>
> ---
> **ORIGINAL CONTENT BELOW**
> ---

# KASSE_MASTER_BUILDPLAN.md
## Unified Strategic Build Plan — Every Feature, Every Phase, Every Decision
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## DOCUMENT PURPOSE

This is the master document. Every other strategic doc in `/docs/` is a deep-dive into a specific area. This document answers one question:

**"In what order do we build everything, and why?"**

It covers:
- The complete feature inventory across all 10 strategic documents
- Exact phase assignments for every feature
- The dependency graph (what must exist before what)
- Revenue unlocked at each phase milestone
- The strategic logic behind every sequencing decision
- How Kasse fits into the broader 36 West Holdings technology stack
- How Kasse feeds SalonTransact, SalonBacked, and the Reseller network

---

## PART 1 — THE HIERARCHY

### How Kasse Sits in the 36 West Holdings Stack

```
                    36 WEST HOLDINGS
                          │
         ┌────────────────┼────────────────┐
         │                │                │
   REYNA PAY LLC    REYNA TECH LLC   REYNA INSURE LLC
   (PayFac Layer)   (Technology)     (Insurance/Benefits)
         │                │                │
         │         ┌──────┴──────┐         │
         │         │             │         │
   SalonTransact  Kasse      SalonBacked
   (Engine API)   (SaaS UI)   (Benefits)
         │         │
         └────┬────┘
              │
         Reyna Pay
         (Processing)
```

**SalonTransact** is the payment engine. It handles: merchant onboarding, card tokenization, authorization, capture, settlement, payouts, refunds, disputes, risk scoring, compliance.

**Kasse** is the vertical SaaS layer on top. It handles: booking, CRM, staff management, inventory, marketing, AI receptionist, franchise tools — everything that happens around a payment.

**SalonBacked** is the benefits layer. It handles: insurance, earned wage access, tax filing, credit reporting — financial wellness for the business and its workers.

Every transaction in Kasse flows through SalonTransact. Every payout to a Kasse merchant runs through Reyna Pay. When SalonBacked is integrated, payroll deductions happen at SalonTransact settlement.

This is the vertical integration play: one merchant, three products, all revenue flowing through 36 West Holdings.

### How Merchants Move Through the Stack

```
MERCHANT JOURNEY:

Step 1: Merchant discovers Kasse (social, referral, migration offer)
        ↓
Step 2: Signs up for Kasse (free trial)
        → SalonTransact merchant account auto-created in background
        → Payroc ERF initiated (if eligible for real processing)
        ↓
Step 3: Merchant uses Kasse for bookings + CRM (free features)
        → Discovers POS — needs payment processing
        ↓
Step 4: Merchant activates Reyna Pay processing through Kasse
        → Now a SalonTransact + Kasse + Reyna Pay customer
        → Revenue split: merchant keeps ~97%, Reyna Pay keeps ~3%
        ↓
Step 5: Merchant discovers SalonBacked through Kasse
        → Offers stylists benefits through SEPA
        → Files taxes through Kasse Tax (SalonBacked)
        → Enrolls in ACA plan through SalonBacked
        ↓
Step 6: Merchant expands (second location, franchise)
        → Becomes Kasse Pro or Enterprise
        → Each new location = new Reyna Pay merchant account
        → Franchise system: each franchisee is a new Kasse + Reyna Pay customer
```

At full stack, one merchant ecosystem (franchisor + 5 franchisees) generates:
- Kasse revenue: $349 (Enterprise) + 5 × $179 (Pro) = $1,244/month
- Processing revenue: 6 locations × average $30,000/month volume × 0.55% net = $990/month
- SalonBacked: 6 locations × average $89/month = $534/month
- Total: $2,768/month from one franchise system

---

## PART 2 — THE COMPLETE FEATURE INVENTORY

Every feature that will ever exist in Kasse, organized by document source and phase assignment.

### 2.1 Core Platform (Phase 0)

**These must exist before we can onboard a single paying merchant:**

| Feature | Source Doc | Description |
|---------|-----------|-------------|
| Authentication | Base | Login, session management, role-based access |
| Multi-staff architecture | Base | Owner, Manager, Staff roles |
| Appointment calendar | Base | Time-slot booking per staff member |
| Client CRM | Base | Client profiles, notes, history |
| Service menu | Base | Services with pricing, duration, category |
| Basic POS | Base | Payment collection, receipt via email/SMS |
| SalonTransact integration | Base | All payments flow through SalonTransact API |
| Online booking page | Base | Public URL for client self-booking |
| Appointment reminders | Base | SMS + email 24hr and 2hr before |
| Staff invitation | Base | Invite staff via email, role assignment |
| Basic reports | Base | Revenue, appointment count, daily summary |
| Mobile-responsive design | Base | Works on any device |

**Phase 0 Revenue Gate:** Must process first real payment through Reyna Pay before any merchant goes live

### 2.2 Salon Core (Phase 2)

**These unlock the full salon value proposition:**

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| Kasse Color — Formula Cards | VERTICALS | Formula builder, product selection, photo capture |
| Before/After Photo Gallery | VERTICALS | Stored per client, portfolio building |
| Formula Analytics | VERTICALS | Which formulas, what results, per stylist |
| Chemical Service Waiver | VERTICALS | Digital waiver with signature, stored to profile |
| TDLR License Verification | VERTICALS | Socrata API integration, expiry alerts |
| Commission Engine | VERTICALS | Multiple commission structures, auto-calculation |
| Tip distribution | Base | Multiple tip structures, per-service or per-checkout |
| Client relationship score | RETENTION | Computed score, drives stylist behavior |
| No-show charge | Base | Auto-charge on no-show if deposit on file |
| Rebooking prompt at checkout | ONBOARDING | Captures next appointment before client leaves |

**Phase 2 Revenue Gate:** Commission engine + Kasse Color = minimum viable salon product. Kasse Color ($39/month addon) is primary monetization lever.

### 2.3 AI + Communication (Phase 3)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| AI Receptionist — calls | INTEGRATIONS | Twilio + OpenAI Realtime, inbound call handling |
| AI Receptionist — SMS | INTEGRATIONS | AI responds to SMS booking requests |
| AI Receptionist — Instagram DM | INTEGRATIONS | Auto-respond, capture booking intent |
| Post-service review request | RETENTION | Fired 2 hours after appointment, smart cadence |
| Win-back campaign engine | RETENTION | Auto-send to lapsed clients at configurable interval |
| Birthday automation | Base | Auto SMS/email on client birthdays |
| Re-engagement sequence | RETENTION | Manual or automatic outreach to at-risk clients |
| SMS packs | TIERS | Metered SMS beyond base allocation |

**Phase 3 Revenue Gate:** AI Receptionist addon ($49–$199/month) is the second-highest value addon. Phase 3 should unlock $100+/month average addon revenue.

### 2.4 Migration Center (Phase 3.5)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| Square OAuth migration | MIGRATION | Pull clients, appointments, staff, transactions |
| Vagaro guided migration | MIGRATION | Export guide + CSV parser |
| GlossGenius migration | MIGRATION | OAuth or CSV |
| Mindbody migration | MIGRATION | API pull |
| Generic CSV migration | MIGRATION | AI-powered column mapping |
| AI document scanner | MIGRATION | Extract data from photos of paper records |
| Data preview screen | MIGRATION | Shows what will be imported before execution |
| Parallel running mode | MIGRATION | 30-day overlap with old platform |
| Ghost Migration | MIGRATION | Silent background migration for large accounts |
| Migration verification | MIGRATION | Post-import anomaly detection and flagging |

**Phase 3.5 Strategic Logic:** Migration is the #1 conversion lever. Merchants who complete a migration have 8x lower churn in the first 90 days because they've invested effort and their data is in Kasse. This phase should be the primary driver of new merchant acquisition for Kasse's first 12 months.

**Build estimate:** 8 commits. Square OAuth first (highest-value source), then Vagaro, then CSV, then Ghost Migration.

### 2.5 Booking Widget + Web Integration (Phase 4)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| Embeddable booking widget | INTEGRATIONS | One script tag, works on any website |
| Widget variants: button/inline/float | INTEGRATIONS | Merchant chooses display format |
| Vertical-specific widget UI | INTEGRATIONS | Salon flow vs gym flow vs restaurant flow |
| WordPress plugin | INTEGRATIONS | One-click install |
| QR code generator | INTEGRATIONS | Any Kasse URL → branded QR code |
| Kasse Sites — website builder | INTEGRATIONS | Full website builder ($29/month addon) |
| Kasse Sites — template library | INTEGRATIONS | Templates per vertical |
| Kasse Sites — custom domain | INTEGRATIONS | Connect their own domain |
| Kasse Sites — SEO basics | INTEGRATIONS | Title, description, sitemap |
| Google Reserve integration | INTEGRATIONS | "Book Now" on Google Maps |

**Phase 4 Strategic Logic:** The booking widget is the first touchpoint for clients who find the business online. Once embedded, it's nearly impossible to remove (their website traffic depends on it). This is a deep switching cost.

### 2.6 Social Media Integrations (Phase 5)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| Instagram "Book Now" button | INTEGRATIONS | Native Instagram integration |
| Instagram auto-post (Kasse Color) | INTEGRATIONS | One-tap before/after to Instagram |
| Instagram AI caption generator | INTEGRATIONS | Caption + hashtags from service data |
| Facebook "Book Now" | INTEGRATIONS | Native Facebook integration |
| Facebook Events sync | INTEGRATIONS | Events created in Kasse auto-post to Facebook |
| TikTok link-in-bio booking | INTEGRATIONS | Dedicated TikTok-optimized booking page |
| WhatsApp Business booking | INTEGRATIONS | AI handles WhatsApp booking conversations |
| Instagram DM automation | INTEGRATIONS | "BOOK" trigger → booking link sent |
| Google Business Profile sync | INTEGRATIONS | Hours, services, photos |
| Google Reviews management | INTEGRATIONS | All reviews visible in Kasse, respond from Kasse |

**Phase 5 Strategic Logic:** Social integrations drive organic growth. Every Instagram post from Kasse Color has a "Book [Stylist Name]" CTA. Every Google review response has "Book online: kasseapp.com/[business]". Kasse becomes embedded in the merchant's marketing flywheel.

### 2.7 Retention Systems (Phase 6)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| Merchant Lock-In Score | RETENTION | 0–100 score, 10 components |
| Freeze Account — Full Freeze ($9) | RETENTION | Data only, no activity |
| Freeze Account — Light Freeze ($19) | RETENTION | Data + client portal view |
| Freeze Account — Revenue Freeze ($29) | RETENTION | Data + payment processing only |
| Cancel flow redesign | RETENTION | Shows data at risk, offers freeze alternative |
| Auto-freeze detection | RETENTION | Seasonal patterns, inactivity triggers |
| Business Sale Marketplace | RETENTION | exchange.kasseapp.com |
| Business valuation engine | RETENTION | Based on Reyna Pay-verified revenue data |
| Data room (secure sharing) | RETENTION | NDA-gated financial sharing for business sales |
| Account transfer system | RETENTION | Ownership transfer when business sells |
| Accountant Access addon | RETENTION | Read-only financial role ($9/month) |
| Tax Nexus Tracker | RETENTION | Mobile service nexus alerts, state thresholds |

**Phase 6 Strategic Logic:** By Phase 6, we have enough merchants that churn is a meaningful problem. Every frozen account at $9/month instead of $0 (churned) is pure margin. The Business Sale Marketplace is a retention moat that takes 6+ months to build trust and network effect — start building it now.

### 2.8 Support Infrastructure (Phase 6)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| AI Support Engine | SUPPORT | Claude API with account context |
| In-portal support widget | SUPPORT | Available on every page |
| Stuck user detection | SUPPORT | Proactive pop-up offer |
| help.kasseapp.com | SUPPORT | Full searchable Help Center |
| support.kasseapp.com | SUPPORT | Internal backend for support team |
| Three-panel ticket UI | SUPPORT | Context / Conversation / Actions |
| Agent AI co-pilot | SUPPORT | Draft, summarize, diagnose |
| SLA enforcement | SUPPORT | Countdown timers, color coding |
| CSAT collection | SUPPORT | Post-resolution rating |
| 30-day onboarding sequence | SUPPORT | Automated email + in-portal sequence |
| Churn risk scoring | SUPPORT | Per-merchant risk calculation |
| At-risk intervention program | SUPPORT | Automated + human outreach |

### 2.9 Third-Party Platform Integrations (Phase 8)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| QuickBooks Online sync | INTEGRATIONS | Two-way (transactions, expenses, payroll) |
| Xero sync | INTEGRATIONS | Same as QuickBooks |
| Wave sync | INTEGRATIONS | For micro-businesses |
| Mailchimp sync | INTEGRATIONS | One-way client list + segment export |
| Klaviyo integration | INTEGRATIONS | Event-based flows |
| Zapier integration | INTEGRATIONS | Full trigger + action library |
| DoorDash integration | INTEGRATIONS | Orders in Kasse KDS (restaurant vertical) |
| Uber Eats integration | INTEGRATIONS | Same as DoorDash |
| Shopify sync | INTEGRATIONS | Bi-directional inventory (retail vertical) |
| WooCommerce sync | INTEGRATIONS | Same as Shopify |

### 2.10 Franchise Creator (Phase 7)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| 8-step franchise wizard | FRANCHISE | Universal — works for all verticals |
| FDD Builder (23 items) | FRANCHISE | Auto-fills from Kasse data |
| Franchise Agreement Builder | FRANCHISE | Vertical-specific term templates |
| Territory Management | FRANCHISE | Map-based, radius/zip/polygon drawing |
| Franchisee Application Portal | FRANCHISE | Public URL, AI scoring |
| FTC 21-day disclosure counter | FRANCHISE | Compliance enforcement |
| Training Portal | FRANCHISE | Video/PDF/quiz/checklist/simulation |
| Brand Standards Center | FRANCHISE | Asset library, compliance monitoring |
| Auto-royalty collection | FRANCHISE | Split at Reyna Pay settlement — no invoicing |
| Franchisee performance dashboard | FRANCHISE | Franchisor sees all locations |
| State registration alerts | FRANCHISE | 13 registration states tracked |

**Phase 7 Strategic Logic:** Franchise Creator requires a mature Kasse product because the franchisees must trust the platform. Once a franchisor uses Kasse Franchise Creator, every one of their franchisees is locked into Kasse. One franchisor with 20 franchisees = 21 Pro/Enterprise accounts. This is the most efficient customer acquisition possible.

### 2.11 Developer Platform (Phase 10)

| Feature | Source Doc | Notes |
|---------|-----------|-------|
| Public REST API | INTEGRATIONS | Full endpoint catalog, OAuth |
| OpenAPI documentation | INTEGRATIONS | Machine-readable spec |
| Sandbox environment | INTEGRATIONS | Full test environment, no real payments |
| Webhook system | INTEGRATIONS | All major events emit webhooks |
| API key management | INTEGRATIONS | Per-developer keys, scoped permissions |
| App Marketplace | INTEGRATIONS | Third-party apps that extend Kasse |
| Developer portal | INTEGRATIONS | docs.kasseapp.com |
| Rate limiting and tiers | INTEGRATIONS | Free tier (100 calls/day), paid tiers |

**Phase 10 Strategic Logic:** The Developer Platform is how Kasse becomes a platform instead of just software. Third-party developers building on Kasse = free distribution. Each app published to the App Marketplace is a new integration, a new use case, and a new retention surface.

This also enables the AI-agent-native design goal from SalonTransact Phase 10.13: Kasse's API is discoverable by AI agents, allowing future AI booking assistants (built by others) to access Kasse as a data source and action surface.

### 2.12 Multi-Vertical Expansion (Phase 9–12)

| Vertical | Phase | Primary New Architecture |
|----------|-------|--------------------------|
| Restaurant | Phase 9 | KDS, floor plan, online ordering, delivery integrations |
| Gym | Phase 9 | Member check-in hardware, PT logging, corporate accounts |
| Med Spa | Phase 9.5 | HIPAA infrastructure, injectable tracking, injection mapping |
| Barbershop | Phase 4 | Digital walk-in queue, TV board, booth rent billing |
| Nail Salon | Phase 4 | MSDS log, nail art gallery, queue hybrid |
| Yoga/Pilates | Phase 5 | Class pack pricing, virtual class integration, on-demand content |
| Massage | Phase 5 | Wellness intake forms, membership model, room management |
| Auto Detailing | Phase 10 | Vehicle profiles, VIN lookup, step-by-step tech checklist |
| Cleaning Service | Phase 10 | Route optimization, GPS clock-in, location-centric model |
| Pet Grooming | Phase 10.5 | Pet profiles, vaccination tracking, drop-off board |
| Tattoo Studio | Phase 10.5 | Deposit management, age verification, design approval flow |
| Food Truck | Phase 10 | Location broadcasting, mobile POS, pre-order |
| Photography | Phase 11 | Project pipeline, contract management, gallery delivery |
| Tutoring | Phase 11 | Session tracking, subject matching, package billing |
| Childcare | Phase 11 | Child profiles, authorized pickup, attendance for licensing |
| Coworking | Phase 11 | Desk/office booking, conference room management, member check-in |
| Sports Training | Phase 11 | Athlete performance tracking, parent portal, video analysis |
| Catering | Phase 11 | Event-based model, custom menus, dietary accommodation tracking |
| Beauty School | Phase 12 | Student hour tracking, curriculum, exam readiness |

---

## PART 3 — THE PHASE ROADMAP (DETAIL)

### Phase 0 — Wire to Real Data
**Timeline:** Now (current state)
**Goal:** First real Kasse merchant processes a real payment

Deliverables:
- Connect Kasse scaffolding to real Supabase database
- Wire appointment creation to real calendar
- Wire POS to SalonTransact API (Phase 10 endpoint)
- Enable first real Payroc terminal through Kasse UI
- Smoke test: book appointment → check in → checkout with real card → payout to real bank

**Dependency:** Payroc SDK 1.7.0 blocker must be resolved (or rolled back to 1.6.0). All of Phase 0 is blocked by this.

**Revenue at Phase 0 completion:** $0 (no paying merchants yet — this is pre-launch)

---

### Phase 1 — Real Payment Processing + Commission Engine
**Timeline:** 2 weeks after Phase 0
**Goal:** First merchant processes $10,000 in real volume through Kasse

Deliverables:
- Commission calculation engine (multiple structures: flat %, sliding scale, per-service)
- Tip capture and distribution
- End-of-day report (revenue, tips, commissions, no-shows)
- Payout view (shows settlement schedule, pending amounts)
- Basic transaction history
- Receipt delivery (email + SMS via Resend/Twilio)

**Revenue at Phase 1 completion:** 1–3 pilot merchants × $49–$99/month = $50–$300 MRR
**Processing revenue:** 1–3 merchants × variable volume × 0.55% net

---

### Phase 2 — Full Salon Product
**Timeline:** 3–4 weeks after Phase 1
**Goal:** Kasse is a complete product for any salon — compete with Vagaro and GlossGenius

Deliverables:
- Kasse Color (formula cards, before/after photos, product selection)
- Chemical service waiver (digital signature, stored to profile)
- TDLR license verification (Socrata API)
- Client relationship score (calculated from visit frequency, no-show history, communication)
- Deposit collection for online bookings
- Waitlist management (join waitlist → auto-notified when slot opens)
- Staff schedule management (availability blocks, time-off requests)
- Inventory tracking (product catalog, quantity management, reorder alerts)
- Basic marketing: birthday automation, review request automation

**New Addons Unlocked:**
- Kasse Color ($39/month) — every color salon will pay this
- Basic SMS pack (included in base, overages metered)

**Revenue at Phase 2 completion:** 5–10 merchants × $88–$138/month average = $440–$1,380 MRR

---

### Phase 3 — AI Receptionist + Advanced Automation
**Timeline:** 4 weeks after Phase 2
**Goal:** Kasse is the AI-native salon platform — no competitor offers this

Deliverables:
- AI Receptionist v1 (Twilio inbound, OpenAI Realtime API):
  - Answers calls in business voice
  - Books new appointments ("I'd like to book a color appointment with Jennifer")
  - Reschedules existing appointments
  - Answers FAQs (hours, services, prices, parking)
  - Captures message if can't resolve ("I'll have [name] call you back")
- AI Receptionist — SMS (same capability, text channel)
- Win-back campaign engine (configurable trigger, AI-written message)
- Re-engagement automation (lapsed client sequences)
- Referral tracking (who referred whom, rewards tracking)
- Gift cards (digital issuance, balance tracking, redemption)
- Loyalty points system (earn on every transaction, redeem for discounts)

**New Addons Unlocked:**
- AI Receptionist — 100 calls/month ($49/month)
- AI Receptionist — 300 calls/month ($99/month)
- AI Receptionist — Unlimited ($199/month)
- Gift Card program
- Loyalty program

**Revenue at Phase 3 completion:** 15–20 merchants × $150–$250/month average = $2,250–$5,000 MRR

---

### Phase 3.5 — Migration Center
**Timeline:** 3 weeks after Phase 3
**Goal:** Remove the #1 barrier to switching — data migration — for every prospect

Deliverables (8 commits):
- Commit 1: Square OAuth connection, pull clients + services + staff
- Commit 2: Square appointment history + transaction history import
- Commit 3: Data preview screen + mapping review UI
- Commit 4: CSV import with AI column mapping (generic fallback for any platform)
- Commit 5: Vagaro guided export + parser
- Commit 6: GlossGenius OAuth migration
- Commit 7: Parallel running mode (30-day sync from old platform)
- Commit 8: Ghost Migration (enterprise) + migration verification AI

**Strategic Impact:** Migration is the primary acquisition channel. After this phase, every sales conversation leads with "We'll move all your data for free."

**Revenue at Phase 3.5 completion:** 30–50 merchants × $175/month average = $5,250–$8,750 MRR

---

### Phase 4 — Booking Widget + Second Vertical (Barbershop/Nail)
**Timeline:** 4 weeks after Phase 3.5
**Goal:** Embedding in websites + unlock first expansion vertical

Deliverables:
- Embeddable booking widget (script tag, vertical-aware, customizable)
- WordPress plugin
- QR code generator
- Kasse Sites v1 (basic website builder, salon template)
- Barbershop queue system (digital walk-in queue, TV board, remote join)
- Booth rent billing (weekly ACH from barber)
- Nail salon extensions (MSDS log, nail art gallery, queue hybrid)
- Walk-in queue for any vertical

**New Addons Unlocked:**
- Kasse Sites ($29/month) — website builder
- Queue Display (barbershop/nail) — included in growth+ plans

**Revenue at Phase 4 completion:** 60–80 merchants (mix of salon, barbershop, nail) × $180/month average = $10,800–$14,400 MRR

---

### Phase 5 — Social Media + Wellness Vertical
**Timeline:** 4 weeks after Phase 4
**Goal:** Kasse becomes the marketing hub, not just the booking tool; unlock massage/yoga

Deliverables:
- Instagram "Book Now" button
- Instagram auto-post from Kasse Color (before/after with AI caption)
- Facebook integration
- Google Reserve ("Book Now" on Google Maps)
- Google Business Profile sync
- Google Reviews management
- WhatsApp Business AI booking
- TikTok link-in-bio booking page
- Massage/wellness intake forms
- Membership model (monthly recurring, punch card, class pack)
- Room management (treatment room assignment)
- Yoga/Pilates class scheduling
- Virtual class streaming integration (Zoom/Kasse native)
- On-demand content delivery

**Revenue at Phase 5 completion:** 100–150 merchants × $190/month average = $19,000–$28,500 MRR

---

### Phase 6 — Retention Systems + Full Support Infrastructure
**Timeline:** 5 weeks after Phase 5
**Goal:** Churn drops below 3% monthly; support scales without linear headcount growth

Deliverables:
- Merchant Lock-In Score (0–100, 10 components)
- Freeze Account system (3 tiers, cancel flow redesign, auto-detection)
- Business Sale Marketplace v1 (listing creation, valuation engine, exchange.kasseapp.com)
- Accountant Access addon
- Tax Nexus Tracker
- AI Support Engine (full context-aware, in-portal widget)
- help.kasseapp.com (full Help Center, 100+ articles)
- support.kasseapp.com (full agent backend, three-panel UI)
- SLA enforcement system
- CSAT collection
- 30-day onboarding email sequence (automated)
- Churn risk scoring + at-risk intervention
- Milestone-based celebrations + interventions

**Revenue at Phase 6 completion:** 200–300 merchants × $200/month average = $40,000–$60,000 MRR

---

### Phase 7 — Franchise Creator + Proactive Success Program
**Timeline:** 5 weeks after Phase 6
**Goal:** Unlock the most efficient customer acquisition channel possible (franchise systems)

Deliverables:
- Franchise Creator 8-step wizard (universal all-vertical)
- FDD Builder (23 items, auto-populated)
- Franchise Agreement Builder (vertical-specific templates)
- Territory Management (map-based, conflict detection)
- Franchisee Application Portal (public URL, AI scoring)
- Training Portal (video/PDF/quiz/checklist/gating)
- Brand Standards Center (asset library, compliance monitoring)
- Auto-royalty collection via Reyna Pay settlement split
- Pro/Enterprise CSM program (human + automated)
- Monthly business review automation (data-driven email)
- High-risk merchant intervention program (human outreach)

**Franchise Creator Addons Unlocked:**
- Franchise Creator ($199/month base)
- Per-franchisee fee ($49/month per active franchisee location)

**Revenue at Phase 7 completion:** 350–500 merchants × $215/month average = $75,250–$107,500 MRR
(including early franchise systems bringing 5–10 franchisees each)

---

### Phase 8 — Third-Party Integrations Hub
**Timeline:** 4 weeks after Phase 7
**Goal:** Kasse connects to everything, eliminating every other tool in the merchant's stack

Deliverables:
- QuickBooks Online (two-way sync)
- Xero sync
- Wave sync
- Mailchimp + Klaviyo
- Zapier (full trigger + action library)
- Integration health monitor
- Reconnect flows (detect disconnected integrations, prompt to reconnect)
- Integration usage analytics (which integrations are most used)

**Revenue at Phase 8 completion:** 500–700 merchants × $225/month average = $112,500–$157,500 MRR

---

### Phase 9 — Restaurant + Gym Verticals
**Timeline:** 8 weeks after Phase 8
**Goal:** First industry expansion beyond beauty/wellness

Deliverables — Restaurant:
- Kitchen Display System (Kasse KDS)
- Floor plan builder (drag-and-drop, table status)
- Online ordering (embeddable, full menu, Reyna Pay checkout)
- DoorDash + Uber Eats integration (orders routed to KDS)
- Reservation system (with waitlist + SMS notification)
- Server tablet ordering interface
- Tab management (open tab on card swipe)
- Happy hour pricing rules
- Recipe-based inventory deduction
- Tip pool calculator

Deliverables — Gym:
- Multi-method check-in (QR, fob, PIN, facial recognition Phase 2)
- New member enrollment flow (PAR-Q, waiver, photo, access method)
- Membership billing engine (monthly, annual, punch card, day pass, family, corporate)
- Class scheduling and capacity management
- Waitlist + 5-minute claim window
- Personal trainer session logging + AI program generator
- Corporate membership management (HR portal view)
- Membership health dashboard (delinquent members, expiring soon)

**Revenue at Phase 9 completion:** 800–1,200 merchants × $220/month average = $176,000–$264,000 MRR

---

### Phase 9.5 — Med Spa Vertical
**Timeline:** 4 weeks after Phase 9
**Goal:** Highest-revenue-per-merchant vertical (they pay more, process more)

Deliverables:
- HIPAA infrastructure (BAA available, audit log, role-based records access)
- Medical intake forms (health history, medications, contraindications)
- Informed consent management (procedure-specific templates, digital signature in room)
- Injectable lot number tracking (scan or manual entry, expiry alerts, recall traceability)
- Interactive injection mapping (face/body diagram, units per site)
- Good Faith Exam documentation
- Before/After photo management (granular consent: internal only vs marketing)
- Provider credential management (NP/PA/MD verification)
- Post-treatment automation (aftercare instructions, follow-up booking prompt)
- Injectable COGS tracking (cost per treatment, margin analysis)

**Revenue at Phase 9.5 completion:** 1,000–1,500 merchants × $230/month average = $230,000–$345,000 MRR

---

### Phase 10 — Developer Platform + Mobile/Field Verticals
**Timeline:** 6 weeks after Phase 9.5
**Goal:** Kasse becomes a platform; unlock field service verticals

Deliverables — Developer Platform:
- Public REST API (full endpoint catalog, OAuth 2.0)
- OpenAPI spec (machine-readable, AI-agent-discoverable)
- Sandbox environment (full test Kasse instance with fake data)
- Webhook system (all major events emit webhooks)
- API key management (scoped permissions)
- Developer portal at docs.kasseapp.com
- Rate limiting (free tier 100 calls/day, paid tiers)

Deliverables — Field Service Verticals:
- Vehicle profiles (Year/Make/Model, VIN, license plate, multi-vehicle per client)
- VIN barcode scanner
- Pre/post service photo documentation (walk-around photos)
- Step-by-step technician checklist (quality gate before completion)
- Next-service prediction engine
- Fleet account management (corporate vehicle fleets)
- Route optimization (cleaning service)
- GPS-verified clock-in (must be within X meters of job address)
- Location broadcasting (food truck — today's location to social + SMS subscribers)
- Food truck pre-order (customer orders ahead for specific time slot)

**Revenue at Phase 10 completion:** 1,500–2,500 merchants × $235/month average = $352,500–$587,500 MRR

---

### Phase 10.5 — App Marketplace + Specialty Verticals
**Timeline:** 4 weeks after Phase 10
**Goal:** Third-party ecosystem begins; last specialty verticals

Deliverables — App Marketplace:
- Marketplace infrastructure (approval process, developer agreement)
- App listing pages
- One-click install / uninstall
- App billing (Kasse takes 30% of app revenue — standard app store economics)
- First-party "apps" moved to marketplace (some addons become marketplace apps)
- Third-party developer program officially launched

Deliverables — Specialty Verticals:
- Pet Grooming: pet profiles, vaccination tracking, drop-off/pick-up board, owner photo updates
- Tattoo Studio: deposit management, consultation-to-appointment pipeline, age verification, design approval

**Revenue at Phase 10.5 completion:** 2,000–3,500 merchants × $240/month average = $480,000–$840,000 MRR

---

### Phase 11 — Creative + Education + Service Verticals
**Timeline:** 8 weeks after Phase 10.5
**Goal:** Complete the vertical catalog for any service business

Deliverables:
- Photography: project pipeline (inquiry → contract → deposit → session → gallery → final payment), contract management, digital signature, gallery delivery
- Tutoring: session tracking, subject/grade matching, package billing, parent progress reports
- Childcare: child profiles, authorized pickup list, unauthorized alert, digital daily report cards, attendance log for licensing
- Coworking: desk/office booking, conference room management, member check-in
- Sports training: athlete performance tracking, parent portal, video annotation
- Catering: event-based model, custom menus per event, dietary accommodation tracking, rental equipment tracking

**Revenue at Phase 11 completion:** 3,000–5,000 merchants × $245/month average = $735,000–$1,225,000 MRR

---

### Phase 12 — Beauty School + Enterprise Education + Scale Operations
**Timeline:** 12 weeks after Phase 11
**Goal:** Complete vertical coverage, scale operations infrastructure

Deliverables:
- Beauty School: student enrollment, clock-hour tracking, skills checklist, exam readiness score, floor supervisor view
- Operational scaling: advanced analytics, merchant segmentation, automated success plays
- International: multi-currency, multi-language, international tax handling
- Enterprise SSO: SAML/OIDC for corporate clients
- Advanced API: higher rate limits, dedicated infrastructure for API customers

**Revenue at Phase 12 completion:** 5,000+ merchants × $250/month average = $1,250,000+ MRR

---

## PART 4 — THE DEPENDENCY GRAPH

These are hard sequencing rules. Nothing can be built out of order:

```
PAYROC SDK RESOLUTION
        │
        ▼
SALONTRANSACT PHASE 10 COMPLETION
        │
        ▼
PHASE 0 (Wire to real data)
        │
        ▼
PHASE 1 (Real payments + commission)
        │
        ▼
PHASE 2 (Full salon product)
        │
    ┌───┴───────────────────────────────────┐
    ▼                                       ▼
PHASE 3 (AI receptionist)          PHASE 3.5 (Migration Center)
    │                                       │
    └────────────────┬──────────────────────┘
                     ▼
              PHASE 4 (Widget + Barbershop)
                     │
                     ▼
              PHASE 5 (Social + Wellness)
                     │
                     ▼
              PHASE 6 (Retention + Support)
                     │
                     ▼
              PHASE 7 (Franchise Creator)
                     │
                     ▼
              PHASE 8 (Integrations Hub)
                     │
                     ▼
              PHASE 9 (Restaurant + Gym)
                     │
                     ▼
             PHASE 9.5 (Med Spa)
                     │
                     ▼
             PHASE 10 (Dev Platform + Field)
                     │
                     ▼
             PHASE 10.5 (Marketplace + Specialty)
                     │
                     ▼
             PHASE 11 (Creative + Education)
                     │
                     ▼
             PHASE 12 (Beauty School + Scale)
```

**The one true blocker:** Everything is blocked by the Payroc SDK 1.7.0 resolution (terminal 6535001 empty-body 400 on /single-use-tokens). Roll back to 1.6.0 if Chris/Matt don't respond within 48 hours. Do not let a vendor SDK delay the entire roadmap.

---

## PART 5 — REVENUE PROJECTIONS

### Monthly Recurring Revenue Targets by Phase

| Phase Completion | Merchants | Avg MRR/Merchant | Total MRR | Processing Add-On |
|-----------------|-----------|-----------------|-----------|-------------------|
| Phase 0 | 1–3 pilots | $0 | $0 | Testing only |
| Phase 1 | 5–10 | $49 | $500 | ~$100 |
| Phase 2 | 15–20 | $138 | $2,070–$2,760 | ~$500 |
| Phase 3 | 30–50 | $188 | $5,640–$9,400 | ~$1,500 |
| Phase 3.5 | 60–80 | $188 | $11,280–$15,040 | ~$3,000 |
| Phase 4 | 100–150 | $200 | $20,000–$30,000 | ~$7,000 |
| Phase 5 | 200–300 | $210 | $42,000–$63,000 | ~$15,000 |
| Phase 6 | 350–500 | $215 | $75,250–$107,500 | ~$25,000 |
| Phase 7 | 500–750 | $225 | $112,500–$168,750 | ~$40,000 |
| Phase 8 | 750–1,000 | $230 | $172,500–$230,000 | ~$60,000 |
| Phase 9 | 1,200–1,800 | $235 | $282,000–$423,000 | ~$100,000 |
| Phase 10 | 2,000–3,000 | $240 | $480,000–$720,000 | ~$180,000 |
| Phase 11 | 3,500–5,000 | $245 | $857,500–$1,225,000 | ~$300,000 |
| Phase 12 | 5,000+ | $250 | $1,250,000+ | ~$500,000 |

**Target: $1.25M MRR from SaaS + $500K MRR from processing = $1.75M MRR total at Phase 12**

This is $21M ARR — from one vertically-integrated SaaS platform serving 5,000 merchants, operating from Corpus Christi, Texas.

### The $250 Average MRR Formula

How we get a merchant to $250/month:

```
BASE PLAN:              Growth ($99) or Pro ($179)
+ Kasse Color:          $39/month
+ AI Receptionist:      $49–$99/month
+ SMS Pack:             $25/month
+ Kasse Sites:          $29/month
────────────────────────────────
TOTAL (Growth base):    $241/month average
TOTAL (Pro base):       $321/month average
BLENDED AVERAGE:        ~$250/month
```

This means the $250 target is achievable without selling merchants anything unusual — it's just the natural addon stack for an active salon or service business.

---

## PART 6 — STRATEGIC DECISIONS LOCKED

These are non-negotiable platform decisions. They do not change without documented review:

**SD-K001 — SalonTransact Only for Payment Processing**
Kasse processes all payments through SalonTransact/Reyna Pay. Never Stripe Connect, never Square, never direct Payroc for merchants. Every payment through Kasse flows through our own stack. This is the core of the vertical integration play.

**SD-K002 — Kasse Is the Merchant Portal Layer Only**
Kasse is never the payment engine. SalonTransact handles: tokenization, authorization, capture, settlement, risk, disputes. Kasse handles: booking, CRM, staff, inventory, marketing, franchise. Never blur this line.

**SD-K003 — Multi-Vertical from Day One Architecture**
Even though we're launching with salons, the code is written to support all verticals. `VerticalConfig` objects control what's visible per vertical. No hard-coding of salon-specific language in components. When Phase 4 adds barbershops, it should be a config change + queue system — not a rewrite.

**SD-K004 — No Payroll in Kasse**
Payroll is a SalonBacked feature (when built). Kasse handles commission calculation and reporting only. Never accept payroll funds through Kasse's Reyna Pay account. When payroll exists, it will use SalonBacked's own payment infrastructure.

**SD-K005 — Reseller Program Legally Gated**
No Kasse reseller program until Robert has consulted attorney on FTC Business Opportunity Rule and state business opportunity laws. When built, structure as $0 onboarding + monthly SaaS (not $500+ upfront). Safer alternative: referral program with revenue share, not a "business opportunity."

**SD-K006 — "Powered by SalonTransact" in Every Checkout**
All POS checkout screens in Kasse must display "Powered by SalonTransact" for legal/liability reasons. This is a hard requirement in every checkout implementation.

**SD-K007 — Never Modify Existing UI When Only Data Is Changed**
No page rebuilds when fixing a data bug. Add new files, don't rewrite existing ones. This rule prevents accidentally overwriting working UI.

**SD-K008 — Payroc Terminal SDK for POS Hardware**
Hardware terminal integration in Kasse uses Payroc Terminal SDK (not Stripe Terminal). Decision pending Matt Perry confirmation on Kasse iPad POS use case. If Payroc SDK doesn't support iPad POS, revisit. Fallback: Stripe Terminal for hardware only, Reyna Pay for online payments (different SDK, same merchant account conceptually — requires attorney review on mixing).

**SD-K009 — Franchise Creator Requires Active Attorney Review**
Before any merchant can use Franchise Creator to create a real franchise system (send it to real applicants), they must acknowledge an attorney review gate. Kasse provides templates as a starting point only. Not legal advice. Never claim otherwise.

---

## PART 7 — THE NORTH STAR METRICS

These are the numbers that prove Kasse is working. Review weekly:

**Growth Metrics:**
- New merchants signed up (weekly)
- Migrations completed from competing platforms (weekly)
- Trial-to-paid conversion rate (% within 30 days)
- Time to first payment processed (median, in hours from signup)

**Retention Metrics:**
- Monthly churn rate (% of paying merchants who cancel)
- Merchant Lock-In Score distribution (% scoring > 50)
- Freeze vs Cancel rate (when merchants hit cancel — % choose freeze)
- Net Revenue Retention (does MRR from existing merchants grow month over month?)

**Engagement Metrics:**
- DAU/MAU ratio (how many merchants log in daily vs monthly)
- Features used per merchant (how many sidebar sections they visit monthly)
- AI Receptionist call volume (proxy for how embedded Kasse is in their operations)
- Booking widget traffic (how much external traffic goes through Kasse)

**Revenue Metrics:**
- MRR total (SaaS + addons + processing)
- Average Revenue Per Merchant (ARPM) — target $250/month
- Processing volume per merchant per month
- Addon attach rate (% of merchants who have at least one paid addon)

**Support Metrics:**
- AI deflection rate (% of tickets resolved without human — target 65%)
- First-contact resolution rate (target > 80%)
- CSAT score (target > 4.5/5.0)
- SLA compliance rate (target > 95%)

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*This is the master strategic document. All other docs in /docs/ are subordinate to this one.*
*Next review: Phase 0 completion (first real merchant processes first real payment)*
