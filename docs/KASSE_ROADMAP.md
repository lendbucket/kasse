# KASSE ROADMAP
## Phase-by-Phase Build Plan with Commits

**Version:** 1.0 | **Status:** LIVING DOCUMENT

---

## PHASE 0 — Foundation Cleanup (Week 0)
**Goal:** Everything that exists actually works end-to-end with real data.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 0.1 | Replace Fira Code with Inter throughout portal | All numbers, amounts, timestamps render in Inter |
| 0.2 | Wire dashboard KPIs to real Prisma queries | Revenue, appointments, clients show real counts |
| 0.3 | Wire POS terminal to save real transactions | Completed sale creates Transaction record in DB |
| 0.4 | Wire appointments page to real CRUD | Create, read, update, cancel all persist to DB |
| 0.5 | Wire clients page to real CRUD | Client create, edit, view history all from DB |
| 0.6 | Wire staff page to real CRUD | Staff create, edit, activate/deactivate from DB |
| 0.7 | Wire services page to real CRUD | Service create, edit, deactivate from DB |
| 0.8 | Wire reports page to real transaction data | Revenue, transactions, tips pull from DB |
| 0.9 | Wire settings page to save/load real org data | All settings panels read/write to DB |
| 0.10 | Full mobile responsive audit on all pages | Every page usable on iPhone Safari |

---

## PHASE 1 — Core POS (Weeks 1-2)
**Goal:** Take a real payment through SalonTransact.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 1.1 | SalonTransact API client (`lib/engine/client.ts`) | Typed wrapper, all v1 endpoints, error handling |
| 1.2 | Charge endpoint in POS terminal | POST /api/v1/charges fires on "Charge" button |
| 1.3 | Transaction saved after charge | Transaction + TransactionItems written to DB |
| 1.4 | Receipt generation + SMS send | Receipt renders, SMS sent via Twilio |
| 1.5 | Saved card support | List saved cards, charge saved card |
| 1.6 | Cash payment + change calculation | Cash tender, change shown, logged correctly |
| 1.7 | Split payment support | Card + cash + gift card on one ticket |
| 1.8 | Refund from transaction history | Partial and full refund, commission reversed |
| 1.9 | End-of-day report | Revenue, tips, transactions by stylist for today |
| 1.10 | Kiosk checkout code generation | 6-digit unique code generated per appointment |

---

## PHASE 2 — Booking Engine (Weeks 3-5)
**Goal:** Full appointment lifecycle from online booking to checked out.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 2.1 | Calendar view (week/day) with real appointments | Appointments render, color by stylist |
| 2.2 | New appointment with availability check | Can't double-book, respects hours + buffers |
| 2.3 | Drag-to-reschedule | Drag appointment to new slot, updates DB |
| 2.4 | Online booking page (kasseapp.com/book/[slug]) | Public page, real availability, creates appointment |
| 2.5 | Embeddable booking widget (script tag) | Works on external website |
| 2.6 | Booking confirmation SMS + email | Fires on appointment create |
| 2.7 | Reminder system (24hr, 48hr) | Cron job fires reminders at configured intervals |
| 2.8 | Cancellation with fee enforcement | Cancellation within window → charges fee |
| 2.9 | No-show marking + auto-charge | Mark no-show → charges saved card |
| 2.10 | Waitlist with auto-notify | Add to waitlist, auto-SMS when slot opens |

---

## PHASE 3 — Client Intelligence (Weeks 6-7)
**Goal:** Know every client better than they know themselves.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 3.1 | Full client profile with visit history | Every visit, service, stylist, amount shown |
| 3.2 | Formula/notes history (encrypted) | Color formulas stored, encrypted at rest |
| 3.3 | Before/after photo upload (S3) | Photos upload, tag to visit |
| 3.4 | Family accounts | Link family members, charge to parent card |
| 3.5 | LTV calculation (from engine) | Lifetime value shown on profile |
| 3.6 | Churn risk score (AI) | Risk score calculated, shown on profile |
| 3.7 | Personalized recommendations (AI) | Upsell suggestions shown to front desk |
| 3.8 | Communication timeline (all channels) | All SMS, email, notes in one thread |
| 3.9 | Tags system | Create, assign, filter clients by tags |
| 3.10 | Client export (CSV) | Export full client list with history |

---

