# PHASE 1 — ONBOARDING

**Status:** In progress (P1.A.1, P1.A.2 shipped)
**Scope:** Signup foundation, 8-step wizard, 30-day email sequence, tours, setup checklist.
**Total PRs:** 80
**Depends on:** P0 (foundation — COMPLETE as of 2026-05-18)
**Gates:** P1.C.4.2 (embedded Reyna Pay application iframe) requires REYNA_PAY engine ready.

**Reference docs:** KASSE_ONBOARDING.md (full 8-step spec + 30-day email sequence), KASSE_PORTALS.md, KASSE_PORTAL_ARCHITECTURE.md.

---

## P1.A — Signup Foundation (15 PRs)

### P1.A.1 — Onboarding state machine + resume tokens ✅ COMPLETE

OnboardingSession table (per-email signup tracking with 10-state forward-only machine),
OnboardingStateTransition table (audit trail), JWT-based resume tokens (ONBOARDING_RESUME_SECRET,
7-day TTL). Helpers: getOrCreateSession, transitionTo, skipStep, patchData, linkResource,
signResumeToken, verifyResumeToken. Both tables RLS-enabled (SUPERADMIN-only writes via
prismaAdmin). No UI or API routes — pure infrastructure for P1.A.2+.

### P1.A.2 — Account creation + email verification (Resend magic-link) ✅ COMPLETE

OnboardingVerificationToken table (single-use 24h tokens, sha256-hashed, atomic consumption),
3 columns on OnboardingSession (magicLinkEmailsSentCount, magicLinkLastSentAt, passwordHash).
Helpers: issueToken, consumeToken, sendMagicLink (rate-limited 3/hr), validatePassword,
createAccount (bcrypt 12 rounds, transactional User creation). 3 API routes:
POST /api/onboarding/email, POST /api/onboarding/verify, POST /api/onboarding/password.
All PRE_SESSION (prismaAdmin). Email template with Kasse design system colors.
NextAuth signIn integration deferred to P1.A.8 UI PR.

### P1.A.3 — Email verification endpoint + token

Files: `app/api/auth/verify-email/route.ts`, `lib/auth/verification.ts`

24-hour-expiring token. Magic link emailed via Resend. On verify, set `User.emailVerifiedAt`.

### P1.A.4 — Verification email template

Files: `lib/emails/templates/verify-email.tsx`, Resend template

Subject "Verify your Kasse account". Localized.

### P1.A.5 — Verification enforcement middleware

Files: `middleware.ts` (extend)

Unverified users redirected to `/signup/verify-email` for all routes except logout and verification flow.

### P1.A.6 — Password strength meter

Files: `components/auth/PasswordStrength.tsx`

zxcvbn-based. Min 8 chars + 3 of (upper/lower/digit/symbol) OR 14+ chars.

### P1.A.7 — bcrypt password hashing

Files: `lib/auth/password.ts`

bcrypt cost 12. Pepper from env.

### P1.A.8 — Google OAuth signup

Files: NextAuth config

Google provider. On first sign-in, create User + redirect to wizard step 1.

### P1.A.9 — Apple Sign-In

Files: NextAuth Apple provider

Same flow.

### P1.A.10 — Terms + Privacy acceptance logging

Files: `prisma/schema.prisma` (TermsAcceptance table), signup form

Capture version of ToS + Privacy + DPA accepted at signup. Replay-able for legal.

### P1.A.11 — Signup analytics (UTM tracking)

Files: `lib/analytics/signup.ts`

Capture UTM params from referrer cookie, store on User.acquisitionSource. Funnel: signup_started → email_verified → wizard_started → wizard_step_N → onboarding_completed.

### P1.A.12 — Signup A/B test infrastructure

Files: `lib/experiments/index.ts`

Server-side assignment via FeatureFlag percentages. Track variant exposure events.

### P1.A.13 — Rate limiting on signup endpoint

Files: `lib/rate-limit/signup.ts`

5 attempts per IP per hour. Cloudflare/Vercel edge.

### P1.A.14 — Bot detection (Cloudflare Turnstile)

Files: `components/auth/Turnstile.tsx`

Invisible CAPTCHA. Required on signup + login.

### P1.A.15 — Day 0 welcome email

Files: `lib/emails/templates/welcome-day-0.tsx`

Sent immediately after email verification. Subject "Welcome to Kasse, {firstName}!". Sets expectation for wizard, links to support, mentions next email.

---

## P1.B — Wizard Shell (10 PRs)

