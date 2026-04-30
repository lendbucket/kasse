# EMPIRE ARCHITECTURE
## How All Products Connect — The Single Source of Truth

**Version:** 1.0 | **Owner:** Robert Reyna, CEO — Reyna Tech LLC
**Status:** LOCKED

---

## THE COMPLETE PICTURE

```
                         REYNA TECH LLC
                    (the holding company)
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                       │
  REYNA PAY LLC          REYNA TECH LLC         REYNA INSURE LLC
  (payment rails)        (software products)     (insurance + HCM)
        │                     │                       │
  SalonTransact           Kasse + RunMySalon      SalonBacked
  (the brand)             (the foundation)        (the HCM engine)
        │                     │                       │
        └─────────────────────┼───────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   KASSE ENGINE    │
                    │ (the foundation   │
                    │  everything runs  │
                    │  through)         │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         RUNMYSALON      WHITE-LABEL      DEVELOPER
         PORTAL          BRANDS           API
         (distribution   (any vertical,   (builders +
          for non-tech    any brand)       AI agents)
          businesses)
```

---

## THE THREE ENGINES

### Engine 1 — Reyna Pay (Payment Rails)
**Entity:** Reyna Pay LLC (Wyoming, EIN: 42-1815436)
**Brand:** SalonTransact
**What it does:** All payment processing, tokenization, payouts, disputes
**Processor:** Payroc (locked — SD-001, non-negotiable)
**API:** api.salontransact.com/v1
**Status:** Almost in production (Phase 10)
**Consumed by:** Kasse, SalonBacked, RunMySalon — everything

### Engine 2 — Kasse (The Foundation)
**Entity:** Reyna Tech LLC (Wyoming)
**Brand:** Kasse
**What it does:** Booking, POS, CRM, staff, inventory, AI, franchise management
**API:** api.kasseapp.com/v1
**Status:** Portal built (portal.kasseapp.com), needs Phase 0 wiring
**Consumed by:** RunMySalon, white-label brands, developers

### Engine 3 — SalonBacked (HCM Layer)
**Entity:** Reyna Insure LLC (Wyoming) + SEPA (Texas nonprofit for group purchasing)
**Brand:** SalonBacked
**What it does:** Tax, insurance, payroll, HR, benefits, telehealth
**API:** api.salonbacked.com/v1
**Status:** Member portal exists, needs Kasse data integration
**Consumed by:** Kasse (embedded), RunMySalon (embedded), standalone

---

## THE DATA FLOWS

### Reyna Pay → Everyone
```
Transaction data → Kasse (for reporting, commission calc)
Transaction data → SalonBacked (for tax filing, 1099 generation)
Payout data → SalonBacked (for cash flow dashboard)
Risk signals → Kasse (fraud alerts in POS)
```

### Kasse → SalonBacked
```
Revenue per stylist per period → SalonBacked payroll input
Commission amounts → SalonBacked payroll confirmation
Hours worked (clock events) → SalonBacked labor hours
Tips per stylist → SalonBacked W-2 tip reporting
Service types performed → SalonBacked insurance risk profile
Staff count + roles → SalonBacked benefits eligibility
```

### SalonBacked → Kasse
```
Payroll processed confirmation → Kasse "mark as paid"
Insurance status per stylist → Kasse "Insured" badge on staff profile
CE credits completed → Kasse license tracker update
License expiry dates → Kasse TDLR alert system
HR compliance status → Kasse flag overdue documents
```

### Kasse → RunMySalon
```
All Kasse API endpoints → RunMySalon portal
All Kasse intelligence → RunMySalon Chrome extension
All Kasse booking → RunMySalon embedded booking widget
```

---

## THE PRODUCT DEPENDENCY MAP

