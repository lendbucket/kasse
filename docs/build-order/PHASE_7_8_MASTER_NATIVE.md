# PHASE 7 & 8 — MASTER PORTAL v1 + NATIVE iPad POS

**Scope:** Master Portal v1 mini (P7, 60 PRs), Native Kasse iPad app (P8, 100 PRs).
**Total PRs:** 160
**Depends on:** P0 done. P8 also needs P0.E (engine client) for online checkout.
**Parallelizable:** P7 and P8 can run in parallel with each other and with P6.

**Reference docs:** COMMAND_CENTER.md (full Master Portal spec — P17 implements full version), KASSE_STRATEGIC_DECISIONS.md SD-K-009 (iPad-first), SD-K-013 (offline support).

---

# P7 — MASTER PORTAL v1 (60 PRs)

The Mini version — admin essentials to operate the platform with first 100 merchants. Full COMMAND_CENTER.md vision lands in P17.

## P7.A — Admin Layout + Auth (10 PRs)

### P7.A.1 — Admin layout shell
Files: `app/admin/layout.tsx`
Dark theme by default per memory. SUPERADMIN guard at layout level. No standard sidebar.

### P7.A.2 — Admin sidebar (different from merchant portal)
Files: `components/admin/AdminSidebar.tsx`
Sections: Overview, Merchants, Users, Revenue, Transactions, Billing, Operations, Communications, Analytics, Alerts, Security.

### P7.A.3 — Admin top bar
Search across all merchants, all users. Notification stream for platform events.

### P7.A.4 — SUPERADMIN authentication
Hardcoded list of allowed emails in env var initially. Move to DB later.

### P7.A.5 — 2FA required for SUPERADMIN
TOTP only. No SMS.

### P7.A.6 — Admin session timeout
30-minute idle timeout. Re-auth required for sensitive actions.

### P7.A.7 — Admin activity feed
Real-time stream of platform events.

### P7.A.8 — Admin dark mode toggle (default on)
Per-user preference.

### P7.A.9 — Admin keyboard shortcuts
cmd+K opens command palette. shortcuts cheat sheet at "?".

### P7.A.10 — Audit log on every admin action
Already covered by P0.I — verify hooked.

## P7.B — Merchants List + Detail (15 PRs)

### P7.B.1 — Merchants list page
Files: `app/admin/merchants/page.tsx`
All orgs. Default sort: newest first. Columns: name, owner email, vertical, plan, MRR, GPV (last 30d), health score, status.

### P7.B.2 — Merchants filter (10 PRs worth of filters in 1 PR via filter framework)
By plan, vertical, status (active/frozen/canceled/at-risk), country/state, has-Reyna-Pay-active, MRR range, GPV range, health score range, signup source (UTM).

### P7.B.3 — Merchants search (fuzzy)
By business name, owner email, MID, phone.

### P7.B.4 — Merchant detail overview
Files: `app/admin/merchants/[id]/page.tsx`
Read-only. Stats panel: lifetime GPV, MRR, last login, days active, last support ticket, health score.

### P7.B.5 — Merchant detail: Activity tab
Recent transactions, logins, settings changes.

### P7.B.6 — Merchant detail: Financial tab
Plan history, invoices, failed payments, manual credits applied.

### P7.B.7 — Merchant detail: Support tab
All support tickets. Notes from CS team.

### P7.B.8 — Merchant detail: Audit tab
Filtered AuditLog for this org.

### P7.B.9 — Impersonation flow
Files: `app/api/admin/impersonate/route.ts`
SUPERADMIN logs in as merchant OWNER. Persistent red banner during impersonation. Audit-logged.

### P7.B.10 — Impersonation safety
Some actions disabled during impersonation: account deletion, plan changes, payouts changes.

### P7.B.11 — Manual credit application
Apply credit to org's next invoice. Reason required.

### P7.B.12 — Manual plan change
Override merchant's plan. Effective immediately or scheduled.

### P7.B.13 — Manual password reset
Send reset link to owner email. Audit-logged.

### P7.B.14 — Suspend / unsuspend account
Disables login org-wide. Reason required. Email to owner.

### P7.B.15 — Hard delete account
30-day grace then hard delete. Type-to-confirm. Cannot be undone.

## P7.C — Users Management Cross-Org (10 PRs)

### P7.C.1 — All users list
Files: `app/admin/users/page.tsx`
Every User across all orgs. Filter by org, role, last login.

