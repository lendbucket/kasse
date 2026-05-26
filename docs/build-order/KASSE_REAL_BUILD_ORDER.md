# KASSE_REAL_BUILD_ORDER.md
## The Canonical Build Sequence — Empire Master Plan
### Status: LIVING | Owner: Robert Reyna, CEO, 36 West Holdings | Created: May 13, 2026

---

## DOCUMENT PURPOSE

This is the **single source of truth for what gets built next, in what order, and why** — across the entire 36 West Holdings empire (Reyna Pay / Kasse / SalonBacked / RunMySalon).

It supersedes:
- `docs/KASSE_SIDEBAR_GAP.md` (the 16-PR roadmap was the wrong sequencing)
- `docs/KASSE_PHASE_COMMITS.md` (predated the multi-portal + multi-vertical foundation analysis)

It complements:
- `docs/KASSE_MASTER_BUILDPLAN.md` (strategic phasing for revenue milestones)
- `docs/REYNA_PAY_API_SPEC.md` (locked engine contract)
- All 40+ strategic docs in `/docs/` (destination specs)

Every other strategic doc describes a **destination**. This document is the **route** from where the codebase is today to where the docs say it should be.

---

## RULES OF ENGAGEMENT

1. No PR is written until its phase and commit are identified in this document or a child doc under `docs/build-order/`.
2. PRs merge in the order specified. Parallelizable phases marked explicitly (`[PARALLEL]`). Sequential phases marked (`[BLOCKS]`).
3. When this doc conflicts with another strategic doc, conflict resolved here (with reference to source).
4. Updated at end of every working session — phase completion logged, PR counts adjusted if scope changes, new phases added if gaps surface.
5. Every PR has Claude Code Review gate. Robert reads every review. SEVERE/Concern findings get fix prompts before merge.
6. **Gated phases** wait on external signal:
   - **[GATED: REYNA_PAY]** — waits for Robert's confirmation Reyna Pay engine is live
   - **[GATED: ATTORNEY]** — waits for legal review (per KASSE_OPEN_QUESTIONS.md)
   - **[GATED: SOC2_AUDIT]** — has continuous-compliance setup but actual audit runs parallel post-foundation
   - **[GATED: HIRING]** — phase scaled when relevant team members hired

---

## EMPIRE ARCHITECTURE

Three engines + one distribution layer + one HCM layer:

```
LAYER 0 — Reyna Pay (SalonTransact) — payment rails
LAYER 1 — Kasse — vertical SaaS
LAYER 2 — SalonBacked — HCM, insurance, tax, payroll, benefits
LAYER 3 — RunMySalon — distribution wrapper for non-technical merchants
```

