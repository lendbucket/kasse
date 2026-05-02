# KASSE_TIERS.md
## Pricing Architecture — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## PRICING PHILOSOPHY

Kasse's pricing strategy is designed around one number: **$250 average revenue per paying merchant per month.** At 10,000 merchants paying $250/month, that's $30M ARR. At 100,000 merchants, $300M ARR. This is the target that makes Kasse a unicorn-path SaaS business.

To hit $250/month average, the base plan economics look like this:
- Most merchants start on Growth ($99/month) or Pro ($179/month)
- Average base plan: ~$140/month
- Average addon attach: ~$110/month (2-3 addons per paid merchant)
- Combined average: $250/month

The addon strategy is critical. Every addon solves a real problem for a specific merchant type. We never force merchants to pay for features they don't use. But we make the addons so valuable that merchants happily pay for them.

**Processing margin:** On top of subscription, Kasse earns processing margin on every payment through Reyna Pay. At $23,950/month average merchant revenue, 0.30% net margin = $71.85/month per merchant in processing income. This is revenue that doesn't appear in subscription ARR but materially affects unit economics.

**Build Phase:** Core tier structure live at Phase 0 (with limited features). Full feature gates applied progressively as features ship.

---

## THE FIVE TIERS

### Tier 0 — FREE

**Price:** $0/month  
**Revenue model:** Processing margin only (~$45/month at average merchant volume)  
**Target:** New businesses, side hustles, ultra-small operations  
**Capacity:** 100 transactions/month, 1 staff, 1 location

**What's included:**
- Kasse POS (basic — no inventory, no gift cards)
- Online booking page (Kasse URL — cannot use custom domain)
- Up to 1 staff member
- Up to 100 transactions/month (hard cap — merchant prompted to upgrade at 80%)
- Client list (unlimited)
- Basic appointment history
- Email support only (72hr SLA)
- Kasse branding on all customer-facing pages ("Powered by Kasse")

**What's NOT included:**
- Staff management
- Marketing automations
- AI receptionist
- Reports (beyond basic daily total)
- Integrations (Google, Instagram, etc.)
- Kasse Color
- Gift cards
- Memberships
- API access
- Custom domain for booking page

**Free tier strategy:**
Free is not a charity — it's a top-of-funnel acquisition engine. Every free merchant is a warm lead. They're using Kasse, their clients are used to booking on Kasse, their data is in Kasse. Upgrading is one click. The conversion funnel from Free → Starter should be 60%+ within 90 days for merchants who are genuinely growing.

**Free tier upgrade prompts:**
- At 80 transactions (of 100 limit): "You're almost at your limit — upgrade to Starter for unlimited transactions"
- When trying to invite a 2nd staff member: "Starter plan required to add more staff"
- When trying to use marketing features: "Upgrade to Growth for automated marketing"
- Monthly email: "Here's what you could do with a Growth plan" (personalized to their vertical)

---

### Tier 1 — STARTER

**Price:** $49/month (annual: $39/month = $468/year)  
**Revenue model:** Subscription + processing margin  
**Target:** Established solo operators, new small teams (1-5 staff)  
**Capacity:** Unlimited transactions, 5 staff, 1 location

**Included features:**
- Everything in Free, plus:
- Unlimited transactions
- Up to 5 staff members
- Staff scheduling and availability management
- Online booking with custom domain ($19 addon to use own domain without custom site)
- Client management (full profiles, notes, history)
- Service catalog (unlimited services)
- Basic reports (daily, weekly, monthly revenue)
- Gift cards (sell and redeem)
- SMS appointment reminders (Twilio — 200 SMS/month included, $0.015 per SMS after)
- Basic marketing: 1 automation (e.g., birthday SMS)
- Product inventory (up to 50 SKUs)
- Email support (24hr SLA) + chat support (business hours)
- "Powered by Kasse" on booking page (removable for $9/month)
- Kasse branding on receipts (removable for $9/month)

**Starter upgrade prompts:**
- At 5 staff: "Need more staff? Pro plan supports 30+"
- When trying to use marketing automations (beyond 1): "Upgrade to Growth"
- When trying to use AI features: "Upgrade to Pro for AI receptionist"
- When trying to add second location: "Multi-location available on Pro"

---

### Tier 2 — GROWTH

**Price:** $99/month (annual: $79/month = $948/year)  
**Revenue model:** Subscription + processing margin  
**Target:** Established small-medium teams, growing businesses  
**Capacity:** Unlimited transactions, 15 staff, 1 location

