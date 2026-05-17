# KASSE FEATURES BIBLE
## Complete Feature Specification

**Version:** 1.0 | **Status:** LIVING DOCUMENT

---

## 1. POINT OF SALE

### Transaction Engine
- Card-present via Payroc Terminal SDK (Pax A920 Pro, Bluetooth reader)
- Card-not-present via Hosted Fields (web deposits, no-show fees, online booking)
- Saved card charges via Payroc secure tokens
- Cash with change calculation and drawer reconciliation
- Split payments (part card, part cash, part gift card, part loyalty)
- Custom payment types (Venmo, Zelle, house account — configurable)
- Partial payments and payment plans
- Offline mode with idempotent queue and retry on reconnect
- Tip adjustment post-swipe (Payroc tip-adjust API)
- Void, full refund, partial refund
- Surcharge support (pass processing fee to client — configurable per location)
- Tax-exempt client flag
- Per-service tax rates
- Comps and discounts (%, flat, by category, by client type)
- Employee discounts
- Manager override for discounts above threshold
- All payments branded "Powered by SalonTransact"

### Cart / Ticket
- Multi-service ticket (multiple services, multiple stylists)
- Service modifiers (length, complexity, add-ons)
- Add-on services (with or without additional time)
- Product retail sales on same ticket
- Custom line items (misc charges)
- Internal notes per ticket (staff-only)
- Client-facing receipt notes
- Ticket parking (save and return)
- Split ticket (one visit, multiple clients)
- Family booking (one card, multiple people)
- Auto-apply membership discounts
- Auto-apply loyalty points redemption
- Deposit credit on checkout

### Receipt
- Digital via SMS or email
- Printed via Bluetooth thermal printer
- QR code on receipt linking to rebooking
- Custom footer (business message, social handles)
- Tip line on printed receipt
- Itemized breakdown with stylist name
- Location address + phone
- "Powered by SalonTransact" (non-removable)
- Auto-send on checkout (configurable)

### Phone Booking Card Capture
- SMS/email card-capture portal for phone bookings (SD-K-029) — for phone-only bookings, send client a secure link to enter card via Payroc Hosted Fields. Card held for no-show protection per cancellation policy.
- Geolocation-enforced checkouts — POS terminal verifies device location is within configured radius of salon (default 100ft per SD-K-030). Soft warn + audit log on out-of-geofence.
- Owner remote checkout — owners/managers can process payments from any device using Payroc Hosted Fields, bypassing iPad pairing requirement.

---

## 2. BOOKING & SCHEDULING

### Calendar Engine
- Multi-stylist column view (Day / Week / Month)
- Color-coded by stylist
- Drag-to-reschedule, drag-to-extend
- Real-time availability (respects buffer time, hours, breaks)
- Double-booking alerts (configurable — allow or block)
- Waitlist auto-fill on cancellation
- Recurring appointments
- Block time (lunch, personal, vacation)
- Multi-stylist appointment (two stylists, one client)
- Service duration buffers
- Mobile stylist travel time
- 15-minute slot granularity — booking slots align to 15-minute increments
- Per-stylist buffer time override — service has default buffer, stylist can override for their bookings
- AI schedule builder from photo — upload photo of handwritten weekly schedule, AI extracts and creates digital schedule (PREMIUM+ only)
- Recurring appointment series with seriesId — link recurring appointments for "edit all future" operations

### Online Booking Widget
- Embeddable on any website (single script tag)
- Standalone page at kasseapp.com/book/[slug]
- Stylist-first OR service-first flow (configurable)
- Real-time availability
- Deposit collection at booking (Hosted Fields)
- Auth hold at booking (charges day-of)
- Cancellation policy shown + agreed at booking
- Guest or account-based booking
- Family + group booking
- Add-on upsell during booking flow
- Promo code field
- Intake form + waiver at booking
- Google Reserve integration ("Book Now" on Google Maps)
- Instagram booking button
- Facebook booking button
- Booking confirmation SMS + email
- Reminder SMS + email (24hr, 48hr — configurable)
- 2-way confirmation ("Reply YES to confirm")
- Abandoned booking detection + recovery SMS

