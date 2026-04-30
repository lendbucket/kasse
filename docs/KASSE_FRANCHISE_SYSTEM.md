# KASSE FRANCHISE SYSTEM
## Franchise Creator, Management, and Operations

**Version:** 1.0 | **Status:** PLANNING (Phase 7)

---

## OVERVIEW

Kasse's franchise system has two sides:

1. **Franchise Management** — For businesses that already have or are growing a franchise network. Track royalties, manage locations, monitor performance.

2. **Franchise Creator** — For businesses that want to START franchising. Step-by-step wizard to build their FDD, franchise agreement, territory map, franchisee application portal, and training system. When they franchise through Kasse, their franchise system IS Kasse — white-labeled with their brand.

This is the feature that no competitor has. Square helps you take payments. Vagaro helps you manage appointments. Kasse helps you build an entire franchise empire.

---

## FRANCHISE HIERARCHY

```
Organization (Franchisor)
│
├── Zone / Region (optional grouping)
│   ├── Location (Franchisee 1)
│   ├── Location (Franchisee 2)
│   └── Location (Franchisee 3)
│
└── Zone / Region 2
    ├── Location (Franchisee 4)
    └── Location (Franchisee 5)
```

**Access control:**
- Franchisor: Sees everything — all locations, all revenue, all performance
- Regional Manager: Sees their zone only
- Franchisee: Sees their own locations only
- Kasse Admin (Robert): Sees all organizations on platform

---

## FRANCHISE MANAGEMENT MODULE

### Dashboard
- Total network revenue (all locations combined)
- Fees collected this period (tech fee + royalty + marketing fund)
- Top performing locations ranking
- Underperforming locations alerts
- Network-wide rebook rate
- Average ticket across network

### Locations Table
- All franchise locations with: name, owner, city, revenue, fees owed, status
- Filter by zone/region
- Click → drill into location's full portal data (read-only for franchisor)
- Compare two locations side-by-side

### Fee Configuration
- Technology fee: percentage of gross revenue or flat monthly
- Royalty fee: percentage of gross revenue or flat monthly
- Marketing fund: percentage of gross revenue or flat monthly
- Custom fees: add any additional fee type

### Automated Fee Collection
- Fees calculated daily from SalonTransact transaction data
- Auto-deducted from franchisee's payout before they receive funds
- Franchisor sees: what was earned, what was deducted, what was remitted
- Franchisee sees: their revenue, fees deducted, net payout
- Monthly fee statements generated automatically

### Royalty Reports
- Per franchisee, per period
- Fees collected vs fees owed
- Payment history
- Outstanding balances
- Export to QuickBooks / Excel

### Brand Standards Monitoring
- Compliance checklist per location (configurable by franchisor)
- Items: online reviews maintained, services updated, hours set, etc.
- Non-compliance alerts to franchisor
- Location compliance score

---

## FRANCHISE CREATOR PORTAL

Step-by-step wizard to take any business from "I want to franchise" to "I have a franchise system."

### Step 1 — Franchise Profile
- Franchise name (may differ from business name)
- Industry (pre-filled from Kasse business type)
- Year founded
- Number of current locations
- Franchise fee amount (initial fee paid by franchisee to join)
- Royalty structure (configurable in Kasse)
- Initial investment range (equipment, build-out, training)
- Liquidity requirements for franchisees

### Step 2 — FDD Builder (Franchise Disclosure Document)
The FDD is legally required before offering a franchise in the US. It has 23 mandatory items defined by the FTC.

Kasse pre-fills from your data where possible:

| Item | Description | Kasse Auto-Fill |
|------|-------------|-----------------|
| Item 1 | The Franchisor | From org profile |
| Item 2 | Business Experience | Manual |
| Item 3 | Litigation | Manual |
| Item 4 | Bankruptcy | Manual |
| Item 5 | Initial Fees | From franchise fee config |
| Item 6 | Other Fees | From fee config (royalty, marketing) |
| Item 7 | Estimated Initial Investment | Manual + Kasse hardware costs |
| Item 8 | Restrictions on Sources | Manual |
| Item 9 | Franchisee's Obligations | Template |
| Item 10 | Financing | Manual |
| Item 11 | Franchisor's Assistance | Template |
| Item 12 | Territory | From territory mapping tool |
| Item 13 | Trademarks | Manual |
| Item 14 | Patents, Copyrights | Manual |
| Item 15 | Obligation to Participate | Manual |
| Item 16 | Restrictions on What Franchisee May Sell | From service catalog |
| Item 17 | Renewal, Termination, Transfer | Template |
| Item 18 | Public Figures | Manual |
| Item 19 | Financial Performance Representations | From Kasse revenue data (if sharing) |
| Item 20 | Outlets and Franchisee Information | From location data |
| Item 21 | Financial Statements | Manual (CPA-prepared) |
| Item 22 | Contracts | Links to franchise agreement |
| Item 23 | Receipts | Template |

**Output:** Downloadable FDD template as PDF.
**Disclaimer prominently displayed:** "This template is a starting point. It MUST be reviewed and finalized by a licensed franchise attorney before use. Using an unreviewed FDD exposes you to FTC regulatory action."

