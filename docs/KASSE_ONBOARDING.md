# KASSE_ONBOARDING.md
## Merchant Onboarding System — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## STRATEGIC CONTEXT

The first 72 hours of a merchant's experience on Kasse is the most important. If a merchant takes their first booking, processes their first payment, and has their staff logged in within 72 hours of signing up — they are very likely to still be on Kasse at month 12. If they haven't done any of those things within 7 days — they very likely won't.

This is Time to Value (TTV). Our goal: **TTV under 30 minutes for a solo operator, under 2 hours for a team of 8.**

Every friction point in onboarding that we fail to eliminate becomes a churn vector. A merchant who gets stuck setting up their service menu and never comes back is a merchant we spent money acquiring and got nothing from.

Onboarding is not a feature. It is the feature that unlocks all other features.

**Build Phase:** Phase 0 — the very first thing built alongside the core portal. Every subsequent phase must ship its own onboarding moment (the first time a merchant activates a new feature, they need a guided experience).

---

## THE ONBOARDING FUNNEL

```
Marketing Site (kasseapp.com)
        ↓
"Start Free" — no credit card required
        ↓
Account creation (email + password or Google OAuth)
        ↓
THE 8-STEP WIZARD
        ↓
First Portal Visit — Dashboard with "Next Steps" checklist
        ↓
Day 3 — First check-in email
        ↓
Day 7 — "7 day review" email with usage data
        ↓
Day 14 — Setup coaching prompt
        ↓
Day 30 — "30 day graduation" email
        ↓
Ongoing — Weekly Business Intelligence Digest
```

---

## ACCOUNT CREATION

### Signup form

```
TRY KASSE FREE

No credit card required. Set up in minutes.

Business email:   ___________________________
Password:         ___________________________  (8+ chars)
Business name:    ___________________________
Business type:    [Select your industry ▾]

                  [Start Free Trial →]

By signing up, you agree to Kasse's Terms of Service and Privacy Policy.

Already have an account? [Sign in]
```

**Business type selector** — this is the most important field on the form:

```
WHAT KIND OF BUSINESS ARE YOU?

Beauty & Personal Care
  ○ Hair Salon          ○ Barbershop         ○ Nail Studio
  ○ Spa / Massage       ○ Med Spa            ○ Tattoo Studio
  ○ Lash / Brow         ○ Aesthetics         ○ Tanning Studio

Food & Beverage
  ○ Restaurant          ○ Bar / Nightclub    ○ Cafe / Coffee
  ○ Food Truck          ○ Bakery             ○ Catering

Fitness & Wellness
  ○ Gym / Fitness       ○ CrossFit           ○ Yoga Studio
  ○ Pilates             ○ Martial Arts       ○ Dance Studio
  ○ Personal Training   ○ Chiropractic       ○ Physical Therapy

Automotive
  ○ Auto Detail         ○ Oil Change/Repair  ○ Car Wash

Retail
  ○ Boutique Retail     ○ Online + In-Store  ○ Specialty Retail

Pets
  ○ Pet Grooming        ○ Veterinary         ○ Doggy Daycare

Professional Services
  ○ Photography         ○ Event Space        ○ Cleaning Service
  ○ Tutoring            ○ Childcare          ○ Other
```

Business type selected → VerticalConfig applied → entire experience is now configured for their industry. The wizard they see is not generic — it is specifically designed for their type of business.

After selection:
- Account created
- VerticalConfig loaded
- 14-day free trial started (or free plan if no trial)
- Redirect to onboarding wizard

---

## ONBOARDING ARCHITECTURE

**Authority:** SD-K-003 (vertical-aware), SD-K-019 (HCM foundations v1)

### Branched wizard with save+resume

The wizard branches based on business type and team size. A solo operator sees a condensed 5-step flow; a 10-stylist salon sees the full 8-step path with team onboarding inline.

**State persistence:** Every wizard step saves to `OnboardingSession.stepData` JSONB column. Merchant can leave at any step and resume via emailed `resumeToken` link. Sessions never expire — merchant can return weeks later.

**Branching logic:**

