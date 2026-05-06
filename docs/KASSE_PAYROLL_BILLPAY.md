# KASSE_PAYROLL_BILLPAY.md
## Payroll, Bill Pay & Financial Operations — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## STRATEGIC PURPOSE

Kasse is not just a booking and POS tool. It is the financial operating system for service businesses. The moment a merchant runs payroll through Kasse and pays their vendors through Kasse, switching costs become insurmountable. This is the QuickBooks + Gusto + Venmo for small service businesses — but built into the same platform they use for appointments.

**The lock-in stack:**
1. Kasse Pay processes their revenue (money comes in through Kasse)
2. Kasse Banking holds their deposits (money sits in Kasse)
3. Kasse Payroll pays their team (money goes out through Kasse)
4. Kasse Bill Pay pays their vendors (money goes out through Kasse)
5. Kasse Lending underwrites their capital (credit underwritten by Kasse data)

Once all five are active, leaving Kasse means rebuilding every financial relationship they have. Nobody does that.

---

## SECTION 1 — EMPLOYEE CLASSIFICATION SYSTEM

### The Four Employment Types in Service Businesses

Service businesses employ people in ways that traditional payroll software doesn't understand. Kasse handles all four natively:

**TYPE 1 — W2 Employee (Hourly or Salaried)**
- Kasse tracks hours via clock in/out
- Calculates overtime (>40 hours/week at 1.5x)
- Withholds federal income tax, state income tax, FICA (Social Security 6.2% + Medicare 1.45%)
- Employer pays matching FICA + FUTA + SUTA
- Year-end: W2 generated and filed
- Typical use: Receptionists, assistants, managers

**TYPE 2 — 1099 Commission Stylist**
- No tax withholding
- Kasse calculates and tracks commission earned
- Tips tracked (reported separately — self-reported by stylist, or tracked via Kasse transactions)
- Year-end: 1099-NEC generated and filed for anyone earning >$600
- No employer payroll taxes owed
- Typical use: Most stylists in commission-based salons

**TYPE 3 — Booth Renter**
- Pays rent to the salon owner (weekly or monthly)
- Keeps 100% of service revenue
- Kasse handles two things: (1) rent collection via ACH from booth renter's bank, (2) the booth renter optionally runs their own Kasse account (sub-merchant) for their client bookings and payments
- Salon owner sees booth rent income on their P&L
- Booth renter is NOT an employee of the salon — independent contractor arrangement
- Year-end: No W2 or 1099 for rent payments (rent is not compensation)
- Typical use: Most barbershop chairs, some salon suites

**TYPE 4 — Hybrid (W2 with Commission)**
- Base hourly rate (W2) + commission on services above a threshold
- Example: $12/hour base, plus 35% commission on revenue above $500/week
- Kasse calculates: hours × hourly rate + (services above threshold × commission rate)
- Withholding on full amount (base + commission)
- Less common but used in some multi-location salon chains

### Schema — Staff Employment Fields

```sql
-- Added to Staff table via migration:
employmentType        TEXT    DEFAULT 'commission'
  -- Values: 'w2_hourly', 'w2_salary', '1099_commission', 'booth_rent', 'w2_commission_hybrid'

hourlyRate            DOUBLE PRECISION  -- for w2_hourly and w2_commission_hybrid
salaryAmount          DOUBLE PRECISION  -- for w2_salary (annual)
commissionType        TEXT    DEFAULT 'percentage'
  -- Values: 'percentage', 'tiered', 'per_service', 'booth_rent_only'
commissionRate        DOUBLE PRECISION  DEFAULT 40  -- percentage for commission types
commissionTiers       JSONB  -- for tiered: [{threshold: 3000, rate: 40}, {threshold: 5000, rate: 45}]
boothRentAmount       DOUBLE PRECISION  -- weekly or monthly rent amount
boothRentFrequency    TEXT    DEFAULT 'weekly'  -- 'weekly', 'monthly'
boothRentNextDue      TIMESTAMP

overtimeEligible      BOOLEAN DEFAULT false  -- only true for w2_hourly
benefitsEligible      BOOLEAN DEFAULT false
federalTaxExemptions  INTEGER DEFAULT 1  -- W4 allowances
stateTaxExemptions    INTEGER DEFAULT 1

startDate             TIMESTAMP
endDate               TIMESTAMP  -- set when terminated
terminationReason     TEXT
```