### P7.C.2-10 — User detail, password reset, 2FA disable, login as user, suspend user, audit per user, role change, custom role assignment, email change, account delete.

## P7.D — Platform Revenue + Transactions (10 PRs)

### P7.D.1 — Platform revenue dashboard
Files: `app/admin/revenue/page.tsx`
Total MRR, ARR, GPV. New MRR / Expansion / Churn / Contraction. By plan tier.

### P7.D.2 — Revenue cohort analysis
Monthly cohort retention. Avg revenue per cohort over time.

### P7.D.3 — Transaction monitor (real-time)
Files: `app/admin/transactions/page.tsx`
Live feed of all platform transactions. Filter by amount, vertical, geographic.

### P7.D.4 — Transaction anomaly alerts
Unusually high tx, geo anomaly, velocity check fail.

### P7.D.5 — Billing overview
All Kasse subscriptions. Failed payments queue.

### P7.D.6 — Failed payment recovery workflow
Dunning sequence. Card update prompts.

### P7.D.7 — Manual invoicing
Generate one-off invoice (e.g., for ENTERPRISE custom contract).

### P7.D.8 — Manual refund (Kasse billing)
Refund a subscription charge. Audit-logged.

### P7.D.9 — Net Revenue Retention (NRR) metric
Computed monthly. Visible on revenue dashboard.

### P7.D.10 — Plan upgrade/downgrade analytics
Who's upgrading, who's downgrading. Reasons captured.

## P7.E — Operations + Audit (10 PRs)

### P7.E.1 — Operations dashboard
Files: `app/admin/operations/page.tsx`
Engine health, Twilio queue depth, Resend deliverability, Vercel deploy status, Supabase connection count.

### P7.E.2 — Deployment dashboard
Recent deploys. Rollback button. Manual deploy trigger.

### P7.E.3 — GitHub integration
Recent commits to main. Open PRs awaiting merge.

### P7.E.4 — Error monitoring (Sentry embed)
Top errors last 24h. Per-org error counts.

### P7.E.5 — Performance monitoring
p50/p95/p99 response times per route. Slow query detection.

### P7.E.6 — Database console (read-only SQL)
Run arbitrary SELECT queries. No writes. Audit-logged.

### P7.E.7 — Feature flag console
List all flags. Toggle. Set per-org overrides.

### P7.E.8 — Audit log viewer (full platform)
Search across all orgs.

### P7.E.9 — Basic platform metrics
Active merchants, MRR, GPV, support ticket count, P0 error count.

### P7.E.10 — Health score algorithm
Compute health score per merchant: usage depth, recency, support tickets, churn risk.

## P7.F — Communications Mini (5 PRs)

### P7.F.1 — Broadcast composer
Send announcement to all merchants (subset by filter). Email + in-app.

### P7.F.2 — Support inbox
Incoming support emails / form submissions.

### P7.F.3 — Email template library
Manage system email templates.

### P7.F.4 — In-app notification composer
Push notification to specific merchant(s).

### P7.F.5 — DM to merchant owner
Direct message channel within Kasse.

---

# P8 — NATIVE KASSE iPad POS (100 PRs)

Per SD-K-009 (iPad-first, native priority) and SD-K-013 (offline support required).

## P8.A — Monorepo + Foundation (10 PRs)

### P8.A.1 — Create `lendbucket/kasse-native` monorepo
Expo + EAS Build setup. Yarn workspaces.

### P8.A.2 — Initialize Expo project (iPad target)
Bundle ID `com.kasseapp.ipad`. iPad-only (no iPhone, no Android initially).

### P8.A.3 — TypeScript + ESLint + Prettier config matching web
Shared `tsconfig.base.json`. Same linting rules.

### P8.A.4 — React Navigation + tab/stack setup
Bottom tabs: Today, Calendar, Clients, POS, More. Stack within each.

### P8.A.5 — Theme provider (`@reyna/theme` consumer)
React Native StyleSheet applicator. Same ThemeConfig from web.

### P8.A.6 — Shared package: `@reyna/theme` extraction
Move theme types/defaults from web to shared package. Web + native consume same.

### P8.A.7 — Shared package: `@reyna/ui`
Atomic components (Button, Input, Card) with web + native variants.

### P8.A.8 — Shared package: `@reyna/engine-client`
Engine client extracted. Both platforms use same.

