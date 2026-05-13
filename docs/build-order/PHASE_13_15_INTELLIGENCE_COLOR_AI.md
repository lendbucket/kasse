# PHASE 13-15 — PROFIT INTELLIGENCE + KASSE COLOR + AI RECEPTIONIST

**Scope:** Profit intelligence Nisha features (P13, 80 PRs), Kasse Color formula cards (P14, 60 PRs), AI Receptionist inbound + outbound (P15, 60 PRs).
**Total PRs:** 200
**Depends on:** P6 (Owner Portal data layer) shipped. P0 foundation.
**Gates:** P15 requires Twilio A2P 10DLC registered per OQ-004 — register IMMEDIATELY.
**Reference docs:** KASSE_PHASE_COMMITS.md (Nisha features N-1 through N-15), KASSE_FEATURES.md (Color + AI specs), KASSE_VERTICAL_SPECS.md.

---

# P13 — PROFIT INTELLIGENCE (Nisha features) (80 PRs)

## P13.A — Service Cost Tracking + Margin (10 PRs)

### P13.A.1 — Schema: Service.productCost, consumableCost, otherCost, targetMarginPct
Already added in P6.C.2 if shipped. Otherwise migration here.

### P13.A.2 — Margin computation
`margin = (price - total cost) / price * 100`. Live in edit form.

### P13.A.3 — Per-service cost breakdown
Multiple line items per service (e.g., bleach + developer + toner = 3 line items).

### P13.A.4 — Consumable inventory tie-in
Each cost line links to InventoryItem. Auto-deducts on service.

### P13.A.5 — Cost history (track price changes over time)
Schema: ServiceCostHistory table.

### P13.A.6 — Cost vs revenue report
Per service: total revenue, total cost, profit. Sortable.

### P13.A.7 — Margin alerts (services below target)
Daily alert if any service runs below target margin.

### P13.A.8 — Bulk margin adjustment
"Increase all colors by 5%" UI.

### P13.A.9 — Cost-of-goods explainer tooltips
Educational tooltips.

### P13.A.10 — Profit per service visualization
Bar chart of profit by service.

## P13.B — Income Target (Nisha N-6) (10 PRs)

### P13.B.1 — Schema: IncomeTarget table
Per org or per location. Monthly target.

### P13.B.2 — Set income target UI
OWNER sets monthly target.

### P13.B.3 — Daily required pace
"To hit $50k this month, need $1,667/day."

### P13.B.4 — Current month progress
Bar/donut showing % complete.

### P13.B.5 — Projection (based on current pace)
"At current pace, you'll hit $47k."

### P13.B.6 — Adjustments needed
"To hit goal, need +$1,200 over remaining 18 days = +$67/day."

### P13.B.7 — Per-stylist contribution to goal
### P13.B.8 — Per-service contribution to goal
### P13.B.9 — Goal achievement celebration
Push notification, in-app celebration.
### P13.B.10 — Multi-month target tracking
History across months.

## P13.C — Profit Per Service Report (Nisha N-5) (5 PRs)

### P13.C.1 — Report page
Files: `app/dashboard/reports/profit-per-service/page.tsx`

### P13.C.2 — Sortable by revenue, profit, margin, count
### P13.C.3 — Time range selector
### P13.C.4 — Comparison (this month vs last)
### P13.C.5 — Drill-down: per-transaction list

## P13.D — Smart Pricing Alerts (Nisha N-7) (10 PRs)

### P13.D.1 — Nightly cron job
Files: `app/api/cron/pricing-alerts/route.ts`
Runs nightly. Computes signals.

### P13.D.2 — Underpriced detection
Services with margin <40% (configurable).

### P13.D.3 — Above-market detection (where benchmarks exist)
Compare to industry data.

### P13.D.4 — Service capacity at limit
Services fully booked for next 7 days → price-increase candidate.

### P13.D.5 — Slow service detection
Services with low bookings → consider price drop or removal.

### P13.D.6 — Notification UI
Alerts in dashboard.

### P13.D.7 — Suggested price + rationale
"Bump Color from $85 to $95: high demand + low margin."

### P13.D.8 — One-click apply
### P13.D.9 — Alert dismiss (with reason)
### P13.D.10 — Alert history

## P13.E — Business Health Dashboard (Nisha N-9) (10 PRs)

### P13.E.1 — Health dashboard route
Files: `app/dashboard/health/page.tsx`

### P13.E.2 — Revenue health metric
Revenue vs prior period. Color-coded.

### P13.E.3 — Client retention health
Returning client %. Trend.

### P13.E.4 — Stylist productivity health
Avg utilization, rebook rate.

### P13.E.5 — No-show rate health
% no-show. Trend.

