# PHASE 30-32 — RUNMYSALON + DEVELOPER PLATFORM + AGENT-NATIVE API

**Scope:** RunMySalon distribution layer (P30, 60 PRs), Developer Platform (P31, 80 PRs), Agent-Native API + MCP + App Marketplace v1 (P32, 40 PRs).
**Total PRs:** 180
**Depends on:** P0-P22 foundation. P28 Franchise patterns inform RunMySalon distribution model.
**Reference docs:** EMPIRE_ARCHITECTURE.md (Layer 3 RunMySalon distribution), KASSE_STRATEGIC_DECISIONS.md (engine API spec foundation in P0).

---

# P30 — RUNMYSALON DISTRIBUTION LAYER (60 PRs)

Layer 3 distribution wrapper. Non-technical merchants get RunMySalon-branded experience. Kasse engine underneath. Lives in `lendbucket/runmysalon` repo.

## P30.A — Repo + Foundation (10 PRs)

### P30.A.1 — Create `lendbucket/runmysalon` repo
Next.js 16 + same stack as Kasse. Imports `@reyna/theme`, `@reyna/ui`, `@reyna/engine-client`, `@reyna/types`.

### P30.A.2 — Domain setup: runmysalon.com
DNS, Vercel project, env vars.

### P30.A.3 — RunMySalon theme (`lib/theme/defaults/runmysalon.ts`)
Distinct brand from Kasse. Targeted at less-technical, more-traditional salon owners.

### P30.A.4 — Shared package consumer setup
Import all 4 reyna shared packages.

### P30.A.5 — Kasse engine client consumer
All ops route through Kasse APIs (Kasse is the engine for RunMySalon).

### P30.A.6 — Auth integration (shared user store or federated)
Decision: shared NextAuth + cross-domain SSO.

### P30.A.7 — RunMySalon-specific signup flow
Simpler than Kasse. Phone-first, not email-first.

### P30.A.8 — Marketing site for runmysalon.com
Different value prop: "Salon software made simple." Less technical tone.

### P30.A.9 — Pricing page (RunMySalon-branded)
Simplified pricing. Bundled, not addon-heavy.

### P30.A.10 — CI/CD setup
GitHub Actions, Vercel auto-deploy.

## P30.B — Distribution Model (10 PRs)

