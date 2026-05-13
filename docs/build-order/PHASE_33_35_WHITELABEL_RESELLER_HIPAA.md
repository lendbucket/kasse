# PHASE 33-35 — WHITE-LABEL + RESELLER + MED SPA HIPAA FULL

**Scope:** White-Label Deployment System (P33, 30 PRs), Reseller Program (P34, 20 PRs, ATTORNEY-gated), Med Spa HIPAA Full (P35, 50 PRs).
**Total PRs:** 100
**Depends on:** P30 (RunMySalon establishes distribution patterns), P0.B (theme system), P26.B (med spa initial).
**Gates:** P34 requires attorney review per OQ-006 (FTC Business Opportunity Rule, state laws, money transmitter licensing).
**Reference docs:** KASSE_STRATEGIC_DECISIONS.md (white-label scope), KASSE_OPEN_QUESTIONS.md OQ-006 + OQ-009, KASSE_VERTICALS_EXPANDED.md (Med Spa full spec).

---

# P33 — WHITE-LABEL DEPLOYMENT SYSTEM (30 PRs)

Per OQ-009 (App Store strategy). NOT true white-label per memory — all merchants legally Reyna Pay under single MID. Light theming + subdomain routing.

## P33.A — Multi-Tenancy + Subdomain Routing (10 PRs)