**Included features:**
- Everything in Starter, plus:
- Up to 15 staff members
- Full staff management (roles, permissions, commission schedules)
- Full client intelligence (relationship scores, visit patterns, LTV)
- Unlimited marketing automations (win-back, rebooking, lapsed, birthday, review requests)
- Review request automation
- Reputation dashboard (Google, Yelp, Facebook review aggregation)
- Full reports suite (revenue by staff, by service, by client, cohort analysis)
- Inventory management (unlimited SKUs, reorder alerts, purchase orders)
- Basic integrations (Google Business Profile sync, review monitoring)
- AI-powered client win-back campaign suggestions
- Email support (8hr SLA) + chat support (extended hours)
- Kasse branding removable (included)
- SMS 500/month included

**Who should be on Growth:**
- Salons with 5-15 stylists
- Restaurants with 1 location
- Gyms with under 200 members
- Any business prioritizing marketing and retention

---

### Tier 3 — PRO

**Price:** $179/month (annual: $149/month = $1,788/year)  
**Revenue model:** Subscription + processing margin  
**Target:** High-volume single locations, multi-location operators  
**Capacity:** Unlimited transactions, 30 staff, 3 locations

**Included features:**
- Everything in Growth, plus:
- Up to 30 staff
- Up to 3 locations (unified dashboard, consolidated reports)
- AI Receptionist (200 calls/month included)
- Multi-location client profiles (client visible across all your locations)
- Advanced analytics (demand forecasting, cohort retention, revenue prediction)
- API access (1,000 requests/hour)
- Webhook support
- Membership management (recurring billing for classes, memberships)
- Class and event management
- Instagram and Facebook booking integrations
- Google Reserve integration
- Priority email + chat support (4hr SLA)
- Phone callback support
- SMS 1,000/month included

**Who should be on Pro:**
- High-volume salons ($300K+ annual revenue)
- Gyms with 200+ members
- Restaurants with heavy reservation volume
- Any multi-location operator

---

### Tier 4 — ENTERPRISE

**Price:** $349/month (annual: $299/month = $3,588/year)  
**Revenue model:** Subscription + processing margin  
**Target:** Large multi-location operators, franchisors, high-scale businesses  
**Capacity:** Unlimited everything

**Included features:**
- Everything in Pro, plus:
- Unlimited staff
- Unlimited locations
- AI Receptionist (500 calls/month included)
- Franchise Creator (add-on still required for royalty collection — see addons)
- White-label branding (remove Kasse branding completely from all customer-facing surfaces)
- Custom onboarding support (dedicated onboarding call)
- Dedicated Customer Success Manager (monthly check-ins)
- API access (10,000 requests/hour)
- Priority support (1hr SLA)
- Custom integration support
- Business Exchange (early access — list business for sale in Kasse Exchange)
- Advanced team management (department groupings, complex commission structures)
- Custom reporting (build any report from Kasse data)
- SMS 3,000/month included
- SalonBacked integration (if enrolled)

**Who should be on Enterprise:**
- Franchise systems (5+ locations)
- Any business doing $500K+ annual revenue
- Operators who need white-label (remove Kasse branding)

---

## COMPLETE ADDON CATALOG

Addons are available on the plans specified. Mix-and-match creates the $250 average.

### AI & Receptionist

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| AI Receptionist — Standard | $49/month | Growth+ | 100 calls/month AI phone answering, booking, FAQ handling |
| AI Receptionist — Pro | $79/month | Growth+ | 300 calls/month + WhatsApp automation |
| AI Receptionist — Unlimited | $129/month | Pro+ | Unlimited calls + SMS auto-responses + DM booking |
| AI Caption Generator | $19/month | All | Auto-generate social media captions for before/after posts |
| AI Business Insights | $29/month | Starter+ | Weekly AI-generated action items based on business data |

### Color & Formula Management

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| Kasse Color — Solo | $29/month | All | Formula cards for 1 stylist, basic color inventory |
| Kasse Color — Team | $49/month | Starter+ | Formula cards for all staff, full inventory, portfolio |
| Kasse Color — Pro | $79/month | Growth+ | All Team features + formula library analytics, AI suggestions, franchise formula standards |

### Website & Online Presence

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| Kasse Sites — Subdomain | $19/month | All | Full website on brand.kasseapp.com |
| Kasse Sites — Custom Domain | $29/month | All | Full website on yourdomain.com |
| Custom Booking Domain | $9/month | Starter+ | book.yourdomain.com instead of brand.kasseapp.com/book |
| Remove "Powered by Kasse" | $9/month | Starter | Remove Kasse branding from booking pages and receipts |

