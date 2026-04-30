# RUNMYSALON
## The Distribution Layer — Kasse Engine for Non-Technical Businesses

**Version:** 1.0 | **Entity:** Reyna Tech LLC | **Status:** PLANNING (Phase 4)

---

## WHAT RUNMYSALON IS

RunMySalon is not a new product. It is the **distribution layer** that packages the Kasse engine for businesses that will never switch their current software, will never understand what an API is, and will never hire a developer — but WILL buy an intelligence and automation layer that plugs on top of what they already have.

The insight: Most small businesses are locked into their current software (Square, Vagaro, Mindbody) not because it's good but because switching is painful. RunMySalon removes the switching requirement entirely.

```
[Square / Vagaro / Mindbody / custom POS]   ← they keep this
              ↓ connect via OAuth
         [RunMySalon Portal]               ← they buy this
              ↓ powered by
         [Kasse Engine API]                ← they never see this
              ↓ gives them
    [Intelligence + Automation + HCM]      ← this is the value
```

---

## THE THREE SURFACES

### Surface 1 — RunMySalon Chrome Extension

A browser extension that overlays Kasse intelligence on top of ANY existing software.

**How it works:**
- Business installs the Chrome extension (free)
- Extension detects when they're logged into Square, Vagaro, Mindbody, etc.
- Sidebar appears showing:
  - Today's revenue vs yesterday
  - Top churn risk clients booked today
  - Upsell suggestions based on client history
  - Pending review requests
  - Commission calculations for today
  - AI alerts ("Sarah hasn't been in 7 weeks — she's booked today")
- Data comes from: Kasse intelligence engine + OAuth connection to their current software
- One-click actions: message client, send review request, add note

**Why this is powerful:**
- Zero switching cost (they keep their software)
- Free to install = massive distribution
- Once they see the value → they upgrade to the portal
- Every install = a daily active touchpoint for the Kasse brand

**Technical architecture:**
- Chrome extension (Manifest V3)
- OAuth flow to connect Square/Vagaro/Mindbody account
- Extension calls RunMySalon API which calls Kasse intelligence engine
- All data stored in Kasse — not in the extension

### Surface 2 — RunMySalon Portal

A full web portal that non-technical businesses log into. It looks like a simple, beautiful dashboard — but the Kasse engine is running everything underneath.

Features visible to the business:
- Revenue dashboard (from their connected POS)
- Client intelligence (churn risk, LTV, upsell suggestions)
- Marketing automation (campaigns triggered by behavior)
- Review management
- Staff performance
- AI business advisor
- SalonBacked HCM (tax, insurance, payroll — if subscribed)

Features NOT visible (running underneath):
- Kasse API calls
- Reyna Pay data processing
- Intelligence model calculations
- SalonBacked data sync

**The key UX principle:** Business owners should feel like they're using simple software. The complexity is hidden. The value is obvious.

### Surface 3 — Embedded Booking Widget

A booking widget that any business can embed on their website, Instagram bio link, or Google Business Profile — powered by the Kasse booking engine, but branded as their own.

```html
<!-- One line of code on their website -->
<script src="runmysalon.com/widget.js" data-salon="luxe-hair-studio"></script>
```

---

## INTEGRATION CONNECTORS

RunMySalon connects to existing software via OAuth:

| Platform | Connection Type | What We Pull |
|----------|----------------|--------------|
| Square | OAuth + Square API | Appointments, transactions, clients, staff |
| Vagaro | OAuth + Vagaro API | Appointments, clients, services, staff |
| Mindbody | OAuth + Mindbody API | Bookings, clients, staff, revenue |
| Booksy | OAuth + Booksy API | Appointments, clients |
| GlossGenius | API import | Client list, appointment history |
| Custom CSV | File upload | Client list, transaction history |

When connected:
1. Historical data imports (last 12 months)
2. Real-time sync via webhooks (when possible) or polling (15-minute intervals)
3. Business sees their data enhanced with Kasse intelligence
4. Kasse engine trains on their data to improve recommendations

---

## THE VERTICAL WHITE-LABEL STRATEGY

RunMySalon is the generic "any salon" brand. But the same engine gets white-labeled for every vertical under separate domains:

| Brand | Vertical | Domain | Tagline |
|-------|---------|--------|---------|
| RunMySalon | Hair salons | runmysalon.com | "The intelligence layer for salons" |
| RunMyBarbershop | Barbershops | runmybarbershop.com | "Built for barbers" |
| RunMyNailSalon | Nail salons | runmynailsalon.com | "For nail professionals" |
| RunMySpa | Spas + wellness | runmyspa.com | "For spa owners" |
| RunMyGym | Fitness studios | runmygym.com | "For gym owners" |
| RunMyClinic | Med spas + clinics | runmyclinic.com | "For wellness clinics" |
| RunMyRestaurant | Restaurants | runmyrestaurant.com | "For restaurant owners" |
| RunMyShop | Auto service | runmyshop.com | "For service shops" |

Each is:
- Separate domain (registered and parked)
- Separate landing page (vertical-specific copy and imagery)
- Same underlying codebase (feature flags control vertical config)
- Same engine (Kasse + Reyna Pay + SalonBacked)