- **Solo (0 staff):** Skip Step 3 (Team) inline; offer in Day-7 email
- **Multi-location:** Step 4 (First Location) becomes "Locations" — add multiple inline
- **Franchise:** Special path with FDD builder + territory + brand standards (ENTERPRISE only)

### Concierge fallback (ENTERPRISE)

ENTERPRISE merchants who haven't completed onboarding within 7 days get an automatic trigger: a dedicated onboarding specialist reaches out via phone + email. Concierge can:

- Complete wizard steps on behalf of the merchant (with audit log)
- Schedule white-glove training sessions
- Hand off to Customer Success Manager once setup complete

Concierge is an ENTERPRISE-tier feature only. PLUS and PREMIUM merchants get self-serve email nudges.

### Payroc KYC — NOT in initial onboarding

**Critical:** Reyna Pay KYC (merchant boarding for Payroc) lives in **Settings → Payments**, NOT in the initial onboarding wizard.

**Reasons:**
- KYC requires sensitive financial documents (EIN, bank account, SSN, voided check or Plaid)
- Many merchants want to evaluate Kasse before committing to payment processing
- KYC review takes 1-3 business days; we don't want onboarding blocked on it
- Cash-only operations are valid until Reyna Pay is activated

The Step 4 in the original wizard ("Take Your First Payment") is preserved but modified: It introduces the option, sets up the basic merchant profile, and links out to Settings → Payments for full KYC submission.

---

## EMPLOYMENT AGREEMENT COLLECTION

**Authority:** SD-K-019 (HCM foundations v1)

When inviting a staff member during onboarding (Step 3 or later via Staff → Add Team Member):

### Template library

Kasse provides pre-built employment agreement templates by state and role:

- **Texas** — Commission Stylist (default for TX salons)
- **Texas** — Booth Rental Agreement
- **California** — Commission Stylist (compliant with AB 5 + AB 2257)
- **New York** — Commission Stylist
- **Florida** — Commission Stylist
- **Illinois** — Commission Stylist
- Generic templates for non-priority states (states 6-50, rolling out before v2)

Each template covers:
- Compensation structure (commission %, tip handling, retail commission)
- Hours and scheduling expectations
- Booth rent terms (if applicable)
- Non-compete clauses (where legally enforceable)
- Tools/products provided vs. employee-supplied
- Termination conditions
- At-will employment notice (where applicable)

### Custom upload

Merchants can upload their own employment agreement PDF or DOCX. Kasse:
- Stores the document securely (S3 + encryption at rest)
- Sends to staff member for e-signature
- Tracks signature status (sent / viewed / signed / declined)
- Stores signed copy + audit log permanently

### E-signature component

**Authority:** SD-K-019

Kasse-built e-signature (not DocuSign or HelloSign). Components:
- HTML canvas signature pad (react-signature-canvas)
- Typed name fallback
- Timestamp + IP address + user agent captured
- Signed document hash stored for tamper detection
- PDF generation with signature embedded
- Audit log entry on every signature event

Legally compliant for non-IRS/non-court employment contracts. Uses ESIGN Act + UETA standards.

---

## THE 8-STEP ONBOARDING WIZARD

The wizard is a separate full-screen experience (not the main portal). Progress is saved after every step so merchants can stop and come back. Email sent if they leave mid-wizard: "Your Kasse setup is waiting — pick up where you left off."

**Visual design:**
- Step counter: "Step 3 of 8 — Tell us about your team"
- Progress bar across top
- Each step: clean, minimal, focused. One task per step.
- Skip option on all non-required steps: "I'll do this later →"
- "Save and continue" auto-saves answers

### Step 1 — Business Profile

