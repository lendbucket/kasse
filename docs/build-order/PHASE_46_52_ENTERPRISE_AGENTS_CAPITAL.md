# PHASE 46-52 — ENTERPRISE + AGENTS + CAPITAL

**Scope:** Enterprise SSO (P46, 40 PRs), SOC 2 Type II (P47, 60 PRs, SOC2-gated), Advanced Security (P48, 60 PRs), Full HIPAA Audit + BAA (P49, 40 PRs), AI Agent Ecosystem (P50, 120 PRs), Voice-Native Commerce (P51, 80 PRs), Kasse Capital Lending (P52, 80 PRs, ATTORNEY-gated).
**Total PRs:** 480
**Depends on:** P0-P22 foundation, P30-P32 developer + agent infrastructure.
**Gates:** P47 needs 6-12 month observation window. P52 needs counsel review per OQ-010.
**Reference docs:** KASSE_OPEN_QUESTIONS.md (OQ-010 lending license), KASSE_STRATEGIC_DECISIONS.md, KASSE_TIERS.md.

---

# P46 — ENTERPRISE SSO (40 PRs)

## P46.A — SAML 2.0 (10 PRs)

### P46.A.1 — SAML Service Provider implementation
Files: `lib/auth/saml/sp.ts`
SP-initiated + IdP-initiated flows.

### P46.A.2 — Per-org IdP metadata upload
### P46.A.3 — IdP metadata URL fetching (auto-refresh)
### P46.A.4 — Assertion validation (signature, audience, conditions)
### P46.A.5 — Attribute mapping (email, name, role, custom claims)
### P46.A.6 — Group → Role mapping
### P46.A.7 — Just-in-Time provisioning
### P46.A.8 — Session management
### P46.A.9 — Single Logout (SLO)
### P46.A.10 — SAML test mode

## P46.B — OIDC (10 PRs)

### P46.B.1 — OIDC client implementation
### P46.B.2 — Authorization code flow with PKCE
### P46.B.3 — Discovery endpoint integration
### P46.B.4 — Token validation
### P46.B.5 — Userinfo endpoint integration
### P46.B.6 — Refresh token handling
### P46.B.7 — Claim → User attribute mapping
### P46.B.8 — Multi-provider support (Okta, Auth0, AzureAD, Google Workspace)
### P46.B.9 — Provider auto-detection by domain
### P46.B.10 — OIDC test mode

## P46.C — SCIM v2 (10 PRs)

### P46.C.1 — SCIM v2 endpoint scaffold (`/scim/v2/`)
### P46.C.2 — Users resource (CRUD)
### P46.C.3 — Groups resource (CRUD)
### P46.C.4 — Filter syntax support
### P46.C.5 — Pagination
### P46.C.6 — PATCH operations (RFC 6902)
### P46.C.7 — Schema discovery endpoints
### P46.C.8 — Service Provider Config endpoint
### P46.C.9 — Bearer token auth for SCIM
### P46.C.10 — SCIM connector certifications (Okta, AzureAD)

## P46.D — Active Directory + Enterprise Polish (10 PRs)

### P46.D.1 — LDAP/AD direct sync option
### P46.D.2 — AD group → Kasse role mapping UI
### P46.D.3 — Multi-domain support
### P46.D.4 — Federated identity (multiple IdPs per org)
### P46.D.5 — Conditional access policies
### P46.D.6 — Device trust (managed device required)
### P46.D.7 — IP allowlist per identity
### P46.D.8 — Session timeout policies per org
### P46.D.9 — Audit log of SSO events
### P46.D.10 — Enterprise SSO addon ($99/mo per org)

---

# P47 — SOC 2 TYPE II PREP + AUDIT (60 PRs) `[GATED: SOC2_AUDIT]`

6-12 month observation window. Most work parallel-runnable; final attestation gated.

## P47.A — Control Framework Setup (15 PRs)

