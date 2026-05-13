# PHASE 4 & 5 — REAL POS + DEVICE MANAGEMENT

**Scope:** Wire Kasse to Reyna Pay for live card processing (P4, 80 PRs), Terminal and device management (P5, 40 PRs).
**Total PRs:** 120
**Depends on:** P0.E + P0.F merged, Reyna Pay engine live in test.
**Status:** `[GATED: REYNA_PAY]` — entire phase blocked until engine signal.

**Reference docs:** REYNA_PAY_API_SPEC.md (locked engine contract), KASSE_ENGINE_BOUNDARY.md, KASSE_STRATEGIC_DECISIONS.md SD-001 (Payroc-only), KASSE_OPEN_QUESTIONS.md OQ-001 (Terminal SDK decision).

---

# P4 — REYNA PAY INTEGRATION + POS (80 PRs)

## P4.A — Engine Connectivity + Health Checks (10 PRs)

### P4.A.1 — Health check endpoint poll
Files: `lib/engine/health.ts`, `app/api/health/engine/route.ts`
GET `/v1/health` on engine every 30s background. Cache result 60s. Expose to internal admin status panel.
Acceptance: Engine outage detected within 60s. Status flips in admin within 90s.

### P4.A.2 — Env var validation on boot
Files: `lib/env.ts`, `next.config.ts` (extend)
Validate REYNA_PAY_BASE_URL, REYNA_PAY_API_KEY, REYNA_PAY_WEBHOOK_SECRET present at boot. Fail fast with clear error if missing in production.
Acceptance: Server refuses to start if any required env var missing.

### P4.A.3 — Engine version compatibility check
Files: `lib/engine/version.ts`
On boot, fetch engine `/v1/version`. Compare to expected min version in code. Warn in logs if mismatch. Block hard if breaking-version mismatch.
Acceptance: Logs version mismatch warning. Hard block tested with mock.

### P4.A.4 — Engine status indicator in Master Portal
Files: `app/admin/operations/engine/page.tsx`
SUPERADMIN-only. Shows engine health, version, last successful call, error rate (last 1h/24h), p50/p95/p99 response times.
Acceptance: Renders correctly. Auto-refreshes every 30s.

### P4.A.5 — Engine outage detection + fallback to cash-only
Files: `lib/engine/circuit-breaker.ts`
Circuit breaker: 5 failures in 60s → OPEN for 30s. While OPEN, POS shows "Card processing temporarily unavailable, cash only" banner.
Acceptance: Simulated engine outage triggers banner within 60s. Auto-recovers after 30s.

### P4.A.6 — Request ID propagation engine ↔ Kasse
Files: `lib/engine/client.ts` (extend)
Every engine call sends `X-Request-Id` header from Kasse request context. Logged on both sides.
Acceptance: Trace single user action across Kasse + Engine logs via Request ID.

### P4.A.7 — Engine error code → user-facing error message mapping
Files: `lib/engine/errors.ts`
Map every engine error code (per REYNA_PAY_API_SPEC.md error reference) to user-facing copy in en-US + es-MX. Generic fallback for unknown codes.
Acceptance: All ~40 documented error codes mapped. Unit test asserts coverage.

### P4.A.8 — Engine response time monitoring
Files: `lib/engine/client.ts` (instrument)
Every call records duration. Aggregated p50/p95/p99 published to Sentry performance + custom dashboard.
Acceptance: Response time dashboard in Master Portal populated.

### P4.A.9 — Rate limit handling (backoff + queue)
Files: `lib/engine/rate-limit.ts`
On 429, exponential backoff (1s, 2s, 4s, 8s, 16s). Surface "Slow down" only on persistent fail. Queue critical writes.
Acceptance: 5 rapid calls trigger 1 retry-with-backoff; user transparent.

### P4.A.10 — Engine integration smoke test in CI
Files: `tests/engine-smoke.test.ts`, `.github/workflows/ci.yml` (extend)
On every PR, hit engine sandbox `/v1/health` + create-test-merchant + create-test-charge + refund. Catches breaking changes.
Acceptance: CI fails if engine smoke test fails.

## P4.B — Merchant Boarding to Engine (15 PRs)