### P8.A.9 — Shared package: `@reyna/types`
TypeScript types shared.

### P8.A.10 — Monorepo CI setup
Lint, type-check, build, test on every PR.

## P8.B — Authentication + Session (10 PRs)

### P8.B.1 — Login screen
Email + password. Magic link option.

### P8.B.2 — Biometric unlock (Face ID / Touch ID)
After first login, biometric unlock subsequent sessions.

### P8.B.3 — Multi-org user (select org on login)
If user member of >1 org, picker.

### P8.B.4 — Session persistence (secure storage)
expo-secure-store. Refresh token kept encrypted.

### P8.B.5 — Token refresh
Auto-refresh access token. Re-auth if refresh expired.

### P8.B.6 — Logout
Clear secure store. Return to login.

### P8.B.7 — Multi-user (staff switching on shared iPad)
"Switch User" without full logout. PIN per staff member.

### P8.B.8 — Inactivity timeout
15-minute inactive → lock to PIN/biometric entry.

### P8.B.9 — Forced logout (from admin)
Push notification → app force-logs-out.

### P8.B.10 — Audit log of app sessions
Sessions tracked server-side.

## P8.C — Day View Calendar (Touch-Optimized) (15 PRs)

### P8.C.1 — Day view layout (landscape iPad)
Multi-stylist columns. 15-min slots. Pan/zoom.

### P8.C.2 — Pinch to zoom (slot density)
2-finger pinch changes time slot height.

### P8.C.3 — Drag to create appointment
Long-press empty slot → drag-extend → release → opens edit modal.

### P8.C.4 — Drag to reschedule
Long-press appointment → drag → release.

### P8.C.5 — Tap to edit
Tap appointment → bottom sheet with details.

### P8.C.6 — Status indicators on appointment
Color/badge for unconfirmed, checked-in, no-show.

### P8.C.7 — Now indicator (red line)
Updates every minute.

### P8.C.8 — Day navigation (swipe between days)
Horizontal swipe → previous/next day.

### P8.C.9 — Date picker (calendar modal)
Native iOS date picker.

### P8.C.10 — Filter sheet
Bottom sheet with filters (staff, service, status).

### P8.C.11 — Print to AirPrint
Standard iOS print sheet.

### P8.C.12 — Refresh on pull-down
Standard iOS gesture.

### P8.C.13 — Loading states (skeletons)
While fetching, show shimmer placeholders.

### P8.C.14 — Empty state
"No appointments today" with CTA.

### P8.C.15 — Performance: virtualized rendering
Large day with 100+ appointments scrolls 60fps.

## P8.D — Appointment Management (10 PRs)

### P8.D.1 — Create appointment modal
Touch-optimized form. Client search (large hit areas).

### P8.D.2 — Edit appointment
Same modal as create, pre-filled.

### P8.D.3 — Cancel with reason
Reason picker. Optional refund.

### P8.D.4 — Check-in flow
Tap "Check In" → status flips → notify stylist via push.

### P8.D.5 — No-show flow
Mark no-show → charge fee per policy.

### P8.D.6 — Reminder send
Manual reminder SMS/email.

### P8.D.7 — Notes editing
Quick add note from appointment view.

### P8.D.8 — Photo attachment
iPad camera → photo to appointment.

### P8.D.9 — Multi-appointment booking (recurring)
Same recurring UI as web.

### P8.D.10 — Family group booking
Same as web.

## P8.E — Client Search + Profile (10 PRs)

### P8.E.1 — Client search screen
Tap search → large input → debounced results. Recent search history.

### P8.E.2 — Result rows (touch-optimized)
Photo + name + last visit + lifetime spend. Large hit area.

### P8.E.3 — Client profile (tabs)
Overview, Visits, Transactions, Notes, Forms. Same data as web.

### P8.E.4 — Create new client
Inline form. Required: name + phone. Photo optional.

### P8.E.5 — Edit client
All fields editable.

### P8.E.6 — Add note
Quick-note button on profile.

### P8.E.7 — Send message (SMS)
Inline composer. Templates available.

### P8.E.8 — View formula history (salon)
Color formula cards (P14 ships full).

### P8.E.9 — Family group view
Linked family members.

### P8.E.10 — VIP indicators
VIP badge prominently.

## P8.F — POS Checkout (Touch-Optimized) (20 PRs)

