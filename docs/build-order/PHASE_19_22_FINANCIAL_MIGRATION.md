# PHASE 19-22 — FINANCIAL OPS + MIGRATION

**Scope:** Payroll Engine (P19, 50 PRs), Banking + Bill Pay (P20, 40 PRs), Sales Tax + Nexus Tracker (P21, 20 PRs), Migration Center (P22, 60 PRs).
**Total PRs:** 170
**Depends on:** P0, P6 (commission tables), P4 (Reyna Pay live for ACH disbursements).
**Reference docs:** SD-002 (payroll deferred discussion — using SalonBacked Tax/Payroll modules), KASSE_FEATURES.md, KASSE_RETENTION.md (Tax Nexus Tracker), KASSE_TIERS.md.

---

# P19 — PAYROLL ENGINE (50 PRs)

Per memory: SD-002 deferred Wise + Stripe Treasury for payroll. Using Checkbook.io approved for ACH + payroll. Branch for earned wage access.

## P19.A — Employee Classification Schema (5 PRs)

### P19.A.1 — Schema: Staff.classification enum
```prisma
enum StaffClassification {
  W2_HOURLY
  W2_SALARIED
  COMMISSION_ONLY
  BOOTH_RENT
  CONTRACTOR_1099
}
```

### P19.A.2 — Migration + backfill
### P19.A.3 — Per-classification fields (hourly rate, salary, commission %, booth rent amount)
### P19.A.4 — Onboarding flow capture (W-4 for W-2, W-9 for 1099)
### P19.A.5 — Classification audit (changes logged)

## P19.B — Commission Engine (10 PRs)

### P19.B.1 — Commission calculation library
Files: `lib/payroll/commission.ts`

### P19.B.2 — Flat commission (% of service)
### P19.B.3 — Tiered commission (revenue >$X gets higher %)
### P19.B.4 — Per-service overrides
### P19.B.5 — Per-category overrides (Color higher than Cut)
### P19.B.6 — Retail commission (separate %)
### P19.B.7 — New-client multiplier
### P19.B.8 — Sliding scale (over time)
### P19.B.9 — Commission preview at checkout (staff sees estimated earning)
### P19.B.10 — Commission audit (recompute on edit, log diffs)

## P19.C — Tip Distribution (5 PRs)

### P19.C.1 — Per-service tip allocation
### P19.C.2 — Tip pooling rules (e.g., 10% to bussers)
### P19.C.3 — Cash tip tracking (manual entry)
### P19.C.4 — Tip reporting (IRS-compliant)
### P19.C.5 — Tip dispute workflow

## P19.D — W-2 + Hourly + Overtime (5 PRs)

### P19.D.1 — Hourly tracking from ClockEvent
### P19.D.2 — Overtime calculation (>40hr week, state-specific)
### P19.D.3 — Salary proration (mid-period start)
### P19.D.4 — Holiday pay handling
### P19.D.5 — PTO accrual + usage

## P19.E — Booth Rent ACH Collection (5 PRs)

### P19.E.1 — Booth rent schedule (weekly default)
### P19.E.2 — Auto-ACH from staff bank account (Checkbook.io)
### P19.E.3 — Late fee (configurable)
### P19.E.4 — Failed payment retry
### P19.E.5 — Booth rent receipts (1099 implications)

## P19.F — Pay Period + Payroll Run (10 PRs)

### P19.F.1 — Schema: PayPeriod, PayrollRun, PayrollLine
### P19.F.2 — Pay period config (weekly, bi-weekly, semi-monthly, monthly)
### P19.F.3 — Payroll run UI (preview)
### P19.F.4 — Per-line review + adjust (override commission, add bonus)
### P19.F.5 — Approval workflow (OWNER signs off)
### P19.F.6 — Lock pay period (no more edits)
### P19.F.7 — Disbursement via Checkbook.io ACH
### P19.F.8 — Wise integration as fallback `[NOTE: SD-002 flagged Wise restriction — verify]`
### P19.F.9 — Payment confirmation tracking
### P19.F.10 — Audit log per pay run

## P19.G — Tax Withholding + Filings (5 PRs)

### P19.G.1 — W-2 tax withholding (federal, state, FICA)
Integration with SalonBacked Tax module (P27).

### P19.G.2 — 1099-NEC generation (annual)
### P19.G.3 — W-2 generation (annual)
### P19.G.4 — Quarterly 941 prep
### P19.G.5 — State unemployment filings (SUI)

