# KASSE_DAYOPS.md
## Day-in-the-Life Operations — Every Major Business Niche
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## PURPOSE

This document defines exactly what each business type does from open to close, minute-by-minute, and how Kasse serves each moment. This is the specification for what the portal must show, what must be automated, and what decisions must be made by humans versus by the system.

This is not theoretical. This is the ground truth of how a salon owner, a restaurant manager, a gym operator, and a barbershop owner actually spend their day. If Kasse doesn't fit these workflows perfectly, merchants will use workarounds — and workarounds become churn.

**Design principle:** Every screen a merchant sees during their busiest hour must be immediately useful. No digging. No menus inside menus. The data they need for the current moment must be on the surface.

---

## NICHE 1 — SALON / BEAUTY

### The Cast

- **Owner/Manager** (may also be a stylist) — financial oversight, staff management, big picture
- **Front Desk Coordinator** — booking, check-in, checkout, phones, product sales
- **Stylists / Technicians** (4-12) — services, client consultation, formula documentation
- **Shampoo Tech / Assistant** — prep work, support

### Morning Opening (7:30 AM — 9:00 AM)

**Front Desk opens Kasse — first screen:**

```
GOOD MORNING — Today at Luxe Hair Studio

Monday, October 14 — 12 appointments scheduled

TODAY'S SCHEDULE:
  9:00 AM  Jennifer — Sarah M. — Balayage + Toner (3.5 hrs)
  9:00 AM  Maria — Tom K. — Men's Cut + Beard (1 hr)
  9:30 AM  Ashley — New Client — Haircut Consultation
  10:00 AM Jennifer — Walk-in slot (open)
  ...

ALERTS:
  ⚠ 3 unconfirmed appointments (reminders sent, no response)
     → [Call them] or [Mark as confirmed]
  ⚠ Low inventory: Olaplex No. 3 (2 units, reorder at 5)
     → [Reorder]
  ✅ No staff call-outs

AI RECEPTIONIST — Last 8 hours:
  4 calls handled automatically
  2 bookings made while you were closed
  1 question answered ("Do you do extensions?" — answered yes, linked to service page)
  0 calls that needed human follow-up

[View Full Schedule]  [Open Cash Drawer]
```

**What front desk does next:**
1. Reviews unconfirmed appointments — calls or texts manually if AI couldn't confirm
2. Checks inventory alerts — places reorder through Kasse's purchase order system
3. Reviews AI receptionist calls to catch any nuance the AI might have missed
4. Prepares client intake forms for new clients (digital, on iPad for client to fill)

**Stylist opens their individual view:**

```
GOOD MORNING JENNIFER

Your day — Monday, October 14:

  9:00 AM  Sarah M. — Balayage + Toner
           ★ Regular client (18 visits) | Last visit: Balayage, Aug 14
           Formula: [Wella 8/38 + Ox 30vol, process 35min] (saved)
           Note from last visit: "Wants to go a bit brighter this time"
           [View Full Profile →]

  1:00 PM  Maria R. — Color Correction
           ★ New client (referred by Ashley's client) | Patch test done ✓
           Consultation notes: "Orange bands from box dye, wants ash brown"
           [View Consultation →]

  3:30 PM  Linda K. — Root Touch-up + Gloss
           ★ Regular client (31 visits) | Formula: [Saved ✓]

Your tips so far this week: $0 (first day)
Your commission this week: $0 (first day)
```

The stylist reviews Sarah's formula before she arrives. When Sarah sits down, the stylist is already prepared. No "what did we do last time?" conversation. Just expertise.

### Midday Operations (9:00 AM — 2:00 PM)

**Client arrival:**

Front desk checks in client:

```
CHECK IN — Sarah M. (9:00 AM appointment)

Sarah Martinez
  📱 (361) 555-8234  |  📧 sarah@email.com  |  ★★★★★ 5 visits avg rating
  Last visit: August 14 — Balayage + Toner — $185
  Total lifetime value: $1,840 (18 visits)
  
  Allergy alert: ⚠ Latex sensitivity (use nitrile gloves)
  
  Today's service: Balayage + Toner with Jennifer
  Duration: 3.5 hours — Ends: ~12:30 PM
  
  Existing balance: Gift card $50.00 on file
  Deposit paid: None

[Check In ✓]  [Add Note]  [Update Info]
```

The allergy alert is prominent. This is a safety feature. Front desk verbally confirms with Jennifer before starting.

**During service — stylist documents formula:**

```
FORMULA CARD — Sarah M. — Oct 14, 2024

Service: Balayage + Toner

BASE:
  Color: Wella Koleston 8/38
  Developer: Olaplex + Ox 30vol
  Process time: 35 min

BALAYAGE:
  Technique: Freehand, face frame + mid-lengths
  Color: Wella Blondor Freelights
  Developer: Ox 40vol
  Foil placement: Every 3rd section, face frame first
  Process time: 45 min (check at 35)
  
TONER:
  Color: Wella Color Touch 9/86
  Developer: 1.9% Color Touch emulsion
  Process time: 15 min

NOTES:
  Went 1 level lighter than last time per client request.
  She loved it — said "exactly what I wanted."
  Next time: Consider slightly more pearl tones.
  
RESULT RATING: ⭐⭐⭐⭐⭐  [Photo Added ✓]

[Save Formula Card]
```

This takes the stylist 3 minutes to fill while the color processes. It lives permanently in Sarah's profile. The next stylist who sees Sarah (vacation coverage, Jennifer's day off) sees this exact formula.

**Checkout:**

```
CHECKOUT — Sarah M.

SERVICES:
  Balayage + Toner (Jennifer, 3.5 hrs)    $185.00
  
PRODUCTS ADDED:
  Wella Invigo Brilliance Shampoo           $28.00
  Wella Invigo Brilliance Conditioner       $28.00

SUBTOTAL:                                  $241.00
Gift card applied:                         -$50.00
TOTAL DUE:                                 $191.00

TIP FOR JENNIFER:
  [18% — $33]  [20% — $37]  [25% — $46]  [Custom] [Skip]

PAYMENT:
  [Visa ending 4242 (saved)] ← most common for returning client
  [Add new card]  [Cash]  [Gift card]

[Process Payment]
```