### P8.F.1 — Cart screen (large layout)
Service grid for tap-to-add. Cart side panel.

### P8.F.2 — Service category tabs
Per VerticalConfig categories.

### P8.F.3 — Search products/services
Spotlight-style search.

### P8.F.4 — Custom item entry (one-off price)
Type description + amount.

### P8.F.5 — Discount entry
Amount or %. Reason field.

### P8.F.6 — Client attach
Search + attach. Walk-in default.

### P8.F.7 — Staff assignment per item
Tap item → assign to staff (for commission attribution).

### P8.F.8 — Card-present (Payroc Terminal SDK)
Tap "Pay" → terminal prompts swipe/tap.

### P8.F.9 — Card-not-present (manual entry)
Hosted Fields embed via WebView.

### P8.F.10 — Apple Pay button
Native Apple Pay sheet.

### P8.F.11 — Cash tender
Number pad. Quick buttons ($20, $40, $50, $100).

### P8.F.12 — Gift card scan/enter
Camera scan barcode OR manual entry.

### P8.F.13 — Tip prompt (custom-built, large buttons)
Pre-set + custom.

### P8.F.14 — Signature capture (on-screen)
Customer signs on iPad screen.

### P8.F.15 — Receipt: email
Pre-filled if client has email.

### P8.F.16 — Receipt: SMS
Pre-filled if client has phone.

### P8.F.17 — Receipt: print
AirPrint to receipt printer.

### P8.F.18 — Split tender (multi-method)
Sequential prompts.

### P8.F.19 — Refund flow
Past transaction → refund full/partial.

### P8.F.20 — Receipt re-print
Past transaction → re-print.

## P8.G — Offline Mode (15 PRs)

### P8.G.1 — SQLite local store (WatermelonDB or similar)
Cache: today's appointments, all clients (last 90 days), services, staff.

### P8.G.2 — Sync engine
Background sync every 30s when online. Differential.

### P8.G.3 — Conflict resolution
Server wins on conflicts (most recent updatedAt).

### P8.G.4 — Offline indicator
Banner when offline. Yellow.

### P8.G.5 — Offline checkout queue
Card-not-present blocked offline. Card-present terminal still works (terminal has its own connectivity). Cash always works.

### P8.G.6 — Queued transactions
Offline cash/manual checkouts queued. Sync on reconnect with idempotency key.

### P8.G.7 — Offline appointment creation
Queued. Sync on reconnect.

### P8.G.8 — Offline appointment edit
Queued. Sync on reconnect.

### P8.G.9 — Offline note add
Queued.

### P8.G.10 — Offline client create
Queued. Server assigns ID on sync.

### P8.G.11 — Sync errors UI
Per-queued-item retry/discard.

### P8.G.12 — Manual sync trigger
Pull-down + button.

### P8.G.13 — Data freshness indicator
"Last synced 2 min ago".

### P8.G.14 — Cache management
Old data pruned (>90 days).

### P8.G.15 — Offline analytics
Track offline-time metrics.

## P8.H — App Store + Distribution (10 PRs)

### P8.H.1 — App Store Connect setup
Apple Developer enrolment, app record creation.

### P8.H.2 — Icon + splash screen design
Branded per Kasse design system.

### P8.H.3 — Screenshots (per iPad screen size)
Required: 12.9" + 11" iPad screenshots.

### P8.H.4 — App Store listing copy
Description, keywords, support URL, privacy URL.

### P8.H.5 — TestFlight beta
Invite Salon Envy team + select pilot merchants.

### P8.H.6 — Production submission
Apple review submission.

### P8.H.7 — Submit-to-review automation
EAS Build → EAS Submit pipeline.

### P8.H.8 — OTA updates (Expo updates)
Non-native changes pushed without App Store re-submit.

### P8.H.9 — Crash reporting (Sentry RN)
Native + JS crashes captured.

### P8.H.10 — Analytics (PostHog or Amplitude RN)
Session, screen view, key event tracking.

---

## PHASE 7 & 8 COMPLETION CRITERIA

- All 160 PRs merged
- Master Portal v1 functional for SUPERADMIN operations
- Kasse iPad app live on App Store
- Salon Envy uses iPad at checkout (pilots)
- Offline mode tested with airplane mode
- KASSE_REAL_BUILD_ORDER.md updated

**After P7/P8:** Manager (P9), Staff (P10), Client (P11), Kiosk (P12) can run in parallel.