## P19.H — Staff Pay View + Earned Wage Access (5 PRs)

### P19.H.1 — Staff sees own pay history
Already in P10 staff portal. Hook fully.

### P19.H.2 — Branch integration (earned wage access)
Per memory: Branch confirmed as partner.

### P19.H.3 — Earnings request (mid-period draw)
### P19.H.4 — Pay stub PDF
### P19.H.5 — Tax doc download (1099/W-2)

---

# P20 — BANKING + BILL PAY (40 PRs)

## P20.A — Kasse Account + Transaction Ledger (10 PRs)

### P20.A.1 — Schema: KasseAccount table
Per-org operating account (linked to Reyna Pay settlement).

### P20.A.2 — Schema: KasseTransaction
Inflows (settlements) + outflows (bills, payroll, refunds).

### P20.A.3 — Banking dashboard
Files: `app/dashboard/banking/page.tsx`
Balance, recent activity, settlement schedule.

### P20.A.4 — Transaction feed
### P20.A.5 — Filter + search
### P20.A.6 — Categorization (auto + manual)
### P20.A.7 — Reconciliation (against bank statement)
### P20.A.8 — Bank statement download
### P20.A.9 — Account number masking
### P20.A.10 — Multi-account support (multiple bank accounts per org)

## P20.B — Vendors + Bills (15 PRs)

### P20.B.1 — Schema: Vendor table
### P20.B.2 — Schema: Bill table
### P20.B.3 — Vendor CRUD UI
### P20.B.4 — Bill creation (manual + invoice upload)
### P20.B.5 — Invoice OCR (Claude vision)
### P20.B.6 — Recurring bill setup
### P20.B.7 — Bill approval workflow
### P20.B.8 — Pay via ACH (Checkbook.io)
### P20.B.9 — Pay via check (Checkbook.io physical check)
### P20.B.10 — Bill calendar view
### P20.B.11 — Bill alerts (3-day, 1-day, overdue)
### P20.B.12 — Bill audit log
### P20.B.13 — Vendor 1099-MISC generation (annual)
### P20.B.14 — Bill categorization (for P&L)
### P20.B.15 — Bill attachments (invoice PDFs)

## P20.C — P&L + Accounting Sync (15 PRs)

### P20.C.1 — P&L report (monthly)
Files: `app/dashboard/reports/profit-loss/page.tsx`

### P20.C.2 — P&L YoY comparison
### P20.C.3 — P&L category drill-down
### P20.C.4 — Balance sheet (basic)
### P20.C.5 — Cash flow statement
### P20.C.6 — Chart of accounts setup
### P20.C.7 — Account mapping (Kasse categories → QB accounts)
### P20.C.8 — QuickBooks Online sync (OAuth)
### P20.C.9 — Sync transactions to QB
### P20.C.10 — Sync deposits
### P20.C.11 — Sync bills
### P20.C.12 — Sync payroll
### P20.C.13 — Xero sync (P61 — for now stub)
### P20.C.14 — Wave sync (P61 stub)
### P20.C.15 — Accountant access integration (P0.A.5 role)

---

# P21 — SALES TAX ENGINE + NEXUS TRACKER (20 PRs)

## P21.A — Avalara Integration (10 PRs)

### P21.A.1 — Avalara API integration
### P21.A.2 — Tax rate lookup per location
### P21.A.3 — Per-service taxable toggle
### P21.A.4 — Per-product taxable toggle
### P21.A.5 — Tax-exempt client flag (with cert upload)
### P21.A.6 — Multi-state tax handling
### P21.A.7 — Tax report (filing-ready)
### P21.A.8 — Auto-filing trigger
### P21.A.9 — Tax remittance tracking
### P21.A.10 — Tax adjustment workflow

## P21.B — Nexus Tracker (per KASSE_RETENTION.md SYSTEM 4) (10 PRs)

### P21.B.1 — Transaction location tracking
Capture merchant location, service delivery location, client billing address per tx.

### P21.B.2 — Nexus monitoring weekly cron
### P21.B.3 — Per-state nexus thresholds DB
### P21.B.4 — Physical nexus detection (mobile services)
### P21.B.5 — Economic nexus detection (product sales threshold)
### P21.B.6 — Nexus exposure map dashboard widget
### P21.B.7 — 80% threshold warning
### P21.B.8 — 95% urgent alert
### P21.B.9 — Crossed threshold alert + guidance
### P21.B.10 — Tax professional referral network ($99 referral fee)

