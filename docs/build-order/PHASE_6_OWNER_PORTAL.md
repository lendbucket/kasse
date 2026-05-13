# PHASE 6 — OWNER PORTAL CORE

**Scope:** Full Owner Portal operations: Appointments, Clients, Services, Staff, Payments & Reports, Marketing & Reputation v1, Forms + Inventory + Loyalty + Waitlist + Messages.
**Total PRs:** 240
**Depends on:** P0, P1, P2. P4/P5 needed for full POS depth but Owner Portal core can build with cash-only POS in parallel.
**Reference docs:** KASSE_PORTAL_ARCHITECTURE.md, KASSE_FEATURES.md, KASSE_VERTICALS_EXPANDED.md, KASSE_PHASE_COMMITS.md (Nisha features).

---

## P6.A — Appointments (40 PRs)

### P6.A.1 — Day view calendar — vertical timeline by staff
Files: `app/dashboard/appointments/page.tsx`, `components/calendar/DayView.tsx`
Columns per stylist, rows per 15-min slot. Drag to create. Click to edit. Color by service type.
Acceptance: 10 staff × 12hr day renders <500ms.

### P6.A.2 — Day view: drag-create appointment
Files: `components/calendar/DragCreate.tsx`
Click-drag on empty slot → creates draft → opens edit drawer.
Acceptance: Drag-created appointment persists.

### P6.A.3 — Day view: drag-reschedule
Files: `components/calendar/DragReschedule.tsx`
Click-hold-drag existing appointment to new time/staff. Optimistic UI, server confirms.
Acceptance: Drag updates DB.

### P6.A.4 — Day view: "now" indicator
Files: `components/calendar/NowIndicator.tsx`
Horizontal red line at current time per location timezone. Updates every minute.
Acceptance: Line at correct position.

### P6.A.5 — Day view: alert badges
Files: `components/calendar/AlertBadges.tsx`
Badge on appointment if: client overdue payment, unconfirmed, waiver missing, etc.
Acceptance: Each alert type visible.

### P6.A.6 — Day view: filters
Files: `components/calendar/Filters.tsx`
Filter by staff (multi), service category, status (confirmed/unconfirmed/no-show), tags.
Acceptance: Filters work, persist as SavedView.

### P6.A.7 — Day view: navigation controls
Files: `components/calendar/Nav.tsx`
Today / Prev / Next / Date picker. Keyboard shortcuts (←/→).
Acceptance: All nav works.

### P6.A.8 — Day view: zoom levels (15 / 30 / 60 min slots)
Files: setting
Visual density. Stored per user preference.
Acceptance: Zoom persists.

### P6.A.9 — Day view: print
Files: `app/dashboard/appointments/print/page.tsx`
Printable schedule for front desk daily handoff.
Acceptance: Print preview clean.

### P6.A.10 — Day view: list mode
Files: `components/calendar/ListMode.tsx`
Flat list of today's appointments sortable by time/staff.
Acceptance: Toggle works.

### P6.A.11-15 — Appointment detail drawer (5 PRs)
Edit fields, change status, send reminder, cancel with reason, mark no-show, mark complete, view notes, view forms, refund deposit, rebook, message client, charge no-show fee.

### P6.A.16-20 — Week view (5 PRs)
7-col layout. Stylist filter. Click slot → detail. Drag to reschedule across days.

### P6.A.21-25 — Month view (5 PRs)
Calendar grid. Dot density indicators per day. Click day → drill to day view.

### P6.A.26-30 — Create appointment flow (5 PRs)
Client search + new-client inline. Service + add-on multi-select. Staff assignment (with skill match). Date/time picker. Deposit collect. Confirmation toggles (SMS/email).

### P6.A.31-35 — Reschedule + cancel (5 PRs)
Within-policy reschedule (free). Out-of-policy (fee per policy). Cancel with reason picker. Refund deposit (or not). Notify client.

### P6.A.36 — Recurring appointments
Files: `components/appointments/RecurringEditor.tsx`
Weekly/bi-weekly/monthly. End date or N occurrences. Edit single vs all future.
Acceptance: 6-week recurring creates 6 appts.

### P6.A.37 — Multi-stylist appointments
For services requiring two stylists (color + cut combo).
Acceptance: Both stylists' schedules block.

### P6.A.38 — Family group bookings
Mother + 2 daughters book together. Linked appointments. Single checkout.
Acceptance: Group settles as one bill.

### P6.A.39 — Buffer time between appointments
Per-service buffer (clean up, reset).
Acceptance: Next appointment starts at appt_end + buffer.

### P6.A.40 — Online booking ↔ calendar sync
Public booking page (P11) appears in real-time on staff calendar.
Acceptance: Online-booked appt visible within 5s.

---

