# KASSE_SUPPORT.md
## Support Infrastructure — Complete Specification
### Version 2.0 | Kasse Platform | 36 West Holdings

---

## STRATEGIC PHILOSOPHY

Support is not a cost center. It is the single most powerful retention lever in a SaaS business. Research across SaaS companies consistently shows:

- A merchant who submits a ticket and gets resolved in under 2 hours is more loyal than one who never submitted a ticket — the resolution proves Kasse cares
- A merchant who submits a ticket and waits 48+ hours begins competitor research during that wait
- 42% of SaaS churn is preceded by an unresolved or slow-resolved support ticket in the prior 30 days
- Every $1 spent on proactive support saves $7 in churn-related acquisition costs

**The Kasse Support Stack — Five Layers:**

```
LAYER 1 — Prevention         (UI clarity, good defaults, proactive education)
LAYER 2 — Self-Service       (Help Center, guided tours, in-portal AI)
LAYER 3 — AI Resolution      (Handles 65-70% of tickets without human touch)
LAYER 4 — Human Support      (Tiered by plan, SLA-enforced)
LAYER 5 — Proactive Success  (Outbound from us before they have a problem)
```

---

## SECTION 1 — PREVENTION

The best support ticket is the one that never gets submitted.

### Error State Design

Every error in Kasse follows a strict pattern — never vague, always actionable:

```
INSTEAD OF:   "Payment failed. Please try again."

KASSE DOES:   This card was declined by the issuing bank (insufficient funds).

              Options:
              → Ask client for a different card
              → Collect cash and mark as cash payment
              → Process partial payment + remaining balance later
              → Void this transaction
```

```
INSTEAD OF:   "Cannot create booking. Time conflict."

KASSE DOES:   Jennifer already has an appointment at 2:00 PM (Root Touch-Up, 90 min).
              The time you selected (2:30 PM) overlaps with that appointment.

              Next available for Jennifer: 4:00 PM today, or any time tomorrow.
              → Book at 4:00 PM today
              → View Jennifer's full availability
              → Assign to a different stylist
```

### Empty State Design

Empty states become support tickets when they offer nothing to do. Every empty state in Kasse is actionable:

- No clients yet: "Import from Square → | Import from CSV → | Add client manually →"
- No appointments today: "Clear schedule — open time is an opportunity. Run a same-day availability campaign?"
- No revenue yet: "Let's get your first booking. [Add your services] [Share your booking link]"

### Proactive UI Warnings

Kasse detects issues before they become tickets:
- Expired card on file — banner 7 days before subscription charges
- Stylist license expiring — alert 60 days out
- Low inventory before a heavy booking day — morning alert
- Processing volume limit approaching — alert at 80%

---

## SECTION 2 — SELF-SERVICE

### Help Center — help.kasseapp.com

Complete documentation organized by topic and by vertical. Every article follows an identical format:
1. One-sentence summary of what the article covers
2. Numbered steps with screenshots (auto-updated via screenshot tooling)
3. Short video walkthrough (2–3 minutes, screen recording)
4. "What to do if it didn't work" — common errors and specific fixes
5. Three related articles
6. "Was this helpful?" — thumbs up/down (negative feedback auto-creates content review ticket)

Navigation structure:
```
Getting Started → Appointments & Booking → Clients & CRM → Payments & POS
→ Staff Management → Marketing & Automation → Reports → Integrations
→ Billing & Account → [Vertical-Specific Section] (salon, gym, restaurant, etc.)
```

Search is AI-powered: typing "my client can't book" finds the booking troubleshooting article regardless of exact word match.

### In-Portal Guided Tours