### P4.B.1 — Onboarding wizard step 4 wire-up (replaces P1.C.4.2 stub)
Files: `app/onboarding/wizard/step-4-payments/page.tsx` (update)
Replace gated stub with live `engine.applications.create()` call. Pass orgId, businessName, EIN, address, beneficial owners.
Acceptance: Real application created in engine. Status visible in wizard.

### P4.B.2 — Application form submit → engine `POST /merchants/applications`
Files: `app/api/onboarding/apply/route.ts`
Server route. Validates payload (Zod). Calls `lib/engine/application.create()`. Stores application ID on Organization.
Acceptance: Form submit creates engine application, persists ID.

### P4.B.3 — KYC document upload pipeline
Files: `app/api/onboarding/documents/route.ts`, `lib/storage/s3.ts` (extend)
Multi-part upload. Server-side virus scan (ClamAV). Posts each doc to engine `POST /merchants/applications/:id/documents`.
Acceptance: Upload ID/SSN/voided-check, all reach engine. Virus EICAR test rejected.

### P4.B.4 — OFAC screening webhook handler
Files: `app/api/webhooks/reynapay/ofac/route.ts`
Receives OFAC result. Updates `Organization.kycStatus`. If FLAGGED → set application status, alert SUPERADMIN.
Acceptance: Webhook handles CLEAR/FLAG/REVIEW states.

### P4.B.5 — MCC code selection per vertical
Files: `lib/verticals/mcc-mapping.ts`
Map VerticalId → MCC code (salon=7230, barbershop=7230, restaurant=5812, gym=7991, med_spa=8099, etc.). Auto-set on application.
Acceptance: All 33 verticals have correct MCC mapped per Payroc's list.

### P4.B.6 — Bank account verification (Plaid micro-deposits)
Files: `app/api/onboarding/bank/route.ts`, `lib/plaid/index.ts`
Plaid Link → instant verification OR fallback to micro-deposits (2 small deposits, user verifies amounts in 1-3 days).
Acceptance: Both paths work end-to-end in sandbox.

### P4.B.7 — Beneficial owner data capture (multi-owner support)
Files: `components/onboarding/BeneficialOwnersForm.tsx`
Add up to 4 owners with >25% stake. Name, DOB, SSN (last 4), address. Required per CIP/BSA.
Acceptance: Multi-owner submission reaches engine, each with full data.

### P4.B.8 — PCI SAQ-A auto-fill questionnaire
Files: `app/onboarding/wizard/step-4-payments/saq/page.tsx`
12-question SAQ-A. Most answers auto-filled (Kasse is PCI-compliant ISV using tokenization). Owner just confirms + signs.
Acceptance: SAQ-A submitted. PDF copy stored.

### P4.B.9 — MSA + Schedule A + W-9 e-sign integration
Files: `app/onboarding/wizard/step-4-payments/sign/page.tsx`, `lib/esign/index.ts`
Render MSA + Schedule A pricing + W-9 in scrollable viewer. Signature capture. Timestamped, IP-logged, hash-stored.
Acceptance: All three docs signed in one flow. PDFs stored S3 with hash.

### P4.B.10 — Application status tracking UI (timeline)
Files: `app/dashboard/settings/payments/application/page.tsx`
Timeline: Submitted → Underwriting Review → Site Inspection (if needed) → Decision. Each step with date + sub-status.
Acceptance: All status transitions render correctly.

### P4.B.11 — Underwriter communication threading
Files: `app/dashboard/settings/payments/application/messages/page.tsx`
Inbound from Payroc underwriter visible. Reply box. Document re-upload if requested.
Acceptance: Message exchange tested with engine mock.

### P4.B.12 — Approval webhook handler (P0.F.7 wire-up)
Files: `app/api/webhooks/reynapay/application/route.ts` (update)
On `application.approved`: set `Organization.reynaPayActive=true`, `reynaPayMerchantId`, trigger terminal ship workflow, send welcome email.
Acceptance: Approval webhook fires all downstream actions.

### P4.B.13 — Decline workflow
Files: `app/dashboard/settings/payments/declined/page.tsx`
Show decline reason (from engine). Appeal path (re-submit with corrections). 30-day cooldown if needed.
Acceptance: Decline state renders, appeal submission works.