### P47.A.1 — Trust Service Criteria (TSC) mapping
Security, Availability, Confidentiality, Processing Integrity, Privacy.

### P47.A.2 — Control catalog (40-60 controls typical)
### P47.A.3 — Vanta or Drata integration `[VERIFY vendor]`
Continuous monitoring platform.

### P47.A.4 — Asset inventory (servers, databases, services)
### P47.A.5 — Risk assessment process
### P47.A.6 — Risk register
### P47.A.7 — Vendor risk assessment
### P47.A.8 — Change management process
### P47.A.9 — Incident response playbook
### P47.A.10 — Business continuity plan
### P47.A.11 — Disaster recovery plan
### P47.A.12 — Backup + recovery tested quarterly
### P47.A.13 — Penetration testing annual
### P47.A.14 — Vulnerability management program
### P47.A.15 — Code review process documented

## P47.B — Logging + Monitoring (10 PRs)

### P47.B.1 — Centralized log aggregation
### P47.B.2 — Audit log retention (1+ year per TSC)
### P47.B.3 — Access log retention
### P47.B.4 — Failed login monitoring
### P47.B.5 — Privileged access monitoring
### P47.B.6 — Configuration change monitoring
### P47.B.7 — Alert on suspicious patterns
### P47.B.8 — Log integrity (immutable / tamper-evident)
### P47.B.9 — Regular log review (weekly cadence)
### P47.B.10 — Log review documentation

## P47.C — Access Controls (10 PRs)

### P47.C.1 — Least privilege enforcement
### P47.C.2 — Quarterly access reviews
### P47.C.3 — Offboarding checklist (immediate revoke)
### P47.C.4 — Strong password policy
### P47.C.5 — MFA mandatory for production access
### P47.C.6 — SSH key rotation
### P47.C.7 — Privileged access just-in-time
### P47.C.8 — Service account inventory
### P47.C.9 — API key rotation policy
### P47.C.10 — Workstation security baseline

## P47.D — HR + Vendor (10 PRs)

### P47.D.1 — Background check policy for new hires
### P47.D.2 — Confidentiality agreement (signed)
### P47.D.3 — Security training (annual)
### P47.D.4 — Acceptable use policy
### P47.D.5 — BYOD policy
### P47.D.6 — Vendor onboarding checklist (security review)
### P47.D.7 — Vendor BAAs / DPAs in place
### P47.D.8 — Vendor SOC 2 reports collected
### P47.D.9 — Vendor risk reassessment annual
### P47.D.10 — Subcontractor flow-down requirements

## P47.E — Encryption + Data Protection (10 PRs)

### P47.E.1 — Encryption at rest (database, S3)
### P47.E.2 — Encryption in transit (TLS 1.2+)
### P47.E.3 — Key management (AWS KMS or similar)
### P47.E.4 — Key rotation policy
### P47.E.5 — Data classification policy
### P47.E.6 — Data retention schedules
### P47.E.7 — Data deletion processes
### P47.E.8 — Secure development practices
### P47.E.9 — Secrets management (no hardcoded creds)
### P47.E.10 — Production data not in non-prod environments

## P47.F — Audit Engagement (5 PRs) `[SOC2_AUDIT-GATED]`

### P47.F.1 — Auditor selection
### P47.F.2 — Type II observation period start (6-12 months)
### P47.F.3 — Evidence collection automation
### P47.F.4 — Quarterly checkpoint with auditor
### P47.F.5 — Final attestation report + customer-facing summary

---

# P48 — ADVANCED SECURITY (60 PRs)

## P48.A — Bug Bounty + Pen Testing (10 PRs)

### P48.A.1 — Bug bounty program setup (HackerOne or Bugcrowd)
### P48.A.2 — Scope definition
### P48.A.3 — Severity → payout matrix
### P48.A.4 — Triage workflow
### P48.A.5 — Public security.txt
### P48.A.6 — Vulnerability disclosure policy (VDP)
### P48.A.7 — Annual external pen test
### P48.A.8 — Internal pen test (red team) annual
### P48.A.9 — Pen test remediation tracking
### P48.A.10 — Pen test report customer-facing summary