Repositories:
- `lendbucket/kasse` (primary build target — this doc's scope)
- `lendbucket/salontransact` (engine — separate team)
- `lendbucket/salonbacked` (HCM — built in P27, separate repo)
- `lendbucket/runmysalon` (distribution — built in P30, separate repo)
- `lendbucket/kasse-native` (React Native monorepo — built in P8, separate repo)

Four shared packages designed for cross-product use:
- `@reyna/theme`
- `@reyna/ui`
- `@reyna/engine-client`
- `@reyna/types`

---

## CURRENT STATE SNAPSHOT (MAY 13, 2026)

**Branch HEAD:** `3656c99` (PR #39 merged: Powered by SalonTransact footer)

**Shipped this session:**
- `REYNA_PAY_API_SPEC.md` locked complete (Tiers 1–4, 2397 lines)
- `KASSE_ENGINE_BOUNDARY.md` locked
- Email PII redaction (`lib/redact.ts`)
- Powered by SalonTransact footer (PR #39)

**Schema state (35 tables, ~25 more needed):**
- Has: Organization, User, Location, Staff, Client, Service, Appointment, Transaction, Campaign, GiftCard, Loyalty, Membership, WaitlistEntry, AuditLog, ApiKey, Webhook, AiReceptionistConfig, FormTemplate, FormSubmission, ClockEvent, etc.
- Missing: Role enum, OnboardingSession, Plan/PlanTier, Vertical fields, PayrollRun, Vendor, Bill, KasseAccount, IncomeTarget, PricingAlert, GrowthJournal, PublicHoliday, FranchiseSystem, StylistProfile, MarketplaceBooking, IncubatorCohort, Region/Brand/Concept hierarchy, CustomField, Tag, FeatureFlag, SavedView, EmailTemplate
- `User.role` is `String @default("staff")` — no enum, no enforcement
- `Organization.verticalId` does not exist
- `Organization.planTier` does not exist

**Code state:**
- `lib/` has: auth, prisma, prismaAdmin, redact, tenant, validation, email-template, chicago-time
- Missing: engine, theme, verticals, plan, permissions, payroll, integrations, campaigns, reports, clients, staff, calendar, kassepay, ai, flags, onboarding, log

**Routes:**
- `/login`, `/forgot-password`, `/reset-password` exist
- `/onboarding/page.tsx` — single 37KB file (application form only, NOT 8-step wizard)
- `/dashboard` exists (owner portal partial)
- `/admin` has 4 sections (NOT the 11-section Command Center)
- Missing: `/staff`, `/client`, `/book/[slug]`, `/kiosk`, `/(marketing)`, `/(public)`

---

## TOTAL SCOPE

**~5,095 atomic PRs across 79 phases.**

This is the complete scope to ship a Fortune-500-grade competitor to Square + Toast + Vagaro + Zenoti + Mindbody combined, with the Reyna Pay + Kasse + SalonBacked + RunMySalon empire fully built.

**Calendar agnostic** — burn through phases at the throughput your team can sustain. At 20 PRs/day solo = ~9–10 months. With a team of 5–10 engineers + agent fleet at 80–120 PRs/day = ~5–6 months. At 100+ PRs/day with mature agent infrastructure = 3–4 months for code + ongoing operational work that doesn't compress (SOC 2 audit, customer onboarding, support content authoring).

---

## PHASE INDEX

Each phase below links to a detailed sub-doc in `docs/build-order/`. The sub-doc enumerates every atomic PR in the phase.

### FOUNDATION (P0) — 120 PRs — `[BLOCKS]` everything
- **[P0 — Schema, Role, Theme, Vertical, Plan, Engine](build-order/PHASE_0_FOUNDATION.md)**
  - P0.A Role + Permission System (15 PRs)
  - P0.B Theme System (12 PRs)
  - P0.C VerticalConfig System (18 PRs)
  - P0.D Plan Tier System (10 PRs)
  - P0.E Reyna Pay Engine Client (10 PRs) `[GATED: REYNA_PAY for wire-up]`
  - P0.F Reyna Pay Application Embedding (8 PRs) `[GATED: REYNA_PAY]`
  - P0.G Schema Foundations (15 PRs)
  - P0.H Observability + Feature Flags + i18n (15 PRs)
  - P0.I Custom Fields + Tags + Audit (12 PRs)
  - P0.J Status Page + Error Tracking (5 PRs)

### ONBOARDING (P1) — 80 PRs
- **[P1 — Signup + 8-Step Wizard](build-order/PHASE_1_ONBOARDING.md)**
  - P1.A Signup Foundation (15 PRs)
  - P1.B Wizard Shell (10 PRs)
  - P1.C 8 Wizard Steps (40 PRs)
  - P1.D 30-Day Email Sequence (8 PRs)
  - P1.E Tours + Setup Checklist (7 PRs)

### PORTAL SHELL + MARKETING v1 (P2–P3) — 80 PRs
- **[P2 — Portal Shell + Vertical-Aware Sidebar](build-order/PHASE_2_3_PORTAL_MARKETING.md)** — 40 PRs
- **[P3 — Marketing Site v1](build-order/PHASE_2_3_PORTAL_MARKETING.md)** — 40 PRs

### REAL POS + DEVICE (P4–P5) — 120 PRs `[GATED: REYNA_PAY]`
- **[P4 — Reyna Pay Integration + POS](build-order/PHASE_4_5_POS_DEVICE.md)** — 80 PRs
- **[P5 — Device & Terminal Management](build-order/PHASE_4_5_POS_DEVICE.md)** — 40 PRs

### OWNER PORTAL CORE (P6) — 240 PRs
- **[P6 — Owner Portal Operations](build-order/PHASE_6_OWNER_PORTAL.md)**
  - P6.A Appointments (40 PRs)
  - P6.B Clients (35 PRs)
  - P6.C Services (20 PRs)
  - P6.D Staff (35 PRs)
  - P6.E Payments & Reports (40 PRs)
  - P6.F Marketing + Reputation v1 (30 PRs)
  - P6.G Forms + Inventory + Loyalty + Waitlist + Messages (40 PRs)

### MASTER PORTAL v1 + NATIVE iPad (P7–P8) — 160 PRs
- **[P7 — Master Portal v1 (Mini)](build-order/PHASE_7_8_MASTER_NATIVE.md)** — 60 PRs
- **[P8 — Native Kasse iPad POS](build-order/PHASE_7_8_MASTER_NATIVE.md)** — 100 PRs

### ROLE-BASED VIEWS + CLIENT + KIOSK (P9–P12) — ~120-140 PRs

**Architectural correction (2026-05-26):** Kasse uses ONE portal at `/dashboard` with role-based access control, not separate portals per role. This is the standard SaaS pattern (Square, Toast, Vagaro, Mindbody). P9 and P10 are role-based view layers WITHIN the single portal; P11 (client) and P12 (kiosk) are genuinely separate surfaces.

- **[P9 — Manager Role Views & Permissions](build-order/PHASE_9_12_MANAGER_STAFF_CLIENT_KIOSK.md)** — 20 PRs
  Manager role gates within the single portal. Hide financial / payroll / billing / role-edit sections from sidebar via permission gates. API-layer enforcement on every restricted endpoint. Manager-specific KPIs, reports, location switching, approval workflows.

- **[P10 — Staff Role Views + Mobile Polish + (optional) iPhone Native](build-order/PHASE_9_12_MANAGER_STAFF_CLIENT_KIOSK.md)** — ~40-60 PRs
  Staff sees the same `/dashboard` route tree as everyone else, with permission gates restricting view to their own appointments, their own clients, their own earnings, clock-in/clock-out flow, mobile POS. PWA install, push notifications, offline indicator, mobile-responsive treatments apply portal-wide (not staff-only). Optional iPhone native app (P10.F, 20 PRs) — defers post-launch if PWA-first is acceptable.

- **[P11 — Client Portal + Public Booking + iPhone Native](build-order/PHASE_9_12_MANAGER_STAFF_CLIENT_KIOSK.md)** — 60 PRs
  Genuinely separate surface. Client logs in via magic-link, sees only their own data. Public booking page is unauthenticated. Client iPhone native app is a separate Bundle ID, separate Expo target.

- **[P12 — Kiosk Mode](build-order/PHASE_9_12_MANAGER_STAFF_CLIENT_KIOSK.md)** — 40 PRs
  Genuinely separate surface. PIN-locked tablet, locked-down UX, self check-in, self-service walk-in, self-checkout. Different use case than employee portal.

### INTELLIGENCE + COLOR + AI RECEPTIONIST (P13–P15) — 200 PRs
- **[P13 — Profit Intelligence (Nisha features)](build-order/PHASE_13_15_INTELLIGENCE_COLOR_AI.md)** — 80 PRs
- **[P14 — Kasse Color](build-order/PHASE_13_15_INTELLIGENCE_COLOR_AI.md)** — 60 PRs
- **[P15 — AI Receptionist](build-order/PHASE_13_15_INTELLIGENCE_COLOR_AI.md)** — 60 PRs

### AUTOMATION + MASTER FULL + REPUTATION (P16–P18) — 180 PRs
- **[P16 — Marketing Automation Suite](build-order/PHASE_16_18_AUTOMATION_MASTER_REPUTATION.md)** — 60 PRs
- **[P17 — Master Portal Full (Command Center)](build-order/PHASE_16_18_AUTOMATION_MASTER_REPUTATION.md)** — 80 PRs
- **[P18 — Reputation Engine (Full)](build-order/PHASE_16_18_AUTOMATION_MASTER_REPUTATION.md)** — 40 PRs

### FINANCIAL OPS + MIGRATION (P19–P22) — 170 PRs
- **[P19 — Payroll Engine](build-order/PHASE_19_22_FINANCIAL_MIGRATION.md)** — 50 PRs
- **[P20 — Banking + Bill Pay](build-order/PHASE_19_22_FINANCIAL_MIGRATION.md)** — 40 PRs
- **[P21 — Sales Tax Engine + Nexus Tracker](build-order/PHASE_19_22_FINANCIAL_MIGRATION.md)** — 20 PRs
- **[P22 — Migration Center](build-order/PHASE_19_22_FINANCIAL_MIGRATION.md)** — 60 PRs

### VERTICALS DEEP — Phase 1 (P23–P26) — 180 PRs
- **[P23 — Barbershop Full Build](build-order/PHASE_23_26_VERTICALS_DEEP.md)** — 50 PRs
- **[P24 — Nail Salon](build-order/PHASE_23_26_VERTICALS_DEEP.md)** — 30 PRs
- **[P25 — Restaurant Full Build](build-order/PHASE_23_26_VERTICALS_DEEP.md)** — 60 PRs
- **[P26 — Gym + Med Spa initial](build-order/PHASE_23_26_VERTICALS_DEEP.md)** — 40 PRs

### SALONBACKED + FRANCHISE + MARKETPLACE (P27–P29) — 180 PRs
- **[P27 — SalonBacked Integration](build-order/PHASE_27_29_SALONBACKED_FRANCHISE_MARKETPLACE.md)** — 60 PRs
- **[P28 — Franchise Creator](build-order/PHASE_27_29_SALONBACKED_FRANCHISE_MARKETPLACE.md)** — 80 PRs `[GATED: ATTORNEY for FDD]`
- **[P29 — Stylist Marketplace](build-order/PHASE_27_29_SALONBACKED_FRANCHISE_MARKETPLACE.md)** — 40 PRs

### RUNMYSALON + DEV PLATFORM + AGENT API (P30–P32) — 180 PRs
- **[P30 — RunMySalon Distribution Layer](build-order/PHASE_30_32_RUNMYSALON_DEVELOPER_AGENT.md)** — 60 PRs
- **[P31 — Developer Platform](build-order/PHASE_30_32_RUNMYSALON_DEVELOPER_AGENT.md)** — 80 PRs
- **[P32 — Agent-Native API + MCP + App Marketplace v1](build-order/PHASE_30_32_RUNMYSALON_DEVELOPER_AGENT.md)** — 40 PRs

### WHITE-LABEL + RESELLER + MED SPA HIPAA (P33–P35) — 100 PRs
- **[P33 — White-Label Deployment System](build-order/PHASE_33_35_WHITELABEL_RESELLER_HIPAA.md)** — 30 PRs
- **[P34 — Reseller Program](build-order/PHASE_33_35_WHITELABEL_RESELLER_HIPAA.md)** — 20 PRs `[GATED: ATTORNEY]`
- **[P35 — Med Spa HIPAA Full](build-order/PHASE_33_35_WHITELABEL_RESELLER_HIPAA.md)** — 50 PRs

### VERTICAL EXPANSION (P36–P45) — 250 PRs
- **[P36–P45 — Remaining 30+ verticals](build-order/PHASE_36_45_VERTICAL_EXPANSION.md)**
  - Massage, Yoga, Pilates, Auto Detail, Auto Repair, Pet Grooming, Veterinary, Tattoo, Photography, Cleaning, Food Truck, Catering, Tutoring, Childcare, Coworking, Event Venue, Sports Training, Beauty School, Bar, Cafe, Bakery, Boutique, Retail, Brow Studio, Lash Studio, Tanning, Dance Studio, Martial Arts, CrossFit, Chiropractic, PT

### ENTERPRISE COMPLIANCE + AGENTS + CAPITAL (P46–P52) — 480 PRs
- **[P46 — Enterprise SSO (SAML/OIDC/SCIM/AD)](build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md)** — 40 PRs
- **[P47 — SOC 2 Type II Prep + Audit](build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md)** — 60 PRs `[GATED: SOC2_AUDIT]`
- **[P48 — Advanced Security (bug bounty, pen test, KMS, DR/BCP, GDPR/CCPA)](build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md)** — 60 PRs
- **[P49 — Full HIPAA Audit + BAA program](build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md)** — 40 PRs
- **[P50 — AI Agent Ecosystem](build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md)** — 120 PRs
- **[P51 — Voice-Native Commerce (Alexa, Google Home, Siri, WhatsApp)](build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md)** — 80 PRs
- **[P52 — Kasse Capital (Lending)](build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md)** — 80 PRs `[GATED: ATTORNEY]`

### INTERNATIONAL EXPANSION (P53–P55) — 200 PRs
- **[P53 — International Foundation (multi-currency, full i18n, GDPR, country payment methods)](build-order/PHASE_53_55_INTERNATIONAL.md)** — 80 PRs
- **[P54 — Country Launches (Canada, Mexico, UK, Australia)](build-order/PHASE_53_55_INTERNATIONAL.md)** — 60 PRs
- **[P55 — Multi-Region Deployment](build-order/PHASE_53_55_INTERNATIONAL.md)** — 60 PRs

### DATA + SUPPORT + INCUBATOR + RETENTION + DAYOPS + INTEGRATIONS + EXIT (P56–P62) — 560 PRs
- **[P56 — Data Warehouse + Analytics Infrastructure](build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md)** — 90 PRs
- **[P57 — Support Infrastructure Full (help center, phone, AI deflection, community foundation)](build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md)** — 120 PRs
- **[P58 — Incubator Program](build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md)** — 60 PRs
- **[P59 — Retention Systems Full (Lock-In Score, Freeze, Business Exchange, Accountant Access)](build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md)** — 80 PRs
- **[P60 — Day Ops Deep Polish](build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md)** — 60 PRs
- **[P61 — Integrations Hub (QuickBooks, Xero, Wave, Mailchimp, Klaviyo, Zapier, DoorDash, Uber Eats, Shopify, etc.)](build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md)** — 100 PRs
- **[P62 — Exit Readiness](build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md)** — 50 PRs

### OPERATIONAL + DISTRIBUTION + TRUST + SCALE (P63–P79) — 655 PRs
- **[P63 — Community Forum](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 40 PRs
- **[P64 — Hardware Program (Kasse Station)](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 60 PRs
- **[P65 — Status Page Full](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 15 PRs
- **[P66 — M&A Readiness](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 30 PRs
- **[P67 — CSM Operations Tooling](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 30 PRs
- **[P68 — Sales Operations Tooling](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 25 PRs
- **[P69 — Internal Knowledge Base](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 10 PRs
- **[P70 — People Operations](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 15 PRs
- **[P71 — Internal FinOps](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 20 PRs
- **[P72 — Legal Operations](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 20 PRs
- **[P73 — E-Commerce Storefront](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 50 PRs
- **[P74 — Kasse Connect (B2B Supply Marketplace)](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 40 PRs
- **[P75 — SEO Infrastructure (Programmatic + Schema + Backlinks)](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 30 PRs
- **[P76 — Partner / Channel Program](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 30 PRs
- **[P77 — Trust Center + Compliance Badges](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 40 PRs
- **[P78 — Cross-Merchant Fraud Detection](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 25 PRs
- **[P79 — Scale Infrastructure (Read Replicas, Caching, CDN, Jobs, Search, Event Sourcing, Performance, Load, Chaos, Cost)](build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md)** — 175 PRs

---

## DEPENDENCY GRAPH (HARD SEQUENCING)

```
P0 (Foundation) BLOCKS everything
     │
     ├─→ P1 (Onboarding) — depends on P0
     │      │
     │      └─→ P2 (Portal Shell) + P3 (Marketing v1) [PARALLEL]
     │             │
     │             ├─→ P4 (POS) [GATED: REYNA_PAY]
     │             │      │
     │             │      └─→ P5 (Device) [BLOCKS P6 partial]
     │             │
     │             └─→ P6 (Owner Portal Core) — full operations
     │                    │
     │                    ├─→ P7 (Master Mini) [PARALLEL with P6]
     │                    ├─→ P8 (Native iPad) [PARALLEL with P6 after P0.E]
     │                    ├─→ P9 (Manager role views) [depends on P6 — same route tree]
     │                    ├─→ P10 (Staff role views + mobile polish) [depends on P6 — same route tree]
     │                    ├─→ P11 (Client Portal + Public Booking) [separate surface, PARALLEL with P9/P10]
     │                    └─→ P12 (Kiosk) [separate surface, PARALLEL with P9/P10/P11]
     │
     └─→ Layer 1 complete → P13-P22 (intelligence, automation, master full, financial, migration)
           │
           └─→ Layer 2 complete → P23-P29 (verticals, SalonBacked, Franchise, Marketplace)
                 │
                 └─→ Layer 3 complete → P30-P35 (RunMySalon, Dev Platform, Agents, White-Label, HIPAA)
                       │
                       └─→ P36-P55 (verticals expansion, enterprise compliance, international)
                             │
                             └─→ P56-P79 (warehouse, support, retention, ops, trust, scale)
```

Parallelizable from foundation:
- P3 (Marketing) can run parallel with P1-P6 once P0 done
- P7 (Master Mini) can run parallel with P6 once P0 done
- P8 (Native iPad) can run parallel with P6 once P0.E ready
- P11 (Client) can run parallel with P10 (Staff)
- Verticals (P23+) can run parallel once P6 framework solid

---

## EXECUTION TRACKS

**Track A — Solo / Single Builder:** Sequential phase-by-phase through P0 → P1 → P2/P3 → P4 → P5 → P6 → ... At 20 PRs/day = ~9–10 months total.

**Track B — Small Team (3–5 engineers + Robert):** Phases parallelized per CODEOWNERS. Each engineer owns 1–2 phase-groups at a time. Robert handles architecture + review + planning. ~5–6 months total at 80 PRs/day team throughput.

**Track C — Full Team + Agent Fleet (10+ engineers + background agents):** Aggressive parallelization. 100–200 PRs/day. ~3–4 months for code; operational work (SOC 2 audit, support content, customer onboarding) doesn't compress.

---

## GATED PHASES SUMMARY

| Phase | Gate | Unlocked By |
|-------|------|-------------|
| P0.E, P0.F (wire-up only) | REYNA_PAY | Robert confirms engine endpoints live in test |
| P1.C.4.2 (embed application iframe) | REYNA_PAY | SalonTransact ships public application API |
| P4 (POS), P5 (Device) | REYNA_PAY | Engine live in test |
| P28 (Franchise Creator FDD template) | ATTORNEY | Franchise attorney reviews FDD template |
| P34 (Reseller Program) | ATTORNEY | Counsel review per OQ-006 |
| P47 (SOC 2 audit) | SOC2_AUDIT | 6–12 month observation window post-controls-setup |
| P52 (Kasse Capital) | ATTORNEY | Counsel review per OQ-010 (state MCA disclosure) |

---

## NEXT STEPS

1. Robert reviews this master doc + 19 phase sub-docs.
2. Robert approves or requests changes.
3. On approval, merge PR.
4. First PR after merge: **P0.A.1 — Drop string `User.role`, add `Role` enum** (full prompt to be written).
5. Brute force through phases in order. Update this doc at end of every session.

---

## OPEN QUESTIONS BEFORE STARTING

All 12 OQs from `KASSE_OPEN_QUESTIONS.md` should be resolved before their respective phases. Specifically:

- **OQ-001 (Payroc Terminal SDK vs Stripe Terminal):** Decide before P5 ships. Affects native iPad SDK choice.
- **OQ-002 (PWA vs native Kiosk):** Decide before P12 ships. Current recommendation: PWA first, native later for App Store credibility.
- **OQ-003 (Database scaling):** Address in P79 (scale infrastructure). Plan migration path before crossing 10K merchants.
- **OQ-004 (Twilio A2P 10DLC):** Register IMMEDIATELY — needed before P15 (AI Receptionist) + P17 (Marketing automation).
- **OQ-005 (Google My Business OAuth):** Decide before P18 (Reputation engine).
- **OQ-006 (Franchise fee auto-collection legal):** P28 gated on this.
- **OQ-007 (AI receptionist liability):** Resolve before P15 ships.
- **OQ-008 (Cross-vertical customer identity):** Decide before P6.B (Clients). Default to siloed.
- **OQ-009 (App Store white-label strategy):** Decide before P33 (White-label).
- **OQ-010 (Kasse Capital lending license):** P52 gated on this.
- **OQ-011 (SalonBacked insurance carriers):** P27 partially blocked; can build UI before carriers confirm.
- **OQ-012 (Franchise FDD template legal):** P28 partially gated.

---

*Document version 1.0 — May 13, 2026*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*This document is the canonical sequencing doc. All build work follows from here.*
*Updated at end of every working session.*
