# KASSE_INTEGRATIONS.md
## Integrations Hub — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## STRATEGIC CONTEXT

A software platform without integrations is an island. The businesses that use Kasse also use Instagram, Google, Facebook, TikTok, WhatsApp, QuickBooks, Mailchimp, Shopify, and dozens of other tools. If Kasse doesn't play well with these tools, merchants are forced to maintain two separate realities — one in Kasse, one in the rest of their life. That friction is a churn driver.

More importantly: **social media and online presence is where customers are won.** A salon that doesn't have a "Book Now" button on Instagram is losing bookings every day. A gym that can't let visitors book a free trial class directly from their Google listing is losing members. A restaurant that doesn't have online reservations on their website is invisible.

Kasse's Integration Hub turns every channel where a potential customer might discover a business into a direct booking/ordering/joining pathway into Kasse. We make the merchant omnipresent. We make every touchpoint a conversion point.

**Build Phases:**
- Phase 4 (Vertical Config): Basic website widget embed
- Phase 5 (AI Features): Google Reserve, Instagram Book Now
- Phase 8 (Integrations): Full social suite, Kasse Sites, API Hub, third-party deep integrations

---

## THE INTEGRATION HUB — PORTAL SECTION

Settings → Integrations

Visual layout: Grid of integration cards organized by category.

```
INTEGRATIONS

[Search integrations...]

BOOKING & DISCOVERY
[Google Reserve]  [Instagram]  [Facebook]  [TikTok]  [WhatsApp]  [Yelp]

WEBSITE & ONLINE PRESENCE
[Kasse Sites]  [Website Widget]  [Online Store]  [QR Codes]

PAYMENTS & FINANCE
[QuickBooks]  [Xero]  [Wave]  [FreshBooks]  [Stripe] ← (for Connect only)

MARKETING & COMMUNICATION
[Mailchimp]  [Klaviyo]  [Constant Contact]  [Twilio Messaging]  [Zapier]

DELIVERY & ORDERING
[DoorDash]  [Uber Eats]  [GrubHub]  [Postmates]

E-COMMERCE
[Shopify]  [WooCommerce]  [Etsy]  [Amazon]

HR & PAYROLL (Pre-SalonBacked)
[Gusto]  [ADP]  [Paychex]  [QuickBooks Payroll]

REVIEW PLATFORMS
[Google Reviews]  [Yelp]  [Facebook Reviews]  [TripAdvisor]

DEVELOPER
[API Keys]  [Webhooks]  [OpenAPI Spec]  [Sandbox]
```

Each card shows: integration name, logo, brief description, status (Connected / Not Connected), and connect button.

---

## SECTION 1 — BOOKING & DISCOVERY INTEGRATIONS

### 1.1 — Google Business Profile + Google Reserve

**What it does:**
- Syncs business information (name, address, phone, hours, service list) from Kasse → Google Business Profile automatically
- Enables "Book Now" button on Google Maps listing
- Enables "Book Now" button on Google Search result
- Reviews from Google surface in Kasse Reputation Management
- Google Analytics events fire when bookings originate from Google

**Setup flow:**

```
CONNECT GOOGLE BUSINESS PROFILE

Step 1: Sign in with Google
        [Sign in with Google →]
        (Needs: Business Profile access, Google Reserve partner status)

Step 2: Select your business location
        [Multiple locations if applicable]

Step 3: Sync your information
        We'll sync:
          ✓ Business name, address, phone, hours
          ✓ Service menu (Google Service List)
          ✓ Photos from your Kasse portal
          ✓ New bookings appear directly in your Kasse calendar

Step 4: Activate "Book Now" on Google
        Once connected, "Book Now" appears on your Google listing 
        within 48 hours (Google processing time).

[Connect Google Business Profile]
```

**Google Reserve specifics:**
- Google Reserve (formerly Reserve with Google) allows native booking from Google
- Requires Kasse to be a registered Google Reserve partner (API approval required — Kasse applies as partner for all merchants)
- Booking flow: Customer sees "Book" on Google → selects service/time → enters info → books directly → appears in Kasse calendar
- No redirect to Kasse portal — native Google experience
- Cancellations and rescheduling propagated back to Kasse

**Technical implementation:**
- Google Business Profile API for data sync
- Google Reserve partner API for booking flow
- Webhook receiver for booking confirmations from Google
- Daily sync job for hours/info updates

### 1.2 — Instagram

**What it does:**
- "Book Now" button on Instagram business profile
- Instagram DM booking automation (client DMs "BOOK" → receives booking link)
- Auto-post from Kasse Color (before/after photos with AI-generated captions)
- Instagram Story booking link integration
- Instagram Shopping (for retail product integrations)
- Review/mention monitoring in Kasse reputation dashboard