## P48.B — KMS + Key Management Deep (10 PRs)

### P48.B.1 — AWS KMS integration (per-org CMK)
### P48.B.2 — Envelope encryption pattern (data key per record)
### P48.B.3 — Per-tenant key isolation
### P48.B.4 — Customer-managed keys (BYOK) for ENTERPRISE
### P48.B.5 — Key rotation automation (90 days default)
### P48.B.6 — Key access audit log
### P48.B.7 — HSM-backed keys
### P48.B.8 — Key escrow for regulatory access
### P48.B.9 — Encryption performance optimization
### P48.B.10 — Key migration tools

## P48.C — DR/BCP (10 PRs)

### P48.C.1 — Multi-region failover
### P48.C.2 — Database replication (read replicas)
### P48.C.3 — Point-in-time recovery tested
### P48.C.4 — RTO/RPO documented
### P48.C.5 — DR runbook
### P48.C.6 — Quarterly DR drills
### P48.C.7 — Customer communication plan during outage
### P48.C.8 — Status page integration
### P48.C.9 — Backup encryption + offsite
### P48.C.10 — Data integrity checks (checksums)

## P48.D — GDPR + CCPA + Privacy Acts (15 PRs)

### P48.D.1 — Data subject access request (DSAR) workflow
### P48.D.2 — Data portability export
### P48.D.3 — Right to deletion workflow
### P48.D.4 — Right to amendment workflow
### P48.D.5 — Data processing record (Art. 30 GDPR)
### P48.D.6 — Consent management
### P48.D.7 — Cookie consent (GDPR-compliant banners)
### P48.D.8 — Privacy by design documentation
### P48.D.9 — Data Protection Impact Assessment (DPIA)
### P48.D.10 — Cross-border data transfer (SCCs)
### P48.D.11 — CCPA compliance (CA residents)
### P48.D.12 — Texas Privacy Act compliance (TX-DPDP, effective 2026)
### P48.D.13 — Virginia, Colorado, Utah, Connecticut privacy laws
### P48.D.14 — Per-state opt-out mechanisms
### P48.D.15 — Privacy policy generator (per-jurisdiction)

## P48.E — Application Security (15 PRs)

### P48.E.1 — Content Security Policy (CSP)
### P48.E.2 — HSTS + secure cookies
### P48.E.3 — Subresource Integrity (SRI)
### P48.E.4 — Rate limiting expanded (per-endpoint)
### P48.E.5 — DDoS protection (Cloudflare)
### P48.E.6 — Bot detection
### P48.E.7 — Input validation library (Zod-based)
### P48.E.8 — Output sanitization (XSS prevention)
### P48.E.9 — SQL injection protection (parameterized queries — Prisma default)
### P48.E.10 — CSRF protection
### P48.E.11 — Open redirect prevention (verify-email per memory backlog)
### P48.E.12 — Dependency vulnerability scanning (Dependabot)
### P48.E.13 — Container image scanning
### P48.E.14 — Static code analysis (CodeQL)
### P48.E.15 — Dynamic application security testing (DAST)

---

# P49 — FULL HIPAA AUDIT + BAA (40 PRs)

Beyond P35 (med spa specific). Org-wide HIPAA compliance for all customers handling PHI.

## P49.A — Organization-Wide HIPAA Mode (10 PRs)

### P49.A.1 — Org-level HIPAA flag (in addition to vertical)
### P49.A.2 — HIPAA mode enforcement (column encryption everywhere PHI possible)
### P49.A.3 — BAA template (customer-facing, owner signs to enable HIPAA mode)
### P49.A.4 — BAA template (vendor-facing, sent to Twilio, Resend, Vercel, Supabase)
### P49.A.5 — Vendor BAA collection workflow
### P49.A.6 — Vendor BAA library (signed copies stored)
### P49.A.7 — Customer BAA library
### P49.A.8 — BAA expiry tracking + renewal
### P49.A.9 — Workforce HIPAA training tracker
### P49.A.10 — Workforce sanction policy enforcement

