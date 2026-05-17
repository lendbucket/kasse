# KASSE COMPLIANCE
## Regulatory & Privacy Compliance — Complete Specification

**Version:** 1.0 | **Status:** PLANNING | **Owner:** Robert Reyna
**Authority:** SD-K-021 (50-state employment), SD-K-023 (PCI scope), SD-K-033 (WCAG), SD-K-039 (TDPSA/CCPA)

---

## 50-STATE EMPLOYMENT COMPLIANCE

**Authority:** SD-K-021

Kasse v1 supports employment compliance across all 50 US states. The architecture is 
state-aware from day one; state-specific content (rules, forms, accruals) is rolled 
out in priority order.

### Priority 1 (v1 launch)

Full compliance coverage:
- **Texas (TX)** — Home state, primary launch market
- **California (CA)** — Largest salon market, strictest regulations
- **Florida (FL)** — Significant salon density
- **New York (NY)** — High-revenue salon market
- **Illinois (IL)** — Midwest anchor

### Priority 2 (v1.x, within 6 months)

- New Jersey (NJ), Massachusetts (MA), Washington (WA), Pennsylvania (PA), 
  Georgia (GA), North Carolina (NC), Virginia (VA), Ohio (OH), Michigan (MI), 
  Arizona (AZ)

### Priority 3 (v1.x, within 12 months)

Remaining 35 states, prioritized by Kasse merchant concentration.

### What state-specific compliance covers

**Wage and Hour:**
- Minimum wage (federal, state, local)
- Overtime triggers (state-specific in CA: >8hr/day, not just >40hr/week)
- Tip credit rules
- Meal/rest break requirements (CA, OR, NV, WA)
- Predictive scheduling (where applicable: CA cities, NYC, OR, Philadelphia)

**Leave:**
- Sick leave accruals (CA, NY, IL, OR, WA, RI, NJ, MA, AZ, others)
- PTO carryover rules
- Family/medical leave compliance (state FMLA equivalents)

**Hiring:**
- New hire reporting forms (state-specific)
- Wage notice forms at hire (NY, CA, IL, NJ)
- Background check disclosure rules (ban-the-box states)

**Termination:**
- Final paycheck timing (CA: within 24 hours, others vary)
- Continuation of benefits (state COBRA equivalents)
- Reference policy compliance

**Classification:**
- W-2 vs 1099 vs booth rental (CA AB 5 + AB 2257 implications)
- Stylist classification audits (where applicable)

### How rollout works

State-aware data model from day one. State-specific rules engine evaluated per Staff 
record. New state content added as a config update — no schema migration required for 
each new state.

---

## PCI COMPLIANCE

**Authority:** SD-K-023

### v1: Pass-Through PCI

Kasse v1 operates with **pass-through PCI compliance**:

- Payroc Hosted Fields handles all cardholder data (CHD)
- Kasse servers never see raw card numbers, CVV, or full PAN
- Hosted Fields renders in an iframe; Kasse only sees tokens
- Merchant remains responsible for their own SAQ-A (Self-Assessment Questionnaire A)
- Kasse provides documentation showing reduced PCI scope

**Merchant responsibility:**
- Complete annual SAQ-A (we provide a template + walkthrough)
- Quarterly external vulnerability scan (we recommend a provider; not included)
- Annual review of payment processing flows

**Kasse responsibility:**
- Never store, transmit, or process raw cardholder data
- Maintain TLS 1.2+ on all endpoints
- Document our scope reduction so merchants can complete their SAQ-A

### v2: Managed PCI Compliance Level 1

ENTERPRISE-tier addon (12-18 months post-launch):

- Kasse achieves PCI DSS Level 1 certification
- Kasse manages merchant's quarterly ASV scans (Trustwave or equivalent)
- Kasse files SAQ-A on behalf of merchant
- PCI breach insurance included
- Cost to Kasse: $50-150k/year + 6-9 month certification project
- Premium addon: $79/month per merchant

---

## DATA PRIVACY

**Authority:** SD-K-039

### TDPSA (Texas Data Privacy and Security Act)

Effective July 2024 in Texas. Applies to any business with TX customers.

