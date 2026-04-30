# KASSE MARKETPLACE
## Stylist Marketplace — Two-Sided Network Effect Engine

**Version:** 1.0 | **Status:** PLANNING (Phase 9)

---

## WHAT THE MARKETPLACE IS

Kasse Marketplace (`kassestylists.com`) is a consumer-facing platform where people find, vet, and book stylists. Only stylists whose salon is on Kasse can list here. This exclusivity is intentional — it creates the flywheel.

**The flywheel:**
```
More salons join Kasse
    → More stylists on marketplace
        → More consumers use marketplace
            → More bookings through Kasse
                → More revenue for stylists
                    → Stylists demand their salon use Kasse
                        → More salons join Kasse
```

Once this spins fast enough, it's self-sustaining. Competitors can't replicate it — they have no stylists to attract consumers and no consumers to attract stylists.

---

## CONSUMER EXPERIENCE

### Discovery
- Search by city, neighborhood, service type, price range, availability
- Filter by: stylist specialty, hair type expertise (natural, color, textured, fine), gender of stylist (some clients prefer specific)
- Sort by: highest rated, most reviewed, price, nearest
- "Trending in [City]" (most booked services/stylists this week)
- Featured stylists (paid placement, clearly marked)

### AI Stylist Matching
The killer feature no competitor has. Instead of scrolling through a directory:

"Tell me what you're looking for" chat interface:
- Client types: "I want balayage, I have medium-length dark brown hair, budget around $150, available Saturday afternoon"
- AI parses: service type (balayage), hair attributes (medium, dark), price constraint ($150), availability (Saturday PM)
- AI queries availability and returns: "I found 3 stylists who specialize in balayage for dark hair, are available Saturday afternoon, and charge $120-$160"
- Shows stylists with portfolio samples matching the description

**Style quiz alternative:**
- "Help me figure out what I need" option
- 5-question quiz: current hair, desired change, lifestyle, budget, how soon
- AI recommendation: specific service type + 3 matching stylists

### Stylist Profile Page
- Profile photo (professional, approved by salon)
- Bio (specialties, experience, education, certifications)
- Service menu with pricing
- Portfolio gallery (before/after photos — high quality)
- 15-second video reels (short videos showing their work, their personality, their salon vibe)
- Verified reviews (from Kasse booking clients only — no fake reviews)
- Rating distribution (% of 5-star, 4-star, etc.)
- Response time badge ("Usually responds within 2 hours")
- Location and hours
- "Book with [Name]" button → directly into Kasse booking flow
- Instagram feed (auto-pulled via Instagram Basic Display API)
- "Trending" badge if in top 10% of bookings in their area this week

