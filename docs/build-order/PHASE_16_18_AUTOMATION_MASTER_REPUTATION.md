# PHASE 16-18 — MARKETING AUTOMATION + MASTER PORTAL FULL + REPUTATION ENGINE

**Scope:** Marketing Automation Suite (P16, 60 PRs), Master Portal Full per COMMAND_CENTER.md (P17, 80 PRs), Reputation Engine full multi-platform (P18, 40 PRs).
**Total PRs:** 180
**Depends on:** P6 (Owner Portal), P7 (Master Mini), P15 (AI Receptionist for SMS infrastructure).
**Reference docs:** COMMAND_CENTER.md (Master Portal full spec), KASSE_PHASE_COMMITS.md (N-12, N-13, N-14 automation features).

---

# P16 — MARKETING AUTOMATION SUITE (60 PRs)

## P16.A — Win-Back Engine (10 PRs)

### P16.A.1 — Lapsed client detection
Files: `lib/marketing/winback-detector.ts`
Nightly cron. Client has visited >2x but no visit in 1.5x average interval.

### P16.A.2 — Win-back schema
Files: `prisma/schema.prisma` — `WinbackCampaign`, `WinbackTarget` tables.

### P16.A.3 — Win-back campaign list page
Files: `app/dashboard/marketing/winback/page.tsx`

### P16.A.4 — AI message generation
Personalized per client. Mentions last service.

### P16.A.5 — Send single win-back
Manual one-click send to specific client.

### P16.A.6 — Bulk win-back send
All lapsed clients in batch.

### P16.A.7 — Win-back A/B testing (offer vs no offer)
### P16.A.8 — Win-back analytics
Conversion rate. Revenue recovered.

### P16.A.9 — Win-back exclusion list
Client opt-out preserved.

### P16.A.10 — Win-back follow-up cadence
Day 1, Day 7, Day 14. Stop after Day 30 if no response.

## P16.B — Review Request Automation (5 PRs)

### P16.B.1 — Auto-trigger 2h post-service
Files: scheduled job.

### P16.B.2 — 4-5 star → route to Google Business Profile
Per OQ-005 OAuth flow.

### P16.B.3 — 1-3 star → route to internal feedback form
Don't risk public bad review without remediation chance.

### P16.B.4 — Review response automation (AI-generated, owner approves)
### P16.B.5 — Review analytics

## P16.C — Birthday + Anniversary Automation (5 PRs)

### P16.C.1 — Birthday detection
Daily cron. Client.dateOfBirth matches today.

### P16.C.2 — Birthday message template (per Org)
Personalized.

### P16.C.3 — Birthday discount code (auto-generated)
Unique code, single use, 30-day expiry.

### P16.C.4 — Anniversary (first visit anniversary)
"It's been a year since your first visit!"

### P16.C.5 — Wedding anniversary (if captured)
Couples salon use case.

## P16.D — Referral Tracking (10 PRs)

### P16.D.1 — Schema: Referral table
Referrer, referred, source, reward status.

### P16.D.2 — Referral code per client
Each client has unique referral code.

### P16.D.3 — Referral landing page
`/r/{code}` → tracks click → booking flow.

### P16.D.4 — Referral attribution on signup
New client lists referrer at booking.

### P16.D.5 — Referrer credit on referred's first paid visit
Auto credit applied to referrer's account.

### P16.D.6 — Referral leaderboard
Per-stylist or per-client.

### P16.D.7 — Referral SMS sharing
Quick share button.

### P16.D.8 — Referral analytics
Total referrals, conversion rate, revenue from referrals.

### P16.D.9 — Referral fraud detection
Self-referrals, same-household.

### P16.D.10 — Referral program disable per org
OWNER toggle.

## P16.E — AI-Generated Forms (Nisha N-12) (10 PRs)

### P16.E.1 — Schema: AiForm table
### P16.E.2 — Form generation from prompt
"Create intake form for chemical peel" → AI builds.

### P16.E.3 — Field type inference
"date of birth" → date field. "phone number" → phone field.

### P16.E.4 — Conditional logic generation
"If pregnant, show alternative consent."

### P16.E.5 — Compliance check (HIPAA, waiver language)
AI flags missing required elements.

### P16.E.6 — Owner edits + approves
Form not active until owner signs off.

### P16.E.7 — Form analytics
Completion rate.

### P16.E.8 — Multi-language generation
Auto-translate to es-MX.

### P16.E.9 — Form template library
Save AI-generated for reuse.

### P16.E.10 — Form versioning
Track changes over time.

## P16.F — AI-Generated Marketing Content (Nisha N-13) (10 PRs)

### P16.F.1 — Campaign builder AI assist
"Win back inactive clients" prompt → AI builds campaign.

### P16.F.2 — Subject line generation
A/B variants automated.

### P16.F.3 — Body copy generation
Per-vertical tone.