## P6.B — Clients (35 PRs)

### P6.B.1 — Client list page
Files: `app/dashboard/clients/page.tsx`
Server-paginated table. Default sort: last visit DESC. Columns: name, phone, email, last visit, lifetime spend, status.
Acceptance: 10k clients page <1s.

### P6.B.2-10 — Client list features (9 PRs)
Search (debounced, fuzzy), filters (tag, segment, last visit range, lifetime spend range, no-show count), sort (multi-column), batch actions (tag, message, export, delete), CSV export, saved views, pagination, density toggle, column customization.

### P6.B.11-20 — Client profile (10 PRs)
6 tabs: Overview (summary), Visits (history table), Transactions (full ledger), Communications (SMS/email log), Notes (free-form + staff attributions), Forms (waivers + intake). Each tab gets its own PR.

### P6.B.21 — Relationship score engine (Nisha N-2)
Files: `lib/clients/relationship-score.ts`
Score 0-100 from: visit frequency, recency, spend, rebook rate, no-show rate. Updated nightly.
Acceptance: Score computes correctly per spec.

### P6.B.22 — VIP flag (auto + manual)
Files: VIP toggle + auto-rule
Auto-VIP if relationship score >85 + LTV >$2000. Manual toggle.
Acceptance: Both paths work.

### P6.B.23 — Win-back list
Files: `app/dashboard/clients/winback/page.tsx`
Clients overdue for visit (>1.5x avg interval). Sorted by LTV DESC. One-click campaign.
Acceptance: List populated by nightly job.

### P6.B.24 — Birthday list
Files: filter
Filter by upcoming birthdays. Auto-message option.
Acceptance: Filter works on Client.dateOfBirth.

### P6.B.25 — Tags on clients
Integrated with P0.G.6 polymorphic Tag.
Acceptance: Tag works per general spec.

### P6.B.26 — Client merge
Files: `app/dashboard/clients/[id]/merge/page.tsx`
Select 2nd client. Conflict resolution UI (which fields to keep). Merge transaction history, notes, family links. Audit-logged.
Acceptance: Duplicate merged. Original ID redirects to surviving.

### P6.B.27 — Client dedup detection
Files: `lib/clients/dedup-detector.ts`
Nightly job. Flag potential dups by phone match, email match, name+last-4-phone match.
Acceptance: Suggested dups visible in admin.

### P6.B.28-32 — Family linking (5 PRs)
Schema: Client.familyId. Add family member. Family group view. Family billing toggle. Minor flag with parent. Family-only retention metrics.

### P6.B.33 — Client export (GDPR/CCPA-ready)
Files: `app/api/clients/[id]/export/route.ts`
JSON + PDF export of all client data. Self-serve via client portal also (P11).
Acceptance: Export contains all fields.

### P6.B.34 — Client deletion (right to be forgotten)
Files: `app/api/clients/[id]/delete/route.ts`
30-day soft delete. Anonymize transactions (legally retained). Confirm dialog with type-to-confirm.
Acceptance: Deleted client gone. Transactions remain anonymized.

### P6.B.35 — Cross-vertical identity per OQ-008
Decision per memory: default to SILOED. Add opt-in cross-link flag for future P6+.
Acceptance: Same person at salon + gym = 2 separate Client records.

---

## P6.C — Services (20 PRs)

### P6.C.1 — Service CRUD
Files: `app/dashboard/services/page.tsx`, `app/dashboard/services/[id]/page.tsx`
List + create + edit + delete + archive (soft delete preserves history).
Acceptance: Full lifecycle works.

### P6.C.2 — Cost fields (Nisha N-1)
Files: edit form
productCost, consumableCost, otherCost. Computes margin = (price - totalCost) / price * 100. Shown live.
Acceptance: Margin updates as costs edited.

### P6.C.3 — Margin display + threshold alerts
Service with margin <40% (configurable) flagged red.
Acceptance: Low-margin services highlighted.

### P6.C.4 — Service categories
Files: schema + UI
Category model (Color, Cut, Treatment, etc.). Per-vertical defaults.
Acceptance: Categories filterable.

### P6.C.5 — Add-ons (extensions of service)
Files: schema + UI
Add-on: e.g., "Olaplex Treatment" added to Color service. Own price, duration.
Acceptance: Add-on selected at booking adds to cart.

### P6.C.6 — Packages (bundles)
Files: schema + UI
"Bridal Package" = consult + trial + day-of. Discounted total. Schedule-able multi-appointment.
Acceptance: Package books 3 linked appointments.

### P6.C.7-10 — Service modifiers (4 PRs)
Length-based (long-hair surcharge $20), complexity (corrective color +50%), assistant required, time of day (peak premium).

