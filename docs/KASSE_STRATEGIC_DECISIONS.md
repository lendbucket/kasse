# KASSE STRATEGIC DECISIONS
## Locked Decisions — Do Not Revisit Without CEO Sign-Off

**Version:** 2.0 | **Owner:** Robert Reyna
**Last Updated:** 2026-05-17

---

## VERSIONING

Decisions are append-only. When a decision is overturned, the original entry remains
with a `[SUPERSEDED by SD-K-NNN]` tag pointing to the new decision. Future readers
can trace the architectural evolution by reading the doc in order.

---

## SD-K-001: Kasse is a thin client. Zero backend. [SUPERSEDED by SD-K-017]
**Decision:** Kasse has no server-side data storage. All data persists through Reyna Pay engine API calls at `/api/v1/*`. Local device storage for offline cache only.

**Rationale:** Keeps Kasse re-deployable by resellers in hours. Engine is source of truth. No sync problems. Resellers deploy by pointing at the engine — no backend setup.

**Implication:** All Kasse API routes are proxies to the engine. No Kasse-specific payment logic.

---

## SD-K-002: Payroc is the only payment processor. No exceptions.
**Decision:** Consistent with engine SD-001. "SalonTransact" branding in all payment flows. "Powered by Reyna Pay" in footer of every receipt and checkout screen. Non-removable.

**Rationale:** Single MID, single compliance surface, single margin stack. Adding a second processor fragments everything.

---

## SD-K-003: Business-type-aware onboarding from day one.
**Decision:** Kasse configures itself based on business type selected at onboarding. One codebase, vertical-specific feature flags and UI configuration. No separate products for each vertical.

**Rationale:** Faster time-to-market for each vertical. Shared infrastructure. Cross-vertical data moat.

---

## SD-K-004: AI receptionist is built in-house on Twilio + OpenAI Realtime API.
**Decision:** Not a third-party vendor. Built on Twilio (phone) + OpenAI GPT-4o Realtime (voice AI). We own the model, training data, and improvement curve.

**Rationale:** Zenoti's AI receptionist is proprietary and salon-specific. Ours works across all verticals from day one. Data from 1M calls is a proprietary asset.

---

## SD-K-005: Agent-native API design from day one.
**Decision:** Every endpoint designed to be consumed by AI agents without human documentation. Semantic names, HATEOAS links, OpenAPI 3.1, consistent errors, idempotency everywhere.

**Rationale:** "We must build platforms designed for agents to buy from, not humans." By the time competitors figure this out, we'll have years of agent-compatible design done.

---

## SD-K-006: Theme system ships before first reseller goes live.
**Decision:** White-label theme system (`lib/theme/theme.config.ts`) is complete before any reseller deploys. Re-theming must take less than 4 hours of engineering.

**Rationale:** Resellers need to move fast. A broken or slow re-theming process kills the wholesale business before it starts.