Payment processed → Jennifer's commission auto-calculated → tip recorded → inventory auto-deducted (color products used) → review request SMS scheduled for 2 hours later.

**Product sale:**

Client buys shampoo at front desk:

```
RETAIL SALE — Quick Checkout

[Search products or scan barcode: ____________]

Wella Invigo Brilliance Shampoo      $28.00
Wella Invigo Brilliance Conditioner  $28.00
─────────────────────────────────────────────
SUBTOTAL                             $56.00
TAX (8.25%)                          $4.62
TOTAL                                $60.62

[Cash]  [Card]  [Add to Appointment Checkout]

Commission: None (retail — front desk sold)
```

### Evening Close (5:00 PM — 6:30 PM)

**End-of-day report auto-generated:**

```
END OF DAY — Monday, October 14

REVENUE SUMMARY:
  Service revenue:           $1,847.00
  Retail revenue:              $156.00
  Tips collected:              $312.00
  Gift cards sold:             $200.00
  Gift cards redeemed:         -$50.00
  Refunds:                       $0.00
  TOTAL PROCESSED:           $2,465.00

APPOINTMENTS:
  Scheduled: 12 | Completed: 11 | No-shows: 1
  No-show fee charged: $35 (from deposit)

STAFF EARNINGS:
  Jennifer: Services $1,247 | Commission (45%): $560.15 | Tips: $195
  Maria:    Services $380  | Commission (45%): $171.00 | Tips: $67
  Ashley:   Services $220  | Commission (45%): $99.00  | Tips: $50

INVENTORY MOVEMENTS:
  Color used: [detailed list]
  Retail sold: [detailed list]
  LOW STOCK ALERTS: Olaplex No.3 (2 remaining)

FOLLOW-UPS NEEDED TOMORROW:
  Sarah's no-show — consider courtesy call
  Maria R. (color correction) — check in on results
  3 clients due for rebooking (overdue 6+ weeks)

[Export Report PDF]  [Email to Owner]  [View in Reports]
```

**Cash drawer close:**

```
CASH DRAWER RECONCILIATION

Expected cash (from Kasse):   $287.00
Counted cash:                  [___________]

If different: [Record variance + note]

[Close Drawer ✓]
```

### What Kasse Automates (Salon)

All of these happen without any human action:

- Appointment reminder SMS at 24 hours and 2 hours before
- New booking confirmation email + SMS
- Post-appointment review request at T+2 hours
- Commission calculation at every checkout
- Inventory deduction when formula is saved + products checked out
- Rebooking prompt SMS if client hasn't rebooked within their usual cycle
- No-show fee charge (if deposit policy enabled)
- Weekly Business Intelligence Digest email to owner every Monday
- Lapsed client win-back campaign (30/60/90-day sequences)
- Birthday promotion SMS (7 days before birthday)
- Gift card expiry warnings to clients (30 days before)
- Low inventory alerts when stock falls below reorder threshold
- Payroll calculation accumulation (running total updated with every checkout)
- Staff schedule reminders the night before

---

## NICHE 2 — RESTAURANT

### The Cast

- **GM / Owner** — operations, financials, team, vendors
- **Kitchen Manager** — back-of-house, food cost, prep, staff
- **Servers / Wait Staff** — front-of-house, order taking, customer relationship
- **Bartenders** — bar operations, tabs, cocktails
- **Host / Hostess** — seating, waitlist, reservations
- **Busser / Food Runner** — table turnover support

### Pre-Service Prep (10:00 AM — 11:30 AM, lunch service prep)

**GM opens Kasse — morning view:**

```
GOOD MORNING — Tuesday, October 15

RESERVATIONS TODAY:
  Lunch (11:30 AM — 2:00 PM):   18 covers booked
  Dinner (5:30 PM — close):     67 covers booked
  Special event (7:00 PM):      12 covers (Ramirez party, private dining room)

KITCHEN ALERTS:
  ⚠ 86 items from yesterday: [Shrimp Tacos] — still 86'd
     Update menu? [Yes — 86 until restock] [No — restock arriving today]
  ⚠ Low inventory from yesterday's close:
     Roma tomatoes: 2 lbs (need 12 lbs for today's service)
     → [Create purchase order] or [Call vendor: Rodriguez Produce 361-555-4321]

STAFFING:
  Servers scheduled: 6 (1 called out sick — notify manager ✓ done)
  Kitchen staff: 4 (full team)
  Bartenders: 2
  
RESERVATION NOTES:
  Ramirez party (7:00 PM): 12 guests, private dining. 
  Note: Birthday celebration — cake coming from outside.
  Allergy: Miguel Ramirez — tree nut allergy.
  [View Party Setup Checklist]

YESTERDAY'S CLOSE:
  Total revenue: $8,247
  Covers: 184
  Average ticket: $44.82
  Tip percentage (avg): 18.3%
```

**Host opens their view (front desk):**

```
HOST VIEW — Tuesday, October 15

FLOOR PLAN:
[Visual table layout — each table colored by status]
  ● Green: Available
  ● Yellow: Reserved (upcoming)
  ● Red: Occupied
  ● Gray: Cleared/dirty

WAITLIST (current): 0 parties
NEXT RESERVATION: 12:00 PM — Johnson, party of 4

UPCOMING RESERVATIONS (next 2 hours):
  11:30 AM — Williams, 2 guests    TABLE 6 (assigned)
  11:30 AM — Garcia, 6 guests      TABLE 12 (assigned)
  12:00 PM — Johnson, 4 guests     TABLE 8 (assigned)
  12:30 PM — [Walk-in buffer slot]
  1:00 PM  — Chen, 2 guests        TABLE 5 (assigned)
```

### Lunch Service (11:30 AM — 2:30 PM)

