# KASSE_VERTICALS_EXPANDED.md
## Vertical Playbooks — Complete Specification for All 20+ Business Niches
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## DOCUMENT PURPOSE

This document is the definitive playbook for every business vertical Kasse will serve. For each vertical, it covers:

1. **Market context** — size, pain points, current software landscape, what they're paying, what they hate
2. **Day-in-the-life operations** — every step of how their business runs daily
3. **Portal configuration** — what their specific Kasse portal looks like (sidebar, dashboard, POS)
4. **Required features** — what must exist before we can serve this vertical
5. **Killer features** — features that will make them choose Kasse over any competitor
6. **Addons relevant to this vertical** — what they will actually buy
7. **Terminology mapping** — what Kasse's universal terms map to in their language
8. **Build phase** — exactly when in the Kasse roadmap this vertical gets built
9. **Regulatory requirements** — licenses, compliance, state-specific rules
10. **Revenue potential** — what this vertical is worth per merchant

---

## VERTICAL 1: SALON & BEAUTY (CORE)

### Market Context
- ~300,000 salon establishments in the United States
- ~$50B industry, growing 2.5% annually
- 80% of salons have fewer than 10 employees
- Average salon revenue: $250,000–$500,000/year
- Current software: Square (35%), Vagaro (18%), GlossGenius (12%), Boulevard (8%), none (15%), other (12%)
- What they pay: $50–$200/month for software + 2.6–2.9% for payment processing
- What they hate: Square doesn't understand salons (no formulas, no chemical service waiver). Vagaro is bloated and hard to use. GlossGenius is beautiful but has no real POS. Boulevard is enterprise-priced and overkill for independents.

### Day-in-the-Life — Full Operational Sequence

**OPENING (8:00–9:00 AM)**

