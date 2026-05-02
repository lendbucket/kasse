# KASSE_RETENTION.md
## Merchant Retention Systems — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## STRATEGIC CONTEXT

Acquisition is expensive. Retention is leverage. Every merchant we keep for 12 months becomes embedded — their data, their clients, their workflows, their staff's muscle memory, their clients' habits — all tied to Kasse. The cost of switching increases every month they stay. Our retention strategy is not manipulation. It is value delivery so deep that leaving genuinely costs them more than staying.

Every system in this document serves two goals simultaneously:
1. Solve a real merchant problem (give them genuine value)
2. Create switching cost (make leaving painful)

The best retention systems do both. A merchant who freezes their account at $9/month instead of canceling is not locked in against their will — they are genuinely protected because their data stays intact. A merchant who lists their business for sale through Kasse's Business Exchange genuinely gets a higher valuation because their revenue is verified. We win by being genuinely better.

**Build Phase:** Phase 7 (Retention Systems) — after franchise creator, concurrent with advanced AI features
**Dependencies:** Reyna Pay live (for Business Exchange valuation), SalonBacked integrated (for lock-in score), full client data depth from Phase 2-3

---

## RETENTION ARCHITECTURE

### The Merchant Lock-In Score

Every merchant has a Lock-In Score (0-100) calculated continuously in the background. This score is never shown to the merchant directly (it would feel manipulative), but it drives:
- Support priority (higher score = higher priority for human support)
- Churn risk alerts (low score merchants get proactive outreach)
- Upgrade recommendations (score predicts feature value)
- Business Exchange valuation premium (verified deep users get higher multiples)

**Lock-In Score Formula:**

```
Component                    Max Points   Calculation
─────────────────────────────────────────────────────────────────
Data depth
  Clients in system           15          log10(client_count) × 5 (max 15 at 1000+)
  Months of history           10          min(months_active, 24) × 0.4167 (max 10 at 24mo)
  Color formula cards         10          min(formula_count, 500) × 0.02 (max 10 at 500)
  Transaction volume          5           min(lifetime_revenue / 10000, 5)

Platform embedding
  Active automations          8           min(automations_enabled, 8)
  Staff using daily           7           min(staff_active_30d, 7)
  Integrations active         5           count_integrations × 1 (max 5)
  API keys issued             3           min(api_keys, 3)

Ecosystem depth
  SalonBacked modules         8           modules_active × 2 (max 8 at 4 modules)
  Franchise system active     5           binary (0 or 5)
  Kasse Color active          5           binary (0 or 5)
  Business Exchange listed    4           binary (0 or 4)
  Marketplace listing         3           binary (0 or 3)
  Kasse Sites live            3           binary (0 or 3)

Behavioral signals
  Days since last login        7           7 - (days_since_login × 0.1) (decays to 0 at 70d)
  Support tickets (low = good) 3           3 - min(tickets_30d, 3)
  NPS score (if collected)     5           nps / 20 (max 5 at NPS 100)
─────────────────────────────────────────────────────────────────
TOTAL                         100
```

**Score interpretation:**
- 80-100: Deeply embedded. Extremely low churn risk. No intervention needed.
- 60-79: Well embedded. Low churn risk. Monitor for decline signals.
- 40-59: Moderately embedded. Medium churn risk. Proactive engagement recommended.
- 20-39: Lightly embedded. High churn risk. Urgent proactive outreach.
- 0-19: Barely using Kasse. Imminent churn risk. Immediate intervention.

**Churn risk signals that override score:**
- No login in 14+ days → immediate alert (regardless of score)
- Failed payment → payment recovery workflow starts automatically
- Competitor migration initiated from Settings → sales/retention team alert
- Support ticket sentiment analysis negative for 3+ consecutive tickets → escalate

---

## SYSTEM 1 — THE FREEZE ACCOUNT

### Overview

Seasonal businesses (beach towns, ski towns, tax prep, wedding vendors), life-event businesses (owner health event, maternity leave, family emergency), and economic-stress businesses all churn for the same reason: "I can't afford the full subscription when I'm not operating." Freeze removes this reason entirely.

A frozen account at $9/month is infinitely better than a churned account at $0/month because:
1. The merchant comes back (unfreezing is one click vs. re-signing up cold)
2. Their data is intact (no re-entry friction on return)
3. We maintain the relationship (emails, win-back campaigns still possible)
4. We can still sell them addons during freeze (Kasse Color, SalonBacked)