```
TELL US ABOUT YOUR SALON

Business name:          [Luxe Hair Studio]
Address:                [123 Main St]
City, State, Zip:       [Corpus Christi, TX 78401]
Phone number:           [(361) 555-1234]
Business email:         [info@luxehair.com]
Website (optional):     [www.luxehair.com]

Logo:                   [Upload logo] or [Skip for now]

Business hours:
  Monday:    [9:00 AM] — [6:00 PM]   ☑ Open
  Tuesday:   [9:00 AM] — [6:00 PM]   ☑ Open
  Wednesday: [9:00 AM] — [6:00 PM]   ☑ Open
  Thursday:  [9:00 AM] — [7:00 PM]   ☑ Open
  Friday:    [9:00 AM] — [7:00 PM]   ☑ Open
  Saturday:  [9:00 AM] — [5:00 PM]   ☑ Open
  Sunday:    [Closed]                 ☐ Open

[Save & Continue →]
```

**What this unlocks:**
- Business profile visible on booking page immediately
- Hours displayed on booking calendar
- Google Business Profile sync can use this data

### Step 2 — Your Services

```
ADD YOUR SERVICES

(Salon version — shows vertical-appropriate service category suggestions)

POPULAR SALON SERVICES — add what you offer:
  ☑ Women's Haircut         $__   Duration: [60 min ▾]
  ☑ Men's Haircut           $__   Duration: [30 min ▾]
  ☑ Balayage               $__   Duration: [3 hrs ▾]
  ☑ Full Color             $__   Duration: [2 hrs ▾]
  ☑ Root Touch-up          $__   Duration: [90 min ▾]
  ☑ Blowout                $__   Duration: [45 min ▾]
  ☑ Highlights             $__   Duration: [2.5 hrs ▾]
  ☑ Keratin Treatment      $__   Duration: [3 hrs ▾]
  ☑ Deep Conditioning Trt  $__   Duration: [30 min ▾]
  ☐ Color Correction       $__   Duration: [4 hrs ▾]
  ☐ Gloss / Toner          $__   Duration: [45 min ▾]
  ☐ Bang Trim              $__   Duration: [15 min ▾]
  ☐ Shampoo + Blowout      $__   Duration: [45 min ▾]

[+ Add custom service]

(Restaurant version shows: Reservations, Walk-in seating, Private dining, etc.)
(Gym version shows: Monthly membership, Class pack, Day pass, Personal training, etc.)

[Save & Continue →]  [I'll add services later →]
```

Services added here become live on the booking page immediately. This is the single most time-sensitive step — without services, there's nothing to book.