### P4.B.14 — Risk profile classification handler
Files: `app/api/webhooks/reynapay/risk-profile/route.ts`
Low/Medium/High risk → set `Organization.depositSchedule`, `Organization.rollingReservePct`.
Acceptance: Each risk level correctly sets schedule + reserve.

### P4.B.15 — Terminal ship trigger on APPROVED
Files: `lib/onboarding/terminal-ship.ts`
On approval, create TerminalOrder record. Notify fulfillment. Track shipping. Email tracking number to owner.
Acceptance: Approval → ship order created → tracking email sent.

## P4.C — Real POS Checkout (25 PRs)

### P4.C.1 — Checkout route + UI shell
Files: `app/dashboard/checkout/page.tsx` (rewrite from current stub)
Two-column layout: cart left, payment right. Mobile responsive.
Acceptance: Loads in <1s. No layout shift.

### P4.C.2 — Cart builder
Files: `components/checkout/Cart.tsx`, `components/checkout/CartItem.tsx`
Add line items: services (with stylist assignment), products, gift cards, tips. Discount line. Tax computed live.
Acceptance: Add 5 services, 2 products, $10 discount → total correct including tax.

### P4.C.3 — Client lookup integration
Files: `components/checkout/ClientSearch.tsx`
Search by name/phone/email. Show last visit, saved cards, gift card balance, loyalty points. "Walk-in" option.
Acceptance: Type 3 chars → debounced results. Select → cart attached to client.

### P4.C.4 — Card-present terminal flow (Payroc Terminal SDK) `[VERIFY: OQ-001]`
Files: `lib/payroc/terminal-sdk.ts`, `components/checkout/TerminalPayment.tsx`
Initialize SDK. Send amount to paired terminal. Wait for swipe/tap/insert. Receive token + auth result.
Acceptance: Sandbox card-present transaction completes end-to-end. `[VERIFY against actual Payroc Terminal SDK API once OQ-001 resolved]`

### P4.C.5 — Card-not-present Hosted Fields flow
Files: `app/dashboard/checkout/checkout-form.tsx` (PROTECTED — extend carefully), `lib/payroc/hosted-fields.ts` (PROTECTED)
Existing protected files. Add CNP charge path: card → token → engine charge → response.
Acceptance: CNP transaction tested against current SalonTransact prod flow.

### P4.C.6 — Apple Pay integration (domain-verified)
Files: `lib/payments/apple-pay.ts`, `public/.well-known/apple-developer-merchantid-domain-association`
Existing domain verification deployed for reynapay.com per memory. Apple Pay button on checkout. Validates merchant, processes via engine.
Acceptance: Apple Pay button works in Safari on iOS + macOS.

### P4.C.7 — Google Pay integration
Files: `lib/payments/google-pay.ts`
Console account BCR2DN5T42R272BT, worldnet gateway, gatewayMerchantId 6535001 per memory. Button on checkout.
Acceptance: Google Pay works in Chrome Android + desktop.