### P30.B.1 — Schema: DistributionBrand
```prisma
model DistributionBrand {
  id              String   @id @default(cuid())
  name            String   // "RunMySalon"
  slug            String   @unique
  ownerOrgId      String?  // the distributor's org, null for first-party
  themeId         String
  domain          String
  pricingModel    String   // SIMPLIFIED | KASSE_STANDARD
  defaultPlan     Plan
  bundledAddons   String[] // addons included in base price
  revenueShare    Decimal  @db.Decimal(5,2)  // % to distributor
  isFirstParty    Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

### P30.B.2 — Schema: Organization.distributionBrandId
Foreign key. Every org affiliated with a brand (defaults to "Kasse" first-party).

### P30.B.3 — Brand-aware pricing
Each org's plan limits, addon prices, billing logic routed through their brand's pricing model.

### P30.B.4 — Brand-aware email sender
Emails from `noreply@runmysalon.com` for RunMySalon orgs vs `noreply@kasseapp.com` for Kasse orgs.

### P30.B.5 — Brand-aware SMS sender (TFN per brand)
Separate Twilio numbers per brand.

### P30.B.6 — Brand-aware support routing
Tickets route to brand-specific queue.

### P30.B.7 — Brand-aware billing entity
Invoices from "RunMySalon by Reyna Tech" entity vs "Kasse by 36 West Holdings."

### P30.B.8 — Brand-aware marketing site embeds
Booking widgets show brand-appropriate Powered By footer.

### P30.B.9 — Brand admin separation
RunMySalon SUPERADMIN cannot see Kasse SUPERADMIN data.

### P30.B.10 — Cross-brand analytics (Reyna Tech parent)
Robert sees aggregate across all brands.

## P30.C — Simplified Onboarding (15 PRs)

### P30.C.1 — RunMySalon-specific signup
Files: `app/signup/page.tsx` (RunMySalon repo)
Phone OTP. Skip vertical picker (assume salon).

### P30.C.2 — One-screen business setup
Combined: business name, address, owner name.

### P30.C.3 — Skip booking page setup (auto-generated)
Slug auto-assigned. Customizable post-signup.

### P30.C.4 — Skip branding (use RunMySalon-template look)
Customizable post-signup.

### P30.C.5 — Skip imports (manual entry default)
### P30.C.6 — Auto-add 5 most-common salon services
Pre-populated, editable later.

### P30.C.7 — Pay-by-Phone activation
RunMySalon ships with phone-payment flow as primary (vs in-person POS terminal).

### P30.C.8 — Reyna Pay application embedded (simplified)
Stripped-down application UI. Same backend.

### P30.C.9 — 1-minute setup goal
End-to-end measurement; optimize for sub-minute.

### P30.C.10 — White-glove onboarding option (PRO)
Concierge: book a 30-min session with RunMySalon agent.

### P30.C.11 — SMS-based onboarding option
Owner texts a number → assistant onboards via SMS.

### P30.C.12 — Walk-in conversion at trade shows
Tablet kiosk at industry events.

### P30.C.13 — Reseller distribution channel
Beauty supply distributors resell. P34 hooks (gated on attorney).

### P30.C.14 — Multi-language onboarding (es-MX, vi-VN, ru, ko, zh)
Per ethnic salon markets.

### P30.C.15 — Voice-onboarding option
AI walks owner through setup via phone call.

## P30.D — Feature Trimming for Simplicity (10 PRs)

### P30.D.1 — Hidden advanced features (per brand config)
RunMySalon hides: API access, advanced reporting, custom roles, agent ecosystem, multi-location complexity.

### P30.D.2 — Simplified dashboard
Fewer KPI cards. Larger numbers. More guidance copy.

### P30.D.3 — Simplified appointments view
Default to list, not multi-column calendar.

### P30.D.4 — Simplified POS
Cash + card. No split payments by default. No surcharge controls.

### P30.D.5 — Simplified marketing
No automations. One-tap broadcast only.

### P30.D.6 — Simplified reports
3 reports total: Today, This Week, This Month.

### P30.D.7 — Plan limits enforced more strictly
RunMySalon caps multi-location.

### P30.D.8 — Auto-decisioning (AI helper)
Default: AI Receptionist on. Reminders on. Review requests on. No-show fee on.

### P30.D.9 — Educational tooltips throughout
Friendly explainers.

### P30.D.10 — "Upgrade to Kasse" upsell for power users
If usage triggers (10+ staff, custom roles requested), prompt to upgrade to Kasse.

## P30.E — Brand Ambassador / Reseller Network (5 PRs)

### P30.E.1 — RunMySalon reseller program (gated until P34 ATTORNEY)
Distribution via beauty schools, supply houses.

### P30.E.2 — Reseller dashboard
Sub-account management.

### P30.E.3 — Reseller commission tracking
### P30.E.4 — Reseller materials library
Co-branded sell sheets, demo decks.

### P30.E.5 — Reseller training portal

## P30.F — RunMySalon-Specific Marketing (10 PRs)

### P30.F.1 — Marketing site for runmysalon.com (P30.A.8 expansion)
### P30.F.2 — Compare: RunMySalon vs Square Appointments
Different angle than Kasse comparison.

### P30.F.3 — Compare: RunMySalon vs Booksy
### P30.F.4 — Industry-specific landing pages (salon, barbershop only)
Narrower scope vs Kasse's 33 verticals.

### P30.F.5 — Blog (different tone — more aspirational, less technical)
### P30.F.6 — SEO (longtail keywords distinct from Kasse)
### P30.F.7 — Paid search (RunMySalon brand campaigns)
### P30.F.8 — Industry partnerships (state beauty associations)
### P30.F.9 — Trade show presence (BeautyCon, etc.)
### P30.F.10 — Customer case studies (RunMySalon-specific)

---

# P31 — DEVELOPER PLATFORM (80 PRs)

For developers + companies buying Kasse API to power their own branded software. Per memory: "developers and companies buying the API to power their own branded software — wholesale + retail, multi-vertical, AI-agent-native from day one."

## P31.A — Public OpenAPI Spec (10 PRs)

### P31.A.1 — OpenAPI 3.1 spec generator
Files: `scripts/generate-openapi.ts`
From Zod schemas → OpenAPI.

### P31.A.2 — Spec auto-publish on every release
`/v1/openapi.json` always current.

### P31.A.3 — Swagger UI hosting
Files: `app/(developers)/api-reference/page.tsx`
Interactive docs.

### P31.A.4 — ReDoc alternative
Cleaner reference style.

### P31.A.5 — Code samples per endpoint (curl, JS, Python, Go, Ruby)
Auto-generated.

### P31.A.6 — Postman collection auto-export
### P31.A.7 — Insomnia collection auto-export
### P31.A.8 — Versioning (v1, v2 path-based)
### P31.A.9 — Deprecation flags
Surface in OpenAPI + headers.

### P31.A.10 — Changelog generator
Markdown + RSS.

## P31.B — Idempotency, Pagination, Errors (10 PRs)

### P31.B.1 — Idempotency-Key header support on all writes
Per memory: 1 week TTL per API key (UUID v4).

### P31.B.2 — Idempotent retry logic
Same key, same body → cached response. Same key, different body → 409 conflict.

### P31.B.3 — Cursor-based pagination
`?after=cursor&limit=N`.

### P31.B.4 — Page-based fallback (limited)
For consistency with some clients.

### P31.B.5 — Standard error envelope
```json
{ "error": { "type": "string", "code": "string", "message": "string", "param": "string?", "requestId": "string" } }
```

### P31.B.6 — Error code catalog
Comprehensive list.

### P31.B.7 — Rate limit headers
`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### P31.B.8 — 429 with Retry-After
### P31.B.9 — Request ID in every response
### P31.B.10 — API stability tiers
GA, Beta, Experimental.