### P33.A.1 — Schema: WhiteLabelDeployment
```prisma
model WhiteLabelDeployment {
  id              String   @id @default(cuid())
  ownerOrgId      String   // resellers' org
  brandName       String
  subdomain       String   @unique  // "salonpro.kasseapp.com"
  customDomain    String?  @unique  // "app.salonpro.com"
  themeConfig     Json
  emailConfig     Json
  legalConfig     Json
  isActive        Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

### P33.A.2 — Middleware subdomain detection
Files: `middleware.ts` (extend)
Resolve subdomain → look up WhiteLabelDeployment → inject brand into request.

### P33.A.3 — Custom domain CNAME instructions
UI shows: "Add CNAME app.yourbrand.com → cname.kasseapp.com."

### P33.A.4 — Custom domain verification
DNS check. Status: PENDING → ACTIVE.

### P33.A.5 — SSL provisioning
Auto-provision via Vercel.

### P33.A.6 — Per-deployment env config
SMTP sender, SMS sender, support email separate per deployment.

### P33.A.7 — Per-deployment plan tier defaults
Reseller bundles plans.

### P33.A.8 — Per-deployment addon catalog
Reseller curates which addons available.

### P33.A.9 — Deployment admin portal
Files: `app/dashboard/white-label/page.tsx`
Reseller manages their deployment.

### P33.A.10 — Cross-deployment user isolation
User in deployment A cannot see deployment B's data.

## P33.B — Theme + Branding (10 PRs)

### P33.B.1 — Full theme override (P0.B foundation)
Reseller customizes all colors, fonts, logos.

### P33.B.2 — Logo upload (light + dark variants)
### P33.B.3 — Custom favicon
### P33.B.4 — Custom email templates per deployment
Override system templates with custom HTML.

### P33.B.5 — Custom SMS templates per deployment
### P33.B.6 — Custom support email + phone
### P33.B.7 — Custom legal docs (privacy, terms, DPA)
Auto-generated from template + reseller customizations.

### P33.B.8 — Custom marketing site content
Per-deployment marketing site (optional).

### P33.B.9 — Powered By footer (required per memory: "Powered by Reyna Pay" stays)
### P33.B.10 — App Store deployment (decision per OQ-009)
Option: separate apps per reseller (high overhead). Option: Kasse "shell" app branded at login. Decision pending.

## P33.C — Reseller-Managed Merchant Onboarding (10 PRs)

### P33.C.1 — Reseller invites merchant to their deployment
Pre-filled signup link with WhiteLabelDeployment context.

### P33.C.2 — Merchant signs up under deployment
Org auto-flagged with deployment.

### P33.C.3 — Reseller has master view of their merchants
Subset of Master Portal scoped to deployment.

### P33.C.4 — Reseller can impersonate own merchants
Audit-logged.

### P33.C.5 — Reseller billing
Reseller charged per-merchant or revenue-share. Configurable.

### P33.C.6 — Reseller commission ledger
Track reseller's earnings.

### P33.C.7 — Reseller payout
Monthly via Checkbook.io.

### P33.C.8 — Reseller dashboard
Files: `app/reseller/dashboard/page.tsx`
Merchant list, MRR, commission earned, churn risk.

### P33.C.9 — Reseller analytics
Cohort retention, expansion revenue.

### P33.C.10 — Reseller training materials
Videos, sell sheets, demos.

---

# P34 — RESELLER PROGRAM (20 PRs) `[GATED: ATTORNEY per OQ-006]`

Structure: 25% of Robert's 55% commission per memory.

## P34.A — Legal Foundation (5 PRs) `[ATTORNEY-GATED]`

### P34.A.1 — Reseller Agreement template `[ATTORNEY review]`
Per OQ-006: FTC Business Opportunity Rule, state laws, money transmitter licensing concerns.

### P34.A.2 — State-by-state legality matrix
Some states require seller-assisted business opportunity disclosures.

### P34.A.3 — Commission structure documentation
25% of 55% per memory = 13.75% effective to reseller.

### P34.A.4 — Tax classification (1099 vs employee)
Independent contractor by default. State variation.

### P34.A.5 — Termination + non-compete language

## P34.B — Reseller Onboarding (5 PRs)

### P34.B.1 — Reseller application
Files: `app/(public)/reseller/apply/page.tsx`
Background, market focus, target customer count.

### P34.B.2 — Reseller approval workflow
SUPERADMIN review. Background check optional.

### P34.B.3 — Reseller agreement e-sign
### P34.B.4 — Reseller training certification
Required modules. Quiz.

### P34.B.5 — Reseller subscription billing
$499/mo per KASSE_TIERS.md.

## P34.C — Reseller Tools (10 PRs)

### P34.C.1 — Reseller-branded marketing site (subset of P33.B.8)
### P34.C.2 — Sub-account creation for reseller's customers
### P34.C.3 — Sub-account billing (reseller pays Kasse, charges customer)
### P34.C.4 — Reseller dashboard (cross-reference P33.C.8)
### P34.C.5 — Sales materials library
### P34.C.6 — Demo environment for sales calls
### P34.C.7 — Lead tracking CRM (basic)
### P34.C.8 — Commission ledger + payout history
### P34.C.9 — Reseller community forum (when P63 ships)
### P34.C.10 — Reseller leaderboard / awards

---

# P35 — MED SPA HIPAA FULL (50 PRs)

Per VERTICAL 5. Builds on P26.B initial.

## P35.A — Full HIPAA Compliance Foundation (10 PRs)

### P35.A.1 — HIPAA risk assessment
Documented per HHS standards.

### P35.A.2 — HIPAA Security Officer designation
Robert or designee. On record.

### P35.A.3 — HIPAA Privacy Officer designation
### P35.A.4 — Workforce training program
All staff complete HIPAA training. Certification stored.

### P35.A.5 — Sanction policy for HIPAA violations
Documented + signed.

### P35.A.6 — Information access management
Role-based access, audit trail.

### P35.A.7 — Security awareness training annual
Recurring requirement.

### P35.A.8 — Contingency plan
Backup, disaster recovery, emergency mode operation.

### P35.A.9 — Periodic security evaluation
Annual review.

### P35.A.10 — BAA management
Files: `app/dashboard/compliance/baa/page.tsx`
Send/receive BAAs with vendors + clients (where required).

## P35.B — PHI Storage + Encryption (10 PRs)

### P35.B.1 — Column-level KMS encryption for PHI
Notes, diagnoses, treatment details, photos, intake responses.

### P35.B.2 — Envelope encryption pattern
Per-org encryption key, encrypted by master KMS key.

### P35.B.3 — PHI access logging
Every read + write of PHI logged.

### P35.B.4 — PHI export controls
Encrypted export only. Audit-logged.

### P35.B.5 — PHI deletion (right to amend)
HIPAA-compliant deletion workflow.

### P35.B.6 — PHI backup encryption
Backups + transit encrypted.

### P35.B.7 — Workforce session timeouts
15-minute inactivity per HIPAA Security Rule guidance.

### P35.B.8 — Workforce 2FA mandatory in HIPAA mode
### P35.B.9 — IP allowlisting per workforce member (optional, configurable)
### P35.B.10 — Mobile device management (MDM) integration
For organization-owned devices.

## P35.C — Treatment Planning + Documentation (10 PRs)

### P35.C.1 — Treatment plan builder
Multi-session courses.

### P35.C.2 — Per-treatment informed consent (vertical-specific templates)
Botox, fillers, laser, chemical peels, PRP, etc.

### P35.C.3 — Pre-treatment intake (medical history)
Allergies, medications, prior procedures, photos.

### P35.C.4 — Pre-treatment photos (required for many treatments)
### P35.C.5 — Treatment progress notes
Per-session SOAP-format notes.

### P35.C.6 — Post-treatment photos
### P35.C.7 — Aftercare instructions (auto-sent)
### P35.C.8 — Follow-up scheduling automation
Per protocol (e.g., Botox follow-up 14 days post-injection).

### P35.C.9 — Treatment outcome tracking
Rating, photos, side effects.

### P35.C.10 — Multi-provider charting
Multiple providers can update one patient's chart concurrently.

## P35.D — Provider Credentials + Supervision (10 PRs)

### P35.D.1 — Provider credentialing
MD, DO, NP, PA, RN, Aesthetician. State-specific scopes.

### P35.D.2 — License upload + verification (state-specific)
### P35.D.3 — Malpractice insurance tracking
### P35.D.4 — DEA registration (if controlled substances)
### P35.D.5 — Supervisor relationship tracking
NP/PA needs supervising MD. Tracked.

### P35.D.6 — Good Faith Exam tracking (state-mandatory in many)
### P35.D.7 — Standing orders documentation
### P35.D.8 — Provider scope-of-practice enforcement
Aesthetician cannot perform injections.

### P35.D.9 — Provider productivity reports
Procedures performed, revenue generated.

### P35.D.10 — CE tracking (continuing education)
Per state requirements.

## P35.E — Injectable Inventory + Lot Tracking (5 PRs)

### P35.E.1 — Schema: Injectable, LotNumber
Per memory: P26.B.14 basic, P35 deepens.

### P35.E.2 — Per-injection lot capture
Required field at treatment logging.

### P35.E.3 — Lot expiry alerts (30/14/7 days)
### P35.E.4 — Recall management
If lot recalled, identify affected patients.

### P35.E.5 — Inventory reconciliation
Used + wasted + on-hand = received.

## P35.F — Interactive Injection Mapping (5 PRs)

Per P26.B.16 basic, P35 deepens.

### P35.F.1 — Full body diagram (front + back)
SVG-based, clickable zones.

### P35.F.2 — Annotation per injection (product, units, depth)
### P35.F.3 — Photo overlay capability
### P35.F.4 — Treatment history overlay
See past injection sites on same patient.

### P35.F.5 — Export to PDF for patient records

---

## PHASE 33-35 COMPLETION CRITERIA

- All 100 PRs merged
- White-label deployment system functional (proof: deploy "test brand" at testbrand.kasseapp.com)
- Reseller program legal review complete (`[ATTORNEY signoff received]`)
- 5+ resellers signed (post-attorney)
- Med Spa pilot with full HIPAA mode operational
- KASSE_REAL_BUILD_ORDER.md updated

**After P33-35:** P36-P45 (30+ verticals expansion) can run.
