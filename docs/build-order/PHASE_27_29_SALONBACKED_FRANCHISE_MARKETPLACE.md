# PHASE 27-29 — SALONBACKED + FRANCHISE + MARKETPLACE

**Scope:** SalonBacked Integration (P27, 60 PRs), Franchise Creator (P28, 80 PRs, ATTORNEY-gated), Stylist Marketplace (P29, 40 PRs).
**Total PRs:** 180
**Depends on:** P0-P22 foundation. P19 (Payroll) feeds into P27. P6 (Owner Portal) framework.
**Gates:** P28 FDD template requires attorney review per OQ-012.
**Reference docs:** EMPIRE_ARCHITECTURE.md (Layer 2 SalonBacked), KASSE_VERTICALS_EXPANDED.md (franchise spec), KASSE_PORTAL_ARCHITECTURE.md (marketplace + business partner role).

---

# P27 — SALONBACKED INTEGRATION (60 PRs)

Layer 2 HCM/insurance/tax/payroll/benefits engine. Lives in `lendbucket/salonbacked` repo (separate). Kasse integrates as primary consumer. Per memory: benefits engine (8 verticals), tax engine, Metro 2 credit reporting engine all built. Pending: M2Reporter transmission while direct bureau approval pending. Branch confirmed as earned wage access partner.

## P27.A — SalonBacked Engine Client (10 PRs)

### P27.A.1 — `lib/salonbacked/client.ts`: base fetch wrapper
Files: `lib/salonbacked/client.ts`
Auth via service-to-service Bearer token. Retries 3x with backoff. Request ID propagation. Error mapping.
Acceptance: Health check call succeeds.

### P27.A.2 — `lib/salonbacked/types.ts`: type definitions
Files: `lib/salonbacked/types.ts`
Tax filing, payroll run, benefits enrollment, insurance policy, credit reporting submission types.
Acceptance: All types compile.

### P27.A.3 — `lib/salonbacked/tax.ts`: Tax module client
Files: `lib/salonbacked/tax.ts`
Methods: `createFiling()`, `getFilingStatus()`, `listFilings()`, `getNexusReport()`.
Acceptance: Mock calls succeed in test.

### P27.A.4 — `lib/salonbacked/payroll.ts`: Payroll module client
Methods: `createRun()`, `submitRun()`, `getRunStatus()`, `listRuns()`, `generateW2()`, `generate1099()`.

### P27.A.5 — `lib/salonbacked/benefits.ts`: Benefits client
Methods: `enrollMember()`, `unenrollMember()`, `listEnrollments()`, `getPlanCatalog()`.

### P27.A.6 — `lib/salonbacked/insurance.ts`: Insurance client
Methods: `quotePolicy()`, `bindPolicy()`, `getPolicyStatus()`, `fileClaim()`.

### P27.A.7 — `lib/salonbacked/credit.ts`: Metro 2 credit reporting client
Methods: `reportRentPayment()`, `reportBoothRentPayment()`, `getReportingStatus()`.
Per memory: M2Reporter transmission pending direct bureau approval.

### P27.A.8 — `lib/salonbacked/ewa.ts`: Branch earned wage access client
Methods: `requestEarnedWageAccess()`, `getEligibleAmount()`, `processWithdrawal()`.

### P27.A.9 — ESLint boundary rule extending P0.E.10
Files: `eslint.config.mjs` (extend)
Only `app/api/**` may import `lib/salonbacked/*`. Same pattern as engine.
Acceptance: Component import fails lint.

### P27.A.10 — Webhook signature verification
Files: `app/api/webhooks/salonbacked/route.ts`
HMAC verification for inbound webhooks (filing status updates, policy bindings, EWA processed, etc.).

## P27.B — Tax Engine Integration (10 PRs)

### P27.B.1 — Sales tax filing handoff
Files: `lib/salonbacked/tax-handoff.ts`
P21 SalesTax → SalonBacked filing every month. Auto-generated. Owner reviews + signs.

### P27.B.2 — Per-state filing schedule
Schema: `TaxFiling` with state, period, dueDate, status. Auto-populated from SalonBacked.

