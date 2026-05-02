# KASSE_MIGRATION.md
## The Competitor Migration System — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## STRATEGIC CONTEXT

Migration fear is the #1 reason businesses don't switch software — not price, not missing features. It's the terror of losing 5 years of client history, the idea of rebuilding every service, the risk of losing revenue during a transition. Every competitor counts on this inertia to keep merchants locked.

Kasse breaks this permanently. The Migration Center is not a CSV importer bolted onto the side of the product — it is a first-class, deeply engineered system that makes switching from any competitor feel effortless, automated, and risk-free. We remove every possible friction point, then give merchants tools to run old and new in parallel until they're ready to commit. When a merchant migrates to Kasse, they never go back.

**Build Phase:** Phase 3.5 — after core booking engine (Phase 3) and before vertical config system (Phase 4)
**Effort Estimate:** 8 commits, ~3 weeks for a single developer
**Revenue Impact:** Estimated 40% higher conversion from free trial to paid when migration is available

---

## THE MIGRATION CENTER — ARCHITECTURE

### Entry Points

The Migration Center is accessible from three places:
1. **During onboarding (Step 7):** "Are you switching from another platform?" — shown to every new merchant
2. **Settings → Migration Center:** Available anytime in the live portal for merchants who skipped during onboarding
3. **Freeze/Cancel flow:** "Before you leave — import your existing data from your current platform and see everything in Kasse before deciding"

### Platform Support Matrix

| Platform | Connection Method | Clients | Appointments | Services | Staff | Transactions | Gift Cards | Memberships | Formulas | Inventory |
|----------|-----------------|---------|-------------|---------|-------|-------------|-----------|-------------|---------|-----------|
| Square Appointments | OAuth API | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ✅ Partial |
| Square POS | OAuth API | ✅ Full | N/A | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ✅ Full |
| Vagaro | OAuth API | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ✅ Full | ✅ Full | ✅ Basic | ✅ Partial |
| Mindbody | OAuth API | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ❌ | ✅ Full | ❌ | ❌ |
| GlossGenius | OAuth API | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| Boulevard | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| Booker | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ❌ | ✅ Full | ❌ | ❌ |
| Acuity Scheduling | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| Schedulicity | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fresha | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ❌ | ❌ | ❌ | ❌ |
| Meevo | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ✅ Partial | ❌ | ✅ Basic | ✅ Partial |
| Zenoti | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ❌ | ✅ Full | ❌ | ✅ Partial |
| Salon Iris | CSV Export | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ❌ | ❌ | ✅ Basic | ✅ Partial |
| QuickBooks POS | CSV Export | ✅ Full | N/A | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ✅ Full |
| Toast (restaurant) | OAuth API | ✅ Full | N/A | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | N/A | ✅ Full |
| Lightspeed | OAuth API | ✅ Full | N/A | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | N/A | ✅ Full |
| MindBody (fitness) | OAuth API | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Partial | ❌ | ✅ Full | N/A | ❌ |
| Excel / CSV | Smart CSV | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ✅ Full |
| Paper records | AI Scanner | ✅ Partial | ❌ | ✅ Partial | ✅ Partial | ❌ | ❌ | ❌ | ❌ | ❌ |
| Any other platform | Smart CSV | ✅ Full | ✅ Partial | ✅ Full | ✅ Full | ✅ Partial | ❌ | ❌ | ❌ | ✅ Partial |

---

## STEP-BY-STEP MERCHANT EXPERIENCE

### Step 1 — Source Selection

The merchant arrives at the Migration Center and sees a full-screen platform picker:

```
WHERE ARE YOU COMING FROM?

[Square]        [Vagaro]        [Mindbody]
[GlossGenius]   [Boulevard]     [Booker]
[Acuity]        [Schedulicity]  [Fresha]
[Meevo]         [Zenoti]        [Salon Iris]
[Toast]         [Lightspeed]    [QuickBooks POS]
[Excel / CSV]   [Paper Records] [Something Else]

Can't find yours? → Smart CSV importer handles any format
```