**v1 includes:**
- Privacy notice templates (TX-compliant)
- Right-to-delete request handling (customer asks salon for deletion → Kasse executes)
- Right-to-export request handling (customer asks for their data → Kasse generates 
  ZIP export)
- Consent management UI (clients opt in/out of marketing via single boolean — SD-K-031)
- 12-month look-back: customer can request all data from past 12 months

### CCPA (California Consumer Privacy Act)

Applies to any business with CA customers.

**v1 includes:**
- Privacy notice templates (CA-compliant)
- "Do Not Sell My Personal Information" link
- Right-to-know request handling
- Right-to-delete request handling  
- Right-to-correct request handling (CPRA addition)
- Cookie consent management on customer-facing surfaces

### Implementation

All client data deletion/export requests flow through a dedicated 
`/admin/data-requests` portal. Salon owner sees pending requests + can fulfill them 
with one click. System validates request scope (only that client's data, not others), 
generates audit log, and notifies the requester upon completion.

---

## HIPAA (Med Spa)

**Authority:** SD-K-008

**v2 only.** HIPAA compliance is required for med spa vertical (botox, fillers, 
medical procedures). Kasse v1 explicitly excludes the med spa vertical from HIPAA-
covered operations.

If a merchant onboards as med spa in v1:
- Standard salon features available
- Medical notes flagged as "HIPAA-pending — not for medical use until v2"
- Migration path documented for v2 HIPAA mode

**v2 HIPAA features:**
- BAA (Business Associate Agreement) signed with Anthropic, OpenAI, Supabase, Vercel
- AES-256 encryption at column level for HIPAA-adjacent fields (SD-K-008)
- HIPAA audit log with longer retention (7 years post-record)
- HIPAA-specific access controls (minimum necessary rule)
- Breach notification workflow

---

## ACCESSIBILITY (WCAG 2.1 AA)

**Authority:** SD-K-033

All Kasse v1 surfaces meet WCAG 2.1 AA from day one.

### Standards

- **Color contrast:** 4.5:1 minimum for normal text, 3:1 for large text
- **Keyboard navigation:** All interactive elements reachable via Tab
- **Focus indicators:** Visible focus rings on all focusable elements
- **Touch targets:** 44px minimum (per Apple HIG + WCAG)
- **ARIA labels:** All buttons, links, form fields properly labeled
- **Screen reader support:** Semantic HTML, proper heading hierarchy
- **Forms:** Labels associated with inputs, error messages programmatically linked
- **Images:** Alt text on all informative images
- **Color independence:** No information conveyed by color alone
- **Animation:** Respect `prefers-reduced-motion`

### Testing

- Axe-core automated scans in CI pipeline
- Manual screen reader testing (VoiceOver + NVDA) before each major release
- Lighthouse accessibility score: 95+ required for production deploys

---

## SECURITY

### Encryption

- **At rest:** AES-256 for sensitive columns (SSN, formula history, medical notes)
- **In transit:** TLS 1.2+ on all endpoints
- **Application:** Bcrypt password hashing (cost factor 12)

### Authentication

- Email + password (default)
- 2FA optional for all users (TOTP authenticator apps)
- Session tokens via NextAuth JWT
- 24-hour session expiry (configurable per merchant via Settings)

### Row-Level Security (RLS)

All multi-tenant tables enforce RLS at the database level (SD-K-017):
- Tenant context set per request via `app_set_tenant(orgId)`
- Every query scoped to the active organization
- Audit log captures any RLS bypass (superadmin operations)

### Audit Logging

Every state-modifying operation logged with:
- Actor (user ID or AI agent identity)
- Action (semantic action name)
- Resource (entity type + ID)
- Before/after state (where applicable)
- Timestamp + IP + user agent
- 7-year retention (auto-archived to cold storage after 18 months)

---

## REFERENCES

- **Strategic decisions:** SD-K-008, SD-K-017, SD-K-021, SD-K-023, SD-K-031, 
  SD-K-033, SD-K-039
- **HCM details:** docs/KASSE_HCM.md (new in this PR)
- **RLS implementation:** docs/RLS_AUDIT.md
- **Engine boundary:** docs/KASSE_ENGINE_BOUNDARY.md