---

## SECTION 2 — PAY PERIODS

### Pay Period Configuration

Owner configures pay periods in Settings → Payroll:

**Frequency options:**
- Weekly (most common for commission stylists)
- Bi-weekly (every 2 weeks — most common for W2 hourly)
- Semi-monthly (1st and 15th — common for salaried)
- Monthly (some booth rent collections)

**Per-employee overrides:** Each staff member can have a different pay frequency. Commission stylists weekly, W2 receptionists bi-weekly.

### PayPeriod Schema

```sql
CREATE TABLE "PayPeriod" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId  TEXT NOT NULL REFERENCES "Organization"(id),
  startDate       TIMESTAMP NOT NULL,
  endDate         TIMESTAMP NOT NULL,
  frequency       TEXT NOT NULL,  -- 'weekly', 'biweekly', 'semimonthly', 'monthly'
  status          TEXT DEFAULT 'open',  -- 'open', 'closed', 'paid', 'void'
  closedAt        TIMESTAMP,
  closedBy        TEXT,  -- userId
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PayrollRun" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId  TEXT NOT NULL REFERENCES "Organization"(id),
  payPeriodId     TEXT NOT NULL REFERENCES "PayPeriod"(id),
  runDate         TIMESTAMP NOT NULL,
  payDate         TIMESTAMP NOT NULL,  -- when money actually moves
  totalGross      DOUBLE PRECISION DEFAULT 0,
  totalWithheld   DOUBLE PRECISION DEFAULT 0,  -- taxes withheld
  totalNet        DOUBLE PRECISION DEFAULT 0,
  status          TEXT DEFAULT 'draft',  -- 'draft', 'approved', 'processing', 'paid', 'failed'
  processedBy     TEXT,  -- userId of owner who ran it
  disbursementRef TEXT,  -- Wise batch transfer ID or other ref
  notes           TEXT,
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PayrollLine" (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  payrollRunId          TEXT NOT NULL REFERENCES "PayrollRun"(id),
  staffId               TEXT NOT NULL REFERENCES "Staff"(id),
  employmentType        TEXT NOT NULL,
  
  -- Earnings
  hoursWorked           DOUBLE PRECISION DEFAULT 0,
  regularHours          DOUBLE PRECISION DEFAULT 0,
  overtimeHours         DOUBLE PRECISION DEFAULT 0,
  hourlyEarnings        DOUBLE PRECISION DEFAULT 0,
  overtimeEarnings      DOUBLE PRECISION DEFAULT 0,
  serviceCommission     DOUBLE PRECISION DEFAULT 0,
  retailCommission      DOUBLE PRECISION DEFAULT 0,
  tips                  DOUBLE PRECISION DEFAULT 0,
  bonuses               DOUBLE PRECISION DEFAULT 0,
  boothRentCollected    DOUBLE PRECISION DEFAULT 0,  -- for booth renters
  grossPay              DOUBLE PRECISION DEFAULT 0,
  
  -- Deductions (W2 only)
  federalTaxWithheld    DOUBLE PRECISION DEFAULT 0,
  stateTaxWithheld      DOUBLE PRECISION DEFAULT 0,
  socialSecurityW       DOUBLE PRECISION DEFAULT 0,  -- employee portion
  medicareWithheld      DOUBLE PRECISION DEFAULT 0,  -- employee portion
  otherDeductions       DOUBLE PRECISION DEFAULT 0,  -- garnishments, advances repaid
  
  -- Employer costs (W2 only, not paid to employee)
  socialSecurityER      DOUBLE PRECISION DEFAULT 0,  -- employer portion
  medicareER            DOUBLE PRECISION DEFAULT 0,
  futaTax               DOUBLE PRECISION DEFAULT 0,
  sutaTax               DOUBLE PRECISION DEFAULT 0,
  
  netPay                DOUBLE PRECISION DEFAULT 0,
  adjustments           DOUBLE PRECISION DEFAULT 0,  -- manual adjustments (+ or -)
  adjustmentNotes       TEXT,
  
  -- Payment
  status                TEXT DEFAULT 'pending',  -- 'pending', 'processing', 'paid', 'failed', 'manual'
  paymentMethod         TEXT,  -- 'wise_ach', 'manual_check', 'manual_cash', 'booth_debit'
  paymentRef            TEXT,  -- Wise transfer ID or check number
  paidAt                TIMESTAMP,
  
  createdAt             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## SECTION 3 — PAYROLL CALCULATION ENGINE

### Commission Calculation Logic

```typescript
// lib/payroll/commission.ts