### P27.B.3 — Filing UI in dashboard
Files: `app/dashboard/tax/filings/page.tsx`
List filings. Status badges. Drill to detail.

### P27.B.4 — Filing detail page
Files: `app/dashboard/tax/filings/[id]/page.tsx`
Tax collected, deductions, net owed. Sign + submit button.

### P27.B.5 — Nexus tracker integration (P21.B → SalonBacked)
Files: `lib/integrations/salonbacked-nexus.ts`
SalonBacked maintains state-by-state threshold DB. Kasse pulls weekly.

### P27.B.6 — Sales tax remittance via ACH
Triggered on filing submission. Funds pulled from KasseAccount → state DOR.

### P27.B.7 — Tax document storage
Files: S3 bucket, encrypted
All filings + receipts retained 7 years.

### P27.B.8 — Form 1099-K from Payroc → reconciled with SalonBacked
Year-end 1099-K validation.

### P27.B.9 — Tax addon: $19/mo per KASSE_TIERS.md
Plan tier gate.

### P27.B.10 — Tax document export to accountant
Accountant role (P0.A.5) auto-pulls latest filings.

## P27.C — Payroll Engine Integration (15 PRs)

### P27.C.1 — Replace P19 internal payroll with SalonBacked dispatch
Files: `lib/payroll/run.ts` (refactor)
Instead of internal Checkbook.io call, dispatch to SalonBacked. SalonBacked handles withholding, ACH, filings.

### P27.C.2 — W-4 collection flow
Files: `app/dashboard/staff/[id]/w4/page.tsx`
Staff completes W-4 on signup → POST to SalonBacked.

### P27.C.3 — W-9 collection (1099 staff)
Same flow, different form.

### P27.C.4 — Direct deposit setup
Files: `app/dashboard/staff/[id]/direct-deposit/page.tsx`
Staff enters bank info → SalonBacked verifies via Plaid → stored in SalonBacked vault (not Kasse).

### P27.C.5 — Payroll run dispatch
Run payroll → POST to SalonBacked → returns run ID → poll status.

### P27.C.6 — Pay stub generation (from SalonBacked)
PDF retrieved from SalonBacked, cached locally.

### P27.C.7 — Federal + state withholding
Handled by SalonBacked. Kasse shows summary.

### P27.C.8 — Quarterly 941 filings
SalonBacked files. Kasse shows confirmation.

### P27.C.9 — Annual W-2 generation
End of year. Distributed via SalonBacked → also emailed via Kasse.

### P27.C.10 — Annual 1099 generation
Same as W-2.

### P27.C.11 — State unemployment (SUI) filings
SalonBacked handles per state.

### P27.C.12 — Workers comp integration
Premium based on payroll. SalonBacked feeds carrier.

### P27.C.13 — Payroll cost dashboard
Files: `app/dashboard/payroll/costs/page.tsx`
Gross wages, employer taxes, benefits, workers comp = total labor cost.

### P27.C.14 — Payroll addon: $49/mo per KASSE_TIERS.md
Plan gate.

### P27.C.15 — Audit: payroll changes logged to AuditLog + sent to SalonBacked

## P27.D — Benefits Engine Integration (10 PRs)

### P27.D.1 — Benefits enrollment portal entry
Files: `app/dashboard/benefits/page.tsx`
OWNER sees plan offerings. Staff sees their enrollments.

### P27.D.2 — Plan catalog from SalonBacked
8 verticals per memory. Pull catalog, display.

### P27.D.3 — Health insurance offering setup
OWNER selects which plans to offer. Eligibility rules.

### P27.D.4 — Dental + Vision offering
Same flow.

### P27.D.5 — 401(k) offering
SalonBacked partners (Guideline, etc.).

### P27.D.6 — Staff enrollment flow
Files: `app/staff/benefits/enroll/page.tsx`
Staff sees offerings. Enrolls during open enrollment or qualifying event.

### P27.D.7 — Payroll deduction integration
Enrolled staff's deductions feed P27.C payroll runs.