### Freeze Tiers

| Freeze Type | Monthly Price | What's Active | What's Paused |
|-------------|:-------------:|--------------|---------------|
| **Full Freeze** | $9 | Data storage, audit trail, read-only portal access, support access | All bookings, all marketing, AI receptionist, staff logins, client-facing features |
| **Light Freeze** | $19 | Data storage + existing clients can view their history via client portal | New bookings blocked, marketing paused, no new client activity |
| **Revenue Freeze** | $29 | Data storage + payment processing remains active (manual payments only) | Online booking, marketing, automations, AI, staff scheduling paused |

**Full Freeze use cases:** Seasonal closures (holiday shops, summer-only businesses), extended owner leave, business for sale (pause operations while listing)

**Light Freeze use cases:** Remodeling/construction (4-6 week closure), medical leave where owner wants existing clients to still see their history, transition between locations

**Revenue Freeze use cases:** Business owner who wants to continue taking walk-in payments but pause the subscription overhead, pop-up operations

### The Freeze Flow

**Entry Point 1 — Cancel flow:**

When merchant clicks "Cancel Account" from Settings → Billing → Cancel Subscription:

Step 1: Cancellation reason selector:
```
Why are you thinking about leaving?

○ Too expensive
○ Missing features I need
○ Switching to another platform
○ Closing my business
○ Seasonal — not operating right now
○ Other
```

Step 2: If reason is "Seasonal" or "Too expensive" → immediately show Freeze:

```
YOU DON'T HAVE TO LOSE YOUR DATA

We understand — some months just aren't operating months.

FREEZE YOUR ACCOUNT

Your account has:
  ✓ 847 clients with full history
  ✓ 234 color formula cards
  ✓ 3 years of appointment records
  ✓ $287,400 in verified lifetime revenue

Canceling permanently deletes this data after 90 days.
Freezing keeps everything — you unfreeze when you're back.

CHOOSE YOUR FREEZE:

  Full Freeze — $9/month
  Your data stays intact. Nothing else runs.
  Unfreeze anytime with one click.

  Light Freeze — $19/month
  Existing clients can still see their history.
  Great if you're just temporarily closed.

  Revenue Freeze — $29/month
  Keep taking payments. Pause everything else.

[Freeze for $9/month ✓]  [Light Freeze $19]  [Revenue Freeze $29]

[I still want to cancel]
```

Step 3: If any other reason → show freeze more briefly, then address the specific concern:
- "Too expensive" → offer price match, offer downgrade, then offer freeze
- "Missing features" → show feature roadmap, offer to file a feature request
- "Switching platforms" → show Migration Lock report (see Migration doc)
- "Closing business" → show Business Exchange listing option, then freeze

**Entry Point 2 — Proactive detection:**

Trigger conditions for proactive freeze offer:
- Merchant hasn't logged in for 35+ days (sent at day 35, follow up at day 45)
- Recurring seasonal pattern detected (e.g., January activity drops 80% three years in a row → offer freeze proactively in December)
- Failed payment after 3 retry attempts → offer freeze instead of account suspension

Proactive freeze email (subject: "Your Kasse account — options to keep your data safe"):
```
Hi [Name],

We noticed you haven't been active in Kasse recently — 
no worries, life gets busy.

If you're in a slow season or taking time off, 
freezing your account is a smart move:

  ✓ Keep all your data intact
  ✓ Pay only $9/month during downtime
  ✓ Unfreeze instantly when you're back

Your account has 847 clients and 3 years of history.
Don't lose that.

[Freeze My Account for $9/month]

Or if you'd like to chat about your situation:
[Schedule a Call]

The Kasse Team
```

**Entry Point 3 — Self-initiated from Settings:**

Settings → Billing → "Freeze Account" tab always visible as an option, not hidden.

### Freeze State — What the Merchant Sees

When logged in during freeze:

```
[🧊 ACCOUNT FROZEN — Full Freeze — $9/month]
Your account is frozen. Your data is safe.
Unfreeze to restore full access. [Unfreeze Now →]

FROZEN SINCE: January 3, 2025
ESTIMATED RETURN: [Set a return date →] ← optional
NEXT BILLING: February 3, 2025 — $9.00
```

All portal features are read-only. Staff cannot log in. No new bookings taken. Client portal shows "We're temporarily closed — check back soon."

