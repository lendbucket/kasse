# SALONBACKED
## The Human Capital Management Engine for the Beauty Industry

**Version:** 1.0 | **Entity:** Reyna Insure LLC | **Status:** PLANNING

---

## STATE COMPLIANCE PRIORITY (SD-K-021)

SalonBacked is a separate product (SD-K-015) handling extended HR, payroll, insurance, and benefits beyond Kasse's HCM foundations.

**State rollout priority for SalonBacked features:**

**Priority 1 (v1 launch):**
- Texas (TX) — home state, primary launch market
- California (CA) — largest salon market, strict regulations
- Florida (FL) — significant salon density
- New York (NY) — high-revenue salon market
- Illinois (IL) — Midwest anchor

**Priority 2 (v1.x, within 6 months of launch):**
- States 6-15: NJ, MA, WA, PA, GA, NC, VA, OH, MI, AZ

**Priority 3 (v1.x, within 12 months):**
- Remaining 35 states rolled out in priority order based on Kasse merchant concentration

**Kasse v1 vs SalonBacked v1:**
- Kasse v1 provides HCM foundations (data collection, time clock, document storage) across all 50 states from day one (SD-K-019)
- SalonBacked v1 adds the payroll-processing layer for priority 1 states only
- Merchants in priority 2-3 states use Kasse HCM + external payroll provider (Gusto/ADP) until SalonBacked rolls out to their state

---

## WHAT SALONBACKED IS

SalonBacked is the financial and human infrastructure backbone for the independent beauty professional and salon business. It is the HCM (Human Capital Management) layer that sits alongside Kasse, connected by the Reyna Pay engine.

**The pitch to salon owners:**
"Stop using QuickBooks for accounting, Gusto for payroll, a random insurance broker for benefits, TurboTax for taxes, and a binder for HR documents. SalonBacked does all of it — and it already knows your revenue because it's connected to Kasse."

**The pitch to independent stylists:**
"You're self-employed. That means you're your own HR department, accountant, insurance broker, and financial advisor. SalonBacked makes all of that as easy as getting a haircut."

---

## PRODUCT MODULES

### 1. SalonBacked Tax
TurboTax for salon professionals.