### P27.D.8 — Life event handling (marriage, birth, etc.)
Mid-year enrollment changes.

### P27.D.9 — Benefits summary statement
Annual personalized statement per staff.

### P27.D.10 — Benefits addon: $19/mo per KASSE_TIERS.md

## P27.E — Insurance Engine Integration (10 PRs)

Reyna Insure LLC entity per memory.

### P27.E.1 — Business insurance quote flow
Files: `app/dashboard/insurance/quote/page.tsx`
Org profile pre-fills quote form. SalonBacked returns multi-carrier quote.

### P27.E.2 — Liability insurance for stylists
Per-stylist coverage. Required for chair-rent in many states.

### P27.E.3 — Property insurance
Equipment, inventory.

### P27.E.4 — Cyber liability
Increasingly critical post-PCI/HIPAA.

### P27.E.5 — Bind policy flow
E-sign. ACH first premium. Policy doc S3-stored.

### P27.E.6 — Claims filing
Files: `app/dashboard/insurance/claims/new/page.tsx`
Submit claim. Photos. Description. Tracked via SalonBacked.

### P27.E.7 — Policy renewal automation
60-day pre-renewal alert. Auto-renew option.

### P27.E.8 — Certificate of insurance (COI) generation
Owner downloads + shares with landlords/clients.

### P27.E.9 — Insurance addon: $29/mo
Plan gate.

### P27.E.10 — Per-stylist liability addon: $9/mo per stylist

## P27.F — Credit Reporting + Earned Wage Access (5 PRs)

### P27.F.1 — Booth rent payments → Metro 2 reporting
Files: `lib/integrations/credit-reporting.ts`
Each rent payment auto-reported via M2Reporter (per memory, transmission pending direct bureau approval).

### P27.F.2 — Tradeline establishment for stylists
Stylist sees their credit-building benefit.

### P27.F.3 — Branch earned wage access integration
Files: `app/staff/earnings/ewa/page.tsx`
Staff requests advance up to earned amount. SalonBacked processes via Branch.

### P27.F.4 — Branch in-app
Embedded Branch SDK or deep link to Branch app.

### P27.F.5 — Credit reporting opt-in/opt-out
Staff consent required. Default opt-in for owner-employee, opt-in-required for contractors.

---

# P28 — FRANCHISE CREATOR (80 PRs) `[GATED: ATTORNEY for FDD]`

Per OQ-012 (FDD template legal). Phase scope gated on franchise attorney review of FDD template + state registration approach.

## P28.A — Schema + Hierarchy (10 PRs)

### P28.A.1 — Schema: FranchiseSystem
```prisma
model FranchiseSystem {
  id              String   @id @default(cuid())
  organizationId  String   @unique  // franchisor org
  name            String
  fddVersion      Int
  fddUrl          String?
  royaltyPct      Decimal  @db.Decimal(5,2)
  marketingFundPct Decimal @db.Decimal(5,2)
  techFeePct      Decimal? @db.Decimal(5,2)
  initialFee      Int      // cents
  renewalFee      Int
  transferFee     Int
  territoryMode   String   // EXCLUSIVE | NON_EXCLUSIVE
  createdAt       DateTime @default(now())
}
```

### P28.A.2 — Schema: FranchiseTerritory
Geographic exclusivity rules.

### P28.A.3 — Schema: FranchiseUnit
Each franchisee = FranchiseUnit. Linked to one Organization.

### P28.A.4 — Schema: RoyaltyInvoice
Generated automatically from franchisee GPV.

### P28.A.5 — Schema: MarketingFundInvoice
Same pattern.

### P28.A.6 — Schema: BrandStandard
Required practices per franchise.

### P28.A.7 — Schema: BrandStandardAudit
Audit results from compliance checks.

### P28.A.8 — Migration: add franchise hierarchy to Organization
`Organization.franchiseUnitId` foreign key.

### P28.A.9 — Migration: backfill (existing orgs are independent)
All existing orgs flagged independent.

### P28.A.10 — Indexes for franchise queries

