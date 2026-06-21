# KASSE BUILD-STATE AUDIT — June 2026

> Evidence-based inventory of what is built, half-built, missing, and broken.
> Audited against the live database (Supabase nknuonxznhshrgfseeqc), the GitHub main route tree, the Supabase security/performance advisors, and representative page source — not from memory.
> Owner: Robert Reyna. Companion to docs/build-order/KASSE_REAL_BUILD_ORDER.md.

## ONE-SENTENCE FINDING
The database is ~90% built (94 tables covering the entire POS / booking / payroll / inventory domain), most portal pages exist as routes, but almost none of it is wired to live data or to Reyna Pay — and what is built uses the stale pre-onboarding palette. Kasse is behind on WIRING and PAYMENT INTEGRATION, not schema.

## EVIDENCE BASE
- Live DB: 94 tables. Row counts: Organization 1, User 2, Location 1, Service 11, Client 1, AuditLog 74, OnboardingSession 1 — everything else 0 rows.
- Unused-index signal (decisive): indexes on Appointment, Cart, Order, Payment, Refund, Compensation, TipDistribution, StylistSchedule, Product, Inventory*, ColorFormula all "never used" → those tables have never been written to in production. Schema exists; the code paths that populate it do not.
- Route tree (app/): admin, agreements, api, dashboard, forgot-password, login, onboarding, privacy, reset-password, status, terms.
- Dashboard surfaces (app/dashboard/): appointments, clients, services, staff, pos, reports, marketing, messages, waitlist, reputation, ai-receptionist, settings, admin.
- Representative read: app/dashboard/pos/page.tsx — functional cart UI, POSTs to /api/transactions (records a row), does NOT call Reyna Pay, hardcodes 8.25% tax, stale #606E74 palette.

## DONE AND SOLID
- Onboarding Steps 1-5 + completion. Real, end-to-end, canonical warm design system. Merged through PR #138. Signup → verify → wizard (vertical picker, legal/DBA, Google Places address, interactive/skippable services, team invite, agreements, compensation) → completion → dashboard.
- Data model / schema. Comprehensive: appointments + booking-collision (Appointment, StylistSchedule, StylistScheduleException, Chair, RecurringSeries, BookingWindow, CancellationPolicy), commerce (Cart, CartItem, Order, OrderItem, Payment, Refund, Transaction), payroll/comp (Compensation, TipSplit, TipDistribution, PerformanceStat, EmploymentAgreement), inventory (Product, ProductVariant, InventoryLevel, InventoryDeduction, InventoryReorderDraft), loyalty, gift cards, memberships, waitlist, campaigns, forms, color formulas, devices/pairing, custom fields, tags, feature flags.
- Auth + RLS + tenant scoping + audit. Hardened this session.

## HALF-BUILT (pages exist, wiring thin/stale)
- POS (/dashboard/pos): functional cart UI but (1) does NOT process cards — Charge POSTs to /api/transactions, no Payroc Hosted Fields; (2) hardcoded TAX_RATE 0.0825 instead of TaxRate table; (3) no tip split / commission / appointment linkage; (4) stale #606E74 palette.
- The other 12 dashboard pages exist as routes; given the POS sample + unused-index signal, presumed thin reads or stubs on the stale palette. Each needs individual verification before its build.

## MISSING ENTIRELY
- Reyna Pay integration in POS/checkout. Engine live; no page calls it. [GATED: REYNA_PAY] gate now OPEN.
- Public booking page (/book/[slug]). No route exists.
- Stylist/employee onboarding (invited-staff accept → agreement-sign → account setup). Backend bones exist (StaffInvitation, AgreementSignToken, top-level app/agreements route); no stylist-facing UI.
- Calendar grid wired to Appointment + StylistSchedule + collision detection.
- Payroll/commission run + advanced analytics. Tables exist; zero application layer.

## ISSUES TO FIX
1. SECURITY: RLS disabled on TermsVersion, TermsAcceptance — exposed to anon key. Needs RLS + policies (not blind enable). _prisma_migrations also RLS-off (lower risk).
2. DESIGN DEBT: stale #606E74 palette across all pre-onboarding pages. Canonical is warm #2F5061 / blush #E57F84 (globals.css + KASSE_DESIGN_SYSTEM.md). Migrate per page as wired.
3. PERF: ~90 unindexed foreign keys + VerificationToken has no primary key. Cheap batch migration later.
4. CORRECTNESS: POS tax hardcoded instead of TaxRate table.
5. TRACKED carryover: RLS_AUDIT.md entries for onboarding routes; optional withTenantScope migration for identity-scoped onboarding reads; dashboard aggregation reads run unscoped (fail-closed $0, not a leak); login form hardcodes /dashboard ignoring callbackUrl; AddressAutocomplete useRef hardening + ZIP-clear; ORG_BOOTSTRAPPED→ORG_UPDATED audit rename; dead res.ok branch in compensation-form.

## SEQUENCING (Salon-Envy-first, hair-salon vertical only)
1. Finish onboarding — Steps 1-5 done; remaining gap is stylist/employee onboarding.
2. Calendar + Appointments — wire Appointment + StylistSchedule + collision detection.
3. POS → Reyna Pay — real Payroc Hosted Fields card capture (engine live, terminal arriving). Read Payroc docs first.
4. Public booking (/book/[slug]) — embed into salonenvyusa.com.
5. Services + Staff management — wire existing pages, migrate palette.
6. Payroll/commission + advanced analytics — built last, highest blast radius.

Principle (locked): money paths (card processing, commission, booking collisions) built carefully with read-first + reviewer + smoke-test, never build-blind-fix-later. UI-only surfaces move fast.

*Audit v1.0 — June 2026. Living document.*
