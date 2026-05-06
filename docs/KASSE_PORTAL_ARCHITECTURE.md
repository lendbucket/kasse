# KASSE_PORTAL_ARCHITECTURE.md
## Portal Architecture — Every Page, Every Component, Every Role
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## GOVERNING PRINCIPLES

1. **No dummy data ever.** If there is no real data, show an actionable empty state — not zeroes, not placeholder names, not sample transactions.
2. **Role-aware everything.** Every page renders differently depending on whether the viewer is Owner, Manager, or Staff. Same URL, different data and controls.
3. **Vertical-aware terminology.** Every label, every noun adapts via VerticalConfig. "Stylists" in a salon, "Trainers" in a gym, "Servers" in a restaurant.
4. **Mobile-first.** Every page works on a phone. Tables become stacked cards. Sidebars become bottom nav. Touch targets 44px minimum.
5. **The smallest thing matters.** Every empty state. Every loading state. Every error message. Every confirmation dialog. Every tooltip. Every notification.

---

## ROLE HIERARCHY

```
SUPER ADMIN (Robert / Kasse team — internal only)
    │
    ├── OWNER (business owner — sees everything, controls everything)
    │       │
    │       ├── MANAGER (sees location data, manages day-to-day, restricted from billing/payroll)
    │       │
    │       └── STAFF (sees own schedule + own clients + own earnings only)
    │               │
    │               └── STAFF (view-only) — can see schedule but cannot modify anything
    │
    └── FRANCHISE OWNER (sees all franchise locations, restricted from other franchisors)
```

**Owner can:**
- See all locations simultaneously
- See all staff commissions and earnings
- See all financial data including payroll and banking
- Change subscription, billing, integrations
- Invite/remove staff, change roles and permissions
- Access the incubator dashboard
- Export all data

**Manager can (default — owner can expand or restrict):**
- See all appointments at their assigned location
- Manage appointment calendar (create, edit, cancel)
- Check in clients, process checkouts
- View client profiles and history
- View staff schedules and performance (their location)
- View location-level revenue reports
- Cannot see: payroll details, banking, billing, other locations, org-level settings

**Staff can (default — owner can expand or restrict):**
- See their own schedule only
- See clients assigned to their appointments
- Check in their own clients
- Process checkout for their own appointments
- View their own commission and earnings
- Cannot see: other staff earnings, org financials, client list broadly

---

## SIDEBAR NAVIGATION — FULL STRUCTURE

```
kasse.                                    [Location Switcher]
                                          All Locations ▾

OVERVIEW
  🏠  Home / Dashboard
  📊  Reports

OPERATIONS
  💳  Payments & Invoices
  📅  Appointments
  👥  Clients
  ⏳  Waitlist                            [conditional — vertical config]
  💬  Messages

TEAM
  👤  Staff
  💰  Payroll                             [owner only]
  ⏱️  Time & Attendance

GROWTH
  📣  Marketing
  ⭐  Reputation
  🎁  Gift Cards & Loyalty

FINANCIAL                                 [owner only]
  🏦  Banking
  📄  Bill Pay
  📈  Profit & Loss

TOOLS
  🤖  AI Receptionist
  📋  Forms & Waivers                     [salon/med spa/gym verticals]
  🎨  Color Studio                        [salon/nail verticals]
  🎓  Incubator                           [if enrolled]

SETTINGS
  ⚙️  Settings
```

**Visibility rules:**
- Payroll: Owner only (unless granted to Manager via permission)
- Financial section: Owner only
- Color Studio: Only if vertical = salon or nail_salon
- Forms & Waivers: Only if vertical has intake forms enabled
- Incubator: Only if org is enrolled in a cohort
- Time & Attendance: Hidden for booth rent staff

---

## PAGE-BY-PAGE SPECIFICATION

---

### PAGE: HOME / DASHBOARD

**URL:** `/dashboard`