**Host manages arrivals:**

Party walks in: 
```
NEW PARTY — Walk-in

Party size: [1] [2] [3] [4] [5] [6] [7] [8+]
Name: ___________
Phone: ___________ (for text notification if wait)

Available tables: TABLE 4 (2-top), TABLE 7 (4-top)
  → [Seat at TABLE 7 ▾]

Or add to waitlist:
  Current wait: 0 minutes
  [Add to Waitlist]
```

Party seated → table status changes to occupied in real-time for all staff.

**Server takes order on tablet/phone:**

```
TABLE 7 — Party of 3 — Server: Miguel

[Add Item ▾]   [Send to Kitchen]   [Close Tab]

CURRENT ORDER:
  2x Enchiladas Verdes               $26.00
  1x Carne Asada Plate               $18.00
  1x Queso Fundido (shared app)      $12.00
  
  2x Margarita (rocks, salt)         $22.00
  1x Modelo                          $7.00

SUBTOTAL:                            $85.00

NOTES FOR KITCHEN:
  "No jalapeños on Enchiladas / Extra crema"
  [Add note]

[Send Order to Kitchen →]
```

Order sent → Kitchen Display System shows order → kitchen prepares → marks each item ready → server notified → food runs.

**KDS (Kitchen Display System) — what kitchen staff sees:**

```
KITCHEN DISPLAY — Tuesday 12:18 PM

TABLE 7 (12:16 PM) — 2 min in queue          [FIRE]
  2x Enchiladas Verdes (no jalapeño, extra crema)
  1x Carne Asada Plate
  1x Queso Fundido APP (fire first)

─────────────────────────────────────────────────

TABLE 3 (12:12 PM) — 6 min in queue          [READY ✓]
  1x Chicken Fajitas
  1x Veggie Burrito (no cheese)

─────────────────────────────────────────────────

DOORDASH ORDER #DD4421 (12:17 PM) — 1 min    [FIRE]
  1x Beef Tacos (3)
  1x Rice + Beans
  → Pickup ETA: 12:40 PM (driver en route)
```

All orders on one screen — dine-in and DoorDash together. Kitchen never loses track.

**Tab management:**

```
ACTIVE TABS — BAR VIEW

TAB #1  Mike H.       Visa ending 4567   $47.00   (open 2.5 hrs)
TAB #2  Table 4       Started 11:55 AM   $62.00   (open 1.2 hrs)
TAB #3  Jennifer K.   Cash tab           $28.00   (open 0.4 hrs)
TAB #4  Company card  AmEx 3782          $189.00  (private party tab)

[Open New Tab]  [Process Bar Order]  [Close Tab]
```

**Checkout:**

```
CHECKOUT — TABLE 7

FOOD:
  2x Enchiladas Verdes            $26.00
  1x Carne Asada Plate            $18.00
  1x Queso Fundido                $12.00

DRINKS:
  2x Margarita                    $22.00
  1x Modelo                        $7.00

SUBTOTAL:                         $85.00
TAX (8.25%):                       $7.01
TOTAL:                            $92.01

TIP:  [18% $16.56]  [20% $18.40]  [25% $23.00]  [Custom]
      Client selects on payment terminal

SPLIT PAYMENT:
  ○ Even split (3 ways): $30.67 each
  ○ Custom split
  ○ One person pays

PAYMENT METHOD:
  [Credit/Debit — Terminal]  [Cash]  [Gift Card]

[Process Payment]
```

**Tip distribution:**

```
TIP DISTRIBUTION — Auto-calculated

Server: Miguel (Table 7 — $18.40 tip)
  → Tip pool contribution: $3.68 (20% to tip pool)
  → Miguel keeps: $14.72

Tip pool distribution:
  Bussers: $1.84 (50% of pool)
  Food runners: $1.84 (50% of pool)
  
  Tonight's pool total: $187.40
  Distribution: Bussers $2, Runners $1 per hour worked

[End of Night: Calculate Final Tip Pool]
```

### Service Close (2:30 PM — 5:00 PM, pre-dinner prep)

**Post-lunch report:**

```
LUNCH SERVICE CLOSE — Tuesday, October 15

Service: 11:30 AM — 2:15 PM (2h 45m)

REVENUE:
  Food:              $2,840.00
  Beverage:          $1,120.00
  Total:             $3,960.00
  
COVERS: 84
AVG TICKET (per person): $47.14
AVG TABLE TURN: 52 minutes

TOP SELLERS:
  1. Carne Asada Plate (31 sold)
  2. Enchiladas Verdes (28 sold)
  3. Margarita (44 sold)

86 ITEMS FIRED (out of stock during service):
  Shrimp Tacos — ran out at 1:15 PM (had 8 left from yesterday)
  
SERVER PERFORMANCE:
  Miguel: 4 tables, $1,240 revenue, 19.2% tip avg
  Ana: 4 tables, $1,180 revenue, 18.8% tip avg
  Carlos: 3 tables, $940 revenue, 17.1% tip avg

INVENTORY DEDUCTIONS (auto-calculated from sales):
  Ground beef: 8.2 lbs used
  Chicken breast: 4.4 lbs used
  Tortillas: 64 used
  [View full inventory log]

REORDER ALERTS (based on this service):
  Roma tomatoes: 2 lbs remain, need to restock
  [Place emergency produce order]
```

### Dinner Service (5:30 PM — close)

**Reservation management during peak:**

```
FLOOR STATUS — Tuesday 7:12 PM — PEAK SERVICE

FLOOR:                                   PATIO:
  T1  [Occupied — 47min]   T7  [Reserved 7:30]    P1  [Occupied — 23min]
  T2  [Available]           T8  [Occupied — 12min]  P2  [Available]
  T3  [Occupied — 1hr 2m]  T9  [Dirty — being cleaned]
  T4  [Reserved 7:15]      T10 [Occupied — 38min]
  T5  [Occupied — 22min]   T11 [Available]
  T6  [Occupied — 55min]

WAITLIST (7:12 PM):
  Rodriguez — 4 guests — waiting 8 minutes — [Text ready]
  Thompson — 2 guests — waiting 3 minutes
  
RAMIREZ PRIVATE PARTY (7:00 PM):
  Checked in ✓ | All 12 guests arrived | Private dining room set
  Allergy alert active: TREE NUT — Miguel Ramirez (seat 3)
  Birthday cake in kitchen fridge [Confirm timing with kitchen]
```