**Status update (2026-05-17):** Theme system shipped in P0.B (PRs #65-68). SD-K-006 complete.

---

## SD-K-007: Payroll is NOT built natively in Kasse. [SUPERSEDED by SD-K-019]
**Decision:** Kasse calculates commission, generates payroll exports, and integrates with Gusto/Check/ADP. Actual payroll processing (direct deposit, tax withholding, W-2 generation) is external.

**Rationale:** Payroll compliance liability across 50 states is enormous. SalonBacked handles this layer. Kasse feeds it data.

---

## SD-K-008: HIPAA-adjacent data is encrypted at rest.
**Decision:** Formula history, medical notes (med spa), sensitive client data — encrypted using AES-256 at the database column level. Med spa vertical requires full HIPAA review before GA launch.

**Rationale:** Stylists and clients trust us with sensitive information. A breach destroys the brand.

---

## SD-K-009: Offline mode is non-negotiable for iPad POS.
**Decision:** Kasse iPad must be able to take a card-present payment without internet. Offline cache, queued sync, Payroc terminal local approval — all required before Phase 2 ships.

**Rationale:** Salons have flaky internet. If Kasse can't take a payment when WiFi goes down, we lose the account immediately.

---

## SD-K-010: "Powered by Reyna Pay" footer is permanent.
**Decision:** Cannot be white-labeled away. Appears on all receipts, checkout screens, and payment-related UI regardless of reseller brand.

**Rationale:** The Payroc relationship, MID, and compliance liability all sit with Reyna Pay LLC. The footer reflects legal reality.

---

## SD-K-011: Franchise fees are auto-collected through SalonTransact. [AMENDED by SD-K-024]
**Decision:** Royalties, technology fees, and marketing fund fees are calculated daily and auto-deducted from franchise location payouts via SalonTransact. Manual invoicing is not the primary path.

**Rationale:** Manual collection breaks down at scale. Auto-collection via the payment rails we already own is the correct architecture.

---

## SD-K-012: Stylist Marketplace — Kasse-only listings.
**Decision:** Only stylists whose salon is on Kasse can list on the marketplace. No open marketplace.

**Rationale:** This creates the flywheel. "I want to be on the marketplace" → salon must get on Kasse. This drives subscriber growth more effectively than any sales motion.

---

## SD-K-013: React Native for native apps, not Flutter or Swift. [SUPERSEDED by SD-K-018]
**Decision:** Kasse iPad and iPhone apps are built in React Native (Expo). One codebase, shared with merchant portal component patterns.

**Rationale:** Shared component library with the web portal. One team owns all surfaces. White-label theming works across native and web with the same system.

---

## SD-K-014: Kasse Capital uses revenue-based repayment only.
**Decision:** No fixed monthly payments. Repayment is a fixed % of daily revenue deducted automatically via SalonTransact until advance is repaid.

**Rationale:** Revenue-based repayment aligns our interests with the salon's success. We only get paid when they get paid. This also eliminates most underwriting complexity.

---

## SD-K-015: SalonBacked is a separate product with deep Kasse integration.
**Decision:** SalonBacked (HCM layer) is its own brand and subscription but deeply integrated with Kasse data. Kasse sends revenue, commission, and hours data to SalonBacked. SalonBacked sends payroll, insurance status, and compliance data back to Kasse.

**Rationale:** Bundling creates stickiness. Separate product means separate revenue line and separate exit opportunity.

---

## SD-K-016: Dual-iPad POS architecture (stylist + customer + Payroc terminal).
**Decision:** Three devices participate in checkout: (1) Stylist iPad runs Kasse Appointments + POS and owns the cart, (2) Customer iPad shows itemized cart in real-time and collects tip/signature/receipt destination, (3) Payroc PAX A920 Pro (or similar) handles card read only — no tip prompts, no itemization, no receipt printing from the terminal.

**Communication pattern:** Server-mediated via Supabase Realtime channels keyed by `locationId + activeCartId`. Both iPads subscribe; server is source of truth. Matches Toast and Square Customer Display.

**Payroc mode:** Semi-Integrated or Cloud Terminal. Server POSTs intent to terminal, terminal returns transaction ID, server pairs with cart and finalizes.

**Rationale:** Industry-standard pattern. Reduces PCI scope (we never touch card data; Payroc does). Allows tip flexibility (UI-controlled, not terminal-controlled). Supports stylist-to-cart-to-display mappings that aren't one-to-one.

**Schema implications (P0.G):** `Device` model (StylistDevice / CustomerDisplay / ManagerDevice / StandalonePOS roles + Payroc terminalId), `Cart` model (in-progress shopping cart with realtime channel ID, distinct from `Order`/`Payment` finalized transactions), `Settings → Devices` admin UI.

**Origin:** Migrated 2026-05-17 from stray `docs/strategic-decisions.md` SD-010. That file is being deleted; this SD-K-016 is canonical.

---

## SD-K-017: Kasse owns its non-payment domain backend. [Supersedes SD-K-001]
**Decision:** Kasse is a thin client **for payment operations only**. All payment data persists through Reyna Pay engine API. Non-payment domain data — appointments, clients, staff, services, inventory, formulas, schedules, marketing, audit logs, permissions, plan tiers, theme overrides, vertical configs — is stored in Kasse's own Supabase PostgreSQL database with row-level security.

**Rationale:** SD-K-001 was written before the architecture solidified. In practice, Kasse needs its own data layer for everything that isn't a payment transaction. The engine boundary applies to charges/refunds/payouts/customers-for-payment; everything else is Kasse's domain.

**Implication:** Reseller deployment is still fast (one Vercel project, one Supabase project, theme config). Engine integration handles only payment operations. KASSE_ENGINE_BOUNDARY.md already aligns with this scoping.

**Date:** 2026-05-17.

---

## SD-K-018: Capacitor for v1, React Native for v2. [Supersedes SD-K-013]
**Decision:** v1 launches with Capacitor wrapping the Next.js web portal for iOS and Android. React Native rewrite begins immediately after v1 ships and is the v2 native experience.

**Rationale:** Capacitor lets the web codebase ship as native faster than building a parallel React Native app. v1 timeline matters more than v1 native performance. React Native gives better native UX and is the long-term answer.

**Implication:** v1 mobile = Capacitor (~3-4 month native delivery). v2 = React Native rewrite (parallel work after launch). Theme system, permission engine, vertical configs all work across both because they live in shared TypeScript modules.

**Date:** 2026-05-17.

---

## SD-K-019: HCM foundations in v1, full payroll processing in v2. [Amends SD-K-007]
**Decision:** Kasse v1 ships HCM **foundations**: W-4 collection, I-9 collection, direct deposit account setup, license verification (TDLR + state equivalents), background check (Checkr), time clock with geolocation, PTO/sick request workflow, employment agreement templates + custom upload, e-signature (canvas + audit log). 1099/W-2 PDF generation in v1.

**Kasse v1 does NOT include:** Direct deposit disbursement, tax withholding calculation, quarterly tax filing, e-filing 1099/W-2 with IRS, in-Kasse TurboTax-style filing.

**Kasse v2 adds:** Full payroll processing (Wise or equivalent disbursement, withholding, quarterly filing, e-filing).

**Rationale:** SD-K-007 was a binary in/out call. Reality is a spectrum. Document collection and time clock are essential to onboard a salon's team — they can't be deferred. Payroll *processing* (the part with 50-state tax compliance liability) is correctly deferred to v2.

**Date:** 2026-05-17.

---

## SD-K-020: Pricing is per-location, Square-aligned, 4-tier.
**Decision:** Plan tiers are FREE / PLUS / PREMIUM / ENTERPRISE. Pricing is **per-location** (PLUS $29/loc, PREMIUM $69/loc, ENTERPRISE custom). Aligned with Square's salon pricing. Addons available on top of base tier via `Organization.enabledAddons` field.

**Rationale:** Salon owners know Square pricing. Per-location is the model they recognize. The legacy 5-tier per-merchant model in old KASSE_TIERS.md never shipped and is being rewritten to match this decision.

**Shipped:** PR #70 (`lib/plans/limits.ts`, `lib/plans/types.ts`, `Organization.planTier`, `Organization.enabledAddons`). PR #72 enforces hard-block on location limit with 402 PAYMENT_REQUIRED structured response.

**Date:** 2026-05-17.

---

## SD-K-021: 50-state employment compliance v1.
**Decision:** Kasse v1 supports employment compliance across all 50 US states. Priority order for state-by-state rule implementation: TX, CA, FL, NY, IL (cover ~50% of US salon market first). Remaining 45 states ship as v1.x add-on releases before v2 launch — same final v1 scope, sequenced rollout.

**Implication:** Per-state rule engine for: minimum wage, overtime triggers, break requirements (CA meal/rest break enforcement), sick leave accruals, tip credit rules, final paycheck timing, classification (W-2 vs 1099 vs booth rental). State-aware W-4 forms. State-specific new hire reporting.

**Rationale:** "Launching in only one state makes no sense" (CEO directive). Per-state architecture is foundation work; per-state content fill is rollout work.

**Date:** 2026-05-17.

---

## SD-K-022: Single-region infrastructure, nationwide availability.
**Decision:** v1 runs on a single AWS/Vercel region (us-east-2) but is available to merchants nationwide. Multi-region data residency is v2.

**Rationale:** Single-region simplifies operations, compliance, and engineering. Latency to California from us-east-2 is ~65ms — acceptable for v1. True data-residency multi-region adds 2-3x infra cost and 2x engineering complexity. v2 problem.

**SLA:** 99.9% uptime baseline. 99.95% for ENTERPRISE tier.

**Date:** 2026-05-17.

---

## SD-K-023: Pass-through PCI compliance v1, Managed PCI Level 1 v2.
**Decision:** Kasse v1 operates with pass-through PCI compliance — Payroc Hosted Fields handles all cardholder data, Kasse never touches it, merchant SAQ-A is their responsibility (with Kasse-provided documentation showing reduced scope). Managed PCI compliance (Kasse owns the merchant's quarterly ASV scans, SAQ filing, PCI breach insurance) is v2 after Kasse achieves PCI DSS Level 1 certification.

**Rationale:** PCI Level 1 certification is a $50-150k/year + 6-9 month project. Pass-through is correct v1 architecture and is how 95% of payment SaaS companies operate. Managed PCI is a premium v2 addon for ENTERPRISE.

**Date:** 2026-05-17.

---

## SD-K-024: Franchise royalty collection — owner's choice. [Amends SD-K-011]
**Decision:** Franchise royalties, technology fees, and marketing fund fees can be collected via three models — the franchise owner picks which:
- **Auto-deduct via SalonTransact** (the default and SD-K-011 mechanism)
- **Periodic reconciliation** (calculated weekly/monthly, ACH transferred franchisee → franchisor)
- **Manual invoicing** (system generates invoice, franchisee pays)

**Rationale:** SD-K-011 was right that auto-deduct is the cleanest path, but franchise owners want flexibility based on their existing contracts and accounting practices. Kasse supports all three; the franchisor picks per franchise system.

**Date:** 2026-05-17.

---

## SD-K-025: Booth rental classification v1, sub-merchant v2.
**Decision:** v1 supports booth rental as an HCM classification only — salons can mark a stylist as a booth renter, track rent owed, track lease terms, track hours at the salon. Booth renters in v1 do NOT process payments through Kasse — they bring their own POS (Square, Toast, etc.). v2 adds true sub-merchant boarding via Payroc hierarchical contract: each booth renter onboards their own MID via Kasse and processes through Kasse.

**Rationale:** v1 sub-merchant boarding requires Payroc hierarchical contract amendment (4-8 weeks) plus per-renter KYC complexity plus 1099-K tax routing decisions. None of that is solved enough for v1. Classification-only is correct v1 scope.

**Date:** 2026-05-17.

---

## SD-K-026: AI agent scope and guardrails.
**Decision:** Kasse v1 includes four classes of AI agents, each with specific scope:

1. **Help Center AI** — answers merchant questions, takes action on merchant's own data (read merchant data, modify their own settings) with full audit log. Refund authority: ≤ $50 autonomous (with audit), > $50 propose-then-confirm with human always finalizing. Cannot modify other merchants' data. Cannot deploy code or run migrations.

2. **Command Center AI** (CEO-side) — read/modify merchant data + platform config + announcements + suspensions, fully audit-logged. Cannot modify code or run deploys in v1 (v2 only).

3. **Booking AI** (customer-facing) — conversational booking on client booking websites and Kasse. Upsell suggestions. Schedule changes within merchant policies.

4. **Voice AI Receptionist** — Twilio + OpenAI Realtime, handles inbound calls, books/reschedules/cancels via natural language.

**Bug detection AI:**
- **Reactive v1** — user reports a bug, AI agent inspects logs/errors via Sentry MCP, diagnoses, surfaces suggested fix to engineering.
- **Proactive v2** — continuous monitoring of error rates with threshold-based alerts.

**Content tone (universal):** Human tone, no AI tone, no dashes (—), no bullet-heavy responses unless asked. All AI-generated content (marketing emails, review responses, social posts) must sound like the salon owner.

**Date:** 2026-05-17.

---

## SD-K-027: Salon Centric partnership for inventory reorder.
**Decision:** Kasse v1 includes a partnership with Salon Centric (or equivalent distributor) for inventory reordering. When inventory falls below threshold, Kasse generates a PDF reorder list. Owner reviews and approves the PDF, then submits to Salon Centric via the partnership. Auto-deduction of products from inventory is opt-in per salon.

**Rationale:** Full auto-reorder (API integration with distributor) is real work and depends on partnership terms. PDF-with-owner-approval is shipped in v1 as the safe default while we negotiate full API integration for v2.

**Date:** 2026-05-17.

---

## SD-K-028: Cart starts at appointment creation, walk-ins auto-create shells.
**Decision:** A Cart is created when an Appointment is created (whether by customer booking online or by stylist creating a walk-in on POS). Walk-ins always auto-create a shell Appointment so the cart has an anchor. Device assignment is per-chair (each chair has a designated customer-display iPad). Owner can checkout from anywhere using Payroc Hosted Fields (bypassing the iPad pairing).

**Rationale:** Cart-at-appointment-creation unifies the data model — appointments and carts are 1:1, no orphan carts. Per-chair device assignment matches physical salon layout. Owner-checkout-from-anywhere covers off-site, remote, or backup scenarios.

**Date:** 2026-05-17.

---

## SD-K-029: SMS/email card-capture portal for phone bookings.
**Decision:** When a salon books a client by phone, the receptionist sends an SMS or email link to a secure card-capture portal. The client enters their card via Payroc Hosted Fields. Card is held for no-show protection per the salon's cancellation policy. Eliminates "take your card number over the phone" (PCI risk) and supports phone-booking no-show fee enforcement.

**Rationale:** Salon owner / CEO original idea. No competitor has this pattern. Differentiator for v1.

**Date:** 2026-05-17.

---

## SD-K-030: Geolocation enforcement for time clock.
**Decision:** Staff time clock supports two modes:
- **iPad in-salon clock-in** — geolocation-tagged with 100ft radius around the location
- **Geofenced mobile clock-in** — Capacitor app verifies device location is within 100ft radius

**Enforcement:** Soft warn on out-of-geofence clock-in (manager override available), full audit log of every clock event with coordinates + IP + device. Jailbreak detection: refuse clock-in from rooted/jailbroken device. IP triangulation: cross-check device GPS against IP-derived location to catch GPS spoofing.

**Hourly tracking during service:** While stylist is performing a service, the app verifies they remain within the geofence.

**Rationale:** Time clock fraud is a real loss for salons. Soft enforcement preserves UX for legitimate edge cases (delivery driver in parking lot, off-site service); audit log captures everything for dispute resolution.

**Date:** 2026-05-17.

---

## SD-K-031: Per-org client ownership.
**Decision:** Clients belong to the Organization, not to individual locations. Clients are visible across all locations within the same org but never visible across organizations. Marketing consent is a single boolean (opt-in/out for all marketing). Structured allergy fields + free-text preferences. Structured formula history with dates/timestamps.

**Rationale:** Privacy-first. Cross-org client visibility would require opt-in linking per OQ-008. v1 doesn't ship that; clients are siloed by org. Within an org, all locations share clients so a multi-location chain functions as one business.

**Date:** 2026-05-17.

---

## SD-K-032: Spanish customer-facing surfaces v1.
**Decision:** v1 ships Spanish translations for all customer-facing surfaces (booking page, kiosk, SMS confirmations, email receipts, customer card-capture portal). Admin portal (merchant-facing) is English-only in v1. Full multi-language admin + multi-currency + GDPR internationalization is v3.

**Rationale:** Texas-first market with significant Spanish-speaking client population. Customer-facing Spanish is essential for v1 launch. Admin Spanish is a v2/v3 expansion to capture Spanish-speaking salon owners.

**Date:** 2026-05-17.

---

## SD-K-033: WCAG 2.1 AA from v1.
**Decision:** All Kasse v1 surfaces meet WCAG 2.1 AA. Color contrast 4.5:1 minimum. Keyboard navigation. Screen reader support. 44px minimum touch targets. Focus indicators. ARIA labels on all interactive elements.

**Rationale:** Building accessibility in from day one is cheaper than retrofitting. Required for some enterprise sales. Legally protective.

**Date:** 2026-05-17.

---

## SD-K-034: Scale targets — 20k merchants v1, 100k long-term.
**Decision:** v1 architecture supports 20,000 merchants without major refactor. Long-term target is 100,000 merchants over the next 3-5 years. Database scaling strategy (read replicas, sharding, archival cold storage) lands progressively as merchant count grows.

**Rationale:** Building for 100k from day one over-engineers v1. Building for 1k under-architects and forces a painful migration at 5k. 20k is the right v1 ceiling — Supabase pooled connections, proper indexing on all `organizationId` columns, and RLS scale to ~20k without architectural changes.

**Date:** 2026-05-17.

---

## SD-K-035: Loyalty and referral programs are custom per salon.
**Decision:** Kasse v1 supports loyalty programs configured per salon (points/stamps/visits — the salon owner picks rules). Referral programs are also custom per salon and can extend to sub-merchants (booth renters who use their own POS can still participate in the salon's referral program by being tracked in Kasse's Client database).

**Rationale:** Loyalty rules vary wildly across salons. A rigid template would be wrong for most. Configurable per salon is the only correct answer for v1.

**Date:** 2026-05-17.

---

## SD-K-036: Marketing automation v1 — full lifecycle.
**Decision:** Kasse v1 includes:
- Drip campaigns (multi-step email/SMS sequences)
- Abandoned booking recovery (customer started booking, didn't finish — auto-followup)
- Win-back sequences (no visit in X days)
- Birthday automation
- Anniversary automation (first-visit anniversary)
- AI content generation for all of the above (human tone, no AI tone, no dashes)

**Rationale:** Marketing automation is core to salon retention. Conversation answer was "all in v1." Pricing tier addon question is resolved in PR 2 (KASSE_TIERS.md rewrite).

**Date:** 2026-05-17.

---

## SD-K-037: Reviews — smart filter + Google Business Profile v1.
**Decision:** Smart review filter in v1: only 4+ star reviews are surfaced publicly; 1-3 star reviews are internal-only feedback. Google Business Profile integration in v1 for review monitoring and response. Yelp / Facebook / Booking.com review integrations are v2.

**Rationale:** Smart filter protects salons from random low-rating drive-by reviews while still capturing the negative feedback internally for the owner to address. GBP is the most important review platform for salons.

**Date:** 2026-05-17.

---

## SD-K-038: Tax document generation v1, e-filing v2.
**Decision:** Kasse v1 generates 1099-NEC and W-2 PDFs from collected HCM data — merchant downloads and files manually. v2 adds direct e-filing with IRS. TurboTax-like in-Kasse tax preparation experience is also v2.

**Rationale:** PDF generation is simple. E-filing requires IRS transmitter registration and is a real compliance investment. Foundations in v1, lift to e-filing in v2.

**Date:** 2026-05-17.

---

## SD-K-039: TDPSA + CCPA templates and handling-on-behalf v1.
**Decision:** Texas Data Privacy and Security Act + California Consumer Privacy Act compliance is in v1. Kasse provides:
- Privacy notice templates for merchants
- Right-to-delete request handling (customer asks salon for deletion → Kasse executes)
- Right-to-export request handling (customer asks salon for their data → Kasse generates export)
- Consent management UI

**Rationale:** TDPSA is law in Kasse's home state. CCPA is required for any merchant with California customers. Building both into v1 is non-negotiable.

**Date:** 2026-05-17.

---

## SD-K-040: Multi-location hierarchy — flat, tiered, and brand-mode supported.
**Decision:** Kasse v1 supports three multi-location hierarchy models:
- **Flat** — one Organization owns N Locations with no intermediate grouping
- **Tiered** — Organization → Group (Region/Brand/Concept levels via OrganizationGroup) → Location
- **Brand-mode** — one Organization can host multiple brands (each brand has its own theme, name, branding) sharing back-office and reporting

**Cross-location operations in v1:** clients shared across org locations, gift cards cross-redeemable within org, inventory transfers between locations, staff multi-location with primary-location designation, per-location service catalogs with multi-location toggle, sub-tenants can propose price changes for parent approval. Reports both aggregate and per-location.

**Rationale:** Different salon owners scale differently. Flat for the 2-3 location owner, tiered for the regional chain, brand-mode for the holding company. All three are real. v1 supports all three.

**Date:** 2026-05-17.

---

## REFERENCES

- Contradictions report: `docs/architecture/CONVERSATION_VS_DOCS_CONTRADICTIONS.md` (PR #73)
- Pricing system: `docs/KASSE_TIERS.md` (rewrite pending in PR 2)
- Engine boundary: `docs/KASSE_ENGINE_BOUNDARY.md`
- Build status: P0.A complete (PRs #41-61), P0.B complete (PRs #65-68), P0.C complete (PRs #62-64), P0.D complete (PRs #70-72)