### Booking Flow from Marketplace
1. Client clicks "Book with Maria"
2. Service selection (Maria's available services + prices)
3. Date/time picker (real availability from Kasse calendar)
4. Client info (new client creates account, returning client logs in)
5. Card capture (Hosted Fields — saved for future use)
6. Confirmation with add-on suggestion
7. SMS + email confirmation
8. SMS reminder 24 hours before
9. Post-visit review request

---

## STYLIST EXPERIENCE

### Getting on the Marketplace
1. Salon must be on Kasse (active subscription)
2. Stylist opts in to marketplace (Settings → Marketplace → Enable Profile)
3. Complete profile (photo, bio, specialties, services)
4. Upload 5 portfolio photos minimum
5. Profile goes live within 24 hours (Kasse review for quality check)

### Managing the Profile
- Update bio, specialties, photo anytime
- Add new portfolio photos (tagged to client visit with permission)
- Set "featured services" (what to highlight on profile)
- Control availability (sync with Kasse calendar automatically)
- Mark "accepting new clients" or "existing clients only"
- Set a booking message ("I specialize in color corrections — please book a consultation first")

### Marketplace Analytics
- Profile views (how many people visited your page)
- Booking conversion rate (views → bookings)
- Revenue from marketplace-originated bookings
- Review score + review count trending
- Portfolio photo performance (which photos get the most engagement)
- Geographic reach (where are your clients coming from?)
- Search ranking position for key terms

### Featured Placement
- $50/month to appear at top of search results in your city
- Clear "Featured" label (clients see it, but it's still trustworthy)
- Available first-come, first-served per city per specialty
- Cancel anytime

---

## INDEPENDENT STYLIST TIER ($29/MONTH)

For booth renters and independent stylists who aren't part of a salon subscription:

**What they get:**
- Marketplace listing
- Basic booking widget (they can embed on their Instagram link page)
- Kasse payment processing (SalonTransact)
- Client management (basic — contact info, notes, history)
- Tax tracking via SalonBacked (basic tier)
- No team features (no staff management, no multi-stylist calendar)
- No inventory
- No marketing campaigns

**Why this matters:**
- 700,000+ independent stylists in the US
- They currently use Booksy, GlossGenius, or Square individually
- Offering marketplace access as the key differentiator
- Each independent stylist is a lead magnet for Kasse (clients who book through marketplace may later follow stylist to a salon that runs Kasse)

**Upgrade path:**
- Independent stylist gets Kasse → builds clientele → opens their own salon → upgrades to Salon Starter or Growth → hires staff → revenue multiples → franchise?

---

## SALON SUPPLY MARKETPLACE (KASSE CONNECT)

Secondary marketplace for B2B supply ordering.

**What it is:**
Salons can order professional products directly inside Kasse. No more logging into separate distributor websites.

**Partners:**
- Salon Centric (L'Oréal distributors)
- CosmoProf (Regis distributors)
- Beauty Systems Group (BSG)
- Direct brand ordering (Wella, Redken, Matrix, Schwarzkopf)

**How it works:**
1. Salon gets low-stock alert from inventory management
2. One-click reorder from the alert, or browse the supply catalog in Kasse
3. Order placed, charge to business payment method
4. Tracking updates shown in Kasse
5. Received → auto-update inventory

**Revenue model:**
- Kasse takes a referral commission on each order (1-3%)
- Distributors pay for featured placement ($500-2,000/month)
- Product brands pay for "New Product" spotlight ($1,000/launch)

---

## HIRING MARKETPLACE (KASSE JOBS)

Within the Stylist Marketplace, a job board layer:

**Salons post:**
- Open stylist positions
- Booth rental availability
- Front desk openings
- Apprenticeship programs

**Stylists apply:**
- From their marketplace profile (portfolio already there — no resume needed)
- "Apply with Kasse" button — one click, sends profile to salon
- Availability and compensation expectations
- References from Kasse review history (real client reviews = real reference)

**Revenue model:**
- Job posting: $99 per 30-day posting
- "Boosted" posting: $199 for featured placement
- Salon talent pipeline subscription: $49/month (unlimited postings + applicant tracking)

---

## CONSUMER MARKETPLACE GIFT CARDS

`kassegifts.com` — A consumer-facing gift card marketplace.

**How it works:**
1. Consumer visits kassegifts.com (or gets a link from a salon)
2. Search for any Kasse salon by name or city
3. Purchase a digital gift card (any denomination)
4. Gift card delivered via email or SMS to recipient
5. Recipient uses it at any location of that salon brand

**Revenue model:**
- Kasse takes 2.5% of each gift card sold (separate from payment processing)
- Gift cards are funded by salon revenue (when used, funds settle like a normal transaction minus Kasse's fee)
- Unclaimed gift cards (never used after 2 years) — state laws on escheatment apply

**Business impact:**
- New client acquisition (someone gets a gift card → first-time visit → becomes regular)
- Salon brand awareness (kassegifts.com sends traffic to salon pages)
- Cash flow benefit to salon (they collect money now, provide service later)

---

## MARKETPLACE REVENUE MODEL SUMMARY

| Revenue Stream | How | Monthly Estimate (at scale) |
|----------------|-----|------------------------------|
| Featured placement | $50/month per stylist | $500k at 10,000 featured stylists |
| Independent stylist subs | $29/month | $2M at 70,000 independent stylists |
| Marketplace booking fee | 1% on marketplace-originated bookings | Variable |
| Job postings | $99-199 per post | $200k at 2,000 monthly posts |
| Supply marketplace referral | 1-3% of orders | Variable |
| Gift card fee | 2.5% of sold gift cards | Variable |
| Product brand advertising | $500-2,000/month per brand | $50k at 25 brands |