**Setup flow:**

```
CONNECT INSTAGRAM

Step 1: Connect your Instagram Business account
        (Must be converted to Business or Creator account in Instagram)
        [Connect with Facebook →] (Instagram requires Facebook login)

Step 2: Activate features:

  ☑ "Book Now" button on your Instagram profile
    → Customers can book directly from your profile page

  ☑ DM booking automation
    → When someone DMs "book", "booking", or "appointment",
      they automatically receive a link to your Kasse booking page
    → Customize the auto-response message below

  ☑ Auto-post color work
    → After saving a Kasse Color before/after, you can post directly
      to Instagram with one click and AI-generated captions

  ☑ Mention monitoring
    → Track when your business is tagged or mentioned

[Connect Instagram]
```

**Instagram DM automation (deep spec):**

Keyword triggers (customizable):
- "book" / "booking" / "appointment" / "schedule" / "available" / "availability"

Auto-response template (editable):
```
Hi [client's Instagram name]! 👋 
We'd love to book you in. Click here to see our availability 
and schedule your appointment: [kasse booking link]

See you soon!
— [Business Name]
```

Alternatively, for businesses that want a more conversational DM bot:
- "What services are you interested in?" → shows service menu inline
- Client selects → shown available times → books from DM (requires Instagram Messaging API partnership)
- More advanced — Phase 8 or 9

**Kasse Color Instagram integration:**

After saving a before/after in Kasse Color:
```
POST TO INSTAGRAM

Before photo:  [thumbnail]
After photo:   [thumbnail]

Caption (AI-generated, editable):
  Fresh balayage on this gorgeous client! ✨ 
  Swipe to see the transformation. 
  Ready for your color upgrade? 
  Book via the link in our bio! 
  #balayage #haircolor #salonlife #CorpusChristi

Hashtags style:  ○ Minimal  ○ Standard  ● Maximum
Post time:       ○ Now  ○ Schedule: [time picker]

[Post to Instagram]  [Download Only]  [Cancel]
```

AI caption generation via Claude API — styled to business's existing Instagram voice (analyzes last 20 posts if connected to calibrate style).

### 1.3 — Facebook

**What it does:**
- "Book Now" button on Facebook Business Page
- Facebook Messenger booking automation (same as Instagram DM but for Messenger)
- Facebook Reviews sync to Kasse reputation dashboard
- Facebook Ad conversion tracking (bookings attributed to FB ads)
- Facebook Events sync (promote upcoming classes, events, promotions)

**Facebook-specific features:**

Facebook Events integration:
- Gym creates a "Yoga Class — Saturday 10am" event in Kasse
- Sync to Facebook Events automatically
- Clients RSVP on Facebook → imported as Kasse bookings
- Attendance tracked against RSVPs after event

Facebook Ads conversion pixel:
```
FACEBOOK ADS CONVERSION TRACKING

When someone clicks your Facebook ad and books through Kasse,
we send a conversion event back to Facebook.

This tells Facebook what your bookings are worth, so it can
optimize your ads to reach people most likely to book.

Your average booking value: $148 (calculated from Kasse data)
[Connect Facebook Pixel — Enter your Pixel ID: _____________]
```

### 1.4 — TikTok

**What it does:**
- "Book" button on TikTok Business Profile
- Link in bio booking page (dedicated mobile-optimized landing page)
- TikTok Shop integration (retail product sales from TikTok content)
- TikTok Ads conversion tracking

**TikTok link-in-bio page:**

Mobile-first booking page at [brand].kasseapp.com/tiktok

Optimized for TikTok audience:
- Vertical video format header (auto-playing loop of before/after or atmosphere)
- Massive "Book Now" CTA
- Services with prices visible immediately (no scrolling)
- 5-star review prominently displayed
- "Follow us on TikTok" button

Why TikTok-specific page: TikTok audiences are younger, faster-moving, attention-scarce. The standard booking page is too long. TikTok page = one scroll to book.

**TikTok Shop:**
For salons selling retail products (shampoo, treatments, styling products):
- Products in Kasse inventory sync to TikTok Shop
- A stylist's TikTok video shows a product they love → product is shoppable directly in TikTok
- Purchase in TikTok → deducts from Kasse inventory → triggers fulfillment notification

### 1.5 — WhatsApp Business

**What it does:**
- WhatsApp booking link (business.kasse.io/[business] opens booking in WhatsApp web)
- AI receptionist on WhatsApp (client texts → AI responds → books)
- Appointment reminders via WhatsApp (higher open rate than SMS in many markets)
- WhatsApp Business catalog (service list browsable in WhatsApp)