---

# P22 — MIGRATION CENTER (60 PRs)

## P22.A — Square Migration (10 PRs)

### P22.A.1 — Square OAuth setup
### P22.A.2 — Square API client
Per memory: Salon Envy currently uses Square locations LTJSA6QR1HGW6 (CC) + LXJYXDXWR0XZF (SA).

### P22.A.3 — Pull clients (Customers API)
### P22.A.4 — Pull services (Catalog API)
### P22.A.5 — Pull staff (Team Members API)
### P22.A.6 — Pull appointments (Bookings API)
### P22.A.7 — Pull transactions (Payments API)
### P22.A.8 — Pull gift cards
### P22.A.9 — Pull inventory
### P22.A.10 — Square loyalty migration

## P22.B — Vagaro Migration (5 PRs)

### P22.B.1 — Vagaro guided import (CSV-based, no API)
### P22.B.2 — Vagaro clients CSV → Kasse Client
### P22.B.3 — Vagaro services CSV
### P22.B.4 — Vagaro appointments CSV
### P22.B.5 — Vagaro staff CSV

## P22.C — GlossGenius Migration (5 PRs)

### P22.C.1 — GlossGenius OAuth `[VERIFY API availability]`
### P22.C.2 — Clients pull
### P22.C.3 — Services pull
### P22.C.4 — Appointments pull
### P22.C.5 — Photo gallery migration (color formulas)

## P22.D — Mindbody + Boulevard + Other (10 PRs)

### P22.D.1-3 — Mindbody API client + clients + appointments
### P22.D.4-6 — Boulevard API client + data pull
### P22.D.7 — Acuity Scheduling
### P22.D.8 — Booker
### P22.D.9 — StyleSeat
### P22.D.10 — Schedulicity

## P22.E — Generic CSV Import (10 PRs)

### P22.E.1 — CSV upload UI
### P22.E.2 — AI column mapping (Claude reads headers, infers mapping)
### P22.E.3 — Manual override mapping
### P22.E.4 — Validation preview
### P22.E.5 — Duplicate detection (across CSV + existing)
### P22.E.6 — Batch import (chunked)
### P22.E.7 — Error report
### P22.E.8 — Rollback (within 24h)
### P22.E.9 — Per-entity CSV templates downloadable
### P22.E.10 — Import history

## P22.F — Data Preview + Mapping UI (5 PRs)

### P22.F.1 — Preview screen (before commit)
### P22.F.2 — Field mapping editor
### P22.F.3 — Conflict resolution (override existing, skip, merge)
### P22.F.4 — Sample import (first 10 rows)
### P22.F.5 — Confirm + execute

## P22.G — Parallel Running Mode (5 PRs)

### P22.G.1 — 30-day sync mode
New data continues syncing from source after migration.

### P22.G.2 — Configurable sync frequency (real-time, hourly, daily)
### P22.G.3 — Conflict detection during sync
### P22.G.4 — Sync activity log
### P22.G.5 — Cutover flow (final sync + disable source)

## P22.H — Ghost Migration + AI Verification (5 PRs)

### P22.H.1 — Ghost mode (silent background sync, no portal visible to merchant)
For sales demos: "Here's your data on Kasse already."

### P22.H.2 — AI verification (anomaly detection on import)
Counts off, missing required fields, suspicious price changes.

### P22.H.3 — Verification report
### P22.H.4 — Saved card remediation (per memory)
Cards cannot be transferred between processors. Notify clients to re-add on first Kasse visit.

### P22.H.5 — Re-add card prompt (booking flow)

## P22.I — Polish (5 PRs)

### P22.I.1 — Migration progress UI (live status)
### P22.I.2 — Error handling + retries
### P22.I.3 — Per-merchant migration assistance request
### P22.I.4 — White-glove migration service (PRO+ tier)
### P22.I.5 — Migration analytics (source platform breakdown)

---

## PHASE 19-22 COMPLETION CRITERIA

- All 170 PRs merged
- Payroll running for Salon Envy (W-2 + 1099 staff)
- Banking dashboard reconciled
- QuickBooks Online sync working
- Salon Envy migrated from Square (existing locations now fully on Kasse for ops)
- KASSE_REAL_BUILD_ORDER.md updated

**After P19-22:** P23-P26 (Verticals deep) can run.