**Owner view:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Home · All Locations ▾                                           May 6, 2026│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Ask Kasse AI anything about your business...                               │
│                                                                             │
├──────────┬──────────┬──────────┬──────────────────────────────────────────┤
│  TODAY'S │  TODAY'S │  STAFF   │  QUICK ACTIONS                           │
│  REVENUE │  APPTS   │  ACTIVE  │  [New Appointment]                       │
│          │          │          │  [Take Payment]                          │
│  $4,230  │    41    │  6 / 8   │  [Add Client]                            │
│  ▲ 12%   │  ▲ 3     │          │  [Run Report]                            │
│  vs yest │  vs yest │          │                                          │
├──────────┴──────────┴──────────┤                                          │
│  CHAIR UTILIZATION   TIPS      │                                          │
│      78%           $892        │                                          │
│                     ▲ 8%       │                                          │
└────────────────────────────────┴──────────────────────────────────────────┘
│                                                                             │
│  PERFORMANCE                              Today  Yesterday                 │
│  ─────────────────────────────────────────────────────────────────         │
│  [Revenue chart — hourly bars, today blue vs yesterday gray]                │
│                                                                             │
│  Net sales      $4,230    Transactions    41     Avg sale    $103          │
│  Appointments   41        Tips            $892   Comps       $45           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ALERTS                                                                     │
│  ⚠️  Wella Blondor stock below threshold — 2 appointments using it tomorrow  │
│  ⚠️  Jennifer's TDLR license expires in 23 days                             │
│  ✓   3 new reviews this week — 4.9 average                                  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  YOUR LOCATIONS                        [Search locations...]                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Salon Envy Corpus Christi   $2,840   24 tx   $0.00 avg   Page 1 of 2 ›   │
│  Salon Envy San Antonio      $1,390   17 tx   $0.00 avg                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Owner zero state (no data yet):**
```
SETUP CHECKLIST — 2 of 6 complete
━━━━━━━━━━━━━━━━━ 33%

✓  Business profile complete
✓  First location added
○  Add your services                    [Add Services →]
○  Invite your team                     [Invite Staff →]
○  Enable online booking                [Set Up Booking →]
○  Activate Kasse Pay                   [Connect Payments →]
```

**Manager view (same page, filtered to their location):**
- No multi-location table
- Shows only their location's data
- No banking widget
- No payroll shortcut
- Quick actions: New Appointment, Check In, Take Payment

**Staff view:**
```
Good morning, Jennifer.
Tuesday, May 6

YOUR DAY
8 appointments · $1,240 estimated

NEXT UP — 9:00 AM
Sarah Johnson — Balayage (2.5 hr)
⚠️ Ammonia allergy on file   [View Client]  [Check In]

TODAY'S SCHEDULE
[timeline of their appointments only]

YOUR EARNINGS TODAY
$0 so far · Est. $420
```

---

### PAGE: APPOINTMENTS CALENDAR

**URL:** `/appointments`

**Full spec:**

**Toolbar:**
- Date navigator (← Previous Day | Today | Next Day →)
- View switcher: [Day] [Week] [Month]
- Staff filter: [All Staff ▾] or specific staff member
- + New Appointment button (primary button, top right)

**Day view:**
- Time column left (6am–10pm in 30-min increments)
- One column per staff member (horizontal scroll if >5)
- Staff name + avatar in column header + status dot (● clocked in, ○ not in)
- Appointment blocks:
  - Height proportional to duration
  - Background: #2F5061 confirmed, #E57F84 pending/unconfirmed, #F4EAE6 blocked time
  - Text: client name (bold), service name, price
  - Left edge: 3px colored stripe per appointment status
  - Alert badge (⚠️) if client has allergy/note flag
- "Now" indicator: red horizontal line at current time
- Click empty slot: opens "New Appointment" drawer
- Click appointment: opens "Appointment Detail" drawer
- Long press (mobile): opens quick action menu

