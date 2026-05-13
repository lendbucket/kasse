# PHASE 53-55 — INTERNATIONAL EXPANSION

**Scope:** International Foundation (P53, 80 PRs), Country Launches (P54, 60 PRs), Multi-Region Deployment (P55, 60 PRs).
**Total PRs:** 200
**Depends on:** P0-P22 foundation, P48.D GDPR/privacy, P50 agents, P51 voice (multi-language).
**Reference docs:** KASSE_VISION.md (international growth), KASSE_STRATEGIC_DECISIONS.md.

---

# P53 — INTERNATIONAL FOUNDATION (80 PRs)

## P53.A — Multi-Currency Engine (15 PRs)

### P53.A.1 — Schema: Currency table (ISO 4217 codes)
### P53.A.2 — Organization.baseCurrency field
### P53.A.3 — Currency conversion service (with rate caching)
### P53.A.4 — Exchange rate provider integration (OpenExchangeRates or similar)
### P53.A.5 — Daily rate updates (cron)
### P53.A.6 — Historical rate storage (for accurate past-tx reporting)
### P53.A.7 — Multi-currency display (per-user preference)
### P53.A.8 — Multi-currency reporting
### P53.A.9 — Multi-currency accounting (FX gain/loss tracking)
### P53.A.10 — Per-product / service currency override (rare)
### P53.A.11 — Currency formatting per locale (€1.234,56 vs €1,234.56)
### P53.A.12 — Refund in original currency
### P53.A.13 — Cross-currency reconciliation
### P53.A.14 — Currency settlement preferences per merchant
### P53.A.15 — Currency conversion fees (transparent)

## P53.B — Full i18n Beyond P0.H (15 PRs)

### P53.B.1 — Pluralization rules per language (Russian has 3+ plural forms)
### P53.B.2 — Date format per locale (DD/MM/YYYY vs MM/DD/YYYY vs YYYY-MM-DD)
### P53.B.3 — Time format per locale (12hr vs 24hr)
### P53.B.4 — Phone number format per country
### P53.B.5 — Address format per country
### P53.B.6 — RTL language support (Arabic, Hebrew)
### P53.B.7 — French translations (fr-CA, fr-FR)
### P53.B.8 — German translations
### P53.B.9 — Italian translations
### P53.B.10 — Portuguese translations (pt-BR, pt-PT)
### P53.B.11 — Japanese translations
### P53.B.12 — Korean translations
### P53.B.13 — Chinese translations (zh-CN simplified, zh-TW traditional)
### P53.B.14 — Arabic translations
### P53.B.15 — Translation management system (Lokalise or self-hosted)

## P53.C — Privacy Compliance per Region (15 PRs)

### P53.C.1 — GDPR full compliance (EU)
### P53.C.2 — UK Data Protection Act (post-Brexit)
### P53.C.3 — PIPEDA (Canada)
### P53.C.4 — LGPD (Brazil)
### P53.C.5 — Privacy Act (Australia)
### P53.C.6 — PIPL (China)
### P53.C.7 — APPI (Japan)
### P53.C.8 — PDPA (Singapore)
### P53.C.9 — KVKK (Turkey)
### P53.C.10 — Data residency requirements
### P53.C.11 — Data transfer mechanisms (SCCs, BCRs, adequacy decisions)
### P53.C.12 — Per-region DPO designation
### P53.C.13 — Per-region cookie consent banners
### P53.C.14 — Per-region privacy policy generator
### P53.C.15 — Per-region BAA / DPA equivalents

## P53.D — Country Payment Methods (15 PRs)

### P53.D.1 — Interac (Canada)
### P53.D.2 — SEPA Direct Debit (EU)
### P53.D.3 — iDEAL (Netherlands)
### P53.D.4 — Bancontact (Belgium)
### P53.D.5 — Sofort / Giropay (Germany)
### P53.D.6 — Klarna (Buy Now Pay Later — EU/AU)
### P53.D.7 — Pix (Brazil)
### P53.D.8 — OXXO (Mexico)
### P53.D.9 — UPI (India)
### P53.D.10 — Alipay + WeChat Pay (China + diaspora)
### P53.D.11 — PayPay (Japan)
### P53.D.12 — Tap to Pay variants per country
### P53.D.13 — BPAY (Australia)
### P53.D.14 — POLi (Australia/NZ)
### P53.D.15 — Country-specific tax/VAT inclusive vs exclusive display

## P53.E — Tax + Invoicing per Country (10 PRs)