Visual design: Large cards with platform logos. Clean, enterprise-grade UI. No clutter. Estimated time shown below each: "~8 minutes via automatic import" (OAuth) or "~15 minutes with file upload" (CSV).

### Step 2 — Connection Method

#### Category A — OAuth/API (Fully Automated)

For Square, Vagaro, Mindbody, GlossGenius, Toast, Lightspeed:

```
CONNECT YOUR [SQUARE] ACCOUNT

This is fully automatic — no exports, no uploads.
Click below to securely connect your Square account.
Kasse will pull your data directly. This takes 5-10 minutes.

[Connect Square Account →]

🔒 Read-only access. We cannot modify your Square data.
   Your Square account continues working normally.
```

On click → OAuth flow → Square authorization screen → merchant grants read-only permission → redirect back to Kasse → import begins automatically.

#### Category B — Guided Export (CSV/Excel)

For Boulevard, Booker, Acuity, Meevo, Salon Iris, Zenoti:

```
EXPORT YOUR [VAGARO] DATA

Here's exactly how to export from Vagaro:

Step 1:  Log into your Vagaro account
         → Go to Reports → Data Export
         [Screenshot showing exact menu location]

Step 2:  Select "Full Data Export"
         → Check: Clients, Appointments, Services, Staff, Transactions
         [Screenshot showing checkboxes]

Step 3:  Click "Export" — Vagaro will email you a download link
         This usually takes 5-10 minutes

Step 4:  Download the ZIP file and upload it here:
         [Upload Zone — drag and drop or click to browse]

Need help? [Live chat with migration specialist]
```

Platform-specific screenshots are stored as static assets. Every step is photographed for every supported platform. Export instructions are reviewed and updated quarterly.

#### Category C — Smart CSV (AI-Powered Column Mapping)

For any platform or custom spreadsheet:

```
SMART CSV IMPORT

Upload any CSV or Excel file — our AI will map your columns
automatically, regardless of how they're named.

[Upload Zone]

Supported formats: .csv, .xlsx, .xls, .numbers

What we can import from any CSV:
  • Clients (name, email, phone, notes, birthday)
  • Services (name, duration, price)
  • Staff (name, email, commission rate)
  • Appointments (date, client, service, staff, notes)
  • Transactions (date, amount, payment method)
  • Inventory (name, SKU, quantity, price)

You can upload multiple files — one for each data type.
```

AI mapping engine:
- Detects column names in any language, any casing, any format
- Maps "Customer Name", "client_name", "Full Name", "NAME" → all to `client.full_name`
- Handles date formats: MM/DD/YYYY, DD-MM-YYYY, ISO 8601, Unix timestamp
- Handles phone formats: +1 (xxx) xxx-xxxx, xxx-xxx-xxxx, xxxxxxxxxx
- Handles price formats: $XX.XX, XX.XX, XX
- Confidence score per column mapping (0-100%)
- Low-confidence mappings flagged for human review

Merchant reviews the AI mapping before import:

```
COLUMN MAPPING — CLIENTS FILE (clients_export.csv)

Your Column         →   Kasse Field          Confidence
─────────────────────────────────────────────────────────
"Full Name"         →   client.full_name      99%
"Email Address"     →   client.email          99%
"Phone"             →   client.phone          97%
"Date of Birth"     →   client.birthday       94%
"Notes"             →   client.internal_note  91%
"Member Since"      →   client.created_at     88%
"Allergies"         →   client.allergy_alert  85%
"Referral Source"   →   client.referred_by    72% ⚠
"VIP Status"        →   ??? (unmapped)        —   [Map manually ▾]

[Edit Any Mapping]  [Import with These Mappings]
```

Unmapped columns: merchant chooses whether to import as a custom field or discard.

#### Category D — AI Document Scanner (Paper Records)