**What still works during Full Freeze:**
- Owner can log in and view (not edit) all data
- Reports are readable (historical only)
- Client export is available (data portability)
- Support chat accessible
- Upgrade/unfreeze flows accessible

### Freeze Reactivation

One-click reactivation:

```
WELCOME BACK!

Unfreezing your account restores everything:
  ✓ 847 clients — all still here
  ✓ 234 color formula cards
  ✓ All appointment history
  ✓ All staff accounts
  ✓ All automations (will restart)
  ✓ Your booking link goes live immediately

Your plan: Pro — $179/month
First charge after unfreeze: [today's date]

[Unfreeze My Account →]

Or schedule unfreeze for a specific date:
[Schedule for ___________]
```

Automations restart from current state (not retroactively). Any scheduled automations that were paused during freeze are rescheduled from the unfreeze date.

### Auto-Freeze Scheduling

Merchant can pre-schedule freezes:

```
SCHEDULE SEASONAL FREEZE

Plan ahead: set your freeze and unfreeze dates now.

Freeze date:      [January 1, 2025]
Unfreeze date:    [March 1, 2025]
Freeze type:      [Full Freeze — $9/month ▾]

You'll pay:
  January:  $9.00 (Full Freeze)
  February: $9.00 (Full Freeze)
  March 1:  $179.00 (Pro plan resumes)

[Schedule Freeze]
```

Reminder email sent 7 days before scheduled freeze with one-click cancel if plans change.

---

## SYSTEM 2 — THE BUSINESS SALE MARKETPLACE (KASSE EXCHANGE)

### Overview

Business ownership transitions are inevitable. Owners retire, relocate, face health crises, or simply want to cash out. When they do, they typically:
1. Find a broker who charges 8-12% and has no idea how to value a service business
2. Struggle to prove their revenue to buyers (no clean financials)
3. The buyer inherits the business and loses all the software data because it's not transferable
4. The new owner starts from scratch on software

Kasse Exchange solves every one of these problems simultaneously. The seller gets a higher valuation. The buyer gets verified data. The new owner inherits a fully operational Kasse account. We retain the merchant account through the ownership transition. We make revenue on the transaction. And we create a marketing channel (every sale brings us a new merchant who is starting their business already on Kasse).

**Domain:** exchange.kasseapp.com
**Build Phase:** Phase 7
**Revenue model:** $299 listing fee + 1% success fee + $49 buyer background check + $299 attorney referral

### The Valuation Engine

The Kasse Business Valuation is the most accurate small business valuation available for service businesses because the revenue data is verified — it came through Reyna Pay.

When merchant initiates a listing:

**Step 1: Valuation calculation**

```
KASSE BUSINESS VALUATION — Luxe Hair Studio, Corpus Christi TX

VERIFIED REVENUE DATA (from Reyna Pay):
  Last 12 months:        $287,400
  Last 24 months:        $541,200
  Last 36 months:        $789,600
  YoY Growth:            +14.2%
  Monthly average (L12): $23,950
  Peak month (L12):      $31,200 (December)
  Trough month (L12):    $17,400 (January)

BUSINESS HEALTH METRICS:
  Client retention rate:  72% (industry avg: 58%)
  Average ticket:         $148
  Active clients (90d):   312
  Staff count:            8 (6 full-time, 2 part-time)
  Kasse Lock-In Score:    84/100

VALUATION METHODOLOGY:
  SDE Multiplier Range:   3.0x — 5.0x
  Revenue Multiplier:     0.8x — 1.5x

VALUATION ESTIMATES:
  Conservative (3.0x SDE):    $718,000
  Market rate (4.0x SDE):     $957,000
  Premium (5.0x SDE):         $1,197,000

RECOMMENDED LISTING RANGE: $900,000 — $1,100,000

Why the premium? Your client retention (72%) is 14 points above
industry average, suggesting a loyal, recurring client base.
Your YoY growth of 14.2% is strong. Buyers pay premiums for
businesses that aren't dependent on owner-stylist relationships.

[Adjust Listing Price] [Proceed to Listing]
```

**Premium multiplier factors** (push toward higher end of range):
- Client retention > 65%: +0.3x
- YoY growth > 10%: +0.3x
- Kasse Lock-In Score > 75: +0.2x (deep data = attractive to buyers)
- Multiple staff (not owner-only revenue): +0.4x
- Franchise system active: +0.5x
- Kasse Color active (formulas = proprietary IP): +0.2x
- No dependency on single staff member: +0.3x