### P13.E.6 — Margin health
Avg margin. Trend.

### P13.E.7 — Cash flow health
Inflow vs outflow.

### P13.E.8 — Overall health score (composite 0-100)
### P13.E.9 — Weekly auto-email
"Your week in business" email.
### P13.E.10 — Comparison to industry benchmarks
Where available.

## P13.F — Growth Journal (Nisha N-10) (5 PRs)

### P13.F.1 — Schema: GrowthJournal table
Daily entry. Notes + auto-stats.

### P13.F.2 — Journal entry UI
Quick add note. Daily prompt: "What worked today?"

### P13.F.3 — Auto-tagged events
"Today: 5 new clients, 1 win-back, 2 rebooks."

### P13.F.4 — Search past entries
### P13.F.5 — Insights from journal
AI summary: "You added 47 new clients this month, up 23%."

## P13.G — Cancellation Risk Alerts (Nisha N-11) (10 PRs)

### P13.G.1 — Cancellation risk model
Predict: appointment likely to cancel.

### P13.G.2 — Risk score per appointment
0-100. Based on: client history, weather (future), time of day, lead time.

### P13.G.3 — High-risk badge in calendar
### P13.G.4 — Pre-emptive confirmation
Send extra reminder 4 hours before for high-risk.

### P13.G.5 — Offer waitlist client the slot
Pre-emptive offer in case high-risk no-shows.

### P13.G.6 — Confirmation incentive
"Confirm by [time] for 5% off."

### P13.G.7 — Risk by stylist analytics
Some staff have higher no-show rates.

### P13.G.8 — Risk by service analytics
### P13.G.9 — Risk by day of week
### P13.G.10 — Model retraining (weekly)

## P13.H — Other Nisha Features (20 PRs)

### P13.H.1-5 — Retention insights with AI (N-14) (5 PRs)
AI suggests retention strategies per client. Personalized.

### P13.H.6-10 — Smart break scheduling (N-3) (5 PRs)
AI-suggested breaks during off-peak. Per-staff.

### P13.H.11-13 — Public holiday auto-calendar (N-4) (3 PRs)
Holidays auto-populated per location/country. Skip auto-confirmations on holidays.

### P13.H.14-16 — Financial literacy tooltips (N-15) (3 PRs)
Educational tooltips throughout dashboard. Explain margin, rebook, retention.

### P13.H.17-20 — Chair utilization metric (4 PRs)
Hero metric per Nisha. % of available chair-hours booked. Per staff. Per location.

---

# P14 — KASSE COLOR (60 PRs)

Salon vertical killer feature. Formula cards. Per memory: Encrypted at rest (SD-K-008).

## P14.A — Schema + Types (5 PRs)

### P14.A.1 — FormulaCard schema
```prisma
model FormulaCard {
  id          String @id @default(cuid())
  organizationId String
  clientId    String
  staffId     String
  serviceId   String?
  appointmentId String?
  targetLevel String
  startingLevel String
  developer   String
  products    Json   // array of {productId, amount, unit}
  technique   String
  processingTime Int  // minutes
  result      String?
  rating      Int?   // 1-5
  notes       String? @db.Text  // ENCRYPTED at rest
  beforePhotoUrl String?
  afterPhotoUrl String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // ... relations
}
```

### P14.A.2 — Encryption at column level for notes + photos
Per SD-K-008 + HIPAA-adjacent. KMS envelope encryption.

### P14.A.3 — TypeScript types
### P14.A.4 — Migration
### P14.A.5 — Indexes

## P14.B — Formula Card Builder UI (15 PRs)

### P14.B.1 — Builder route
Files: `app/dashboard/color-studio/formula/new/page.tsx`

### P14.B.2 — Client picker (auto if from appointment)
### P14.B.3 — Target level picker (visual: 1-10 with hair color swatches)
### P14.B.4 — Starting level picker
### P14.B.5 — Product selection from inventory
Multi-select. Each with amount (oz, g) + unit.

### P14.B.6 — Auto-deduct from inventory
On save, decrement InventoryItem counts.

### P14.B.7 — Developer selection
10 vol, 20 vol, 30 vol, 40 vol. Or custom.

### P14.B.8 — Allergy check
If Client.allergens includes ammonia → flag if non-ammonia-free product selected.

### P14.B.9 — Processing time + start timer button
### P14.B.10 — Before photo upload (camera, library)
### P14.B.11 — Technique selector (foil, balayage, painting, etc.)
### P14.B.12 — Notes textarea (encrypted)
### P14.B.13 — Save formula card
### P14.B.14 — Duplicate from history (clone past formula)
### P14.B.15 — Template formulas (org-wide library)