**WhatsApp AI booking:**

Client texts the business's WhatsApp number:

```
CLIENT: Hi! Do you have any availability this Saturday?

KASSE AI: Hi! We have availability on Saturday at:
  - 10:00 AM
  - 11:30 AM
  - 2:00 PM
  - 3:30 PM
  
What service are you interested in?

CLIENT: Highlights

KASSE AI: Perfect! Which stylist would you prefer?
  - Jennifer (Specialist, $185/hr)
  - Maria (Senior Stylist, $145/hr)
  - Ashley (Stylist, $115/hr)

CLIENT: Jennifer please

KASSE AI: Great choice! Jennifer has 2:00 PM available on Saturday.
  Shall I book that for you?
  Name: _____
  Phone: _____

CLIENT: Yes — Sarah Johnson, 361-555-1234

KASSE AI: You're booked! ✓
  Service: Highlights with Jennifer
  Date: Saturday, October 19 at 2:00 PM
  Address: 123 Main St, Corpus Christi, TX
  
  A confirmation will be sent to your phone.
  Reply CANCEL to cancel (must be 24+ hours before appointment).
```

The entire booking flow happens inside WhatsApp. No app download, no website visit. This is massive in Hispanic markets, international markets, and any demographic where WhatsApp is the primary messaging app.

### 1.6 — Yelp

**What it does:**
- "Request a Quote" → converted to Kasse booking request
- "Book Now" (if Yelp supports the category)
- Yelp reviews sync to Kasse reputation dashboard
- Business information sync (hours, services)

---

## SECTION 2 — WEBSITE & ONLINE PRESENCE

### 2.1 — The Kasse Booking Widget (Universal Embed)

The most important integration for most businesses: putting Kasse booking directly on their existing website.

**One-line embed:**

```html
<script src="https://app.kasseapp.com/widget.js" 
        data-business-id="biz_xk2847sj"
        data-theme="light"
        data-color="#606E74"
        data-button-text="Book Now"
        data-services="all">
</script>
```

This single script tag renders a "Book Now" button anywhere on any website. Works with WordPress, Wix, Squarespace, Shopify, custom HTML, WebFlow, or any website builder.

**Widget configuration options:**

| Parameter | Options | Description |
|-----------|---------|-------------|
| data-theme | light, dark | Widget color scheme |
| data-color | any hex | Accent color (matches business brand) |
| data-button-text | any string | Button label ("Book Now", "Reserve", "Schedule") |
| data-services | all, [service IDs] | Show all services or specific ones |
| data-staff | all, [staff IDs] | Show all staff or specific ones |
| data-location | [location ID] | For multi-location businesses |
| data-style | button, inline, float | Button only, inline calendar, floating button |

**Widget visual variants:**

Button style (most common):
```
[Book an Appointment →]  ← floating button in corner or inline on page
```
Click → overlay opens with full booking flow.

Inline style:
```
┌─────────────────────────────────────────────┐
│  Schedule Your Appointment                  │
│  ─────────────────────────────────────────  │
│  Select Service:  [Haircut ▾]               │
│  Select Staff:    [Any Available ▾]         │
│  Date:            [October ▾] [2024 ▾]      │
│  ────────────────────────────────────────── │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun           │
│   14   15   16   17   18  [19]  20           │
│  ────────────────────────────────────────── │
│  Available times on Saturday:               │
│  [10:00 AM] [11:30 AM] [2:00 PM] [3:30 PM] │
│                                             │
│  [Select a time to continue →]              │
└─────────────────────────────────────────────┘
```
Rendered directly in the page, no popup.

Float style:
```
┌─────────────────────────┐
│  📅  Book Now           │  ← sticky floating button in lower right
└─────────────────────────┘
```
Persists as user scrolls the page. Click opens overlay.

**Vertical-specific widget variations:**

Salon: "Book an Appointment" → service → stylist → time → client info → deposit (if required) → confirm

Restaurant: Two buttons — "Make a Reservation" and "Order Online" → separate flows

Gym: Three buttons — "Join Now" (membership signup), "Book a Class" (class schedule), "Try Free" (lead gen)

Med Spa: "Schedule a Consultation" → consultation booking flow (with intake form) → separate treatment booking

Retail: "Shop Online" (e-commerce) or "Book an In-Store Appointment" (styling, fittings)

**WordPress plugin:**

For the dominant website platform, a dedicated plugin:
- Install from WordPress Plugin Directory or upload ZIP
- Configure with Kasse API key from portal
- Insert widget anywhere via shortcode: `[kasse_booking style="inline"]`
- Or use Gutenberg block: drag "Kasse Booking" block from block library