```
LAYER 0 — PAYMENT RAILS (must exist first)
╔════════════════════════════════════════════╗
║  Reyna Pay / SalonTransact                 ║
║  • All payment processing                  ║
║  • Tokenization (Hosted Fields)            ║
║  • Payouts and settlements                 ║
║  • Disputes and chargebacks                ║
║  • Financial reporting data                ║
╚════════════════════════════════════════════╝
                    ↓ consumed by

LAYER 1 — THE FOUNDATION (build second)
╔════════════════════════════════════════════╗
║  Kasse Engine                              ║
║  • Booking + scheduling                    ║
║  • POS terminal                            ║
║  • Client CRM + intelligence               ║
║  • Staff management + commissions          ║
║  • Inventory management                    ║
║  • Marketing automation                    ║
║  • AI receptionist                         ║
║  • Reports + analytics                     ║
║  • Franchise management                    ║
║  • Calls Reyna Pay for all payments        ║
╚════════════════════════════════════════════╝
                    ↓ data flows to

LAYER 2 — THE HCM ENGINE (build third, parallel with Kasse)
╔════════════════════════════════════════════╗
║  SalonBacked                               ║
║  • Tax filing (powered by Kasse revenue)   ║
║  • Insurance (risk profiled by Kasse data) ║
║  • Payroll (commission data from Kasse)    ║
║  • HR suite                                ║
║  • Benefits administration                 ║
║  • Telehealth                              ║
║  • Financial wellness                      ║
║  • SEPA membership + group purchasing      ║
╚════════════════════════════════════════════╝
                    ↓ all packaged into

LAYER 3 — DISTRIBUTION (build fourth)
╔════════════════════════════════════════════╗
║  RunMySalon                                ║
║  • Portal wrapping Kasse + SalonBacked     ║
║  • Chrome extension overlay on any POS     ║
║  • Integration connectors (Square OAuth)   ║
║  • White-labeled for any vertical:         ║
║    - RunMyRestaurant                        ║
║    - RunMyGym                               ║
║    - RunMyClinic                            ║
║    - RunMyShop                              ║
║    - [any brand]                            ║
║  • Developer API (engine via API key)       ║
╚════════════════════════════════════════════╝
```

---

## THE THREE API SURFACES

### Reyna Pay API
```
Base URL: api.salontransact.com/v1
Auth: API key (Bearer token)
For: Developers building payment-dependent apps

Key endpoints:
POST /charges          Process a payment
POST /customers        Create/update customer
GET  /cards            List saved cards
POST /cards            Save a card (tokenize)
GET  /reports/revenue  Revenue reporting
POST /webhooks         Subscribe to events
GET  /disputes         View chargebacks
```

### Kasse API
```
Base URL: api.kasseapp.com/v1
Auth: API key (Bearer token)
For: Developers building salon/service business tools
     RunMySalon consumes this internally

Key endpoints:
GET/POST /appointments    Booking management
GET/POST /clients         Client CRM
GET/POST /staff           Staff management
GET/POST /services        Service catalog
GET      /availability    Real-time booking availability
GET      /intelligence/*  AI-powered insights
POST     /webhooks        Subscribe to events
```

### SalonBacked API
```
Base URL: api.salonbacked.com/v1
Auth: API key (Bearer token)
For: HR software, insurance brokers, accountants, payroll platforms

Key endpoints:
GET/POST /members          Stylist/staff profiles
GET/POST /payroll          Payroll calculations
GET      /insurance/quote  Get insurance quote
POST     /insurance/enroll Enroll in coverage
GET      /tax/summary      Tax data summary
GET      /compliance       HR compliance status
POST     /webhooks         Subscribe to events
```

---

## THE CUSTOMER TIERS

