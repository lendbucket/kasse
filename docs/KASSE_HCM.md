# KASSE HCM
## Human Capital Management — Complete Specification

**Version:** 1.0 | **Status:** PLANNING | **Owner:** Robert Reyna
**Authority:** SD-K-019 (HCM foundations v1), SD-K-030 (geolocation), SD-K-021 (50-state compliance)

---

## SCOPE

Kasse HCM v1 covers the foundations of human capital management for salon teams:
data collection, document storage, license verification, background checks, time 
tracking, PTO, and document generation.

Kasse HCM v1 does **NOT** cover payroll processing (disbursement, withholding, 
filing). Payroll processing is v2 (SD-K-019) or handled externally by Gusto/ADP / 
SalonBacked.

---

## STAFF PROFILE

### Required fields (v1)

- Legal name, preferred name
- Date of birth
- SSN (last 4 visible, full encrypted)
- Address (street, city, state, zip)
- Phone, email
- Emergency contact
- Hire date
- Employment classification (W-2 / 1099 / Booth Renter)
- Employment status (Active / Inactive / Terminated)
- Locations (primary + additional where they work)
- Compensation model (see Commission Engine)

### Documents collected

**Federal:**
- W-4 (federal withholding) — for W-2 employees
- I-9 (employment eligibility) — for all employees
- Direct deposit authorization (account + routing)

**State-specific (TX/CA/FL/NY/IL priority for v1):**
- State W-4 equivalent (CA DE-4, NY IT-2104, etc.)
- State new hire reporting form

**Industry-specific:**
- Cosmetology license verification (TDLR for TX, state equivalents)
- Background check results (Checkr integration)
- Vaccination/health certifications (where required by state)

### Employment agreements

**Authority:** SD-K-019

- Template library: TX/CA/FL/NY/IL employment agreements
- Custom upload: merchant can upload their own template
- E-signature: Kasse-built canvas + audit log (SD-K-019)
- Storage: encrypted at rest, retained 7 years post-termination

---

## TIME CLOCK

**Authority:** SD-K-030

### Modes

**iPad in-salon clock-in:**
- Staff member taps Clock In on shared Kasse iPad at salon front desk
- Geolocation verified within 100ft radius of location
- Photo capture (optional, configurable per salon)
- ClockEvent recorded with timestamp + coordinates + IP + device

**Geofenced mobile clock-in:**
- Staff opens Capacitor mobile app on personal device
- App requests location permission (required for clock-in)
- Verifies device is within 100ft radius
- Refuses clock-in from rooted/jailbroken device
- Cross-checks GPS against IP-derived location (catches GPS spoofing)

**Hourly tracking during service:**
- For hourly-paid stylists, app verifies they remain in geofence during service
- Out-of-geofence events trigger audit log + soft warn (manager review)

### Enforcement

- **Soft warn** on out-of-geofence clock-in (legitimate edge cases: delivery driver 
  in parking lot, mobile stylist on call, etc.)
- **Manager override** available for ambiguous cases
- **Full audit log** of every clock event with coordinates + IP + device + result
- **Reports** show clock event patterns: tardiness, early departures, geofence 
  violations

---

## PTO / SICK LEAVE

### Request workflow

1. Staff member submits request via Kasse mobile app or portal
2. Manager receives notification (email + in-app)
3. Manager approves or denies with optional note
4. Staff member notified of decision
5. Approved PTO blocks their schedule for the requested dates

### State-aware accruals (v1 priority states)

**Texas:** No state-mandated sick leave (federal rules only)
**California:** Mandatory paid sick leave per AB 2017 (40hr/year minimum)
**New York:** NY Paid Sick Leave Law (40hr/year minimum, more for large employers)
**Illinois:** Paid Leave for All Workers Act (40hr/year minimum)
**Florida:** No state-mandated sick leave (federal rules only)

Kasse tracks accruals per state law. Manager dashboard shows real-time balance.

### Non-priority states (states 6-50)

Generic PTO tracking with manual accrual rules until state-specific compliance ships.

---