## P49.B — Risk Analysis + Risk Management (10 PRs)

### P49.B.1 — Risk analysis tool
### P49.B.2 — Risk register
### P49.B.3 — Risk mitigation tracking
### P49.B.4 — Annual risk reassessment
### P49.B.5 — Risk-based access control adjustments
### P49.B.6 — PHI inventory
### P49.B.7 — Data flow mapping (where PHI lives + travels)
### P49.B.8 — System inventory
### P49.B.9 — Asset disposal procedures
### P49.B.10 — Risk dashboard

## P49.C — Workforce + Physical Safeguards (10 PRs)

### P49.C.1 — Background check requirement
### P49.C.2 — Access authorization process
### P49.C.3 — Workforce clearance procedures
### P49.C.4 — Termination procedures (access revocation)
### P49.C.5 — Information access management
### P49.C.6 — Workforce security training
### P49.C.7 — Periodic security reminders
### P49.C.8 — Physical safeguards (server room access — applies to data centers)
### P49.C.9 — Workstation security
### P49.C.10 — Device + media controls

## P49.D — Audit + Incident Response (10 PRs)

### P49.D.1 — Audit log completeness for PHI
### P49.D.2 — Audit log review process
### P49.D.3 — Anomaly detection
### P49.D.4 — Breach notification process (60-day rule)
### P49.D.5 — Notice template for affected individuals
### P49.D.6 — Notice template for HHS
### P49.D.7 — Notice template for media (500+ affected)
### P49.D.8 — Incident classification
### P49.D.9 — Post-incident root cause analysis
### P49.D.10 — Annual HIPAA compliance audit (external)

---

# P50 — AI AGENT ECOSYSTEM (120 PRs)

Per memory + EMPIRE_ARCHITECTURE.md: agent-native from day one. P32 was v1 marketplace. P50 is full agent ecosystem.

## P50.A — Reyna AI Foundation (15 PRs)

### P50.A.1 — Reyna AI brand + UX framework
### P50.A.2 — Per-org Reyna AI assistant (private to org)
### P50.A.3 — Conversational context per merchant
### P50.A.4 — Tool calling infrastructure (extends P32 MCP)
### P50.A.5 — Multi-turn conversation persistence
### P50.A.6 — Reyna AI cost tracking per merchant
### P50.A.7 — Reyna AI rate limiting
### P50.A.8 — Reyna AI safety filters
### P50.A.9 — Reyna AI escalation to human
### P50.A.10 — Per-vertical Reyna AI persona
### P50.A.11 — Multi-modal (text, voice, vision)
### P50.A.12 — Memory across sessions
### P50.A.13 — Reyna AI in every screen (sidebar chat)
### P50.A.14 — Reyna AI proactive suggestions (insights)
### P50.A.15 — Reyna AI feedback loop (thumbs up/down per response)

## P50.B — Operations Agents (10 PRs)

### P50.B.1 — Schedule Optimizer Agent (rearrange day for max efficiency)
### P50.B.2 — Inventory Reorder Agent (auto-order when low)
### P50.B.3 — Pricing Optimization Agent (suggest price changes — per Nisha N-7)
### P50.B.4 — Staff Scheduling Agent (build optimal weekly schedule)
### P50.B.5 — Forecasting Agent (next week / month projections)
### P50.B.6 — No-Show Risk Agent (proactive interventions per P13.G)
### P50.B.7 — Lapsed Client Outreach Agent (Win-back per P16.A)
### P50.B.8 — Daily Briefing Agent (morning summary email)
### P50.B.9 — End-of-Day Recap Agent
### P50.B.10 — Weekly Strategy Agent