**The reseller play:** A restaurant franchise management company buys RunMyRestaurant white-labeled as their own brand. They sell it to their 500 restaurant locations. Each location pays $149/month. That's $74,500/month from one reseller deal.

---

## PRICING

```
FREE — "RunMySalon Lite"
- Chrome extension only
- Basic insights (7-day revenue, top 3 churn risks)
- Connect one integration
- Purpose: distribution + prove value + conversion funnel

STARTER — $49/month
- Full Chrome extension + web portal
- All intelligence features
- Connect unlimited integrations
- 500 AI queries/month
- Email/SMS automation (100 sends/month)

GROWTH — $149/month
- Everything in Starter
- Unlimited AI queries
- Unlimited sends
- White-label booking widget (their logo/colors)
- Custom booking page domain
- Advanced analytics + market benchmarks
- SalonBacked Basic (tax tracking + telehealth)

BUSINESS — $299/month
- Everything in Growth
- API access (build custom integrations)
- Custom AI persona (name your AI receptionist)
- Multi-location dashboard
- Remove "Powered by RunMySalon" branding
- Full SalonBacked suite (payroll, insurance, HR)

WHITE-LABEL — $999/month
- Full RunMySalon white-labeled as your brand
- Custom domain
- Your logo everywhere
- API access with your rate limits
- Resell to your own customers
- "Powered by Reyna Pay" stays (non-removable)
- Dedicated onboarding support
```

---

## GO-TO-MARKET SEQUENCE

### Month 1-2: Chrome Extension Launch
- Build the free Chrome extension
- First integration: Square Dashboard (largest installed base)
- Shows 3 things only: revenue today, top churn risk, suggested upsell
- Submit to Chrome Web Store
- Post on Reddit r/entrepreneur, r/smallbusiness, beauty Facebook groups
- Goal: 1,000 installs, 100 email signups

### Month 3: Portal Beta
- Invite the 100 email signups
- Free portal access for 90 days
- Collect feedback aggressively
- Goal: 10 salons willing to pay $49/month

### Month 4: First $5k MRR
- Charge 10 engaged beta users
- Use testimonials for social proof
- Goal: $5,000 MRR

### Month 5-6: Franchise Broker Channel
- 50 franchise brokers who work in salon/beauty
- Offer: 20% first-year revenue on every referral
- One broker × 20 placements/year × $149/month = $35,760/year for them
- Goal: 5 active broker partners, 50 new customers

### Month 7-12: White-Label Deals
- Target regional salon chains (50-200 locations)
- White-label at $999/month + per-location fees
- Goal: 3 white-label deals = $36k/year + processing margin

---

## THE DEVELOPER API LAYER

For developers and AI builders, RunMySalon exposes the full Kasse engine via API:

**What makes it worth paying for:**
- Aggregate intelligence (cross-merchant benchmarks impossible to replicate)
- Vertical context in every response (not just data, but meaning)
- Licensed payment rails (Payroc — impossible to spin up yourself)
- Pre-built vertical configs (don't build the salon logic yourself)

**Developer pricing:**
```
EXPLORER — Free
- 1,000 calls/month
- Read-only
- Sandbox only
- Purpose: prove value, build proof-of-concept

BUILDER — $99/month
- 50,000 calls/month
- Full CRUD
- 5 webhooks
- Basic intelligence endpoints
- Production access

STARTUP — $499/month
- 500,000 calls/month
- All intelligence endpoints
- Unlimited webhooks
- Streaming endpoints
- White-label API responses

SCALE — $2,000/month
- Unlimited calls
- Dedicated infrastructure
- SLA guarantee
- Custom intelligence models
- Your domain for API endpoint

AGENT TIER — $0.001/action (usage-based)
- For AI agents making 100x more calls than humans
- Per-action pricing (book, charge, notify, etc.)
```

---

## THE COMPETITIVE INTELLIGENCE PRODUCT

Because RunMySalon aggregates data from thousands of businesses, it can sell intelligence back:

**For individual businesses:**
"Your blowout price of $55 is 23% below the market average for salons your size in Corpus Christi. You're leaving $400/month on the table."

**For product brands:**
"Balayage bookings in Austin are up 34% this quarter. Here's the data behind it."

**For commercial real estate:**
"This zip code has 3 salons all running at 90%+ capacity. Market can support a 4th."

**For private equity:**
"Salon industry benchmarks across 15 Texas markets, Q1 2026. Annualized report."

This is purely passive revenue. No incremental development cost. Pure margin.

---

## STRATEGIC DECISIONS

**SD-RM-001:** RunMySalon is a distribution layer, not a separate engine. It consumes Kasse API. No separate backend.

**SD-RM-002:** Chrome extension is free permanently. Monetization comes from portal + API upgrades.

**SD-RM-003:** Each vertical white-label is a separate domain but same codebase. Feature flags control vertical config.

**SD-RM-004:** "Powered by Reyna Pay" stays on all payment flows regardless of white-label brand.

**SD-RM-005:** Resellers cannot sub-resell (no sub-resellers). Resellers sell to end businesses only.

**SD-RM-006:** Developer API is positioned as "unfair advantage" not "API access." Copy reflects the time and money they'd spend building this themselves.
