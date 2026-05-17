# Conversation vs. Docs — Contradictions Report

**Generated:** 2026-05-17  
**Total docs read:** 64 files (44 in `docs/`, 20 in `docs/build-order/`)

---

## 1. Document Inventory

| File | Lines | Status |
|------|-------|--------|
| `docs/AI_STRATEGY.md` | 269 | LOCKED |
| `docs/COMMAND_CENTER.md` | 681 | LOCKED |
| `docs/EMPIRE_ARCHITECTURE.md` | 329 | LOCKED |
| `docs/KASSE_API_SPEC.md` | 327 | LIVING |
| `docs/KASSE_ARCHITECTURE.md` | 297 | LIVING |
| `docs/KASSE_COLOR.md` | 354 | PLANNING |
| `docs/KASSE_DAYOPS.md` | 1438 | PLANNING |
| `docs/KASSE_DESIGN_SYSTEM.md` | 1538 | LIVING |
| `docs/KASSE_ENGINE_BOUNDARY.md` | 375 | LOCKED |
| `docs/KASSE_EXIT_THESIS.md` | 156 | PLANNING |
| `docs/KASSE_FEATURES.md` | 512 | LIVING |
| `docs/KASSE_FRANCHISE_ALL.md` | 811 | PLANNING |
| `docs/KASSE_FRANCHISE_SYSTEM.md` | 272 | PLANNING |
| `docs/KASSE_INCUBATOR.md` | 494 | PLANNING |
| `docs/KASSE_INTEGRATIONS.md` | 1121 | PLANNING |
| `docs/KASSE_MARKETING_SITE.md` | 621 | LIVING |
| `docs/KASSE_MARKETPLACE.md` | 219 | PLANNING |
| `docs/KASSE_MASTER_BUILDPLAN.md` | 848 | LIVING |
| `docs/KASSE_MIGRATION.md` | 781 | PLANNING |
| `docs/KASSE_ONBOARDING.md` | 647 | PLANNING |
| `docs/KASSE_OPEN_QUESTIONS.md` | 155 | LIVING |
| `docs/KASSE_PAYROLL_BILLPAY.md` | 929 | PLANNING |
| `docs/KASSE_PHASE_COMMITS.md` | 850 | LIVING |
| `docs/KASSE_PORTALS.md` | 743 | LIVING |
| `docs/KASSE_PORTAL_ARCHITECTURE.md` | 997 | LIVING |
| `docs/KASSE_RETENTION.md` | 818 | PLANNING |
| `docs/KASSE_ROADMAP.md` | 302 | LIVING |
| `docs/KASSE_SIDEBAR_GAP.md` | 225 | LIVING |
| `docs/KASSE_STRATEGIC_DECISIONS.md` | 111 | LOCKED |
| `docs/KASSE_SUPPORT.md` | 604 | PLANNING |
| `docs/KASSE_TIERS.md` | 420 | LIVING |
| `docs/KASSE_UI_PRINCIPLES.md` | 356 | LIVING |
| `docs/KASSE_VERTICALS_EXPANDED.md` | 1614 | PLANNING |
| `docs/KASSE_VERTICAL_SPECS.md` | 336 | PLANNING |
| `docs/KASSE_VISION.md` | 148 | LOCKED |
| `docs/KASSE_WHITE_LABEL_GUIDE.md` | 229 | PLANNING |
| `docs/README.md` | 109 | LIVING |
| `docs/REYNA_PAY_API_SPEC.md` | 2457 | LOCKED |
| `docs/RLS_AUDIT.md` | 627 | LIVING |
| `docs/RUNMYSALON.md` | 292 | PLANNING |
| `docs/SALONBACKED.md` | 282 | PLANNING |
| `docs/blind-spots.md` | 68 | LIVING |
| `docs/strategic-decisions.md` | 48 | LIVING |
| `docs/ui-feedback.md` | 46 | LIVING |
| `docs/build-order/KASSE_REAL_BUILD_ORDER.md` | 341 | LIVING |
| `docs/build-order/PHASE_0_FOUNDATION.md` | 1327 | LIVING |
| `docs/build-order/PHASE_1_ONBOARDING.md` | 503 | PLANNING |
| `docs/build-order/PHASE_2_3_PORTAL_MARKETING.md` | 147 | PLANNING |
| `docs/build-order/PHASE_4_5_POS_DEVICE.md` | 661 | PLANNING |
| `docs/build-order/PHASE_6_OWNER_PORTAL.md` | 382 | PLANNING |
| `docs/build-order/PHASE_7_8_MASTER_NATIVE.md` | 525 | PLANNING |
| `docs/build-order/PHASE_9_12_MANAGER_STAFF_CLIENT_KIOSK.md` | 463 | PLANNING |
| `docs/build-order/PHASE_13_15_INTELLIGENCE_COLOR_AI.md` | 521 | PLANNING |
| `docs/build-order/PHASE_16_18_AUTOMATION_MASTER_REPUTATION.md` | 403 | PLANNING |
| `docs/build-order/PHASE_19_22_FINANCIAL_MIGRATION.md` | 308 | PLANNING |
| `docs/build-order/PHASE_23_26_VERTICALS_DEEP.md` | 366 | PLANNING |
| `docs/build-order/PHASE_27_29_SALONBACKED_FRANCHISE_MARKETPLACE.md` | 659 | PLANNING |
| `docs/build-order/PHASE_30_32_RUNMYSALON_DEVELOPER_AGENT.md` | 516 | PLANNING |
| `docs/build-order/PHASE_33_35_WHITELABEL_RESELLER_HIPAA.md` | 321 | PLANNING |
| `docs/build-order/PHASE_36_45_VERTICAL_EXPANSION.md` | 242 | PLANNING |
| `docs/build-order/PHASE_46_52_ENTERPRISE_AGENTS_CAPITAL.md` | 660 | PLANNING |
| `docs/build-order/PHASE_53_55_INTERNATIONAL.md` | 283 | PLANNING |
| `docs/build-order/PHASE_56_62_WAREHOUSE_SUPPORT_RETENTION_EXIT.md` | 774 | PLANNING |
| `docs/build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md` | 1052 | PLANNING |