### Communication

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| SMS — Extra 500/month | $9/month | All | Add 500 SMS to monthly allotment |
| SMS — Extra 2,000/month | $29/month | All | Add 2,000 SMS |
| Kasse Phone Number | $9/month | All | Dedicated business phone number (text + voice) via Twilio |
| Two-Way Client Messaging | $19/month | Starter+ | Enable clients to reply to SMS reminders; unified inbox |

### Staff & HR

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| Advanced Commission | $19/month | Starter+ | Tiered commissions, service-specific rates, performance bonuses |
| Time & Attendance | $19/month | Starter+ | Clock-in/clock-out, labor reports, overtime tracking |
| Accountant Access | $9/month | All | Read-only financial access for accountant or bookkeeper |
| Business Partner Access | $9/month | All | Extended read-only access (operations + finance) |

### SalonBacked Integration

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| SalonBacked Payroll | $49/month + $6/staff | Growth+ | Full payroll processing via SalonBacked |
| SalonBacked Tax Filing | $39/month | Growth+ | In-house Schedule C, SE, 1040 filing via SalonBacked |
| SalonBacked Benefits | $29/month | All | Access to group insurance options via SEPA |
| SalonBacked Full Suite | $99/month + $6/staff | Pro+ | All SalonBacked modules bundled |

### Franchise & Multi-Location

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| Franchise Creator | $199/month | Enterprise | Full franchise system — FDD builder, territory mapping, application portal, training, royalty auto-collection |
| Per-Franchisee Location | $49/month | Enterprise | Adds each franchisee location to the franchise system |
| Reseller Program | $199/month | Enterprise | White-label reseller portal (legal review required before enabling) |

### Retention & Marketplace

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| Freeze Account — Full | $9/month | All | Pause account, keep data, unfreeze anytime |
| Freeze Account — Light | $19/month | All | Pause + keep client history visible |
| Freeze Account — Revenue | $29/month | All | Keep payment processing active, pause everything else |
| Business Exchange Listing | $299 one-time | Pro+ | List business for sale with Kasse verified valuation |
| Business Exchange Featured | $99/month | Pro+ | Featured placement in exchange listings |

### Vertical-Specific

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| Table Management | $49/month | All (Restaurant) | Floor plan, waitlist, reservations, tab management |
| Online Ordering | $49/month | All (Restaurant) | Direct online ordering (no commission like DoorDash) |
| Kitchen Display System | $29/month | Growth+ (Restaurant) | KDS app for kitchen screens |
| Class Management | $49/month | All (Gym/Studio) | Class scheduling, registration, attendance, waitlist |
| Membership Management | $49/month | Starter+ | Recurring membership billing, member check-in |
| Door Access Integration | $39/month | Growth+ (Gym) | QR/fob-based door access system |
| Waitlist Queue | $19/month | All (Barbershop) | Walk-in queue management, TV display, remote queue join |
| Pet Profiles | $19/month | All (Pet Grooming) | Extended pet profiles with vaccine tracking, temperament notes |
| Medical Intake | $39/month | Growth+ (Med Spa) | Digital intake forms, consent management, HIPAA-aware storage |
| Vehicle Profiles | $19/month | All (Auto) | Vehicle-based service history, VIN tracking, service reminder system |
| Tax Nexus Tracker | $29/month | Growth+ | Sales tax nexus monitoring for mobile/multi-state businesses |

### Developer & Integration

| Addon | Price | Plans | Description |
|-------|-------|-------|-------------|
| API Access — Standard | Included | Pro+ | Already included in Pro |
| API Access — Starter | $29/month | Growth | API access for Growth plan merchants |
| Additional API Capacity | $49/month | Pro+ | Increase rate limit to 50,000 requests/hour |
| Zapier Integration | $19/month | Starter+ | Connect Kasse to 5,000+ apps via Zapier |
| DoorDash Integration | $29/month | All (Restaurant) | DoorDash order management in Kasse |
| Uber Eats Integration | $29/month | All (Restaurant) | Uber Eats order management in Kasse |
| Shopify Sync | $29/month | All (Retail) | Bi-directional product + inventory sync |

---

## PLAN COMPARISON TABLE