### Kiosk Check-In
- Phone/email lookup
- Shows appointment, confirms details
- Collects missing intake forms (fills on kiosk)
- Add-on upsell at check-in
- Walk-in self-service (select service, stylist preference, get wait estimate)
- Alerts stylist + front desk on arrival
- Generates 6-digit unique checkout code
- Marketing opt-in collection
- Checkout via kiosk (enter code, review ticket, tip, pay)
- Rebook prompt after checkout

### Waitlist
- Add to waitlist (service, stylist preference, date flexibility)
- Auto-notify on slot opening (SMS)
- Rolling waitlist (notify → wait X min → move to next)
- Waitlist analytics (conversion rate, avg wait)
- Manual notify button

---

## 3. CLIENT MANAGEMENT

### Client Profile
- Full contact info + photo
- Date of birth (birthday automation)
- Gender + pronouns
- Preferred stylist
- Complete service history (every visit, what was done, by whom)
- Formula history (color, chemical — encrypted)
- Product purchase history
- Before/after photo gallery (tagged to visit)
- Intake forms on file
- Signed waivers on file
- Tags (VIP, Allergy Alert, Late Canceller, New Client, etc.)
- Public notes + private staff-only notes
- Communication preferences (SMS, email, marketing opt-ins)
- Lifetime value (from engine)
- Visit frequency (avg days between visits)
- Churn risk score (AI-calculated)
- Referral source + referrals made
- Family members linked
- Saved payment methods (Payroc secure tokens)
- Gift card balances
- Loyalty points balance
- Active memberships
- Deposits on file

### Family Accounts
- Primary adult account holder
- Add family members (children, spouse, parent)
- Child books under parent's account
- Charges to parent's card on file
- Family group booking (whole family, one checkout)
- Minor flag (under 18 — guardian required)

### Client Intelligence (AI)
- Churn prediction with risk score
- Upsell suggestions based on history
- LTV prediction (3-year projected value)
- Visit pattern analysis
- Sentiment analysis from reviews + communication
- Personalized campaign suggestions

---

## 4. STAFF MANAGEMENT

### Roster
- Profiles with photo, bio, specialties
- Roles (Owner, Manager, Stylist, Front Desk, Booth Renter)
- Multi-location assignment
- Working hours per location per day
- Commission rate (flat %, tiered, by service category)
- Booth rental rate (auto-deducted from payout)
- License number + expiry (TDLR for Texas)
- W-9 status, payout method
- Custom color on calendar
- Client-facing profile for marketplace
- Multiple compensation models per stylist — single stylist can have salary + commission, hourly + commission, per-service commission, booth rental classification, or any hybrid
- Traveling stylists — primary location designation + ability to work at other org locations
- Geofenced time clock — iPad in-salon + geofenced mobile (Capacitor), 100ft radius, jailbreak detection, IP triangulation (SD-K-030)
- Profitability calculator — what-if scenarios for switching commission models, showing financial impact per stylist