async function calculateCommissionForPeriod(
  staffId: string,
  payPeriodId: string
): Promise<CommissionBreakdown> {
  
  const period = await getPeriod(payPeriodId);
  const staff = await getStaff(staffId);
  
  // Get all transaction items for this staff member in this period
  const items = await prisma.transactionItem.findMany({
    where: {
      staffId,
      createdAt: { gte: period.startDate, lte: period.endDate },
      transaction: { status: 'completed' }
    },
    include: { transaction: true }
  });
  
  let serviceRevenue = 0;
  let retailRevenue = 0;
  let serviceCommission = 0;
  let retailCommission = 0;
  
  for (const item of items) {
    if (item.type === 'service') {
      serviceRevenue += item.price * item.quantity;
    } else if (item.type === 'retail') {
      retailRevenue += item.price * item.quantity;
    }
  }
  
  // Apply commission rate based on type
  if (staff.commissionType === 'percentage') {
    serviceCommission = serviceRevenue * (staff.commissionRate / 100);
    retailCommission = retailRevenue * (staff.commissionRate / 100);
  }
  
  else if (staff.commissionType === 'tiered') {
    // Sort tiers by threshold ascending
    const tiers = staff.commissionTiers as CommissionTier[];
    tiers.sort((a, b) => a.threshold - b.threshold);
    
    // Find applicable tier based on total service revenue this period
    let applicableRate = tiers[0].rate;
    for (const tier of tiers) {
      if (serviceRevenue >= tier.threshold) {
        applicableRate = tier.rate;
      }
    }
    serviceCommission = serviceRevenue * (applicableRate / 100);
    retailCommission = retailRevenue * (tiers[0].rate / 100); // retail always at base rate
  }
  
  else if (staff.commissionType === 'per_service') {
    // Each TransactionItem has its own commissionRate stored
    for (const item of items) {
      if (item.type === 'service' && item.commissionRate) {
        serviceCommission += (item.price * item.quantity) * (item.commissionRate / 100);
      }
    }
    retailCommission = retailRevenue * (staff.commissionRate / 100);
  }
  
  // Get tips for this period
  const tips = await getTipsForStaff(staffId, period.startDate, period.endDate);
  
  return {
    serviceRevenue,
    retailRevenue,
    serviceCommission,
    retailCommission,
    tips,
    grossPay: serviceCommission + retailCommission + tips
  };
}
```

### W2 Tax Withholding Calculation

```typescript
// lib/payroll/tax-withholding.ts

function calculateFederalWithholding(
  grossPay: number,
  payFrequency: string,
  exemptions: number,
  filingStatus: 'single' | 'married'
): number {
  // Annualize the gross pay
  const multiplier = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 }[payFrequency];
  const annualizedPay = grossPay * multiplier;
  
  // 2026 standard deduction and tax brackets
  // These values must be updated annually from IRS Publication 15-T
  const standardDeduction = filingStatus === 'married' ? 29200 : 14600;
  const exemptionValue = 4300; // per exemption
  
  const taxableIncome = Math.max(0, annualizedPay - standardDeduction - (exemptions * exemptionValue));
  
  // 2026 federal tax brackets (single)
  let annualTax = 0;
  const brackets = filingStatus === 'single' 
    ? [
        { min: 0,      max: 11600,  rate: 0.10 },
        { min: 11600,  max: 47150,  rate: 0.12 },
        { min: 47150,  max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
      ]
    : [/* married brackets */];
  
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      annualTax += taxableInBracket * bracket.rate;
    }
  }
  
  // De-annualize
  return annualTax / multiplier;
}