### P1.B.1 — `app/onboarding/wizard/layout.tsx`: full-screen layout

Files: `app/onboarding/wizard/layout.tsx`

No sidebar, no top bar. Just centered card with progress bar at top.

### P1.B.2 — Progress bar component

Files: `components/onboarding/ProgressBar.tsx`

Visual 8-segment progress. Step labels on hover (desktop). Tap to jump back to completed steps (not forward).

### P1.B.3 — Step counter ("Step 3 of 8")

Files: `components/onboarding/StepCounter.tsx`

### P1.B.4 — Save & continue logic

Files: `lib/onboarding/persistSession.ts`

Every step submit persists to OnboardingSession.stepData. Optimistic UI.

### P1.B.5 — Resume logic

Files: `app/onboarding/wizard/page.tsx`

On wizard entry, load OnboardingSession.currentStep, route to that step. Pre-fill form from stepData.

### P1.B.6 — Abandoned wizard detection

Files: Vercel cron + `scripts/check-abandoned-wizards.ts`

Runs hourly. If OnboardingSession started >24h ago and not completed, mark abandoned and queue abandonment email.

### P1.B.7 — Abandoned wizard email

Files: `lib/emails/templates/wizard-abandoned.tsx`

Subject "Pick up where you left off — your Kasse setup is waiting". CTA: link with resumeToken.

### P1.B.8 — Resume token generation + verification

Files: `lib/onboarding/resume.ts`

UUID token. URL: `/onboarding/resume/{token}`. Auto-logs user in if valid + recent (<7 days).

### P1.B.9 — Skip step logic

Files: `lib/onboarding/skipStep.ts`

Optional steps (Import, AI Receptionist) can be skipped. Logged. Step appears in setup checklist post-wizard.

### P1.B.10 — Wizard analytics

Files: `lib/analytics/wizard.ts`

Per-step entry/exit/abandon events. Drop-off heatmap. Time-on-step metric.

---

## P1.C — 8 Wizard Steps (40 PRs)

### Step 1: Business Profile (5 PRs)

#### P1.C.1.1 — Form UI (legal name, DBA, address, phone, hours)

Files: `app/onboarding/wizard/step-1-business/page.tsx`, `components/onboarding/steps/BusinessProfile.tsx`

Fields: Legal business name (required), DBA (optional), business address (Google Places autocomplete), phone (with country code), business hours (Mon-Sun toggleable).

#### P1.C.1.2 — Google Places autocomplete

Files: `components/forms/AddressAutocomplete.tsx`

Google Places API. Returns formatted address + lat/lng + timezone.

#### P1.C.1.3 — Logo upload (S3, image resize)

Files: `app/api/upload/logo/route.ts`, `components/forms/LogoUpload.tsx`

Accept PNG/JPG/SVG. Resize to 512×512 (large) + 128×128 (thumb) + 32×32 (favicon). S3 store. Update Organization.logoUrl.

#### P1.C.1.4 — Business hours editor

Files: `components/forms/BusinessHoursEditor.tsx`

Per-day open/close time with closed toggle. "Copy to all days" button. Validate close > open. Multiple windows per day for split shifts.

#### P1.C.1.5 — Save endpoint + validation

Files: `app/api/onboarding/step-1/route.ts`

Zod validation. Update Organization + OnboardingSession.currentStep = 2.

### Step 2: Services (5 PRs)

#### P1.C.2.1 — Pre-populated service list from VerticalConfig

Files: `app/onboarding/wizard/step-2-services/page.tsx`

Pulls from `verticalConfig.defaultServices`. User can edit/delete/add.

#### P1.C.2.2 — Service edit inline

Files: `components/onboarding/steps/ServicesEditor.tsx`

Each service: name, price, duration, category. Inline edit (no modal).

#### P1.C.2.3 — Cost-to-deliver field (Nisha N-1)

Per Nisha feature N-1. Each service shows optional "cost to deliver" field. Computes margin % live as service is edited.

#### P1.C.2.4 — Add custom service flow

Files: button + modal

Modal for new service. Required: name + price. Duration defaults to 30min. Category optional.

#### P1.C.2.5 — Industry pricing benchmarks tooltip

Files: `components/onboarding/PricingBenchmarkTooltip.tsx`, `data/pricing-benchmarks.json`

Hover on price field shows "Industry avg for {service} in {state}: $X-$Y". Data sourced manually for top services per vertical, expanded over time.

### Step 3: Team (5 PRs)

#### P1.C.3.1 — Owner self-profile form

Files: `app/onboarding/wizard/step-3-team/page.tsx`

