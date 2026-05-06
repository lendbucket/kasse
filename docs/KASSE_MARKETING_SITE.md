# KASSE_MARKETING_SITE.md
## Marketing Site — Complete Specification
### Version 1.0 | kasseapp.com | 36 West Holdings

---

## STRATEGIC PURPOSE

The marketing site has one job: convert a service business owner who has never heard of Kasse into someone who either signs up for a trial or applies for the incubator program. Every page, every section, every word is evaluated against this standard.

**The site is NOT:** A feature dump. A corporate brochure. A generic SaaS landing page with stock photos of diverse people on laptops.

**The site IS:** A direct conversation with a salon owner, barbershop owner, or gym owner at 11pm when they're stressed about their business and looking for a better way. It knows their problems. It talks like a person, not a company. It shows real product (not mockups). It makes the next step obvious.

---

## BRAND VOICE

**The Kasse voice is:** Direct, warm, confident, specific. Like a friend who knows the business and wants to help.

**Not:** Corporate, jargon-heavy, feature-list obsessed, or generic.

**Examples:**

WRONG: "Kasse's AI-powered platform delivers comprehensive omnichannel engagement solutions for service-based SMBs."

RIGHT: "Run your salon like a business. Kasse handles the booking, the payments, the marketing, and the payroll — so you can focus on what you're actually good at."

WRONG: "Our robust feature set includes advanced appointment management capabilities."

RIGHT: "No more missed appointments. No more chasing clients who don't show. No more end-of-day chaos figuring out who owes who what."

---

## SITE ARCHITECTURE

```
kasseapp.com/
├── / (Home)
├── /features
│   ├── /appointments
│   ├── /payments
│   ├── /marketing
│   ├── /payroll
│   ├── /ai-receptionist
│   └── /for-teams
├── /verticals
│   ├── /salons
│   ├── /barbershops
│   ├── /gyms
│   └── /restaurants (coming soon)
├── /pricing
├── /incubator
├── /compare
│   ├── /vs-square
│   ├── /vs-vagaro
│   └── /vs-mindbody
├── /blog
├── /about
├── /legal
│   ├── /privacy
│   ├── /terms
│   └── /processing-agreement
├── /signup
└── /login
```

---

## PAGE SPECS

---

### PAGE 1 — HOME

**URL:** `kasseapp.com`

**Navigation:**
```
kasse.     Features ▾     Pricing     Incubator     [Sign In]     [Start Free Trial →]
```
On mobile: hamburger → drawer with same items + phone number

**Hero Section:**

```
────────────────────────────────────────────────────────────────────────────
HEADLINE (H1, 52px, #2F5061):
The Operating System for
Service Businesses.

SUBHEADLINE (20px, #3D4F58):
Booking. Payments. Payroll. Marketing. AI Receptionist.
All in one place. No spreadsheets. No chaos.

CTAs:
[Start Free Trial →]     [Watch 2-min Demo]

TRUST LINE:
No credit card required · 14-day free trial · Used by 500+ businesses

HERO IMAGE:
Real screenshot of the Kasse dashboard (not a mockup).
Specifically: the appointment calendar with the #2F5061 sidebar
and the revenue counter ticking up.
Animate the revenue counter in the screenshot from $0 to $4,230.
────────────────────────────────────────────────────────────────────────────
```

**Social Proof Bar (below hero):**
```
Logos of real Salon Envy locations + first cohort businesses once enrolled.
If no logos yet: "Trusted by salon and barbershop owners across Texas"
5-star rating badge: "4.9/5 from 200+ reviews"
```

**The Problem Section:**

```
SECTION HEADER: Sound familiar?

Pain point 1:   You're still texting clients to confirm appointments.
Pain point 2:   Figuring out who owes commission at the end of the week is a spreadsheet nightmare.
Pain point 3:   Your AI Receptionist is still your voicemail.
Pain point 4:   QuickBooks is technically connected but you haven't opened it in 3 months.
Pain point 5:   You have 3 apps for booking, 1 for payments, 1 for marketing, and none of them talk to each other.

PUNCHLINE: "We built Kasse for exactly this."
```