**Total lines:** 35,310

---

## 2. Contradictions

### 2.1 Pricing / Tier Structure

#### CONTRADICTION: Tier names, counts, and prices

| What docs say | What conversation decided | Severity |
|---|---|---|
| `KASSE_TIERS.md` — 5 tiers: Free ($0), Starter ($49), Growth ($99), Pro ($179), Enterprise ($349). Pricing is **per-merchant**. | 4-tier **per-location** model: FREE / PLUS $29/loc / PREMIUM $69/loc / ENTERPRISE. Square-aligned. Already shipped in PR #70. | **BLOCKING** |

- **Doc source:** `docs/KASSE_TIERS.md` § "THE FIVE TIERS"
- **Resolution:** KASSE_TIERS.md must be rewritten entirely. The shipped code (PR #70) is canonical. The $250/merchant ARPU model, addon catalog, and all tier feature gates need recalculation against the new per-location structure.

#### CONTRADICTION: Revenue math

| What docs say | What conversation decided | Severity |
|---|---|---|
| `KASSE_TIERS.md` — $250/merchant ARPU target, Growth at $99 most common plan | Per-location pricing maxes at ENTERPRISE (custom). $250 ARPU target may still hold but math is different when billing per-location. | **IMPORTANT** |

- **Doc source:** `docs/KASSE_TIERS.md` § "PRICING PHILOSOPHY"
- **Resolution:** Recalculate ARPU model against new tier structure. Document whether the $250 target is per-merchant (aggregate across locations) or per-location.

---

### 2.2 Mobile Technology

#### CONTRADICTION: React Native vs. Capacitor

| What docs say | What conversation decided | Severity |
|---|---|---|
| `KASSE_STRATEGIC_DECISIONS.md` SD-K-013 — React Native (Expo) for all native apps. `KASSE_ARCHITECTURE.md` — `kasse-native/` repo with React Native. `KASSE_DESIGN_SYSTEM.md` — Staff app as React Native (Expo). | **Capacitor v1, React Native v2.** React Native rewrite immediately after v1 ships. | **BLOCKING** |

- **Doc sources:** `docs/KASSE_STRATEGIC_DECISIONS.md` SD-K-013, `docs/KASSE_ARCHITECTURE.md` § "REPOSITORY STRUCTURE", `docs/KASSE_DESIGN_SYSTEM.md` § staff app
- **Resolution:** SD-K-013 needs amendment: "Capacitor for v1 launch (speed to market), React Native rewrite as first post-launch initiative." Architecture doc needs `kasse-native/` replaced with Capacitor project structure for v1. Design system's React Native references need Capacitor equivalent.

---

### 2.3 Backend Architecture

#### CONTRADICTION: "Thin client, zero backend" vs. own Prisma+RLS backend

| What docs say | What conversation decided | Severity |
|---|---|---|
| `KASSE_STRATEGIC_DECISIONS.md` SD-K-001 — "Kasse has no server-side data storage. All data persists through Reyna Pay engine API calls." | Kasse has its own Prisma + Supabase PostgreSQL + RLS backend. Reyna Pay handles **payment operations only**; Kasse owns appointments, clients, staff, services, formulas, etc. | **BLOCKING** |

- **Doc sources:** `docs/KASSE_STRATEGIC_DECISIONS.md` SD-K-001, vs. `docs/KASSE_ARCHITECTURE.md` (shows Prisma schema, 35+ tables, Supabase DB), `docs/RLS_AUDIT.md` (documents RLS policies on Kasse's own tables)
- **Note:** `docs/KASSE_ENGINE_BOUNDARY.md` partially resolves this by scoping "thin client" to payment operations only, but SD-K-001 as written says "All data persists through Reyna Pay."
- **Resolution:** Rewrite SD-K-001 to: "Kasse is a thin client **for payment operations only**. All payment data persists through Reyna Pay. Non-payment domain data (appointments, clients, staff, services, inventory, formulas) is stored in Kasse's own Supabase PostgreSQL database with row-level security." ENGINE_BOUNDARY.md already aligns with this interpretation.

---

### 2.4 Payroll / HCM Scope

#### CONTRADICTION: "No payroll in Kasse" vs. HCM foundations in v1

| What docs say | What conversation decided | Severity |
|---|---|---|
| `KASSE_STRATEGIC_DECISIONS.md` SD-K-007 — "Payroll is NOT built natively in Kasse. Commission calculation and payroll exports only. Actual payroll processing (direct deposit, tax withholding, W-2) is external." | HCM foundations in v1: W-4/I-9 collection, direct deposit setup, time clock, PTO tracking. Full payroll processing v2. 1099/W-2 PDF generation v1, e-filing v2. | **BLOCKING** |

- **Doc sources:** `docs/KASSE_STRATEGIC_DECISIONS.md` SD-K-007, `docs/SALONBACKED.md` (payroll is SalonBacked Phase 1: export, Phase 2: native), `docs/KASSE_PAYROLL_BILLPAY.md` (contradicts both by describing full native payroll in Kasse with Wise API)
- **Resolution:** Three-way conflict. Conversation decision is canonical: Kasse v1 handles HCM **foundations** (data collection, time clock, PTO, document generation) but does NOT process payroll (no direct deposit disbursement, no tax withholding calculation, no quarterly filing). Full payroll processing is v2. SD-K-007 needs nuance; PAYROLL_BILLPAY.md needs scope trimming or v2 labeling.

---

### 2.5 AI Agents — Scope & Guardrails

#### CONTRADICTION: AI scope not documented with guardrails

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/AI_STRATEGY.md` — Lists AI features (receptionist, color, consult, vision, coach, forecast, guard) without action guardrails or monetary thresholds. `docs/COMMAND_CENTER.md` — "AI Dev Console" for code-level interactions. | AI agents: $50 refund threshold (above = propose-then-confirm), human always confirms refunds, cannot deploy code or run migrations in v1. Reactive bug detection v1, proactive v2. Code-modification AI v2. | **IMPORTANT** |

- **Doc sources:** `docs/AI_STRATEGY.md` entire doc, `docs/COMMAND_CENTER.md` § "AI Dev Console"
- **Resolution:** AI_STRATEGY.md needs a new "Guardrails & Limitations" section documenting: monetary thresholds, human-in-the-loop requirements, v1 vs v2 autonomy levels, and explicitly prohibited actions.

#### CONTRADICTION: AI agent list mismatch

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/AI_STRATEGY.md` — Kasse Color AI, Kasse Consult, Kasse Vision, Kasse Coach, Kasse Forecast, Kasse Guard | Action-taking help center AI, command center AI, booking AI, voice receptionist v1, code-modification AI v2 | **MINOR** |

- **Resolution:** Reconcile naming. The conversation's list is more operational (what the AI does for the merchant day-to-day); the doc's list is more product-branded. Both are valid but should map to each other explicitly.

---

### 2.6 PCI Compliance Level

#### CONTRADICTION: Pass-through vs. Managed PCI

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_ENGINE_BOUNDARY.md` — Kasse never sees raw card data (Hosted Fields iframe). Reduces PCI scope. `docs/strategic-decisions.md` SD-010 — "we never touch card data; Payroc does" | Pass-through PCI v1, Managed PCI Level 1 v2. (Conversation initially discussed Managed in v1, then reverted to pass-through.) | **IMPORTANT** |

- **Doc sources:** `docs/KASSE_ENGINE_BOUNDARY.md` § "Hard rules", `docs/strategic-decisions.md` SD-010
- **Resolution:** Docs currently align with conversation's final decision (pass-through v1). Needs explicit documentation that Managed PCI Level 1 is a v2 goal. No immediate fix needed beyond adding the v2 note.

---

### 2.7 Booth Rental / Sub-Merchant

#### CONTRADICTION: Sub-merchant scope

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_PAYROLL_BILLPAY.md` — Booth renter optionally runs own Kasse account as sub-merchant, manages own clients/appointments. `docs/KASSE_FEATURES.md` — Booth Renter as staff role with commission engine handling deductions. | True sub-merchant booth rental v2 (own POS, own MID). v1 = classification-only (booth renters use external POS, Kasse just tracks rent). | **IMPORTANT** |

- **Resolution:** PAYROLL_BILLPAY.md's sub-merchant section needs v2 labeling. FEATURES.md "Booth Renter" role is fine for v1 (classification + rent tracking). Add explicit note: "Booth renters in v1 bring their own POS; Kasse tracks rent payment and classification for tax purposes only."

---

### 2.8 Scale & SLA

#### CONTRADICTION: Scale targets

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_TIERS.md` — Support SLAs by tier (72hr → 1hr). No merchant count targets. `docs/KASSE_OPEN_QUESTIONS.md` OQ-003 — Plan for 10,000+ merchants; Supabase limits at ~1000 concurrent connections. | v1 supports 20k merchants, aiming for 100k over time. 99.9% SLA (99.95% ENTERPRISE). Single-region us-east-2 v1, multi-region v2. | **IMPORTANT** |

- **Doc sources:** `docs/KASSE_OPEN_QUESTIONS.md` OQ-003, `docs/build-order/PHASE_63_79_OPS_DISTRIBUTION_TRUST_SCALE.md`
- **Resolution:** Need a dedicated "Scale & Infrastructure" section or doc capturing: merchant count targets (20k v1 / 100k long-term), SLA numbers, single-region decision, and database scaling strategy.

---

### 2.9 Internationalization & Language

#### CONTRADICTION: Spanish scope and international timeline

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/AI_STRATEGY.md` — "Spanish from day one (Corpus Christi 60%+ Hispanic market)." `docs/build-order/PHASE_53_55_INTERNATIONAL.md` — Full i18n in Phase 53 (very late). | Spanish customer-facing surfaces v1. Admin English-only v1. International (Canada/UK/EU) v3. | **IMPORTANT** |

- **Resolution:** AI_STRATEGY aligns with conversation on Spanish. But PHASE_53_55 puts i18n in a late phase. Need to clarify: Spanish customer-facing (booking page, SMS, receipts, kiosk) ships in v1 as part of foundation. Full multi-language admin + multi-currency + GDPR = Phase 53+ / v3.

---

### 2.10 Onboarding Flow

#### CONTRADICTION: Onboarding scope and details

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_ONBOARDING.md` — 8-step wizard, 30min TTV, 30-day email drip. No mention of e-signature, employment agreements, save+resume, or KYC placement. | Branched wizard with save+resume, employment agreement templates + custom upload, custom-built e-signature (canvas + audit log), concierge fallback for ENTERPRISE, Payroc KYC in payments settings (not initial onboarding). | **IMPORTANT** |

- **Resolution:** KASSE_ONBOARDING.md needs expansion: save+resume state machine, branched paths by business type, employment agreement step for salons with staff, e-signature component spec, and explicit note that KYC lives in Settings > Payments (not onboarding wizard).

---

### 2.11 Multi-Location Hierarchy

#### CONTRADICTION: Hierarchy models not fully documented

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_FRANCHISE_SYSTEM.md` — Single hierarchy: Organization > Zone/Region > Location. | All 3 hierarchy models supported: flat, tiered, brand-mode. Per-location service catalogs with multi-location toggle. Sub-tenants propose prices for parent approval. Stylists have primary location and can travel. | **IMPORTANT** |

- **Resolution:** FRANCHISE_SYSTEM.md only covers the franchise (tiered) model. Need documentation of flat multi-location (one owner, multiple locations, no hierarchy) and brand-mode (shared brand, independent P&Ls). Service catalog multi-location behavior and traveling stylist logic also undocumented.

---

### 2.12 Franchise Royalty Model

#### CONTRADICTION: Royalty collection method

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_STRATEGIC_DECISIONS.md` SD-K-011 — "Franchise fees auto-collected through SalonTransact. Manual invoicing is not the primary path." | Royalty model is owner's choice: auto-deduct / periodic / invoiced — they pick. | **MINOR** |

- **Resolution:** SD-K-011 should be amended: "Auto-collection is the default and recommended path. Franchise owners may alternatively choose periodic deduction or manual invoicing based on their preference."

---

### 2.13 Commission Models

#### CONTRADICTION: Commission detail level

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_FEATURES.md` — Mentions commission engine, tiered commission, custom formulas. No detail on models. | Every model possible per-stylist: flat %, per-service fixed, tiered (volume-based), booth rental deduction, hybrid (salary+commission, hourly+commission). Profitability calculator with what-if scenarios. | **MINOR** |

- **Resolution:** FEATURES.md commission section needs expansion with the full model list. Profitability calculator is a new feature not mentioned anywhere.

---

### 2.14 Geolocation / Time Clock

#### CONTRADICTION: Geolocation not documented

| What docs say | What conversation decided | Severity |
|---|---|---|
| No doc covers geolocation enforcement for time clock. `docs/KASSE_FEATURES.md` mentions "time clock" but no enforcement details. | Geolocation: soft warn + audit log + manager override + 100ft radius + jailbreak/IP detection. iPad in-salon + geofenced mobile + geofenced-during-service hourly tracking. | **IMPORTANT** |

- **Resolution:** This is a conversation addition not covered in any existing doc. Needs its own section in a HCM/workforce doc or in FEATURES.md under time clock.

---

### 2.15 50-State Employment Compliance

#### CONTRADICTION: Not documented in any existing doc

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/SALONBACKED.md` — Mentions HR module and compliance generically. No state-by-state detail. | 50 states employment compliance v1 (priority: TX, CA, FL, NY, IL). Includes minimum wage rules, overtime, break requirements, tip credit, classification rules per state. | **IMPORTANT** |

- **Resolution:** Conversation addition. Needs a new section in SALONBACKED.md or a dedicated compliance doc listing per-state requirements and priority order.

---

### 2.16 Tip Splits

#### CONTRADICTION: Not documented beyond "deferred question"

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/strategic-decisions.md` SD-010 deferred questions — "If multiple stylists work on one ticket, how does tip get split? Decision lives with the commission system in P0.G." | Configurable per salon: primary-only / time-based / revenue-ratio / explicit %. Owner education during onboarding. | **MINOR** |

- **Resolution:** The deferred question in SD-010 is now answered. Document the decision in the commission/HCM spec.

---

### 2.17 Inventory Management

#### CONTRADICTION: Auto-deduction scope

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_COLOR.md` — Auto-deduct from inventory on service completion. `docs/KASSE_FEATURES.md` — Auto-deduct when used in service (implied always-on). | Manual deduction v1 with optional auto-deduction toggle. Auto-deduction default off. Real-time alerts + auto-reorder partnership with Salon Centric. Theft/over-usage detection. | **MINOR** |

- **Resolution:** COLOR doc's auto-deduct is fine (color-specific, high-value). FEATURES.md should clarify: manual deduction is default; auto-deduction is opt-in per service category. Salon Centric partnership and theft detection are conversation additions.

---

### 2.18 Schedule / Slot Granularity

#### CONTRADICTION: Scheduling detail level

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_FEATURES.md` — Multi-stylist view, drag-to-reschedule, recurring. No mention of slot granularity, buffer time, or AI schedule building. | 15-min slot granularity. Weekly recurring + exceptions. Owner schedule builder with AI-from-photo. Buffer time per-service default + per-stylist override. | **MINOR** |

- **Resolution:** FEATURES.md scheduling section needs: slot granularity (15min), buffer time logic, AI schedule builder from photo (scan existing paper schedule).

---

### 2.19 Customer Data Model

#### CONTRADICTION: Customer ownership model

| What docs say | What conversation decided | Severity |
|---|---|---|
| `docs/KASSE_FEATURES.md` — "Client list (unlimited)" with profiles, notes, history. No mention of org-level vs location-level ownership. | Per-org (privacy-first). Structured allergies + free-text preferences. Structured formula history with dates/timestamps. Single boolean marketing consent. | **IMPORTANT** |

- **Resolution:** Critical architectural decision (per-org client ownership) not documented anywhere. Needs explicit documentation: clients belong to the organization, visible across all org locations, with single marketing consent boolean (not per-channel).

---

### 2.20 WCAG / Accessibility

#### NON-CONTRADICTION (alignment confirmed)

| What docs say | What conversation decided |
|---|---|
| `docs/KASSE_DESIGN_SYSTEM.md` — WCAG AA minimum, 4.5:1 contrast, 44px touch targets, aria-label, focus indicators. | WCAG 2.1 AA v1. |

- **Status:** Docs and conversation align. No action needed.

---

## 3. Conversation Additions Not in Docs

These decisions from our conversation have no coverage in any existing doc:

### 3.1 SMS/Email Card-Capture Portal for Phone Bookings
- **Decision:** When a salon books a client by phone, they can send an SMS/email link to a secure portal where the client enters their card for hold/no-show protection.
- **Why it matters:** Eliminates "take your card number over the phone" (PCI risk) and supports no-show fee enforcement for phone bookings.
- **Where it should live:** `KASSE_FEATURES.md` § Payments, or new POS/checkout doc.

### 3.2 Dual-iPad POS Architecture (partially documented)
- **Current state:** Documented in `docs/strategic-decisions.md` SD-010, but this file is a stray (lowercase, unnumbered in main strategic decisions). Not referenced from build-order phases.
- **Action needed:** Renumber as SD-K-016, move into `KASSE_STRATEGIC_DECISIONS.md`, and reference from P0.G and P8 in build-order.

### 3.3 AI Command Center Scope
- **Decision:** AI command center for salon owners — natural language queries against business data, anomaly alerts, revenue forecasting. Action-taking (not just read-only) with guardrails.
- **Where it should live:** `docs/AI_STRATEGY.md` or dedicated `AI_COMMAND_CENTER.md`.

### 3.4 Marketing Automation (v1 scope)
- **Decision:** Drip campaigns, abandoned-booking recovery, win-back sequences, birthday/anniversary automations — all in v1.
- **Current docs:** `KASSE_FEATURES.md` mentions "marketing automations" generically. `KASSE_RETENTION.md` has extensive detail but as a future addon.
- **Action needed:** Clarify which automations are included in base plan vs addon in the new tier structure.

### 3.5 AI Content Generation Tone
- **Decision:** Human tone, no AI tone, no dashes (—), no bullet-heavy responses. All AI-generated content (marketing emails, review responses, social posts) must sound like the salon owner.
- **Where it should live:** `docs/AI_STRATEGY.md` § "Content Generation Guidelines" or `KASSE_UI_PRINCIPLES.md`.

### 3.6 Reviews — Smart Filter + Google Business Profile
- **Decision:** Smart filter v1 (only 4+ star reviews shown publicly). Google Business Profile integration v1 for review management.
- **Where it should live:** `KASSE_FEATURES.md` § Reputation, or `KASSE_INTEGRATIONS.md`.

### 3.7 Loyalty & Referral Programs
- **Decision:** Custom per salon v1. Loyalty points/stamps/visits — salon owner configures rules. Referral program extends to sub-merchants (booth renters can participate in salon's referral program).
- **Where it should live:** `KASSE_FEATURES.md` § Loyalty.

### 3.8 TDPSA + CCPA Compliance
- **Decision:** Templates and handling-on-behalf for Texas Data Privacy and Security Act + CCPA v1. Includes right-to-delete, right-to-export, consent management.
- **Current docs:** `docs/blind-spots.md` flags TDPSA/CCPA as missing. Not documented anywhere else.
- **Where it should live:** New compliance doc or `KASSE_FEATURES.md` § Privacy.

### 3.9 HIPAA Medspa
- **Decision:** Explicitly v2. Not in v1 scope.
- **Current docs:** `KASSE_STRATEGIC_DECISIONS.md` SD-K-008 mentions HIPAA-adjacent encryption. `PHASE_33_35` has HIPAA as Phase 35.
- **Action needed:** Confirm alignment (docs say Phase 35, conversation says v2 — same thing if v2 ≈ Phase 33+).

### 3.10 Cart Starts at Appointment Creation
- **Decision:** Cart is created when appointment is created (not at checkout time). Walk-in auto-creates shell appointment. Per-chair device assignment. Full offline mode preferred.
- **Where it should live:** `docs/strategic-decisions.md` SD-010 expansion, or new Cart/POS doc.

### 3.11 Single-Region Deployment (us-east-2)
- **Decision:** Single AWS/Vercel region (us-east-2) for v1, serving nationwide. Multi-region v2.
- **Current docs:** No doc specifies the region. `PHASE_53_55` mentions multi-region as Phase 55.
- **Where it should live:** `KASSE_ARCHITECTURE.md` § Infrastructure.

### 3.12 Profitability Calculator
- **Decision:** What-if calculator showing owners the financial impact of switching a stylist between commission models.
- **Where it should live:** `KASSE_FEATURES.md` § Staff/HCM or new HCM doc.

### 3.13 Owner Checkout from Anywhere (Hosted Fields)
- **Decision:** Owner/manager can process a payment from any device (not just the paired iPad) using Payroc Hosted Fields.
- **Where it should live:** `docs/strategic-decisions.md` SD-010 or POS doc.

### 3.14 Custom E-Signature Component
- **Decision:** Custom-built e-signature (HTML canvas + typed name + timestamp + IP audit log). Not DocuSign or third-party.
- **Where it should live:** `KASSE_ONBOARDING.md` or new HCM/employment doc.

### 3.15 Concierge Onboarding (ENTERPRISE)
- **Decision:** ENTERPRISE tier gets concierge fallback — human-assisted onboarding if self-serve wizard isn't completed within X days.
- **Where it should live:** `KASSE_ONBOARDING.md` § Enterprise path.

### 3.16 Multiple Comp Models per Stylist
- **Decision:** A single stylist can have multiple simultaneous compensation models (e.g., salary + commission on retail, or hourly + per-service commission).
- **Where it should live:** New HCM doc or `KASSE_FEATURES.md` § Commission.

### 3.17 Traveling Stylists
- **Decision:** Stylists have a primary location but can be scheduled at any org location. Their compensation follows them.
- **Where it should live:** Multi-location doc or `KASSE_FEATURES.md` § Staff.

### 3.18 Service Catalog Multi-Location Toggle
- **Decision:** Per-location service catalogs with a "sync to all locations" toggle. Sub-tenants can propose price changes that require parent approval.
- **Where it should live:** Multi-location or franchise doc.

### 3.19 Payroc KYC in Settings (Not Onboarding)
- **Decision:** Merchant KYC for payment processing lives in Settings > Payments, not in the initial onboarding wizard. Onboarding can proceed without completing KYC.
- **Where it should live:** `KASSE_ONBOARDING.md` (explicit exclusion note).

---

## 4. Stale Docs

### 4.1 KASSE_TIERS.md — References unshipped tier structure as if active
- **Issue:** Entire tier structure (Free/Starter/Growth/Pro/Enterprise at $0/$49/$99/$179/$349) is written in present tense as the active pricing. PR #70 shipped a different structure (FREE/PLUS/PREMIUM/ENTERPRISE at $0/$29/$69/custom per-location).
- **Staleness:** The shipped code contradicts the doc. Doc is stale.

### 4.2 KASSE_STRATEGIC_DECISIONS.md SD-K-001 — Claims "zero backend"
- **Issue:** Written as if Kasse has no database. Kasse has had a Prisma + Supabase database since early PRs. The "thin client" framing applies only to payment operations.
- **Staleness:** Decision was written before the architecture solidified. Needs scoping.

### 4.3 KASSE_STRATEGIC_DECISIONS.md SD-K-013 — Claims React Native
- **Issue:** States React Native (Expo) as the decided technology. Conversation decided Capacitor v1 with React Native rewrite post-launch.
- **Staleness:** Decision has been superseded.

### 4.4 KASSE_PAYROLL_BILLPAY.md — Describes features as if planned for near-term
- **Issue:** Describes full native payroll, Kasse Banking (BaaS via Column Bank), Kasse Business Debit Card (Marqeta), and Bill Pay as if they're in the build plan. These are v2+ or v3+ features at best. Some (Wise API disbursement) contradict the payroll-external decision.
- **Staleness:** Doc is aspirational/visionary but positioned as a build spec. Needs v2/v3 labeling throughout.

### 4.5 KASSE_MASTER_BUILDPLAN.md — Phase numbering conflicts with REAL_BUILD_ORDER
- **Issue:** Uses a 12-phase system (Phase 0-12) while `build-order/KASSE_REAL_BUILD_ORDER.md` uses 79 phases. Both claim to be the canonical sequencing.
- **Staleness:** REAL_BUILD_ORDER is newer and more granular. MASTER_BUILDPLAN should be archived or marked as superseded.

### 4.6 KASSE_MARKETING_SITE.md — References old tier names and pricing
- **Issue:** Marketing copy references "Starter," "Growth," "Pro" tier names and old pricing. These no longer match the shipped tier structure.
- **Staleness:** Marketing copy needs rewrite to match new tiers.

### 4.7 docs/strategic-decisions.md — Stray file, not integrated
- **Issue:** This lowercase file contains SD-010 (dual-iPad architecture) but is separate from `KASSE_STRATEGIC_DECISIONS.md`. It's not referenced from any other doc or build phase.
- **Staleness:** Not stale per se, but orphaned. Should be merged into the main strategic decisions doc as SD-K-016+.

---

## Summary of Severity Counts

| Severity | Count |
|----------|-------|
| BLOCKING | 4 |
| IMPORTANT | 11 |
| MINOR | 5 |

**BLOCKING items** (must resolve before any doc can be trusted as spec):
1. Pricing tier structure (entire TIERS doc is wrong)
2. Mobile technology choice (Capacitor v1, not React Native)
3. Backend architecture framing (SD-K-001 is misleading)
4. Payroll/HCM scope (SD-K-007 needs nuance for v1 HCM foundations)