For businesses converting from paper appointment books and client cards:

```
PAPER RECORDS SCANNER

Take photos of your paper records and our AI will extract
the data and import it into Kasse.

Works best for:
  • Client index cards (name, phone, service notes)
  • Appointment books (daily/weekly schedules)
  • Service price lists
  • Staff rosters

[Open Camera / Upload Photos]

Tips for best results:
  • Good lighting, flat surface
  • Entire card visible in frame
  • One card or page per photo
```

AI extraction pipeline:
1. Vision model reads handwritten or printed text
2. Extracts structured fields (name, phone, service, notes, date)
3. Creates draft records in Kasse
4. Merchant reviews and confirms each record
5. Accepts in bulk or reviews individually

Confidence levels:
- Printed text (typed): 95%+ accuracy
- Clear handwriting: 80-90%
- Difficult handwriting: 60-75% (flagged for manual review)
- Faded or damaged: flagged for manual entry

### Step 3 — Import Preview

Before any data moves, merchant sees a full summary of what will be imported:

```
READY TO IMPORT — Square Appointments

DATA FOUND IN YOUR SQUARE ACCOUNT:

  ✅ Clients            847    (including 23 from last 90 days)
  ✅ Appointment Records 3,204  (last 3 years)
  ✅ Staff              12     (8 active, 4 former)
  ✅ Services           34     (with pricing)
  ✅ Transactions       1,203  (last 12 months)
  ✅ Gift Card Balances  89    ($4,230 total outstanding)

ITEMS NEEDING ATTENTION:

  ⚠  23 clients have no email address
     → They'll import without email (you can add later)
  ⚠  4 services have $0 price
     → Review and update pricing after import
  ⚠  156 transactions are refunds
     → Will import as refund records
  ✗  Formula cards — Square doesn't store these
     → You'll add these manually in Kasse Color

YOUR CURRENT KASSE DATA:

  0 clients, 0 services, 0 staff
  → No merge conflicts. Clean import.

[Preview Sample Data]  [Edit Import Settings]  [Start Import →]
```

If merchant already has data in Kasse (imported previously or added manually):

```
MERGE SETTINGS

You already have 12 clients in Kasse.
How should we handle potential duplicates?

○ Smart merge — match by email + phone, combine records
○ Keep both — import all, flag duplicates for review
○ Skip duplicates — only import clients not already in Kasse

[Continue]
```

Duplicate detection algorithm:
- Exact email match → definite duplicate
- Exact phone match → probable duplicate
- Name + city match → possible duplicate
- All three methods run, confidence score calculated
- Merchant sees duplicate candidates before merge

### Step 4 — Import Execution

Full-screen progress view:

```
IMPORTING YOUR DATA FROM SQUARE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  67%

✅ Staff              12/12   — Complete
✅ Services           34/34   — Complete
✅ Clients           847/847  — Complete
⟳ Appointments    2,147/3,204 — In progress
○ Transactions            —   — Pending
○ Gift Cards              —   — Pending

Estimated time remaining: 4 minutes

You can leave this page — we'll email you when it's done.
Import ID: #KM-2024-00847

[Continue Setting Up Your Portal →]
```

Technical implementation:
- Import runs as background job (Bull queue on Redis)
- Chunked in batches of 100 records
- Rate-limited to respect source platform API limits
- Retry logic: 3 attempts per failed record
- Transaction wrapped per chunk (atomic — either all records in chunk import or none)
- Progress updates via Server-Sent Events (SSE) to UI
- Completion email with detailed report

### Step 5 — Post-Import Verification

After import completes, merchant gets a verification dashboard:

```
IMPORT COMPLETE — Review Your Data

Square → Kasse Import
Completed: October 14, 2024 at 9:47 AM
Import ID: #KM-2024-00847

RESULTS:
  ✅ 847/847 clients imported
  ✅ 3,198/3,204 appointments imported
  ✅ 34/34 services imported
  ✅ 12/12 staff imported
  ✅ 1,203/1,203 transactions imported
  ✅ 89/89 gift cards imported
  ⚠  6 appointments skipped (see details)

ITEMS NEEDING YOUR ATTENTION:

  1. Potential duplicate clients (14)
     Sarah Johnson appears twice — different phone numbers
     [Review Duplicates]

  2. Services with $0 pricing (4)
     "Consultation", "Touch-Up", "Bang Trim", "Gloss"
     [Update Pricing]

  3. Staff without login accounts (4)
     Former staff imported as inactive — no login needed
     [Review Staff]

  4. Appointments with unknown clients (6)
     6 appointments reference deleted Square customers
     [Review or Delete]

WHAT'S NEXT:
  → Review your services and confirm pricing
  → Send staff invitation emails
  → Test your booking link
  → Import color formulas manually (Square doesn't store these)

[Go to My Portal →]
```

Verification tools:
- Side-by-side comparison: "Square said X, Kasse imported Y" for any record
- Raw import log downloadable as CSV
- Rollback option available for 48 hours (nuclear option — deletes all imported data and returns to blank slate)

---

## THE PARALLEL RUNNING SYSTEM

### What It Is

For merchants who aren't ready to commit — they can run Kasse in parallel with their old platform for up to 90 days. Kasse stays in sync with the source platform automatically.

### How It Works

After migration completes:

```
PARALLEL RUNNING — OPTIONAL

Not ready to switch full-time? Run Kasse alongside Square
for up to 90 days while you get comfortable.

When parallel running is active:
  • Kasse syncs new Square data every night at 2 AM
  • New clients, appointments, transactions appear in both
  • Your team can explore Kasse without commitment
  • Switch fully to Kasse whenever you're ready

After 90 days, parallel running automatically ends.

[Enable Parallel Running]  [No thanks, I'm ready to switch]
```