| Feature | Free | Starter | Growth | Pro | Enterprise |
|---------|------|---------|--------|-----|-----------|
| Monthly price | $0 | $49 | $99 | $179 | $349 |
| Transactions | 100/mo | Unlimited | Unlimited | Unlimited | Unlimited |
| Staff | 1 | 5 | 15 | 30 | Unlimited |
| Locations | 1 | 1 | 1 | 3 | Unlimited |
| Booking page | ✓ (Kasse URL) | ✓ | ✓ | ✓ | ✓ |
| Client management | Basic | Full | Full | Full | Full |
| Service catalog | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gift cards | ✗ | ✓ | ✓ | ✓ | ✓ |
| Marketing automations | ✗ | 1 | Unlimited | Unlimited | Unlimited |
| Review management | ✗ | ✗ | ✓ | ✓ | ✓ |
| Full reports | ✗ | Basic | ✓ | Advanced | Custom |
| Inventory | ✗ | 50 SKUs | Unlimited | Unlimited | Unlimited |
| AI Receptionist | ✗ | ✗ | Add-on | 200 calls | 500 calls |
| Memberships | ✗ | ✗ | ✗ | ✓ | ✓ |
| API access | ✗ | ✗ | Add-on | ✓ | ✓ |
| Franchise Creator | ✗ | ✗ | ✗ | ✗ | Add-on |
| White-label | ✗ | ✗ | ✗ | ✗ | ✓ |
| Support SLA | 72hr email | 24hr email | 8hr chat | 4hr chat+phone | 1hr dedicated |
| SMS included | 0 | 200 | 500 | 1,000 | 3,000 |
| Kasse branding on pages | Yes | Removable ($9) | Removed | Removed | Removed |

---

## REVENUE MODEL MATH

### Revenue Per Merchant — Model Scenarios

**Scenario A: Small Salon Owner, Starter Plan**
- Starter base: $49/month
- Kasse Color Solo: $29/month
- Kasse Phone Number: $9/month
- SMS add-on 500: $9/month
- **Total subscription: $96/month**
- Processing margin on $12,000/month volume at 0.30%: $36/month
- **Total revenue: $132/month**

**Scenario B: Mid-size Salon, Growth Plan**
- Growth base: $99/month
- Kasse Color Team: $49/month
- AI Receptionist Standard: $49/month
- Kasse Sites Custom: $29/month
- Accountant Access: $9/month
- **Total subscription: $235/month**
- Processing margin on $25,000/month at 0.30%: $75/month
- **Total revenue: $310/month**

**Scenario C: Restaurant, Pro Plan**
- Pro base: $179/month
- Table Management: $49/month
- Online Ordering: $49/month
- Kitchen Display: $29/month
- Zapier: $19/month
- **Total subscription: $325/month**
- Processing margin on $85,000/month at 0.30%: $255/month
- **Total revenue: $580/month**

**Scenario D: Gym, Pro Plan**
- Pro base: $179/month
- Class Management: $49/month
- Membership Management: $49/month
- Door Access: $39/month
- AI Receptionist Pro: $79/month
- **Total subscription: $395/month**
- Processing margin on $35,000/month at 0.30%: $105/month
- **Total revenue: $500/month**

**Scenario E: Franchise System, Enterprise**
- Enterprise base: $349/month
- Franchise Creator: $199/month
- 12 franchisee locations × $49: $588/month
- Kasse Color Pro: $79/month
- **Total subscription: $1,215/month**
- Processing margin on combined 13-location $400,000/month at 0.30%: $1,200/month
- Plus royalty auto-collection fee (0.1% of franchisee volume): $380/month
- **Total revenue: $2,795/month**

---

## ANNUAL PRICING INCENTIVE

Annual pricing offers 20% discount across all plans:
- Free: still free
- Starter: $39/month (billed $468/year) — saves $120/year
- Growth: $79/month (billed $948/year) — saves $240/year
- Pro: $149/month (billed $1,788/year) — saves $360/year
- Enterprise: $299/month (billed $3,588/year) — saves $600/year

Addons remain monthly regardless of base plan billing cycle.

**Annual plan target:** 40% of paying merchants on annual plans within 18 months of launch. Annual merchants churn at 1/3 the rate of monthly merchants.

---

## PLAN MIGRATION

### Upgrade path

Upgrading is instant — features unlock immediately. Billing is prorated for the remaining days of the current billing cycle.

### Downgrade path

Downgrading takes effect at the end of the billing period. If a downgrade would leave the merchant over their new plan's limits:
- Over staff limit: excess staff set to "inactive" (data preserved, login disabled)
- Over location limit: excess locations set to "archived" (data preserved, not actively usable)
- Over transaction limit: not applicable (no transaction limit on Starter+)

Merchants receive warning email 5 days before downgrade takes effect showing what they'll lose.

### Cancellation

Cancel anytime. Data retained 90 days after final billing date. After 90 days, permanently deleted.

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 0 kickoff (pricing pages must be built before launch)*
