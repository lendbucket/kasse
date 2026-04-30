# KASSE STRATEGIC DECISIONS
## Locked Decisions — Do Not Revisit Without CEO Sign-Off

**Version:** 1.0 | **Owner:** Robert Reyna

---

## SD-K-001: Kasse is a thin client. Zero backend.
**Decision:** Kasse has no server-side data storage. All data persists through Reyna Pay engine API calls at `/api/v1/*`. Local device storage for offline cache only.

**Rationale:** Keeps Kasse re-deployable by resellers in hours. Engine is source of truth. No sync problems. Resellers deploy by pointing at the engine — no backend setup.

**Implication:** All Kasse API routes are proxies to the engine. No Kasse-specific payment logic.

---

## SD-K-002: Payroc is the only payment processor. No exceptions.
**Decision:** Consistent with engine SD-001. "SalonTransact" branding in all payment flows. "Powered by Reyna Pay" in footer of every receipt and checkout screen. Non-removable.

**Rationale:** Single MID, single compliance surface, single margin stack. Adding a second processor fragments everything.

---

## SD-K-003: Business-type-aware onboarding from day one.
**Decision:** Kasse configures itself based on business type selected at onboarding. One codebase, vertical-specific feature flags and UI configuration. No separate products for each vertical.

**Rationale:** Faster time-to-market for each vertical. Shared infrastructure. Cross-vertical data moat.

---

## SD-K-004: AI receptionist is built in-house on Twilio + OpenAI Realtime API.
**Decision:** Not a third-party vendor. Built on Twilio (phone) + OpenAI GPT-4o Realtime (voice AI). We own the model, training data, and improvement curve.

**Rationale:** Zenoti's AI receptionist is proprietary and salon-specific. Ours works across all verticals from day one. Data from 1M calls is a proprietary asset.

---

## SD-K-005: Agent-native API design from day one.
**Decision:** Every endpoint designed to be consumed by AI agents without human documentation. Semantic names, HATEOAS links, OpenAPI 3.1, consistent errors, idempotency everywhere.

**Rationale:** "We must build platforms designed for agents to buy from, not humans." By the time competitors figure this out, we'll have years of agent-compatible design done.

---

## SD-K-006: Theme system ships before first reseller goes live.
**Decision:** White-label theme system (`lib/theme/theme.config.ts`) is complete before any reseller deploys. Re-theming must take less than 4 hours of engineering.

**Rationale:** Resellers need to move fast. A broken or slow re-theming process kills the wholesale business before it starts.

---

## SD-K-007: Payroll is NOT built natively in Kasse.
**Decision:** Kasse calculates commission, generates payroll exports, and integrates with Gusto/Check/ADP. Actual payroll processing (direct deposit, tax withholding, W-2 generation) is external.

**Rationale:** Payroll compliance liability across 50 states is enormous. SalonBacked handles this layer. Kasse feeds it data.

---

## SD-K-008: HIPAA-adjacent data is encrypted at rest.
**Decision:** Formula history, medical notes (med spa), sensitive client data — encrypted using AES-256 at the database column level. Med spa vertical requires full HIPAA review before GA launch.

**Rationale:** Stylists and clients trust us with sensitive information. A breach destroys the brand.

---

## SD-K-009: Offline mode is non-negotiable for iPad POS.
**Decision:** Kasse iPad must be able to take a card-present payment without internet. Offline cache, queued sync, Payroc terminal local approval — all required before Phase 2 ships.

**Rationale:** Salons have flaky internet. If Kasse can't take a payment when WiFi goes down, we lose the account immediately.

---

## SD-K-010: "Powered by Reyna Pay" footer is permanent.
**Decision:** Cannot be white-labeled away. Appears on all receipts, checkout screens, and payment-related UI regardless of reseller brand.

**Rationale:** The Payroc relationship, MID, and compliance liability all sit with Reyna Pay LLC. The footer reflects legal reality.

---

## SD-K-011: Franchise fees are auto-collected through SalonTransact.
**Decision:** Royalties, technology fees, and marketing fund fees are calculated daily and auto-deducted from franchise location payouts via SalonTransact. Manual invoicing is not the primary path.

**Rationale:** Manual collection breaks down at scale. Auto-collection via the payment rails we already own is the correct architecture.

---

## SD-K-012: Stylist Marketplace — Kasse-only listings.
**Decision:** Only stylists whose salon is on Kasse can list on the marketplace. No open marketplace.

**Rationale:** This creates the flywheel. "I want to be on the marketplace" → salon must get on Kasse. This drives subscriber growth more effectively than any sales motion.

---

## SD-K-013: React Native for native apps, not Flutter or Swift.
**Decision:** Kasse iPad and iPhone apps are built in React Native (Expo). One codebase, shared with merchant portal component patterns.

**Rationale:** Shared component library with the web portal. One team owns all surfaces. White-label theming works across native and web with the same system.

---

## SD-K-014: Kasse Capital uses revenue-based repayment only.
**Decision:** No fixed monthly payments. Repayment is a fixed % of daily revenue deducted automatically via SalonTransact until advance is repaid.

**Rationale:** Revenue-based repayment aligns our interests with the salon's success. We only get paid when they get paid. This also eliminates most underwriting complexity.

---

## SD-K-015: SalonBacked is a separate product with deep Kasse integration.
**Decision:** SalonBacked (HCM layer) is its own brand and subscription but deeply integrated with Kasse data. Kasse sends revenue, commission, and hours data to SalonBacked. SalonBacked sends payroll, insurance status, and compliance data back to Kasse.

**Rationale:** Bundling creates stickiness. Separate product means separate revenue line and separate exit opportunity.