## P28.B — Franchisor Portal (15 PRs)

### P28.B.1 — Franchisor dashboard
Files: `app/dashboard/franchise/page.tsx`
Network overview: units, network GPV, network royalty, brand health score.

### P28.B.2 — Unit list page
Files: `app/dashboard/franchise/units/page.tsx`
All franchisee units. Filter, search.

### P28.B.3 — Unit detail page
Per-unit: GPV, royalty due, compliance status, owner contact.

### P28.B.4 — Unit performance comparison
Top/bottom performers. Distribution charts.

### P28.B.5 — Brand standards editor
Files: `app/dashboard/franchise/standards/page.tsx`
Editable checklist. Categories: cleanliness, service, branding, pricing, etc.

### P28.B.6 — Brand standards audit scheduler
Quarterly audits per unit.

### P28.B.7 — Field audit form (mobile)
Files: `app/staff/franchise-audit/page.tsx`
Auditor visits unit. Photos. Score per item. Submit.

### P28.B.8 — Audit results review
Franchisor sees scores. Unit owner sees own scores.

### P28.B.9 — Remediation workflow
Failing items → action required → re-audit.

### P28.B.10 — Network-wide marketing campaigns
Franchisor pushes campaign to all units.

### P28.B.11 — Network-wide promotions
"All units: 20% off this week."

### P28.B.12 — Supply ordering (centralized purchasing)
Franchisor negotiates vendor deals. Units order through Kasse Connect (P74).

### P28.B.13 — Communication broadcast
Network-wide announcements.

### P28.B.14 — Franchisor financial overview
Royalties YTD, projected, by region.

### P28.B.15 — Unit performance leaderboards
Public to network (motivational).

## P28.C — Franchisee Onboarding (15 PRs)

### P28.C.1 — Franchisee application flow
Files: `app/(public)/franchise/apply/[systemSlug]/page.tsx`
Public application form. Background, finances, market interest.

### P28.C.2 — Application review (franchisor)
Approve / deny / request more info.

### P28.C.3 — FDD delivery (electronic)
Per FTC rule: 14-day cooling-off period after FDD delivered. Tracked + timestamped.

### P28.C.4 — FDD acknowledgment
Franchisee signs acknowledgment of FDD receipt.

### P28.C.5 — Franchise Agreement signing
E-sign multi-page agreement. Each section initialed.

### P28.C.6 — Initial fee payment
Wire or ACH. Held in escrow until store opens (per state law).

### P28.C.7 — Territory assignment
Map-based selection. Conflict check against existing territories.

### P28.C.8 — Franchise unit Organization auto-creation
On agreement signed, create new Organization with franchiseUnitId set.

### P28.C.9 — Branded portal setup
Auto-applies franchisor's brand theme (P0.B).

### P28.C.10 — Standard service catalog
Pre-populated from franchisor template.

### P28.C.11 — Standard pricing
Min/max ranges set by franchisor.

### P28.C.12 — Standard staff classifications
Inherited from system.

### P28.C.13 — Onboarding training tracker
Franchisee + key staff complete training modules. Track completion.

### P28.C.14 — Pre-opening checklist
Insurance, permits, licenses, signage, etc.

### P28.C.15 — Grand opening kit
Marketing assets, social media, launch promotions.

## P28.D — Royalty Engine (15 PRs)

### P28.D.1 — Royalty calculation
Weekly cron. Each unit's gross sales × royaltyPct = royalty owed.

### P28.D.2 — Marketing fund calculation
Separate from royalty. % of gross sales.

### P28.D.3 — Tech fee (optional)
Some systems charge tech fee on top of royalty.

### P28.D.4 — Auto-deduction from settlements
Per memory SD-K-016: royalty auto-deducted from Reyna Pay settlement before deposit to franchisee bank.

### P28.D.5 — Royalty invoice generation
Weekly invoice. PDF + line items.

### P28.D.6 — Royalty payment workflow
Direct ACH from franchisee → franchisor org bank.

### P28.D.7 — Underpayment detection
Flag if reported sales drop unexpectedly. Audit trigger.