Every major portal section has a multi-step interactive tour:
- Spotlight overlay highlights specific UI element with tooltip explanation
- Auto-launches on first visit (dismissable)
- Re-launchable via "?" button in every section header
- Progress saved (doesn't re-trigger on return visits)
- Onboarding checklist items link directly to the relevant tour

### Setup Completion Score

Dashboard shows percentage complete with specific actionable gaps:
```
PORTAL SETUP: 68% Complete

✓ Services added (8 services)
✓ Staff invited (3 stylists)
✓ Online booking enabled
✗ Booking widget not on website        [Add Now →]
✗ First marketing campaign not sent    [Create →]
✗ AI Receptionist not configured       [Set Up →]

Fully set-up accounts process 3.2x more revenue in their first 90 days.
```

---

## SECTION 3 — AI SUPPORT ENGINE

### Architecture

Built on Claude API (claude-sonnet-4) with a structured system prompt. Context injected per session:
- Merchant name, business name, plan tier, vertical, active addons
- Recent tickets (last 5 with status and resolution)
- Account health score and flags
- Last login date, last transaction date, open disputes
- Current page in portal (from URL context)
- Relevant Help Center articles (retrieved via semantic search on user's query)

**What AI resolves autonomously:**
- "How do I add a staff member?" → walks through exact steps
- "Why wasn't my payout processed?" → checks their payout schedule, checks for holds, explains
- "How do I add a deposit for appointments?" → walks through booking config settings
- "One of my clients says they can't book" → diagnoses: booking enabled? Service set to online bookable? Client blocked? Returns specific finding
- "How do I run a commission report?" → walks through reports section with direct link
- "I processed a payment by mistake" → explains refund flow, walks through steps
- "My payment terminal isn't connecting" → runs hardware troubleshooting tree

**What AI escalates immediately (with full context handed off):**
- "There's a charge on my account I don't recognize" → billing dispute → finance team
- "My funds haven't been deposited and it's been 5 business days" → payout issue → human with Reyna Pay access
- "I want to cancel my account" → retention specialist with authority to offer concessions
- Any message with significant frustration ("this is broken," "I'm done," "I'm switching") → human immediately, skip queue

### The In-Portal Widget

```
┌────────────────────────────────────────────────────────┐
│  Ask Kasse                                    — ✕      │
├────────────────────────────────────────────────────────┤
│  KASSE AI SUPPORT · Available 24/7                     │
│                                                        │
│  Hi Jennifer! I can see you're on the                  │
│  Appointments page. What do you need help with?        │
│                                                        │
│  QUICK ACTIONS:                                        │
│  [Add a staff member]     [Share booking link]         │
│  [Process a refund]       [Set up automation]          │
│                                                        │
│  [Type your question...                   ] [Send]     │
│                                                        │
│  Talk to a person → [Growth plan: Business hours]      │
└────────────────────────────────────────────────────────┘
```

Suggested quick actions are context-aware: on the appointments page, they relate to appointments. On reports, they relate to reports.

**AI Response Format — Always Actionable:**

```
MERCHANT: How do I add a deposit for new appointments?

AI: Appointment deposits protect you from last-minute cancellations. Here's how:

    1. Go to Settings → Booking Configuration
    2. Find "Deposit Requirements"
    3. Choose deposit type: Fixed amount ($25, $50) or % of service (25–50%)
    4. Choose when required: all new clients / all online bookings / services over $X
    5. Click Save

    Deposits are charged at booking and held until the appointment completes.

    [Open Booking Settings →]

    Was this helpful? [👍] [👎]    Still need help? [Talk to a person →]
```

### AI Diagnostic Engine

For technical issues, AI diagnoses using account data — not just documentation:

```
MERCHANT: My client Samantha says she can't book online

AI: I found the issue. Samantha was added to your blocked client list on
    March 14th (marked "no-show x3"). Blocked clients cannot book online.

    Options:
    → [Remove from blocked list] — Samantha can book immediately
    → [Keep blocked, book manually] — create her appointment from staff side
    → [View Samantha's full history] — see complete no-show record first
```

### Proactive AI Interventions

**Stuck user detection:**
- Same page visited 3+ times in 10 minutes without completing an action → widget auto-opens: "Looks like you might be having trouble. Want some help?"
- User spends 5+ minutes on a settings page without saving → "Need help with this setting?"
- Checkout started and abandoned → "Did something go wrong with the checkout?"

**Onboarding gap interventions:**
- Day 5, no services added → push notification: "Your service menu is empty — clients can't book until you add services. Takes 3 minutes."
- Day 10, online booking not enabled → "90% of new Kasse merchants enable online booking in their first week. Yours isn't on yet."
- Day 14, no automation configured → "You're leaving money on the table — win-back campaigns take 2 minutes to set up."

**Risk interventions:**
- Transaction volume significantly higher than usual → "Unusual activity detected — are you aware of [X] transactions totaling $X today?"
- Multiple failed payment attempts on same card → "We've noticed 3 failed charges for [client name] today. Their card may be blocked."
- Refund amount approaching dangerous threshold → "Your total refunds this month are $X. Excessive refund rates can affect payment processing."

---

## SECTION 4 — HUMAN SUPPORT

### The Support Backend — support.kasseapp.com

Completely separate from the merchant portal. Kasse's internal support team uses this exclusively.

**Authentication:**
- Separate from merchant login system
- Role-based access: Agent / Senior Agent / Finance Agent / Technical Agent / Manager / Admin
- MFA enforced for all agent accounts
- Session timeout: 8 hours
- All agent actions logged with IP, timestamp, and what action was taken

**The Queue Interface:**

```
KASSE SUPPORT PORTAL                    Agent: Sarah M.   🟢 Active
═══════════════════════════════════════════════════════════════════

FILTER: [All Tickets ▼]  [All Channels ▼]  [All Plans ▼]  [Unassigned ▼]
SORT BY: SLA Risk ▼                                    ⟳ LIVE FEED

┌─────────────────────────────────────────────────────────────────────────────┐
│ # │ MERCHANT              │ SUBJECT                    │ CH │ TIME  │ SLA   │
├─────────────────────────────────────────────────────────────────────────────┤
│🔴│ Luxe Hair Studio [PRO]│ Payout not received 5 days │ 📧 │ 3h 8m │ ⚠️ 52m│
│🟡│ Marcus's Cuts   [GRW]│ Can't add staff member     │ 💬 │ 1h 14m│ ✓ 6h  │
│🟢│ Sunshine Yoga   [STR]│ How to export clients      │ 📧 │ 22m   │ ✓ 23h │
│🟢│ Brow Bar Austin [PRO]│ Client card won't save     │ 💬 │ 8m    │ ✓ 3h  │
│🟢│ Peak Fitness    [ENT]│ Corporate account question │ 📧 │ 4m    │ ✓ 55m │
└─────────────────────────────────────────────────────────────────────────────┘

Open: 23   Mine: 4   Unassigned: 11   SLA At Risk: 2
```

**Priority Tiers:**
- P1 CRITICAL: Payment processing down, funds not received (SLA: 30-min response)
- P2 HIGH: Account inaccessible, data integrity concern, any Enterprise merchant issue
- P3 NORMAL: Feature not working, how-to questions (Pro/Growth)
- P4 LOW: How-to (Free/Starter), feature requests, general feedback

### The Ticket Detail View — Three-Panel Layout

**LEFT PANEL — Merchant Context (auto-populated):**
- Business name, owner name, email, phone
- Plan tier and billing status (is their card active?)
- Account health score with trend indicator
- Account age, vertical, location count
- Last login timestamp, last transaction date
- Active addons list
- Open disputes or payment holds
- Previous ticket history (last 10 with status and resolution summary)
- Internal notes from prior agents

**CENTER PANEL — Conversation:**
- Full thread (email, chat, or call transcript)
- Agent response box with:
  - AI-suggested response (reviews thread + context, drafts a response)
  - Template library dropdown (pre-written canned responses by category)
  - Formatting tools (bold, bullets, links)
  - Attachment upload
  - Send channel selector: email / in-portal notification / SMS
- Internal notes section (merchant never sees these)

**RIGHT PANEL — Actions:**
- Assign to agent, change priority, change status
- SLA timer with color coding
- Add tags, link related tickets, merge duplicates
- Escalation buttons: Finance / Senior Agent / Technical / Manager
- Account action buttons (role-dependent):
  - Apply credit ($5/$10/$25/$50 preset or custom)
  - Issue subscription refund
  - Extend trial
  - Impersonate account (read-only or full — by role)
  - View in Payroc dashboard
  - Push in-portal notification to merchant
- Close / Resolve / Mark Pending / Waiting on Merchant
- Schedule follow-up task

### Agent Tool Access By Role

**All Agents:**
- View merchant account (read-only)
- Send messages (email, in-portal, SMS)
- Add internal notes
- Tag, close, reopen, reassign tickets
- Access full Help Center library
- See and use AI-suggested responses

**Senior Agent (adds):**
- Apply account credits (up to $50 without approval; over $50 needs manager)
- Issue subscription refunds (current or prior month)
- Extend trial periods (up to 30 days)
- Temporarily enable features for troubleshooting
- Full impersonation mode (can take actions on behalf of merchant)
- View Reyna Pay merchant account (payouts, holds, risk flags)

**Finance Agent (specialized):**
- Full Reyna Pay payout dashboard
- Manual payout initiation (with approval chain)
- Chargeback management
- Refund audit log
- Risk flag review

**Technical Agent (specialized):**
- API request log viewer (see raw API calls merchant's account made)
- Supabase read-only query tool (direct DB lookups)
- Webhook delivery log (see if webhooks fired, if they failed)
- Error log viewer (exact errors merchant encountered)
- Feature flag management per account

**Manager (all of the above, plus):**
- Modify SLA rules
- Override any agent decision
- Full analytics dashboard
- Agent account management
- Canned response library management
- Churn risk dashboard

### AI Co-Pilot for Human Agents

Every agent has an embedded AI assistant in their ticket view:

- "Summarize this ticket" → 2–3 sentence summary of entire thread
- "What's the likely issue?" → diagnoses the root cause using merchant's account state
- "Draft a response" → writes a complete response, agent reviews and sends
- "Is this a known issue?" → searches internal bug tracker and recent tickets for similar reports
- "What did we resolve before for this merchant?" → summarizes prior resolutions
- "Is there anything else I should check?" → proactive account risk review

**Auto-Triage (fires on every new ticket):**
- Reads the message
- Checks merchant context
- Assigns priority (P1–P4)
- Assigns category tags
- Identifies likely issue
- Suggests which team should own it
- Drafts a response for the assigned agent

Result: agents handle 3x more tickets at equal quality.

### Support Channels

**Chat (In-Portal):**
- Growth, Pro, Enterprise plans
- Business hours: 9am–7pm Central M–F; 10am–4pm Saturday
- AI handles after-hours, queues for next business day
- Wait time shown: "Avg wait: 4 minutes"

**Email:**
- All plan tiers (support@kasseapp.com)
- Auto-acknowledged within 5 minutes
- Ticket auto-created from email with full thread attached

**Phone Callback:**
- Pro and Enterprise only (no hold queues — ever)
- Request callback from portal: choose available time slot
- Agent calls at scheduled time
- Calls recorded with consent disclosure

**Dedicated CSM Direct Line (Enterprise):**
- Named CSM has direct Slack DM with merchant owner
- Response within 1 hour during business hours

### SLA Matrix

| Plan | First Response | Resolution Target | Channels | Coverage |
|------|---------------|-------------------|----------|----------|
| Free | 48 hours | 72 hours | Email only | M–F |
| Starter | 24 hours | 48 hours | Email + AI chat | M–F |
| Growth | 8 hours | 24 hours | Chat + Email | M–F extended |
| Pro | 4 hours | 12 hours | Chat + Email + Callback | M–Sa |
| Enterprise | 1 hour | 4 hours | All channels + CSM DM | M–Sa (P1: 24/7) |

**SLA Clock Rules:**
- Starts when ticket created
- Pauses when status = "Waiting on Merchant" (after our response pending their reply)
- Resumes when merchant replies
- Never resets
- Breach: auto-flag to manager + priority bump when < 25% of time remaining

### Canned Response Library

Organized by category, maintained by Support Manager. Each response includes:
- Merge fields: {merchant_name}, {business_name}, {plan_name}, {agent_name}
- Editable sections marked in [brackets]
- Agent-only notes in gray (not sent): "Check payout history before sending this"

Categories: Billing, Payments & Payouts, Technical, Onboarding, Retention, Feature Requests, Escalation, Resolution Confirmation

---

## SECTION 5 — PROACTIVE SUCCESS PROGRAM

### The 30-Day Onboarding Sequence

Every new merchant enters a 30-day automated email + in-portal notification sequence. No human required unless they open a ticket.

**Day 1 — Welcome**
Subject: "Welcome to Kasse — your setup takes 10 minutes"
Content: Welcome, 4 key setup actions with direct deep-links, what's next.

**Day 2 — If no services added**
Subject: "Your clients can't book yet — here's why"
Content: Explanation, direct link to add first service, 90-second video, offer to auto-populate their vertical's starter service menu.

**Day 3 — If staff not invited**
Subject: "Your team isn't on Kasse yet"
Content: Benefits of having staff in system, direct invite link, note to complete own profile if solo.

**Day 5 — Booking link moment**
Subject: "Your booking link is live — share it now"
Content: Big celebration moment, their URL displayed, copy button, QR code download, share templates for Instagram bio, Facebook, Google Business.

**Day 7 — First-week check-in**
Subject: "Your first week — here's what happened"
Content: Stats from first 7 days (bookings received, clients added, revenue processed), one vertical-specific tip, genuine "reply here if you need anything" note.

**Day 10 — Feature discovery (conditional)**
- If 10+ bookings: "Time to put marketing on autopilot"
- If <10 bookings: "Let's get your first clients in the door"
Content: One specific automation to enable based on their setup gaps.

**Day 14 — Review automation**
Subject: "The one marketing thing that takes 2 minutes and makes money while you sleep"
Content: Review request automation — one toggle. "Merchants who enable this average 2.3 new reviews per week."

**Day 21 — Trial ending (if applicable)**
Subject: "Your trial ends in 9 days — here's what you'll lose"
Content: List of active features during trial, assurance that all data is preserved, plan comparison, upgrade CTA.

**Day 28 — Final push**
Subject: "[First name], your Kasse account is expiring"
Content: Urgency, personalized stats ("You've had X bookings and added X clients"), one-time first-month discount (15% off), vertical-specific testimonial.

**Day 30 — Branch**
- CONVERTED: "Welcome to paid Kasse! Here's what's unlocked on [plan]."
- CHURNED: Enter 90-day win-back sequence (see KASSE_RETENTION.md)

### Milestone-Based Interventions

**First booking received:** In-portal confetti + celebration message + "Share the news" CTA (pre-written Instagram caption)

**First $1,000 in revenue:** Dashboard banner, milestone email, upgrade prompt tied to growth milestone

**10th client:** "Time to start thinking about retention" + links to loyalty and win-back setup

**First no-show:** "Want to protect yourself going forward?" + one-click deposit collection enable

**Staff member 1-year anniversary:** Email to owner with that staff member's full year of tracked revenue

### At-Risk Merchant Intervention

Continuous churn risk scoring per merchant:

**Risk Signal Weights:**
- No login 7 days: +10 points
- No login 14 days: +20 points (total)
- No login 21 days: +35 points (total)
- Unresolved support ticket: +20 points
- Plan downgrade: +15 points
- Failed subscription payment: +25 points
- Integration disconnected: +10 points
- No new bookings in 10 days (active merchant): +15 points
- Revenue decline >30% vs prior month: +20 points

**Intervention by Risk Level:**

Low risk (30–50): Automated re-engagement email with vertical-specific tip

Medium risk (50–70): Proactive in-portal activity summary, AI health check offer ("You have 23 clients overdue for a visit — want to send a win-back message?")

High risk (70+): Support team alert for manual outreach, personal-feeling email from CEO, automated call for Starter / human call for Pro/Enterprise

### The Proactive Success Program — Pro and Enterprise

**Enterprise CSM Responsibilities:**

Week 1 (new Enterprise): Welcome call (30 min), screen share onboarding session (60 min), custom setup checklist based on their specific goals

Month 1: Check-in call (15 min), review metrics together, identify top 3 unused features, schedule mini-training

Ongoing monthly: 30-minute business review — Kasse prepares their revenue trend, retention rate, benchmark vs similar merchants, three suggested actions for next month

Quarterly: 60-minute formal review, growth planning (ready for second location? Franchise?), contract renewal discussion near anniversary

**Pro Success Program (lighter):**
Month 1: Named Success Manager welcome email with optional intro call link
Monthly: Automated data-driven business review email (same content as CSM would cover)
Quarterly: Upgrade conversation
Access: Group "Kasse Power Users" monthly webinar

---

## SECTION 6 — SUPPORT ANALYTICS

### Manager Dashboard — support.kasseapp.com/analytics

**Real-Time:**
- Tickets open right now by priority (P1/P2/P3/P4)
- Average current wait time
- Agents online vs capacity
- SLA compliance rate (last 24 hours)

**Weekly:**
- Tickets opened vs closed trend
- Average first response time per agent
- Average resolution time per agent
- CSAT score distribution (1–5 star breakdown)
- AI deflection rate (% handled without human touch)
- Top 10 ticket topics (identifies product gaps)

**Monthly:**
- Tickets per merchant (which accounts generate most support cost?)
- Support cost per plan tier
- Category breakdown: billing / technical / how-to / feedback / feature request
- First-contact resolution rate (% resolved without follow-up needed)
- Escalation rate (% requiring senior agent or manager)
- Churn correlation: % of churned merchants had unresolved ticket in prior 30 days

**Support Cost by Plan (Unit Economics Report):**
```
PLAN        AVG TICKETS/MO  AVG RESOLUTION   COST/MERCHANT/MO  PLAN REVENUE  MARGIN
Free        1.2             24 min           $5.76             $0            -$5.76
Starter     0.8             18 min           $2.88             $49           +$46.12
Growth      0.6             14 min           $1.68             $99           +$97.32
Pro         0.5             12 min           $1.20             $179          +$177.80
Enterprise  0.7             20 min (complex) $5.60             $349          +$343.40
```

Free users are a cost center. Conversion within 90 days justifies the cost. Unconverted free users beyond 90 days should be churned to free support capacity.

### CSAT Collection

After every resolved ticket: 1-click 1–5 star rating + optional comment field
If 1–2 stars: immediate flag to manager, manual follow-up call from manager within 24 hours

Targets: Enterprise > 4.8 | Pro > 4.6 | Growth > 4.4 | Overall > 4.5

---

## SECTION 7 — BUILD PHASES

**Phase 0 (Pre-Launch):** Email inbox (Gmail), Notion help docs (interim), basic Claude AI chat widget, Robert handles all support personally

**Phase 2:** Chat widget deployed in portal, help.kasseapp.com launched (50+ articles), AI with full account context injection, ticket system (Intercom or Linear), first support hire

**Phase 6:** Full support.kasseapp.com backend portal (three-panel ticket UI), AI co-pilot for agents, SLA enforcement, CSAT collection, proactive churn risk scoring, 30-day onboarding sequence automated, team: 3 agents + 1 senior + 1 manager

**Phase 7:** Pro/Enterprise CSM program (first CSM hire), monthly business review automation, milestone interventions, high-risk merchant program

**Phase 10+:** AI handles 70%+ of tickets, team grows at 1 agent per 500 paid merchants, 24/7 coverage for P1 via on-call rotation

---

## SECTION 8 — TEAM STRUCTURE

**First hire (Phase 2, ~Month 4):** Customer Success Specialist — $45,000–$55,000
Responsibilities: all support channels, onboarding calls for Pro/Enterprise, feedback synthesis

**At scale (Phase 6+, ~500 paid merchants):**
- 1 Support Manager
- 2 General Support Agents (Tier 1)
- 1 Senior Agent (complex issues, billing)
- 1 Technical Agent (bugs, integrations)
- 1 CSM (Pro/Enterprise success)

**Scaling rule:** Add one agent per 500 active paid merchants. AI deflection maintains this ratio as volume grows.

---

*Document version 2.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 2 kickoff (support infrastructure build begins)*