### Performance Tracking
- Revenue generated
- Services completed
- Retail sold
- Tips received
- Commission earned
- Rebook rate %
- New clients attracted
- Average ticket size
- Goal vs actual (configurable KPIs)
- Leaderboard (own rank visible, others' numbers private)
- AI trend alerts ("Your rebook rate dropped 12% this month")

### Scheduling
- Schedule template (Mon-Sun)
- Week-by-week overrides
- Time-off requests (submit + approve flow)
- Geofenced clock-in/out (GPS + radius enforcement)
- Clock event logging (timestamp, coordinates, IP)
- Overtime alerts
- Auto-schedule suggestion (AI fills based on demand)

### Commission Engine (SD-K-026, SD-K-019)

Every compensation model is configurable per-stylist:
- **Flat commission percentage** — same % across all services
- **Per-service commission** — different % per service category
- **Tiered commission** — % increases at revenue thresholds (e.g., 30% → 40% → 50%)
- **Hourly + commission** — base hourly + commission on services performed
- **Salary + commission** — base salary + commission on services performed
- **Booth rental classification** — stylist pays rent, runs own POS (v1 — true sub-merchant v2)
- **Hybrid** — any combination of above models for a single stylist

**Tip splits** — configurable per salon:
- Primary-only (all tip to lead stylist)
- Time-based (split by time on service)
- Revenue-ratio (split by revenue contribution)
- Explicit percentages (manually set per stylist)

**Profitability calculator** — what-if analysis: "If I switch Jane from 50% flat to tiered 40/50/60, here's the projected impact on her take-home and salon margin."

**Payroll export** — CSV/PDF export for Gusto/ADP/manual processing. v1 does not disburse payroll directly (SD-K-019).

---

## 5. INTELLIGENCE & REPORTING

### Standard Reports
- Daily sales summary + cash drawer reconciliation
- Revenue by service category, stylist, location, payment method
- Tip summary, discount/comp report, tax collected
- Gift card sales and redemptions
- Membership revenue
- Refunds and voids
- Appointment report (booked, completed, cancelled, no-show rate)
- Client acquisition (new vs returning)
- Client retention (rebook rate by stylist)
- Inventory usage
- Labor cost (commission + hourly)
- Net profit estimate
- Payroll export (CSV for Gusto/ADP)

### AI-Powered Analytics
- Demand forecasting (next 7 days by hour)
- Revenue forecasting (monthly projection)
- Slow period prediction
- Stylist efficiency scoring
- Service profitability analysis
- Client segment revenue contribution
- Churn impact modeling ("Win back 40 lapsed clients = $18k annual revenue")
- Seasonal pattern recognition

### Live Dashboard
- Real-time revenue
- Current appointments and queue
- Who's on floor
- Cash drawer status
- Alerts (low inventory, overdue forms, license expiry)
- Same-day comparison to last week

---

## 6. MARKETING ENGINE

### Campaign Types
- One-time blast
- Always-on automation
- Drip sequences
- Event-triggered

### Triggers
- Post-visit (X hours after completion)
- Lapsed client (no visit in X days)
- Birthday (day-of or week-before)
- First visit anniversary
- Abandoned booking
- Low loyalty points / approaching expiry
- Membership renewal approaching
- No-show follow-up
- Review request (after service marked complete)
- Rebooking reminder
- Weather-triggered (slow day → send offer)

### Channels
- SMS (Twilio)
- Email (Resend)
- Push notification (mobile app)
- In-app notification
- Voice message (ElevenLabs — Phase 9)

### Content
- Template library (pre-built, customizable)
- AI content generation (Claude)
- Personalization tokens
- A/B testing (auto-winner selection)
- CAN-SPAM + TCPA compliant unsubscribe

### Segmentation
- Pre-built: All, New, VIP, Lapsed, Birthday, By service, By stylist
- Custom filter builder (any field, AND/OR logic)

---

## 7. REPUTATION MANAGEMENT

- Auto-request after appointment
- 5-star → push to Google/Yelp
- Under 4-star → internal only, alert manager
- Google My Business API integration
- Yelp Fusion API integration
- AI-generated review responses (one-click send)
- Response time tracking
- Reputation score (composite, trending)

---

## 8. INVENTORY & PRODUCTS

- Retail + professional product catalog
- SKU / barcode support
- Stock levels per location
- Low stock alerts
- Auto-deduct when used in service
- Purchase orders + vendor management
- Barcode scanner support
- Product commission for stylists
- Reorder suggestions (AI)

---

## 9. LOYALTY, GIFT CARDS & MEMBERSHIPS

### Loyalty
- Points per dollar + per visit + for referrals + for reviews
- Tier system (Bronze / Silver / Gold) with configurable thresholds
- Points redemption at checkout (engine-backed)
- Points expiry
- Balance shown in client portal + at checkout

### Gift Cards
- Digital (email/SMS delivery)
- Physical (manual balance entry)
- Custom denominations
- Bulk / corporate purchase
- Outstanding liability dashboard

### Memberships
- Monthly / annual recurring billing (Payroc saved tokens)
- Service packages (X services/month)
- Unlimited service type
- Discount membership (% off all services)
- Pause and cancel flows
- Auto-apply discount at checkout

---

## 10. FRANCHISE SYSTEM

### Franchise Management
- Org → Zone → Location three-tier hierarchy
- Franchisee login (access only to their locations)
- Franchisor sees all (read-only revenue view)
- Per-location settings (hours, tax, tips, terminal IDs)
- Franchisee performance ranking

### Franchise Creator Portal
- FDD (Franchise Disclosure Document) builder (23 items, pre-filled from Kasse data)
- Franchise agreement template generator
- Territory mapping tool (draw + lock territories on map)
- Franchisee application portal
- Franchisee vetting dashboard (approve/deny)
- Training portal (upload SOPs, videos, brand standards)
- Brand standards compliance monitoring
- State registration tracker (which states require FDD registration)
- Attorney referral marketplace (revenue share with franchise attorneys)

### Franchise Fees
- Technology fee configuration (flat or %)
- Royalty fee (flat or %)
- Marketing fund fee (flat or %)
- Auto-calculation from revenue
- Auto-collection via SalonTransact
- Franchisee fee dashboard (owed + paid)
- Royalty reports

### White-Label for Franchises
- When a business franchises through Kasse, their franchise system IS Kasse white-labeled
- Each franchisee gets portal.[franchisebrand].com
- Franchisor controls feature access
- Full brand customization per franchise system

---

## 11. STYLIST MARKETPLACE

### Consumer Side (kassestylists.com)
- Search by city, specialty, price, availability
- AI stylist matching ("balayage, medium hair, under $150, Saturday afternoon")
- Style quiz → service + stylist recommendation
- Portfolio gallery (photos + 15-second video reels)
- Verified reviews
- Real-time availability shown
- Book directly (goes into Kasse calendar)
- "Trending in [City]" section
- Instagram portfolio integration (auto-pulled via API)

### Stylist Side
- Auto-profile from Kasse account (opt-in)
- Featured placement (paid — $50/month)
- Portfolio upload + management
- Booking management from marketplace
- Analytics (views, bookings, revenue from marketplace)

### Independent Stylist Tier
- $29/month "Stylist Solo" plan
- Marketplace listing
- Basic booking widget
- Kasse payment processing
- Tax tracking via SalonBacked

### Revenue Model
- Free listing for Kasse subscribers
- Featured placement ($50/month)
- Marketplace booking fee (1% on marketplace-originated bookings)
- Independent stylist subscriptions ($29/month)
- Product brand advertising placements
- Stylist hiring board (salons post jobs, stylists apply — $99/post)

---

## 12. KASSE CONNECT (B2B SUPPLY MARKETPLACE)

- Salons order professional products directly in Kasse
- Integrated with Salon Centric, CosmoProf, Beauty Systems Group
- Wholesale rates negotiated by Kasse
- One-click reorder from inventory alerts
- Margin or referral fee on every order

---

## 13. DEVELOPER PLATFORM

- Full REST API
- GraphQL endpoint
- Webhooks (any event, full CRUD, delivery replay)
- API key management (create, revoke, scope, expire)
- Sandbox/test mode
- OpenAPI 3.1 spec (auto-generated)
- Interactive API docs (Scalar)
- JavaScript/TypeScript SDK (first), Python, PHP, Ruby (later)
- Postman collection (auto-generated)
- Developer portal
- "Built on Kasse" program
- Chrome extension for front desk (client pops on call identification)
- WordPress plugin (booking on WordPress sites)
- Wix app
- Shopify sync (product inventory)
- Zapier + Make integrations
- Agent-native design (HATEOAS, semantic endpoints, agent audit log)

---

## 14. AI FEATURES

### AI Receptionist (Voice)
- Twilio inbound → OpenAI Realtime API (GPT-4o) — real-time speech-to-speech
- Full Kasse context (appointments, clients, staff, services, hours)
- Books/reschedules/cancels directly in Kasse
- Answers FAQs (hours, pricing, location, parking, policies)
- Detects frustration → transfers to human
- Sends SMS confirmation after booking
- Logs every call with full transcript
- AI self-scores call quality
- Available 24/7, never misses a call
- English, Spanish, French natively
- Custom persona name and greeting
- Outbound calling (confirmations, reactivation campaigns)
- Call analytics dashboard

### Kasse AI (In-Portal Assistant)
- Natural language queries ("Which stylist has highest rebook rate?")
- AI content generation for campaigns
- Demand forecasting
- Revenue forecasting
- Anomaly detection + proactive alerts
- Stylist AI coach (weekly performance summary)

### AI Booking Agent (Website Widget)
- Chat widget on any website
- Conversational booking ("I want a haircut Saturday morning")
- Real-time availability from engine
- Upsells add-ons in conversation
- WhatsApp, Instagram DM, SMS channel support
- Handoff to human when complex

---

## 15. KASSE CAPITAL

- Revenue-based cash advances for salons
- Offer based on verified revenue data in Kasse (no application needed)
- Repay as % of daily revenue
- Instant transfer via SalonTransact
- Risk scored by AI (engine knows their churn rate, growth rate, seasonality)

---

## 16. KASSE HARDWARE BUNDLE

- "The Kasse Station" — branded hardware bundle
- iPad Air + secure floor stand + Payroc reader + receipt printer
- $499 bundle (shipped, drop-fulfilled)
- Creates lock-in, premium onboarding experience
- Kasse Kiosk Mode (locked iPad, can't exit without PIN)

---

## 17. VERTICAL ADAPTATION (BUSINESS-TYPE ONBOARDING)

At onboarding, business selects their type. Kasse reconfigures itself:

| Business Type | Unique Features |
|---------------|-----------------|
| Hair Salon | Color formula history, stylist-first booking, TDLR license tracking |
| Barbershop | Walk-in queue focus, fade/beard service types, quick checkout |
| Nail Salon | Station-based (not stylist-column), product usage tracking |
| Med Spa | HIPAA-aware notes, treatment consent forms, injector credentials |
| Fitness / Gym | Class-based booking (many clients, one slot), membership-first |
| Restaurant | Table management, menu-based POS, reservation + walk-in queue |
| Auto Service | Vehicle record (VIN, make/model), bay assignment, service advisor |
| General Business | Full suite, no vertical config — configure your own categories |

---

## 18. PROFITABILITY INSIGHTS

**Authority:** SD-K-026 (AI scope), conversation addition

### What-If Calculator

Owner inputs scenarios; system projects impact:
- Switch stylist commission model → estimated change in take-home and salon margin
- Change service price → projected revenue and demand impact
- Add a new service → estimated revenue ramp
- Adjust booth rent → impact on operator margin and stylist economics

### AI Recommendations

PREMIUM+ feature. Weekly AI analysis surfaces:
- "Your Saturday demand for color is 40% higher than capacity. Consider adding a colorist or extending hours."
- "Stylist A's rebook rate dropped 15% this quarter. Top reason from review analysis: wait time complaints."
- "Service X has 35% margin vs 50% target. Recommended price: $185 (currently $165)."

### Static Reports

- Service profitability table (margin %, profit per hour, cost to deliver)
- Income target dashboard (revenue needed to hit owner's personal + business goals)
- Three-tier financial reporting (Simple / Intermediate / Advanced)
- Per-location vs aggregate views

---

## 19. CARD-CAPTURE PORTAL FOR PHONE BOOKINGS

**Authority:** SD-K-029

Unique to Kasse. No competitor has this pattern.

### Flow

1. Front desk receives phone booking call
2. Receptionist creates appointment in Kasse with client phone number
3. Kasse generates secure short URL + SMS link sent to client phone
4. Client clicks link → mobile-optimized page with appointment details + Payroc Hosted Fields form
5. Client enters card → Payroc tokenizes → token stored on Client record
6. Card held for no-show protection per cancellation policy
7. Receptionist gets real-time notification when card is added
8. Booking confirmed once card is on file

### Why It Matters

- Eliminates PCI risk of taking card numbers over the phone
- Supports no-show fee enforcement for phone bookings (a major revenue protection)
- Better client UX than reading 16 digits over a noisy phone line
- Required for any salon enforcing cancellation policies on phone bookings