First name, last name, role title, profile photo (optional). User auto-added as OWNER + Staff record created.

#### P1.C.3.2 — Staff invite form

Files: `components/onboarding/steps/StaffInvite.tsx`

Add staff: email, role (STAFF default), commission rate (optional), specialty (optional, vertical-specific).

#### P1.C.3.3 — Invitation email send

Files: `lib/emails/templates/staff-invite.tsx`

"You've been invited to join {orgName} on Kasse". Token-based signup link.

#### P1.C.3.4 — Multiple staff add flow

Files: inline add

"Add another staff member" link. Bulk-add up to 10 at signup.

#### P1.C.3.5 — Skip option

"I'll add team later" link. OWNER alone allowed.

### Step 4: Payment Processing (5 PRs)

#### P1.C.4.1 — Reyna Pay setup intro screen

Files: `app/onboarding/wizard/step-4-payments/page.tsx`

Explains: "To accept card payments, you'll apply for a merchant account through Reyna Pay (our payment partner). Approval typically takes 1-2 business days. You can skip and use Kasse in cash-only mode until approved."

#### P1.C.4.2 — Embedded application iframe `[GATED: REYNA_PAY]`

Files: `components/onboarding/ApplicationEmbed.tsx`

Uses P0.F infrastructure. Iframe embeds SalonTransact's public application form. Listens for postMessage events for status updates.

#### P1.C.4.3 — Skip option with persistent banner

If skipped, set `Organization.reynaPayStatus = 'NOT_APPLIED'`. Show persistent "Apply for payment processing" banner in dashboard.

#### P1.C.4.4 — Cash-only mode for skip path

Files: `lib/payments/cash-only.ts`

POS checkout works for cash, gift card, "other" payment methods. Card option grayed out with link to apply.

#### P1.C.4.5 — Application status polling

Files: `lib/onboarding/poll-reynapay.ts`

After application submitted, dashboard polls every 30s for status updates. On APPROVED, shows celebration banner + enables card payments.

### Step 5: Booking Page (5 PRs)

#### P1.C.5.1 — Booking page slug input

Files: `app/onboarding/wizard/step-5-booking/page.tsx`

Input: `kasseapp.com/book/{slug}`. Live availability check (debounced). Suggest slug from businessName.

#### P1.C.5.2 — Profile photo / hero image upload

Files: `components/forms/HeroImageUpload.tsx`

Different from logo. Wide-aspect hero image for booking page header. 1920×600 recommended.

#### P1.C.5.3 — Booking page message editor

Files: `components/onboarding/BookingMessageEditor.tsx`

"Welcome to our salon! Book your appointment below." Customizable. Markdown supported.

#### P1.C.5.4 — Deposit + cancellation policy config

Fields: deposit amount or % (0-100), refundable yes/no, cancellation window (hours), cancellation fee. Per-service overrides come later in P6.

#### P1.C.5.5 — Preview link

Button opens public booking page in new tab. Verify slug works, design renders.

### Step 6: Branding (5 PRs)

#### P1.C.6.1 — Brand color picker

Files: `app/onboarding/wizard/step-6-branding/page.tsx`

Color picker. Writes to `Organization.themeOverride.colors.primary`. Live preview adjacent.

#### P1.C.6.2 — SMS sender name

Files: form input

"From {SenderName}". Max 11 alphanumeric. Default = first 11 chars of business name.

#### P1.C.6.3 — Receipt footer message

Files: form textarea

"Thanks for your visit! See you soon." Default per vertical.

#### P1.C.6.4 — Marketing email reply-to

Files: form input

Defaults to OWNER email. Validation: must be deliverable.

#### P1.C.6.5 — Preview branded receipt

Files: `components/onboarding/ReceiptPreview.tsx`

Renders a mock receipt with their logo, brand color, sample items, footer.

### Step 7: Import (5 PRs)

#### P1.C.7.1 — Source platform selector

Files: `app/onboarding/wizard/step-7-import/page.tsx`

Tiles: Square, Vagaro, GlossGenius, Mindbody, Boulevard, Acuity, CSV, "Other/None". Click → step to next.

#### P1.C.7.2 — Skip for now

For each source, the actual migration ships in P22. For wizard, this step just records intent. Banner shown post-wizard: "Ready to import from Square? Open Migration Center."

#### P1.C.7.3 — "Coming soon" placeholder

For sources where migration ships in P22.

#### P1.C.7.4 — Email signup for migration assistance