function calculateFICA(grossPay: number): { socialSecurity: number; medicare: number } {
  const SS_RATE = 0.062;   // 6.2% employee portion
  const MC_RATE = 0.0145;  // 1.45% employee portion
  const SS_WAGE_BASE = 168600; // 2026 SS wage base — update annually
  
  return {
    socialSecurity: Math.min(grossPay, SS_WAGE_BASE) * SS_RATE,
    medicare: grossPay * MC_RATE
  };
}
```

### Booth Rent ACH Collection

```typescript
// lib/payroll/booth-rent.ts
// Runs via Vercel cron every morning

async function collectBoothRent() {
  const today = new Date();
  
  // Find all booth rent staff members with rent due today
  const dueToday = await prisma.staff.findMany({
    where: {
      commissionType: 'booth_rent_only',
      isActive: true,
      boothRentNextDue: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      }
    },
    include: { organization: true }
  });
  
  for (const staff of dueToday) {
    try {
      // Initiate ACH debit via Kasse Pay API
      const transfer = await kassePay.initiateDebit({
        merchantId: staff.boothRenterKassePayId, // booth renter's sub-merchant account
        amount: staff.boothRentAmount,
        description: `Booth rent — ${staff.organization.name}`,
        idempotencyKey: `booth-rent-${staff.id}-${format(today, 'yyyy-MM-dd')}`
      });
      
      // Record the transaction
      await prisma.payrollLine.create({
        data: {
          staffId: staff.id,
          employmentType: 'booth_rent',
          boothRentCollected: staff.boothRentAmount,
          netPay: -staff.boothRentAmount, // negative — they pay us
          status: 'processing',
          paymentMethod: 'kasse_pay_debit',
          paymentRef: transfer.id
        }
      });
      
      // Update next due date
      const nextDue = staff.boothRentFrequency === 'weekly' 
        ? addWeeks(today, 1) 
        : addMonths(today, 1);
      
      await prisma.staff.update({
        where: { id: staff.id },
        data: { boothRentNextDue: nextDue }
      });
      
      // Notify booth renter
      await sendSMS(staff.phone, `Booth rent of $${staff.boothRentAmount} collected for ${format(today, 'MMM d')}. Questions? Contact ${staff.organization.name}.`);
      
    } catch (error) {
      // Payment failed — notify owner immediately
      await notifyOwner(staff.organizationId, {
        type: 'booth_rent_failed',
        staffName: staff.name,
        amount: staff.boothRentAmount,
        error: error.message
      });
      
      // Flag on staff record
      await prisma.staff.update({
        where: { id: staff.id },
        data: { boothRentPaymentFailed: true, boothRentFailedAt: today }
      });
    }
  }
}
```

---

## SECTION 4 — PAYROLL DISBURSEMENT

### Wise Business API Integration

Wise is used for payroll disbursements because:
1. Much cheaper than traditional payroll ACH ($0.41/transfer vs $1-2 for most payroll services)
2. Fast (1-3 business days, same as ACH)
3. International capable (if staff have foreign bank accounts — unlikely but nice to have)
4. Developer-friendly API
5. No per-seat or per-company fees

**Staff setup:** Staff members who want direct deposit must connect their bank account to Wise through a simple flow inside Kasse (either native Wise OAuth or Kasse-hosted bank account entry that stores as a Wise recipient).

### Disbursement Flow

```typescript
// lib/payroll/disburse.ts

async function disbursePayroll(payrollRunId: string): Promise<void> {
  const run = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: { lines: { include: { staff: true } } }
  });
  
  if (run.status !== 'approved') throw new Error('PayrollRun must be approved before disbursement');
  
  // Build Wise batch transfer
  const transfers = [];
  
  for (const line of run.lines) {
    if (line.employmentType === 'booth_rent') continue; // booth rent collected separately
    if (line.paymentMethod === 'manual_check' || line.paymentMethod === 'manual_cash') continue;
    if (!line.staff.wiseRecipientId) {
      // No Wise account — mark as manual
      await prisma.payrollLine.update({
        where: { id: line.id },
        data: { status: 'manual', paymentMethod: 'manual_check' }
      });
      continue;
    }
    
    transfers.push({
      targetAccount: line.staff.wiseRecipientId,
      quote: await wiseApi.createQuote({
        sourceCurrency: 'USD',
        targetCurrency: 'USD',
        sourceAmount: line.netPay
      }),
      customerTransactionId: `payroll-${line.id}`,
      details: {
        reference: `${run.organization.name} Payroll — ${format(run.payDate, 'MMM d, yyyy')}`
      }
    });
  }
  
  // Create Wise batch transfer
  const batch = await wiseApi.createBatch({
    sourceCurrency: 'USD',
    transfers
  });
  
  // Fund from Kasse Banking account
  await wiseApi.fundBatch(batch.id, {
    type: 'BALANCE'
  });
  
  // Update PayrollRun
  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { 
      status: 'processing',
      disbursementRef: batch.id
    }
  });
  
  // Notify each staff member
  for (const line of run.lines) {
    if (line.paymentMethod === 'wise_ach') {
      await sendSMS(line.staff.phone, 
        `Your pay of $${line.netPay.toFixed(2)} for ${format(run.payPeriod.startDate, 'MMM d')}–${format(run.payPeriod.endDate, 'MMM d')} has been sent. Expected arrival: ${format(addBusinessDays(new Date(), 2), 'MMM d')}.`
      );
    }
  }
}
```

### Wise Webhook — Transfer Completion

```typescript
// app/api/webhooks/wise/route.ts