### P16.F.4 — Image suggestion (from formula card gallery)
### P16.F.5 — Call-to-action generation
### P16.F.6 — Personalization tokens (auto-suggested)
### P16.F.7 — Send time optimization
Best time per recipient based on past open behavior.

### P16.F.8 — Spam score check
Pre-send check against spam filters.

### P16.F.9 — Compliance check (CAN-SPAM, TCPA)
Unsub link present, sender identified.

### P16.F.10 — Performance prediction
"Expected open rate: 32%."

## P16.G — Retention Insights with AI (Nisha N-14) (5 PRs)

### P16.G.1 — Per-client retention prediction
Likelihood to churn.

### P16.G.2 — Suggested action per at-risk client
"Reach out about color refresh."

### P16.G.3 — Stylist retention scorecard
Which stylists retain best.

### P16.G.4 — Service retention scorecard
Which services correlate with retention.

### P16.G.5 — Retention dashboard widget

## P16.H — Re-engagement Sequences (5 PRs)

### P16.H.1 — Drip sequence builder
Multi-step automation (Day 0, 7, 14, 30).

### P16.H.2 — Trigger conditions
Lapsed, no-show, first-visit, etc.

### P16.H.3 — Branching logic
If-clicked-then-X, if-not-then-Y.

### P16.H.4 — Sequence analytics
Per-step conversion.

### P16.H.5 — Pause/resume sequence per client

---

# P17 — MASTER PORTAL FULL (Command Center) (80 PRs)

Per COMMAND_CENTER.md complete spec. 11 universal sections + 5 Kasse-specific.

## P17.A — Universal Sidebar + Layout (5 PRs)

### P17.A.1 — Full sidebar (16+ sections)
Already in P7 stub. Expand.

### P17.A.2 — Per-section permission gates
### P17.A.3 — Quick action bar (top)
### P17.A.4 — Real-time activity stream (right rail)
### P17.A.5 — Dark theme polish

## P17.B — Overview / War Room (10 PRs)

### P17.B.1 — Live KPI cards (large)
Active merchants, today's GPV, today's signups, P0 errors, support queue.

### P17.B.2 — KPI deltas (vs yesterday, vs last week)
### P17.B.3 — Real-time activity feed
Transactions, signups, errors, support tickets.

### P17.B.4 — Geographic map (where transactions happen)
US map. Heat by GPV.

### P17.B.5 — Trending metrics
Top 5 growing merchants, top declining.

### P17.B.6 — System health overview
Engine, Twilio, Resend, Vercel, Supabase all green/yellow/red.

### P17.B.7 — Active incidents panel
### P17.B.8 — Recent feature flag toggles
### P17.B.9 — Recent deploys
### P17.B.10 — Top 10 errors (last hour)

## P17.C — Merchants (Full CRM) (10 PRs)

### P17.C.1-5 — Extended merchant detail
Full lifecycle, expansion opportunities, NPS history, support sentiment, plan upgrade likelihood, churn risk score.

### P17.C.6-8 — Merchant CRM activities
Notes, tasks, follow-ups for CS team.

### P17.C.9-10 — Merchant segmentation
Cohorts for outreach.

## P17.D — Revenue + Transactions Monitor (10 PRs)

### P17.D.1 — Real-time transaction stream
### P17.D.2 — Transaction anomaly detection
### P17.D.3 — High-velocity alerts
### P17.D.4 — Geographic anomaly
### P17.D.5 — Per-merchant tx volume
### P17.D.6 — Refund rate monitoring
### P17.D.7 — Dispute rate monitoring
### P17.D.8 — Chargeback ratio (regulatory threshold)
### P17.D.9 — Revenue forecast (next 30/90 days)
### P17.D.10 — Cohort revenue retention

## P17.E — Billing (10 PRs)

### P17.E.1 — All Kasse subscriptions
### P17.E.2 — Failed payment queue
### P17.E.3 — Dunning sequence config
### P17.E.4 — Plan change history
### P17.E.5 — Invoice generation
### P17.E.6 — Tax handling (Kasse sells SaaS in TX → must charge tax)
### P17.E.7 — Refund (Kasse billing)
### P17.E.8 — Credit application
### P17.E.9 — Annual plan management (15% discount)
### P17.E.10 — Enterprise contract handling

## P17.F — Operations (10 PRs)

### P17.F.1 — Deployment dashboard
Files: integrated with Vercel API.

### P17.F.2 — GitHub integration (PRs, commits, deploys)
### P17.F.3 — Error monitoring (Sentry embed)
### P17.F.4 — Performance monitoring
### P17.F.5 — Database console (read-only)
### P17.F.6 — Background job queue depths
### P17.F.7 — Webhook delivery rates
### P17.F.8 — Twilio queue + delivery
### P17.F.9 — Resend deliverability
### P17.F.10 — Supabase connection pool