**Squarespace / Wix / Webflow:**

Custom embed blocks in each platform accept the JavaScript snippet. Step-by-step instructions with screenshots for each platform available in Kasse Help Center.

### 2.2 — Kasse Sites (Full Website Builder)

For merchants with no website or a terrible one.

**Product positioning:** Not trying to compete with WordPress or Webflow. This is specifically optimized for service businesses that need a professional online presence fast. 10 minutes from setup to live site.

**Domain options:**
- Free: [businessname].kasseapp.com
- Custom domain: Connect existing domain (Cloudflare/GoDaddy/Namecheap DNS config, guided)
- Buy a domain through Kasse: GoDaddy integration, purchase and connect in one flow

**Site templates by vertical:**

Every template is:
- Mobile-first
- Speed-optimized (Lighthouse score > 95)
- SEO pre-configured (schema.org markup, meta tags, sitemap)
- Booking/ordering/joining integrated from the start
- Auto-populated from Kasse profile data

**Salon / Beauty template pages:**

Home: 
- Hero: Full-width image/video with booking CTA
- "Our Philosophy" section (2-3 sentences from Kasse profile)
- Service highlights (3-4 featured services from Kasse catalog)
- Staff showcase (auto from Kasse staff profiles)
- Gallery preview (before/after from Kasse Color)
- Google Reviews widget (last 6 reviews)
- Location, hours, "Book Now" CTA footer

Services:
- Full service menu auto-synced from Kasse (price, duration, description)
- Category tabs (Hair, Color, Treatments, etc.)
- Each service has "Book This Service" button

Team:
- Staff cards auto-generated from Kasse staff profiles
- Photo, name, title, specialties, bio
- Individual "Book with [Name]" button per staff member

Gallery:
- Before/after grid from Kasse Color
- Filter by service type, by stylist
- Instagram feed embed

Book:
- Full Kasse booking widget (inline style)

Contact:
- Map, address, phone, email
- Contact form (messages arrive in Kasse inbox)

**Restaurant template pages:**

Home: Atmosphere, cuisine, hours, reservation CTA, online order CTA

Menu: Full menu with photos, prices, dietary tags (GF, Vegan, etc.) — synced from Kasse menu

Reservations: Embedded reservation system (inline widget)

Order Online: Embedded online ordering (inline widget)

About: Story, team, kitchen philosophy

Events: Private dining, special events, recurring specials

**Gym template pages:**

Home: Transformation story, membership CTA, "Try Free Class" CTA

Classes: Full schedule synced from Kasse with "Book" button per class

Membership: Pricing comparison table, "Join Now" CTA, member testimonials

Trainers: Staff cards with certifications, specialties, booking link

Transformation: Before/after gallery (member consent required)

Blog: Training tips, nutrition advice — manually written or AI-assisted

**Site content AI assist:**

For each section, merchant can:
- Type a few keywords ("luxury, modern, expert colorists")
- AI generates polished marketing copy
- Merchant edits or accepts

For "About" section:
```
Tell us about your business (a few sentences or keywords):

[Luxury salon in Corpus Christi, 10 years in business, specialize in 
balayage and color corrections, team of 8 licensed stylists, 
known for attention to detail and relaxing atmosphere]

[Generate Professional About Section →]
```

Output:
```
Nestled in the heart of Corpus Christi, [Business Name] has been 
transforming the way clients experience beauty for over a decade. 
Our team of eight licensed stylists brings exceptional expertise 
to every appointment — whether you're seeking a subtle balayage 
that catches the light just right, or a bold color correction that 
finally gives you the hair you've always envisioned.

We believe your time in our chair should be as rejuvenating as the 
result. From the moment you walk in, our attention to detail and 
commitment to craft create an experience that goes far beyond a 
simple appointment.

[Edit] [Regenerate] [Use This Copy]
```

**Kasse Sites pricing:** $29/month addon (custom domain) or $19/month (kasseapp.com subdomain)
**Build Phase:** Phase 8

### 2.3 — QR Code Generator

Every Kasse merchant gets an auto-generated QR code for their booking/ordering/joining page.

Uses:
- Print on business cards, receipts, flyers
- Display at front desk or tables
- Add to packaging
- Include in email signatures

QR codes generated for:
- Main booking page
- Specific service booking
- Specific staff booking
- Online ordering
- Membership signup
- Review request
- Gift card purchase

Configuration:
```
QR CODE GENERATOR

Generate a QR code for any Kasse link:

○ Main booking page
○ Specific service: [Select service ▾]
○ Specific staff: [Select staff ▾]
○ Online ordering
○ Membership signup
○ Leave a review (Google)
○ Custom URL: [__________________]

Style:  ○ Standard black  ○ With logo  ○ Custom color

[Generate QR Code]  [Download PNG]  [Download SVG]
```