```
TIER 1 — Non-technical businesses (largest market)
Purpose: "I just want it to work, don't make me think about APIs"
Product: RunMySalon portal OR Kasse portal
Experience: Connect their existing Square/Vagaro → magic happens
Price: $49-499/month
Motion: Self-serve, Chrome extension, word of mouth

TIER 2 — Semi-technical businesses / franchises (highest value per customer)
Purpose: "I want this branded as my own product"
Product: White-label Kasse or RunMySalon
Experience: Their logo, their domain, their features
Price: $299-999/month + per-location fees
Motion: Direct sales, franchise brokers

TIER 3 — Developers / vibe coders / AI builders (fastest growing)
Purpose: "I want to build something on top of this data"
Product: Kasse API + Developer Portal
Experience: API keys, docs, webhooks, sandbox
Price: Usage-based + subscription tiers
Motion: Developer docs, Product Hunt, GitHub

TIER 4 — AI agents (the future)
Purpose: "Book a haircut for my user without human involvement"
Product: Kasse API (agent-native endpoints)
Experience: HATEOAS, semantic endpoints, OpenAPI 3.1
Price: Per-action pricing ($0.001/action)
Motion: OpenAPI spec discovery, agent framework docs
```

---

## THE WHITE-LABEL MATRIX

| Product | Standalone WL | Example Brand Name | Primary Buyer |
|---------|--------------|-------------------|---------------|
| Kasse (full POS) | Yes | "LuxeSalon OS" | Franchise systems, regional chains |
| SalonBacked (HCM) | Yes | "StaffedPro" | Insurance brokers, PEOs, HR companies |
| RunMySalon (distribution) | Yes | "PoweredBy[Brand]" | Distributors, franchise brokers |
| Reyna Pay (payments) | Yes | "SalonTransact" (already WL) | Any business needing payment rails |

All white-labels: "Powered by Reyna Pay" in footer — non-removable (SD-K-010)

---

## BUILD SEQUENCE

```
DONE:
  ✓ Reyna Pay engine (Phase 10, near production)
  ✓ Kasse portal (UI built, needs data wiring)
  ✓ SalonBacked member portal (exists, needs integration)
  ✓ All strategic docs (this folder)

NEXT:
  → Reyna Pay: finish Phase 10, go to production
  → Kasse Phase 0: wire all pages to real data (10 commits)
  → Kasse Phase 1: real payments through Reyna Pay (10 commits)

THEN (parallel tracks):
  Track A → Kasse Phase 2-3: booking engine + client intelligence
  Track B → SalonBacked: integrate with Kasse data, launch tax + telehealth

THEN:
  → RunMySalon: Chrome extension + portal wrapping both
  → Developer APIs for all three products

THEN:
  → White-label deployments
  → Vertical expansion (RunMyRestaurant, RunMyGym, etc.)
  → Marketplace (kassestylists.com)
  → Franchise Creator Portal
```

---

## COMMAND CENTERS

Each product gets its own Command Center (superadmin portal) at admin.[domain]:

| Product | Domain | What It Shows |
|---------|--------|---------------|
| Kasse | admin.kasseapp.com | All salons, all bookings, all payments, franchise networks |
| SalonBacked | admin.salonbacked.com | All members, all policies, all payrolls, SEPA status |
| Reyna Pay | admin.salontransact.com | All transactions, all disputes, all merchants, risk dashboard |
| RunMySalon | admin.runmysalon.com | All integrations, all white-label brands, API usage |

All Command Centers: identical structure, dark theme, universal navigation.
See COMMAND_CENTER.md for the complete spec and build prompt.

---

## THE MOAT SUMMARY

What makes this impossible to replicate:

1. **Licensed payment rails** — Payroc relationship, MID, compliance took months. Can't vibe-code this.
2. **EFIN + tax filing** — IRS certification takes 12-18 months. 2-year head start.
3. **Insurance carrier relationships** — MGA agreements, carrier appointments, SEPA group policies take years.
4. **Aggregate intelligence** — cross-merchant benchmarks require network scale. Zero data on day one for any competitor.
5. **Network effect** — marketplace only works with stylists. Stylists only come if salons are there. Salons only come if marketplace has consumers. Self-reinforcing once spinning.
6. **White-label dependency** — once a reseller's customers are on your infrastructure, switching destroys their product.
7. **Agent-native API** — built for AI agents from day one. Competitors retrofitting old APIs will be years behind.