### P6.C.11 — Per-service tax (taxable yes/no)
Files: schema field
Services typically non-taxable in TX, products taxable. Per-service override.
Acceptance: Tax computed correctly.

### P6.C.12 — Per-service deposit
Files: schema + UI
Override booking-page default. E.g., color services require $50 deposit.
Acceptance: Deposit collected at online booking.

### P6.C.13 — Per-service cancellation policy
Hours notice + fee per service type.
Acceptance: Cancellation fee enforced.

### P6.C.14 — Per-service commission override
Default commission per Staff. Per-service can override.
Acceptance: Commission attribution uses override.

### P6.C.15 — Service photos
Files: S3 upload
Before/after gallery per service (e.g., Color services). Display on booking page.
Acceptance: Photo upload + display works.

### P6.C.16 — Service descriptions (rich text)
Markdown editor. Display on booking page.
Acceptance: Markdown renders correctly.

### P6.C.17 — Service availability (which staff can perform)
Skill matrix. Service requires "Color Certified" skill → only staff with skill bookable.
Acceptance: Restricted service hides unqualified staff at booking.

### P6.C.18 — Service color (calendar color coding)
Pick color shown on calendar block.
Acceptance: Color applied.

### P6.C.19 — Service display order
Drag-drop order on booking page.
Acceptance: Order persisted.

### P6.C.20 — Service archive/unarchive
Soft delete preserves history but hides from new bookings.
Acceptance: Archived service not selectable; past references intact.

---

## P6.D — Staff (35 PRs)

### P6.D.1 — Staff list + profile pages
Files: `app/dashboard/staff/page.tsx`, `app/dashboard/staff/[id]/page.tsx`
Profile: photo, bio, contact, role, hire date, license info, performance summary.
Acceptance: All fields renderable.

### P6.D.2-10 — Schedule management (9 PRs)
Weekly schedule editor (per-day open/close). Availability blocks. Time-off requests. Approval queue for OWNER. Recurring time-off. Holiday flagging. Coverage suggestions when staff out. Calendar publishing (visible to staff). Shift swaps.

### P6.D.11-15 — Performance stats + goals (5 PRs)
Per-staff dashboard: revenue, clients served, rebook %, retention, no-show rate, avg ticket, tip rate, productivity. Goal setting. Achievement badges.

### P6.D.16-20 — Commission engine (5 PRs)
Flat % commission. Tiered (revenue >$X gets higher %). Per-service commission table. Per-category. Per-product retail. Sliding scale. New-vs-existing client multipliers.

### P6.D.21 — Booth rent model (per KASSE_VERTICALS_EXPANDED.md barbershop)
Files: `app/dashboard/staff/[id]/booth-rent/page.tsx`
Weekly rent amount. Auto-ACH from staff bank account. Late fee.
Acceptance: ACH triggers on schedule.

### P6.D.22 — TDLR license tracking (Texas cosmetology)
Files: `lib/compliance/tdlr.ts`
Per memory: Socrata API integration, cached daily (Vercel serverless = no shared memory). Auto-renewal alerts 30/14/7 days before expiry.
Acceptance: License status updated daily.

### P6.D.23 — Multi-state license tracking
Generic license table beyond TDLR. Future-proof for nationwide expansion.
Acceptance: Schema supports CA, NY, FL cosmetology + healthcare licenses.

### P6.D.24 — Specialty + skill tags
Files: schema
"Color Specialist", "Balayage Certified", "Curly Hair Expert". Drives service-staff matching.
Acceptance: Tags filterable, used in booking.

### P6.D.25 — Staff invitation flow
Email invite → magic link signup → role + commission preset.
Acceptance: Invited user joins org correctly.

### P6.D.26 — Staff deactivation
Soft delete. Preserves transaction history. Re-activatable.
Acceptance: Deactivated staff hidden from new bookings.

### P6.D.27 — Staff custom roles (P0.A.11/12 integration)
Apply custom role at staff edit.
Acceptance: Role drives portal access.

### P6.D.28 — Staff personal info encryption
SSN/EIN encrypted at column level (for 1099/W-2 generation later).
Acceptance: DB inspection shows ciphertext.

### P6.D.29 — Profile photo upload
Cropper, S3.
Acceptance: Photo displayed across portal.

### P6.D.30 — Staff bio (markdown)
Used on public booking page.
Acceptance: Renders correctly.

### P6.D.31 — Staff portfolio (photos)
Linked from Kasse Color formula gallery (P14) and standalone.
Acceptance: Portfolio appears on staff public page.

### P6.D.32 — Staff reviews + ratings
Per-staff CSAT from post-service surveys.
Acceptance: Avg rating displayed.

### P6.D.33 — Staff rebook rate metric
% of clients who book within 6 weeks of last visit.
Acceptance: Metric computed correctly.

