# KASSE TIERS
## Pricing Architecture — Per-Location, Square-Aligned

**Version:** 2.0 | **Status:** LIVING | **Last Updated:** 2026-05-17
**Authority:** SD-K-020 (locked) — see KASSE_STRATEGIC_DECISIONS.md

---

## PRICING MODEL

Kasse uses **per-location pricing** aligned with Square's salon model. Salon owners are familiar with this structure. Pricing scales linearly with locations — no surprises for multi-location operators.

**Locked decisions:**
- SD-K-020 — Per-location 4-tier pricing, Square-aligned
- SD-K-022 — Single-region nationwide (no geographic price differentiation)
- SD-K-027 — Inventory partnership with Salon Centric (addon, not base tier)

---

## THE FOUR TIERS

### Tier 0 — FREE

**Price:** $0/month
**Locations:** 1
**Staff:** Up to 3
**Target:** New solo operators, side hustles, evaluating Kasse

**Included:**
- Booking page on `kasseapp.com/book/[slug]`
- Up to 100 transactions/month
- Up to 3 staff members
- 1 location
- Basic client management
- Service catalog
- Cash + manual payment recording
- Email support (72hr SLA)
- "Powered by Kasse" branding on customer-facing pages

**Excluded:**
- Card payment processing (requires Reyna Pay activation, included on paid tiers)
- Marketing automation
- AI features
- API access
- Custom domain
- Multi-location

**Hard limit enforcement:** PR #72 returns 402 PAYMENT_REQUIRED with structured upgrade body when limit is hit.

---

### Tier 1 — PLUS

**Price:** $29/month per location (annual: $24/month/loc, saves 17%)
**Locations:** Unlimited (billed per location)
**Staff:** Up to 10 per location
**Target:** Established solo or small team salons

**Included (everything in FREE plus):**
- Unlimited transactions
- Up to 10 staff per location
- Multi-location support (each location billed separately)
- Card payment processing via Reyna Pay
- Card-on-file (Payroc Secure Tokens)
- Pre-auth holds at booking
- SMS card-capture portal for phone bookings (SD-K-029)
- Manual card entry via Hosted Fields
- Apple Pay + Google Pay
- Online booking with real availability
- Recurring appointment series
- Cancellation policies (custom amount + window per service)
- Customer profiles with structured allergies + formula history
- Marketing consent tracking
- Basic email + SMS appointment reminders (500 SMS/month/location included)
- Basic reports (revenue, appointments, staff performance)
- Gift cards (sell + redeem)
- Membership management
- Email + chat support (24hr SLA)

**Excluded:**
- Marketing automation beyond reminders
- AI features
- Multi-location service catalog sync
- Custom roles
- API access
- White-label

---

### Tier 2 — PREMIUM

**Price:** $69/month per location (annual: $57/month/loc, saves 17%)
**Locations:** Unlimited (billed per location)
**Staff:** Up to 30 per location
**Target:** Mid-sized salons and multi-location operators

**Included (everything in PLUS plus):**
- Up to 30 staff per location
- Full marketing automation (drips, win-back, birthday, anniversary, abandoned-booking — SD-K-036)
- AI Receptionist (200 voice calls/month/location included, SD-K-026)
- AI content generation (human tone, no AI tone — SD-K-026)
- Help Center AI with action-taking (SD-K-026)
- Profitability calculator + what-if commission scenarios
- Multi-location service catalog with sync toggles
- Sub-tenant price approval workflows
- Custom roles + permissions (P0.A engine)
- Full reports suite (per-location + aggregate, macro/micro views)
- Reviews + Google Business Profile integration (smart filter, 4+ stars → public — SD-K-037)
- Custom loyalty programs (SD-K-035)
- Custom referral programs (SD-K-035)
- Inventory tracking with real-time alerts
- Optional inventory auto-deduction
- Salon Centric reorder PDF (SD-K-027)
- 1099 + W-2 PDF generation (SD-K-038)
- HCM foundations: W-4, I-9, direct deposit, license verification, background check, time clock (SD-K-019)
- Geolocation enforcement for time clock (SD-K-030)
- PTO/sick request workflow
- Employment agreement templates + custom upload + e-signature (SD-K-019)
- Per-stylist commission models (flat, per-service, tiered, hybrid)
- Tip splits (configurable per salon: primary-only / time-based / revenue-ratio / explicit %)
- TDPSA + CCPA compliance handling (SD-K-039)
- Priority email + chat support (8hr SLA)