**Helpful context shown:**
"Industry average for women's haircut in Texas: $65-$85"
(Pulled from Kasse aggregate data — shows when merchant hasn't filled in price)

### Step 3 — Your Team

```
ADD YOUR STYLISTS

(Salon — each staff member gets their own column on the booking calendar)

  YOU (Owner)
  Name:         [Jennifer Rodriguez      ]
  Role:         [Owner / Stylist         ]
  Photo:        [Upload] or [Skip]
  Commission:   [45%] of service revenue
  [✓ Ready]

  + STYLIST 2
  Name:         [Maria                   ]
  Email:        [maria@luxehair.com      ]  ← Invitation email sent here
  Role:         [Senior Stylist          ]
  Commission:   [45%                     ]
  [Send Invite]

  + STYLIST 3
  Name:         [                        ]
  ...

[Skip — I'll add team later →]  [Save & Continue →]
```

Invitations are sent immediately on "Send Invite." Staff receive email with link to set their own password. Staff profile is created in a "pending" state until they accept the invitation.

**Restaurant equivalent:** Add servers, hosts, kitchen staff — with role-based permission levels
**Gym equivalent:** Add coaches, trainers — with their class certifications

### Step 4 — Take Your First Payment

Collecting payment is the action that generates Reyna Pay processing revenue. We want this activated on Day 1.

```
START ACCEPTING PAYMENTS

Connect Reyna Pay to accept credit cards, debit, tap-to-pay, 
and digital wallets from your clients.

PROCESSING RATES:
  Card Present (in-person):  2.6% + $0.10 per transaction
  Card Not Present (online): 2.9% + $0.30 per transaction

Let's set up your payment account. Takes 5 minutes.

[Start Reyna Pay Setup →]

WHAT YOU'LL NEED:
  ✓ Business EIN or SSN (for verification)
  ✓ Bank account + routing number (for deposits)
  ✓ Business owner's date of birth and last 4 SSN (identity verification)

[I'll set this up later →]
```

The Reyna Pay (Payroc underwriting) setup is embedded inline — merchant doesn't leave Kasse. Standard KYC flow.

Until Reyna Pay is connected, payments cannot be processed online or via POS. Cash can still be recorded.

For merchants who skip: persistent banner in portal: "💳 Payment processing isn't set up yet — [Connect Reyna Pay]"

### Step 5 — Set Up Your Booking Page

```
YOUR BOOKING PAGE IS ALMOST READY

Your clients can book 24/7 at:
  kasseapp.com/book/luxehair  ← live now, already works

CUSTOMIZE IT:

Profile photo / hero image:
  [Upload a photo of your salon →]

Your booking page message:
  [Welcome to Luxe Hair Studio! Book your appointment below.
   Questions? Call us at (361) 555-1234.              ]

Online booking: ● Enabled  ○ Disabled (appointment request only)
New client booking: ● Allow  ○ Existing clients only

Deposit policy:
  ● No deposit required
  ○ Require deposit: ____% or $____

Cancellation policy:
  [Cancellations must be made at least [24 ▾] hours in advance
   to avoid a [50% ▾] cancellation fee.]

[Preview Booking Page →]  [Save & Continue →]
```

Merchant clicks "Preview" → opens their live booking page in a new tab. They see it as their clients will see it. This is often the "wow moment" — the first time it feels real.

### Step 6 — Add Your Branding

```
MAKE KASSE YOURS

Brand color (used on booking page, receipts, and communications):
  [Color picker] — default: #606E74

SMS and email sender name:
  "This is [Luxe Hair Studio] — your appointment is confirmed..."
  Sender name: [Luxe Hair Studio               ]

Receipt footer message:
  [Thank you for visiting Luxe Hair Studio! We appreciate your business.]

Marketing email sender:
  Reply-to: [info@luxehair.com                 ]

[Save & Continue →]  [Skip →]
```

### Step 7 — Import Existing Data

```
SWITCHING FROM ANOTHER PLATFORM?

We'll move all your client history, appointments, and services 
to Kasse automatically. You don't lose a thing.

WHERE IS YOUR DATA NOW?

[Square ▾]         [Vagaro ▾]         [Mindbody ▾]
[GlossGenius ▾]    [Excel / CSV ▾]    [Paper records ▾]
[Something else ▾]

→ Takes 5-15 minutes (automatic import)
→ Your old system keeps working during the transition
→ You can run both in parallel for up to 90 days

[Start Import →]  [Skip — I'm starting fresh →]
```

See KASSE_MIGRATION.md for full import flow.

### Step 8 — Go Live!

```
YOU'RE ALL SET! 🎉

Your Kasse portal is live. Here's what's ready:

  ✅ Booking page: kasseapp.com/book/luxehair
  ✅ 9 services added
  ✅ 3 stylists invited (2 accepted, 1 pending)
  ✅ Payment processing connected (first payout in 2 business days)
  ✅ 847 clients imported from Square
  ✅ Appointment reminders: automated

YOUR NEXT STEPS (optional but recommended):

  → Connect Google Business Profile — add "Book Now" to Google Maps
    [Connect Google →]

  → Activate AI Receptionist — answer calls automatically, 24/7
    [Try Free for 14 Days →]

  → Set up Kasse Color — start tracking color formulas
    [Add Color Studio →]

SHARE YOUR BOOKING LINK:
  kasseapp.com/book/luxehair
  [Copy Link]  [Share on Instagram]  [Share on Facebook]

[Go to My Dashboard →]
```

The last step is a celebration + action prompts + sharing. We want the merchant to share their booking link immediately — that's how they get their first booking. First booking = first payment = retention.

---

## THE 30-DAY SUCCESS SEQUENCE

All automated via Resend. Personalized with actual merchant data from Kasse.

### Day 0 — Welcome (sent 1 hour after account creation)

```
Subject: Welcome to Kasse — Here's everything in one place

Hi Jennifer,

Your Kasse account is live. Here's what you set up:

  ✅ Luxe Hair Studio profile
  ✅ 9 services added
  ✅ Booking page: [link]
  
COMPLETE YOUR SETUP:
  → Add your team (you're set up solo, but you can add stylists)
  → Connect Reyna Pay to accept card payments
  → Import your client list from Square (takes 8 minutes)

Your portal: portal.kasseapp.com
Your booking link: kasseapp.com/book/luxehair

Any questions? Reply to this email — a real person responds.
The Kasse Team
```

### Day 1 — First Booking Prompt

```
Subject: Ready for your first Kasse booking?

Hi Jennifer,

Your booking page is live at:
kasseapp.com/book/luxehair

To get your first booking:
  → Share the link in your Instagram bio
  → Text it to 5 regulars: "I switched to a new booking system!"
  → Add it to your Google Business Profile

PRO TIP: Your first booking usually comes within 24 hours of 
sharing your link. The link does the work — you just have to share it.

[View Booking Page] [Share on Instagram]
```

### Day 3 — Setup Check-In

Personalized based on what they have/haven't done:

If Reyna Pay not connected:
```
Subject: Your payment setup is 5 minutes away

Hi Jennifer, you're set up but not yet connected for card payments.

Right now you can only record cash. 3 million+ transactions happen 
through Kasse every month — we'd love for yours to be next.

[Connect Reyna Pay — 5 minutes →]
```

If no bookings yet:
```
Subject: Day 3 — how's the setup going?

Hi Jennifer,

A few of our most successful Kasse merchants shared what got them 
their first bookings fast:

  "I texted my top 20 clients and said I switched systems.
   8 of them booked through Kasse that day." — Sandra, Dallas TX

Your booking link: kasseapp.com/book/luxehair — it's ready to share.

[View your booking page] [Any questions? Chat with us]
```

### Day 7 — 7-Day Usage Report

```
Subject: Your first week on Kasse

Hi Jennifer,

Here's your first week in numbers:

  Appointments booked:   3
  Revenue processed:     $485.00
  New clients:           1
  Returning clients:     2
  AI receptionist calls: 0 (not activated yet)
  Review requests sent:  2

MOST USED SERVICES:
  Balayage — 2 bookings
  Women's Haircut — 1 booking

WHAT COULD MAKE NEXT WEEK BETTER:
  → You have 23 clients from your Square import who haven't rebooked.
    Want to send them a "We're on Kasse now" text?
    [Send Win-Back Message →]

  → AI Receptionist could answer calls you're missing.
    You had no after-hours calls handled — but that doesn't mean
    no one called. [Try AI Receptionist free →]
```

### Day 14 — Setup Coaching

Triggered if specific setup items are incomplete:

```
Subject: Most Kasse merchants see more bookings after this one thing

Hi Jennifer,

14 days in — congrats! Most merchants who reach day 14 stay for years.

The one thing that makes the biggest difference at this stage:
Connected Google Business Profile.

When your Google listing has a "Book" button, new clients who've 
never heard of you can book directly from Google search.

Salons that activate Google Reserve see an average of 12% more 
new clients in the first 60 days.

[Connect Google Business Profile — 3 minutes →]
```

### Day 30 — Graduation + Revenue Report

```
Subject: 30 days on Kasse — here's what you built

Hi Jennifer,

One month in. Here's the full picture:

  Total revenue:           $2,840.00
  Total appointments:      34
  Average ticket:          $83.53
  New clients:             8
  Returning clients:       26
  Client retention rate:   76%

COMPARED TO YOUR FIRST WEEK:
  Revenue:       +487% (Week 4 vs. Week 1)
  Appointments:  +233%

WHAT'S WORKING WELL:
  → Balayage is your top service (12 of 34 appointments)
  → Jennifer is your highest-earning stylist
  → Automated reminders reduced no-shows from [industry avg 8%] to 3%

WHAT'S NEXT:
  You're on the Growth plan. Pro plan unlocks:
  → AI Receptionist (answer calls 24/7)
  → Multi-location support
  → Advanced analytics

  [Upgrade to Pro — $179/month]  or  [Stay on Growth — you're doing great]

Here's to month 2.
The Kasse Team
```

---

## IN-PORTAL GUIDED TOURS

When a merchant first accesses a new section of the portal (for the first time), a guided tooltip tour activates:

**First visit to Appointments:**
```
WELCOME TO APPOINTMENTS
                              [1/4]
┌──────────────────────────────────────────────────────┐
│  This is your appointment calendar.                   │
│                                                       │
│  Each column is a stylist. Each block is a client.   │
│  Click any empty slot to add a new appointment.       │
│                                                       │
│  [Got it — Next →]                          [Skip tour]
└──────────────────────────────────────────────────────┘
```

**First visit to Clients:**
```
WELCOME TO CLIENTS
                              [1/3]
┌──────────────────────────────────────────────────────┐
│  Every client has a full profile — visit history,     │
│  contact info, notes, formula cards, and more.        │
│                                                       │
│  Click any client to see their profile.               │
│                                                       │
│  [Got it — Next →]                          [Skip tour]
└──────────────────────────────────────────────────────┘
```

Tours are one-time only (stored in localStorage, don't re-show). Merchant can restart any tour from Help → "Restart portal tour."

---

## THE SETUP CHECKLIST (Persistent Until Complete)

A "Setup Your Portal" card appears on the dashboard until all items are complete:

```
COMPLETE YOUR SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Business profile complete
✅ Services added (9 services)
✅ Booking page live
✅ Payment processing connected
✅ First booking received 🎉
✅ Team invited (3 stylists)
⟳ Google Business Profile connected — [Connect →]
○ AI Receptionist activated — [Activate →]
○ Client data imported — [Import from Square →]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETION: 71%   [View all setup steps]
```

Once 100% complete, the card collapses to a small "✅ Setup complete" chip. Never shows again.

---

## ONBOARDING FOR FRANCHISE MERCHANTS

When a franchisee is activated through the Franchise Creator system, their onboarding is different — the franchisor has already configured much of the system.

Franchisee onboarding wizard:
- Step 1: Personal/location information (name, address, phone)
- Step 2: Connect payment processing (their Reyna Pay account — separate from franchisor)
- Step 3: Complete required training modules (gated — cannot proceed past Step 3 until complete)
- Step 4: Customize within brand standards (photos, intro text — within franchisor-allowed bounds)
- Step 5: Go live

Franchise-specific restrictions:
- Cannot change service names (locked by franchisor's brand standards)
- Cannot change price below franchisor's floor
- Cannot add services not on the approved list
- Can upload their own location photos (must meet brand standard guidelines)
- Cannot modify their booking page template (locked to franchisor's design)

---

## ONBOARDING METRICS TO TRACK

**Primary TTV metrics:**
- Time from signup → first booking created (target: < 30 minutes)
- Time from signup → first payment processed (target: < 2 hours)
- % of signups who complete all 8 wizard steps (target: > 60%)
- % of signups who are still active at Day 30 (target: > 55%)

**Per-step drop-off tracking:**
Funnel analysis — what % complete each wizard step:
- Step 1 (Business Profile): 95% expected
- Step 2 (Services): 85% expected
- Step 3 (Team): 70% expected
- Step 4 (Payments): 65% expected ← biggest drop-off, needs optimization
- Step 5 (Booking Page): 80% expected
- Step 6 (Branding): 75% expected
- Step 7 (Import): 55% expected
- Step 8 (Go Live): 90%+ of those who reach it

If any step falls below target → UX investigation + A/B test improvement.

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 0 kickoff (onboarding is day-one work)*

---

## REFERENCES

- **Strategic decisions:** SD-K-003 (vertical-aware), SD-K-019 (HCM foundations), SD-K-032 (Spanish customer surfaces)
- **HCM details:** docs/KASSE_HCM.md (new — created in this PR)
- **State compliance priority:** docs/KASSE_COMPLIANCE.md (new — created in this PR)
- **Schema:** OnboardingSession table (P0.G), Organization.onboardingCompleted field
- **Build phase:** P1 (Phase 1 of build-order)