## PHASE 4 — Marketing Engine (Weeks 8-9)
**Goal:** Automated client engagement that runs without human intervention.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 4.1 | Campaign creation UI (one-time) | Create, schedule, send to segment |
| 4.2 | Segment builder | Filter by any client field, AND/OR logic |
| 4.3 | Email campaign delivery (Resend) | Emails send, opens tracked |
| 4.4 | SMS campaign delivery (Twilio) | SMS sends, replies tracked |
| 4.5 | Automation engine (always-on triggers) | Automations fire on events from DB |
| 4.6 | Post-visit review request automation | Fires 2 hours after appointment completed |
| 4.7 | Lapsed client recovery automation | Fires on clients with no visit in 60 days |
| 4.8 | Birthday automation | Fires on client birthday |
| 4.9 | Abandoned booking recovery | Detects incomplete bookings, sends SMS |
| 4.10 | Campaign analytics | Sent/opened/clicked/revenue attributed |

---

## PHASE 5 — AI Features (Weeks 10-11)
**Goal:** Intelligence that justifies premium pricing.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 5.1 | Kasse AI chat widget (in-portal) | Claude-powered, answers business questions |
| 5.2 | Natural language reporting | "Show me revenue by stylist last month" works |
| 5.3 | AI content generation for campaigns | Generate SMS/email copy with one click |
| 5.4 | Demand forecasting dashboard | 7-day hourly demand chart |
| 5.5 | Revenue forecasting | Monthly projection with confidence range |
| 5.6 | Stylist AI coach | Weekly performance summary delivered |
| 5.7 | Anomaly detection alerts | Unusual drops/spikes flagged automatically |
| 5.8 | AI booking agent widget | Embeddable chat widget, books via conversation |
| 5.9 | AI receptionist config page | Enable, configure greeting, hours, handoff |
| 5.10 | AI receptionist live (Twilio + GPT-4o) | Real inbound calls handled, appointments booked |

---

## PHASE 6 — Multi-Location & Franchise (Weeks 12-13)
**Goal:** Franchise owners can manage all locations from one portal.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 6.1 | Location switcher in portal | Switch between locations, data scopes correctly |
| 6.2 | Per-location settings | Each location has own hours, tax, tip defaults |
| 6.3 | Roll-up reporting | All locations combined + per-location drill-down |
| 6.4 | Franchisee sub-accounts | Create franchisee login, scoped to their locations |
| 6.5 | Fee configuration (royalty, tech, marketing) | Set % or flat fees per franchise system |
| 6.6 | Automated fee calculation from revenue | Fees calculated daily from transaction data |
| 6.7 | Franchisor dashboard | See all franchisees' revenue, rank them |
| 6.8 | Customer cross-location lookup | Same client recognized at any location |
| 6.9 | Stylist multi-location scheduling | Stylist works at CC Tuesday, SA Thursday |
| 6.10 | Franchise performance ranking | Leaderboard of locations by revenue, rebook rate |

---

## PHASE 7 — Franchise Creator Portal (Weeks 14-15)
**Goal:** Any Kasse salon can start franchising their business through Kasse.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 7.1 | Franchise Creator wizard (onboarding) | Step-by-step franchise setup flow |
| 7.2 | FDD builder (23-item template) | Pre-fills from Kasse data, exportable PDF |
| 7.3 | Territory mapping tool | Draw territories on Google Maps, lock them |
| 7.4 | Franchisee application portal | Public URL for prospective franchisees to apply |
| 7.5 | Franchisee vetting dashboard | Review apps, approve/deny, track pipeline |
| 7.6 | Training portal | Upload SOPs, videos, brand standards |
| 7.7 | Brand standards compliance monitoring | Alert when franchisee deviates from standards |
| 7.8 | State registration tracker | Which states require FDD registration |
| 7.9 | Attorney referral marketplace | Connect with franchise attorneys (revenue share) |
| 7.10 | White-label auto-provision on franchisee approval | Approve franchisee → their Kasse instance deploys |

---

## PHASE 8 — White-Label Engine (Weeks 16-17)
**Goal:** Deploy a second brand in under 4 hours.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 8.1 | Theme system (`theme.config.ts`) | All colors, logos, copy in one file |
| 8.2 | CSS variable-driven theming | Change theme file → entire product re-themes |
| 8.3 | Sub-domain routing | app.resellerbrand.com → Kasse with their theme |
| 8.4 | Custom domain support | portal.beautysalon.com fully white-labeled |
| 8.5 | Brand-specific email templates | Email header/footer uses reseller brand |
| 8.6 | Per-brand feature flags | Enable/disable features per brand |
| 8.7 | React Native build pipeline | Theme-swapped iOS builds per reseller |
| 8.8 | Second brand pilot deployment | Deploy one reseller brand end-to-end |
| 8.9 | White-label documentation | Reseller setup guide, what's configurable |
| 8.10 | Reseller admin dashboard | You see all reseller brands + their merchants |