## P50.C — Customer-Facing Agents (15 PRs)

### P50.C.1 — Booking Agent (handles inbound booking requests)
### P50.C.2 — Rescheduling Agent
### P50.C.3 — FAQ Agent
### P50.C.4 — Product Recommendation Agent (retail)
### P50.C.5 — Service Recommendation Agent
### P50.C.6 — Style Consultation Agent (salon)
### P50.C.7 — Pre-Treatment Concierge Agent (med spa)
### P50.C.8 — Aftercare Follow-up Agent
### P50.C.9 — Loyalty Status Agent
### P50.C.10 — Gift Card Purchase Agent
### P50.C.11 — Review Response Agent (drafts replies)
### P50.C.12 — Complaint Resolution Agent
### P50.C.13 — Payment Reminder Agent (overdue balances)
### P50.C.14 — Birthday Greeting Agent (personalized per client)
### P50.C.15 — Post-Service Survey Agent

## P50.D — Marketing Agents (10 PRs)

### P50.D.1 — Content Generation Agent (social posts)
### P50.D.2 — Image Generation Agent (DALL-E / Midjourney integration)
### P50.D.3 — Caption Writing Agent
### P50.D.4 — Hashtag Suggestion Agent
### P50.D.5 — Best Posting Time Agent
### P50.D.6 — Campaign Builder Agent (per Nisha N-13)
### P50.D.7 — Segment Suggestion Agent
### P50.D.8 — Subject Line Optimizer
### P50.D.9 — A/B Test Recommendation Agent
### P50.D.10 — Influencer Identification Agent

## P50.E — Financial Agents (10 PRs)

### P50.E.1 — Bookkeeping Agent (categorize transactions)
### P50.E.2 — Cash Flow Forecasting Agent
### P50.E.3 — Tax Prep Agent
### P50.E.4 — Invoice Creation Agent
### P50.E.5 — Bill Pay Agent
### P50.E.6 — Expense Anomaly Agent
### P50.E.7 — Profit Margin Coach Agent
### P50.E.8 — Pricing Strategy Agent
### P50.E.9 — Budget Planning Agent
### P50.E.10 — Owner's Paycheck Agent

## P50.F — Human Resources Agents (10 PRs)

### P50.F.1 — Hiring Agent (job description, screening questions)
### P50.F.2 — Interview Prep Agent
### P50.F.3 — Onboarding Agent (new hire walkthrough)
### P50.F.4 — Performance Review Agent
### P50.F.5 — Coaching Agent (per-stylist development)
### P50.F.6 — Conflict Resolution Agent
### P50.F.7 — Policy Q&A Agent
### P50.F.8 — Training Curriculum Agent
### P50.F.9 — Compensation Planning Agent
### P50.F.10 — Termination Prep Agent

## P50.G — Compliance + Legal Agents (10 PRs)

### P50.G.1 — License Renewal Reminder Agent
### P50.G.2 — Compliance Audit Self-Check Agent
### P50.G.3 — Contract Review Agent
### P50.G.4 — Privacy Policy Generator Agent
### P50.G.5 — Employment Law Q&A Agent
### P50.G.6 — Tax Filing Calendar Agent
### P50.G.7 — Health Code Compliance Agent
### P50.G.8 — Insurance Coverage Review Agent
### P50.G.9 — Permit Tracker Agent
### P50.G.10 — Regulatory Update Agent

## P50.H — Empire-Wide Agents (10 PRs)

### P50.H.1 — Cross-Merchant Benchmarking Agent
### P50.H.2 — Vertical Trend Detection Agent
### P50.H.3 — Network Health Monitoring Agent
### P50.H.4 — Outlier Detection Agent
### P50.H.5 — Acquisition Opportunity Agent
### P50.H.6 — Geographic Expansion Agent
### P50.H.7 — Competitive Intelligence Agent
### P50.H.8 — Product Feature Suggestion Agent (from merchant usage)
### P50.H.9 — Pricing Power Analysis Agent
### P50.H.10 — Empire Strategist Agent (for Robert)