### Step 3 — Franchise Agreement Builder
- Based on FDD structure
- Key terms configurable: term length, renewal terms, territory rights, transfer rights
- Non-compete clause (state-specific)
- Training requirements
- Technology requirements (Kasse required — pre-filled)
- Marketing fund obligations
- Quality standards
- Default and termination conditions

**Output:** Downloadable franchise agreement template.
**Same attorney disclaimer.**

### Step 4 — Territory Mapping
- Google Maps integration
- Draw territories by:
  - Radius (X miles from location)
  - Zip code selection
  - Custom polygon (draw on map)
- Assign territories to existing or prospective franchisees
- Lock territories (protected — won't be offered to another franchisee)
- Territory exclusivity configuration
- Map view showing all territories across franchise network

### Step 5 — Franchisee Application Portal
Generates a public URL: `apply.[franchisebrand].com` or `kasse.com/franchise/[slug]`

Application form collects:
- Personal info (name, contact, location)
- Financial info (liquid assets, net worth — non-binding, for screening)
- Business experience
- Why they want this franchise
- Preferred territory
- Timeline to open
- How they found out about the franchise

**Franchisor sees:**
- Application pipeline (Submitted → Under Review → Approved → In Progress → Open)
- Application details + scoring
- Approve or deny with automated email notification
- Notes on each applicant

### Step 6 — Training Portal
- Upload training videos (SOPs, brand standards, Kasse training)
- Organize into modules (Pre-Opening, Operations, Marketing, Kasse Usage)
- Assign courses to franchisees
- Track completion (% complete per franchisee)
- Quiz/test functionality (must score 80% to pass)
- Certificate of completion
- "Kasse Certified" badge shown on franchisee's portal

**Required training modules (pre-built by Kasse):**
- How to use the Kasse POS terminal
- How to use the Kasse booking calendar
- How to use Kasse reports
- How to configure your location settings
- How to manage staff in Kasse

### Step 7 — Franchisee Onboarding
When a franchisee is approved:
1. System auto-provisions their Kasse instance (white-labeled with franchise brand)
2. Franchisee receives welcome email with login credentials
3. They're enrolled in training courses (must complete before "live" date)
4. Territory locked in the map
5. Franchise agreement digitally signed (DocuSign integration)
6. Initial fee collected via SalonTransact
7. Kasse hardware bundle ordered (if applicable)

### Step 8 — Brand Standards Center
- Uploadable brand standards document
- Logo package (primary, secondary, horizontal, vertical variants)
- Color palette (hex values)
- Typography guidelines
- Photo library (approved images for use)
- Marketing materials (approved templates)
- "Do's and Don'ts" document
- Violation reporting (franchisees can report brand standard concerns)

---

## STATE COMPLIANCE TRACKER

FDD registration is required in these "registration states" before you can offer a franchise there:
- California, Hawaii, Illinois, Indiana, Maryland, Michigan, Minnesota, New York, North Dakota, Oregon, Rhode Island, South Dakota, Virginia, Washington, Wisconsin

States with FTC filing only (no registration): All others

The compliance tracker shows:
- Which states you're registered in
- Registration expiration dates (annual renewal required)
- Filing deadlines
- States where you've sold franchises (triggers registration requirement)
- Attorney contacts in each registration state (referral marketplace)

---

## ATTORNEY REFERRAL MARKETPLACE

Kasse partners with franchise attorneys across the country.

**For the franchisor:**
- Find a franchise attorney to review their FDD (required before offering)
- State-specific attorneys for registration states
- Fixed-fee packages (FDD review: $3,000-8,000; full franchise launch package: $15,000-30,000)

**Revenue model:**
- Kasse receives referral fee (15-20% of attorney fee)
- Attorneys pay for directory listing ($500/year per state)
- Kasse provides qualified, pre-vetted leads

**Attorney directory shows:**
- Name, firm, bar license, states licensed in
- Franchise experience (# of FDDs reviewed, # of systems launched)
- Pricing (transparent — no surprise bills)
- Client reviews (verified Kasse franchise creators)
- Average response time

---

## FRANCHISE FINANCIAL MODEL

### How Kasse makes money from franchising:

1. **Franchisor subscription:** Enterprise tier ($499/month) for the franchise creator + management suite
2. **Per-franchisee fee:** $49/month per active franchisee location on Kasse
3. **Transaction margin:** Every payment processed at every franchisee location → Reyna Pay margin
4. **Tech fee cut:** Franchisor charges franchisees a tech fee → Kasse takes a % of that tech fee (configurable)
5. **Attorney referrals:** $500-1,500 per referral to franchise attorney
6. **Training portal hosting:** $99/month for advanced training features (video hosting, quizzes, certificates)
7. **Hardware bundles:** $499 per "Kasse Station" bundle ordered by franchisees

### Example: 50-location franchise network
- Franchisor subscription: $499/month
- Per-location fees: 50 × $49 = $2,450/month
- Transaction margin: 50 locations × $50k/month GPV × 0.9% = $22,500/month
- Total Kasse revenue from this one franchise system: ~$25,000/month = $300,000/year

Scale to 20 franchise systems × $300k/year = $6M ARR from franchise alone.