**Appointment detail drawer (slide in from right):**
```
[Client photo/avatar]  Sarah Johnson
                       (361) 555-8821 · sarah@email.com
                       Last visit: 8 weeks ago · 22 total visits

⚠️ ALLERGY ALERT: Ammonia — always use ammonia-free developer

SERVICE
Balayage                           2.5 hours        $180
+ Toner                            45 min           $45
─────────────────────────────────────────────────
Total                                               $225
Deposit paid                                        -$50
Balance due                                         $175

STATUS
[Confirm]  [Check In]  [No Show]  [Cancel]

NOTES
[Client note: "wants to go lighter this time"]
[Internal note: add your own... — only visible to staff]

ACTIONS
[Edit Appointment]  [Rebook]  [Checkout]  [View Client]
```

**Create appointment drawer:**
- Client search: type name, phone, or email → instant results
- New client toggle: inline name + phone entry
- Service selector: searchable list with price + duration
- Add-on services (checkboxes)
- Staff selector (only shows staff qualified for selected service)
- Time picker (only shows available slots)
- Date picker
- Deposit collection toggle (auto if service requires it)
- Send confirmation SMS/email toggle
- Notes
- Save → appointment appears on calendar, confirmation fires

**Week view:**
- 7 columns (days), rows = time slots
- Click on any slot → create appointment
- Color by staff member (each staff gets a color from palette)
- Compact appointment blocks (client name only)

**No appointments empty state:**
```
[Calendar icon — 88px circle, #F0EDE9 background]
No appointments today
Looks like there's open availability.

[New Appointment]    [Share Booking Link]
```

---

### PAGE: CLIENTS

**URL:** `/clients`

**List view:**
- Search bar (name, phone, email — instant search)
- Filter chips: [All] [Active] [Lapsed] [VIP] [Has Card on File]
- Sort: last visit, total spent, visit count, name
- Table columns: Name, Phone, Last Visit, Total Spent, Visits, Score, Card on File, Actions
- Relationship score shown as colored number (0-40 red, 41-70 yellow, 71-100 green)
- Row click: opens client profile
- Batch actions (select multiple): send message, add tag, export

**Client profile:**
- Header: photo/avatar, name, relationship score badge, "Book Appointment" button, "Send Message" button, "Charge Card" button
- Tabs: Overview | Visits | Transactions | Communications | Notes | Forms