**Feature Overview (6 cards):**

```
Card 1 — Appointments
Icon: Calendar
"Book, confirm, remind, check in, and rebook automatically.
Your schedule runs itself."

Card 2 — Kasse Pay
Icon: Credit card
"Accept cards anywhere. No reader required. Funds hit
your account next day."

Card 3 — AI Receptionist
Icon: Phone
"Answers every call. Books appointments. Never sleeps.
Never takes a sick day."

Card 4 — Team & Payroll
Icon: People
"Commission tracking, clock in/out, and payroll — all calculated
automatically every pay period."

Card 5 — Marketing
Icon: Megaphone
"Win-back campaigns. Review requests. Birthday messages.
All automated. All personalized."

Card 6 — Banking & Bill Pay
Icon: Bank
"One account for everything. Revenue comes in. Bills go out.
Payroll goes out. You see it all in one place."

[See All Features →]
```

**Vertical Selector:**

```
Works for your business, whatever you do.

[Salons]  [Barbershops]  [Gyms]  [Nail Salons]  [Massage]  [More →]

(clicking each updates the screenshot shown to vertical-specific portal view)
```

**The Incubator CTA Block:**

```
────────────────────────────────────────────────────────────────────────────
Background: #2F5061 (dark teal)
Text: White

HEADLINE: Ready to grow? Apply for the Kasse Founders Program.

SUBHEADLINE:
12 weeks. Real curriculum. Real capital access.
Top graduates receive a funded second location.

[Apply Now →]

"Applications for Cohort 1 close August 1, 2026. 25 spots available."
────────────────────────────────────────────────────────────────────────────
```

**Testimonials:**

```
Real quotes from real business owners. No stock photos.
Owner's actual photo, first name, business name, city.

"I used to spend Sunday nights figuring out commissions.
Now Kasse does it automatically. I actually took a real day off last week."
— Jennifer, Luxe Hair Studio, Corpus Christi TX

"The AI Receptionist booked 11 appointments while I slept last month.
That's $2,200 I would have missed."
— Marcus, Sharp Cuts Barbershop, San Antonio TX
```

**Pricing Preview:**

```
Plans from $49/month. Free 14-day trial, no credit card required.
[See Pricing →]
```

**Footer:**
```
kasse.

Product          Company          Legal           Social
Features         About            Privacy         Instagram
Pricing          Blog             Terms           TikTok
Incubator        Careers          Processing      YouTube
AI Receptionist  Contact          Agreement       LinkedIn

© 2026 Kasse Platform LLC · Corpus Christi, TX
"Payments powered by Reyna Pay"  [very small, bottom of footer]
```

---

### PAGE 2 — PRICING

**URL:** `kasseapp.com/pricing`

**Headline:** "Pricing that grows with you."
**Subheadline:** "Start free. Add what you need. Never pay for features you don't use."

**Monthly / Annual toggle:**
- Monthly (default)
- Annual (save 20%) → switch updates all displayed prices

**Plan Cards (5 cards, horizontal on desktop, stacked on mobile):**

```
FREE               STARTER          GROWTH           PRO             ENTERPRISE
$0/mo              $49/mo           $99/mo           $179/mo         $349/mo
1 location         1 location       3 locations      5 locations     Unlimited
1 staff            5 staff          15 staff         30 staff        Unlimited
100 transactions   Unlimited        Unlimited        Unlimited       Unlimited
Online booking     Online booking   Online booking   Online booking  Online booking
Basic POS          Full POS         Full POS         Full POS        Full POS
                   Email/SMS        Email/SMS        Email/SMS       Dedicated CSM
                                    Campaigns        Campaigns       Custom terms
                                    Reports          AI Receptionist Priority support
                                                    (200 calls)     Franchise tools
                                                    Payroll         API access

[Start Free]     [Start Trial]    [Start Trial]    [Start Trial]   [Contact Sales]
```

**The most popular badge:** On Growth plan

**Feature comparison table** (expandable — "See full comparison"):
Full matrix with checkmarks per plan for every feature