## P14.C — Before/After Photos (10 PRs)

### P14.C.1 — Photo upload UI
S3 + thumbnail generation.

### P14.C.2 — Camera integration (web + native)
### P14.C.3 — Multiple before photos (up to 4)
### P14.C.4 — Multiple after photos (up to 6)
### P14.C.5 — Photo enhancement (auto-crop, color correct)
Lightweight in-browser.

### P14.C.6 — Photo gallery view
Per-client portfolio.

### P14.C.7 — Photo gallery view (per-stylist)
### P14.C.8 — Photo gallery view (org-wide, marketing)
### P14.C.9 — Photo sharing to Instagram (deep link)
### P14.C.10 — Consent management
Client opts in to photo storage + marketing use.

## P14.D — Processing Timer + Notifications (5 PRs)

### P14.D.1 — Timer UI (large countdown)
### P14.D.2 — Background timer (persists across pages)
### P14.D.3 — Notification at completion
Push, SMS to staff phone.
### P14.D.4 — Pause/resume timer
### P14.D.5 — Multiple concurrent timers (multi-client)

## P14.E — Formula Library + Analytics (10 PRs)

### P14.E.1 — Org-wide formula library
Files: `app/dashboard/color-studio/library/page.tsx`
All formulas, searchable.

### P14.E.2 — Filter by stylist, client, target level, technique, rating
### P14.E.3 — Most popular products (analytics)
### P14.E.4 — Highest-rated formulas
### P14.E.5 — Most-photographed formulas
### P14.E.6 — Per-stylist formula stats
### P14.E.7 — Per-client formula history
### P14.E.8 — Formula trend analysis (rising techniques)
### P14.E.9 — Export formula library (CSV)
### P14.E.10 — Formula AI assistant (P50 hook — future)

## P14.F — Formula Card Integration with Checkout (5 PRs)

### P14.F.1 — Formula card attached to appointment
### P14.F.2 — Formula card visible in checkout
### P14.F.3 — Auto-rebook recommendation from formula
"Color refresh in 6 weeks" based on formula type.
### P14.F.4 — Formula card editable post-service
Add result + rating + after photos.
### P14.F.5 — Service correlation (Color service ↔ FormulaCard)

## P14.G — Encryption + Compliance (5 PRs)

### P14.G.1 — KMS envelope encryption (notes, photos)
### P14.G.2 — Access audit (who viewed formula)
### P14.G.3 — Photo retention policy
### P14.G.4 — Client right-to-be-forgotten
### P14.G.5 — Stylist portfolio export (when leaving org)
Per stylist's reasonable IP claim.

## P14.H — Plan Tier Integration (5 PRs)

### P14.H.1 — Kasse Color addon tiers (Lite $19, Standard $39, Pro $69)
Per KASSE_TIERS.md.

### P14.H.2 — Lite: formula cards only, no photos
### P14.H.3 — Standard: photos + library
### P14.H.4 — Pro: AI analytics + Instagram share + portfolio
### P14.H.5 — Free trial (30 days)

## P14.I — Polish (5 PRs)

### P14.I.1 — Onboarding tutorial for Color
### P14.I.2 — Empty state (first formula card)
### P14.I.3 — Mobile-optimized (staff use on iPad during service)
### P14.I.4 — Quick-templates per service
### P14.I.5 — Print formula card (laminated reference)

---

# P15 — AI RECEPTIONIST (60 PRs)

Inbound + outbound across voice, SMS, Instagram DM, WhatsApp.

## P15.A — Setup Wizard (5 PRs)

### P15.A.1 — Setup route
Files: `app/dashboard/ai-receptionist/setup/page.tsx`
4-step wizard.

### P15.A.2 — Step 1: Twilio number selection
Search available numbers. Local area code default.

### P15.A.3 — Step 2: AI personality
Friendly, professional, casual. Sample greetings.

### P15.A.4 — Step 3: Business info ingestion
Pull from Org profile + services. AI primed with vertical context.

### P15.A.5 — Step 4: Test call
User calls number, hears AI greeting, ends call.

## P15.B — Twilio Provisioning (5 PRs)

### P15.B.1 — Twilio API integration
### P15.B.2 — Number purchase
### P15.B.3 — A2P 10DLC registration trigger (per OQ-004)
Auto-submit campaign on number purchase.
### P15.B.4 — Call forwarding setup (if customer has existing #)
### P15.B.5 — Number management UI

## P15.C — Voice Handling (10 PRs)

### P15.C.1 — Twilio Voice webhook integration
Files: `app/api/twilio/voice/route.ts`

### P15.C.2 — OpenAI Realtime API integration `[VERIFY]`
Streaming voice. Latency target <500ms.