## BACKGROUND CHECKS

**Provider:** Checkr (integration)
**Cost:** Pass-through to merchant ($25-55 per check depending on package)

### Available check types

- **Standard:** SSN trace, national criminal database, county criminal records
- **Plus:** + Driving record, employment verification, education verification
- **Pro:** + Drug testing (where required)

### Trigger points

- New hire (before first day)
- License renewal (TDLR every 2 years for TX cosmetologists)
- Custom triggers (configured per salon)

### Storage

- Results stored in encrypted Staff record
- Adverse-action workflow if check returns flags
- 7-year retention post-termination

---

## LICENSE VERIFICATION

**Authority:** SD-K-021 (state compliance)

### TX (priority 1)

- TDLR cosmetology license number stored on Staff profile
- Daily cron verifies license is still valid (TDLR provides public lookup API)
- Alerts manager 30 days before expiration
- Blocks clock-in if license expires (configurable: hard block or warn)

### CA, NY, IL, FL (priority 2)

- State equivalent license tracking
- Manual verification fallback (URL to state lookup page) while API integrations 
  are built

### Other states (priority 3)

- Manual entry only until state integration ships

---

## TAX DOCUMENT GENERATION (v1)

**Authority:** SD-K-038

### 1099-NEC

- Generated automatically end-of-year for 1099 contractors
- PDF download per contractor
- Bulk export for IRS filing (merchant files manually via IRS portal or accountant)
- v2: direct e-filing with IRS

### W-2

- Generated automatically end-of-year for W-2 employees
- PDF download per employee
- Bulk export for IRS filing (merchant files manually via IRS portal or payroll provider)
- v2: direct e-filing with IRS

### Sales tax (where applicable)

- Manual rate per location v1 (SD-K-027 TaxJar v2)
- Tax-on-products tracking for product sales
- Tax-on-services tracking where applicable by state

---

## COMPENSATION MODELS

**Authority:** SD-K-026

A single stylist can have multiple simultaneous compensation models. Examples:

**Example 1: Senior Stylist (W-2)**
- Hourly base: $15/hour
- Service commission: 50% (Service A, B, C) / 60% (Service D)
- Retail commission: 15%
- Tips: 100% pass-through
- Overtime: 1.5x after 40 hours/week

**Example 2: Booth Renter (1099 — v1)**
- Booth rent: $400/week
- Service revenue: 100% to stylist (paid via external POS — Kasse does not process)
- Tips: 100% to stylist
- Note: v2 will support true sub-merchant boarding (SD-K-025)

**Example 3: Hybrid (Junior Stylist transitioning)**
- Base salary: $2,000/month
- Service commission: 40% above $4,000/month service revenue
- Retail commission: 10%
- Goal: transition to full commission within 12 months

### Profitability calculator

Owner inputs scenarios:
- "What if I move Jane from 50% flat to tiered 40/50/60?"
- "What if I add a booth-rent stylist at $500/week?"
- "What if I switch all stylists to commission-only?"

System calculates projected impact on:
- Per-stylist take-home
- Salon margin
- Total payroll cost
- Cash flow timing

---

## TRAVELING STYLISTS

**Authority:** SD-K-040

Stylists are assigned a primary location but can be scheduled at any org location:

- Schedule per location per day (Stylist A: Location 1 Mon-Wed, Location 2 Thu-Fri)
- Compensation follows the stylist (booth rent applies at their primary location 
  regardless of where they work)
- Reports attribute revenue to the location where service occurred
- Tip splits and commission calculated normally per location

---

## REFERENCES

- **Strategic decisions:** SD-K-019, SD-K-021, SD-K-026, SD-K-030, SD-K-038, SD-K-040
- **Compliance details:** docs/KASSE_COMPLIANCE.md (new in this PR)
- **Tier eligibility:** docs/KASSE_TIERS.md (rewritten in this PR)
- **Schema:** Staff, ClockEvent, PermissionSet (existing in P0.A)
- **Schema (new in P0.G):** PtoRequest, TaxDocument, EmploymentAgreement, Compensation