## P17.G — AI Dev Console (5 PRs) — per COMMAND_CENTER.md

### P17.G.1 — Anthropic API streaming console
SUPERADMIN can ask Claude to do platform-level operations.

### P17.G.2 — Code generation + deploy
"Write a hotfix for X bug, deploy to staging."

### P17.G.3 — Rollback
### P17.G.4 — Cost monitoring (per-merchant AI cost)
### P17.G.5 — Audit log of AI actions

## P17.H — Communications (5 PRs)

### P17.H.1 — Broadcast composer
### P17.H.2 — Support inbox (full triage)
### P17.H.3 — Direct messaging
### P17.H.4 — Email template library
### P17.H.5 — Mass notification (push)

## P17.I — Analytics + Alerts + Security (5 PRs)

### P17.I.1 — Analytics dashboards (Metabase or built-in)
### P17.I.2 — Alert rules
### P17.I.3 — Security events
### P17.I.4 — Access logs
### P17.I.5 — Compliance dashboard (SOC 2, HIPAA progress)

## P17.J — Kasse-Specific Sections (10 PRs)

Per COMMAND_CENTER.md, Kasse-specific:
### P17.J.1 — Booking Monitor (cross-merchant booking activity)
### P17.J.2 — POS Transactions
### P17.J.3 — AI Receptionist analytics (cross-merchant)
### P17.J.4 — Franchise Network (when P28 ships)
### P17.J.5 — Marketplace (when P29 ships)
### P17.J.6 — Kasse Color usage
### P17.J.7 — SalonBacked integration status (when P27 ships)
### P17.J.8 — RunMySalon brand performance (when P30 ships)
### P17.J.9 — Cross-vertical analytics
### P17.J.10 — Empire AI (Reyna AI intelligence)

---

# P18 — REPUTATION ENGINE (FULL MULTI-PLATFORM) (40 PRs)

## P18.A — Google Business Profile (10 PRs)

### P18.A.1 — OAuth per merchant (OQ-005 — Option A)
### P18.A.2 — GBP API integration
### P18.A.3 — Pull reviews
### P18.A.4 — Reply to reviews via API
### P18.A.5 — Sync hours
### P18.A.6 — Sync photos
### P18.A.7 — Sync posts
### P18.A.8 — Q&A management
### P18.A.9 — Insights (views, calls, directions)
### P18.A.10 — Multi-location GBP management

## P18.B — Yelp + Facebook + Apple Maps + TripAdvisor (10 PRs)

### P18.B.1 — Yelp Fusion API integration
### P18.B.2 — Facebook reviews integration
### P18.B.3 — Apple Maps reviews (limited API)
### P18.B.4 — TripAdvisor (restaurants/spas)
### P18.B.5 — Unified review feed across platforms
### P18.B.6 — Per-platform reply (where API permits)
### P18.B.7 — Manual reply links (where API doesn't)
### P18.B.8 — Cross-platform analytics
### P18.B.9 — Platform comparison (which gets most reviews)
### P18.B.10 — New-review alerts

## P18.C — Sentiment + AI Responses (10 PRs)

### P18.C.1 — Claude API sentiment analysis
### P18.C.2 — Sentiment scoring (-1 to +1)
### P18.C.3 — Sentiment trend
### P18.C.4 — AI response templates per sentiment
### P18.C.5 — Owner approves before send
### P18.C.6 — Auto-send (with toggle, for routine 5-star "thanks")
### P18.C.7 — Negative review escalation
Notify OWNER immediately.

### P18.C.8 — Response time tracking
Target: respond within 24h.

### P18.C.9 — Theme extraction (common complaints)
### P18.C.10 — Response analytics (response rate by platform)

## P18.D — Local SEO + Listings (10 PRs)

### P18.D.1 — Local SEO scoring
Citations, reviews, NAP consistency, GBP completeness.

### P18.D.2 — Listing sync (Yext or built-in)
Auto-update across 50+ directories.

### P18.D.3 — Schema markup on booking page
LocalBusiness, Service, Review.

### P18.D.4 — Backlink monitoring
### P18.D.5 — Keyword tracking
### P18.D.6 — Competitor monitoring
### P18.D.7 — Local pack tracking (Google Maps 3-pack)
### P18.D.8 — Citation building suggestions
### P18.D.9 — SEO audit report
### P18.D.10 — SEO recommendations engine

---

## PHASE 16-18 COMPLETION CRITERIA

- All 180 PRs merged
- Marketing automations running at Salon Envy with measurable revenue impact
- Master Portal Full functional for managing 1000+ merchants
- Reputation engine pulling reviews from 5+ platforms
- KASSE_REAL_BUILD_ORDER.md updated

**After P16-18:** P19-P22 (Payroll, Banking, Tax, Migration) can run.