## P31.C — Authentication + API Keys (10 PRs)

### P31.C.1 — Schema: DeveloperAccount, ApiKey, Scope
### P31.C.2 — Developer signup flow
Files: `app/(developers)/signup/page.tsx`
Separate from merchant signup.

### P31.C.3 — API key generation
Two halves: publishable (`pk_live_...`) + secret (`sk_live_...`). Test mode + live mode.

### P31.C.4 — Scoped tokens
Per-resource permissions (read-only, full access, specific endpoints).

### P31.C.5 — Bearer auth on all `/v1/*`
### P31.C.6 — Key rotation flow
Old key valid for 24h after rotation for migration.

### P31.C.7 — Key revocation
Immediate.

### P31.C.8 — Key usage logs per developer
Last 30 days.

### P31.C.9 — IP allowlist per key
Optional.

### P31.C.10 — Webhook signing secret separate from API key

## P31.D — Developer Dashboard (15 PRs)

### P31.D.1 — Dashboard home
Files: `app/(developers)/dashboard/page.tsx`
Stats: request volume, error rate, latency.

### P31.D.2 — Request log explorer
Last 7 days. Filter by endpoint, status code, IP, key.

### P31.D.3 — Individual request detail
Full request + response payloads.

### P31.D.4 — Webhook delivery log
Per-event delivery, retry history.

### P31.D.5 — API key management UI
List, create, rotate, revoke.

### P31.D.6 — Test mode toggle
Separate test data from live.

### P31.D.7 — Sandbox merchants (test data)
Pre-seeded fake orgs.

### P31.D.8 — Webhook endpoint config
Multiple endpoints. Per-event subscriptions.

### P31.D.9 — Webhook test events
Send sample event to endpoint.

### P31.D.10 — Webhook signature verifier (in-page tool)
### P31.D.11 — API explorer (interactive)
Try requests in-browser.

### P31.D.12 — Billing / usage limits
Free tier, paid tiers.

### P31.D.13 — Quota monitoring
Approaching limit alerts.

### P31.D.14 — Support ticket from developer dashboard
### P31.D.15 — Account team management
Add teammates to developer account.

## P31.E — SDKs (10 PRs)

### P31.E.1 — Node.js SDK
`@kasse/node` on npm. Typed.

### P31.E.2 — Browser JS SDK
For frontend Apple Pay / Google Pay flows.

### P31.E.3 — Python SDK
`kasse-python` on PyPI.

### P31.E.4 — Go SDK
### P31.E.5 — Ruby SDK
### P31.E.6 — PHP SDK
For WP plugin integrations.

### P31.E.7 — iOS SDK (Swift)
### P31.E.8 — Android SDK (Kotlin)
### P31.E.9 — SDK auto-generation pipeline
From OpenAPI → SDK code.

### P31.E.10 — SDK CI (test each SDK against sandbox)

## P31.F — Webhooks Infrastructure (5 PRs)

### P31.F.1 — Webhook delivery service
At-least-once. Idempotent receiver expected.

### P31.F.2 — Webhook retry (exponential backoff up to 5 days)
### P31.F.3 — Webhook signing (HMAC SHA-256)
### P31.F.4 — Webhook replay UI
### P31.F.5 — Webhook event catalog
All events documented.

## P31.G — Developer Marketing (10 PRs)

### P31.G.1 — Developer marketing site (developers.kasseapp.com)
### P31.G.2 — Quickstart guide
### P31.G.3 — Tutorials per use case (build a booking widget, build an integration, build a reseller portal)
### P31.G.4 — Recipes / cookbook
### P31.G.5 — Sample apps
GitHub repos.

### P31.G.6 — Hackathon program
### P31.G.7 — Developer newsletter
### P31.G.8 — Developer community Discord
### P31.G.9 — Office hours (weekly)
### P31.G.10 — Developer evangelism content