**Allergy management:**

When server enters an order for the Ramirez table, tree nut allergy is prominent on every screen. Kitchen sees it. Server sees it. Any modification to the order re-displays the allergy. This is a liability management system, not just a note.

### What Kasse Automates (Restaurant)

- Reservation confirmation email + SMS
- Reservation reminder 2 hours before
- Waitlist text notification when table is ready ("Your table is ready! We have 10 minutes to seat you.")
- Tip pool calculation at end of service
- Inventory deduction (recipe-based — menu item sold = ingredients deducted)
- Low inventory alerts (real-time during service)
- End-of-service revenue report
- Staff performance report
- Online order routing from DoorDash/Uber Eats to KDS
- Server performance benchmarking

---

## NICHE 3 — GYM / FITNESS

### The Cast

- **Owner / GM** — strategy, financials, culture
- **Front Desk** — check-in, member management, sales, scheduling
- **Class Instructors** — class delivery, client relationships
- **Personal Trainers** — 1-on-1 sessions, client programs
- **Membership Sales** (larger gyms) — new member onboarding

### Morning Opening (5:30 AM — 9:00 AM) — Early Bird Hours

**Front desk opens — first screen:**

```
GOOD MORNING — Tuesday, October 15

CLASSES TODAY:
  6:00 AM — CrossFit Foundations    12/20 registered  → [Take Attendance]
  7:00 AM — Olympic Lifting          6/12 registered  → [Take Attendance]
  8:00 AM — Yoga Flow               14/15 registered  → [Take Attendance]
  9:00 AM — Kids Fitness             4/10 registered
  ...

MEMBERSHIP ALERTS:
  ⚠ 8 memberships expiring within 7 days — auto-renewal enabled for 6
  ⚠ 2 memberships with expired payment methods
     → [Attempt charge] or [Contact members]
  
  4 members haven't been in for 30+ days
  → Automated win-back message scheduled for 9:00 AM

MEMBER CHECK-INS (early morning — started 5:45 AM):
  5:47 AM — David R. — Monthly member ✓
  5:52 AM — Lisa P. — Monthly member ✓
  5:59 AM — Tom W. — 10-class pack (7 remaining) ✓
  6:03 AM — New walk-in waiting...

[Check In Member]  [Register Walk-In]  [Open Register]
```

**Front desk tablet — check-in flow:**

Member approaches desk:

```
MEMBER CHECK-IN

[Scan QR code / key fob] or [Search by name/phone]

Search: [jennifer____]

→ Jennifer Martinez
   Monthly Member — CrossFit
   Membership: Active ✓ (renews Nov 1)
   Class today: 6:00 AM CrossFit Foundations ✓ (registered)
   
   Photo: [thumbnail for visual ID]
   Birthday: December 14 (birthday in 2 months)
   
   Last visit: Yesterday (4:58 PM) — consecutive days: 2
   Monthly visits this month: 12
   
   Personal record notes: Back squat: 185 lbs | Deadlift: 225 lbs
   
   [Check In ✓]
```

Check-in takes 5 seconds. Staff greets Jennifer by name, knows she's on a 2-day streak, knows she registered for the class. That's community.

**New walk-in membership sale:**

Prospect walks in:

```
NEW MEMBER ENROLLMENT

Personal info:
  Name: ___________  Phone: ___________  Email: ___________
  Emergency contact: ___________  Relationship: ___________
  DOB: ___________  (for youth programs)

Health screening:
  [Kasse-generated PAR-Q health screening questions]
  Digital waiver: [Client signs on screen — DocuSign-style]

Photo: [Take with iPad camera]

Membership selection:
  ○ Month-to-Month     $79/month   (no commitment)
  ○ 6-Month Contract   $65/month   (billed $390 upfront)
  ○ 12-Month Contract  $55/month   (billed $660 upfront)
  ○ Student (ID required) $49/month
  ○ Family (add-on, existing member) $39/month per person
  ○ Day Pass          $20        (one-time)
  ○ Class Pack (10)   $150       (expires 90 days)

Access method:
  ○ QR code (via Kasse Client App)
  ○ Key fob ($15 — add to today's charge)
  ○ Both

Payment:
  [Add card to file — auto-renews on membership anniversary]

[Create Member — Charge today: $______]
```

Member enrolled → QR code available immediately on their phone → they can walk back to the class → check-in confirmed.

### Mid-Morning Class Management (9:00 AM — 12:00 PM)

**Instructor's class view:**

```
YOGA FLOW — 9:00 AM
Tuesday, October 15

REGISTERED MEMBERS (14/15):
  ✓ Sarah J.    ✓ Maria K.    ✓ Tom R.
  ✓ Linda B.    ✓ James M.    ✓ Ashley P.
  ✓ Kevin D.    ✓ Rachel S.   ✓ Diego V.
  ✓ Carmen H.   ✓ Brian W.    ✓ Yuki T.
  ✓ Nicole F.   ✓ Mark A.
  
  ○ [Walk-in spot available — add member]

HEALTH/MODIFICATION NOTES:
  Sarah J.:  Lower back concern — offer modifications
  Brian W.:  Recovering from knee surgery — no deep lunges
  
CLASS NOTES (previous sessions):
  "Group is intermediate level, comfortable with inversions.
   Requested more hip-opener sequence."

After class:
  [Take Attendance ✓]  [Add Class Note]  [Post to Feed]
```

