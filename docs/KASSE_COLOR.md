# KASSE COLOR
## Professional Color Management System — Built to Replace Vish

**Version:** 1.0 | **Entity:** Reyna Tech LLC | **Status:** PLANNING (Phase 5.5)
**Competitive target:** getvish.com — eliminate their reason to exist

---

## WHAT THIS IS

Kasse Color is a full professional color management system embedded natively inside Kasse. It replaces Vish, replaces paper formula cards, replaces the notes stylists keep on their phones, and replaces the guessing that happens when a client returns after 8 weeks.

The difference between Kasse Color and Vish:

| Capability | Vish | Kasse Color |
|-----------|------|-------------|
| Digital formula cards | Yes | Yes |
| Photo documentation | Basic | Full (before/during/after) |
| AI formula suggestions | No | Yes — based on history + result ratings |
| Inventory integration | No | Yes — auto-deducts product used |
| Cost per service calculation | Basic | Full (product + time + overhead) |
| Franchise formula library | No | Yes — shared across locations |
| Client-facing portal | No | Yes — client sees their own formula history |
| Booking system integration | Limited API | Native — same app |
| Payroll + commission connection | None | Native — formula complexity affects pricing |
| Price: | $89-189/month | Included in Kasse subscription |

Vish charges separately for what Kasse Color delivers as part of the platform.

---

## THE FORMULA ENGINE

### Core Formula Card

Every color service creates a digital formula card attached to the appointment and the client profile.