**Addons section:**

```
ENHANCE YOUR PLAN

AI Receptionist          from $49/month  → handles calls, books appointments
Kasse Color              $39/month       → formula cards, before/after gallery
Kasse Tax Service        $49/month       → payroll tax filing, W2/1099 year-end
Kasse Sites              $29/month       → your own booking website
SMS Pack (1,000)         $25/month       → for campaigns and reminders
Accountant Access        $9/month        → read-only access for your bookkeeper
```

**FAQ:**
- Can I change my plan anytime? Yes — upgrade immediately, downgrade at next billing cycle.
- Is there a contract? No — month-to-month. Annual available for 20% discount.
- What happens at the end of my trial? You'll be asked to choose a plan. Your data is saved regardless.
- Does Kasse take a cut of my revenue? No — Kasse Pay processing fees are flat-rate (2.9% + $0.30 per transaction). Kasse subscription fees are separate.
- Can I cancel anytime? Yes — or freeze your account for $9/month to keep your data without full access.

---

### PAGE 3 — INCUBATOR LANDING

**URL:** `kasseapp.com/incubator`

**Hero:**
```
HEADLINE: The Kasse Founders Program.

SUBHEADLINE:
We invest in 25 service business owners every quarter.
You get 12 weeks of real business education, a peer network,
and the capital access to grow beyond your first location.

[Apply for Cohort 1 →]  (blush #E57F84 button)
Applications close August 1, 2026 · 25 spots · Beauty & Personal Services
```

**How It Works (4 steps):**
```
1. Apply (free, 20 minutes)
   Tell us about your business, your challenge, and where you want to go.
   Every application reviewed by Robert personally.

2. Get accepted (25 spots per cohort)
   If you're selected, you'll onboard to Kasse and join your cohort community.

3. 12 weeks of real business education
   Weekly sessions, vertical-specific curriculum, real data from your business.
   Action items you implement in Kasse, not just theory.

4. Graduate and grow
   Top graduate: funded second location.
   All graduates: lifetime benefits and alumni network.
```

**The Prize (big visual):**

```
────────────────────────────────────────────────────────────────────────────
TOP GRADUATE PRIZE:

A fully structured second location package.
Worth $250,000+. Built for operators who are ready to expand.

○  SBA 7(a) loan facilitation
○  Kasse Capital growth financing
○  Equipment financing
○  Buildout support

THIS IS NOT A GRANT. THIS IS A CAREER-CHANGING PARTNERSHIP.
────────────────────────────────────────────────────────────────────────────
```

**What everyone gets:**
- 12 weeks of live, vertical-specific sessions
- Cohort community of 24 peer operators
- Capital line access at graduation (qualifying participants)
- Kasse Growth plan free for life (worth $1,188/year)
- Processing rate reduction (lifetime)
- Alumni network access (monthly calls, annual event)

**Requirements (be honest here):**
- You own and operate a service business
- You've been in business at least 1 year
- You process at least $5,000/month in revenue
- You can commit 3-5 hours per week for 12 weeks
- You use Kasse (or will start when accepted)

**The application (brief preview):**
- 3 written responses (why you want in, your biggest challenge, your 2-year vision)
- Optional: 60-second video pitch
- No fees, no commitment required

**[Apply Now →]** — large, blush color, full width on mobile

**FAQ:**
- Is there a cost to apply? No.
- Do I have to give up equity? No.
- Do I have to already use Kasse? Not to apply — but you'll need to use it if accepted.
- What if I don't win the top prize? All graduates get the lifetime benefits + capital line access + alumni network. The program is valuable regardless of prize placement.
- When is the next cohort? Cohort 1 starts September 2026.

---

### PAGE 4 — VERTICAL LANDING: SALONS

**URL:** `kasseapp.com/salons`
(Same template used for /barbershops, /gyms, /nail-salons)

**Hero:**
```
HEADLINE: Built for salons, by people who know salons.

SUBHEADLINE:
Formula cards. Commission tracking. Walk-in queue. AI Receptionist.
Everything Square doesn't have.

[Start Free Trial →]     [See How It Works]
```