### P53.E.1 — VAT (EU + UK)
### P53.E.2 — GST (Canada, Australia, India)
### P53.E.3 — HST (Canada provinces)
### P53.E.4 — PST/QST (Canada provincial sales taxes)
### P53.E.5 — Mexico IVA
### P53.E.6 — VAT invoice format per country
### P53.E.7 — Tax registration number capture + validation
### P53.E.8 — Reverse charge mechanism (EU B2B)
### P53.E.9 — Country-specific tax reports
### P53.E.10 — Per-country tax filing integration

## P53.F — Legal Entity + Operational (10 PRs)

### P53.F.1 — Legal entity per major region (US LLC, UK Ltd, Canada Corp, AU Pty)
### P53.F.2 — Terms of Service per country
### P53.F.3 — Local-language support per country
### P53.F.4 — Local time zone support
### P53.F.5 — Local business hours support
### P53.F.6 — Local holidays per country
### P53.F.7 — Local phone numbers (Twilio international)
### P53.F.8 — Local SMS sender IDs
### P53.F.9 — Local email TLDs (UK gov requires .gov.uk for govt)
### P53.F.10 — Local customer support hours

---

# P54 — COUNTRY LAUNCHES (60 PRs)

Initial 4 markets per memory hints: Canada, Mexico, UK, Australia.

## P54.A — Canada Launch (15 PRs)

### P54.A.1 — Canadian payment processor integration
Per memory SD-001: Payroc-only. Verify Payroc Canada coverage. Else add processor.

### P54.A.2 — Interac flow
### P54.A.3 — Canadian banking integration (Plaid Canada or alternative)
### P54.A.4 — CRA tax filing integration
### P54.A.5 — Canadian GST/HST/PST setup
### P54.A.6 — Canadian licensing (provincial cosmetology)
### P54.A.7 — Canadian privacy compliance (PIPEDA, Quebec Law 25)
### P54.A.8 — Bilingual UI (English + Canadian French)
### P54.A.9 — Canadian marketing site (kasseapp.ca or runmysalon.ca)
### P54.A.10 — Canadian customer support
### P54.A.11 — Canadian payroll integration
### P54.A.12 — Canadian workers comp
### P54.A.13 — Canadian holidays + business calendar
### P54.A.14 — Canadian pilot merchants (target Vancouver, Toronto)
### P54.A.15 — Canadian case studies

## P54.B — Mexico Launch (15 PRs)

### P54.B.1 — Mexican payment processor `[VERIFY Payroc MX coverage]`
### P54.B.2 — OXXO cash payments
### P54.B.3 — SPEI bank transfers
### P54.B.4 — CLABE bank account verification
### P54.B.5 — Mexican RFC tax ID validation
### P54.B.6 — CFDI electronic invoicing (mandatory in MX)
### P54.B.7 — SAT (Mexican IRS) integration
### P54.B.8 — Spanish (es-MX) UI (already from P0.H)
### P54.B.9 — Mexican marketing site (kasseapp.mx)
### P54.B.10 — Mexican customer support (es-MX)
### P54.B.11 — Mexican payroll (IMSS, INFONAVIT, ISR)
### P54.B.12 — Mexican holidays + calendar
### P54.B.13 — Beauty industry licensing (where applicable)
### P54.B.14 — Mexican pilot merchants (target CDMX, Monterrey, Guadalajara)
### P54.B.15 — Mexican case studies

## P54.C — UK Launch (15 PRs)

### P54.C.1 — UK payment processor `[VERIFY Payroc UK coverage]`
### P54.C.2 — UK bank account integration (Open Banking)
### P54.C.3 — Faster Payments network
### P54.C.4 — UK VAT compliance + MTD (Making Tax Digital)
### P54.C.5 — HMRC integration
### P54.C.6 — UK payroll (PAYE, RTI, NI contributions)
### P54.C.7 — UK Auto-Enrolment (workplace pensions)
### P54.C.8 — UK Data Protection Act compliance
### P54.C.9 — UK consumer protection law (CCRs, DSRs)
### P54.C.10 — British English UI (en-GB)
### P54.C.11 — UK marketing site (kasseapp.co.uk)
### P54.C.12 — UK customer support
### P54.C.13 — UK holidays + Bank Holidays calendar
### P54.C.14 — UK pilot merchants (target London, Manchester)
### P54.C.15 — UK case studies

## P54.D — Australia Launch (15 PRs)