### P15.C.3 — AI greeting (per Organization tone)
### P15.C.4 — Caller intent classification
Book / reschedule / cancel / question / human.

### P15.C.5 — Conversation state machine
Per call.

### P15.C.6 — AI disclosure to caller (per OQ-007)
"You're speaking with our AI assistant. Press 0 for a human."

### P15.C.7 — Hangup detection
### P15.C.8 — Voicemail handling
If no answer, leave message. Transcribed to log.

### P15.C.9 — Call recording (per state law)
Two-party consent states require notice. Auto-prompt at start.

### P15.C.10 — Call transcript (real-time)
Visible to staff if escalating.

## P15.D — Booking via Voice (10 PRs)

### P15.D.1 — Book intent flow
"What service?" → match to Services. "Which stylist?" → match. "When?" → parse natural language ("tomorrow at 2pm").

### P15.D.2 — Service matching (NLU)
Fuzzy match service names.

### P15.D.3 — Staff matching
By name or "anyone."

### P15.D.4 — Date/time parsing
"Next Wednesday afternoon" → Wed 2pm.

### P15.D.5 — Availability check (real-time)
Query calendar.

### P15.D.6 — Suggest alternatives if unavailable
"That time isn't available, but 3pm or 4pm is."

### P15.D.7 — Phone number capture
Auto from caller ID + confirm.

### P15.D.8 — Name capture
### P15.D.9 — Email capture (optional)
### P15.D.10 — Booking confirmation
"I've booked you for 2pm Saturday with Maria. You'll receive a text confirmation. Reply YES to confirm."

## P15.E — Reschedule + Cancel + Q&A (10 PRs)

### P15.E.1 — Identify caller (phone match)
### P15.E.2 — Reschedule flow
Find upcoming appt, propose new times.

### P15.E.3 — Cancel flow
Confirm cancellation. Apply policy (fee if applicable).

### P15.E.4 — FAQ handling (vertical-aware)
Hours, location, services, prices.

### P15.E.5 — Pricing questions
Per service price.

### P15.E.6 — Directions
Address + Google Maps link via SMS.

### P15.E.7 — Hours / closed today?
### P15.E.8 — Specific staff availability
### P15.E.9 — Product availability (retail)
### P15.E.10 — Gift card balance / purchase

## P15.F — Handoff to Human (5 PRs)

### P15.F.1 — Frustration detection (sentiment)
### P15.F.2 — Explicit request ("speak to a person")
### P15.F.3 — Complex intent detected (not in scope)
### P15.F.4 — Handoff: transfer to staff phone
Round-robin. Voicemail if all busy.
### P15.F.5 — Handoff: queue callback request
SMS to staff: "Callback requested by Sarah at 555-1234."

## P15.G — Call Logging + Analytics (5 PRs)

### P15.G.1 — Call log UI
Files: `app/dashboard/ai-receptionist/calls/page.tsx`
List of calls. Filter by intent, outcome.

### P15.G.2 — Call detail (transcript)
Full conversation.

### P15.G.3 — AI self-scoring (1-5 quality)
AI rates its own performance per call.

### P15.G.4 — Analytics dashboard
Volume, intents, conversion rate (booked / total), handoff rate.

### P15.G.5 — Cost report
Per-call cost (OpenAI + Twilio). Per-month.

## P15.H — Multi-Channel (SMS, Instagram, WhatsApp) (10 PRs)

### P15.H.1 — SMS auto-responses (same engine, text channel)
Files: `app/api/twilio/sms/route.ts`

### P15.H.2 — Instagram DM webhook
Meta Graph API. Per OQ-005.

### P15.H.3 — Facebook Messenger webhook
### P15.H.4 — WhatsApp Business booking
### P15.H.5 — Channel unification (one inbox)
Stub for full unified inbox in P57.

### P15.H.6 — Outbound calling (reminders, win-back)
AI calls clients with permission.

### P15.H.7 — Outbound SMS campaigns (separate from P6.F automation — this is AI-driven)
### P15.H.8 — Caller AI disclosure (regulatory)
Per OQ-007, included on every channel.
### P15.H.9 — Compliance (do-not-call list, time-of-day rules)
### P15.H.10 — Channel performance comparison
Which channel converts best.

---

## PHASE 13-15 COMPLETION CRITERIA

- All 200 PRs merged
- Profit intelligence visible in Salon Envy dashboard
- Kasse Color shipping at Salon Envy with first formula cards stored
- AI Receptionist live, taking actual calls
- A2P 10DLC registered + approved (or in queue)
- KASSE_REAL_BUILD_ORDER.md updated

**After P13-15:** P16-P18 (Marketing Automation, Master Full, Reputation) can run.