## P50.I — Agent Marketplace + Building Block (15 PRs)

### P50.I.1 — Custom Agent Builder UI (no-code)
### P50.I.2 — Agent template library
### P50.I.3 — Agent triggers (time-based, event-based, manual)
### P50.I.4 — Agent permissions (which tools each can call)
### P50.I.5 — Agent test mode (sandbox)
### P50.I.6 — Agent versioning
### P50.I.7 — Agent activity log
### P50.I.8 — Agent A/B testing
### P50.I.9 — Agent ROI tracking
### P50.I.10 — Agent sharing across orgs (with consent)
### P50.I.11 — Public agent marketplace (paid + free)
### P50.I.12 — Agent monetization for developers
### P50.I.13 — Agent reviews + ratings
### P50.I.14 — Agent certification (security + quality review)
### P50.I.15 — Agent SDK for developers

## P50.J — Reyna AI Subscription (5 PRs)

### P50.J.1 — Reyna AI usage tiers
### P50.J.2 — Per-agent pricing model
### P50.J.3 — Token-based billing (transparent)
### P50.J.4 — Plan-included agents (FREE, STARTER tiers limited)
### P50.J.5 — Reyna AI marketplace transaction fee (30%)

## P50.K — Operations + Safety (10 PRs)

### P50.K.1 — Agent action audit log
### P50.K.2 — Agent rollback (reverse agent actions within 24h)
### P50.K.3 — Agent budget caps per merchant
### P50.K.4 — Agent emergency stop button
### P50.K.5 — Agent abuse detection
### P50.K.6 — Agent safety training (prompt injection defenses)
### P50.K.7 — Agent guardrails (cannot transfer funds without explicit confirmation)
### P50.K.8 — Multi-agent orchestration safety
### P50.K.9 — Agent transparency (every action explained)
### P50.K.10 — Agent dispute resolution (when AI does something owner contests)

---

# P51 — VOICE-NATIVE COMMERCE (80 PRs)

Beyond P15 AI Receptionist. Voice commerce across Alexa, Google Home, Siri, WhatsApp, Phone.

## P51.A — Alexa Skill (15 PRs)

### P51.A.1 — Alexa skill scaffold
### P51.A.2 — Account linking to Kasse
### P51.A.3 — Intent definitions (Book, Reschedule, Status, Hours)
### P51.A.4 — Sample utterances
### P51.A.5 — Slot types (services, staff, dates)
### P51.A.6 — Booking flow conversation
### P51.A.7 — Rescheduling flow
### P51.A.8 — Cancellation flow
### P51.A.9 — Status query ("when is my appointment?")
### P51.A.10 — Personalization per user
### P51.A.11 — Multi-account households
### P51.A.12 — Alexa skill testing
### P51.A.13 — Alexa skill certification
### P51.A.14 — Alexa skill marketplace listing
### P51.A.15 — Skill analytics

## P51.B — Google Assistant Actions (15 PRs)

Mirror P51.A for Google Assistant. Different SDK + cert process.

### P51.B.1-15 — Same structure as Alexa but on Google Assistant platform.

## P51.C — Siri Shortcuts + Apple Intents (10 PRs)

### P51.C.1 — App Intents in iOS app
### P51.C.2 — Siri Shortcuts donation
### P51.C.3 — Common shortcuts ("Book my haircut")
### P51.C.4 — Per-merchant intents
### P51.C.5 — Spotlight integration
### P51.C.6 — Lock screen widgets for upcoming appointments
### P51.C.7 — Apple Watch quick actions
### P51.C.8 — Siri suggestions
### P51.C.9 — Handoff between devices
### P51.C.10 — Live Activity for in-progress services

## P51.D — WhatsApp Business (15 PRs)