Attendance taken after class:
```
ATTENDANCE — Yoga Flow 9:00 AM

14 registered. Who was actually here?

[✓ All Present — 14]  or mark individual absences:

  ☑ Sarah J.     ☑ Maria K.     ☑ Tom R.
  ☑ Linda B.     ☑ James M.     ☑ Ashley P.
  ☑ Kevin D.     ☑ Rachel S.    ☑ Diego V.
  ☑ Carmen H.    ☑ Brian W.     ☑ Yuki T.
  ☑ Nicole F.    ☐ Mark A. (no-show)

Mark-A as: ○ No-show  ○ Cancelled <24 hours (charge $10)
```

### Afternoon — Personal Training Sessions (12:00 PM — 6:00 PM)

**Personal trainer view:**

```
MY SESSIONS — COACH MIKE — Tuesday, October 15

12:00 PM — Alex Chen — Week 6, Session 3/4 this week
  Goal: Lose 30 lbs, build baseline strength
  Program: 3-day full body, progressive overload

  LAST SESSION (Thursday):
    Squat: 95 lbs × 3 × 10
    RDL: 85 lbs × 3 × 10
    Bench: 75 lbs × 3 × 10
    Row: 70 lbs × 3 × 10

  TODAY'S PROGRAM (auto-generated from Mike's template):
    Squat: 100 lbs × 3 × 10 (+5 lbs)
    RDL: 90 lbs × 3 × 10 (+5 lbs)
    Bench: 80 lbs × 3 × 10 (+5 lbs)
    Row: 75 lbs × 3 × 10 (+5 lbs)
    
    [Start Session]  [Modify Program]  [Record Results]

2:30 PM — Maria Gonzalez — Assessment + Program Design (new client)
4:00 PM — Robert Kim — Week 2, Session 2
```

**Session logging:**

```
RECORDING SESSION — Alex Chen — 12:00 PM

EXERCISE               TARGET       ACTUAL         RPE (1-10)
─────────────────────────────────────────────────────────────
Back Squat             100×3×10     100×3×10  ✓    7
Romanian Deadlift      90×3×10      90×3×10   ✓    6
Flat Bench Press       80×3×10      80×3×8    ⚠    9  (had to drop to 2 reps on last set)
Barbell Row            75×3×10      75×3×10   ✓    7

CARDIO FINISHER:
  15 min incline walk — completed ✓

SESSION NOTES:
  "Alex struggled on bench today — may be deloading next week.
  Great energy otherwise. Weight is down 2 lbs from last week."

NEXT SESSION RECOMMENDATION:
  Deload bench to 75 lbs (address fatigue)
  Squat: continue 5 lb progression to 105 lbs

[Save + Generate Next Program]  [Send Summary to Alex]
```

Alex receives post-session summary via email/SMS:
"Great workout today! You hit your squat and deadlift PRs. Here's a recap of your session and your plan for Thursday: [link]"

### Membership Management Dashboard

```
MEMBERSHIP OVERVIEW

ACTIVE MEMBERS: 312
  Monthly members:     198
  Annual members:      87
  Student members:     19
  Family add-ons:      8

MRR: $22,840
Projected annual: $274,080

METRICS THIS MONTH:
  New members:         23
  Cancellations:        8
  Net new:             +15
  Churn rate:          2.6%

MEMBERS AT RISK:
  • 12 members with failed payment (auto-retry in 3 days)
  • 18 members who haven't visited in 30+ days
  • 4 members in cancellation pending status

CLASS FILL RATES (this week):
  ████████████████████ CrossFit 6am: 95% (waitlist forming)
  ████████████████     CrossFit 7am: 82%
  ████████████████████ Yoga 9am: 97% (waitlist: 3)
  ████████             Pilates 4pm: 62% (underperforming)
  ████                 Bootcamp 5pm: 41% (consider canceling or promoting)

[Full Membership Report]  [Contact Lapsed Members]  [Add Class]
```

### What Kasse Automates (Gym)

- Member check-in via QR code / key fob (no staff required for check-in at staffed gate)
- Membership renewal billing (auto-charge on anniversary date)
- Expiring membership warnings (7 days, 3 days, 1 day before)
- Failed payment retry sequence (3 attempts over 7 days, then suspend access)
- Class reminder SMS (1 hour before registered class)
- Waitlist notification (immediate — text "A spot opened in 6am CrossFit — book it: [link]")
- Lapsed member win-back (30/60/90 day sequences)
- Birthday discount (member receives special offer on birthday month)
- PT session reminder the day before
- Class cancellation notification if instructor cancels
- New member welcome sequence (Day 0, 3, 7, 14, 30)
- Progress report to PT clients (weekly automated summary)

---

## NICHE 4 — BARBERSHOP

### The Cast

- **Owner** (often also a barber) — operations + cutting
- **Barbers** (2-8) — haircuts, shaves, beard work
- **Front Desk** (in larger shops) — walk-in queue management, booking
- **Apprentice** (in shops with mentorship programs)

### The Walk-In Queue (Core Barbershop Feature)

Most barbershops are 50-70% walk-in. The queue system is critical.

```
WALK-IN QUEUE — Tuesday, October 15

NOW: 2:47 PM

BARBER        STATUS           CLIENT
─────────────────────────────────────────────────────
Marcus        ● Cutting         Tony R. (est. done 3:05)
DeShawn       ● Cutting         Walk-in (est. done 2:55)
Carlos        ● Available       ← Next in line
Ramon         ● Available       ← After Carlos

QUEUE (7 waiting):
  1. John W. — Added 2:31 PM — waiting 16 min
  2. Marcus Jr. — Added 2:38 PM — waiting 9 min
  3. Walk-in — Added 2:44 PM — waiting 3 min
  4. Diego M. — Added 2:45 PM — waiting 2 min
  5. [Empty slot] — reservation at 3:30
  6. Kevin D. — Added 2:46 PM — waiting 1 min
  7. Tyler S. — Added 2:47 PM — waiting <1 min

EST. WAIT FOR NEW WALK-IN: ~28 minutes

[Add Walk-In]  [Manage Queue]  [Call Next]
```

**Digital queue board (displayed on lobby TV):**