export async function POST(request: Request) {
  const event = await request.json();
  
  if (event.event_type === 'transfers#state-change' && event.data.current_state === 'outgoing_payment_sent') {
    const transferId = event.data.resource.id;
    
    // Find the PayrollLine with this transfer ID
    const line = await prisma.payrollLine.findFirst({
      where: { paymentRef: transferId }
    });
    
    if (line) {
      await prisma.payrollLine.update({
        where: { id: line.id },
        data: { status: 'paid', paidAt: new Date() }
      });
    }
    
    // Check if all lines for the run are now paid → update PayrollRun status
    const run = await checkAllLinesPaid(line.payrollRunId);
    if (run.allPaid) {
      await prisma.payrollRun.update({
        where: { id: line.payrollRunId },
        data: { status: 'paid' }
      });
    }
  }
}
```

---

## SECTION 5 — TAX FILING & COMPLIANCE

### The Kasse Tax Service

This is a monthly addon ($49/month) that turns compliance from a pain into an automatic system.

**What's included:**

**Quarterly (January, April, July, October):**
- Form 941 preparation (Employer's Quarterly Federal Tax Return) — employer's share of FICA for W2 employees
- Quarterly federal tax deposit via EFTPS (automated from Kasse Banking)
- State payroll tax deposit (varies by state — Texas has no income tax, but FUTA/SUTA still applies)
- Kasse handles all calculations, owner reviews and approves, Kasse submits

**Year-end:**
- W2 generation for all W2 employees (paper + electronic)
- W2 filing with SSA (Social Security Administration) — electronically via Business Services Online
- 1099-NEC generation for all 1099 contractors earning >$600
- 1099 filing with IRS — electronically via FIRE system
- Owner receives copies of all filings

**Ongoing:**
- Kasse alerts owner when payroll tax deposits are due (based on deposit schedule — monthly depositor for most small businesses, semi-weekly for larger)
- Track employee W4 changes and apply immediately
- Track state unemployment insurance (SUTA) rates (Texas 2026: new employer rate 2.7%)
- Update tax tables annually (new brackets, new FICA wage bases) — owner never touches this

**What the owner sees:**
- Tax calendar showing upcoming filing dates
- Upcoming deposit amounts (so they know what's coming out of Kasse Banking)
- Filing history (every return filed, status, confirmation number)
- Employee W4 management (view/update each W2 employee's withholding)

**Revenue model:**
- $49/month per organization with W2 employees
- At 500 organizations with W2 employees: $24,500/month = $294,000/year
- Actual cost (third-party tax API — Yearli, Symmetry, or similar): ~$10-15/org/month
- Gross margin: ~70% on this product

---

## SECTION 6 — BILL PAY

### Vendor Management

```sql
CREATE TABLE "Vendor" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId  TEXT NOT NULL REFERENCES "Organization"(id),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,  -- 'rent', 'utilities', 'supplies', 'marketing', 'payroll', 'equipment', 'other'
  contactName     TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  
  -- Payment info
  paymentMethod   TEXT NOT NULL,  -- 'ach', 'check', 'card', 'wire'
  bankRoutingNumber TEXT,  -- for ACH
  bankAccountNumber TEXT,  -- for ACH (encrypted)
  bankAccountType TEXT,    -- 'checking', 'savings'
  
  isActive        BOOLEAN DEFAULT true,
  notes           TEXT,
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Bill" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  organizationId  TEXT NOT NULL REFERENCES "Organization"(id),
  vendorId        TEXT NOT NULL REFERENCES "Vendor"(id),
  
  amount          DOUBLE PRECISION NOT NULL,
  dueDate         TIMESTAMP NOT NULL,
  description     TEXT,
  invoiceNumber   TEXT,
  invoiceUrl      TEXT,  -- PDF stored in Supabase storage
  
  -- Recurring
  isRecurring     BOOLEAN DEFAULT false,
  recurringFrequency TEXT,  -- 'weekly', 'monthly', 'quarterly', 'annually'
  recurringEndDate TIMESTAMP,
  
  -- Payment
  status          TEXT DEFAULT 'pending',  -- 'pending', 'scheduled', 'paid', 'failed', 'cancelled'
  scheduledDate   TIMESTAMP,  -- when to process payment
  paidAt          TIMESTAMP,
  paymentRef      TEXT,
  
  category        TEXT,  -- matches vendor category for P&L categorization
  
  createdAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bill Pay Flow