### P28.D.8 — Royalty waiver workflow
Franchisor can waive royalty for promotion period.

### P28.D.9 — Late royalty fees
1.5% monthly compound (configurable per state law).

### P28.D.10 — Royalty dispute workflow
Franchisee challenges → escalation.

### P28.D.11 — Royalty financial reports
Per unit, per region, per period.

### P28.D.12 — Marketing fund reporting (separate ledger per state laws)
### P28.D.13 — Marketing fund expense tracking
What franchisor spends from fund. Required disclosure.

### P28.D.14 — Marketing fund annual audit
Annual audit per FTC rules.

### P28.D.15 — Royalty addon revenue: $199/mo base + $29/unit per KASSE_TIERS.md

## P28.E — Franchisee Portal (10 PRs)

### P28.E.1 — Franchisee dashboard
Standard Owner Portal + Franchise tab. Franchise tab shows: royalties due, brand audit status, network messages.

### P28.E.2 — Royalties due widget
Current period accrual + last period paid.

### P28.E.3 — Brand standards score
Latest audit score visible.

### P28.E.4 — Network announcements feed
### P28.E.5 — Training modules access
### P28.E.6 — Operations manual access
Franchisor publishes operations manual. Versioned.

### P28.E.7 — Supply ordering (Kasse Connect)
P74 hook.

### P28.E.8 — Co-op marketing requests
Submit requests for franchisor-funded promotions.

### P28.E.9 — Renewal / transfer / termination
Lifecycle workflows.

### P28.E.10 — Performance benchmarking
Franchisee sees own performance vs network avg (anonymized).

## P28.F — Compliance + Legal (10 PRs)

### P28.F.1 — FDD template generator
Files: `app/dashboard/franchise/fdd/page.tsx`
24 items per FTC rule. Auto-fill from FranchiseSystem. `[ATTORNEY-GATED]` template content per OQ-012.

### P28.F.2 — FDD versioning
Each year's FDD versioned. State filings tracked.

### P28.F.3 — State franchise registration tracker
Per state requirements (registration vs filing vs notice).

### P28.F.4 — Franchise sales record (FTC compliance)
Every FDD delivery + signing logged.

### P28.F.5 — Item 19 financial performance representations
If used, must be substantiated. Annual update.

### P28.F.6 — Franchise broker compliance
Brokers must register in some states.

### P28.F.7 — Cooling-off period enforcement
14 days minimum (some states 21 days).

### P28.F.8 — Right of first refusal tracking
For transfers, franchisor's ROFR.

### P28.F.9 — Termination + non-compete enforcement
Track terminated franchisees, post-termination obligations.

### P28.F.10 — Franchise transfer workflow
Approval, training, fee.

## P28.G — Cross-Franchise Loyalty + Marketing Pool (5 PRs)

### P28.G.1 — Cross-unit loyalty
Customer's points usable at any unit in network. Configurable.

### P28.G.2 — Cross-unit gift card redemption
Gift card from one unit redeemable at any.

### P28.G.3 — Network-wide promotion engine
Franchisor pushes promo → applies at all units.

### P28.G.4 — Marketing pool contributions auto-tracked
### P28.G.5 — Marketing pool spend transparency
Franchisees see how fund used.

---

# P29 — STYLIST MARKETPLACE (40 PRs)

Per KASSE_PORTAL_ARCHITECTURE.md. Independent stylists + booth renters. Direct booking, no salon middleman. Per memory: Independent Stylist tier $29 addon.

## P29.A — Stylist Public Profile (10 PRs)

### P29.A.1 — Schema: StylistProfile
```prisma
model StylistProfile {
  id            String  @id @default(cuid())
  staffId       String  @unique  // links to Staff
  slug          String  @unique
  isPublic      Boolean @default(true)
  bio           String? @db.Text
  specialties   String[]
  yearsExperience Int?
  city          String
  state         String
  acceptingClients Boolean @default(true)
  startingPrice Int?     // cents
  rating        Decimal? @db.Decimal(2,1)
  reviewCount   Int      @default(0)
  // ... portfolio relations
}
```