**Overview tab:**
- Contact info (phone, email, address, birthday) — editable inline
- Preferred staff selector
- Tags (add/remove)
- Loyalty points balance + history
- Card on file status (Visa ·4242 or "No card on file" + "Collect Card" button)
- Client since date
- Referral source + referred by (linked to referrer's profile)
- Family members list

**Visits tab:**
- Every appointment ever: date, service, staff, price, rating
- Click any visit: see full checkout receipt
- Formula card attached to each color service (salon vertical)

**Transactions tab:**
- Every payment ever: date, amount, method, services, tip
- Refund status per transaction
- Download receipt for any transaction

**Communications tab:**
- Every SMS/email sent to this client
- Direction (inbound/outbound)
- Content preview
- Send new message from here

**Notes tab:**
- Private notes (only visible to staff, not client)
- Each note: author, timestamp, content
- Add new note (rich text)
- Pin important notes to top

**Forms tab:**
- All intake forms, waivers signed by this client
- Timestamp and signature for each
- Download PDF

**No clients empty state:**
```
No clients yet.
[Import from Square →]  [Import CSV →]  [Add Manually →]
```

---

### PAGE: PAYMENTS & INVOICES

**URL:** `/payments`

**Layout:** Two sections — recent transactions list + right panel quick actions

**Transaction list:**
- Columns: Date, Client, Staff, Services, Amount, Method, Status, Actions
- Status pills: Completed (green), Refunded (gray), Disputed (orange), Failed (red)
- Filter: date range, staff, status, payment method
- Search: client name or transaction ID
- Click row: transaction detail drawer

**Transaction detail drawer:**
```
Transaction #TXN-00847
May 6, 2026 · 2:34 PM

Sarah Johnson                    Jennifer Martinez
(361) 555-8821                   Commission: $81 (45%)

ITEMS
Balayage                                     $180.00
Toner                                         $45.00
Olaplex No.3 (retail)                         $28.00
─────────────────────────────────────────────────────
Subtotal                                     $253.00
Tax (8.25%)                                   $20.87
Tip                                           $50.00
Deposit applied                              -$50.00
─────────────────────────────────────────────────────
TOTAL CHARGED                                $273.87
Paid via Visa ····4242

[Issue Refund]  [Resend Receipt]  [View Client]  [Print]
```

**Quick actions (right panel):**
- Take Payment (opens POS)
- Create Invoice (for outstanding balances)
- Recent transactions (5 most recent, click to detail)

**Empty state:**
```
No transactions yet.
When you process your first payment, it will appear here.
[Take a Payment →]
```

---

### PAGE: POS / CHECKOUT

**URL:** `/pos`

**This is a dedicated full-screen mode — no sidebar during checkout.**

**Step 1 — Client Selection:**
```
CHECKOUT
─────────────────────────────────────────────────────────────────
Search client...                               [Walk-In (No Client)]

[Recent clients — 5 most recent with one-tap select]
  Sarah Johnson ·········· last visit 8 weeks
  Maria Garcia ··········· last visit 2 weeks
  Amanda K. ·············· last visit 3 weeks
```

**Step 2 — Services:**
```
CHECKOUT — Sarah Johnson
─────────────────────────────────────────────────────────────────
SERVICES                                              [+ Add Service]

[Balayage — Jennifer              2.5 hr    $180.00    [✕]]
[Toner — Jennifer                 45 min     $45.00    [✕]]

RETAIL PRODUCTS                                      [+ Add Product]
[Olaplex No.3                               $28.00    [✕]]

ADJUSTMENTS
[Apply Discount]  [Apply Gift Card]  [Apply Loyalty Points]

Subtotal                                     $253.00
                                    [Continue → Tip]
```

**Step 3 — Tip:**
```
TIP FOR JENNIFER MARTINEZ
─────────────────────────────────────────────────────────────────

    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │   15%    │  │   20%    │  │   25%    │
    │  $37.95  │  │  $50.60  │  │  $63.25  │
    └──────────┘  └──────────┘  └──────────┘

    [No Tip]           [Custom Amount: $______]

Selected: 20% · $50.60
                                    [Continue → Payment]
```

**Step 4 — Payment:**
```
PAYMENT
─────────────────────────────────────────────────────────────────
Subtotal                    $253.00
Tax (8.25%)                  $20.87
Tip                          $50.60
Deposit applied             -$50.00
─────────────────────────────────────────────────────
TOTAL                       $274.47

PAYMENT METHOD
● Visa ····4242 (card on file)          Charge $274.47
○ New card
○ Cash
○ Split payment

                                    [Charge $274.47]
```

**Step 5 — Success + Rebook:**
```
✓ Payment Successful

$274.47 charged to Visa ····4242
Receipt sent to sarah@email.com

────────────────────────────────────────────────────
REBOOK SARAH WITH JENNIFER?

Thu May 15  9:30 AM    ← 6 weeks from today
Thu May 15  2:00 PM
Fri May 16  11:00 AM

[Book May 15 @ 9:30]   [Show more times]   [Skip]
────────────────────────────────────────────────────

                                    [New Transaction]
```

**Split payment flow:**
- Enter total for card portion
- Remaining auto-calculated for cash portion
- Two separate payment confirmations
- Both logged on same transaction record

---

### PAGE: STAFF

**URL:** `/staff`

**List view:**
- Cards (not table) — each staff card:
  - Photo/avatar
  - Name + role badge
  - Location assigned
  - Commission type + rate
  - Status: Active/Inactive
  - Today's appointments count
  - Click: goes to staff profile

**Staff profile:**
- Header: photo (upload), name, job title, role, location
- Tabs: Profile | Schedule | Performance | Earnings | Settings

**Profile tab:**
- Contact info (phone, email) — edit inline
- License number + expiry (TDLR or other) — red alert if < 60 days
- Hire date + employment type badge (W2/1099/Commission/Booth Rent)
- Bio (shown on public booking page)
- Services offered (checkboxes against service menu)
- Color (for calendar display)
- Goals (configurable targets: revenue, new clients, rebook rate)

**Schedule tab:**
- Weekly availability grid (Mon–Sun, set open/close times per day)
- Time-off request button → drawer to enter dates + reason
- Pending time-off requests with approve/deny (owner only)
- Approved time off shown on grid

**Performance tab:**
- Stats: this week / this month / all time
- Revenue generated, appointments completed, new clients, rebook rate, review rating, retail sold
- Goal progress bars (vs configured goals)
- Performance chart (revenue by week, last 12 weeks)

**Earnings tab (owner sees all; staff sees own only):**
- Current pay period commission breakdown
- Service commission by appointment
- Retail commission
- Tips
- Adjustments (bonuses, deductions)
- Total owed this period
- Pay history (past 12 pay periods)

**Settings tab:**
- Commission structure (type + rate — editable by owner)
- Permission set assigned (dropdown of available sets)
- Clock in/out requirements (GPS required Y/N, geofence radius)
- Notify on new booking (Y/N)
- Portal access toggle (can deactivate without deleting)

**Add staff drawer:**
- Name, email, phone
- Role (Owner / Manager / Staff)
- Location assignment
- Employment type (W2 / 1099 / Commission / Booth Rent)
- Commission rate or hourly rate
- Send invite email toggle
- Services they offer (checklist)

---

### PAGE: PAYROLL

**URL:** `/payroll`
**Visible to:** Owner only (unless permission granted to Manager)

**Layout:**

```
PAYROLL                                    [Run Payroll]  [Pay Period: May 1–15 ▾]

PAY PERIOD SUMMARY
Total Payroll Due: $8,420.00
Staff with Payments: 7
Period Status: Open (closes May 15)

─────────────────────────────────────────────────────────────────────────────────
STAFF                EMPLOYMENT    SERVICES    RETAIL    TIPS    ADJUSTMENTS  TOTAL
Jennifer Martinez    Commission    $1,260.00   $28.00   $320.00  +$50 bonus  $1,658.00
Marcus Johnson       Booth Rent    —           —        —         -$400 rent  -$400.00
Lisa Chen            W2 Hourly     —           —        $180.00   —           $1,480.00
Ashley Williams      Commission    $880.00     $0.00    $210.00   —           $1,090.00
─────────────────────────────────────────────────────────────────────────────────
                                                                   TOTAL:  $8,420.00

[Lock Period & Disburse]
```

**Payroll run flow:**
1. Review period summary
2. Add any manual adjustments (bonus, deduction, advance) per staff member — reason required
3. Lock period (no more changes after this)
4. Select disbursement method: Wise ACH (for enrolled staff), Mark as Manual (cash/check)
5. Confirm → PayrollRun created → disbursements initiated
6. PayrollLine per staff member tracks individual payment status

**Pay history tab:**
- Every past payroll run
- Click: see full breakdown with each staff member's line

---

### PAGE: TIME & ATTENDANCE

**URL:** `/attendance`

**Active clocks view:**
- Cards for each staff member showing: clocked in/out, time on clock today, location
- Manual clock in/out (for owners to correct)

**Timesheet view:**
- Week view with each day's clock events per staff member
- Total hours per day, per week
- Overtime hours highlighted
- Export to CSV (for external payroll)

**Clock event log:**
- Every clock in/out event with timestamp, GPS coords (if captured), geofence status
- Edit/delete events (owner only, with reason required)

---

### PAGE: MARKETING

**URL:** `/marketing`

**Tabs:** Campaigns | Automation | Reviews | Reputation

**Campaigns tab:**
- List of created campaigns with status (draft/scheduled/sent)
- Stats per sent campaign: sent count, open rate, click rate, conversions (bookings made after)
- Create new campaign button → campaign builder

**Campaign builder:**
- Audience: All clients / Lapsed clients (>X days) / VIP clients / custom filter (spent > $X, visits > X, specific service)
- Channel: SMS / Email / Both
- Message editor (SMS: 160-char limit with counter; Email: rich text editor)
- Personalization tokens: {first_name}, {last_visit_date}, {service_name}, {booking_link}
- Schedule: Send now / Schedule date+time
- Preview before send

**Automation tab:**
- Toggle cards for each automation:
  - ✓ Appointment reminders (24hr + 2hr) — always on
  - ○ Win-back campaign (lapsed clients) — configure trigger days + message
  - ○ Review request (post-appointment) — configure delay + message
  - ○ Birthday message — configure message + discount
  - ○ First-time client follow-up — 24hr after first visit
  - ○ No-show follow-up — rescheduling prompt

**Reviews tab:**
- All review requests sent: date, client, channel, status (sent/opened/responded)
- Internal ratings collected (1-5 stars with feedback)
- Negative feedback management (owner sees negative reviews before they go anywhere)
- Google review count (pulled from Google Business Profile if integrated)

---

### PAGE: BANKING

**URL:** `/banking`
**Visible to:** Owner only

```
KASSE BANKING

┌─────────────────────────┐   ┌─────────────────────────┐
│  BUSINESS CHECKING      │   │  KASSE PAY BALANCE       │
│  $12,840.22 available   │   │  $4,230 settling Wed     │
│  Routing: 021000021     │   │  $1,890 settling Thu     │
│  Acct: ·····8847        │   │  Next payout: Tomorrow   │
└─────────────────────────┘   └─────────────────────────┘

RECENT TRANSACTIONS
──────────────────────────────────────────────────────────
May 6   Kasse Pay settlement    +$4,230.00    completed
May 5   Wella Professional       -$312.50     completed
May 5   Twilio SMS                -$18.40     completed
May 4   Payroll disbursement    -$8,420.00    completed
May 3   Kasse Pay settlement    +$3,890.00    completed

[View All Transactions]   [Download Statement]

UPCOMING BILLS
──────────────────────────────────────────────────────────
May 8   Salon Suite Rent       $3,500   3 days
May 10  CosmoProf              $440     5 days
May 15  Payroll                ~$8,400  10 days

[Pay a Bill]   [Manage Vendors]
```

---

### PAGE: BILL PAY

**URL:** `/banking/bill-pay`

**Vendor list:**
- Each vendor card: name, type, payment method, last paid, next due
- Add vendor: name, category (rent/utilities/supplies/payroll/other), payment method (ACH/check/card), bank account info

**Bill creation:**
- Select vendor, enter amount, due date, recurring? (Y → frequency selector)
- Attach invoice (PDF upload)
- Schedule payment (same day / day before due / custom)

**Bill calendar:**
- Calendar view of all upcoming bills
- Color coded by category
- Click bill: see details, mark paid, reschedule

---

### PAGE: SETTINGS

**URL:** `/settings`

**Sub-pages:**

**Business Profile** (`/settings/business`)
- Legal name, DBA name, EIN, business structure
- Primary address
- Logo upload (drag and drop, shows preview)
- Brand color picker (customizes booking page and receipts)
- Website, social links

**Locations** (`/settings/locations`)
- All locations listed
- Each location: name, address, phone, hours, tax rate, timezone
- Add new location
- Per-location: booking settings, terminal assignments

**Booking** (`/settings/booking`)
- Online booking toggle (master on/off)
- Lead time (how far in advance can clients book — minimum hours)
- Max advance (how far in the future can they book — max days)
- Deposit settings (required for all / first-time clients only / specific services)
- Cancellation policy text
- Cancellation window (hours before appointment)
- No-show charge toggle + amount
- Booking confirmation message (customizable)
- Booking page URL (kasseapp.com/book/[slug])

**Payments** (`/settings/payments`)
- Kasse Pay status (active/pending)
- Payout schedule (next-day / standard)
- Tax rate per location
- Payment methods accepted (card/cash/gift card/loyalty)
- Tip settings (options %, allow custom, no tip option)
- Receipt settings (auto-send, email/SMS, footer text)
- Refund policy

**Notifications** (`/settings/notifications`)
- Owner notification preferences:
  - New booking (SMS / Email / Push / None)
  - Cancellation (SMS / Email / None)
  - No-show (SMS / Email / None)
  - New review (Email / None)
  - Low inventory (Email / None)
  - Payroll reminder (Email / None)
- Staff notification defaults

**Integrations** (`/settings/integrations`)
- Google Business Profile (connect → sync reviews, hours)
- Instagram (connect → Book Now button, auto-post)
- QuickBooks Online (connect → sync transactions)
- Mailchimp (connect → sync client list)
- Zapier (API key display)
- Each integration: status (connected/disconnected), last sync time, disconnect button

**Security** (`/settings/security`)
- Change password
- 2FA setup / disable
- Active sessions (device list with "Sign out" per device)
- Account activity log (last 50 login events with IP + device)

**Billing** (`/settings/billing`)
- Current plan (displayed as card with plan name + price)
- Plan change (shows plan comparison modal)
- Addons (list of active addons with monthly cost)
- Payment method for Kasse subscription (separate from Kasse Pay processing)
- Invoice history (last 12 months, download PDF)
- Cancel subscription (triggers freeze flow first)

**Permissions** (`/settings/permissions`)
- Default permission sets (Owner / Manager / Staff)
- Custom permission sets (create, edit, delete)
- Permission matrix (toggle grid)
- Assign sets to staff members

---

### PAGE: AI RECEPTIONIST

**URL:** `/ai-receptionist`

**If not set up — full-screen setup wizard:**
```
Set Up Your AI Receptionist

Your AI Receptionist answers calls 24/7 — booking appointments,
answering questions, and capturing leads while you focus on your clients.

[Step 1: Name & Personality]
[Step 2: Phone Number]
[Step 3: Capabilities]
[Step 4: Test It]
```

**If set up — dashboard:**
```
AI RECEPTIONIST — ARIA                              [Settings]  [Test Call]

STATUS: ● Live · Forwarding from (361) 555-0182

THIS WEEK                   ALL TIME
47 calls handled            1,204 calls handled
12 appointments booked      309 appointments booked
8 calls transferred         201 calls transferred
0 missed (went to VM)       4.8 avg rating

RECENT CALLS
─────────────────────────────────────────────────────────────────────────
May 6 · 3:42 PM   (361) 555-8821   Booking      2m 14s   ✓ Booked 9am Thu
May 6 · 1:18 PM   (361) 555-4932   Question     1m 08s   ✓ Hours answered
May 6 · 11:55 AM  Unknown           Booking      3m 44s   ✗ Transferred
May 5 · 6:12 PM   (361) 555-7743   Reschedule   2m 31s   ✓ Rescheduled
─────────────────────────────────────────────────────────────────────────

[View All Calls]
```

---

### PAGE: COLOR STUDIO (Salon/Nail Verticals Only)

**URL:** `/color-studio`

**Formula Library:**
- All saved formula cards, searchable by client name or product
- Filter by: staff, date, rating, product brand
- Sort by: most recent, highest rated, most used

**New formula card:**
- Client selector (or enter name)
- Service type
- Before photo upload
- Formula builder: product name + amount + developer strength (from inventory)
- Processing timer (sets notification)
- Notes
- After photo upload
- Result rating (1-5 stars)
- Save → attached to appointment and client profile

**Before/After gallery:**
- Grid of before/after pairs with client name, date, staff, service
- One-tap share to Instagram
- Filter by staff, service type, date

**Formula analytics:**
- Most-used products
- Highest-rated formulas
- Which staff members log formulas (compliance metric)

---

### PAGE: FORMS & WAIVERS

**URL:** `/forms`

**Form template list:**
- Default templates pre-built: Chemical Service Waiver, New Client Intake, Health History (med spa/gym), Minor Consent
- Create custom form: drag-and-drop field builder (text, checkbox, signature, date, multiple choice)
- Assign to: new clients, specific services, all appointments

**Submission log:**
- Every form submission with date, client, form name, signature status
- Download PDF of any submission

---

### PAGE: INCUBATOR (Enrolled Orgs Only)

**URL:** `/incubator`

```
KASSE FOUNDERS PROGRAM — COHORT 1 · BEAUTY & PERSONAL SERVICES

Week 4 of 12                          Your business: Salon Envy Corpus Christi

THIS WEEK'S MODULE
Growing Your Team Without Losing Your Culture
[▶️ Watch 45-min session]  [Download workbook]
Due: May 9 by 11:59 PM

YOUR PROGRESS: 3 of 12 modules complete

COHORT MEMBERS (24 participants)
[Grid of business cards — name, business, city, vertical]

GRADUATION REQUIREMENTS
○ Complete all 12 modules
○ $10K+ processed through Kasse Pay during cohort
○ 90%+ on module assessments
○ Attend at least 10 of 12 live sessions

PRIZE STATUS
● On track for Funded Second Location prize
```

---

## MICRO-COMPONENTS THAT MATTER

Every small component is specified. These are the things that separate a product from a professional platform:

**Confirmation dialogs:**
- Never just "Are you sure?" — always state the specific consequence
- "Cancel this appointment? Sarah Johnson will be notified and the $50 deposit will be refunded."
- Two buttons: specific action (red for destructive) + "Keep Appointment"

**Success/error toasts:**
- Slide in from bottom-right on desktop, bottom-center on mobile
- Green border-left for success: "Appointment confirmed · Sarah Johnson, May 8 @ 9am"
- Red border-left for error: "Payment failed · Card declined by issuing bank"
- Auto-dismiss after 4 seconds; click ✕ to dismiss early

**Loading states:**
- Never show blank content — always show skeleton loaders matching the content shape
- Skeleton lines for text, skeleton rectangles for cards, shimmer animation
- No spinners on page loads — only in inline actions (button spinners)

**Form validation:**
- Inline validation (validate on blur, not on submit)
- Error text appears below the specific field — not in an alert at the top
- Required fields marked with red * next to label
- Successful field validation shows subtle green checkmark

**Dropdowns and selects:**
- Custom dropdown component — never native `<select>`
- Searchable for lists > 10 items
- Keyboard navigable (arrow keys, Enter to select, Escape to close)
- Selected item shows in field with X to clear

**Date/time pickers:**
- Calendar-based date picker (not text input that might be wrong format)
- Time picker: 15-minute increments with scroll wheel on mobile
- "Today" shortcut on date pickers

**Phone number inputs:**
- Auto-format as (___) ___-____ as user types
- Validate 10 digits before allowing form submission
- Copy-to-clipboard button on display (not input)

**Currency inputs:**
- Show $ prefix inside input
- Auto-format with comma separators on blur
- Only accept numeric input + decimal point
- Negative values shown in red

**Notification center:**
- Bell icon in topbar with unread count badge
- Dropdown panel: each notification has icon, title, description, time
- Mark all read button
- Click notification: navigate to relevant page
- Types: new booking, cancellation, no-show, new review, alert (inventory/license)

**Search (global):**
- cmd+K / ctrl+K opens search from anywhere
- Search across: clients, appointments, staff, transactions
- Recent searches remembered
- Results grouped by type with icons
- Keyboard navigable

**Mobile bottom navigation (5 tabs):**
- Home, Appointments, Clients, POS/Checkout, More
- "More" opens full menu drawer
- Active tab: teal (#4297A0) icon and label
- Badge on relevant tabs (unread messages, pending appointments)

**Profile avatar:**
- Shows photo if uploaded
- If no photo: initials on #F4EAE6 cream background with #2F5061 text
- Owner avatar in topbar → dropdown: My Profile, Settings, Sign Out

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*This is the ground truth for every UI decision. When in doubt, come here first.*