**Adding a vendor:**
1. Vendor name + category
2. Payment method (ACH is preferred — fastest and cheapest)
3. For ACH: enter routing + account number (verified via micro-deposits or Plaid instant verification)
4. Save → vendor active

**Adding a bill:**
1. Select vendor
2. Enter amount
3. Due date
4. Is this recurring? → frequency + end date (or no end date)
5. Attach invoice PDF (drag and drop)
6. Payment scheduling:
   - "Pay on due date"
   - "Pay 3 days before due date" (recommended — accounts for ACH processing time)
   - "Pay on [specific date]"
7. Save → bill appears in calendar, payment scheduled

**Payment processing:**
- Scheduled bill payment initiated via Kasse Banking ACH API
- Confirmation notification to owner
- Bill marked paid + payment reference stored
- Syncs to P&L automatically

**Bill calendar:**
```
MAY 2026
─────────────────────────────────────────────────────────────────
Mon 6   Today
Wed 8   🔴 Salon Suite Rent — $3,500 (due in 2 days)
Fri 10  🟡 CosmoProf Order — $440
Thu 15  🔵 Payroll — ~$8,400 (estimated)
Fri 16  🔵 Twilio (auto-pay) — $89
Mon 19  🟡 Wella Professional — $312
Thu 22  🔵 Resend Email (auto-pay) — $29
Fri 30  🔵 Kasse Subscription — $99
─────────────────────────────────────────────────────────────────
TOTAL DUE THIS MONTH: ~$13,869
KASSE BANKING BALANCE: $12,840 ⚠️ Low balance alert
```

---

## SECTION 7 — QUICKBOOKS-LIKE P&L AND REPORTING

### Chart of Accounts

Pre-built default chart of accounts for service businesses:

**INCOME:**
- Service Revenue
- Retail Revenue
- Membership Revenue
- Gift Card Revenue
- Booth Rent Income
- Tip Income (for W2 employees — must be reported)

**COST OF GOODS SOLD:**
- Product/Supply Cost
- Color and Chemical Supplies (salon)
- Equipment Rental

**OPERATING EXPENSES:**
- Payroll — Wages (W2 employees)
- Payroll — Commissions (1099 contractors)
- Payroll Taxes (employer FICA, FUTA, SUTA)
- Rent
- Utilities
- Software and Subscriptions (Kasse, Twilio, etc.)
- Marketing and Advertising
- Credit Card Processing Fees (Kasse Pay)
- Professional Services (accountant, attorney)
- Equipment and Supplies
- Insurance
- Continuing Education (license renewals, classes)

Owner can add custom accounts. Each bill, each vendor, and each expense category maps to a chart of accounts entry.

### Profit & Loss Report