### P51.D.1 — WhatsApp Business API integration
### P51.D.2 — Template message approval (Meta requires)
### P51.D.3 — Conversational AI on WhatsApp
### P51.D.4 — Booking via WhatsApp
### P51.D.5 — Reminder via WhatsApp
### P51.D.6 — Receipt via WhatsApp
### P51.D.7 — Payment links via WhatsApp
### P51.D.8 — Group messaging (staff coordination)
### P51.D.9 — Catalog browsing in WhatsApp
### P51.D.10 — WhatsApp marketing campaigns
### P51.D.11 — Click-to-WhatsApp from booking page
### P51.D.12 — WhatsApp business profile management
### P51.D.13 — Multi-language WhatsApp (es-MX, vi, etc.)
### P51.D.14 — WhatsApp pricing (per conversation billing)
### P51.D.15 — Compliance (WhatsApp commerce policies)

## P51.E — Phone Commerce Deeper (15 PRs)

P15 was AI receptionist. P51.E is full phone commerce.

### P51.E.1 — Outbound campaign calling
### P51.E.2 — Voice payments via phone (TCPA-compliant)
### P51.E.3 — Caller ID branding (CNAM)
### P51.E.4 — Voice OTP for sensitive operations
### P51.E.5 — Voice biometrics for repeat clients
### P51.E.6 — Multi-language voice (es, vi, ko, zh, ru)
### P51.E.7 — Sentiment-aware voice (slower for elderly)
### P51.E.8 — Voice transcript search
### P51.E.9 — Voice analytics deeper (intent funnels)
### P51.E.10 — Voice + SMS hybrid (call → SMS confirmation)
### P51.E.11 — Voice meeting summaries
### P51.E.12 — Voice training of staff (recordings)
### P51.E.13 — Customer call recordings (consent-managed)
### P51.E.14 — Quality monitoring (random call audits)
### P51.E.15 — Voice fraud detection

## P51.F — Voice Commerce Polish (10 PRs)

### P51.F.1-10 — Marketplace voice integrations, advanced features.

---

# P52 — KASSE CAPITAL LENDING (80 PRs) `[GATED: ATTORNEY per OQ-010]`

State MCA disclosure laws (CA, NY, VA, UT, GA, FL) + lending licenses by state.

## P52.A — Legal Foundation (10 PRs) `[ATTORNEY-GATED]`

### P52.A.1 — State licensing matrix `[ATTORNEY]`
### P52.A.2 — MCA vs Loan vs Revenue-Based Financing decision
### P52.A.3 — Disclosure templates per state
### P52.A.4 — Risk-based pricing compliance
### P52.A.5 — Truth in Lending Act compliance (TILA)
### P52.A.6 — Equal Credit Opportunity Act (ECOA) compliance
### P52.A.7 — Fair Credit Reporting Act (FCRA) compliance
### P52.A.8 — Consumer Financial Protection Bureau (CFPB) registration
### P52.A.9 — Anti-money laundering (AML) program
### P52.A.10 — Know Your Customer (KYC) program

## P52.B — Underwriting Engine (10 PRs)

### P52.B.1 — Application form
### P52.B.2 — Bank statement analysis (Plaid)
### P52.B.3 — Cash flow underwriting (Kasse transaction history)
### P52.B.4 — Credit bureau pulls (with permission)
### P52.B.5 — Underwriting decision engine (ML model)
### P52.B.6 — Risk scoring
### P52.B.7 — Offer generation
### P52.B.8 — Counter-offer workflow
### P52.B.9 — Decline reasoning
### P52.B.10 — Underwriting audit log

## P52.C — Loan Origination (10 PRs)

### P52.C.1 — Offer acceptance flow
### P52.C.2 — Loan agreement e-sign
### P52.C.3 — Disbursement (Kasse → merchant bank via Checkbook.io)
### P52.C.4 — Daily auto-debit from settlements (per memory: settlement-deducted lending)
### P52.C.5 — Variable holdback (% of daily GPV)
### P52.C.6 — Fixed daily debit option
### P52.C.7 — Repayment schedule generation
### P52.C.8 — Merchant dashboard (loan status, repayment progress)
### P52.C.9 — Early payoff calculation
### P52.C.10 — Modification workflow

