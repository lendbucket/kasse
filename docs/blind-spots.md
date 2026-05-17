# Build doc blind spots — running log

Things we've identified that aren't fully captured in `docs/build-order/*` and
need attention before launch. Each entry: where it should land, current status,
triage decision.

## Open items as of 2026-05-16

### Device + Cart models (P0.G)
- **Why missing:** build doc has Order + Payment but no in-progress Cart, and
  no device registry for iPads / terminals.
- **Captured in:** SD-010 (dual-iPad POS architecture).
- **Status:** schema design in P0.G, implementation in P8.

### Offline mode
- **Why missing:** build doc assumes always-online.
- **Captured in:** SD-010 deferred questions.
- **Status:** decision needed in P0.G.

### Tax engine for transactional sales tax (TX + multi-state later)
- **Why missing:** SalonBacked has a tax engine for the salon's *income* tax;
  transactional sales tax on services + products is a different system.
- **Texas specific:** services largely non-taxed, products are. Need to confirm
  with attorney before charging tax. Wax / nail / massage may have different
  rules from hair.
- **Status:** flag for attorney review; schema decision in P0.G.

### Receipt customization beyond email
- **Why missing:** P0.B Theme System has `emailTemplates.footerHtml` but no
  SMS or printed-receipt templates.
- **Status:** P0.B extension, defer to P12 (UI polish) for SMS/print template UI.

### Gift card lifecycle (issue, redeem, balance, expiration)
- **Why missing:** salon VerticalConfig has `giftCards: true` flag but no
  implementation plan in build doc.
- **Status:** new sub-phase needed; tentative placement after P9 (payments).

### Loyalty program rules engine
- **Why missing:** salon VerticalConfig has `loyaltyProgram: true` flag but
  no implementation plan in build doc.
- **Status:** new sub-phase needed; tentative placement alongside gift cards.

### Two-factor auth for staff with FINANCIAL permissions
- **Why missing:** P0.A built basic NextAuth single-factor login.
- **Status:** P0.A extension. Required before any real merchant onboards.

### Subscriber data export (TDPSA / CCPA / GDPR-style)
- **Why missing:** build doc doesn't address right-to-export or right-to-delete.
- **Status:** flag for attorney review; required before enterprise contracts.

### Backup + disaster recovery targets (RTO/RPO)
- **Why missing:** build doc references Supabase PITR but no documented targets.
- **Status:** P0.H decision (Observability phase).

### Onboarding KYC for merchant boarding (Payroc requires)
- **Why missing:** Reyna Pay phases reference it but no flow design.
- **Status:** P0.E/F (gated on Reyna Pay readiness).

### Session management UI (max devices, logout-all, view active sessions)
- **Why missing:** NextAuth handles backend but no UI exists.
- **Status:** P0.A extension; defer to P12 (UI polish).

## How to add an entry

When you spot something the build doc doesn't cover, add it here with:
- Why it's missing
- Where it should live in the phase plan
- Triage status (ship now / phase X / defer / attorney review)