**Discount factors** (push toward lower end):
- Owner is primary revenue generator: -0.5x
- High no-show rate (>10%): -0.2x
- No online presence: -0.1x
- Lease expiring < 2 years: -0.3x
- High staff turnover: -0.2x

### Listing Creation — Full Flow

**Step 1: Basic information**
```
LISTING INFORMATION

Business Name:        ________________________
Display Name:         ○ Show real name  ○ Anonymize until serious inquiry
                      (Anonymized: "Established Hair Salon — Corpus Christi, TX")
Location:             ○ Show city only  ○ Show full address (after NDA)
Asking Price:         $________________________ (suggested: $950,000)
Reason for Selling:   ________________________ (optional, shown to buyers)
```

**Step 2: What's included in the sale**
```
WHAT'S INCLUDED?

Physical assets:
  ☑ All equipment (chairs, stations, shampoo bowls, dryers)
  ☑ Inventory (as of closing date — valued separately)
  ☑ Leasehold improvements (mirrors, lighting, cabinets)
  ☐ Building (no — leased space)

Operational assets:
  ☑ Client list (all 847 clients)
  ☑ Color formula cards (234 formulas)
  ☑ Brand name ("Luxe Hair Studio")
  ☑ Social media accounts (Instagram: 12,400 followers)
  ☑ Phone number and website
  ☑ Google Business Profile (4.8 stars, 312 reviews)

Staff:
  ☑ All staff offered continued employment (not guaranteed)
  ☐ Owner stays on for transition period

Lease:
  ○ 4 years remaining on current lease
  ○ Buyer must qualify with landlord
  ○ Lease transfer: $750 fee (contact landlord)
```

**Step 3: Listing review and publish**

Listing goes through 24-hour Kasse review:
- Revenue data verified against Reyna Pay records
- Listing content reviewed for accuracy
- "Verified by Kasse" badge issued
- Published on exchange.kasseapp.com

### Buyer Experience

**Browsing:**

exchange.kasseapp.com/listings

```
KASSE EXCHANGE

[Filter by: Vertical ▾] [Location ▾] [Price Range ▾] [Revenue ▾] [Verified ▾]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Kasse Verified ✓]
Established Hair Salon — Corpus Christi, TX
Revenue: $280K-$300K/year (verified)        Asking: $950,000
8 staff · 300+ active clients · 4yr lease   YoY Growth: +14%
Listed: 3 days ago                          [Request Info →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Kasse Verified ✓]
Full-Service Day Spa — San Antonio, TX
Revenue: $420K-$450K/year (verified)        Asking: $1,400,000
12 staff · 500+ active clients · 8yr lease  YoY Growth: +8%
Listed: 12 days ago                         [Request Info →]
```

**Inquiry flow:**

1. Buyer clicks "Request Info" → must create Kasse account (or log in)
   - Free buyer account (different from merchant account — no subscription needed)
   - Buyer provides: name, email, phone, LinkedIn, brief statement of intent
   - Optional: current business background

2. Seller receives notification: "You have a new inquiry"
   - Sees buyer profile summary
   - Approves or declines the inquiry

3. If approved: buyer gets city + revenue range revealed
   - Next step: submit LOI (Letter of Intent) or request data room

4. Data room access requires:
   - Signed NDA (digital, within Kasse — DocuSign-like workflow)
   - $49 background check fee (Checkr integration)
   - Background check result visible to seller only (pass/fail)

5. Data room access granted:
   - Full P&L (last 3 years from Kasse reports)
   - Client list summary (demographic breakdown, retention stats — not individual names)
   - Staff breakdown (roles, tenure, commission rates — not personal info)
   - Lease copy (uploaded by seller)
   - Equipment list with approximate values
   - All documents watermarked: "CONFIDENTIAL — Prepared for [Buyer Name] — [Date]"
   - Access log: seller sees every document viewed and when

6. LOI submission:
   - Standardized LOI template
   - Buyer fills: offer price, proposed closing date, contingencies, financing
   - Seller receives, can counter-propose