---

## SECTION 3 — PAYMENTS & FINANCE INTEGRATIONS

### 3.1 — QuickBooks Online

**Two-way sync:**

Kasse → QuickBooks:
- Every transaction exports as a QuickBooks Sales Receipt or Invoice
- Refunds export as Credit Memos
- Tips export separately (important for payroll tax purposes)
- Commission accruals export as Payroll Liabilities (if not using SalonBacked)
- Inventory purchases (when integrated with inventory module) export as Expenses
- Gift card sales export as Deferred Revenue

QuickBooks → Kasse:
- Chart of accounts (so Kasse can tag transactions to correct QB accounts)
- Vendor list (for inventory ordering)
- Customer list (optional sync — QB customer = Kasse client)

**Sync frequency:** Real-time for transactions; nightly batch for reports

**Category mapping:**

```
QUICKBOOKS ACCOUNT MAPPING

Tell us which QuickBooks accounts your Kasse transactions should post to:

Service revenue:      [Income > Service Revenue ▾]
Product/retail sales: [Income > Retail Sales ▾]
Tips collected:       [Income > Tips Income ▾]
Refunds:              [Expense > Refunds & Returns ▾]
Processing fees:      [Expense > Merchant Fees ▾]
Gift cards sold:      [Liability > Gift Cards Outstanding ▾]
Gift cards redeemed:  [Income > Gift Card Revenue ▾]

[Save Mapping]
```

**QuickBooks Self-Employed:** Lighter integration for sole proprietors — exports transactions as CSV formatted for QBSE import.

### 3.2 — Xero

Same capabilities as QuickBooks Online. Xero is more popular internationally and with certain accountant networks. Same sync scope, same account mapping workflow.

### 3.3 — Wave (Free Accounting)