---

## PHASE 9 — Stylist Marketplace (Weeks 18-19)
**Goal:** Two-sided marketplace that creates network effect flywheel.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 9.1 | Stylist public profile page | Photo, bio, specialties, portfolio, reviews |
| 9.2 | Marketplace search (city, specialty, price) | Returns relevant stylists with availability |
| 9.3 | AI stylist matching | Natural language query returns top matches |
| 9.4 | Direct booking from marketplace | Books into Kasse calendar |
| 9.5 | Portfolio photo + video upload | Before/after gallery, 15-second reels |
| 9.6 | Featured placement (paid) | $50/month to appear at top of search |
| 9.7 | Independent stylist tier ($29/month) | Booth renters subscribe, get marketplace + booking |
| 9.8 | Stylist hiring board | Salons post jobs, marketplace stylists apply |
| 9.9 | Style quiz → AI recommendation | Quiz results in stylist + service recommendation |
| 9.10 | Marketplace analytics dashboard | Views, bookings, revenue from marketplace per stylist |

---

## PHASE 10 — Developer Platform (Weeks 20-21)
**Goal:** External developers build on Kasse.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 10.1 | Developer portal (portal.kasseapp.com/developers) | Landing page, docs, getting started |
| 10.2 | Public API docs (Scalar) | Interactive, always-current from OpenAPI spec |
| 10.3 | API key creation + management | Create, scope, revoke, view usage |
| 10.4 | Webhook management + delivery logs | Subscribe, view delivery history, replay |
| 10.5 | Sandbox/test mode | Full test environment, test card numbers |
| 10.6 | JavaScript/TypeScript SDK | npm install kasse-sdk works |
| 10.7 | Postman collection auto-generation | Always current, one-click import |
| 10.8 | "Built on Kasse" program | Approved apps listed in directory |
| 10.9 | WordPress plugin | One-click install, booking widget on WP |
| 10.10 | Zapier integration | 10+ Kasse triggers and actions in Zapier |

---

## PHASE 11 — Vertical Adaptation (Weeks 22-24)
**Goal:** Business-type-aware product for 8 verticals.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 11.1 | Business type selection in onboarding | Onboarding branches based on type |
| 11.2 | Barbershop vertical config | Walk-in queue focus, barbershop service types |
| 11.3 | Nail salon vertical config | Station-based booking, nail-specific services |
| 11.4 | Med spa vertical config | HIPAA-aware notes, treatment consent forms |
| 11.5 | Fitness/gym vertical config | Class-based booking, membership-first POS |
| 11.6 | Restaurant vertical config | Table management, menu-based POS |
| 11.7 | Auto service vertical config | Vehicle records, bay assignment, service advisor |
| 11.8 | General business config | No vertical config, DIY categories |
| 11.9 | Vertical-specific KPI dashboards | Each vertical shows its key metrics |
| 11.10 | Vertical-specific AI prompts | AI receptionist trained per vertical context |

---

## PHASE 12 — Kasse Capital & Advanced Monetization (Weeks 25-26)
**Goal:** Generate revenue from the data you own.

| # | Commit | Acceptance Criteria |
|---|--------|---------------------|
| 12.1 | Kasse Capital offer engine | AI-scored advance offer shown to eligible salons |
| 12.2 | Capital application flow | Accept offer, agree to repayment terms |
| 12.3 | Daily repayment deduction | % of daily revenue auto-deducted |
| 12.4 | Capital dashboard | Balance owed, repayment progress |
| 12.5 | Kasse Connect (supply marketplace) | Order products from Salon Centric etc. in Kasse |
| 12.6 | Gift card consumer marketplace | kassegifts.com — buy salon gift cards as gifts |
| 12.7 | SalonBacked integration | Tax, insurance, telehealth shown in Kasse portal |
| 12.8 | Kasse Hardware bundle | Order "Kasse Station" bundle from portal |
| 12.9 | Kasse Insurance quotes | Auto-quote based on revenue + staff data |
| 12.10 | Aggregate data API (anonymized) | Sell benchmarks to brands, PE, researchers |