### P29.A.2 — Public profile page
Files: `app/(public)/stylist/[slug]/page.tsx`
Hero, bio, portfolio gallery, services + prices, availability widget.

### P29.A.3 — Portfolio gallery
Pulled from Kasse Color before/after if salon. Or uploaded directly.

### P29.A.4 — Service catalog (booking-enabled)
Direct book buttons.

### P29.A.5 — Availability widget
Real-time. Pull from stylist's Kasse calendar.

### P29.A.6 — Direct booking flow
Same as P11 booking. Routes to stylist's account.

### P29.A.7 — Reviews on stylist profile
Pulled from past visit CSAT.

### P29.A.8 — Q&A on profile
Public Q&A. Stylist responds.

### P29.A.9 — Social links
Instagram, TikTok, Pinterest.

### P29.A.10 — SEO optimization
Schema markup. Meta tags. Sitemap inclusion.

## P29.B — Marketplace Discovery (10 PRs)

### P29.B.1 — Marketplace home
Files: `app/(public)/find/page.tsx`
Search + filter UI.

### P29.B.2 — Location search
Geo + radius.

### P29.B.3 — Service filter
"Find balayage near me."

### P29.B.4 — Price range filter
### P29.B.5 — Availability filter
"Today / this week / this weekend."

### P29.B.6 — Specialty filter
Curly hair specialist, color correction, etc.

### P29.B.7 — Rating filter
4+ stars.

### P29.B.8 — Trending / featured stylists
Algorithmic + paid placement (P29.D.1).

### P29.B.9 — Map view
Map of nearby stylists with pins.

### P29.B.10 — Saved stylists (favorites)
Client account feature.

## P29.C — Independent Stylist Account (10 PRs)

### P29.C.1 — Independent stylist signup flow
Files: `app/signup/independent/page.tsx`
Different from salon signup. Solo account.

### P29.C.2 — License verification (TDLR auto-verify, $9 addon)
### P29.C.3 — Insurance verification (Reyna Insure cross-sell)
### P29.C.4 — Independent stylist Plan tier
"Independent" plan $29/mo per memory.

### P29.C.5 — Mobile-first dashboard
Stylists predominantly mobile.

### P29.C.6 — Booking management (own calendar)
### P29.C.7 — Marketing tools (lite)
Subset of P6.F.

### P29.C.8 — Tax management
SalonBacked integration for 1099 self-employed.

### P29.C.9 — Booth rent tracker (if applicable)
Indep stylist pays salon for booth.

### P29.C.10 — Stylist-to-salon transfer flow
Stylist moves to/from salon employment.

## P29.D — Marketplace Monetization (10 PRs)

### P29.D.1 — Featured stylist placements
$50/week per memory pricing. Boost visibility.

### P29.D.2 — Sponsored search results
PPC model for specialty searches.

### P29.D.3 — Marketplace booking fee
Small fee on marketplace-originated bookings (vs direct-link bookings).

### P29.D.4 — Stylist subscription tiers
Independent $29, Featured $79, Premium $149.

### P29.D.5 — Client-side payment processing
Marketplace bookings always require deposit → Reyna Pay.

### P29.D.6 — Cancellation policy enforcement
Marketplace-wide policy + per-stylist override.

### P29.D.7 — Review moderation
Automated + human review for inappropriate content.

### P29.D.8 — Dispute resolution
Marketplace-mediated disputes.

### P29.D.9 — Trust + safety
ID verification, license verification, background check optional.

### P29.D.10 — Marketplace analytics
Per-stylist conversion, ranking factors, search volume.

---

## PHASE 27-29 COMPLETION CRITERIA

- All 180 PRs merged
- SalonBacked integration functional for Salon Envy (payroll + tax + benefits + insurance)
- Franchise Creator gated waiting on attorney FDD review
- Marketplace beta with 10+ independent stylists
- KASSE_REAL_BUILD_ORDER.md updated

**After P27-29:** P30-P32 (RunMySalon, Developer Platform, Agent API) can run.