**Features:**
- 1099 income tracking (booth renters, independent stylists)
- W-2 tracking (salon employees)
- Quarterly estimated tax calculator with auto-pay reminders (Q1: Apr 15, Q2: Jun 15, Q3: Sep 15, Q4: Jan 15)
- Business expense tracking (products, tools, education, mileage, booth rent)
- Home office deduction calculator
- Auto-categorize expenses from SalonTransact transaction history
- State-specific tax rules (TX no income tax, CA high rate — auto-apply)
- Schedule C auto-fill for sole proprietors
- Self-employment tax calculator (15.3% — most stylists don't know this)
- Tax filing integration (partner with Column Tax or TaxSlayer for actual filing)
- "Am I an employee or independent contractor?" legal classifier
- IRS audit protection (partner with Tax Defense Network)
- Year-end summary: earned, owed, deductible
- Mileage tracking (IRS standard rate, auto-calculate from GPS if enabled)
- Continuing education deduction tracker
- Professional license fees deduction tracker
- Equipment depreciation calculator (color equipment, styling tools)

**Data flow from Kasse:**
- Revenue per stylist per period (auto-imported)
- Tips received (required for W-2 tip reporting)
- Product sales commission
- Commission payments received

---

### 2. SalonBacked Insurance

**Professional Liability (Errors & Omissions + Malpractice):**
- Covers: chemical burns, allergic reactions, hair damage, injuries
- Per occurrence and aggregate limits
- Carriers: Next Insurance (primary target), Hiscox, Thimble
- Quote in minutes from Kasse data (revenue, service types, staff count)
- Group policy for salon vs individual policy for stylist
- Certificate of insurance download (required by booth rental agreements)

**General Liability:**
- Slip and fall at salon
- Property damage
- Third-party bodily injury
- BOP (Business Owner's Policy) bundles GL + property

**Tools and Equipment Insurance:**
- Covers stylist kit if stolen, damaged, or lost
- Replacement cost coverage
- Riders for high-value equipment (Dyson, etc.)

**Workers Compensation:**
- Required in most states for employees
- Auto-quote from Kasse payroll data
- Pay-as-you-go (charge exact premium based on actual payroll — no guessing)
- State-specific compliance

**Stylist-Specific Disability:**
- "What if I hurt my hands?" product — nobody offers this well
- Short-term disability (income replacement if can't work)
- Long-term disability
- Own-occupation definition (can't do YOUR job, not just any job)
- Waiting period options

**Life Insurance:**
- Term life marketplace
- For booth renters with business debt or dependents

**Health Insurance:**
- See Health module below

---

### 3. SalonBacked Health (Telehealth + Coverage)

**Telehealth Access:**
- 24/7 virtual urgent care (colds, infections, prescriptions, UTIs)
- Mental health therapy (video sessions — stylists burn out at high rates)
- Dermatology consults (contact dermatitis from chemicals is a major stylist health issue)
- Occupational health (back pain, carpal tunnel, standing injuries — all stylist-specific)
- Prescription discount card (works with or without insurance — GoodRx equivalent)
- Wellness checks (annual labs reviewed via video)
- Nutrition counseling
- Partners: Teladoc, MDLive, or build on Wheel/Sesame Health API
- Cost: $19/month per stylist — included in SalonBacked subscription

**Health Insurance Marketplace:**
- ACA marketplace plans for independent stylists (can't get employer-sponsored coverage)
- ICHRA (Individual Coverage HRA) for salon employees (employer reimburses for individual plans)
- QSEHRA (Qualified Small Employer HRA) for small salons under 50 employees
- Group health plans for salon employees (if 2+ W-2 employees)
- Dental + vision add-ons
- HSA account opening + funding
- Partners: PeopleKeep (ICHRA), Take Command Health (ICHRA), Stride (marketplace plans)

---

### 4. SalonBacked HR

**Document Generation:**
- Digital offer letters (e-sign via embedded DocuSign or HelloSign)
- Employee handbook generator (customizable, state-specific)
- Independent contractor agreements (1099 vs W-2 — legally correct per state)
- Non-compete agreements (state-specific — CA unenforceable, TX enforceable — auto-adjust)
- Non-solicitation agreements
- I-9 employment eligibility verification (digital)
- W-4 collection and storage
- Booth rental agreements (standardized, digital, attorney-reviewed base template)
- Commission structure agreements

**Employee Lifecycle:**
- Onboarding checklist (documents to collect, training to complete)
- Direct deposit setup (connects to payroll provider)
- PTO tracking and accrual
- Performance review templates + digital signatures
- Disciplinary documentation (write-ups, PIPs with digital acknowledgment)
- Termination documentation (separation agreement, final paycheck calculator)
- COBRA notification generation

**Compliance:**
- State-specific minimum wage alerts (when your state raises minimum wage)
- Overtime threshold alerts (FLSA + state rules)
- New hire reporting (required within X days in most states)
- EEOC documentation (required for 15+ employees)
- OSHA compliance tracker (chemical exposure documentation for salon)
- ADA compliance checklist

**Commission Dispute Resolution:**
- When a stylist claims underpayment
- Documentation trail from Kasse transaction data
- Clear audit log of what was calculated vs what was paid
- Dispute filing + resolution workflow

---

### 5. SalonBacked Payroll

**Integration Model (Phase 1):**
- Kasse calculates commission + tips + hours
- SalonBacked exports to Gusto/ADP/Paychex with pre-filled data
- "One-click payroll" — salon reviews, approves, payroll runs externally
- Gusto referral fee back to Reyna

**Native Payroll (Phase 2 — embedded partner):**
- Full payroll processing embedded via Check or Gusto partnership
- Auto-calculate commissions from Kasse data
- Booth rental deductions
- Federal + state + local tax withholding
- Direct deposit same-day or next-day
- Garnishments and child support
- Tip reporting on W-2 (legally required)
- Contractor payments + 1099-NEC generation
- Year-end W-2 and 1099
- Payroll tax filing (941, 940, SUTA, FUTA)
- Multi-state payroll support
- Pay-by-exception (only process changes from last period)

---

### 6. SalonBacked Benefits Administration

- Benefits enrollment portal
- FSA (Flexible Spending Account)
- Dependent care FSA
- Commuter benefits (metro cards, parking)
- 401(k) via Guideline or Betterment for Business
- Student loan repayment assistance (Gen Z stylists carry significant debt)
- Education stipend management (CE credit reimbursements)
- Employee discounts marketplace (gym memberships, retail, services)
- "Total compensation" statement (shows employee their full value beyond salary)

---

### 7. SalonBacked Financial Wellness

- Business credit score monitoring (Nav.com API)
- Revenue forecasting + cash flow dashboard (from Kasse data)
- Business banking integration (Mercury, Relay referrals)
- Business credit card recommendations
- Loan marketplace (SBA loans, lines of credit via Biz2Credit or Lendio)
- "Your salon's financial health score" — composite metric
- Retirement planning calculator
- Emergency fund tracker ("You need 3 months = $15,000. You have $4,200. Here's a plan.")
- Tax savings calculator ("If you set up an S-Corp, you save $X annually")

---

## INTEGRATION WITH KASSE

### Data Kasse sends to SalonBacked:
- Revenue per stylist per period (payroll input)
- Commission amounts calculated (payroll confirmation)
- Hours worked via clock events (labor hours for workers comp, overtime)
- Tips received per stylist (W-2 tip income)
- Service types performed (insurance risk profile)
- Staff count and roles (benefits eligibility)

### Data SalonBacked sends to Kasse:
- Payroll processed confirmation (mark as paid in Kasse)
- Insurance status per stylist (show "Insured" badge on profile)
- CE credits completed (update license tracker)
- License expiry dates (TDLR alert system)
- HR compliance status (any overdue documents flagged in Kasse)

---

## PRICING MODEL

| Tier | Who | Price | What's Included |
|------|-----|-------|-----------------|
| Stylist Solo | Independent booth renters | $29/month | Tax tracker, telehealth, marketplace listing, basic HR docs |
| Salon Starter | 1-5 staff | $99/month | + Insurance marketplace, payroll export, benefits enrollment |
| Salon Growth | 6-20 staff | $199/month | + Native payroll, full HR suite, compliance monitoring |
| Enterprise | 20+ staff or franchise | $499/month | + Custom HR, dedicated HR advisor, multi-location |

**Add-on pricing:**
- Telehealth for additional staff: $15/month per person
- Attorney consultations: $150/hour (revenue share with attorney)
- Tax filing: $49 for sole prop, $199 for business (revenue share with filing partner)
- Workers comp (pay-as-you-go): premium based on payroll

---

## COMPETITIVE LANDSCAPE

| Competitor | What They Do | What We Have That They Don't |
|-----------|--------------|------------------------------|
| Gusto | Payroll + benefits | Salon-specific, integrated with Kasse data, insurance |
| Rippling | HR + payroll + IT | Affordable for small salons, telehealth, marketplace integration |
| Justworks | PEO (co-employment) | Not a PEO model — we remain employer of record |
| ADP | Payroll | Better UX, salon-specific, AI-powered, half the price |
| TurboTax | Tax filing | Stylist-specific deductions, connected to actual revenue data |
| GoodRx | Prescription discounts | Part of broader telehealth suite |

---

## ROADMAP

### SalonBacked Phase 1 (6 months after Kasse Phase 3)
- Tax tracking module
- Telehealth access
- Insurance marketplace (professional liability first)
- Basic HR document generation

### SalonBacked Phase 2 (12 months after Kasse Phase 5)
- Native payroll integration (Gusto embedded)
- Benefits administration
- Workers comp (pay-as-you-go)
- Health insurance marketplace

### SalonBacked Phase 3 (18 months)
- Financial wellness dashboard
- Business credit monitoring
- Student loan assistance
- Full compliance monitoring

### SalonBacked Phase 4 (24 months)
- Proprietary payroll (no external dependency)
- SalonBacked Capital (working capital for individual stylists)
- Group purchasing power (negotiate rates with vendors using scale)
- "SalonBacked Certified" badge (verified insured + compliant)