Front desk arrives and opens the Kasse portal. Dashboard shows:
- Today's appointment count (43 scheduled)
- Confirmed vs unconfirmed (38 confirmed, 5 not yet confirmed — system auto-confirmed via SMS but 5 didn't respond)
- Stylists clocked in (6 of 8 checked in — AI receptionist captured 2 late arrivals who texted the business number)
- Inventory alerts: Wella Blondor stock at 18% — reorder threshold hit, purchase order drafted automatically
- Yesterday's no-show: Amanda K. — system sent "we missed you" message, she rebooked for Thursday automatically
- AI Receptionist log: 3 calls handled overnight — 1 new booking captured, 1 appointment rescheduled, 1 question about pricing answered

**MORNING RUSH (9:00 AM–12:00 PM)**

*Client Check-In Flow:*
1. Client walks up — front desk pulls up name in search (instant results as they type)
2. Client profile opens: last visit (60 days ago), service (root touch-up + cut), formula card attached, notes ("allergic to ammonia — always use ammonia-free developer"), balance of $25 gift card, 4.8 relationship score
3. Check-in logged — stylist Jennifer notified via app that her 9am is here
4. If new client: intake form sent to client's phone via QR code at desk — fills out in waiting area before stylist calls them back

*Service Execution:*
- Stylist Jennifer opens client profile on her iPad at the station
- Sees full formula history: every service, every product, every rating
- Today: balayage consultation — client wants to go lighter
- Jennifer opens Formula Card builder:
  - Selects products from existing inventory (auto-deducts from stock when formula saved)
  - Notes target level, starting level, processing time, developer choice
  - Photo taken of hair before service begins (saved to client profile)
  - Allergy check passes (ammonia-free developer already flagged in profile — green checkmark)
- Service runs — timer on tablet for processing time
- After rinse: photo taken of result (saved to client profile, flagged for potential Instagram post)
- Formula card rating: Jennifer rates result 1–5 stars (3 — slightly over-processed, notes for next time)

*Checkout:*
- Jennifer clicks "Check Out [Client Name]" from her tablet
- Services auto-populated from appointment: Balayage ($180) + Toner ($45) + Blowdry ($35)
- Any retail products added (Olaplex No.3 she recommended, $28)
- Total: $288
- Tip screen: suggested amounts (15%=$43, 20%=$58, 25%=$72, custom)
- Client selects 20% — $58 tip for Jennifer
- Saved card on file charged — no card present needed
- Receipt: email (instant) + text (optional)
- Rebooking prompt: "Jennifer has availability in 6 weeks. Book your next appointment?" — client taps date, appointment booked before they leave the chair
- Commission calculation: automatic (Jennifer gets 45% of service + 10% of retail sold today)

**MIDDAY (12:00–2:00 PM)**

- Walk-in arrives — no appointment
- Front desk checks stylist availability in real-time schedule view
- Marcus has 45 minutes free — front desk creates appointment on the fly
- Client gets shorter service (cut only, 30 min) — enters as new client if first time
- Waitlist management: 3 clients on waitlist for canceled slots — auto-notified when slot opens

**AFTERNOON (2:00–6:00 PM)**

- Color corrections (3-hour services) — timer running on multiple clients simultaneously
- Front desk monitors: chair utilization by stylist, revenue running total for day
- Low inventory alert triggered: Olaplex No.6 below threshold — one-tap purchase order to CosmoProf sent
- New consultation: bride-to-be for wedding party package — consultation form filled out in portal, package pricing built custom, deposit collected via card on file

**CLOSING (6:00–7:00 PM)**

- Last appointments complete
- Daily report auto-generated — available in portal AND emailed to owner:
  - Total revenue: $4,230
  - Services: $3,645 | Retail: $585
  - Total tips: $892 (average 24.5%)
  - Commissions owed: Jennifer $834, Marcus $612, Lisa $541, Ashley $389
  - No-shows: 1 ($85 cancellation fee charged)
  - New clients: 4
  - Rebooking rate today: 72%
  - Inventory used vs available: updated automatically
- Cash drawer reconciliation (if applicable)
- Tomorrow's schedule confirmed — automated reminders scheduled to send at 8am and 2 hours before each appointment

**WHAT KASSE HANDLES AUTOMATICALLY (Zero Human Effort Required):**
- Appointment reminders (24hr + 2hr, SMS + email)
- Post-service review request (2 hours after appointment ends)
- No-show follow-up ("We missed you — want to reschedule?")
- Win-back campaigns (clients approaching their typical rebooking interval)
- Inventory reorder alerts and purchase order drafts
- Commission calculations per pay period
- Birthday messages to clients (with booking discount CTA)
- Formula card duplication alert (same formula for same client — AI catches if someone double-enters)
- License expiration alerts for stylists (TDLR renewal reminders)

### Portal Configuration — Salon

**Sidebar Navigation:**
```
KASSE
├── Dashboard
├── Appointments
│   ├── Calendar View
│   ├── Today's Schedule
│   └── Waitlist
├── Clients
│   ├── Client List
│   ├── Relationship Scores
│   └── Win-Back List
├── Stylists
│   ├── Schedule
│   ├── Commissions
│   └── Performance
├── Color Studio (Kasse Color)
│   ├── Formula Library
│   ├── Before/After Gallery
│   └── Formula Analytics
├── Services
│   ├── Service Menu
│   ├── Packages
│   └── Add-Ons
├── Inventory
│   ├── Products
│   ├── Purchase Orders
│   └── Supplier Accounts
├── POS / Checkout
├── Reports
│   ├── Revenue
│   ├── Commission
│   ├── Retail
│   └── Client Retention
├── Marketing
│   ├── Campaigns
│   ├── Reviews
│   └── Gift Cards
├── AI Receptionist
│   ├── Call Log
│   ├── Configuration
│   └── Training
└── Settings
```

**Dashboard Widgets (Salon-Specific):**
1. Today's Revenue (live, ticking up as checkouts occur)
2. Chair Utilization (donut chart — % of chair-hours booked today)
3. Today's Schedule (horizontal timeline by stylist)
4. Alerts Panel (inventory, license expiry, no-shows)
5. Recent Check-Ins (live feed)
6. Top Performer This Week
7. Win-Back Clients (clients overdue for visit — with one-click campaign send)
8. Formula Card Completion Rate (% of color services with formula logged)

### Terminology Mapping — Salon
| Kasse Universal | Salon Language |
|----------------|----------------|
| Staff | Stylists / Technicians |
| Appointment | Service Appointment |
| Client | Guest |
| Service | Service |
| Location | Salon |
| Commission | Stylist Commission |
| Check-In | Guest Check-In |
| Formula | Color Formula |
| Notes | Service Notes |
| Inventory | Product Inventory |

### Killer Features — Salon
1. **Kasse Color** — formula card system with AI-powered adjustment suggestions, before/after photo management, and portfolio building. No competitor has built this properly.
2. **AI Receptionist** — answers calls after hours, books appointments, reschedules, answers FAQs. Independent salons lose 30–40% of leads to voicemail.
3. **Chemical Service Waiver** — digital waiver signed by client before chemical services, stored permanently in client profile with timestamp.
4. **TDLR License Verification** — automatic Texas cosmetology license verification for stylists via Socrata API. Compliance audit-ready at all times.
5. **Formula Analytics** — which formulas are most popular, highest-rated, most photographed. Stylist-level and salon-level insights.
6. **Referral Tracking** — who referred whom. "Sarah has referred 14 clients who have spent a combined $8,400. She has earned $420 in referral credits."

### Required Addons — Salon
- Kasse Color ($39/month) — essential for any color salon
- AI Receptionist ($49–$199/month based on call volume)
- SMS Pack (1,000–5,000 messages)
- Chemical Service Waivers (included in base, enhanced waiver templates available)
- Accountant Access ($9/month) — very common in family-run salons

### Regulatory — Salon
- Texas: TDLR cosmetology salon license (posting requirement), each stylist must have active TDLR license
- Chemical service waiver recommended before any chemical service (relaxers, perms, color)
- Sanitation log recommended (sanitization of tools between clients)
- Kasse tracks: stylist license expiry, waiver completion rates, sanitation log entries

### Build Phase: Phase 0–3 (Core Vertical — First Priority)
**Phase 0:** Wire to real data, basic appointments and POS
**Phase 2:** Color Studio, waiver system, commission engine
**Phase 3:** AI Receptionist, formula analytics, referral tracking
**Phase 3.5:** Migration Center (Square/Vagaro/GlossGenius import)

### Revenue Potential — Salon
- Starter plan ($49) + Kasse Color ($39) + AI Receptionist ($49) + SMS = $137/month minimum
- Growth plan ($99) + full addon stack = $250–$350/month typical
- **Target: 5,000 salons × $250 average = $1.25M MRR from this vertical alone**

---

## VERTICAL 2: BARBERSHOP

### Market Context
- ~70,000 barbershops in the US
- Average revenue: $150,000–$300,000/year
- Current software: Square (40%), book online via text/Instagram (30%), nothing (20%), other (10%)
- Pain point: **Walk-in culture.** Barbershops are fundamentally different from salons — most clients don't book in advance. They show up. The queue management problem is the #1 unmet need in this market.
- What they pay: Most pay almost nothing ($0–$30/month). They're the most price-sensitive vertical.
- What they hate: Being forced into appointment-only systems. Their clients don't want to book — they want to walk in and wait.

### Day-in-the-Life — Full Operational Sequence

**THE WALK-IN QUEUE — Core of Everything**

The barbershop model centers on walk-ins. Traditional model: clients walk in, wait in chairs, barber calls "next." Kasse reinvents this:

*Digital Queue System:*
- Front door has QR code (on window, on door, on small stand)
- Client scans QR → opens Kasse Queue page on their phone
- Enters name + service selection
- Sees: "3 people ahead of you. Est. wait: 25 minutes"
- Receives SMS when they're 2 spots away
- Can wait anywhere (car, coffee shop next door, etc.)
- When their turn: SMS "You're next! Head on in."

*The Queue Board (TV Display at Front of Shop):*
- Large display visible to everyone in the shop
- Shows: Current in chair (name + service + time in chair), Next up (name + wait time), Queue list (names, estimated waits)
- Barbers use their phone/tablet to mark services complete → queue auto-advances → SMS fires to next client
- Completely hands-free for barbers once set up

**HYBRID MODEL (Walk-In + Appointment)**

Some clients are regulars who want their spot guaranteed:
- Regular clients can book specific barber, specific time
- Appointments slot into the queue calendar alongside walk-ins
- System shows barber availability accounting for both appointment block AND walk-in pace

**MORNING OPENING**

- Barber owner opens portal → sees today's appointments (always fewer than a salon)
- Turns on walk-in mode for all chairs
- Open queue begins accepting walk-ins

**DURING THE DAY**

- Walk-in arrives → scans QR or front desk adds to queue
- 4 clients in queue, 3 barbers active
- Estimated waits calculated based on average service time per barber
- Barber completes cut → marks done → next client called via SMS
- Checkout: services charged, tip selected, paid on client's phone or at counter
- Commission calculated per barber automatically

**BOOTH RENT MODEL (vs. Commission)**

Most barbershops use booth rent, not commission:
- Barbers pay $X/week to rent their chair
- Barbers keep 100% of their earnings
- Kasse tracks both: commission model AND booth rent model
- For booth rent: barber self-manages their bookings within Kasse, Kasse collects rent payment weekly via ACH from barber's bank account, owner sees all rent payments in dashboard

**CLOSING**

- Queue closes (set time or manual "closed" toggle)
- End-of-day report: total haircuts by barber, revenue, average service time, queue wait times, no-show rate, peak hour
- If booth rent: generate booth rent invoice for each barber (auto-collect if ACH set up)

### Portal Configuration — Barbershop

**Sidebar Navigation:**
```
KASSE
├── Dashboard
├── Queue (THE primary view)
│   ├── Live Queue Board
│   ├── Queue Settings
│   └── QR Code Manager
├── Appointments (Secondary — for recurring clients)
├── Clients
├── Barbers
│   ├── Schedule
│   ├── Commission / Booth Rent
│   └── Performance
├── Services
├── POS / Checkout
├── Reports
└── Settings
```

**Dashboard — Barbershop Specific:**
- LIVE QUEUE widget (biggest element — 4 cards showing each chair: barber name, current client, time in chair, progress bar)
- Wait time gauge (current average wait — green <15min, yellow 15–30min, red >30min)
- Today's cuts by barber
- Peak hour tracker

### Terminology Mapping — Barbershop
| Kasse Universal | Barbershop Language |
|----------------|---------------------|
| Staff | Barbers |
| Appointment | Booking |
| Walk-In | Walk-In |
| Queue | The Wait List |
| Commission | Split / Booth Rent |
| Location | The Shop |
| Client | Client / Customer |

### Killer Features — Barbershop
1. **Digital Queue + TV Board** — the single feature no competitor has built properly for barbershops. This alone wins the market.
2. **Remote Queue Join** — clients join the queue from their car or a nearby restaurant. They get their spot without sitting in the shop.
3. **Booth Rent ACH Collection** — automatic weekly booth rent collection. Barbers never forget to pay; owners never have to ask.
4. **Wait Time Prediction** — AI learns each barber's average service time and predicts wait times accurately.
5. **Barber Profiles + Marketplace** — each barber gets a public profile showing their work, specialty, availability, and reviews. Clients book their preferred barber.

### Build Phase: Phase 4 (Second Vertical)
Queue system is architecturally different from appointment booking — needs separate build.
**Phase 4 Deliverable:** Queue module, TV board display, booth rent billing

---

## VERTICAL 3: RESTAURANT & FOOD SERVICE

### Market Context
- ~1 million restaurant locations in the US
- Average revenue: $500,000–$2M/year (full service); $300,000–$800,000 (fast casual)
- Current software: Toast (22%), Square for Restaurants (18%), Aloha/NCR (15%), Lightspeed (8%), Clover (12%), other (25%)
- What they pay: $150–$500/month for POS + 2.5–3% processing + $50/month for online ordering + $30/month for reservation system = $400+ total
- What they hate: Running 4–6 different systems (POS, reservations, online ordering, delivery, marketing, payroll) that don't talk to each other. Toast is expensive. Square doesn't have table management. Reservations are a different app. It's chaos.

### Day-in-the-Life — Full Operational Sequence

**PRE-SERVICE SETUP (2:00–4:00 PM for dinner service)**

Manager opens Kasse → Dashboard shows:
- Tonight's reservations: 47 covers, 12 parties across 8:00–9:30pm peak
- Walk-in capacity: 18 tables, current floor plan status
- Staff scheduled: 4 servers, 2 bussers, 1 host, 3 kitchen
- 86 List: What's unavailable tonight (lingcod, truffle fries — logged by kitchen manager)
- Online orders pending pickup: 3 DoorDash, 1 Uber Eats (all being prepped)
- Low inventory alert: fish tacos (5 orders remaining before out of stock — auto-flagged)

*Floor Plan Configuration:*
Manager opens floor plan (drag-and-drop table layout matching actual restaurant):
- Tables labeled: 1–40 (indoor), P1–P8 (patio)
- Capacity per table: customizable (2-top, 4-top, 8-top, communal)
- Current status: Available (green) / Reserved (blue with party name + time) / Occupied (orange with timer) / Needs cleaning (red with timer)
- Drag reservations onto specific tables to pre-assign

**SERVICE — HOST OPERATIONS**

Walk-in arrives:
1. Host opens Kasse host view on podium iPad
2. "Table for 4, do you have a reservation?" — searches name (no reservation found)
3. Checks floor plan — no 4-tops available, 20-minute wait
4. Adds to waitlist: name + phone + party size
5. Walk-in gets SMS: "You're #3 on the waitlist at Rustico. Est. wait: 20 min. We'll text when your table is ready."
6. Walk-in leaves — goes to the bar, walks outside
7. 18 minutes later: table turns, host taps "Seat [Name]" → auto-SMS: "Your table is ready at Rustico!"
8. Walk-in comes back — seated → table status changes to Occupied, timer starts

Reservation arrives:
1. Host finds reservation by name — 7:30pm, party of 6, anniversary noted
2. Sees table assigned (already pre-staged for anniversary — note visible)
3. Checks in — "Seated" tap → table turns orange with timer
4. Kitchen alerted: "Table 14 seated — 7:32pm"

**SERVICE — SERVER OPERATIONS**

Server takes order using Kasse on handheld device:
- Opens table number
- Builds order: appetizers, entrées, drinks
- Mods applied: "no onions on the burger," "sauce on the side"
- "Fire apps to kitchen" — instant KDS ticket
- "Hold entrées" — sends to KDS as on hold until server fires them
- Specials entry: tonight's specials pre-programmed by manager, show as options on server view
- Customer asks about allergens: each menu item has allergen tags (gluten, dairy, nuts, shellfish) — server taps item → full allergen info
- Bar items: sent to bar KDS simultaneously with food order

**SERVICE — KITCHEN DISPLAY SYSTEM (KDS)**

The kitchen display is Kasse KDS — a touchscreen display on the kitchen line:
- Each ticket shows: table number, party size, items ordered, modifiers, time ticket was received, timer since ticket opened
- Color coding: white (<5 min), yellow (5–10 min), orange (10–15 min), red (>15 min)
- Ticket types: Dine-In / Pickup / Delivery clearly labeled
- DoorDash and Uber Eats orders appear on SAME KDS — one screen for everything
- Kitchen marks items ready: individual item bump (just this item done) or full ticket bump
- When full ticket bumped: server gets notification "Table 14 food is up"

**PAYMENT & CLOSE**

Server initiates checkout:
1. Table bill pulled up — everything ordered is there
2. Split bill options: split evenly, split by item, separate checks (each person pays for their own items)
3. Each person's card/phone collected → separate payment per check
4. Tip: percentage options on screen, or customer enters custom
5. If party of 8+: auto-gratuity option (18% added automatically — configurable)
6. Bill closed → table status changes to "Needs Cleaning" → timer starts

**BAR OPERATIONS**

Bar has its own Kasse view:
- All drink orders from servers appear here
- Walk-up bar customers: direct tab creation
- Tab opened on card swipe — customer name or last 4 digits
- Drinks added throughout the night
- Tab closed when customer ready to leave
- Happy hour: time-based pricing rules (4pm–6pm: 50% off draft beer — automatic price rule active)
- Drink inventory tracking (optional): number of beers poured, shots counted

**END OF DAY**

- Close out all tabs
- Cash drawer count
- Batch close credit card terminals
- Daily report:
  - Total revenue by category (food, drinks, dessert, takeout)
  - Revenue by server (who sold the most, what's their average check size)
  - Revenue by table (which tables turn fastest, which are the highest value)
  - Tip pool calculation (total tips distributed per agreed tip pool policy)
  - Average party size, average check size
  - Peak hour analysis
  - Waste/comp log (what was comped tonight, reason, manager who approved)
- Inventory deduction: recipe-based — 20 burgers sold = deducts: 20 buns, 20 patties, 20 portions of fries, 20 pickle portions

**ONLINE ORDERING**

Kasse Online Ordering page (embeddable on their website, standalone link):
- Full menu with photos, descriptions, dietary tags
- Customer selects items → checkout → pickup time or delivery
- Payment processed via Reyna Pay
- Order appears on KDS with "ONLINE ORDER" label
- SMS confirmation sent to customer with pickup ETA
- DoorDash integration: restaurant sets whether DoorDash orders appear in Kasse or not

### Portal Configuration — Restaurant

**Sidebar Navigation:**
```
KASSE
├── Dashboard
├── Floor Plan (LIVE)
│   ├── Table Status
│   ├── Reservations
│   └── Waitlist
├── Orders (live during service)
├── Menu Management
│   ├── Menu Items
│   ├── Modifiers
│   ├── 86 Manager
│   └── Specials
├── Kitchen Display
│   └── KDS Configuration
├── Online Ordering
│   ├── Orders
│   └── Settings
├── Delivery Integrations
│   ├── DoorDash
│   ├── Uber Eats
│   └── GrubHub
├── Reservations
│   ├── Reservation Book
│   ├── Waitlist
│   └── Settings
├── Staff
│   ├── Server Assignments
│   ├── Tip Distribution
│   └── Performance
├── Inventory
│   ├── Ingredients
│   ├── Recipes
│   └── Waste Log
├── Reports
│   ├── Revenue
│   ├── Server Performance
│   ├── Table Analytics
│   └── Comps & Voids
└── Settings
```

**Dashboard — Restaurant Specific:**
- Live floor plan (miniature view — every table's status at a glance)
- Tonight's covers (reservations + actual seated so far)
- Revenue ticker (live)
- Active KDS alerts (any tickets over time threshold)
- 86 list (quick view — what's unavailable right now)
- Online order queue (pending pickup or delivery orders)

### Killer Features — Restaurant
1. **Unified KDS** — DoorDash, Uber Eats, dine-in, and online orders on ONE screen. Cooks never look at two screens.
2. **Floor Plan Builder** — drag-and-drop table layout that matches their actual restaurant. Visual status at a glance.
3. **Party Waitlist + SMS** — guests leave without waiting; get texted when table is ready. Reduces walkouts.
4. **Tip Pool Calculator** — configurable tip pool rules (% to bussers, runners, bar). Calculated automatically.
5. **Recipe-Based Inventory** — selling menu items automatically deducts ingredients. True food cost tracking.
6. **86 Manager** — one tap to 86 an item. Updates all menus (in-person, online, delivery) simultaneously.

### Build Phase: Phase 9 (Second Industry — After Salon Dominance)
Restaurant requires: KDS display system, floor plan engine, online ordering, delivery integrations, reservation system. Major build.

---

## VERTICAL 4: GYM & FITNESS STUDIO

### Market Context
- ~41,000 health clubs and gyms in the US
- Average revenue: $500,000–$5M/year (depends heavily on size)
- Current software: Mindbody (30%), Pike13 (10%), Zen Planner (10%), ClubReady (8%), ABC Fitness (15%), other/spreadsheets (27%)
- What they pay: $125–$500/month for gym software + 2.5–3% processing
- What they hate: Mindbody is expensive, complex, and their interface is stuck in 2012. Most alternatives lack member management depth. None of them have a good front desk check-in experience.

### Day-in-the-Life — Full Operational Sequence

**MORNING (5:30 AM — Pre-Opening)**

Manager app view:
- Today's 6am CrossFit class: 18/20 registered, 2 waitlisted
- Membership renewals today: 4 members billing today — all payment methods verified (no expired cards)
- New lead from yesterday's free trial inquiry: Jordan M. — followed up with automated email sequence, trial class scheduled for Saturday

**MEMBER CHECK-IN (Throughout the Day)**

*Method 1 — QR Code (Client App):*
- Member opens Kasse Client App
- Taps "Check In" → QR code appears
- Staff scans at front desk OR auto-scanner at turnstile reads it
- Check-in logged instantly
- If member's account has a hold, payment failure, or expired agreement: staff gets instant alert, member prompted to resolve

*Method 2 — Key Fob:*
- Member taps fob at door reader
- Check-in logged
- NFC fob issued at signup ($15, one-time)
- If fob lost: deactivated in Kasse, new fob issued

*Method 3 — PIN:*
- Member enters 4-digit PIN at keypad
- Check-in logged
- PIN assigned at signup, changeable in client app

*Method 4 — Staff Lookup:*
- Staff searches member name or phone number
- Quick check-in tap

**NEW MEMBER ENROLLMENT (Front Desk)**

Walk-in wants to join:
1. Staff opens "New Member" flow in Kasse
2. Enters: name, email, phone, emergency contact, date of birth
3. **PAR-Q Form** (Physical Activity Readiness Questionnaire): displayed on iPad, member fills out and signs digitally
4. **Photo taken**: iPad camera captures member photo (used for check-in face verification and account)
5. **Liability Waiver**: displays full waiver text, member initials each page, signs digitally — timestamped and stored permanently
6. **Membership Selection**: visual comparison of membership options with features and pricing
7. **Payment Method**: card entered (stored via Reyna Pay tokenization), billing date set
8. **Access Method Selected**: QR code (free) or key fob ($15, charged immediately)
9. **Welcome Flow**: member receives welcome email with class schedule, app download link, member guide PDF
10. **Kasse Client App**: member scans QR code from welcome email → account linked → check-in enabled

Total time: 8–12 minutes. Completely paperless.

**CLASS MANAGEMENT**

*Pre-Class (Instructor View):*
- Instructor opens Kasse on their phone
- Today's 9am Spin class: 15 registered, 2 waitlisted, 1 new member (first class badge shown)
- Can see who's checked in for this class already (members who checked into the gym + registered for this class)
- Mark class started

*During Class:*
- Attendance auto-captured (registered + checked-in = attended)
- Instructor can mark no-shows
- Waitlist: if a registered member is marked no-show 5 minutes before class, waitlist auto-notified: "Spot opened in 9am Spin — tap to claim within 5 minutes"

*After Class:*
- Class marked complete
- Attendance log saved
- If class was in-person AND livestreamed: virtual attendees tracked separately (Phase 2 feature)

**PERSONAL TRAINING OPERATIONS**

PT session booking:
- Client books PT session through Kasse (specific trainer selected)
- Pre-session: trainer reviews client's history (past sessions, goals, progress measurements)
- During session: trainer logs on tablet:
  - Exercises performed (from searchable exercise library)
  - Sets, reps, weight for each exercise
  - Time on cardio equipment
  - Notes ("client struggling with shoulder ROM — modify overhead press")
- Post-session:
  - Session log saved to client profile
  - AI generates workout program: "Based on today's session and client goals, here's a suggested 4-week progression plan"
  - Auto-message to client: "Great session today! Here are your exercises for the week."
  - Next session booking prompt

**MEMBERSHIP MANAGEMENT**

*Front Desk Dashboard — Membership View:*
```
ACTIVE MEMBERS: 342
FROZEN MEMBERS: 28
EXPIRED (Grace Period): 7 — ACTION NEEDED

BILLING TODAY: 14 members
  ✓ 11 processed successfully
  ✗ 2 failed — card declined — ACTION NEEDED
  ⏳ 1 pending

MEMBERSHIP BREAKDOWN:
  Monthly ($49/mo): 189
  Annual ($449/yr): 87  
  Class Pack (10x): 41
  Day Pass (today): 6
  Corporate (Acme Co.): 19
```

*Expired / Delinquent Member Flow:*
- Card declines → instant email/SMS to member: "Your card was declined — update your payment method to keep your membership"
- Member can update via link in message (no portal login required)
- Second attempt automatically after 3 days
- If still failed after 7 days: membership suspended, access revoked, final email sent
- If member updates card: immediately re-charges, access restored

*Membership Pause:*
- Member requests pause (vacation, injury, surgery)
- Staff sets pause period: start date, end date
- Billing paused for that period
- Access still works during pause (configurable — some gyms allow access, some don't)
- Billing automatically resumes on resume date
- Member gets confirmation email

**CORPORATE MEMBERSHIP MANAGEMENT**

Acme Corporation has a corporate account:
- HR contact at Acme manages a list of eligible employees
- Acme pays monthly invoice for all active employees
- Employee uses Kasse Client App — selects Acme as employer during signup
- HR sees dashboard of which employees are active, checking in regularly
- If employee leaves Acme: HR deactivates them, billing adjusts

### Portal Configuration — Gym

**Sidebar Navigation:**
```
KASSE
├── Dashboard
├── Members
│   ├── Member Directory
│   ├── Active / Frozen / Expired
│   ├── Check-In History
│   └── Delinquent Members
├── Classes
│   ├── Class Schedule
│   ├── Attendance Reports
│   └── Waitlist Management
├── Personal Training
│   ├── PT Sessions
│   ├── Client Programs
│   └── Trainer Performance
├── Memberships
│   ├── Membership Plans
│   ├── Billing
│   └── Corporate Accounts
├── Front Desk
│   ├── Live Check-In View
│   └── Enrollment
├── Waivers & Forms
│   ├── PAR-Q
│   ├── Liability Waiver
│   └── Medical Clearance
├── Inventory (Retail)
│   ├── Supplements
│   ├── Apparel
│   └── Equipment
├── Reports
│   ├── Membership Revenue
│   ├── Class Fill Rates
│   ├── Attendance Trends
│   └── Retention Analysis
└── Settings
```

### Killer Features — Gym
1. **Multi-Method Check-In** — QR, fob, PIN, or face. Members never wait at front desk to check in.
2. **Corporate Membership Dashboard** — HR manages employee gym memberships without calling anyone.
3. **PT Program Generator** — AI builds a 4-week progression program from the session log. Trainers look incredibly professional.
4. **Class Waitlist Auto-Claim** — no-show 5 minutes before class → waitlist member gets 5-minute window to claim the spot.
5. **Member Health Score** — "This member hasn't checked in in 14 days. 73% of members who miss 14+ days cancel within 60 days." → one-click win-back message.

### Build Phase: Phase 9 (Alongside Restaurant)
Membership billing is already in Kasse core. Class scheduling shares architecture with appointments. Key additions: check-in hardware integration, PAR-Q forms, PT session logging.

---

## VERTICAL 5: MED SPA

### Market Context
- ~8,000 med spas in the US; fastest-growing aesthetic segment (15% annually)
- Average revenue: $1.5M–$4M/year
- Current software: Meevo (25%), Aesthetic Record (20%), PatientNow (15%), Boulevard (10%), other (30%)
- What they pay: $200–$600/month for software
- What they hate: Medical-grade documentation is required but generic spa software doesn't support it. HIPAA compliance is unclear. Injection mapping, lot number tracking, informed consent management — nobody does it right.

### The Critical Difference — Medical vs Cosmetic

Med spas are hybrid businesses: cosmetic services (facials, waxing) + medical services (Botox, filler, laser, chemical peels, PRP). The medical services require:
- Physician or NP/PA supervision in most states
- Informed consent specific to each procedure
- Lot number tracking for injectables (FDA compliance)
- Treatment documentation (injection sites, units used, product used)
- Good Faith Exam documentation (physician assessment before treatment)

Kasse handles ALL of this.

### Day-in-the-Life — Med Spa

**PRE-APPOINTMENT**

Patient books Botox consultation online:
- Kasse sends pre-appointment packet automatically:
  - Medical intake form (health history, current medications, contraindications)
  - Consent forms (specific to treatment type — Botox consent has different content than filler consent)
  - Before-photo authorization
  - HIPAA acknowledgment
- Patient completes forms on their phone before arriving
- When patient arrives: all forms are complete and in their file

**INTAKE AT FRONT DESK**

- Patient arrives → check-in → staff opens profile
- Forms status: "All intake forms complete ✓"
- Medical history flagged items: "Patient reports blood thinner use — flag for provider review"
- Staff confirms day-of payment method or collects deposit

**PROVIDER TREATMENT ROOM**

Provider (NP Samantha) opens patient profile:
- Reviews medical intake flags
- Reviews treatment history: has had Botox twice before — previous units, sites, results
- **Good Faith Exam** documentation: provider notes examination findings, confirms patient is appropriate candidate for today's treatment
- Opens **Treatment Log**:
  - Selects procedure: Botox — Frown Lines
  - Product: Botulinum Toxin Type A (Allergan BOTOX Cosmetic)
  - **Lot Number**: scanned from vial (barcode scan OR manual entry) — lot number stored for FDA traceability
  - Expiration date: auto-flagged if expired
  - Units: 20 units total
  - **Injection Mapping**: on a face diagram, provider marks exactly where each injection was placed and how many units (interactive face diagram — pinch areas, enter units)
  - Notes: "Patient expressed concern about brow drop. Conservative dosing chosen. Follow-up 2 weeks."
  - Before photo: taken on iPad, stored to patient profile
  - Consent signature: patient signs on iPad in treatment room (witnessing signature)

**POST-TREATMENT**

- After photo taken (optional — patient consents)
- Provider marks treatment complete
- Automatic post-care instructions sent via SMS: "Thank you for your visit! Here are your Botox aftercare instructions: [link]"
- Follow-up appointment recommended: "Your next touch-up is typically in 3–4 months. Schedule now?"
- Loyalty points added for treatment
- Before/after auto-saved to gallery (if consent given)

**FRONT DESK — CHECKOUT**

- Provider completes treatment note → triggers checkout
- Services billed: Botox 20 units @ $13/unit = $260
- Additional retail: Alastin TNS serum ($180)
- Payment: card on file, split payment (HSA card for medical portion, credit card for retail)

**INVENTORY — INJECTABLE MANAGEMENT**

Injectables are expensive and tightly regulated:
- Lot number tracking: every vial entered with lot number, expiration, units per vial
- Wastage tracking: if a 100-unit vial is partially used, remaining units tracked
- Cost tracking: know exactly what each injectable costs to administer (COGS per treatment)
- Low stock alerts: "You have 2 vials of Juvederm Voluma remaining. This covers ~3 treatments. Reorder?"
- Expiration alerts: "Lot #A1234 expires in 14 days — 60 units remaining. Prioritize using these."

### Portal Configuration — Med Spa

**Sidebar Navigation:**
```
KASSE
├── Dashboard
├── Appointments
│   ├── Calendar
│   ├── Treatment Rooms
│   └── Provider Schedule
├── Patients (not Clients)
│   ├── Patient Directory
│   ├── Medical Records
│   ├── Consent Management
│   └── HIPAA Log
├── Treatment Logs
│   ├── Injectable Records
│   ├── Lot Number Registry
│   └── Photo Gallery
├── Good Faith Exams
├── Services & Protocols
│   ├── Treatment Protocols
│   ├── Consent Templates
│   └── Aftercare Templates
├── Inventory
│   ├── Injectables
│   ├── Skincare Products
│   └── Supplies
├── POS
├── Reports
│   ├── Revenue by Treatment
│   ├── Provider Performance
│   ├── Injectable COGS
│   └── Compliance Audit
└── Settings
    ├── Provider Credentials
    ├── HIPAA Settings
    └── Consent Templates
```

### Terminology Mapping — Med Spa
| Kasse Universal | Med Spa Language |
|----------------|-----------------|
| Client | Patient |
| Appointment | Consultation / Treatment |
| Staff | Providers |
| Services | Treatments / Procedures |
| Notes | Treatment Notes / Medical Records |
| Formula | Injectable Protocol |
| Waiver | Informed Consent |

### Killer Features — Med Spa
1. **Injectable Lot Number Tracking** — FDA-required traceability. If a lot is recalled, instantly find every patient who received it.
2. **Interactive Injection Mapping** — face/body diagram with pinch-to-place injection markers. Treatment notes are visual, not just text.
3. **Consent Management** — procedure-specific consent forms, digital signature in treatment room, timestamped.
4. **Before/After Gallery** — with granular consent management (patient can consent to internal use only, or marketing use).
5. **HIPAA Audit Log** — every access to patient records logged (who accessed, when, what).

### Regulatory — Med Spa
- HIPAA compliance required (patient records are protected health information)
- State-specific medical director requirements (physician supervision)
- Injectable administration requires licensed provider (NP, PA, physician)
- Good Faith Exam requirement (state-specific)
- Lot number tracking (FDA requirement for biologics)

**Kasse compliance approach:** HIPAA-compliant data handling (Business Associate Agreement available), audit log, role-based access (only providers see medical records).

### Build Phase: Phase 9.5 (After Core Gym/Restaurant)
Medical documentation features require careful legal review. HIPAA BAA infrastructure needed. Build after attorney consultation.

---

## VERTICAL 6: NAIL SALON

### Market Context
- ~55,000 nail salons in the US
- 75%+ are Vietnamese-owned (cultural context matters for onboarding materials and customer service)
- Average revenue: $150,000–$400,000/year
- Current software: Mostly nothing (50%), Square (25%), paper appointment books (25%)
- What they pay: Almost nothing — this is the most price-sensitive segment after barbershops
- Special consideration: Many nail techs are independent contractors renting booths, not employees

### Day-in-the-Life — Nail Salon

**KEY DIFFERENCES FROM HAIR SALON:**

1. **Services are faster** (30–90 minutes vs 2–4 hours for color)
2. **Less booking — more walk-in** (many nail salons are primarily walk-in)
3. **Chemical hazards** — acetone, monomer — ventilation requirements, Material Safety Data Sheet (MSDS) tracking
4. **Tech specialization** — gel nails vs acrylic vs dip vs natural — each tech may specialize
5. **Tip culture** — tips are expected and usually cash — system needs cash tip tracking

**Portal Customizations for Nails:**
- Services menu: Manicure, Pedicure, Gel, Acrylic, Dip Powder, Nail Art (with complexity pricing)
- Nail Art gallery: photos organized by tech, can share to Instagram
- Walk-in + appointment hybrid (same as barbershop queue concept)
- MSDS log: track chemical products used, safety data sheets stored
- Tech performance: revenue per tech, nail art popularity by tech
- Tip prompt: cash tip tracking option (tech reports cash tips for payroll accuracy)

### Build Phase: Phase 4 (Low code additions to salon base)
Nail salons share 85% of architecture with hair salons. Custom additions: MSDS log, nail art gallery by tech, enhanced walk-in queue.

---

## VERTICAL 7: AUTO SERVICE / DETAILING

### Market Context
- ~160,000 auto repair shops in the US; ~10,000 detailing shops
- Auto repair average revenue: $500,000–$2M
- Detailing average revenue: $150,000–$500,000
- Current software: Mitchell1, Shop-Ware, Tekmetric (repair); generic POS or nothing (detailing)
- What they hate: Auto repair software is ancient, expensive, and repair-focused. Detailers have almost no options. Neither has a CRM.

### Day-in-the-Life — Auto Detailing

**VEHICLE-BASED PROFILES (Key Differentiator)**

Every client in an auto business has multiple vehicles. Kasse stores:
- Client profile: name, contact, payment methods
- Linked vehicles: each with Year/Make/Model, VIN, color, license plate, photo
- Service history per vehicle: every detail job, every repair, products used

When a client calls or drives in: pulled up by phone number OR license plate lookup.

**DETAILING SERVICE OPERATIONS**

Client brings in 2022 Escalade for full detail:
1. Staff opens client profile → selects vehicle (Escalade)
2. Creates work order:
   - Services: Full Interior ($150) + Full Exterior ($200) + Engine Bay ($75)
   - Notes: "Dog hair in cargo area, needs extra time. Leather conditioning needed."
   - Photos: staff takes walk-around photos (pre-service condition) stored to work order
   - Estimated completion: 4.5 hours
3. SMS to client: "Your 2022 Escalade is in for full detail. Estimated completion at 3:00 PM."
4. Technician works through step-by-step checklist:
   - Interior: vacuum (done ✓), steam clean (done ✓), leather (done ✓), glass (done ✓)
   - Exterior: wash (done ✓), clay bar (in progress...), polish, coat, windows
5. As each step completes, technician marks done on tablet
6. Quality inspection: manager reviews completed work order, marks QC pass
7. After photos taken (stored to work order, used for before/after gallery)
8. SMS to client: "Your Escalade is ready! Come pick it up at your convenience."
9. Checkout: work order auto-populates POS, payment collected, next service reminder set

**NEXT SERVICE RECOMMENDATION ENGINE**

After every detail job:
- System calculates next recommended service date based on:
  - Service type (wax lasts 3 months, ceramic coating lasts 12 months)
  - Environment (client in coastal/salty area = more frequent exterior care)
- Auto-SMS at recommended interval: "It's been 3 months since your Escalade's last detail. Time for a wax refresh?"
- One-tap booking from SMS

### Killer Features — Auto Service
1. **License Plate Lookup** — look up client by plate number when they pull into the lot
2. **Vehicle Photo Documentation** — pre-service walk-around photos stored to work order (protects against "you scratched it" disputes)
3. **Step-by-Step Technician Checklist** — detailed workflow for multi-step detailing jobs; quality control gate before completion
4. **Next Service Predictor** — automated follow-up based on service type and interval
5. **Fleet Account Management** — companies with multiple vehicles (car rental, logistics company) get one billing account, all vehicles tracked

### Build Phase: Phase 10 (Industry Expansion 3)
Vehicle profile model + VIN integration + work order system + step-by-step checklist engine.

---

## VERTICAL 8: PET GROOMING

### Market Context
- ~115,000 pet grooming businesses in the US (growing rapidly with pet industry boom)
- Average revenue: $150,000–$400,000
- Current software: DaySmart Pet, PetDesk, 123Pet, or spreadsheets
- What they hate: Pet profiles are an afterthought in most systems. Emergency contact and vet information is critical but generic POS doesn't support it.

### Day-in-the-Life — Pet Grooming

**PET PROFILES (The Core Differentiator)**

Each client has pets. Each pet has a profile:
- Pet name, species, breed, age, weight
- Color and markings (for ID)
- Temperament notes: "Gets anxious with dryer — use low heat. Bites when ears are cleaned — muzzle required."
- Health conditions: arthritis, seizures, heart murmur — groomers need to know
- Vaccination records: rabies certificate (required), bordetella, DHPP
- Vaccination expiry alerts: "Max's rabies certificate expires in 30 days. Request update from owner."
- Emergency contact: owner's cell + secondary contact
- Veterinarian: name + phone number
- Photo: pet photo stored
- Last weight (tracked over time — sudden weight change flagged)
- Grooming preferences: what products they tolerate, preferred styles, previous issues

**DROP-OFF / PICK-UP BOARD**

The grooming shop runs a drop-off board:
- Visual board showing all pets currently in the shop
- Status per pet: Dropped Off → Bathing → Drying → Grooming → Done → Picked Up
- Staff moves pets through stages on tablet
- Client gets auto-SMS at each stage update: "Max just finished his bath! Next up: drying."
- "Ready for pickup" SMS fired automatically when stage = Done

**OWNER PHOTO UPDATES**

Groomers can send a mid-groom photo to the owner:
- Staff takes photo on iPad → one tap → sends to client via SMS: "Max is looking great! Almost done."
- Parents love this. Referrals follow.

**VACCINATION VERIFICATION**

- Every time a pet is booked: vaccination records checked
- If any vaccination expired or expiring soon: booking is flagged
- Email sent to owner: "Max's bordetella vaccine expires 3/15. We require up-to-date vaccinations. Please bring records at your next visit."
- Vet doc upload: owner can upload vaccination records directly from booking confirmation email

### Build Phase: Phase 10.5 (Industry Expansion 4)
Pet profile model is unique. Vaccination tracking, drop-off board, photo update features.

---

## VERTICAL 9: MASSAGE THERAPY / WELLNESS SPA

### Market Context
- ~80,000 massage businesses in the US
- Often solo practitioners or small studios
- Current software: MindBody, Acuity, Jane App
- Special needs: intake forms (health history, areas to focus/avoid), draping consent, tipping culture, memberships

### Key Customizations

**Intake Forms (Wellness-Specific):**
- Health history (injuries, surgeries, medications, contraindications)
- Areas to focus and areas to avoid
- Pressure preference
- Modality preference (Swedish, deep tissue, hot stone, etc.)
- Auto-sent before first appointment, reviewed by therapist before session

**Membership Model (Common in Massage):**
- "$69/month gets you one 60-minute massage" membership
- Rollover rules: does unused massage roll over? (configurable)
- Guest passes: can member bring a guest?
- Pause: easy freeze for members on vacation or injury

**Room Management:**
- Multiple treatment rooms
- Therapist-to-room assignment
- Heated table setting in room (pre-heat reminder 30 min before appointment)

### Build Phase: Phase 5 (Wellness Module Extension)
Shares 90% with salon architecture. Custom intake forms, membership model, room management.

---

## VERTICAL 10: TATTOO & PIERCING STUDIO

### Market Context
- ~26,000 tattoo studios in the US
- Heavily appointment-based
- Revenue: $100,000–$600,000
- Current software: mostly nothing (60%), Square (25%)
- Special needs: deposit management, consultation-to-appointment flow, aftercare tracking, age verification, design approval

### Key Customizations

**Deposit Management:**
- Tattoo consults require deposits to hold appointment (typically $50–$200)
- Deposit deducted from final payment at checkout
- Non-refundable deposit policy with digital acknowledgment
- If client reschedules: deposit transfers to new appointment
- If client cancels: deposit forfeited (automatic, no manual intervention)

**Consultation Flow:**
- Client books consultation (free or paid)
- Artist and client discuss design, size, placement, style
- Design files attached to appointment (reference photos, sketches)
- Quote given → client approves → full appointment booked → deposit collected → design locked
- Design file sent to client for approval via digital sign-off in Kasse

**Age Verification:**
- Under 18 required parent/guardian consent for most services
- Consent form with parent signature (digital) — stored to client profile
- Staff prompted at check-in if client was flagged as minor during booking

**Aftercare Tracking:**
- Post-appointment: automatic aftercare instructions sent
- Healing check-in at 2 weeks: "How's your tattoo healing? Reply with a photo if you have concerns."
- Touch-up booking prompt at 3 months: "Most tattoos benefit from a touch-up after 3 months — book yours?"

### Build Phase: Phase 10 (alongside auto/detailing)
Deposit management and consultation flow are unique enough to require dedicated development.

---

## VERTICAL 11: YOGA / PILATES STUDIO

### Market Context
- ~40,000 yoga and Pilates studios in the US
- Class-based business (not appointment-based)
- Revenue: $200,000–$1.5M
- Current software: MindBody (dominates this space), Glofox, Momence

### Key Customizations

**Class Types:**
- In-person class (capacity limit, physical location, instructor)
- Virtual class (livestream via Zoom/Kasse integration, unlimited capacity)
- Hybrid class (some in-person, some virtual, same session)
- On-demand class (pre-recorded, accessible 24/7)
- Workshop (longer format, higher price, special registration)
- Series (6-week course, buy all 6 sessions together)
- Private session (1:1, appointment-based)

**Class Pass Management:**
- 10-class pack (use within 90 days)
- Unlimited monthly membership
- New student special ($49 for 30 days unlimited, first-timers only)
- Class passes shared between family members on one account (family add-on)

**Instructor Profile Pages:**
- Public page on Kasse Site (if integrated)
- Class specialties, bio, teaching style
- Upcoming classes listed
- Client reviews and ratings
- Link to book a private session

### Build Phase: Phase 5 (Wellness Module)
Class management shared with gym. Key additions: virtual class streaming integration, series/workshop pricing, on-demand content delivery.

---

## VERTICAL 12: BEAUTY SCHOOL / COSMETOLOGY SCHOOL

### Market Context
- ~3,000 cosmetology schools in the US
- Revenue from student tuition + on-floor salon services (students charge clients discounted rates)
- Current software: Milady, Salon Iris Education, general learning management systems

### Key Customizations

**Dual-Mode Operation:**
- SCHOOL SIDE: student enrollment, attendance, curriculum tracking, licensing exam prep, grade management
- SALON SIDE: Kasse salon system where students perform services on clients (supervised)

**Student Module:**
- Student profiles with program enrollment, hours accumulated, skills checklist
- Hour tracking: students need X clock hours for state licensing — every service performed logs hours
- Skills sign-off: instructor verifies student completed each skill item
- Exam readiness score: AI calculates readiness for state board exam based on hours and skill completions

**Floor Supervisor View:**
- See all students on the floor and their current clients
- Supervisor approval required before student performs certain services (chemical services)
- Real-time check-in: supervisor marks student present, student logs out at end of shift

### Build Phase: Phase 12 (Niche Education Vertical — Long-term)
Requires separate school management module. Complex regulatory requirements per state.

---

## VERTICAL 13: SPORTS / ATHLETIC TRAINING

### Market Context
- Sports performance centers, athletic trainers, private coaches
- Revenue varies widely ($50,000–$5M)
- Current software: mostly generic scheduling tools

### Key Customizations

**Athlete Profiles:**
- Sport and position
- Training goals
- Performance benchmarks (vertical jump, 40-yard dash, bench press max — tracked over time)
- Injury history (from medical records if shared)
- Nutrition protocol (linked to coach's recommendations)
- Video analysis: upload training video → coach annotates with frame-by-frame notes → client views annotated video

**Team Training:**
- Coach books entire team for a session
- Individual performance tracked within group session
- Team analytics: which players are improving fastest, who needs attention

**Parent Portal:**
- For youth athletes: parents have view-only access to their child's progress, upcoming sessions, performance scores
- Parents receive automated performance reports after each session

### Build Phase: Phase 11 (Niche Expansion)

---

## VERTICAL 14: CHILDCARE / DAYCARE

### Market Context
- ~100,000 daycare centers in the US; countless in-home providers
- Revenue: $100,000–$2M
- Current software: Procare, Brightwheel, Kindertales
- Heavily regulated: state licensing, child-to-staff ratios, attendance records required

### Key Customizations

**Child Profiles:**
- Child name, age, date of birth
- Authorized pickup list (only these adults can pick up — ID required)
- Unauthorized list (custodial disputes — never release to this person)
- Allergy and dietary restrictions
- Medical conditions and medications (emergency info)
- Parent/guardian contacts
- Physician contact
- Emergency protocols

**Digital Check-In/Out:**
- Parent signs in child at door with PIN or QR code
- Authorized adult check-out requires PIN verification
- Unauthorized pickup: staff alerted immediately if someone not on authorized list attempts pickup
- Attendance log: required by licensing, generated automatically

**Daily Report Cards (Parent Communication):**
- Staff logs throughout the day: nap times, meals eaten, diaper changes, activities
- Auto-generated daily report sent to parents each afternoon:
  - "Today Emma had lunch at 12:30 (ate well), napped 1:00–2:30, played in the art center."
- Photos sent throughout day (parent consent required)

**Billing:**
- Weekly or monthly billing
- Multiple billing types: full-time, part-time, drop-in
- Sibling discounts (auto-applied)
- State subsidy payments tracked separately

### Build Phase: Phase 11 (Unique regulatory complexity)

---

## VERTICAL 15: CLEANING SERVICE / MAID SERVICE

### Market Context
- ~800,000 cleaning businesses in the US (mostly solo operators)
- Revenue: $50,000–$500,000
- Current software: Jobber, Housecall Pro, ZenMaid
- Mobile business: goes to client's home or business

### Key Customizations

**Location-Centric (Not Person-Centric):**
- Every client has one or more service locations (addresses)
- Each location has:
  - Entry instructions (key code, lockbox code, gate code)
  - Number of rooms
  - Special instructions (don't move X, allergic to Y cleaning product)
  - Pet notes (dog in backyard, don't open back door)
  - Photos of before/after

**Route Optimization:**
- Kasse auto-optimizes daily routes for cleaners
- Shows most efficient order to visit all jobs that day
- Navigation: one-tap to open in Google Maps

**Time Tracking:**
- Cleaner clocks in at start of each job (GPS verified — must be within X meters of address)
- Clocks out when done
- Job duration tracked (estimate vs actual — used to improve future estimates)

**Recurring Service Management:**
- Most cleaning clients are weekly, bi-weekly, or monthly
- Kasse auto-creates next appointment when current one is completed
- Holiday scheduling: "December 25 is a holiday — auto-reschedule that week's appointments?"

**Before/After Photo Documentation:**
- Cleaner takes before photos on arrival
- After photos when done
- Stored to job record
- Client can optionally receive after photos as proof of service

### Build Phase: Phase 10 (Mobile-First Vertical)
Route optimization and GPS clock-in are unique features. Location-centric data model.

---

## VERTICAL 16: PHOTOGRAPHY / VIDEOGRAPHY

### Market Context
- Solo or small studio photographers — weddings, portraits, commercial
- Revenue: $50,000–$500,000
- Current software: HoneyBook, Dubsado, 17hats
- Project-based: every client is a project with multiple phases

### Key Customizations

**Project-Based Model:**
- Each booking is a "project" with phases:
  - Inquiry → Consultation → Contract Signed → Deposit Paid → Session → Gallery Delivered → Final Payment → Complete
- Pipeline view (kanban) showing all active projects and their phase

**Contract Management:**
- Templates for wedding contracts, portrait contracts, commercial contracts
- Digital signature required before session is confirmed
- Contract terms stored permanently

**Gallery Delivery:**
- Photo galleries uploaded to Kasse (or linked from external gallery tools like Pixieset, Pic-Time)
- Client notified when gallery ready
- Download options controlled by photographer (allow downloads? How many?)

**Lead Capture Form:**
- Public inquiry form (embedded on website)
- Bride fills out: date, venue, guest count, style preferences
- Goes into Kasse CRM as a lead → photographer reviews → responds → books consultation

### Build Phase: Phase 11 (Creative Services Module)

---

## VERTICAL 17: FOOD TRUCK

### Market Context
- ~35,000 food trucks in the US
- Revenue: $50,000–$500,000
- Current software: Square (dominant — 70%), Toast (growing), other
- Mobile business: location changes daily

### Key Customizations

**Location Broadcasting:**
- Truck can post today's location in Kasse → auto-publishes to:
  - Instagram ("We're at 5th and Main today until 3pm! 🌮")
  - Facebook
  - Google Business Profile
  - SMS subscribers who follow the truck
- Location tracker: schedule future locations in advance

**Event Booking:**
- Clients can book the truck for events (private parties, corporate events, festivals)
- Event booking form: date, location, expected headcount, deposit
- Event management: separate from daily operations

**Simplified POS:**
- Mobile-first checkout (iPad or phone)
- Quick items (pre-configured — most orders are the same menu items)
- Square Hardware-compatible OR Reyna Pay mobile card reader
- Cash drawer optional

**Pre-Order Online:**
- Customer pre-orders at a specific location for pickup at specific time
- Kitchen sees order stream coming in
- Customer arrives → name lookup → order handed off

### Build Phase: Phase 10 (Mobile POS Track)

---

## VERTICAL 18: CATERING

### Market Context
- ~17,000 catering companies in the US
- Revenue: $200,000–$5M
- Current software: Caterease, Total Party Planner, or nothing

### Key Customizations

**Event-Based Operations:**
- Each booking is an event: date, venue, guest count, menu selections
- Event timeline: event planning checklist (6 months to event day)
- Staff assignments per event
- Rental equipment tracking

**Custom Menus Per Event:**
- Each event gets a custom menu built in Kasse
- Dietary accommodations tracked per guest (wedding with 3 vegans, 2 gluten-free, 1 kosher)
- Cost tracking per event: ingredients + labor = margin calculation

**Client Tastings:**
- Tasting appointments (same as booking, different service type)
- Tasting notes logged: what the client approved, what they want changed

### Build Phase: Phase 11

---

## VERTICAL 19: TUTORING / EDUCATION CENTER

### Market Context
- Private tutors, learning centers, test prep companies
- Revenue: $50,000–$2M
- Current software: TutorBird, Teachworks, generic scheduling

### Key Customizations

**Session Tracking:**
- Every tutoring session logged: subject, skills covered, homework assigned
- Student progress report: generated from session logs
- Parent-facing report: auto-sent weekly/monthly

**Subject/Grade Management:**
- Staff specialties: each tutor assigned subjects and grade levels
- Smart matching: new student matched to available tutor based on subject need

**Package Billing:**
- Students purchase session packages (10 sessions, 20 sessions)
- Each session deducts from package
- Low-package alert: "5 sessions remaining — renew now?"

### Build Phase: Phase 11

---

## VERTICAL 20: COWORKING SPACE

### Market Context
- ~6,000 coworking spaces in the US
- Revenue: $300,000–$3M
- Current software: Nexudus, Cobot, OfficeRnD

### Key Customizations

**Desk/Office Booking:**
- Hot desk booking (book any available desk for the day)
- Dedicated desk (same desk, monthly)
- Private office (private space, monthly)
- Conference room booking (hourly)

**Member Check-In:**
- QR code or fob at door (same as gym)
- Visitor registration: guests of members check in at front desk

**Meeting Room Management:**
- Calendar view of all conference rooms
- Book from member's Kasse app
- Display screen at room door shows current booking and next available times

**Plan Tiers:**
- Day Pass, 10-Day Pack, Part-Time Membership, Full-Time Membership, Dedicated Desk, Private Office
- Add-ons: mail handling, phone answering, parking, locker access

### Build Phase: Phase 11 (Space Management Module)

---

## VERTICAL ROADMAP SUMMARY

### Phase 0–3: SALON (Core + Launch)
Full salon operations, color studio, AI receptionist, TDLR compliance, migration from Square/Vagaro

### Phase 4: BARBERSHOP + NAIL SALON
Queue system, TV board, booth rent billing, walk-in hybrid mode, MSDS log

### Phase 5: WELLNESS EXPANSION
Massage, yoga/pilates, wellness spa — intake forms, membership model, class management, virtual class integration

### Phase 9: RESTAURANT + GYM
KDS, floor plan, online ordering, delivery integrations; member check-in hardware, PT logging, corporate accounts

### Phase 9.5: MED SPA
HIPAA infrastructure, injectable tracking, Good Faith Exam, injection mapping, lot number registry

### Phase 10: MOBILE + FIELD SERVICES
Detailing, cleaning service, food truck — route optimization, GPS clock-in, vehicle profiles, location broadcasting

### Phase 10.5: PET GROOMING + TATTOO
Pet profiles, vaccination tracking, drop-off board; deposit management, age verification, design approval

### Phase 11: CREATIVE + EDUCATION + SPECIALTY
Photography, tutoring, childcare, sports training, catering, coworking, yoga schools

### Phase 12: BEAUTY SCHOOL + ENTERPRISE EDUCATION
Student hour tracking, curriculum management, licensing exam readiness, floor supervisor tools

---

## THE VERTICAL CONFIGURATION SYSTEM

Every vertical is powered by a `VerticalConfig` TypeScript object:

```typescript
interface VerticalConfig {
  id: VerticalId;
  displayName: string;
  
  // Terminology overrides
  terms: {
    staff: string;          // "Stylists" | "Barbers" | "Trainers" | "Providers"
    appointment: string;    // "Appointment" | "Session" | "Reservation" | "Treatment"
    client: string;         // "Client" | "Member" | "Patient" | "Guest"
    service: string;        // "Service" | "Class" | "Treatment" | "Lesson"
    location: string;       // "Salon" | "Shop" | "Studio" | "Gym" | "Clinic"
    checkout: string;       // "Checkout" | "Settle Tab" | "Process Payment"
    booking: string;        // "Book Appointment" | "Join Waitlist" | "Register for Class"
  };
  
  // Feature flags — what's visible in this vertical's portal
  features: {
    colorStudio: boolean;           // salon, nail
    walkInQueue: boolean;           // barbershop, nail, food truck
    tableManagement: boolean;       // restaurant, bar
    kitchenDisplay: boolean;        // restaurant, food truck, catering
    membershipBilling: boolean;     // gym, yoga, massage, coworking
    classScheduling: boolean;       // gym, yoga, pilates
    vehicleProfiles: boolean;       // auto service, detailing
    petProfiles: boolean;           // grooming
    medicalIntake: boolean;         // med spa, massage
    injectableTracking: boolean;    // med spa only
    hipaaMode: boolean;             // med spa, healthcare
    depositManagement: boolean;     // tattoo, photography, catering
    routeOptimization: boolean;     // cleaning, field service
    studentTracking: boolean;       // beauty school, tutoring
    conferenceRooms: boolean;       // coworking
    deskBooking: boolean;           // coworking
    waiverForms: boolean;           // gym, med spa, tattoo, sports
    commissionTracking: boolean;    // salon, barbershop, nail
    boothRentBilling: boolean;      // barbershop, nail, tattoo
    inventoryTracking: boolean;     // salon, nail, restaurant, retail
    recipeBasedInventory: boolean;  // restaurant, catering, food truck
    onlineOrdering: boolean;        // restaurant, food truck, retail
    deliveryIntegrations: boolean;  // restaurant, food truck
    reservations: boolean;          // restaurant, massage, studio
    kdsDisplay: boolean;            // restaurant, food truck
    loyaltyProgram: boolean;        // all
    giftCards: boolean;             // all
    aiReceptionist: boolean;        // salon, barbershop, gym, med spa
    formulaCards: boolean;          // salon, nail
  };
  
  // Sidebar navigation order and visibility
  navigation: NavigationItem[];
  
  // Dashboard widget configuration
  dashboardWidgets: DashboardWidget[];
  
  // Default service menu templates
  defaultServices: ServiceTemplate[];
  
  // Onboarding checklist items specific to this vertical
  onboardingChecklist: ChecklistItem[];
  
  // Regulatory requirements for this vertical
  compliance: {
    licenseRequired: boolean;
    licenseType?: string;
    hipaaRequired: boolean;
    waiverRequired: boolean;
    ageVerificationRequired: boolean;
    minAge?: number;
  };
  
  // Addon recommendations for this vertical
  recommendedAddons: AddonId[];
  
  // Pricing guidance (for onboarding plan selection)
  typicalPlan: 'starter' | 'growth' | 'pro' | 'enterprise';
  averageAddonRevenue: number; // typical additional monthly revenue from addons
}

type VerticalId = 
  | 'salon'
  | 'barbershop' 
  | 'nail_salon'
  | 'restaurant'
  | 'bar'
  | 'gym'
  | 'yoga_studio'
  | 'massage'
  | 'med_spa'
  | 'auto_detailing'
  | 'auto_repair'
  | 'pet_grooming'
  | 'tattoo'
  | 'retail'
  | 'food_truck'
  | 'catering'
  | 'cleaning'
  | 'photography'
  | 'tutoring'
  | 'childcare'
  | 'coworking'
  | 'sports_training'
  | 'beauty_school'
  | 'other';
```

This config system means:
- Adding a new vertical = creating a new config object
- No code changes to the portal — it reconfigures itself based on the config
- Merchants can switch verticals if their business pivots
- Multi-location businesses can have different verticals per location (gym + smoothie bar)

---

## CROSS-VERTICAL FEATURES (Available to ALL verticals)

These features are not vertical-specific — every Kasse merchant gets them:

**Universal POS:**
- Any item sold, any payment method accepted, any tip configuration, any tax rate

**Universal CRM:**
- Client profiles, contact history, notes, relationship scores, win-back lists

**Universal Marketing:**
- Email campaigns, SMS campaigns, automated sequences, review management, referral program

**Universal Analytics:**
- Revenue trends, client retention, staff performance, comparison to previous periods

**Universal Reyna Pay Integration:**
- All payment processing through Reyna Pay regardless of vertical

**Universal AI Receptionist:**
- Handles inbound calls for any vertical with custom responses per vertical

**Universal Franchise Creator:**
- Any vertical can build a franchise system using the same tools

**Universal Migration Center:**
- Import from 20+ platforms regardless of vertical

**Universal Booking Widget:**
- Embeddable on any website, for any service type, in any vertical

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 4 kickoff (second vertical build begins)*