**Excluded:**
- Voice receptionist beyond 200 calls
- Owner Command Center
- Franchise Edition features
- API access (limited dev access only)
- White-label

---

### Tier 3 — ENTERPRISE

**Price:** Custom (typically $99-$249/month per location depending on volume)
**Locations:** Unlimited
**Staff:** Unlimited
**Target:** Multi-state operators, franchisors, large chains, brand-mode holding companies

**Included (everything in PREMIUM plus):**
- Unlimited voice receptionist calls
- Owner Command Center (Claude-powered platform admin with full audit log — SD-K-026)
- Franchise Edition foundation: sub-tenant hierarchy, royalty collection (3 models — SD-K-024), marketing co-op fund, brand standards enforcement (UI/workflow ships v1.x or v2)
- Full multi-location hierarchy (flat / tiered / brand-mode — SD-K-040)
- Cross-location operations: shared clients, gift cards cross-redeemable, inventory transfers, staff multi-location, traveling stylists
- Concierge onboarding (human-assisted within 7 days if self-serve incomplete)
- Dedicated Customer Success Manager
- White-label capability (custom branding, custom domain)
- Full API access (REST + webhooks + agent-native — SD-K-005)
- Custom integrations support
- Priority support (1hr SLA, 99.95% uptime SLA — SD-K-022)
- TDLR + state-by-state employment compliance (TX, CA, FL, NY, IL priority — SD-K-021)
- Custom reporting
- Audit log export (compliance / forensics)

---

## ADDON CATALOG