A separate Kasse display mode that connects to a TV in the lobby:

```
[BARBERSHOP NAME]                    TIME: 2:47 PM

NOW BEING SERVED:
  MARCUS:   Tony R.              ~18 min remaining
  DESHAWN:  Guest                ~8 min remaining

NEXT UP:
  CARLOS:   John W.              Next
  RAMON:    Marcus Jr.           Next

WAIT TIME FOR NEW ARRIVALS: ~28 min

Walk-ins welcome! Add yourself to the queue:
  [QR code] Scan to join the digital queue from your phone
```

**Remote queue join (via QR code or SMS):**

Customer outside the shop texts "QUEUE" to the shop's number → receives:
"You're #7 in line at [Shop Name]. Est. wait: 28 min. We'll text you when you're next. Reply CANCEL to remove yourself."

5 minutes before their turn: "You're next at [Shop Name]! Head in now to keep your spot."

This is gold for barbershops. Customers go run an errand. They come back exactly when it's their turn. No one standing around. Lobby less crowded. Better experience.

**Appointment management (for shops that also do appointments):**

```
SCHEDULE — Marcus — Tuesday, October 15

9:00 AM  Regular appointment — Carlos V. (monthly fade)
10:00 AM Walk-in slot (open)
11:00 AM Walk-in slot (open)
12:00 PM Regular appointment — Javier M. (biweekly cut + beard)
1:00 PM  LUNCH
2:00 PM  Walk-in slot → currently assigned to Tony R.
3:30 PM  Appointment — Kyle B.
5:00 PM  Walk-in slots (open)
6:00 PM  Last appointment — David Chen (father + son double booking)
```

### Checkout (Barbershop)

```
CHECKOUT — Carlos's CLIENT — Walk-in

SERVICE:
  Fade (mid skin) — 35 min          $35.00
  Beard trim                         $10.00

PRODUCTS SOLD:
  Suavecito Pomade                   $18.00

SUBTOTAL:                            $63.00

TIP FOR CARLOS:
  [18% $6.30]  [20% $7.00]  [25% $8.75]  [Custom]

PAYMENT: [Card]  [Cash]  [Cash App]  [Venmo]

→ Split pay options for clients who prefer: add Cash App / Venmo as payment method
  (recorded as "digital payment" in reports — deposited manually by barber daily)

[Process Payment]
```

**Commission:**
```
CARLOS'S EARNINGS — Tuesday, October 15

Type:  ○ Booth renter  ● Commission barber

Services: $480 | Commission (60%): $288.00
Tips: $112.00
Total: $400.00

Booth rent (due Friday): $150/week (deducted from settlement Friday)
```

### Barbershop Client Profile

```
MARCUS JR. — Regular Client

Barber: Marcus (prefers Marcus only)
Last visit: 3 weeks ago
Visit frequency: Every 3-4 weeks
Total visits: 47
Member since: February 2021

SERVICE HISTORY:
  Skin fade (temple to skin) + line-up — consistently

BARBER NOTES:
  "Prefers razor on temples. Goes short on the top — not textured.
   Line-up: slight natural arch, not too straight. 
   Don't touch the beard — he maintains it himself."

CONTACT PREFERENCES:
  SMS reminders: ✓  | Email: ✗ | Preferred time: Saturdays

[Book Next Appointment]  [Send Win-Back] [Call/Text]
```

---

## NICHE 5 — MED SPA

### Unique Operational Complexity

Med spas have the highest compliance burden of any vertical Kasse serves:
- Medical director oversight requirement
- Scope-of-practice compliance (who can perform what)
- Informed consent for every invasive procedure
- HIPAA considerations for health information
- Before/after photo management with consent documentation
- Pre/post treatment instructions
- Adverse event documentation

### Client Intake — Med Spa Specific

Before any appointment:

```
CLIENT MEDICAL INTAKE — Jennifer Martinez

BASIC HEALTH HISTORY:
  Current medications: _________________________
  Allergies (medications, products, latex): _______
  Recent surgeries (last 6 months): ______________
  Autoimmune conditions: _______________________
  Active infections or skin conditions: ___________
  Pregnancy / breastfeeding: ○ Yes  ● No  ○ N/A

SERVICE-SPECIFIC QUESTIONS (Botox — Forehead):
  Previous neurotoxin treatments? ○ Yes  ● No
  If yes, when and what product?  _______________
  Previous adverse reactions?     ○ Yes  ● No
  Muscle/nerve conditions (ALS, MS, etc.)? ● No

INFORMED CONSENT:
  [Full consent document — scrollable]
  Client initials each page and signs at bottom
  [Signed digitally — timestamp: Oct 15, 2024 at 2:31 PM]
  
PHOTOS:
  Pre-treatment photos taken: ✓ (5 photos saved)
  Photo consent: ✓ Signed (for treatment records, not marketing)
  Marketing photo consent: ○ Yes  ● No

[Submit Intake — Patient can now be seen]
```

Consent is stored permanently. Retrievable for any compliance audit. Never deletable by staff.

**Provider view during treatment:**

```
TREATMENT — Jennifer Martinez — Botox Forehead

PROVIDER: Dr. Sarah Kim, MD
MEDICAL DIRECTOR: Dr. James Rodriguez, MD (on file)

TODAY'S TREATMENT PLAN:
  Botox — Forehead
  Dosage plan: 20 units total
    Frontalis: 10 units (4 injection points)
    Glabella: 10 units (5 injection points)
  
  Product: Botox (Allergan) — Lot #: XK23847
  Dilution: 2.5cc saline per 100u vial
  Expiration: Dec 2024

TREATMENT LOG (during procedure):
  Injection point 1: ___u | location noted
  Injection point 2: ___u | location noted
  [Full injection map with body diagram]

POST-TREATMENT INSTRUCTIONS: [Auto-generated per procedure type]
  → Will be emailed to client immediately after appointment
  → Follow-up call scheduled: 48 hours post-treatment (automated)

ADVERSE EVENTS: ● None  ○ Document event
```