## P31.H — Compliance + Legal (5 PRs)

### P31.H.1 — API Terms of Service
### P31.H.2 — Acceptable use policy
### P31.H.3 — Data privacy + DPA for developers
### P31.H.4 — Security disclosure policy (vuln reporting)
### P31.H.5 — Compliance attestations (SOC 2 in progress, PCI ISV)

## P31.I — Partner Program (5 PRs)

### P31.I.1 — Partner application
Differentiated from regular developer.

### P31.I.2 — Partner directory
Public.

### P31.I.3 — Revenue share for partners
Standard 20% recurring per memory pattern.

### P31.I.4 — Co-marketing program
### P31.I.5 — Partner certification tiers (Bronze, Silver, Gold)

---

# P32 — AGENT-NATIVE API + MCP + APP MARKETPLACE v1 (40 PRs)

Per memory: "AI-agent-native from day one." All Kasse APIs work via natural language for AI agents. MCP server exposes Kasse to Claude/GPT-4/etc.

## P32.A — MCP Server (10 PRs)

### P32.A.1 — MCP server scaffold
Files: `apps/mcp-server/` in monorepo
Node TypeScript. Implements MCP spec.

### P32.A.2 — Tool definitions per Kasse domain
Tools: list_appointments, create_appointment, list_clients, get_client, charge_card, etc.

### P32.A.3 — Authentication via merchant-scoped MCP token
Merchant generates MCP token in dashboard.

### P32.A.4 — Per-tool permission gates
Same Permissions object as P0.A.

### P32.A.5 — Streaming responses
For long-running tools.

### P32.A.6 — Read tools: list_*, get_*, search_*
### P32.A.7 — Write tools: create_*, update_*, cancel_*
### P32.A.8 — Charge tool (with idempotency)
### P32.A.9 — Audit log: every MCP call logged
### P32.A.10 — MCP server hosting (Vercel edge function)

## P32.B — Natural Language Wrappers (10 PRs)

### P32.B.1 — `/v1/agents/run` endpoint
Files: `app/api/v1/agents/run/route.ts`
Accepts natural language. Claude routes to tools.

### P32.B.2 — Per-merchant agent context
Knows their services, staff, hours.

### P32.B.3 — Multi-step reasoning
"Schedule a balayage with Maria next available Saturday morning and charge a $50 deposit to client's card on file."

### P32.B.4 — Confirmation step for write operations
"I'll book this for 10am Saturday with $50 deposit. Confirm?"

### P32.B.5 — Cost tracking per agent run
### P32.B.6 — Agent run history
### P32.B.7 — Agent run analytics
### P32.B.8 — Custom agent personas per merchant
"My agent is a friendly receptionist named Bella."

### P32.B.9 — Agent guardrails (no refunds without owner approval)
### P32.B.10 — Streaming agent responses

## P32.C — App Marketplace v1 (10 PRs)

### P32.C.1 — Schema: AppListing
Per app: name, description, developer, pricing, integration type.

### P32.C.2 — App listing UI
Files: `app/(public)/apps/page.tsx`
Browse. Categories. Search.

### P32.C.3 — App detail page
Screenshots, install instructions, pricing.

### P32.C.4 — App install flow
OAuth-like consent.

### P32.C.5 — Per-merchant installed apps list
Files: `app/dashboard/apps/page.tsx`

### P32.C.6 — App uninstall
### P32.C.7 — App pricing tiers
Free, paid one-time, paid subscription.

### P32.C.8 — App revenue share (70/30 to developer)
### P32.C.9 — App review process
Quality + security review before listing.

### P32.C.10 — App categories
Bookkeeping, marketing, communication, hardware, etc.

## P32.D — Curated Integrations (Auto-Listed) (10 PRs)

### P32.D.1 — QuickBooks Online (curated)
### P32.D.2 — Xero (curated)
### P32.D.3 — Wave (curated)
### P32.D.4 — Mailchimp (curated)
### P32.D.5 — Klaviyo (curated)
### P32.D.6 — Zapier (curated)
### P32.D.7 — Slack (notifications to staff channel)
### P32.D.8 — Google Calendar 2-way sync
### P32.D.9 — Outlook Calendar 2-way sync
### P32.D.10 — Apple Calendar 2-way sync

---

## PHASE 30-32 COMPLETION CRITERIA

- All 180 PRs merged
- runmysalon.com live with 100+ merchants
- Developer Platform with 10+ developer signups
- MCP server functioning with Claude
- App Marketplace with 20+ apps listed
- KASSE_REAL_BUILD_ORDER.md updated

**After P30-32:** P33-P35 (White-Label, Reseller, Med Spa HIPAA Full) can run.