**Key differentiators for salons:**

```
WHY KASSE BEATS SQUARE FOR SALONS

1. Formula Cards
   Square doesn't track formulas. Kasse does.
   Every color service, every formula, before and after. Your stylists'
   best work, organized and searchable. Clients come back to the exact same result.

2. Real Commission Tracking
   See who's generating what, in real time.
   Commission by service, by retail, by period. No more end-of-week spreadsheet.
   Stylists see their own earnings on their phone.

3. AI Receptionist That Books Appointments
   Answer calls at midnight. Fill last-minute cancellations.
   Reschedule for clients who can't get through. Never miss a booking again.

4. TDLR License Tracking (Texas Salons)
   Automatic license expiry alerts for every stylist.
   Always compliant, never caught off guard.

5. Chemical Service Waivers
   Digital waivers signed on a tablet. Stored permanently.
   No paper, no "I can't find the form from 2022."
```

**Real product screenshots** — specific to salon features:
- Formula card builder
- Commission breakdown per stylist
- Before/after gallery
- TDLR license tracker

**Migrating from Square/Vagaro/GlossGenius:**
```
Already on Square? We'll move your data for free.

Clients, appointments, services, transaction history — all migrated.
Takes about 15 minutes. You pick up right where you left off.

[See How Migration Works →]
```

**Social proof specific to salon owners:**
Real testimonials from salon owners. Not stock photos.

---

### PAGE 5 — COMPARE: KASSE VS SQUARE

**URL:** `kasseapp.com/compare/vs-square`

**Headline:** "Square is a great checkout tool. Kasse is built for your business."

**Comparison table:**

| Feature | Square | Kasse |
|---------|--------|-------|
| Commission tracking | Basic | Full (per service, tiered, per-service rates) |
| Formula cards | ✗ | ✓ |
| Before/after photos | ✗ | ✓ |
| AI Receptionist | ✗ | ✓ |
| Chemical service waivers | ✗ | ✓ |
| License expiry tracking | ✗ | ✓ (TDLR integration) |
| Payroll | Square Payroll (separate $) | Built in |
| Bill pay | ✗ | ✓ |
| Banking | Square Banking | Kasse Banking |
| Booth rent billing | ✗ | ✓ |
| Walk-in queue | ✗ | ✓ |
| Incubator program | ✗ | ✓ |
| Processing fee | 2.6% + $0.10 | 2.9% + $0.30 |
| Software cost | $0-$60/month | $49-$349/month |

**Note on processing fees:** "Kasse's software includes features Square charges separately for or doesn't offer at all. Most salons save $150+/month on total platform cost when switching."

**Migration CTA:** "Switching from Square? Your data comes with you. [See how →]"

---

### PAGE 6 — BLOG

**URL:** `kasseapp.com/blog`

**Content strategy (publish 2× per week):**

**Content pillars:**
1. Business education (the content that drives organic search + builds trust)
   - "How to calculate your salon's real profit margin"
   - "The 7 reasons stylists leave salons (and how to keep them)"
   - "Should you raise your prices? Here's the math."
   - "What is a good rebook rate for a salon?"

2. Product education (converts readers to trial users)
   - "How to set up automated win-back campaigns in Kasse"
   - "How to read your commission report"
   - "Setting up online booking: a complete guide"

3. Incubator content (drives applications)
   - "Meet Cohort 1: 25 salon owners who are building something different"
   - "Week 3 of the Founders Program: what we learned about pricing"
   - "[Owner name]'s story: from $15K to $30K/month in 90 days"

4. Industry news and trends
   - "Texas salon industry outlook 2026"
   - "The rise of AI booking assistants in beauty"

**SEO target keywords:**
- "salon management software" (12,000 searches/month)
- "barbershop appointment app" (4,400/month)
- "salon payroll software" (2,900/month)
- "square alternatives for salons" (1,900/month)
- "salon commission tracking app" (1,200/month)
- "AI receptionist for salons" (800/month)

---

## DESIGN SYSTEM — MARKETING SITE