**Post-treatment follow-up automation:**

Immediately after treatment → email with:
- Post-care instructions (templated per treatment)
- What to expect (timeline of effect)
- When to call (signs of adverse reaction with phone number)
- 2-week follow-up appointment link (optional — for touch-up)

48 hours later → automated follow-up SMS:
"Hi Jennifer! Checking in after your Botox treatment on Tuesday. How are you feeling? Any questions or concerns? Reply or call us at [phone]."

### Photo Management

```
BEFORE / AFTER PHOTOS — Jennifer Martinez — Botox Forehead

BEFORE (October 15, 2024):
  [Frontal]  [45° Left]  [45° Right]  [Full Face]  [Close-up forehead]

AFTER (November 15, 2024 — 4 week follow-up):
  [Frontal]  [45° Left]  [45° Right]  [Full Face]  [Close-up forehead]

Photo consent:
  Treatment records: ✓ Consented
  Marketing use: ✗ Not consented — cannot use in social media or advertising

[View Comparison]  [Add to Treatment Record]  [Request Marketing Consent]
```

---

## NICHE 6 — AUTO SERVICE (DETAIL / QUICK LUBE / REPAIR)

### The Cast

- **Service Advisor** — customer-facing, estimates, sales, check-in/out
- **Technicians** — service execution
- **Cashier / Front Desk** — payment, scheduling
- **Detail Crew** — auto detailing (if detailing shop)

### Vehicle-Based Client Profile

In auto service, the service record is attached to the vehicle, not just the customer. One customer may have multiple vehicles.

```
CUSTOMER PROFILE — Michael Rodriguez

VEHICLES:
  🚗 2019 Toyota Camry XSE — Charcoal
      VIN: 4T1B11HKXKU168472
      License: ABC-1234 (TX)
      Mileage at last visit: 47,230

  🚗 2022 Ford F-150 — White
      VIN: 1FTFW1E83NFC04831
      License: XYZ-7890 (TX)
      Mileage at last visit: 12,840

CAMRY SERVICE HISTORY:
  Oct 15, 2024  Oil Change + Filter       $89.00   47,230 mi
  July 3, 2024  Tire Rotation + Balance   $65.00   44,110 mi
  Apr 12, 2024  Full Detail               $249.00  41,800 mi
  Jan 8, 2024   Oil Change + Cabin Filter $104.00  39,200 mi

NEXT SERVICE DUE (CAMRY):
  ⚠ Oil Change: Due at 50,230 miles or Jan 2025 (whichever first)
  ⚠ Tire Rotation: Due at 50,110 miles
  ○ Brakes: Last inspected 18 months ago — recommend inspection
```

**Work order:**

```
WORK ORDER #WO-4821

Customer: Michael Rodriguez
Vehicle: 2019 Toyota Camry — 4T1B11HK... — 47,230 mi

SERVICES AUTHORIZED:
  ☑ Oil Change (synthetic 5W-30) + Filter  $89.00
  ☑ Tire Rotation (all 4)                  $35.00
  ☑ Cabin Air Filter replacement           $45.00

SERVICES RECOMMENDED (declined today):
  ☐ Brake inspection                       $0 (free with service)
  ☐ Fuel system cleaner                    $39.00

TECHNICIAN NOTES:
  "Front left tire wear pattern slightly uneven — recommend alignment check next visit"

MILEAGE IN / MILEAGE OUT: 47,230 / _____ (tech fills on completion)

ESTIMATED COMPLETION: 12:45 PM (45 minutes from drop-off)
STATUS: ● In Progress (started 12:07 PM)

[Update Status]  [Add Service]  [Notify Customer Ready]
```

**Service completion notification:**

```
YOUR CAR IS READY 🚗

Mr. Rodriguez, your Toyota Camry is ready for pickup at 
[Shop Name].

Services completed:
  ✓ Oil Change (synthetic 5W-30)
  ✓ Tire Rotation
  ✓ Cabin Air Filter

Total: $169.00

Your technician noted:
  "Front left tire shows slight uneven wear pattern. 
   Recommend alignment check at next visit."

Next service due:
  Oil change at 50,230 miles or January 2025

[Pay & Pick Up →]  or pay in person.

[Shop Address + Directions]
```

### Detailing-Specific Operations

For standalone detail shops:

```
DETAIL JOB TRACKER

JOB #D-0382 — Maria Garcia's Tesla Model 3

  PACKAGE: Premium Detail + Paint Correction Stage 1
  STATUS: ● In Progress — Paint Correction (Step 3 of 5)

  WORKFLOW:
  ✓ Step 1: Pre-wash + iron decon        (completed 9:15 AM)
  ✓ Step 2: Clay bar + paint decon       (completed 10:40 AM)
  ● Step 3: Stage 1 correction (compound)  (in progress)
  ○ Step 4: Stage 1 polish               (pending)
  ○ Step 5: Ceramic coating apply         (pending — 24hr cure)
  ○ Step 6: Final inspection + delivery   (pending — tomorrow AM)

PHOTOS:
  Before (8:30 AM):  [4 photos saved]
  During:            [2 photos added]
  After:             [pending completion]

TECHNICIAN: Carlos (Lead Detailer)
ESTIMATED COMPLETION: Tomorrow — 8:00 AM (multi-day job)

Customer will be notified at each major step. ✓
[Send Progress Update to Maria]
```

---

## NICHE 7 — RETAIL BOUTIQUE

### The Cast

- **Owner** — buying, merchandising, financials
- **Sales Associates** — customer service, styling, checkout
- **Inventory Manager** — receiving, stocking, ordering (may be owner)

### POS and Inventory (Core Retail Operations)

**Quick checkout:**