For micro-businesses ($0 accounting software). Wave integration:
- Export transactions as CSV in Wave's import format
- Monthly export available (Wave doesn't have a public API for real-time sync)
- Instructions for manual import in Wave

### 3.4 — FreshBooks

Invoice-focused. Integration:
- Create FreshBooks invoice from Kasse transaction
- Track invoice payment status in Kasse
- Useful for B2B services (mobile stylists billing event clients, photographers)

---

## SECTION 4 — MARKETING & COMMUNICATION

### 4.1 — Mailchimp

**One-way sync (Kasse → Mailchimp):**
- Client list synced to Mailchimp audience
- Tags from Kasse (VIP, Lapsed, New Client) applied as Mailchimp tags
- Opt-out status synced (if client unsubscribes in Mailchimp, marked opted-out in Kasse)
- New clients added to Mailchimp automatically
- Syncs hourly (near-real-time)

**Segmented sync:**
- "Send to Mailchimp: only clients who haven't visited in 60+ days"
- "Send to Mailchimp: only VIP clients"
- "Send to Mailchimp: only clients with birthday this month"

**Why one-way:** Mailchimp doesn't store service history, so there's no meaningful data to pull back. The value is getting Kasse's rich client data into Mailchimp for email campaigns.

### 4.2 — Klaviyo

For retail-heavy businesses. Klaviyo is the gold standard for e-commerce email marketing.

Sync:
- All Kasse client data → Klaviyo profiles
- Purchase events → Klaviyo events (triggers flows)
- Revenue events → Klaviyo revenue attribution

Events sent to Klaviyo:
- `booking.completed` — client completed an appointment
- `transaction.completed` — client purchased products
- `gift_card.purchased` — client bought a gift card
- `membership.started` — client started a membership
- `client.lapsed` — client hasn't visited in X days

These events trigger Klaviyo automated flows:
- Post-visit thank you (after `booking.completed`)
- Win-back (after `client.lapsed`)
- Membership renewal (before membership expires)
- Birthday campaign (Kasse sends birthday, Klaviyo sends offer)

### 4.3 — Zapier

The integration backbone for everything else. One Kasse Zapier app connects to 5,000+ other services.

**Kasse Triggers available in Zapier:**
- New booking created
- Booking cancelled
- Booking completed
- New client added
- Client lapsed (configurable threshold)
- Transaction completed
- Payment failed
- New review received
- Staff clocked in/out
- Low inventory alert
- New franchisee application submitted

**Kasse Actions available in Zapier:**
- Create client
- Create booking
- Add client note
- Send client message (SMS/email)
- Update client tags

**Example Zapier use cases:**
- New Kasse booking → Create Google Calendar event for owner's personal calendar
- Kasse booking completed → Add row to Google Sheets (for owner who loves spreadsheets)
- New Kasse client → Add to Salesforce (for corporate account management)
- Low inventory alert → Send Slack message to manager
- New franchise application → Create Asana task for review

---

## SECTION 5 — DELIVERY & ORDERING (RESTAURANT / BAR / FOOD)

### 5.1 — DoorDash

**What it does:**
- Orders from DoorDash appear in Kasse POS (Kasse is the order management system for DoorDash orders)
- Kitchen Display System shows DoorDash orders alongside in-house orders
- Menu sync: Kasse menu → DoorDash menu (prices, descriptions, photos, availability)
- Inventory deduction when DoorDash order is fulfilled
- Revenue from DoorDash orders recorded in Kasse reports

**Setup:**

```
CONNECT DOORDASH

Step 1: Enter your DoorDash store ID: _____________
        (Find this in your DoorDash Merchant Portal)

Step 2: Connect your DoorDash account
        [Connect with DoorDash →]

Step 3: Sync your menu
        We'll export your current Kasse menu to DoorDash.
        Review and confirm before publishing.

Step 4: Configure order routing
        Where should DoorDash orders appear?
        ○ Same queue as in-house orders (recommended)
        ○ Separate DoorDash order queue
        
Step 5: Set DoorDash pricing
        ○ Same as in-house pricing
        ○ Add surcharge: +___% (to offset DoorDash commission)

[Connect DoorDash]
```

**Order management in Kasse:**

DoorDash orders appear in the Order Queue with a DoorDash badge:
```
ORDER QUEUE

#1023  TABLE 4 — Dine-In          [In Progress]
#1024  [DD] DOORDASH               [Ready for Pickup]
#1025  TABLE 2 — Dine-In          [New]
#1026  [UE] UBER EATS             [New]
```

Staff acknowledge and manage DoorDash orders the same as in-house. All in one screen.

### 5.2 — Uber Eats

Same integration scope as DoorDash. Orders appear in Kasse with [UE] badge.

Menu sync: Uber Eats has specific photo requirements — Kasse provides photo size guides and auto-crops to Uber Eats specs.

### 5.3 — GrubHub

Same integration scope. [GH] badge in order queue.

**Multi-platform order management:**
The killer value is having DoorDash + Uber Eats + GrubHub + In-House + Online Ordering all in ONE Kasse screen. No more three tablets on the counter. One screen, all orders.

---

## SECTION 6 — E-COMMERCE INTEGRATIONS

### 6.1 — Shopify

**For retail-heavy businesses (boutiques, product-forward salons, gyms selling supplements):**

Sync options:

**Option A: Kasse is source of truth for inventory (most common)**
- Kasse inventory → Shopify product catalog
- Online Shopify sale → deducts from Kasse inventory
- Kasse inventory alert when Shopify is causing stock to drop

**Option B: Shopify is source of truth for products**
- Shopify catalog → Kasse POS product list
- In-store Kasse sale → deducts from Shopify inventory
- Product updates in Shopify propagate to Kasse

**Sync scope:**
- Products (name, description, price, SKU, photos)
- Inventory quantities (bi-directional)
- Orders (Shopify online orders appear in Kasse fulfillment queue)
- Customer records (Shopify customer = Kasse client — unified profile)

### 6.2 — WooCommerce

Same scope as Shopify. WordPress-based, more common among smaller businesses.

---

## SECTION 7 — REVIEW PLATFORM INTEGRATIONS

### 7.1 — The Reputation Dashboard

All review platforms feed into a single Kasse Reputation Dashboard:

```
REPUTATION DASHBOARD

OVERALL RATING: ⭐ 4.8 / 5.0
Based on 412 reviews across all platforms

BY PLATFORM:
  Google:   ⭐ 4.9  (312 reviews)  [Most recent: 2 hours ago]
  Yelp:     ⭐ 4.7  (87 reviews)   [Most recent: 3 days ago]
  Facebook: ⭐ 4.8  (13 reviews)   [Most recent: 1 week ago]

RECENT REVIEWS (ALL PLATFORMS):
  ──────────────────────────────────────────────
  ⭐⭐⭐⭐⭐ "Jennifer is incredible! Best balayage I've ever had."
  Google · 2 hours ago · Sarah M.
  [Reply on Google]

  ⭐⭐⭐⭐  "Great salon but wait time was long."
  Yelp · 3 days ago · Michael K.
  [Reply on Yelp] [Note: Follow up on wait time internally]
  ──────────────────────────────────────────────

REVIEWS NEEDING RESPONSE: 3 (recommended to respond within 48 hours)

REVIEW REQUEST AUTOMATION:
  Total review requests sent (30d): 312
  Clicks: 89 (28.5% CTR)
  Reviews received: 23 (25.8% conversion)

SENTIMENT ANALYSIS (last 90 days):
  Positive themes: "Jennifer", "color", "atmosphere", "friendly staff"
  Negative themes: "wait time", "parking" (mentioned 4x)
  Trending: "Jennifer" mentioned positively in 67 of last 100 reviews
             → Jennifer is a competitive retention risk. Consider recognition.
```

**Review request automation:**

2 hours after appointment completion, Kasse sends:

SMS: "Thanks for visiting [Salon Name]! We'd love your feedback — it takes 30 seconds: [link]"

The link goes to a Kasse landing page:
```
How was your experience at [Salon Name]?

⭐ ⭐ ⭐ ⭐ ⭐

[If 4-5 stars: "Glad you loved it! Leave a quick Google review?"]
  → Direct link to Google review page

[If 1-3 stars: "We're sorry to hear that. Tell us what happened."]
  → Internal feedback form (NOT sent to Google)
  → Owner notified immediately with client name + feedback
```

This is the standard "review gating" approach — positive experiences are directed to public review platforms, negative experiences are captured internally for resolution.

---

## SECTION 8 — DEVELOPER INTEGRATIONS

### 8.1 — The Kasse API (Public)

Full REST API for businesses with development resources or developers building on top of Kasse.

Available on Pro plan and above.

**API Capabilities:**

Bookings:
```
GET    /v1/bookings                  List bookings (with filters)
POST   /v1/bookings                  Create booking
GET    /v1/bookings/{id}             Get booking detail
PATCH  /v1/bookings/{id}             Update booking
DELETE /v1/bookings/{id}             Cancel booking
GET    /v1/bookings/availability     Get availability slots
```

Clients:
```
GET    /v1/clients                   List clients
POST   /v1/clients                   Create client
GET    /v1/clients/{id}              Get client
PATCH  /v1/clients/{id}              Update client
GET    /v1/clients/{id}/bookings     Client's booking history
GET    /v1/clients/{id}/transactions Client's transaction history
```

Services:
```
GET    /v1/services                  List services
POST   /v1/services                  Create service
GET    /v1/services/{id}             Get service
PATCH  /v1/services/{id}             Update service
```

Transactions:
```
GET    /v1/transactions              List transactions
GET    /v1/transactions/{id}         Get transaction
POST   /v1/transactions/checkout     Process payment (via Reyna Pay)
POST   /v1/transactions/{id}/refund  Issue refund
```

Staff:
```
GET    /v1/staff                     List staff
POST   /v1/staff                     Create staff member
GET    /v1/staff/{id}                Get staff member
GET    /v1/staff/{id}/schedule       Staff availability
```

Reports:
```
GET    /v1/reports/revenue           Revenue summary (period-based)
GET    /v1/reports/clients           Client analytics
GET    /v1/reports/staff             Staff performance
GET    /v1/reports/services          Service popularity
```

**Authentication:**
- API key authentication (Bearer token)
- OAuth 2.0 for third-party apps
- Scoped permissions (read:clients, write:bookings, etc.)
- Rate limiting: 1,000 requests/hour (Standard), 10,000/hour (Enterprise)

**Webhooks:**

```
WEBHOOK EVENTS

Subscribe to real-time events:

  booking.created            New booking made
  booking.cancelled          Booking cancelled
  booking.completed          Service completed
  booking.no_show            Client marked no-show
  client.created             New client added
  transaction.completed      Payment processed
  transaction.refunded       Refund issued
  payment.failed             Payment failure
  staff.clocked_in           Staff clock-in
  review.received            New review
  inventory.low              Low stock alert
  membership.expired         Membership expired
  membership.renewed         Membership auto-renewed

Webhook URL:      [https://___________________________]
Secret key:       [auto-generated — used to verify signature]
[Add Webhook] [Test Webhook]
```

**Sandbox environment:**

```
SANDBOX ENVIRONMENT

Test your integration without affecting real data.

Sandbox base URL: https://sandbox.kasseapp.com/api/v1
Sandbox API key: sk_test_xxxxxxxxxxxxxxxxxxxx

Sandbox includes:
  ✓ Pre-populated test data (clients, services, staff)
  ✓ Test payment processing (Reyna Pay test mode)
  ✓ All webhook events triggerable
  ✓ No charges, no real emails sent
  ✓ Reset to clean state at any time

[Go to Sandbox] [Reset Sandbox Data]
```

**OpenAPI / Swagger documentation:**

Interactive API docs at docs.kasseapp.com/api:
- Try any endpoint directly from the docs
- Request/response examples for every endpoint
- Code samples in: JavaScript, Python, Ruby, PHP, cURL
- Changelog for API version history

### 8.2 — The Kasse Developer Program (Phase 10+)

**What it is:** Third-party developers can build apps that enhance Kasse and sell them in the Kasse App Marketplace.

**Developer tiers:**
- Individual developer: free to build, 70% revenue share on paid apps
- Agency: $99/month, builds for multiple clients, access to all merchant accounts with consent
- Partner: $299/month, featured in marketplace, dedicated API support

**App types:**
- Integrations (connect Kasse to external services)
- Vertical add-ons (specific functionality for a niche)
- Automations (complex multi-step workflows)
- Analytics (custom reporting on Kasse data)
- Content (marketing templates, formula libraries)

**App Marketplace:**

Apps listed in Settings → Integrations → App Marketplace

Approved, curated apps. Every app reviewed by Kasse before listing. Apps can be free, freemium, or paid (subscription or one-time).

Examples:
- "WeddingPro" — bridal party booking management for salons
- "PetGroomingCalc" — breed-specific grooming time calculator
- "GymNutrition" — meal plan builder connected to Kasse client profiles
- "EventStaff" — manage event staffing through Kasse (mobile stylists, photographers)

---

## INTEGRATION ARCHITECTURE (TECHNICAL)

### Integration Engine Design

All integrations run through a unified Integration Engine:

```
┌──────────────────────────────────────────────────────┐
│                  KASSE INTEGRATION ENGINE             │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ OAuth    │  │ Webhook  │  │  Data Transform  │   │
│  │ Manager  │  │ Router   │  │  Layer           │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              Sync Queue (Bull)               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         Integration Health Monitor           │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**OAuth Manager:** Stores OAuth tokens for all connected platforms, handles refresh, monitors expiry

**Webhook Router:** Receives webhooks from external platforms, validates signatures, routes to appropriate handler

**Data Transform Layer:** Maps external data types to Kasse internal types (platform-agnostic)

**Sync Queue:** All syncs run as background jobs. Rate-limited per platform API constraints. Retry with exponential backoff.

**Integration Health Monitor:** Tracks sync success rate per integration. If sync fails 3 times in a row, merchant notified: "Your Google Business Profile sync has an issue — [reconnect]"

### Integration Status Dashboard (for merchant)

```
INTEGRATION STATUS

Google Business Profile     ✅ Connected · Last sync: 2 hours ago
Instagram                   ✅ Connected · Last sync: 14 minutes ago
QuickBooks Online           ✅ Connected · Last sync: 1 hour ago
Mailchimp                   ⚠️ Error · Re-authentication needed [Fix]
DoorDash                    ✅ Connected · Last sync: 4 minutes ago
Shopify                     ❌ Not connected [Connect]
Zapier                      ✅ Connected · 3 active Zaps
```

---

## BUILD PLAN — INTEGRATIONS HUB

### Phase 4 — Basic Website Widget

**Commit: Widget embed + booking page**
- JavaScript widget (button + overlay booking flow)
- Vertical-specific widget variants (salon, restaurant, gym)
- WordPress plugin (basic)
- Custom domain support for booking page

### Phase 5 — Google + Instagram

**Commit: Google Reserve**
- Google Business Profile API integration
- Google Reserve booking flow
- Hours/info auto-sync

**Commit: Instagram**
- Instagram Business API connection
- "Book Now" button activation
- DM automation (keyword response)
- Kasse Color auto-post feature

### Phase 8 — Full Integration Suite

**Commit 1:** Facebook, TikTok, WhatsApp
**Commit 2:** Kasse Sites (website builder) — template engine, content AI
**Commit 3:** QuickBooks + Xero accounting sync
**Commit 4:** Mailchimp + Klaviyo marketing sync
**Commit 5:** Yelp, review reputation dashboard, review request automation
**Commit 6:** DoorDash + Uber Eats order management integration
**Commit 7:** Shopify / WooCommerce inventory sync
**Commit 8:** Zapier app (triggers + actions)
**Commit 9:** QR code generator
**Commit 10:** Integration health monitor + reconnect flows

### Phase 10 — Developer Platform

**Commit 1:** Public API documentation (docs.kasseapp.com)
**Commit 2:** API key management in portal
**Commit 3:** Webhook configuration UI
**Commit 4:** OAuth for third-party apps
**Commit 5:** Sandbox environment

### Phase 10.5 — App Marketplace

**Commit 1:** Marketplace listing infrastructure
**Commit 2:** Developer program + review workflow
**Commit 3:** App installation + permission model

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 8 kickoff*