**Different from the portal** — the marketing site uses a lighter, more editorial design.

**Colors:**
- Background: #FFFFFF (marketing site is white — portal is #FAF8F6)
- Primary text: #2F5061
- Body text: #3D4F58
- Accent: #E57F84 (for CTAs and highlights)
- Section alternates: white / #F4EAE6 (cream)
- Code/feature backgrounds: #EAF4F6 (light teal)

**Typography:**
- Headings: Inter 700 (heavier than portal — marketing needs more impact)
- Body: Inter 400
- Hero: 52-64px
- Section headers: 40px
- Card titles: 20-24px

**No stock photos anywhere.** Only:
1. Real product screenshots from the actual Kasse portal
2. Real photos of real business owners (with permission)
3. Illustrations/icons from the Kasse brand system

**Animations:**
- Hero revenue counter counts up on page load
- Feature cards subtle fade-in on scroll
- Plan cards lift on hover
- CTA buttons have the translateY(-1px) hover from the design system

---

## CONVERSION OPTIMIZATION

### Primary CTA: "Start Free Trial"
- Appears in: navigation (always), hero, every section, footer
- Color: #2F5061 (brand primary — authoritative)
- Goes to: `/signup`

### Secondary CTA: "Apply for Founders Program"
- Appears in: hero (secondary), dedicated incubator section, footer
- Color: #E57F84 (blush — warm, exciting)
- Goes to: `/incubator`

### Exit Intent (for users who linger without clicking):
- If user scrolls past 50% of homepage without clicking a CTA: slide-in at bottom of screen
- Message: "Still thinking? Book a 15-minute demo with a real person."
- Link: Calendly booking link

### Social Proof Elements (shown throughout):
- Number of merchants: "Used by 500+ service businesses" (update as it grows)
- Star rating: "4.9/5 average rating"
- Locations: "Businesses in 12 Texas cities"
- Specific metric: "The average Kasse merchant processes $28,000/month"

### Trust Signals:
- "No credit card required" near every CTA
- Security badges (SSL, PCI compliant) in footer
- "Cancel anytime" near pricing
- "Your data is always yours. Export everything at any time." for data concerns

---

## ANALYTICS AND TRACKING

### Events to track (via Posthog or Mixpanel):
- Page view per page
- CTA click (which CTA, which page, which position on page)
- Signup started (landed on /signup)
- Signup completed (email verified)
- Incubator application started
- Incubator application submitted
- Pricing page view → signup conversion rate
- Blog article view → CTA click rate

### A/B Tests (once traffic exists):
- Hero headline variations
- CTA button text ("Start Free Trial" vs "Get Started Free" vs "Try Kasse Free")
- Pricing page layout (cards vs table)
- Social proof placement (above or below hero)

---

## BUILD NOTES

The marketing site is a **separate Next.js app** from the portal. They share:
- The same Supabase database (for signups)
- The same design token colors
- The same Resend email for transactional emails

They do NOT share:
- Code (separate repo: `lendbucket/kasswebsite` — already exists as `kassewebsite` in Vercel)
- Component library (marketing components are different from portal components)
- Authentication (marketing site is mostly public)

**Current status (per Vercel):**
- `kassewebsite` project exists: `prj_Sx0rZhkMKaWDUIie1bf3PNY0Of7c`
- Also: `kassewebsite-dwmn` and `kassewebsite-1638` — clean these up, keep only one

**Launch checklist:**
- [ ] Real product screenshots (after portal Phase 0 design is complete)
- [ ] Real testimonials from first 5 merchants
- [ ] Blog with at least 5 articles before launch
- [ ] SEO: meta titles and descriptions on every page
- [ ] Sitemap.xml submitted to Google Search Console
- [ ] Google Analytics or Posthog installed
- [ ] Email capture for "notify me when Cohort 1 opens" before incubator officially launches
- [ ] Calendly demo booking link set up (15-min video call with Robert)

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Marketing site should NOT be launched until the portal design system (Phase 0.1) is complete — the screenshots in the marketing site must match the real product.*