## P52.D — Servicing + Collections (10 PRs)

### P52.D.1 — Daily settlement-based servicing
### P52.D.2 — Delinquency tracking (5/10/30/60/90 day)
### P52.D.3 — Outreach automation (escalating)
### P52.D.4 — Collection workflows
### P52.D.5 — Workout / restructuring
### P52.D.6 — Default declaration
### P52.D.7 — Recovery (sue / sell to collection / write off)
### P52.D.8 — Servicing dashboard
### P52.D.9 — Cash recovery rate analytics
### P52.D.10 — Servicing audit log

## P52.E — Risk Management (10 PRs)

### P52.E.1 — Portfolio dashboard (delinquency, default, loss rates)
### P52.E.2 — Concentration limits (per industry, per geography)
### P52.E.3 — Reserves provisioning
### P52.E.4 — CECL accounting (Current Expected Credit Loss)
### P52.E.5 — Stress testing
### P52.E.6 — Capital adequacy tracking
### P52.E.7 — ML model performance monitoring (drift detection)
### P52.E.8 — Fair lending analysis (disparate impact)
### P52.E.9 — Annual model validation
### P52.E.10 — Regulatory reporting (HMDA, CRA where applicable)

## P52.F — Funding + Capital Markets (10 PRs)

### P52.F.1 — Warehouse facility setup
### P52.F.2 — Loan sales (forward flow agreements)
### P52.F.3 — Securitization preparation (longer term)
### P52.F.4 — Investor reporting
### P52.F.5 — Capital calls
### P52.F.6 — Cash flow modeling
### P52.F.7 — Interest rate hedging
### P52.F.8 — Funding cost tracking
### P52.F.9 — Return on Equity (ROE) tracking
### P52.F.10 — Capital efficiency optimization

## P52.G — Loan Products (10 PRs)

### P52.G.1 — Working capital loans ($5K-$250K, 6-18 month terms)
### P52.G.2 — Equipment financing (with collateral)
### P52.G.3 — Real estate (lease deposit financing)
### P52.G.4 — Inventory financing (Kasse Connect tie-in)
### P52.G.5 — Bridge loans (short-term, high-yield)
### P52.G.6 — Line of credit (revolving)
### P52.G.7 — Renewal product (existing customers, faster underwriting)
### P52.G.8 — Group / franchise lending (cross-collateralized network)
### P52.G.9 — Stylist micro-loans ($500-$5K, faster repay)
### P52.G.10 — Emergency loans (24-hour decisions for existing customers)

## P52.H — Borrower Experience (10 PRs)

### P52.H.1 — In-app loan center
### P52.H.2 — Pre-qualified offers (no hard pull)
### P52.H.3 — Educational content (how loans work)
### P52.H.4 — Calculator widgets
### P52.H.5 — Application tracker
### P52.H.6 — Payment history
### P52.H.7 — Document vault (loan docs, statements)
### P52.H.8 — Tax docs (Form 1098-T equivalent for interest paid)
### P52.H.9 — Refinancing tool
### P52.H.10 — Loan referrals (refer-a-friend program)

---

## PHASE 46-52 COMPLETION CRITERIA

- All 480 PRs merged (excluding `[GATED]` items waiting on external signal)
- Enterprise SSO functional, certified with Okta + AzureAD
- SOC 2 Type II audit observation period running
- HIPAA full compliance documented, BAA library populated
- AI Agent ecosystem with 50+ agents available
- Voice commerce live on Alexa, Google, WhatsApp
- Kasse Capital `[ATTORNEY-pending]` for state licensing
- KASSE_REAL_BUILD_ORDER.md updated

**After P46-52:** P53-P55 (International expansion) can run.
