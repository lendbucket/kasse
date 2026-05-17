# Build doc blind spots — running log

Things we've identified that aren't fully captured in `docs/build-order/*` and
need attention before launch. Each entry: where it should land, current status,
triage decision.

## STATUS UPDATE — 2026-05-17

Many items in this document have been resolved by the documentation reconciliation
in PR #74 (Strategic Decisions) and PR #75 (Domain Docs — this PR). Items below are
flagged as RESOLVED with references to the canonical doc.
Remaining UNRESOLVED items are open architectural questions that need future decision.

## Open items as of 2026-05-16

### Device + Cart models (P0.G) — RESOLVED
- **Why missing:** build doc has Order + Payment but no in-progress Cart, and
  no device registry for iPads / terminals.
- **Captured in:** SD-K-016 (dual-iPad POS architecture) + SD-K-028 (cart starts at appointment).
- **Status:** RESOLVED. See `docs/KASSE_STRATEGIC_DECISIONS.md` SD-K-016, SD-K-028.

### Offline mode — UNRESOLVED
- **Why missing:** build doc assumes always-online.
- **Captured in:** SD-K-009 (offline non-negotiable), SD-K-016 deferred questions.
- **Status:** Architecture decision still needed in P0.G. SD-K-009 locks the requirement but implementation approach (hard-fail vs cache vs full offline-first) undecided.

### Tax engine for transactional sales tax (TX + multi-state later) — PARTIALLY RESOLVED
- **Why missing:** SalonBacked has a tax engine for the salon's *income* tax;
  transactional sales tax on services + products is a different system.
- **Texas specific:** services largely non-taxed, products are. Need to confirm
  with attorney before charging tax. Wax / nail / massage may have different
  rules from hair.
- **Status:** Manual rate per location v1 (SD-K-027), TaxJar v2. Attorney review still needed for TX service tax rules. See `docs/KASSE_COMPLIANCE.md`.

### Receipt customization beyond email — UNRESOLVED
- **Why missing:** P0.B Theme System has `emailTemplates.footerHtml` but no
  SMS or printed-receipt templates.
- **Status:** P0.B extension, defer to P12 (UI polish) for SMS/print template UI.

### Gift card lifecycle (issue, redeem, balance, expiration) — PARTIALLY RESOLVED
- **Why missing:** salon VerticalConfig has `giftCards: true` flag but no
  implementation plan in build doc.
- **Status:** Cross-location gift card redemption confirmed in SD-K-040. Full lifecycle implementation plan still needed as sub-phase.

### Loyalty program rules engine — RESOLVED
- **Why missing:** salon VerticalConfig has `loyaltyProgram: true` flag but
  no implementation plan in build doc.
- **Status:** RESOLVED. SD-K-035 confirms custom loyalty per salon in v1. See `docs/KASSE_FEATURES.md` and `docs/KASSE_TIERS.md` (PREMIUM+ feature).

### Two-factor auth for staff with FINANCIAL permissions — UNRESOLVED
- **Why missing:** P0.A built basic NextAuth single-factor login.
- **Status:** P0.A extension. Required before any real merchant onboards. See `docs/KASSE_COMPLIANCE.md` § Security for 2FA spec.

### Subscriber data export (TDPSA / CCPA / GDPR-style) — RESOLVED
- **Why missing:** build doc doesn't address right-to-export or right-to-delete.
- **Status:** RESOLVED. SD-K-039 locks TDPSA + CCPA in v1. See `docs/KASSE_COMPLIANCE.md` § Data Privacy.

### Backup + disaster recovery targets (RTO/RPO) — UNRESOLVED
- **Why missing:** build doc references Supabase PITR but no documented targets.
- **Status:** P0.H decision (Observability phase). Still needs explicit RTO/RPO numbers.

### Onboarding KYC for merchant boarding (Payroc requires) — RESOLVED
- **Why missing:** Reyna Pay phases reference it but no flow design.
- **Status:** RESOLVED. KYC lives in Settings → Payments (not onboarding wizard). See `docs/KASSE_ONBOARDING.md` § "Payroc KYC — NOT in initial onboarding".

### Session management UI (max devices, logout-all, view active sessions) — UNRESOLVED
- **Why missing:** NextAuth handles backend but no UI exists.
- **Status:** P0.A extension; defer to P12 (UI polish).

## How to add an entry

When you spot something the build doc doesn't cover, add it here with:
- Why it's missing
- Where it should live in the phase plan
- Triage status (ship now / phase X / defer / attorney review)