**Formula card fields:**
- Service type (full color, highlights, balayage, gloss, toner, bleach, color correction)
- Target result (client description + stylist interpretation)
- Section breakdown (base, midlengths, ends, face frame, panels — each with own formula)
- Per-section formula:
  - Brand (Wella, Redken, Schwarzkopf, L'Oréal, Matrix, custom)
  - Shade/color (e.g., 7N, 6RB, 10/1)
  - Level (1-10)
  - Tone
  - Developer volume (10, 20, 30, 40 vol)
  - Ratio (1:1, 1:1.5, 1:2)
  - Amount mixed (grams or oz)
  - Processing time (applied, not total service time)
  - Application technique (brush, bowl, foils, balayage board, freehand)
  - Heat applied (yes/no, temperature if yes)
- Pre-treatment used (bond builder, protein filler, etc.)
- Post-treatment used (toner, gloss, treatment)
- Total product used (auto-calculated from per-section amounts)
- Total product cost (auto-calculated from inventory cost)
- Processing observations (lifted fast, uneven lift, resistant, etc.)
- Result rating (1-5 stars — stylist self-rates outcome)
- Result notes (what to adjust next time, what worked perfectly)
- Client reaction notes (loved it, wanted more lift, too warm, etc.)
- Next appointment recommendation (8 weeks for root touch-up, 12 for balayage)
- Photo set (see below)

### Photo Documentation

Every formula card can have up to 12 photos:
- Before (dry, wet — two standard shots)
- Application (optional — shows technique, foil placement)
- During processing (shows lift progress)
- After rinse (shows raw result before styling)
- After styling (final result — the portfolio shot)
- Detail shots (face frame, parting, ends)

Photos are stored in S3, tagged to client profile and appointment, displayed in chronological order on the client's history so you can see the evolution of their hair over time.

Photos tagged as "portfolio" auto-populate the stylist's Kasse Marketplace profile gallery (with client consent — consent checkbox at photo upload).

---

## AI FORMULA INTELLIGENCE

This is what Vish fundamentally cannot do. Vish stores formulas. Kasse Color thinks.

### Formula Recommendation Engine

When a returning color client books, before the appointment the stylist sees:

```
FORMULA INTELLIGENCE — Sarah Johnson
Last visit: 8 weeks ago | Balayage + gloss

Previous formula:
  Base: Wella 7N + 30vol (1:1) — 45min
  Balayage: Blondor + 20vol freestyled — 35min
  Toner: Shinefinity 09/65 + activator

Result rating: 4/5 ⭐⭐⭐⭐
Stylist notes: "Wanted more brightness at ends. Process 5 min longer next time."
Client notes: "Loved the color, wants slightly warmer at roots next visit"

AI RECOMMENDATION:
  Base: Wella 7WA + 30vol (1:1) — 50min [warmer than last time per client request]
  Balayage: Blondor + 20vol — 40min [5 min longer per previous result note]
  Toner: Shinefinity 09/73 [warmer than 09/65 for warmer overall tone]
  
  Confidence: 87%
  Based on: 3 previous visits, 4.2/5 avg result rating, seasonal adjustment (winter = warmer)
  
  [Apply Recommendation] [Modify] [Start Fresh]
```

### What the AI considers:
- Previous formula and result rating (what worked, what didn't)
- Stylist's own notes from last visit
- Client feedback notes
- How long since last service (lift at roots differs at 6 vs 10 weeks)
- Season (humidity affects processing, warm tones trend in winter)
- Products used (has the formula evolved as client's hair changed?)
- Hair health history (if previous notes say "over-processed," AI suggests more conservative approach)
- Brand substitution availability (if preferred product is out of stock, suggest equivalent)

### Color Matching from Photo

Client sends an inspiration photo or the stylist uploads a target image. AI analyzes:
- Predominant tone (warm/cool/neutral)
- Level (1-10 scale)
- Technique visible (foils, balayage, solid)
- Contrast level (high/low/medium)

Returns:
- "This look is approximately Level 8 warm blonde, balayage technique, low contrast"
- Suggested formula to achieve it based on client's current level and history
- Estimated processing time
- Estimated product cost
- Complexity rating (1-5 — affects pricing recommendation)

### Cost Optimization AI

After formula entry:
- "This formula achieves the same result at 23% less product cost — here's how"
- "You're using 60g of 7N per service but only need 45g based on client's hair density"
- "Switching from Wella to Schwarzkopf for this shade saves $4.20 per service — $840/year at her visit frequency"

### Pricing Intelligence

- "This color correction took 3.5 hours, used $47 in product, and you charged $180"
- "Similar color corrections in Corpus Christi average $220-280 based on our market data"
- "You are undercharging by approximately $45-100 per color correction"
- Annual revenue impact shown: "If you priced color corrections at market rate, you'd earn $8,400 more per year"

---

## INVENTORY INTEGRATION

This is where Kasse Color creates operational value Vish can't touch.

### Real-Time Deduction

When a formula card is completed (service marked done in POS):
- System reads total product amounts from formula card
- Automatically deducts from inventory for each product used
- Inventory updates in real-time

No manual inventory counting. No "where did all the 7N go?" at month end. The formula cards explain exactly where every gram went.

### Pre-Appointment Inventory Check

24 hours before a color appointment:
- System reads the previously recommended formula
- Checks current inventory levels
- Alert if any product is insufficient:
  "Sarah Johnson's appointment tomorrow requires 60g of Wella 7N. Current stock: 38g. You need to order 22g or modify the formula."

### Purchase Order Generation

Based on upcoming color appointments for the next 7 days:
- Total product requirements calculated from recommended formulas
- Cross-referenced against current inventory
- Auto-generated purchase order:
  - Items needed
  - Quantities needed
  - Current distributor pricing
  - One-click order to Kasse Connect (supply marketplace)

### Waste Tracking

Over time:
- What was recommended vs what was actually used (entered at service completion)
- Waste percentage per stylist
- "Jennifer wastes an average of 18% of mixed product — industry benchmark is 8%"
- Training opportunity identification

### Product Cost per Service

On every ticket:
- Product cost: $23.40 (auto-calculated from formula + inventory cost)
- Service price: $145
- Product margin: 83.8%
- Labor cost estimate: $58 (commission)
- Net margin: $63.60 (43.8%)

This is financial intelligence salon owners have never had. They price by feel. Kasse Color prices by data.

---

## FRANCHISE AND MULTI-LOCATION

### Formula Library

Shared formula library accessible across all locations in a franchise network:
- Franchisor publishes "approved formulas" (brand standards)
- Stylists can access the library when starting a new client
- "Most used" formulas across the network
- Stylists can save personal formulas to the library (opt-in)
- Formula rating (how have other stylists rated this formula's results?)

### Formula Standardization

A client who gets her hair done at Salon Envy Corpus Christi and moves to San Antonio:
- Her formula history travels with her (it's on her client profile)
- SA stylist sees exactly what was done, result rating, and notes
- Same result, different city, different stylist

This is the brand consistency that franchise systems spend millions trying to enforce with training. Kasse Color makes it automatic.

### Compliance Monitoring

Franchisor can set approved product lists:
- Only these brands can be used in formula cards
- Alert when unapproved product is entered
- Usage report: which locations are using non-approved products?
- Cost report: are all locations hitting target product margins?

---

## CLIENT-FACING FEATURES

### Client Color Portal

Every client with a Kasse account can view:
- Their complete formula history (every color service)
- Before/after photos from each visit
- Product notes (what was used, why)
- Next appointment recommendation
- "Your formula" — a simplified version they can reference

**Why this matters:** Clients feel a deeper connection to the salon when they can see their own history. It builds trust and reduces the "I can't remember what we used last time" conversation. It's also a loyalty mechanism — if her formula history is at this salon, she's less likely to leave.

### Formula Sharing (controlled)

If a client leaves the salon (moves cities, etc.):
- She can request her formula history as a PDF export
- She cannot take it directly — salon owner approves the export
- The export gives her enough information to brief a new stylist
- New stylist enters the formula into their Kasse Color → becomes part of the network

This is respectful of the client while protecting the salon's data asset.

---

## SCALE AND MEASUREMENT TOOLS

Integrated digital scale functionality for precise color mixing:

### Digital Scale Integration

Bluetooth scale connects to the Kasse Color interface:
- Formula card shows target amounts for each component
- As stylist mixes, scale reads real-time weight
- Visual progress bar fills as target weight is reached
- Auto-alerts at target weight
- Actual amounts recorded vs prescribed amounts
- Variance tracking (over/under mixing patterns)

### Mixing Guide

For every formula:
- Step-by-step mixing instructions
- Visual ratio guide
- "Mix base color first, then add developer, mix 30 seconds"
- Temperature recommendations
- Timing reminders (set timer directly from formula card)
- Application order (if multi-formula service)

---

## ROADMAP — KASSE COLOR PHASES

### Phase 5.5a — Formula Foundation (Commits 1-5)
1. Formula card data model (Prisma schema)
2. Formula card creation UI during appointment
3. Photo upload (S3 integration, before/after)
4. Client formula history on client profile
5. Basic formula display on appointment detail

### Phase 5.5b — Intelligence Layer (Commits 6-10)
6. Result rating + stylist notes on formula
7. Formula recommendation engine (reads history, suggests next)
8. AI color matching from photo (Anthropic vision API)
9. Cost calculation (product cost per formula)
10. Pricing intelligence (compare to market benchmarks)

### Phase 5.5c — Inventory Integration (Commits 11-15)
11. Auto-deduct from inventory on service completion
12. Pre-appointment inventory check + alerts
13. Purchase order generation
14. Waste tracking per stylist
15. Product margin per service calculation

### Phase 5.5d — Multi-Location + Client Portal (Commits 16-20)
16. Formula library (shared across locations)
17. Franchise formula standardization + compliance
18. Client-facing formula portal (read-only)
19. Formula PDF export (salon-approved)
20. Bluetooth scale integration

---

## COMPETITIVE STRATEGY

### Against Vish

Vish is a point solution charging $89-189/month for formula tracking alone. The moment Kasse Color ships:

- Any salon already on Kasse eliminates Vish immediately (saves $89-189/month)
- Any salon using Vish has a reason to evaluate Kasse (get everything Vish does + full POS + booking + CRM + payroll)
- Vish's AI roadmap cannot catch up to ours because they don't have the booking, payment, or inventory data to train on

### The Acquisition Option

When Kasse Color is mature and Kasse has 1,000+ salons, evaluate acquiring Vish:
- Their user base = instant Kasse migration targets
- Their formula data = training data for Kasse Color AI
- Their team = color domain expertise
- Their technology = absorb and deprecate

Watch their funding, their ARR, and their growth rate. A struggling Vish at $5-8M ARR would be acquirable for $15-30M and worth it for the distribution alone.

---

## THE BIGGER VISION

Kasse Color is not just a feature. It is a data asset.

After 3 years and 100,000 color services:
- The most comprehensive color formula dataset in the world
- AI that can recommend formulas better than most colorists
- Pricing benchmarks for every color service in every market
- Product performance data across every professional brand
- Waste reduction intelligence that saves the industry millions

This dataset is worth more than the software. A company like Wella, Redken, or L'Oréal Professional would pay significant money to understand how their products are actually being used, which formulas achieve the best client satisfaction ratings, and where stylists are substituting competitor products.

Build the software. Own the data. That's the exit.