Addons are tracked via `Organization.enabledAddons: String[]` (shipped in PR #70). Available on PLUS+ unless noted.

### AI & Voice

| Addon | Price | Tier | Notes |
|-------|-------|------|-------|
| AI Receptionist — Extra Calls | $0.20/call | PLUS+ | Beyond included 200/month/location |
| AI Receptionist — Unlimited | $99/month/location | PLUS+ | Replaces per-call billing |
| Booking AI (web + SMS + voice) | Included | PREMIUM+ | Conversational booking + upsell |
| Command Center AI (read/modify platform) | Included | ENTERPRISE | Full audit log |
| Proactive Bug Detection AI | $49/month | ENTERPRISE | v2 — reactive included in PREMIUM |

### Communication

| Addon | Price | Tier | Notes |
|-------|-------|------|-------|
| SMS Pack — 1,000 extra/month | $15/month | All | Stacks |
| SMS Pack — 5,000 extra/month | $59/month | All | Stacks |
| Custom Phone Number | $9/month | All | Twilio dedicated number |
| Two-Way Client Messaging | $19/month | PLUS+ | Reply tracking + unified inbox |

### Compliance & Tax

| Addon | Price | Tier | Notes |
|-------|-------|------|-------|
| Managed PCI Compliance (v2) | $79/month | ENTERPRISE | v2 only — pass-through v1 (SD-K-023) |
| TaxJar Integration (v2) | $29/month | PREMIUM+ | v2 — manual tax rates v1 |
| State Compliance Beyond Top 5 | $0 | All | Rolled out as ready (TX/CA/FL/NY/IL v1, others v1.x) |
| Tax Form E-Filing (v2) | $39/month | PREMIUM+ | v2 — PDF generation v1 |

### Multi-Location & Franchise

| Addon | Price | Tier | Notes |
|-------|-------|------|-------|
| Brand-Mode Hosting | Included | ENTERPRISE | Multiple brands under one org |
| Franchise Creator | Included | ENTERPRISE | FDD builder, territory mapping, royalty system |
| Per-Franchisee Royalty Auto-Collect | $0.10/transaction | ENTERPRISE | Default model (SD-K-011, alternatives per SD-K-024) |

### Vertical-Specific

| Addon | Price | Tier | Notes |
|-------|-------|------|-------|
| Salon Color Studio | Included | PLUS+ | Formula tracking per client |
| Booth Rental Classification | Included | PLUS+ | v1 — true sub-merchant v2 (SD-K-025) |
| Med Spa HIPAA Mode | $79/month | ENTERPRISE | v2 only — defer until HIPAA review (SD-K-008) |

### Integrations

| Addon | Price | Tier | Notes |
|-------|-------|------|-------|
| Salon Centric Inventory | $19/month | PLUS+ | PDF reorder workflow (SD-K-027) |
| Google Business Profile | Included | PREMIUM+ | Review management |
| Checkr Background Check | Pass-through cost | PREMIUM+ | Built into HCM |
| Apple/Google Pay | Included | All | Standard checkout option |

### Mobile

| Addon | Price | Tier | Notes |
|-------|-------|------|-------|
| Capacitor Native App (iOS + Android) | Included | All | v1 (SD-K-018) |
| React Native Rewrite | Included | All | v2 (SD-K-018) |

---

## REVENUE MODEL MATH

Per-location pricing creates predictable scaling. ARPU varies with location count and addon attach.

**Scenario A: Single-location PLUS salon**
- PLUS base: $29
- Salon Centric: $19
- AI Receptionist extra 100 calls: $20
- **Total subscription: $68/month**
- Processing margin (avg $12k/mo volume at 0.30%): $36/month
- **Total revenue: $104/month**

**Scenario B: Single-location PREMIUM salon**
- PREMIUM base: $69
- AI Receptionist unlimited: $99
- Two-Way Messaging: $19
- **Total subscription: $187/month**
- Processing margin (avg $25k/mo volume at 0.30%): $75/month
- **Total revenue: $262/month**

**Scenario C: 5-location PREMIUM chain**
- PREMIUM × 5 locations: $345
- AI Receptionist unlimited × 5: $495
- Salon Centric × 5: $95
- **Total subscription: $935/month**
- Processing margin (combined $100k/mo at 0.30%): $300/month
- **Total revenue: $1,235/month**

**Scenario D: 12-location ENTERPRISE franchise**
- ENTERPRISE custom (~$149/loc × 12): $1,788
- Franchise Creator: included
- Royalty auto-collect on $400k/mo: $400
- AI Receptionist unlimited × 12: $1,188
- **Total subscription: $2,976/month**
- Processing margin (combined $400k/mo at 0.30%): $1,200/month
- **Total revenue: $4,576/month**

---

## ANNUAL DISCOUNTS

Annual prepay offers 17% discount across all paid tiers:
- PLUS: $24/month/location (billed $288/year/location)
- PREMIUM: $57/month/location (billed $684/year/location)
- ENTERPRISE: Custom

Addons remain monthly billing.

**Target:** 35% of paying merchants on annual plans within 12 months of launch. Annual merchants churn at ~1/3 the rate of monthly.

---

## PLAN MIGRATION

### Upgrade
Instant. Features unlock immediately. Billing prorated for remainder of current cycle.

### Downgrade
Takes effect at end of billing period. Warning email 5 days before. If new tier limits are exceeded, owner is prompted to reduce locations/staff before downgrade applies.

### Cancellation
Cancel anytime. Data retained 90 days after final billing. After 90 days, soft-deleted (recoverable for 1 year), then permanently deleted.

---

## SUPPORT SLAs

| Tier | First Response | Resolution Target |
|------|---------------|-------------------|
| FREE | 72hr email | Best effort |
| PLUS | 24hr email + chat | 5 business days |
| PREMIUM | 8hr email + chat | 3 business days |
| ENTERPRISE | 1hr (24/7) | Same day for P1, 24hr P2 |

Uptime SLA: 99.9% all tiers, 99.95% ENTERPRISE (SD-K-022).

---

## REFERENCES

- **Pricing model lock:** SD-K-020
- **Per-location enforcement:** PR #70 (lib/plans/limits.ts), PR #72 (POST /api/locations 402 enforcement)
- **Plan tier enum:** `prisma/schema.prisma` PlanTier (FREE, PLUS, PREMIUM, ENTERPRISE)
- **Strategic decisions:** docs/KASSE_STRATEGIC_DECISIONS.md
- **Contradictions resolved:** docs/architecture/CONVERSATION_VS_DOCS_CONTRADICTIONS.md
