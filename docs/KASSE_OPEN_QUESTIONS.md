# KASSE OPEN QUESTIONS
## Decisions Required Before Shipping

**Version:** 1.0 | **Owner:** Robert Reyna

---

## OQ-001: Payroc Terminal SDK vs Stripe Terminal for iPad hardware
**Question:** Does Kasse iPad use Payroc Terminal SDK or Stripe Terminal SDK for in-person card-present payments?

**Context:** Reyna Pay processes on Payroc. Using Stripe Terminal hardware while routing payments through Payroc is technically possible but adds complexity. The ideal is Payroc Terminal SDK end-to-end.

**Pending:** Matt Perry confirmation this week.

**Decision deadline:** Before Phase 2, Commit 2.1.

**If Payroc Terminal SDK:** Build directly against Payroc SDK. No middleware.
**If Stripe Terminal hardware:** Design middleware layer that uses Stripe Terminal for the card read but Payroc for the actual charge.

---

## OQ-002: PWA vs Native for Kiosk
**Question:** Should the Kasse Kiosk run as a PWA (locked browser) or a native React Native app?

**PWA pros:** Faster to ship, same codebase as web portal, automatic updates.
**PWA cons:** Less control over kiosk lock-down, browser back button risk.
**Native pros:** Full kiosk mode lock-down, better NFC/camera access, App Store credibility.
**Native cons:** Separate codebase from web, App Store submission delays.

**Recommendation:** Start with PWA in Phase 2. Convert to native in Phase 7 (white-label) when resellers need App Store submissions anyway.

**Decision deadline:** Before Phase 2, Commit 1.10.

---

## OQ-003: Database scaling strategy
**Question:** At what merchant count do we move from Supabase to dedicated PostgreSQL (RDS/Neon)?

**Current:** Supabase handles up to ~1,000 concurrent connections well.
**Risk threshold:** 10,000+ merchants, each with 100+ clients = 1M+ client rows. Need query planning.

**Action required:** Add proper indexes on organizationId on all tables NOW. Enable Supabase Row Level Security NOW. Plan migration path to Neon or RDS before you need it.

**Decision deadline:** Before Phase 6 (multi-location scale).

---

## OQ-004: Twilio A2P 10DLC registration
**Question:** Is Kasse's Twilio campaign registered for A2P 10DLC?

**Context:** All SMS to US numbers requires A2P campaign registration. Takes 2-4 weeks for approval. If not registered, SMS delivery will fail at scale.

**Action required:** Register Kasse campaign immediately. Campaign type: "Mixed" (transactional + marketing). Use-case description: appointment reminders, booking confirmations, and marketing campaigns for salon businesses.

**Decision deadline:** IMMEDIATE — before Phase 4 (marketing engine).

---

## OQ-005: Google My Business API OAuth flow
**Question:** How does each Kasse merchant connect their Google Business Profile for review management?

**Options:**
A. Each merchant does OAuth consent through their own Google account (cleanest, most compliant)
B. Kasse uses a service account and merchants grant access via Google Business Profile manager

**Recommendation:** Option A. Standard OAuth per merchant. Store refresh tokens per org.

**Decision deadline:** Before Phase 4 (reputation management).

---

## OQ-006: Franchise fee auto-collection legal review
**Question:** Has counsel reviewed the auto-deduction of franchise fees from payout?

**Context:** Auto-deducting franchise fees from payout touches FTC Business Opportunity Rule, state franchise registration laws, and payment processing regulations. This is the same legal surface as the reseller program (already on hold for counsel review).

**Action required:** Get counsel to review auto-collection mechanics before Phase 6 (franchise fees) ships.

**Decision deadline:** Before Phase 6, Commit 6.6.

---

## OQ-007: AI receptionist liability model
**Question:** If the AI receptionist books an appointment incorrectly (wrong date, wrong stylist, wrong service), who is liable?

**Mitigation already designed:** Confirmation step ("I've booked you for 2pm Saturday with Maria — reply YES to confirm"). This creates an explicit confirmation record.

**Additional mitigation needed:** Terms of service for salons enabling AI receptionist. Disclosure to callers that they're speaking with an AI. Opt-out option for callers who want a human.

**Decision deadline:** Before Phase 5, Commit 5.10.

---

## OQ-008: Cross-vertical customer identity and privacy
**Question:** If the same person uses Kasse at a salon AND a gym AND a restaurant, do we merge their profiles?

**Privacy issue:** They consented to share data with the salon, not the gym. Merging profiles without consent violates CCPA and potentially GDPR.

**Options:**
A. Siloed by org — same person is two separate client records (safest legally)
B. Opt-in cross-org linking — client explicitly links their accounts across businesses
C. Anonymous cross-org intelligence — aggregate insights without exposing individual data to competing orgs

**Recommendation:** Option A for now (siloed). Option B as an opt-in feature in Phase 6+. Option C for the intelligence layer (anonymous aggregate).

**Decision deadline:** Before Phase 3 (client intelligence).

---

## OQ-009: App Store strategy for white-label
**Question:** What does the iOS App Store strategy look like for white-label resellers?

**Context:** Each reseller brand needs their own Apple Developer account ($99/year) for their branded iOS app. Apple requires this for distinct branding.

**Options:**
A. Reseller owns their Apple Developer account, we build and submit on their behalf
B. Kasse submits all apps under one developer account with sub-branding (Apple may reject this)
C. Kasse submits main app, reseller uses enterprise distribution (limited to known users)

**Recommendation:** Option A for major resellers. Document requirements: Apple Developer account, Bundle ID, App Store screenshots.

**Decision deadline:** Before Phase 8 (white-label), Commit 8.7.

---

## OQ-010: Kasse Capital — lending license requirements
**Question:** Does offering revenue-based advances to merchants require a lending license?

**Context:** Merchant cash advances (MCA) are generally not regulated as loans in most states because they're characterized as the purchase of future receivables, not a loan. However, some states (California, Virginia, Utah, New York) have MCA disclosure laws.

**Action required:** Counsel review of Kasse Capital structure in target states before launch.

**Decision deadline:** Before Phase 12, Commit 12.1.

---

## OQ-011: SalonBacked — which insurance carriers are committed?
**Question:** Has Reyna Insure LLC finalized carrier partnerships for professional liability and health insurance?

**Context:** Carrier emails sent to Next Insurance, Thimble, Simply Business, Hiscox, Argo. PeopleKeep and Take Command Health for benefits. Awaiting responses.

**Action required:** Follow up with all contacts. Get at least one carrier commitment before building SalonBacked insurance marketplace. Can build the UI/UX before carriers are confirmed.

**Decision deadline:** Before SalonBacked Phase 1.

---

## OQ-012: Franchise Creator — FDD template legal status
**Question:** Has a franchise attorney reviewed the FDD template we're building into the Franchise Creator?

**Context:** An FDD (Franchise Disclosure Document) has 23 mandatory items defined by the FTC. Using an incorrect template exposes the franchisor to regulatory action. Kasse can provide a template but must include clear disclaimers that it requires attorney review before use.

**Action required:** Engage franchise attorney to review FDD template. Add prominent disclaimers. Build attorney referral marketplace into the flow.

**Decision deadline:** Before Phase 7, Commit 7.2.