### P4.C.8 — Saved card flow (Secure Token)
Files: `components/checkout/SavedCards.tsx`
List saved cards for client. Tap → charge via Secure Token. SalonTransact maintains email-to-secureTokenId search index (per memory: gateway isn't system of record).
Acceptance: Repeat customer charges saved card in <3 taps.

### P4.C.9 — Cash payment path
Files: `components/checkout/CashPayment.tsx`
Amount tendered input. Change calculation. Mark Transaction.paymentMethod = CASH. Open cash drawer if connected.
Acceptance: $50 tendered for $43.21 → change $6.79 displayed.

### P4.C.10 — Gift card redemption
Files: `components/checkout/GiftCardRedeem.tsx`
Enter gift card code → check balance → apply to cart. Partial redemption supported. Update remaining balance.
Acceptance: $25 gift card redeemed against $30 ticket → $5 due remaining.

### P4.C.11 — Split payment (multi-method)
Files: `components/checkout/SplitPayment.tsx`
Pay $30 cash + $20 card + $10 gift card. UI allocates amounts. Each method processed independently.
Acceptance: 3-method split of $60 ticket settles all amounts, single transaction record.

### P4.C.12 — Split payment (multi-card)
Same as P4.C.11 but multiple cards. Common for friend groups.
Acceptance: 2-card split processed.

### P4.C.13 — Tip prompt
Files: `components/checkout/TipPrompt.tsx`
Preset buttons (15%, 18%, 20%, 25%, custom). Per-stylist tip allocation if multi-service.
Acceptance: Preset selections compute correctly. Custom amount validated.

### P4.C.14 — Signature capture
Files: `components/checkout/Signature.tsx`
react-signature-canvas. Stored as base64 PNG on Transaction.
Acceptance: Sig captured for CP transactions ≥$25.

### P4.C.15 — Surcharge support (mandatory Payroc surcharge)
Files: `lib/payments/surcharge.ts`
Per SalonTransact ISV agreement, surcharging mandatory. Configurable per-location % (default 3.5%). Applied to card transactions only.
Acceptance: Card transaction shows surcharge line. Cash transactions do not.

### P4.C.16 — Receipt generation (email, SMS, print)
Files: `lib/receipts/generate.ts`, `app/api/receipts/[id]/route.ts`
HTML template per Organization branding. Email via Resend. SMS via Twilio. Print via printer driver. PDF available.
Acceptance: Receipt sent via all 3 channels. PDF downloadable.

### P4.C.17 — Refund flow (full + partial)
Files: `app/dashboard/transactions/[id]/refund/page.tsx`
SUPERADMIN-PROTECTED file `app/master/refunds/refunds-debug-client.tsx` is on protected list per memory — extend carefully. Refund creates engine refund + Kasse Transaction(type=REFUND).
Acceptance: Full refund + 50% partial refund both work. Commission reversed.

### P4.C.18 — Void flow (same-day vs settled)
Files: `lib/payments/void.ts`
Same-day before batch close → engine void (no fee). Settled → forces refund path.
Acceptance: Pre-batch void uses void endpoint. Post-batch uses refund.

### P4.C.19 — Commission attribution (auto-record on checkout)
Files: `lib/commissions/attribute.ts`
On checkout success, compute commission per service per stylist. Insert CommissionLine rows.
Acceptance: $100 service @ 50% commission → CommissionLine of $50 for assigned stylist.

### P4.C.20 — Tip distribution recording
Files: `lib/tips/distribute.ts`
Record TipDistribution rows. Per Staff.tipShareRules (set in P19 payroll).
Acceptance: $20 tip on $100 service correctly allocated.

### P4.C.21 — Customer save-card prompt
Files: `components/checkout/SaveCardPrompt.tsx`
After successful card transaction, prompt "Save card on file for future visits?" Tokenizes via Secure Token.
Acceptance: Saved card appears on next visit's checkout.

### P4.C.22 — Receipt re-print flow
Files: `app/dashboard/transactions/[id]/page.tsx` (action)
"Reprint" button on any past transaction. Same receipt template, marked as REPRINT.
Acceptance: Reprint logged. Receipt marked "REPRINT" header.

### P4.C.23 — Checkout transaction audit log
Files: `lib/audit/checkout.ts`
Every checkout action logged: cart-changed, discount-applied, override-price, etc.
Acceptance: Audit trail visible in Transaction detail.

### P4.C.24 — Checkout error recovery
Files: `lib/checkout/recovery.ts`
Network drop mid-charge: prompt user, retry with same idempotency key. Engine reconciles.
Acceptance: Simulated network drop → no double charge after retry.

### P4.C.25 — End-of-shift summary
Files: `app/dashboard/checkout/end-of-shift/page.tsx`
Per-stylist: services performed, tickets, tips, commission, cash drawer count.
Acceptance: Summary matches Transactions table totals.

## P4.D — Webhooks from Engine (10 PRs)

### P4.D.1 — Webhook receiver endpoint (signature verification)
Files: `app/api/webhooks/reynapay/route.ts`
Verify HMAC-SHA256 signature with REYNA_PAY_WEBHOOK_SECRET. Reject if invalid. Idempotent via event ID.
Acceptance: Bad signature rejected 401. Duplicate event ID ignored.

### P4.D.2 — charge.succeeded handler
Files: `lib/webhooks/handlers/charge-succeeded.ts`
Updates Transaction.status=SUCCEEDED. Fires post-payment automations (review request, rebook reminder).
Acceptance: Transaction state flips on webhook.

### P4.D.3 — charge.failed handler
Files: `lib/webhooks/handlers/charge-failed.ts`
Transaction.status=FAILED. Mark CommissionLine voided. Notify staff at terminal.
Acceptance: Failed charge correctly marks all related rows.

### P4.D.4 — refund.created/succeeded handler
Files: `lib/webhooks/handlers/refund.ts`
Refund recorded. Commission reversed. Loyalty points clawed back.
Acceptance: All downstream effects applied.

### P4.D.5 — payout.created handler
Files: `lib/webhooks/handlers/payout.ts`
Create Payout row. Reconcile against expected. Alert if mismatch >$1.
Acceptance: Payout webhook creates Payout record.

### P4.D.6 — dispute.created/updated handler
Files: `lib/webhooks/handlers/dispute.ts`
Create Dispute row. Trigger evidence assembly job (P4.E.4). Notify OWNER.
Acceptance: Dispute renders in /disputes within 60s.

### P4.D.7 — merchant.status.changed handler
Files: `lib/webhooks/handlers/merchant-status.ts`
Update Organization.reynaPayStatus. SUSPENDED → block POS. CLOSED → freeze account.
Acceptance: SUSPENDED webhook disables POS.

### P4.D.8 — Webhook retry + dead-letter queue
Files: `lib/webhooks/retry.ts`, `prisma/schema.prisma` (WebhookEvent table)
Failed handlers retry 3x with backoff. Permanent failure → DLQ table. Admin can replay.
Acceptance: Failing handler eventually lands in DLQ.

### P4.D.9 — Webhook replay tooling for admins
Files: `app/admin/webhooks/page.tsx`
SUPERADMIN view of WebhookEvent log. Replay single event. Replay range.
Acceptance: Replay re-runs handler idempotently.

### P4.D.10 — Webhook event audit log
Files: integrated with P0.I AuditLog
Every webhook received logged with eventId, type, orgId, processedAt.
Acceptance: Audit trail searchable.

## P4.E — Dispute Management UI (10 PRs)

### P4.E.1 — Disputes page list view
Files: `app/dashboard/disputes/page.tsx`
List by status (NEEDS_RESPONSE, UNDER_REVIEW, WON, LOST). Default sort by responseBy ASC.
Acceptance: Renders in <1s. Filter works.

### P4.E.2 — Dispute detail drawer
Files: `app/dashboard/disputes/[id]/page.tsx`
Show reason, amount, transaction, evidence checklist, response deadline countdown.
Acceptance: All dispute fields render.

### P4.E.3 — Evidence upload UI
Files: `components/disputes/EvidenceUpload.tsx`
Drag-drop receipts, signed waivers, photos, communications, custom notes. Up to 10 files per dispute.
Acceptance: Upload works for PDF, JPG, PNG, ≤10MB each.

### P4.E.4 — Evidence assembly (auto-attach)
Files: `lib/disputes/assemble-evidence.ts`
On dispute.created, auto-attach: original Receipt, AppointmentNote, signed Waiver, SMS log with client. Owner reviews + adds.
Acceptance: New dispute has 4+ auto-evidence items attached.

### P4.E.5 — Submit evidence to engine
Files: `app/api/disputes/[id]/submit/route.ts`
Posts evidence package to engine `POST /disputes/:id/evidence`. Updates Dispute.status=UNDER_REVIEW.
Acceptance: Submission reaches engine. Status updates.

### P4.E.6 — Dispute status timeline
Files: `components/disputes/Timeline.tsx`
Filed → Evidence Submitted → Network Review → Outcome. Dates each step.
Acceptance: All transitions render with timestamps.

### P4.E.7 — Dispute outcome notification
Files: `lib/disputes/notify-outcome.ts`
On WON/LOST webhook, email + in-app notification to OWNER.
Acceptance: Both outcomes trigger notifications.

### P4.E.8 — Dispute alerts in dashboard
Files: `components/dashboard/AlertsPanel.tsx`
"3 disputes need response in next 48h" banner if Dispute.responseBy < 48h.
Acceptance: Banner appears on dashboard when criteria met.

### P4.E.9 — Dispute analytics (rate, resolution rate by reason)
Files: `app/dashboard/disputes/analytics/page.tsx`
Dispute rate = disputes / transactions. By reason code. Resolution rate (WON / total resolved).
Acceptance: Computed correctly against test data.

### P4.E.10 — Chargeback fee accounting
Files: `lib/accounting/chargeback-fees.ts`
Each dispute incurs fee (typically $25). Logged as Expense category=Chargeback.
Acceptance: Fee appears in P&L expenses.

## P4.F — Payout View + Reconciliation (10 PRs)

### P4.F.1 — Payouts page list view
Files: `app/dashboard/payouts/page.tsx`
List by date DESC. Status (PENDING, IN_TRANSIT, PAID). Amount + count of transactions.
Acceptance: Renders correctly.

### P4.F.2 — Payout detail (line items)
Files: `app/dashboard/payouts/[id]/page.tsx`
Per-transaction breakdown: gross, fee, net. Refunds. Chargebacks. Total reconciled to net amount.
Acceptance: Line item totals = payout net.

### P4.F.3 — Settlement schedule display
Files: `components/payouts/SettlementSchedule.tsx`
Org's deposit cadence (per Reyna Pay risk profile). T+1 / T+2 / Weekly. Next expected deposit date.
Acceptance: Schedule matches Organization.depositSchedule.

### P4.F.4 — Pending amounts
Files: `components/payouts/PendingPanel.tsx`
In-transit (today's batch), Holdback (1-3 days), Rolling Reserve (per risk profile).
Acceptance: 3 buckets sum to correct total.

### P4.F.5 — Daily reconciliation report
Files: `app/dashboard/reports/reconciliation/page.tsx`
Today's Transactions × surcharge × tip - fees = expected payout. Variance flagged.
Acceptance: Recon matches engine within $0.01.

### P4.F.6 — Mismatched transaction alerts
Files: `lib/reconciliation/mismatch-detector.ts`
Nightly cron. If Kasse transaction missing from engine OR vice versa → alert SUPERADMIN.
Acceptance: Simulated drift triggers alert.

### P4.F.7 — Bank account ACH credit notification
Files: `lib/webhooks/handlers/ach-credit.ts`
On engine `payout.paid` webhook, send "$X just deposited into your account" SMS + email.
Acceptance: Notification fires within 5 min of credit.

### P4.F.8 — Payout statement download (CSV/PDF)
Files: `app/api/payouts/[id]/statement/route.ts`
Generate CSV (every transaction) and PDF (summary). S3-stored for archive.
Acceptance: Both formats download correctly.

### P4.F.9 — Year-end 1099-K access
Files: `app/dashboard/payouts/tax-docs/page.tsx`
1099-K from engine (Payroc issues). PDF download. Mailed Jan 31.
Acceptance: 1099-K downloadable post-Jan 31.

### P4.F.10 — Multi-location payout split (if separate MIDs)
Files: `lib/payouts/multi-location.ts`
If org has multiple MIDs (e.g., franchise locations), each gets its own payout stream. Owner sees aggregate.
Acceptance: 2-location org gets 2 daily payouts; aggregate view sums.

---

# P5 — DEVICE & TERMINAL MANAGEMENT (40 PRs)

## P5.A — Terminal Pairing + PIN (10 PRs)

### P5.A.1 — Terminal pairing flow (pairing code)
Files: `app/dashboard/settings/devices/pair/page.tsx`, `lib/devices/pair.ts`
Generate 6-digit code with 5-min TTL. User enters on terminal. Engine validates and bonds terminal to org/location.
Acceptance: Pair code works once. Expires after 5 min.

### P5.A.2 — Pairing UI on iPad app + web
Same flow callable from web settings + iPad (when P8 ships).
Acceptance: Both surfaces complete pairing.

### P5.A.3 — Terminal nickname assignment
Files: `app/dashboard/settings/devices/[id]/page.tsx`
"Front Desk 1", "Stylist Station 3", etc. Used in Operator field per Payroc API.
Acceptance: Nickname appears on receipts + transaction logs.

### P5.A.4 — Terminal status indicator
Files: `components/devices/TerminalStatus.tsx`
Online / Offline / Idle / In Use / Battery Low. Engine pushes heartbeat. >5min no heartbeat → Offline.
Acceptance: Status flips correctly within 5 min of state change.

### P5.A.5 — Per-terminal PIN (manager-only)
Files: `app/dashboard/settings/devices/[id]/pin/page.tsx`
Set 4-6 digit PIN. Required on terminal boot if enabled. Encrypted at rest.
Acceptance: PIN entry blocks unauthorized access.

### P5.A.6 — Terminal-to-location assignment
Files: pairing flow
Default to pairing user's current location. Changeable in settings.
Acceptance: Multi-location org pairs terminal to correct location.

### P5.A.7 — Terminal-to-stylist assignment (Operator field)
Files: `lib/devices/operator.ts`
Operator field on Payroc transactions = current stylist at terminal. Used for commission attribution + audit.
Acceptance: Transactions show correct Operator value.

### P5.A.8 — Auto-pair via QR code
Files: `components/devices/QrPair.tsx`
Generate QR with pairing code + URL. Terminal scans → auto-fills.
Acceptance: QR scan completes pairing without manual entry.

### P5.A.9 — Terminal removal flow (revoke)
Files: `app/dashboard/settings/devices/[id]/remove/page.tsx`
Confirm dialog. Removes terminal record + revokes engine credentials. Terminal stops functioning.
Acceptance: Removed terminal can't process new charges.

### P5.A.10 — Terminal pairing audit log
Files: integrated AuditLog
Every pair/unpair logged with actor, IP, terminal serial.
Acceptance: Audit trail visible to OWNER + SUPERADMIN.

## P5.B — Multi-Terminal Per Location (10 PRs)

### P5.B.1 — Schema: multiple Terminal rows per Location
Files: `prisma/schema.prisma`
```prisma
model Terminal {
  id           String @id @default(cuid())
  organizationId String
  locationId   String
  serialNumber String @unique
  model        String  // "PAX A920 Pro", "Pax A77", etc.
  nickname     String?
  status       String  // ONLINE | OFFLINE | IDLE | IN_USE
  lastHeartbeat DateTime?
  // ...
}
```

### P5.B.2 — Active terminal switcher in checkout
Files: `components/checkout/TerminalSwitcher.tsx`
Dropdown if location has >1 terminal. Last-used remembered per user.
Acceptance: User can switch mid-shift.

### P5.B.3 — Per-terminal transaction routing
Files: `lib/checkout/route-to-terminal.ts`
Charge goes to selected terminal only. Others receive no command.
Acceptance: Concurrent charges on 2 terminals isolated.

### P5.B.4 — Terminal usage analytics
Files: `app/dashboard/reports/terminals/page.tsx`
Tx count, avg ticket, uptime % per terminal.
Acceptance: Stats accurate vs Transaction table.

### P5.B.5 — Terminal grouping (front-desk vs floating)
Files: prisma extension + UI
Tag terminals. Front-desk = fixed at counter. Floating = stylist-roaming.
Acceptance: Tags filterable.

### P5.B.6 — Concurrent transaction handling
Files: terminal SDK queue
Each terminal has its own queue. Cross-terminal independent.
Acceptance: 2 concurrent charges succeed.

### P5.B.7 — Terminal load balancing
Files: `lib/devices/load-balance.ts`
For floating use, suggest least-busy terminal.
Acceptance: Suggested terminal has lowest active count.

### P5.B.8 — Per-terminal receipt printer mapping
Files: `app/dashboard/settings/devices/[id]/printer/page.tsx`
Each terminal can route receipts to a specific printer.
Acceptance: Receipt prints to correct printer.

### P5.B.9 — Per-terminal cash drawer
Files: `app/dashboard/settings/devices/[id]/drawer/page.tsx`
Cash drawer paired to specific terminal. Opens on cash tender at that terminal only.
Acceptance: Drawer opens on correct tx.

### P5.B.10 — Terminal-level shift reports
Files: `app/dashboard/checkout/shift-report/[terminalId]/page.tsx`
Summary per terminal per shift.
Acceptance: Matches transactions on that terminal.

## P5.C — Receipt Printer Integrations (10 PRs)

### P5.C.1 — Star Micronics integration
Files: `lib/printers/star.ts`
ESC/POS commands. Bluetooth + LAN drivers.
Acceptance: Star TSP143 prints sample receipt.

### P5.C.2 — Epson integration
Files: `lib/printers/epson.ts`
ESC/POS variant for Epson. TM-T88VI tested.
Acceptance: Epson prints receipt.

### P5.C.3 — Generic ESC/POS support
Files: `lib/printers/escpos.ts`
Fallback for off-brand printers using standard ESC/POS.
Acceptance: Generic printer with ESC/POS works.

### P5.C.4 — Bluetooth printer discovery
Files: `components/printers/BluetoothDiscovery.tsx`
Web Bluetooth API (Chrome). Pair printer in browser.
Acceptance: Discovered printer pairs.

### P5.C.5 — USB printer support (Electron-only or via local print server)
Files: `lib/printers/usb.ts`
For PWA, USB printing requires local print server. Document setup.
Acceptance: USB printer works via local server.

### P5.C.6 — Network (TCP/IP) printer support
Files: `lib/printers/network.ts`
Direct TCP socket to printer LAN IP.
Acceptance: LAN printer accepts jobs.

### P5.C.7 — Receipt format options
Files: `app/dashboard/settings/receipts/page.tsx`
Logo top, custom header, custom footer, signature line, tip suggestions.
Acceptance: Setting changes reflected in print.

### P5.C.8 — Customer copy + Merchant copy
Files: option in receipt config
Customer signs merchant copy. Customer keeps customer copy.
Acceptance: Two prints when configured.

### P5.C.9 — Reprint history
Files: tx detail
Every reprint logged. Counter visible.
Acceptance: Reprint count accurate.

### P5.C.10 — Print queue + offline buffer
Files: `lib/printers/queue.ts`
If printer offline, queue jobs. Retry every 30s. Alert if down >5min.
Acceptance: Queued job prints when printer reconnects.

## P5.D — Cash Drawer + Status (10 PRs)

### P5.D.1 — Cash drawer kick code (via printer)
Files: `lib/devices/cash-drawer.ts`
Most drawers connect to printer and open via ESC/POS kick code.
Acceptance: Cash sale triggers drawer.

### P5.D.2 — Manual open (manager override)
Files: `app/dashboard/checkout/drawer/page.tsx`
Manager PIN required to open drawer outside checkout. Logged.
Acceptance: Audit trail shows manual opens.

### P5.D.3 — Drawer count workflow
Files: `app/dashboard/checkout/end-of-shift/count/page.tsx`
End of shift: enter denominations, system computes expected, shows variance.
Acceptance: $200 expected, $195 counted → -$5 variance highlighted.

### P5.D.4 — Variance alerts
Files: notification
Variance >$5 → notify OWNER.
Acceptance: $20 variance triggers email.

### P5.D.5 — Terminal heartbeat monitoring
Files: `lib/devices/heartbeat.ts`
Engine receives heartbeat every 60s. Kasse shows last-seen.
Acceptance: Disconnected terminal flips to OFFLINE in 5 min.

### P5.D.6 — Battery low alerts
Files: heartbeat handler
PAX A920 reports battery. <20% → alert.
Acceptance: Sim battery 15% → alert fires.

### P5.D.7 — Firmware update notifications
Files: engine webhook handler
On firmware available, notify OWNER. Schedule update.
Acceptance: FW notification visible in settings.

### P5.D.8 — Remote diagnostics
Files: `app/admin/devices/[id]/diagnostics/page.tsx`
SUPERADMIN-only. Trigger remote reboot, log fetch, status ping.
Acceptance: Sim command reaches engine.

### P5.D.9 — Device replacement workflow
Files: `app/dashboard/settings/devices/[id]/replace/page.tsx`
Order replacement, RMA old unit, pair new unit. Preserves history.
Acceptance: Replacement flow tested end-to-end.

### P5.D.10 — Multi-vendor terminal support (future-proofing)
Files: `lib/devices/adapter.ts`
Adapter pattern so future non-Payroc terminals could plug in. Today: Payroc-only.
Acceptance: Code passes lint; abstraction exists.

---

## PHASE 4 & 5 COMPLETION CRITERIA

- All 120 PRs merged
- Salon Envy USA processing live transactions through Reyna Pay (Corpus Christi + San Antonio)
- All payment methods tested: card-present, card-not-present, Apple Pay, Google Pay, cash, gift card, split
- Refunds tested
- Disputes flow tested
- Payouts reconciling
- Multiple terminals tested per location
- Receipt printing on Star + Epson tested
- KASSE_REAL_BUILD_ORDER.md updated

**Gates unblocked by completion of P4/P5:** Ready to proceed to P6 (Owner Portal Core).