CTA: "Notify me when migration is ready for {SourceName}". Captures email, sends notification when feature ships.

#### P1.C.7.5 — Skip → onboardingStep advances

Skipping is fine. Step marked skipped in OnboardingSession.

### Step 8: Go Live (5 PRs)

#### P1.C.8.1 — Celebration screen

Files: `app/onboarding/wizard/step-8-golive/page.tsx`

Animation. "You're ready to take bookings!" Confetti.

#### P1.C.8.2 — Booking link display + copy

Files: form display

Full URL prominently. Copy-to-clipboard button.

#### P1.C.8.3 — QR code generation

Files: `lib/qrcode.ts`

QR for the booking link. Downloadable PNG. Add to print materials.

#### P1.C.8.4 — Share buttons

Buttons: Instagram bio link, Facebook share, copy SMS template "Book your next appointment at {url}".

#### P1.C.8.5 — Set onboardingCompleted=true → redirect

Update OnboardingSession.completedAt. Update Organization.onboardingCompleted. Redirect to `/dashboard`.

---

## P1.D — 30-Day Email Sequence (8 PRs)

Per KASSE_ONBOARDING.md Section 4.

### P1.D.1 — Day 0 welcome email

(Already shipped in P1.A.15.) Verification in P1.D.

### P1.D.2 — Day 1: first booking prompt

Files: `lib/emails/templates/day-1-first-booking.tsx`

Conditional content based on wizard completion. If incomplete: "You're halfway through setup". If complete + no bookings: "Share your booking link to get your first reservation".

### P1.D.3 — Day 3: setup check-in

Conditional: Reyna Pay connected? Bookings received? Staff added? Send tailored content.

### P1.D.4 — Day 7: 7-day usage report

Personalized with actual numbers: bookings, revenue, new clients. "Your first week with Kasse."

### P1.D.5 — Day 14: setup coaching

Conditional. If still missing setup items, gentle nudge with checklist. If fully set up, social proof + feature highlight (Kasse Color, AI Receptionist, etc.).

### P1.D.6 — Day 30: 30-day graduation

"You're 30 days in!" Stats: total bookings, revenue, retention rate. Invitation to upgrade plan if FREE/STARTER.

### P1.D.7 — Vercel cron / Supabase scheduled function triggers

Files: `app/api/cron/onboarding-emails/route.ts`, `vercel.json`

Runs daily at 9am org-timezone. Queries OnboardingSession + Organization + sends due emails.

### P1.D.8 — Email open + click tracking

Files: `lib/emails/tracking.ts`

Resend tracking webhook → log to EmailEvent table. Pixel for opens, link wrapping for clicks.

---

## P1.E — In-Portal Tours + Setup Checklist (7 PRs)

### P1.E.1 — GuidedTour component

Files: `components/tour/GuidedTour.tsx`

Tooltip-based step-by-step tour. Highlights element, shows arrow + tooltip with content.

### P1.E.2 — Tour definitions per vertical

Files: `lib/tours/{salon,barbershop,restaurant,gym,medspa}.ts`

Salon tour explains formula cards. Restaurant tour explains floor plan. Etc.

### P1.E.3 — localStorage tour completion tracking

Files: `lib/tours/storage.ts`

`kasse_tour_completed_{tourId}` flags. Don't re-show.

### P1.E.4 — "Restart portal tour" option in Help

Files: Help menu

Resets all tour flags for current user.

### P1.E.5 — Persistent setup checklist on dashboard

Files: `components/dashboard/SetupChecklist.tsx`

Visible on dashboard until 100% complete. Items: complete profile, add services, invite staff, apply for Reyna Pay, take first booking, take first payment, share booking link, etc.

### P1.E.6 — Setup checklist auto-detects completion

Files: `lib/onboarding/checklist.ts`

Each item has a query function that returns boolean. Run on every dashboard load.

### P1.E.7 — Setup checklist collapses on 100%

When all items checked, checklist collapses to small "Setup complete ✓" badge.

---

## PHASE 1 COMPLETION CRITERIA

- All 80 PRs merged
- Signup flow tested end-to-end
- Wizard tested for each vertical (salon, barbershop, restaurant, gym, med spa minimum)
- 30-day email sequence triggers on test account
- Setup checklist accurate
- KASSE_REAL_BUILD_ORDER.md updated

**Gates not yet unblocked:** Reyna Pay application embed (P1.C.4.2) requires REYNA_PAY signal.

**After P1:** Phase 2 (Portal Shell) and Phase 3 (Marketing Site v1) can run in parallel.