### P54.D.1 — Australian payment processor
### P54.D.2 — BPAY integration
### P54.D.3 — POLi integration
### P54.D.4 — Australian bank account verification
### P54.D.5 — ATO (Australian Taxation Office) integration
### P54.D.6 — Australian GST compliance
### P54.D.7 — Australian payroll (Single Touch Payroll)
### P54.D.8 — Australian Superannuation (mandatory employer contribution)
### P54.D.9 — Australian Workers Compensation per state
### P54.D.10 — Australian Fair Work Act compliance
### P54.D.11 — Australian Privacy Act compliance
### P54.D.12 — en-AU UI
### P54.D.13 — Australian marketing site (kasseapp.com.au)
### P54.D.14 — Australian holidays + state-specific
### P54.D.15 — Australian pilot merchants (target Sydney, Melbourne, Brisbane)

---

# P55 — MULTI-REGION DEPLOYMENT (60 PRs)

## P55.A — Database Multi-Region (15 PRs)

### P55.A.1 — Read replica strategy
### P55.A.2 — Per-region primary databases (where data residency required)
### P55.A.3 — Cross-region replication
### P55.A.4 — Conflict resolution (last-write-wins by default)
### P55.A.5 — Latency monitoring per region
### P55.A.6 — Query routing (read from nearest replica)
### P55.A.7 — Failover automation
### P55.A.8 — Backup per region
### P55.A.9 — Cross-region restore drills
### P55.A.10 — Per-region encryption keys
### P55.A.11 — Data sovereignty enforcement (EU data stays in EU)
### P55.A.12 — Per-region audit logs
### P55.A.13 — Schema migrations across regions
### P55.A.14 — Per-region capacity planning
### P55.A.15 — Cost optimization per region

## P55.B — CDN + Edge Compute (10 PRs)

### P55.B.1 — Vercel Edge Network optimization
### P55.B.2 — Per-region edge functions
### P55.B.3 — Static asset CDN per region
### P55.B.4 — Image CDN per region
### P55.B.5 — Video CDN (for training content)
### P55.B.6 — Cache invalidation strategies
### P55.B.7 — Per-region rate limiting
### P55.B.8 — Per-region bot protection
### P55.B.9 — Per-region DDoS mitigation
### P55.B.10 — Edge analytics

## P55.C — Multi-Region Operations (15 PRs)

### P55.C.1 — Per-region monitoring dashboard
### P55.C.2 — Per-region incident response
### P55.C.3 — Per-region status page (status-eu.kasseapp.com)
### P55.C.4 — Per-region on-call rotation
### P55.C.5 — Per-region deployment pipeline
### P55.C.6 — Per-region feature flag overrides
### P55.C.7 — Per-region A/B testing
### P55.C.8 — Per-region SLA tracking
### P55.C.9 — Per-region performance benchmarks
### P55.C.10 — Per-region cost reporting
### P55.C.11 — Per-region customer success team
### P55.C.12 — Per-region partnerships
### P55.C.13 — Per-region marketing campaigns
### P55.C.14 — Per-region sales operations
### P55.C.15 — Per-region legal compliance team

## P55.D — Latency + Performance (10 PRs)

### P55.D.1 — Per-region p99 latency targets (<500ms)
### P55.D.2 — Per-region p95 latency targets (<200ms)
### P55.D.3 — Per-region p50 latency targets (<100ms)
### P55.D.4 — Real User Monitoring (RUM) per region
### P55.D.5 — Synthetic monitoring per region
### P55.D.6 — Performance budgets per page
### P55.D.7 — Bundle size optimization per region
### P55.D.8 — Image optimization per region
### P55.D.9 — Lazy loading per region
### P55.D.10 — Per-region performance regression tests

## P55.E — Disaster Recovery + Resilience (10 PRs)

### P55.E.1 — Multi-region active-active
### P55.E.2 — RTO < 1 hour per region
### P55.E.3 — RPO < 5 minutes per region
### P55.E.4 — Chaos engineering tests
### P55.E.5 — Region-loss drills (quarterly)
### P55.E.6 — Cross-region cutover automation
### P55.E.7 — DNS-based failover
### P55.E.8 — Per-region backup verification
### P55.E.9 — Per-region compliance attestations
### P55.E.10 — Per-region incident retrospectives

---

## PHASE 53-55 COMPLETION CRITERIA

- All 200 PRs merged
- Multi-currency + i18n live
- GDPR + per-country privacy compliance attested
- Canadian pilot live
- Mexican pilot live
- UK pilot live
- Australian pilot live
- Multi-region deployment functional
- KASSE_REAL_BUILD_ORDER.md updated

**After P53-55:** P56-P62 (warehouse, support, retention, day ops, integrations, exit readiness) can run.