```
POS — RETAIL QUICK SALE

[Scan barcode] or [Search: _______]

  Zara-style Mini Dress — Black, Size M     $78.00
  Gold Hoop Earrings — 2" (scan ✓)         $24.00
  Moisturizing Lip Gloss — Clear           $12.00
  ─────────────────────────────────────────────────
  SUBTOTAL                                 $114.00
  DISCOUNT: Loyalty member 10% off         -$11.40
  TAX (8.25%)                               $8.47
  TOTAL                                    $111.07

  Loyalty points earned: 111 points
  Total loyalty balance: 847 points
  ($10 reward available at 1000 points — so close!)

  [Credit/Debit]  [Cash]  [Gift Card]  [Store Credit]

[Complete Sale]
```

**Inventory management dashboard:**

```
INVENTORY OVERVIEW

TOTAL PRODUCTS: 342 SKUs
TOTAL UNITS: 1,847
INVENTORY VALUE: $38,240

LOW STOCK (under 5 units):
  Silk Wrap Dress — Small         2 units  → [Reorder]
  Linen Blazer — Navy/XS         1 unit   → [Reorder]  
  Gold Hoop Earrings 2"          3 units  → [Reorder]

BESTSELLERS (last 30 days):
  1. Linen Summer Dress           sold 34
  2. Minimalist Watch             sold 28
  3. Crossbody Leather Bag        sold 22

SLOW MOVERS (30+ days without sale):
  Patterned Scarf — Purple       in stock 14, 0 sold this month → [Markdown?]
  Winter Coat — Camel/XL         in stock 3, 0 sold since April → [Move online?]

RECEIVING:
  Purchase order PO-0847 arriving today — [Receive Inventory]
```

**Receiving inventory:**

```
RECEIVING — PO-0847

Vendor: Magnolia Wholesale
Expected: Today

ITEMS ON ORDER:
  Product                          Ordered  Received  Difference
  ─────────────────────────────────────────────────────────────
  Silk Wrap Dress — Small/Medium   10       [___]
  Silk Wrap Dress — Large          5        [___]
  Boho Maxi Skirt — Assorted       20       [___]
  Linen Shorts — White/S, M, L    12       [___]

NOTES: ___________________________________________

[Complete Receiving — Update Inventory]
```

**Returns / exchanges:**

```
RETURN / EXCHANGE

Receipt lookup: [Scan receipt barcode or enter order #]

ORDER #8247 — Maria Johnson — Oct 12, 2024

RETURN REQUEST:
  Zara-style Mini Dress — Black, Size M — $78.00
  Reason: [Size too small — wants Medium]
  Condition: ○ Unworn, tags on  ● Worn (not eligible per policy)
  
  Policy: Returns within 14 days with tags. Worn items: store credit only.
  
  Since worn: STORE CREDIT ONLY — $78.00

[Issue Store Credit]  [Override policy — authorize full refund (manager approval)]
[Decline return]
```

---

## NICHE 8 — PET GROOMING

### Unique Considerations

- Pet profile is as important as client profile (breed, weight, temperament, medical notes)
- Aggressive or fearful pet notes are safety-critical
- Vaccine records (some groomers require proof of rabies/bordetella)

```
CLIENT: Maria Rodriguez — Pet: Max (Golden Retriever, 6 yrs)

GROOMING HISTORY:
  Sept 14: Full groom + blueberry facial — 2.5 hrs — $85
  Aug 2:   Bath + brush out — 1.5 hrs — $55
  June 18: Full groom — 2 hrs — $80

GROOMER NOTES:
  "Max is high energy at drop-off but settles quickly.
   He's sensitive around his back paws — go slowly.
   Prefers hand dryer, not cage dryer.
   Ears get waxy — clean every groom."

⚠ MEDICAL NOTES:
  "Hip dysplasia — no table lifts without support.
   Always use grooming sling for back support."

VACCINES ON FILE:
  Rabies: Expires March 2025 ✓
  Bordetella: Expires November 2024 ⚠ Due soon — [Remind owner]

APPOINTMENT TODAY:
  Full groom — 2 hrs — 10:00 AM — 12:00 PM (est.)
  Groomer: Ashley
  Special request: "Trim around eyes, she can barely see"

Status updates sent to owner:
  ✓ 10:05 AM — "Max has arrived and we're getting started!"
  ⟳ 11:15 AM — "Halfway done — looking great!" (scheduled)
  ○ Upon completion — "Max is ready! Come pick him up 😊"
```

**Drop-off / Pick-up tracking:**

```
PET STATUS BOARD — Tuesday, October 15

Drop-offs:
  Max (Golden) — Ashley — Groom — ETA 12:00 PM    ● In progress
  Bella (Poodle) — Sarah — Bath/brush — ETA 11:30  ✓ Ready for pickup!
  Charlie (Corgi) — Mike — Nail trim — ETA 11:00   ✓ Ready for pickup!

Owner notifications sent automatically. ✓
```

---

## CROSS-NICHE FEATURES THAT APPLY TO ALL

### The Command Bar (All Verticals)

Cmd+K anywhere in portal:

```
> _

Recent:
  Add walk-in client
  View today's schedule
  Run end-of-day report
  
Quick commands:
  /book [name] — start booking for client
  /client [name] — search client
  /checkout [name] — start checkout
  /report — today's revenue
  /inventory [product] — check stock level
  /staff — staff on duty today
```

### The Business Intelligence Email (All Verticals)

Every Monday, every merchant gets:

Salon version: Revenue, bookings, no-show rate, best performer, win-back candidates
Restaurant version: Revenue, covers, avg ticket, top menu items, labor cost %
Gym version: New members, cancellations, class fill rates, lapsed member count
Retail version: Revenue, units sold, bestsellers, inventory turnover

### The Notification Center

All staff see a unified notification center:

```
NOTIFICATIONS

⚠ Appointment in 10 minutes — Sarah M. with Jennifer
✅ Payment confirmed — Table 7 — $92.01
📦 Inventory alert — Olaplex No. 3 low (2 units)
⭐ New 5-star review just posted on Google
📱 AI Receptionist: 1 new booking while you were busy
🎂 Client birthday tomorrow — Rachel S. — send promo?
```

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 2 kickoff (core operations implementation)*