```
SALON ENVY — CORPUS CHRISTI
Profit & Loss · April 2026

REVENUE
  Service Revenue              $42,300    ▲ 8% vs March
  Retail Revenue                $3,840    ▲ 12% vs March
  Booth Rent Income             $4,800    — (stable)
  Gift Card Revenue               $450
  ─────────────────────────────────────────────────────
  TOTAL REVENUE                $51,390

COST OF GOODS SOLD
  Supplies & Color               $4,280
  ─────────────────────────────────────────────────────
  GROSS PROFIT                 $47,110    91.7% margin

OPERATING EXPENSES
  Payroll — W2 Wages            $9,840
  Payroll — Commissions        $14,220
  Payroll Taxes                 $1,180
  Rent                          $3,500
  Utilities                       $420
  Kasse + Software                $148
  Credit Card Processing        $1,232    (Kasse Pay 2.9%)
  Marketing                       $300
  Insurance                       $180
  ─────────────────────────────────────────────────────
  TOTAL EXPENSES               $31,020

NET PROFIT                     $16,090    31.3% margin
                               ▲ 4% vs March
                               ▲ 22% vs April 2025
```

**Export options:** PDF, CSV, QuickBooks-compatible journal entry export (IIF format)

### QuickBooks Online Sync

When QuickBooks Online is connected:
- Every Kasse transaction syncs to QBO as a sales receipt within 24 hours
- Categories mapped to QBO chart of accounts
- Each vendor payment syncs as a bill payment
- Payroll syncs as journal entries (gross wages, tax withholdings, employer taxes as separate entries)
- Monthly reconciliation report: Kasse balance vs QBO balance

**Sync is one-way by default** (Kasse → QBO). Two-way sync (allowing QBO changes to come back) is Phase 8+.

---

## SECTION 8 — KASSE BANKING (BAAS)

### Banking Partner Options

**Preferred: Column Bank (columna.com)**
- Modern BaaS infrastructure designed for platforms like Kasse
- ACH, wires, card issuance all available
- Competitive interchange
- Clean API
- FDIC insured up to $250K per depositor

**Backup: Evolve Bank & Trust, Lead Bank, Grasshopper**

**Application to be a Column partner:** Requires demonstrating legitimate fintech platform with real merchant base. Apply after Phase 0 (first real merchants). 3-6 month approval timeline — start immediately.

### Kasse Business Checking Features

**For the merchant:**
- Kasse Pay settlements land directly in Kasse Banking account (T+1 or T+2)
- No minimum balance, no monthly fees
- ACH sends and receives (bill pay, payroll)
- Routing + account number (full ACH capability)
- Transaction history with merchant names and categories
- Statements downloadable as PDF

**Kasse Business Debit Card (Phase 4+):**
- Marqeta or Stripe Issuing for card program
- Physical card issued to owner
- Virtual card available immediately at account open
- Interchange: ~1.5% on most spend (Kasse earns this)
- Spending controls (category blocks, daily limits, per-merchant limits)
- Real-time transaction notifications

### Banking Revenue for Kasse

```
At 500 merchants with Kasse Banking:

Interchange (debit card spend):
  500 merchants × $3,000 avg monthly spend × 1.5% interchange = $22,500/month

Float income (holding deposits):
  500 merchants × $5,000 avg balance × 4.5% federal funds rate × 60% pass-through = $6,750/month

Wire and ACH fees:
  Minimal — most merchants use ACH at no fee, occasional wire at $15-25

Total banking revenue: ~$29,250/month from 500 banking merchants
```

---

## SECTION 9 — PAYROLL UI (COMPLETE FLOW)

### Payroll Dashboard

**URL:** `/payroll`

```
PAYROLL                                          [Configure Payroll]

CURRENT PAY PERIOD: May 1–15, 2026 (bi-weekly)
Period Status: OPEN

PROJECTED PAYROLL
─────────────────────────────────────────────────────────────────────────────────
Jennifer Martinez    Commission    $1,260 svc + $80 retail + $320 tips = $1,660
Marcus Johnson       Booth Rent    Rent due: $400 (collected)
Lisa Chen            W2 Hourly     42 hrs @ $15 = $648 regular + $30 OT = $678
Ashley Williams      Commission    $880 svc + $210 tips = $1,090
David Kim            Commission    $1,100 svc + $280 tips = $1,380
Maria Gonzalez       1099 Comm.    $940 svc + $190 tips = $1,130
─────────────────────────────────────────────────────────────────────────────────
                               TOTAL PROJECTED:  $6,538
                          W2 Employer Taxes:        $52  (Lisa only)
                          TOTAL PAYROLL COST:     $6,590
```