### P6.D.34 — Staff retention curve
% of clients still active 30/60/90/180 days after first visit with that staff.
Acceptance: Curve renders.

### P6.D.35 — Staff terminating workflow
Final paycheck. 1099/W-2 export. Off-board checklist (revoke access, remove from schedules).
Acceptance: All steps complete.

---

## P6.E — Payments & Reports (40 PRs)

### P6.E.1-15 — Payments page (15 PRs)
Transaction list, detail drawer, search (id/client/staff/amount), filter (date range/type/status/payment method/staff), batch actions, CSV export, advanced filtering (saved), transaction tags, refund inline, void inline, dispute initiation, audit trail per tx, multi-location aggregation, currency display, surcharge breakdown.

### P6.E.16-25 — Reports v1 — three tiers (10 PRs, per Nisha N-8)
Simple tier (3 reports), Intermediate (10 reports), Advanced (30+ reports). Sales by day/week/month/year, sales by category, sales by staff, sales by client, sales by service, no-show rate, rebook rate, avg ticket, retention rate, top services, etc.

### P6.E.26-35 — Custom report builder (10 PRs)
Field picker, filter builder, group-by selector, aggregate functions, save as SavedView, share with team, schedule auto-email, export CSV/PDF/Excel, custom date range, comparison periods.

### P6.E.36-40 — Receipt + Document Engine (5 PRs)
HTML template engine (Handlebars or similar), per-org branding, multi-language (en-US, es-MX), PDF generation (Puppeteer), email/SMS/print delivery.

---

## P6.F — Marketing + Reputation v1 (30 PRs)

### P6.F.1-15 — Campaign builder (15 PRs)
Audience segmentation (tags, last visit, lifetime spend, no-show history, birthday, custom). SMS/email channel. Personalization tokens ({{firstName}}, {{lastService}}). Scheduling (now, future, recurring). A/B testing (subject line, body). Preview. Test send. Cost estimate (SMS). Approval workflow for large sends. Throttling. Compliance footer (unsubscribe).

### P6.F.16-25 — Automation toggles (10 PRs)
Appointment reminders (24h, 2h). Win-back (lapsed >45 days). Birthday discount. Review request (2h post-service). Abandoned booking recovery. Welcome series (first-time client). Post-service follow-up. No-show follow-up. Rebook reminder (per service cadence). Holiday campaigns.

### P6.F.26-30 — Reviews v1 (5 PRs)
Google Business Profile sync (OAuth per OQ-005). Yelp Fusion API. Aggregated feed in portal. AI-generated response suggestions. Manual response sending.

---

## P6.G — Forms + Inventory + Loyalty + Waitlist + Messages (40 PRs)

### P6.G.1-10 — Forms & Waivers (10 PRs)
Template library per vertical (intake, chemical service waiver, PAR-Q for gyms, HIPAA for med spa). Custom form builder (drag-drop fields). Required fields. Conditional logic. Digital signature. Witness signature. Auto-send to client on appointment booking. Submissions log. Form analytics. Export.

### P6.G.11-20 — Inventory (10 PRs)
Product catalog (name, SKU, price, cost, supplier). Stock count per location. Low-stock alerts. Auto-deduct on service (via Service.consumables). Manual adjust (count, waste, theft). Purchase orders (draft, send, receive). Vendor management. Reorder threshold. Reorder point AI suggestions. Multi-location transfer.

### P6.G.21-30 — Loyalty + Gift Cards (10 PRs)
Loyalty program config (points-per-dollar, redemption rules). Points history per client. Tier system (Bronze/Silver/Gold). Birthday bonus. Referral rewards. Gift card creation (digital + physical). Gift card balance check. Gift card redemption. Outstanding gift card liability report. Gift card analytics.

### P6.G.31-35 — Waitlist (5 PRs, vertical-conditional)
For salon: list-based (clients on waitlist for specific date/staff). For barbershop: queue-based (P23 unique). For restaurant: party-based (P25 unique). Notifications when slot opens. Auto-add from cancellations.

### P6.G.36-40 — Messages (5 PRs)
Two-way SMS via Twilio. Unified inbox per org. Saved responses (templates). Auto-replies (out of hours). Message routing (per-staff inbox vs shared).

---

## PHASE 6 COMPLETION CRITERIA

- All 240 PRs merged
- Salon Envy Corpus Christi + San Antonio running 100% on Kasse for ops (calendar, clients, services, staff, reports)
- Cross-vertical test: spin up restaurant pilot org, all features render appropriately
- All Nisha features (N-1, N-2) shipped
- KASSE_REAL_BUILD_ORDER.md updated

**After P6:** P7 (Master Mini), P9 (Manager Portal), P10 (Staff), P11 (Client), P12 (Kiosk) can all run in parallel.