7. Closing process:
   - Kasse does not handle closing (too complex — that's attorneys and escrow)
   - Kasse provides attorney referral ($299 referral fee to participating law firms)
   - Outside closing process handled by parties' attorneys
   - Seller reports closing date and final price in Kasse to complete listing

8. Account transfer (triggered by seller after closing):

```
TRANSFER ACCOUNT TO NEW OWNER

Sale complete? Transfer your Kasse account to the new owner.

New owner email:     ________________________
New owner phone:     ________________________
Transfer date:       ________________________

What transfers:
  ✓ All client data
  ✓ All booking history
  ✓ All transaction history
  ✓ All color formula cards
  ✓ All staff accounts
  ✓ All automations and settings
  ✓ All integrations

What changes:
  • Billing transfers to new owner's payment method
  • Reyna Pay account re-underwritten under new owner
  • New owner gets full admin access
  • Previous owner loses all access

[Send Transfer Invitation to New Owner]
```

New owner receives email:
"[Seller Name] has initiated the transfer of [Business Name]'s Kasse account to you. Accept transfer and set up your billing to complete."

New owner completes Reyna Pay underwriting (1-2 business days) → account live under new ownership → old owner access revoked → 1% success fee charged.

### Revenue Impact

Per listing example:
- $299 listing fee: collected upfront
- $49 buyer background check × 3 buyers (average): $147
- Attorney referral: $299 (if used)
- 1% success fee on $950,000 sale: $9,500

Total per transaction: ~$10,245

At 10 transactions/year: $102,450 in ancillary revenue
At 100 transactions/year: $1,024,500

And every new owner who inherits a Kasse account stays on Kasse. They're already embedded — their data is there, their clients are there. Retention of that account is near-certain.

---

## SYSTEM 3 — THE ACCOUNTANT ACCESS FEATURE

### Overview

Most small salons, restaurants, and gyms are family businesses. The owner's spouse handles the books. Their CPA needs quarterly data. Their business coach wants to see revenue trends. Right now there's no good way to give these people access without giving them full portal access — which creates security risk and training burden.

Kasse Accountant Access creates a purpose-built, read-only financial access role at $9/month.

### The Accountant Role

**What they can see:**
- All financial reports (revenue by day/week/month/year)
- All transactions (with full detail — date, amount, payment method, client name, service)
- All payroll calculations and payroll reports
- All tip records
- All tax documents (1099s when SalonBacked generates them)
- All gift card liability reports
- Commission reports by staff member
- P&L summary (generated by Kasse)
- Export everything to CSV

**What they cannot see:**
- Individual client contact information
- Appointment notes
- Color formulas
- Staff personal information (email, phone, SSN/EIN — if collected)
- Any setting, configuration, or operational feature

**What they cannot do:**
- Book appointments
- Issue refunds (view only)
- Modify any record
- Message any client
- Change any setting

**Accountant view is a completely separate portal skin** — they see a clean, finance-only interface. No booking calendar, no client list, no services menu. Just reports, transactions, exports.

### Invitation Flow

From Settings → Team → Accountant Access:

```
INVITE AN ACCOUNTANT OR BOOKKEEPER

Give your accountant read-only access to your financial data.
They get their own separate login — they can't change anything.

Invitee email:    ________________________
Display name:     ________________________  (e.g., "Cheryl's Bookkeeping")
Access level:     ○ Full financial read-only
                  ○ Transactions only
                  ○ Payroll only
                  ○ Custom (select specific reports)
Duration:         ○ Ongoing    ○ Tax season only (Jan-Apr)    ○ Until [date]

[Send Invitation — $9/month]
```

Accountant receives email with secure login link. Sets their own password. Logs into finance-only view.

**Audit trail:** Every accountant login, every page viewed, every export performed is logged with timestamp in the merchant's audit trail. Merchant can revoke access instantly from Settings.

**Network effects:** Accountants who access multiple clients' Kasse data become Kasse advocates. When their other clients ask "what should I use for my salon/gym/restaurant?" — the accountant recommends Kasse because they know it, they trust it, the exports match their QuickBooks categories. This is a B2B referral flywheel at $0 acquisition cost.

---

## SYSTEM 4 — THE TAX NEXUS TRACKER

### Overview

Mobile service businesses (mobile hair stylists, mobile massage therapists, mobile notaries, photographers, event staff) often don't realize they're creating sales tax nexus in states where they work. Service businesses that sell physical products (retail salons selling shampoo, gyms selling supplements) may be crossing economic nexus thresholds without knowing it. This creates IRS and state tax authority risk that can be catastrophic for a small business.

Kasse Nexus Tracker automatically monitors all transactions, tracks where money was collected, and alerts merchants when they approach or cross nexus thresholds — before it becomes a problem.

### How It Works

**Transaction location tracking:**

Every Kasse transaction stores:
- Merchant location (their primary business address)
- Service delivery location (if different — mobile services)
- Client billing address (for e-commerce / product sales)
- Product type (service vs. physical goods vs. digital)

**Nexus monitoring:**

Background job runs weekly:
1. Aggregates transactions by state
2. Compares against nexus thresholds by state
3. Applies applicable rules:
   - Physical presence nexus: "You've performed services in Florida 12 times this year"
   - Economic nexus: "Your product sales in Oklahoma total $8,900 — threshold is $10,000"
   - Trailing 12-month window (some states use calendar year)

**Dashboard widget — Nexus Exposure Map:**

```
SALES TAX NEXUS EXPOSURE

Your home state: Texas (you're registered here ✓)

⚠ APPROACHING THRESHOLD:
  Oklahoma — Product Sales
  YTD: $8,900 / $10,000 threshold
  Estimated crossing date: ~3 weeks at current pace
  [Review + Get Guidance]

✅ MONITORED — NO ISSUE:
  Louisiana — Services performed
  YTD: $4,200 / $100,000 threshold (4.2%)

  New Mexico — Product Sales
  YTD: $1,100 / $100,000 threshold (1.1%)

📍 POTENTIAL PHYSICAL NEXUS:
  Florida — 14 mobile service visits this year
  Some states define physical nexus at 15+ days of business activity
  [Review]

[Download Nexus Report (PDF)]  [Connect with a Tax Professional]
```

**Alert thresholds:**
- 80% of threshold → warning notification
- 95% of threshold → urgent alert (email + in-app)
- Crossed threshold → immediate alert + guidance

### Nexus Guidance (not legal advice)

When threshold is approached:

```
NEXUS ALERT — Oklahoma Product Sales

You may be approaching a sales tax filing obligation in Oklahoma.

WHAT THIS MEANS:
Oklahoma requires businesses to collect and remit sales tax on
products sold to Oklahoma buyers once annual sales exceed $10,000.

YOUR CURRENT STATUS:
  Oklahoma product sales (trailing 12 months): $8,900
  Threshold: $10,000
  Estimated crossing: November 14, 2024

RECOMMENDED NEXT STEPS:
  1. Review whether your products are taxable in Oklahoma
     (some services and products are exempt)
  2. Register for Oklahoma sales tax permit (before crossing threshold)
  3. Begin collecting Oklahoma sales tax from Oklahoma buyers

IMPORTANT: This is general information, not legal or tax advice.
Consult your CPA or a sales tax specialist before taking action.

[Find a Sales Tax Specialist] [Dismiss — I'll handle this myself]
```

**Tax professional referral network:**
- Kasse maintains a network of CPA/tax specialists familiar with service business nexus
- Referral fee: $99 from the specialist for warm referral
- Specialists can be granted Accountant Access to the merchant's data for seamless engagement

**Build Phase:** Phase 8 (Integrations) — the data is already collected; this is an analytics layer on top
**Dependencies:** Transaction location data must be captured from Phase 1 forward (add location field to transaction schema early)

---

## SYSTEM 5 — THE SPOUSE / PARTNER ACCESS (ACCOUNTANT ACCESS LIGHT)

Already specified in Accountant Access above. Brief addition:

**"Business Partner" access level** (one step above Accountant):
- Everything Accountant can see
- PLUS: can view operational reports (booking rates, no-show rates, staff performance)
- STILL CANNOT: modify anything, contact clients, change settings
- Price: $9/month (same)

Use case: Business partners who share ownership but one runs operations and one runs finances. Or a working spouse who needs to know everything but can't accidentally change settings.

---

## SYSTEM 6 — PROACTIVE WIN-BACK CAMPAIGNS

### Lapsed Merchant Re-Engagement

When a merchant cancels (actually cancels, not freezes), the data isn't gone immediately. 90-day retention window creates a win-back opportunity.

**Day 1 post-cancel:**
```
Subject: Your Kasse data is safe for 90 days

Hi [Name],

Your account has been canceled per your request. No more charges.

Your data is safely stored for 90 days (until [date]).
You can reactivate anytime during this period and pick up exactly where you left off.

[Reactivate My Account]

If you moved to another platform and it's not working out,
we'll match any competitor's price for your first 3 months back.

The Kasse Team
```

**Day 30 post-cancel:**
```
Subject: 60 days left — your client data is waiting

[Name], you have 60 days left before your Kasse data is permanently deleted.

847 clients. 234 color formulas. 3 years of history.

If you're ready to come back: [Reactivate + First month free]
If you're still unsure: [Let's talk — schedule a call]
```

**Day 75 post-cancel:**
```
Subject: Final notice — 15 days until data deletion

After [date], your Kasse data will be permanently and irreversibly deleted.

This includes:
  • 847 client records
  • 234 color formula cards
  • 3,204 appointment records
  • $287,400 in tracked revenue history

If you want to export your data before it's gone: [Export Now]
If you want to come back: [Reactivate — 2 months free]
```

**Reactivation incentive tiers:**
- Reactivate within 30 days: 1 month free
- Reactivate within 60 days: 2 months free
- Reactivate within 89 days: first month + match any competitor's price for 3 months
- Reactivate after 90 days (new account, data gone): standard pricing, migration from new platform if needed

### Former Merchant Re-Acquisition

For merchants whose data is gone (>90 days post-cancel):

- Keep email address in suppressed-but-monitored list
- Quarterly email: "Kasse has added [major feature] — is now a better time to revisit?"
- If they signed up for a competitor and that competitor has a bad news event (acquisition, price hike, outage): immediate outreach
- "We noticed [Competitor] raised prices — here's what Kasse offers for less"

---

## SYSTEM 7 — EMBEDDED SWITCHING COSTS (FEATURE-LEVEL)

Beyond explicit retention systems, the product itself must create switching costs through genuine value:

### Formula Cards (Salon Vertical)
Kasse Color formula cards are the most powerful lock-in feature for salons. No other platform has a comparable formula management system. After 6 months, a salon has 100-500 formulas stored — a library of proprietary intellectual property that exists nowhere else. The cost of losing these and starting over is not just a software problem — it's a client safety issue. A stylist without formula history risks a bad color result.

Every color formula card increases switching cost by approximately $20 (estimated cost to recreate from memory/notes on a new platform, accounting for time). At 200 formulas: $4,000 in switching cost. This is not artificial lock-in — it is genuine value.

### AI Receptionist Training
The AI receptionist (Phase 5) learns the business's specific preferences over time: which clients prefer which stylists, what time of day gets the most cancellations, how to handle specific repeat callers. This training is in Kasse's database. Moving to a new platform means losing this training and starting the AI from zero. A business that has been running Kasse AI Receptionist for 18 months cannot replicate that trained model on a competitor's platform.

### Business Intelligence History
Kasse's weekly intelligence digest (see Day Ops doc) becomes more valuable over time. The longer a merchant uses Kasse, the deeper the trend analysis, the more accurate the forecasting. "Last year at this time you had 47% more appointment volume — historically April-May is your peak, prepare now" is only possible with multi-year history. New platform = no history = no predictions.

### Client Relationship Scores
The Relationship Intelligence engine (Phase 4) calculates a score for every client — probability of churn, LTV, service preferences, communication style preferences. This score is built from years of interaction data. Cannot be exported or transferred. Starts at zero on any new platform.

### Marketplace Ranking
Kassestylists.com (Phase 6) shows stylist and salon reviews, accumulates ratings over time. Established salons with 100+ reviews and 4.8-star ratings have real marketplace value — this ranking drives new client bookings. Starting over on a new platform means losing the ranking and rebuilding from zero reviews.

---

## RETENTION METRICS — WHAT TO MEASURE

Track monthly:
- Gross churn rate (# cancelled / # active, monthly)
- Net churn rate (# churned minus # reactivated / # active)
- Freeze conversion rate (# who froze vs # who cancelled outright in cancel flow)
- Win-back rate (# reactivated within 90 days / # who cancelled)
- Average Lock-In Score at time of churn (lower score = left earlier than expected)
- Freeze-to-reactivation rate (# who unfroze / # who froze, trailing 6 months)
- Business Exchange usage rate (# listings / # merchants on Pro+ plan)
- Accountant Access attachment rate (# accountant addons / # Pro+ merchants)

**Targets:**
- Gross monthly churn: < 2%
- Freeze conversion in cancel flow: > 35%
- Win-back within 90 days: > 20%
- Annual net churn: < 10% on Pro+, < 20% on Starter

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 7 kickoff*