**[Run Payroll] button opens review flow:**

**Step 1 — Review earnings:**
- Each staff member's breakdown (expandable)
- Service commission detail: every transaction listed, service name, amount, rate, commission
- Retail commission detail
- Tips detail
- Hours worked (W2 staff)

**Step 2 — Adjustments:**
- Per staff member: add one-time adjustment
- Types: Bonus, Advance, Advance Repayment, Deduction, Other
- Amount + required reason
- Approval noted (who added it)

**Step 3 — Review totals:**
- Final payroll table with adjustments applied
- W2 tax withholding calculations shown per W2 employee
- Net pay per person shown clearly
- Employer tax costs shown separately (not paid to employee — paid to IRS)
- Total cash needed from Kasse Banking account shown

**Step 4 — Pay date selection:**
- Today / Tomorrow / Custom date
- Note: ACH takes 2 business days — warn if same-day selected

**Step 5 — Confirm:**
- Final confirmation screen
- "By approving this payroll, you authorize Kasse to debit $[amount] from your Kasse Banking account to pay your team."
- [Approve & Pay] button

**Step 6 — Processing:**
- PayrollRun created with status 'processing'
- Wise batch transfer initiated
- Each staff member notified via SMS
- PayrollRun status updates automatically via Wise webhook

### Staff My Pay Page

**URL:** `/my-pay`
**Visible to:** All staff (own data only)

```
MY PAY — Jennifer Martinez
─────────────────────────────────────────────────────────────────
CURRENT PERIOD: May 1–15, 2026
Status: Open (projected)

PROJECTED EARNINGS
Services performed                       $2,800.00
My commission rate                           45%
Service commission                       $1,260.00
Retail sold                                $177.00
Retail commission (10%)                    $17.70
Tips received                              $320.00
─────────────────────────────────────────────────────────────────
PROJECTED TOTAL                          $1,597.70

DETAIL — Services this period
May 1    Sarah Johnson    Balayage     $180  × 45% = $81.00
May 1    Maria Garcia     Color        $95   × 45% = $42.75
May 3    Amanda K.        Cut+Color    $155  × 45% = $69.75
...

PAY HISTORY
Apr 16–30   Paid May 2     $1,842.00  [View detail]
Apr 1–15    Paid Apr 16    $1,614.00  [View detail]
Mar 16–31   Paid Apr 1     $1,390.00  [View detail]
```

---

## SECTION 10 — BUILD PHASES

**Phase 3.1 (employee classification):** Schema migration + employment type UI on Staff profiles. No calculations yet — just the data model.

**Phase 3.2 (commission calculation):** Commission engine wired to real TransactionItem data. Commission shown on Staff Earnings tab in real-time.

**Phase 3.3 (payroll UI):** Full payroll dashboard with draft mode. No disbursement yet — owner sees what would be paid, marks as "manual" for now.

**Phase 3.4 (Wise integration):** Wise API connected. PayrollLine disbursement goes from "mark as manual" to actual ACH transfer. Staff get notified via SMS.

**Phase 3.5 (W2 calculations):** Tax withholding calculations added for W2 hourly employees. Withholding shown on PayrollLine. Not yet filed with IRS — owner gets report to file manually.

**Phase 3.6 (Kasse Tax Service):** Tax filing automation via third-party API. 941 quarterly filing, W2 year-end, 1099-NEC year-end. $49/month addon launched.

**Phase 4.1 (Bill Pay):** Vendor management + Bill Pay UI. Manual payment tracking (owner marks bills paid manually). ACH not yet wired.

**Phase 4.2 (Bill Pay ACH):** Actual ACH payments via Kasse Banking. Vendors receive ACH from Kasse Banking account.

**Phase 4.3 (Kasse Banking):** Column Bank BaaS integration. Merchants open Kasse business checking. Kasse Pay settlements land in Kasse Banking. Full banking dashboard.

**Phase 4.4 (Kasse Debit Card):** Marqeta card issuance. Physical + virtual Kasse business debit card. Interchange revenue begins.

**Phase 4.5 (P&L and QuickBooks sync):** Full P&L report. QuickBooks Online sync. Chart of accounts management.

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Attorney review required for: tax filing service positioning, Wise integration terms, Column Bank BaaS agreement, and payroll compliance for multi-state employees.*