Sync mechanism:
- Nightly pull from source platform API (for OAuth-connected platforms)
- Detects new records created after initial import date
- Imports net-new records only (doesn't re-import existing)
- Conflict resolution: Kasse source of truth for anything modified in Kasse; source platform truth for new records
- Sync log available in Migration Center

Dashboard indicator when parallel running is active:

```
[🔄 PARALLEL MODE — Square sync active · Last sync: 3 hours ago · Switch fully to Kasse →]
```

### Cutover

When merchant is ready to commit:

```
READY TO SWITCH FULLY?

You've been running Kasse for 23 days alongside Square.

Since your initial import, we've synced:
  • 67 new appointments from Square
  • 14 new clients from Square
  • 238 transactions from Square

When you switch fully:
  • Square sync stops
  • Kasse becomes your primary system
  • Your team stops using Square
  • Your booking link updates to Kasse

Best time to switch:
  → We recommend switching on a slow morning (Monday 7-9am)
  → Avoid switching right before a busy weekend
  → Your current schedule is light on [Next Tuesday] — good option

[Schedule Cutover] [Switch Now]
```

---

## THE GHOST MIGRATION (ENTERPRISE FEATURE)

### What It Is

Ghost migration runs completely silently in the background while the merchant continues using their old platform normally. The merchant never touches an export file. They don't know anything is happening. Then one day they get an invitation: "Your Kasse portal is ready — everything is already in it. Want to take a look?"

This is designed for large salons (50+ staff, 10,000+ clients), franchises migrating multiple locations, and any merchant who has been scared off by the complexity of migration.

### How It Activates

Available as an upgrade option during Migration Center:

```
NOT READY TO DO THIS NOW?

We can do this for you silently.

Ghost Migration — available on Pro and Enterprise plans:
  • We connect to your Square account (read-only)
  • We migrate everything in the background
  • You keep using Square normally — nothing changes
  • In 7 days, you'll get an email: "Your Kasse portal is ready"
  • Preview your fully-populated portal before deciding anything

[Enable Ghost Migration — Free with Pro/Enterprise]
```

Also available: when a merchant is on Square/Vagaro and our sales system or a partner identifies them as a target, Ghost Migration can be pre-configured before initial contact. When the sales conversation happens, the demo is their own actual data.

### Ghost Migration Timeline

- Day 0: OAuth connection granted (or Kasse sales team uses pre-granted access)
- Day 0-1: Full initial data pull (background job, no UI)
- Day 2-7: Validation, de-duplication, normalization, formula enrichment
- Day 7: Email sent: "Your Kasse portal is ready — take a look"
- Day 7-30: Merchant previews portal (read-only — they can't break anything)
- Any day: Merchant says "I'm ready" — Kasse activates their account, data goes live, they pay first invoice
- Day 30: If no response, gentle follow-up: "Your data will be deleted in 7 days unless you activate"

---

## PLATFORM-SPECIFIC MIGRATION GUIDES

### Square Migration — Full Detail

**OAuth scopes requested:**
- `CUSTOMERS_READ` — full client records
- `APPOINTMENTS_READ` — appointment history
- `CATALOG_READ` — services, products
- `TEAM_READ` — staff records
- `PAYMENTS_READ` — transaction history
- `GIFT_CARDS_READ` — gift card balances
- `INVENTORY_READ` — inventory counts

**Data transformation rules:**
- Square `CUSTOMER` → Kasse `Client`
- Square `TEAM_MEMBER` → Kasse `Staff`
- Square `CATALOG_ITEM` (type: SERVICE) → Kasse `Service`
- Square `CATALOG_ITEM` (type: ITEM) → Kasse `InventoryProduct`
- Square `APPOINTMENT` → Kasse `Booking`
- Square `PAYMENT` → Kasse `Transaction`
- Square `GIFT_CARD` → Kasse `GiftCard` (balance preserved exactly)

**Known Square limitations:**
- No formula/color notes stored in Square
- No referral source tracking (client.referral_source set to "Square Import")
- No allergy/health alert fields
- Appointment notes truncated at 1,000 chars in Square API
- Staff commission rates not stored in Square — imported as 0%, merchant must update

**Gift card handling:**
- Square gift card balances imported as `Kasse Gift Cards` with exact balance
- Physical Square gift cards still scannable at old terminal only
- Kasse issues new gift card numbers for existing balances
- Merchant must update any physical cards — we provide a redemption process:
  Client presents old Square gift card → staff looks up by old card number → Kasse shows balance → processes as Kasse gift card
- Old Square gift card list exported and importable as reference

### Vagaro Migration — Full Detail

**OAuth scopes requested:**
- Full read access to business data

**Data available in Vagaro not available in Square:**
- Basic formula notes (text only, no photos)
- Membership plans and active memberships
- Client intake forms responses
- Product purchase history
- Referral sources

**Formula card import from Vagaro:**
- Vagaro stores basic formula notes as text in service notes
- Pattern matching extracts: developer volume, color brand, color codes
- Creates basic Kasse Color formula cards from extracted data
- Photos not available (Vagaro stores client photos separately, not exportable via API)
- Merchant prompted to add photos after import

**Membership migration:**
- Vagaro memberships imported with: name, price, billing cycle, included services
- Active member billing does NOT transfer — must be re-authorized in Reyna Pay
- Kasse sends re-authorization email to all active members
- Email: "Your [Salon Name] membership is moving to a new system — click here to re-authorize your card (takes 30 seconds)"
- Merchant sees re-authorization status dashboard: "45/89 members have re-authorized their cards"

### Mindbody Migration — Full Detail

**Connection method:** OAuth 2.0 with Mindbody developer credentials

**Data particularly strong in Mindbody:**
- Class schedules and class bookings
- Membership and package history
- Retail purchase history
- Staff certification records
- Client liability waivers signed

**Class/gym-specific transformation:**
- Mindbody `Class` → Kasse `ClassTemplate`
- Mindbody `ClassSchedule` → Kasse recurring `ClassInstance` generation
- Mindbody `Contract` (membership) → Kasse `MembershipPlan`
- Mindbody `ActiveContracts` → Kasse `ActiveMembership`
- Mindbody `Sale` → Kasse `Transaction`
- Mindbody `Service` (package) → Kasse `ServicePackage`

**Client waiver migration:**
- Historical waivers noted in client profile: "Liability waiver signed [date] in Mindbody"
- Kasse re-sends new waivers to all clients on first booking
- Compliance maintained throughout transition

---

## DATA NORMALIZATION ENGINE

### Phone Number Normalization

```
Input examples → Normalized output
"(361) 555-1234"        → "+13615551234"
"361.555.1234"          → "+13615551234"
"3615551234"            → "+13615551234"
"1-361-555-1234"        → "+13615551234"
"+1 (361) 555-1234"     → "+13615551234"
"361-555-1234 ext 42"   → "+13615551234" (ext stored separately)
"555-1234" (no area)    → flagged: "Area code missing — please verify"
```

Validation: E.164 format, US/CA numbers validated against number plan, international numbers preserved as-is.

### Email Normalization

```
"SARAH@EXAMPLE.COM"     → "sarah@example.com" (lowercased)
"sarah @example.com"    → flagged: invalid (space in email)
"sarah@"                → flagged: invalid (no domain)
"sarah@example"         → flagged: suspicious (no TLD)
```

### Name Normalization

```
"SARAH JOHNSON"         → "Sarah Johnson" (title case)
"sarah johnson"         → "Sarah Johnson"
"sarah  johnson"        → "Sarah Johnson" (double space removed)
"Johnson, Sarah"        → "Sarah Johnson" (last-first inverted)
"sarah (vip)"           → "Sarah" (parenthetical notes extracted to client.internal_note)
```

### Date Normalization

All dates normalized to ISO 8601 (UTC). Source timezone inferred from business address or explicitly set during migration config.

### Price Normalization

```
"$65.00"    → 6500 (stored as cents)
"65"        → 6500
"65.00"     → 6500
"$65"       → 6500
"65.5"      → 6550
```

Zero-price services: flagged for review but imported (some services are legitimately free).

---

## MIGRATION AS RETENTION WEAPON

When a merchant is considering leaving Kasse for a competitor, the Migration Center becomes a retention tool.

### The "What You Can't Take With You" Report

When a merchant initiates a cancellation, before showing the cancel form, show them a personalized report:

```
WHAT LEAVES WITH YOU VS. WHAT YOU'D LOSE

DATA YOU CAN EXPORT FROM KASSE:
  ✅ Client list (CSV)
  ✅ Appointment history (CSV)
  ✅ Transaction history (CSV)
  ✅ Service menu (CSV)

DATA THAT ONLY EXISTS IN KASSE:
  ✗  234 color formula cards
     → Vagaro and Square have no formula card feature
     → These would be lost forever

  ✗  Your AI receptionist training data
     → 847 calls processed, preferences learned
     → Starting over with a new provider = months of retraining

  ✗  Client relationship scores
     → 3 years of visit patterns, LTV calculations
     → Rebuild takes 12-18 months of data

  ✗  Kasse Marketplace ranking
     → You're rated 4.8/5 with 127 reviews
     → Cannot transfer reviews to any competitor

  ✗  Your demand forecast model
     → Trained on 3 years of your specific booking patterns
     → New platform starts blind

  ✗  Kasse Business Exchange listing
     → If you sell your business, buyer loses Kasse history
     → Lower valuation without verified revenue history

Still want to leave? [Yes, proceed to cancel]  [No, I'll stay]
```

### Competitor Migration Lock Analysis

When a merchant says "I'm switching to [Vagaro]," Kasse pulls their migration complexity score:

```
SWITCHING TO VAGARO FROM KASSE?

Here's what the migration would look like:

FROM KASSE TO VAGARO:
  ✅ Clients — Vagaro can import your client list
  ✅ Services — manual re-entry (2-3 hours estimated)
  ✅ Staff — manual re-entry
  ⚠  Appointments — Vagaro has no import tool for this
     → 3,204 appointments would be lost
  ✗  Color formulas — Vagaro's formula system is basic text only
     → Your 234 detailed formula cards would not transfer
  ✗  AI receptionist — not available in Vagaro
  ✗  Business valuation history — not available in Vagaro

Estimated migration effort to Vagaro: 15-20 hours of manual work

ALTERNATIVELY: We'll match Vagaro's pricing for 6 months.
Your current plan: $179/month
Vagaro comparable plan: $139/month
Our offer: $139/month for 6 months, then back to $179/month

[Accept Price Match]  [Still want to switch — help me export]
```

This is not a dark pattern — the information is accurate. We help them export if they still want to leave. But most won't after seeing this.

---

## BUILD PLAN — MIGRATION CENTER

### Phase 3.5 — Migration Center (8 commits)

**Commit 1: Migration Center UI Shell**
- Settings → Migration Center page
- Platform picker grid component
- Migration history list
- Status display (no-import state, in-progress, completed)

**Commit 2: OAuth Connection Framework**
- Generic OAuth handler for external platforms
- OAuth state management
- Token storage (encrypted in DB)
- Connection health monitoring

**Commit 3: Square Integration**
- Square OAuth implementation
- Data pull for all 7 scopes
- Transform layer (Square types → Kasse types)
- Preview generation

**Commit 4: Vagaro + Mindbody Integration**
- Vagaro OAuth + transform
- Mindbody OAuth + transform
- Shared transform utilities extracted

**Commit 5: Smart CSV Importer**
- CSV/Excel upload handler
- AI column mapping (Claude API or regex + fuzzy matching)
- Column mapping review UI
- Multi-file upload support

**Commit 6: Import Execution Engine**
- Background job queue (Bull)
- Chunked import with retry logic
- Progress SSE stream
- Completion email (Resend)

**Commit 7: Verification Dashboard + Conflict Resolution**
- Post-import verification UI
- Duplicate detection and merge UI
- Manual review queue for flagged records
- Rollback mechanism

**Commit 8: Parallel Running + Cutover**
- Nightly sync job
- Parallel mode dashboard banner
- Cutover scheduling UI
- Sync log display

**Ghost Migration:** Phase 7 (Enterprise feature, requires account activation flow)

---

## COMPLIANCE AND LEGAL

### Data Handling

- All migrated data treated as PII under Kasse's privacy policy
- Data from source platform is never stored raw — immediately normalized and deleted after transform
- OAuth tokens stored encrypted at rest (AES-256)
- Tokens revocable by merchant at any time from Integration Settings
- GDPR/CCPA: merchant data portability honored (export available for all migrated data)
- Data retention: if merchant cancels, migrated data held 90 days then permanently deleted

### Source Platform Terms of Service

- Square: read-only OAuth usage is permitted under Square's API terms
- Vagaro: API access requires Vagaro partner approval (Kasse registers as a data portability partner)
- Mindbody: API requires approved integration partnership
- All imports are read-only — we never write to source platforms
- We do not access source platform data without explicit merchant OAuth grant

### Gift Card Liability

Migrated gift card balances represent real financial liability. Legal note:
- Kasse assumes gift card liability upon import confirmation by merchant
- Merchant must confirm: "I understand that these gift card balances represent money owed to my clients, and by importing them into Kasse, I take responsibility for honoring them through Kasse."
- Gift cards imported as Kasse gift cards, funded from merchant's Reyna Pay reserve balance
- If merchant cancels: outstanding gift card balances handled under cancellation policy

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Next review: Phase 3.5 kickoff*
