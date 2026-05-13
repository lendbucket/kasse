# KASSE ENGINE BOUNDARY
## What Kasse Calls Reyna Pay For — And What Kasse Never Calls Reyna Pay For

**Version:** 1.0
**Status:** LOCKED (2026-05-13)
**Owner:** Robert Reyna, CEO Reyna Tech LLC
**Supersedes:** none (initial spec)
**Authoritative source for:** SD-K-001 "Kasse is a Thin Client" implementation contract

---

## WHY THIS DOC EXISTS

Per SD-K-001 (KASSE_STRATEGIC_DECISIONS.md, LOCKED), Kasse has no payments backend. All payment-related operations are delegated to the Reyna Pay engine, which exposes its API at `app.salontransact.com/api/v1`. This thin-client architecture is what makes Kasse deployable by resellers in hours instead of weeks, and what allows the same Reyna Pay engine to power multiple verticals (Kasse, future RestaurantTransact, future GymTransact, white-label resellers, developer API consumers).

However, the principle was stated but never fully enumerated. As a result, on 2026-05-13 a PR was authored that proposed Kasse calling Payroc's API directly to tokenize bank accounts. This violated the thin-client architecture but wasn't caught at design time. The reviewer caught it on PR #33 review.

This document exists to prevent that class of mistake from recurring. It enumerates exactly which payment-related operations Kasse delegates to Reyna Pay, the corresponding endpoint shape, the current implementation status on the Reyna Pay side, and the feature-flag pattern Kasse uses when Reyna Pay hasn't built a needed endpoint yet.

Every future PR that touches payments, banking, payouts, or tokenization MUST be checked against this doc. If a proposed change would have Kasse calling Payroc, Stripe, or any other payment processor directly, that PR is wrong by construction and must be rewritten.

---

## THE LAYERED ARCHITECTURE (REVIEW)

Per EMPIRE_ARCHITECTURE.md:

Layer 0 — Reyna Pay (payment rails). Entity: Reyna Pay LLC. Brand: SalonTransact. Direct integration with Payroc. Owns all payment processing, tokenization, payouts, disputes.

Layer 1 — Kasse (vertical SaaS for service businesses). Entity: Reyna Tech LLC. Calls Reyna Pay for all payment operations. Owns booking, POS UI, CRM, staff, marketing, AI, franchise management.

Layer 2 — SalonBacked (HCM engine). Entity: Reyna Insure LLC. Calls Kasse for commission/hours/tips data. Owns payroll, tax, insurance, benefits.

Layer 3 — Distribution (RunMySalon portal, white-label resellers, developer API). Consumes Kasse's API. Inherits the thin-client guarantee via Kasse.

The Kasse Engine Boundary is the contract between Layer 1 (Kasse) and Layer 0 (Reyna Pay).

---

## THE FIVE CATEGORIES OF PAYMENT OPERATIONS

Every payment-adjacent operation falls into one of five categories. The rule for each is fixed:

### Category 1 — Payment Processing (card charges, refunds, voids)

Kasse calls Reyna Pay. Reyna Pay calls Payroc. Kasse never has Payroc credentials.

Endpoints Kasse currently uses (Reyna Pay implementation status: BUILT, PROD-READY-FOR-UAT):

| Operation | Kasse code path | Reyna Pay endpoint | Status |
|-----------|-----------------|--------------------|---|
| Process a card charge | `lib/engine/charge.ts` (TBD) | `POST /v1/charges` | BUILT |
| Refund a transaction | `lib/engine/refund.ts` (TBD) | `POST /v1/refunds` | BUILT |
| Void a same-day transaction | `lib/engine/void.ts` (TBD) | `POST /v1/voids` | BUILT |
| Tokenize a card for future use | Payroc Hosted Fields (frontend) | Payroc Hosted Fields SDK | BUILT |

Note: Card tokenization specifically uses Payroc Hosted Fields, which is an iframe-based frontend SDK that runs in the merchant's browser. The Hosted Fields iframe communicates directly with Payroc — Kasse's backend never sees the raw card number. This is the same pattern SalonTransact uses (lib/payroc/hosted-fields.ts in the SalonTransact repo). Hosted Fields is NOT an exception to the engine-boundary rule, because the frontend iframe is a Payroc-served UI component, not a Kasse-to-Payroc API call.

### Category 2 — Bank Account Vaulting (ACH push setup, payout destinations)

Kasse calls Reyna Pay. Reyna Pay calls Payroc. Kasse never has Payroc credentials.

Endpoints Kasse needs (Reyna Pay implementation status: PLANNED, NOT BUILT YET):

| Operation | Kasse code path | Reyna Pay endpoint | Status |
|-----------|-----------------|--------------------|---|
| Vault a bank account, return token | `lib/engine/bank-tokens.ts` (TBD) | `POST /v1/bank-tokens` | PLANNED |
| Look up a bank token's last-4 and routing | TBD | `GET /v1/bank-tokens/:id` | PLANNED |
| Initiate ACH push using a bank token | TBD | `POST /v1/payouts` | PLANNED |
| Detokenize a bank token (operational use only) | TBD | `POST /v1/bank-tokens/:id/detokenize` | PLANNED |

As of 2026-05-13, none of these endpoints exist on the Reyna Pay side. Matt Perry at Payroc has confirmed that Payroc's underlying API supports bank account tokenization for ACH push, and the UAT processing terminal (6535001) is provisioned for ACH. Reyna Pay LLC (owned by Robert Reyna) will implement the four PLANNED endpoints above as part of Reyna Pay Phase 10.5 (post-Payroc-production, pending the 2026-07-21 integration deadline).

Kasse's Phase 0.6-c implementation should use the feature-flag pattern (see below) so that the Kasse code is READY for these endpoints when they go live, without requiring all of Kasse to ship at the same time as Reyna Pay's endpoint rollout.

### Category 3 — Reporting / Read-Only Transaction Data

Kasse calls Reyna Pay. No Payroc credentials anywhere.

Endpoints Kasse currently uses or will use:

| Operation | Kasse code path | Reyna Pay endpoint | Status |
|-----------|-----------------|--------------------|---|
| List transactions for an org | `lib/engine/transactions.ts` (TBD) | `GET /v1/transactions` | BUILT |
| Get a single transaction | TBD | `GET /v1/transactions/:id` | BUILT |
| List payouts for an org | TBD | `GET /v1/payouts` | PLANNED |
| List disputes / chargebacks | TBD | `GET /v1/disputes` | PARTIAL (read works, write workflow TBD) |

### Category 4 — Merchant Onboarding (boarding to Payroc as a sub-merchant)

Kasse calls Reyna Pay. Reyna Pay handles Payroc boarding manually (Phase 9) or via Payroc Boarding API (Phase 10+).

Endpoints Kasse needs:

| Operation | Kasse code path | Reyna Pay endpoint | Status |
|-----------|-----------------|--------------------|---|
| Submit merchant boarding application | `app/api/onboarding/complete/route.ts` (existing, currently emails Robert directly — refactor TBD) | `POST /v1/merchants` | PLANNED |
| Check boarding status | TBD | `GET /v1/merchants/:id/status` | PLANNED |
| Receive boarding-complete webhook | TBD | webhook subscription | PLANNED |

As of 2026-05-13, Kasse's onboarding flow emails the application data to ceo@36west.org (the application is then manually boarded by Robert via Payroc's ERF process). Phase 0.6-a redacted PII from this email. Future phase will replace the email-and-manual-board flow with a Reyna Pay `POST /v1/merchants` call once that endpoint is built.

### Category 5 — Webhooks From Reyna Pay To Kasse

Reyna Pay calls Kasse. Push direction is reversed from Categories 1-4.

Webhooks Kasse subscribes to (Reyna Pay implementation status: PARTIAL):

| Event | Kasse handler | Status |
|-------|---------------|---|
| charge.completed | `app/api/webhooks/reyna-pay/route.ts` (TBD) | PLANNED |
| charge.failed | TBD | PLANNED |
| refund.completed | TBD | PLANNED |
| dispute.created | TBD | PLANNED |
| payout.completed | TBD | PLANNED |
| merchant.boarded | TBD | PLANNED |
| merchant.boarding_failed | TBD | PLANNED |

---

## WHAT KASSE NEVER DOES

Hard rules. Any PR that proposes any of the below is wrong by construction.

- Kasse never has Payroc API credentials in its env vars
- Kasse never makes HTTP requests to `*.payroc.com` from server-side code
- Kasse never makes HTTP requests to Stripe Treasury, Wise, Plaid, Dwolla, or any other payment processor's API
- Kasse never stores raw bank account numbers, raw routing numbers, raw card PAN, raw CVV, or full SSN. (Last-4 of SSN is stored only as an encrypted blob per Phase 0.6 — see KASSE_PII_ENCRYPTION.md)
- Kasse never bypasses Reyna Pay to talk to Payroc directly, even for "just one quick call"

Exceptions (carefully scoped):

- Payroc Hosted Fields iframe SDK on the frontend (category 1 above) — this is a Payroc-served UI component, not a Kasse-originated API call. The iframe is loaded from Payroc's CDN with a session token issued by Reyna Pay's `POST /v1/checkout-sessions` endpoint. Kasse's backend never sees raw card data.

- Stripe for Kasse subscription billing (NOT for merchant payment processing). Per KASSE_ARCHITECTURE.md, Stripe is used ONLY for Kasse's own subscription billing — never for any merchant's payment processing. This is an isolated integration in `app/api/stripe/*` and never crosses into merchant-payment territory.

---

## THE FEATURE-FLAG PATTERN FOR PLANNED ENDPOINTS

When Kasse needs to call a Reyna Pay endpoint that doesn't exist yet (Category 2 today, Category 4 later), Kasse ships the code in a "ready but disabled" state. The pattern:

Step 1 — Write the Kasse-side client code that calls the planned endpoint:

    // lib/engine/bank-tokens.ts
    export async function vaultBankAccount(input: BankAccountInput): Promise<BankToken> {
      if (!process.env.FEATURE_REYNA_PAY_BANK_TOKENS) {
        throw new Error("Bank tokenization endpoint not yet available on Reyna Pay. Set FEATURE_REYNA_PAY_BANK_TOKENS=true once /v1/bank-tokens is live.");
      }
      // ...call Reyna Pay /v1/bank-tokens
    }

Step 2 — Add the feature flag to the env example file with documentation:

    # Feature flags for Reyna Pay engine endpoints that may not be live yet
    FEATURE_REYNA_PAY_BANK_TOKENS=false
    FEATURE_REYNA_PAY_MERCHANT_BOARDING=false
    FEATURE_REYNA_PAY_WEBHOOK_PAYOUTS=false

Step 3 — In all places Kasse would CALL vaultBankAccount, wrap with a fallback:

    const usingTokens = process.env.FEATURE_REYNA_PAY_BANK_TOKENS === "true";
    if (usingTokens) {
      const token = await vaultBankAccount({ routing, account });
      await db.organization.update({ data: { payrocBankTokenId: token.id } });
    } else {
      // Fallback: store plaintext encrypted via KMS (Phase 0.6-d)
      await db.organization.update({ data: { bankRoutingNumber: encrypt(routing), bankAccountNumber: encrypt(account) } });
    }

Step 4 — When Reyna Pay's endpoint goes live:
- Reyna Pay team (Robert) flips `FEATURE_REYNA_PAY_BANK_TOKENS=true` in Vercel
- Kasse code immediately starts using tokens for new organizations
- Migration step (one-time): detokenize existing rows via the Reyna Pay endpoint, replace plaintext with tokens, drop the plaintext columns in a subsequent schema migration

This pattern means Kasse can ship "ready for Phase 0.6-c" code TODAY without waiting on Reyna Pay's endpoint rollout. The Kasse Phase 0.6-c PR ships the lib/engine/bank-tokens.ts client, the feature flag, and the conditional onboarding logic. Reyna Pay Phase 10.5 PR ships the endpoint. The two phases can ship independently and the flag flip is the integration moment.

---

## APPENDIX: REYNA PAY ENGINE — ENDPOINTS REQUIRED BY KASSE

This is the engineering work queue for the Reyna Pay side, owned by Robert. Each row is an endpoint that Kasse needs but Reyna Pay either hasn't built or hasn't deployed to production.

| Endpoint | Method | Purpose | Kasse phase that needs it | Reyna Pay status |
|----------|--------|---------|---------------------------|------------------|
| `/v1/bank-tokens` | POST | Vault bank account, return token | Kasse 0.6-c | NOT BUILT |
| `/v1/bank-tokens/:id` | GET | Look up token's last-4 (for display) | Kasse 0.6-c | NOT BUILT |
| `/v1/bank-tokens/:id/detokenize` | POST | Detokenize for migration (operational only) | Kasse 0.6-c migration | NOT BUILT |
| `/v1/payouts` | POST | Initiate ACH push using bank token | Kasse 0.7 (payouts dashboard) | NOT BUILT |
| `/v1/payouts` | GET | List payouts | Kasse 0.7 | NOT BUILT |
| `/v1/payouts/:id` | GET | Single payout details | Kasse 0.7 | NOT BUILT |
| `/v1/merchants` | POST | Submit boarding application | Kasse 0.9 (onboarding refactor) | NOT BUILT |
| `/v1/merchants/:id/status` | GET | Boarding status check | Kasse 0.9 | NOT BUILT |
| webhooks: payout.* | — | Push payout events to Kasse | Kasse 0.7 | NOT BUILT |
| webhooks: merchant.boarded | — | Push boarding-complete to Kasse | Kasse 0.9 | NOT BUILT |
| webhooks: dispute.created | — | Push dispute events to Kasse | Kasse 0.10 | NOT BUILT (Kasse has dispute infra per SalonTransact pattern) |

Status legend:
- NOT BUILT — endpoint does not exist on Reyna Pay codebase
- PLANNED — endpoint design discussed, implementation queued
- BUILT — endpoint exists in Reyna Pay codebase
- PROD-READY-FOR-UAT — endpoint deployed to Reyna Pay UAT environment, ready for Kasse integration
- PROD-LIVE — endpoint deployed to Reyna Pay production

As Reyna Pay's status changes, update this table. The table is the authoritative reference for "what can Kasse rely on today."

---

## APPENDIX: CHANGE PROCESS

Any new payment-adjacent feature in Kasse follows this process:

1. Read this doc to identify which Category the operation falls in
2. Check if the required Reyna Pay endpoint exists in the appendix table
3. If endpoint exists: write Kasse-side code that calls it
4. If endpoint does NOT exist: file an issue on the Reyna Pay repo describing the needed endpoint shape, AND ship the Kasse side using the feature-flag pattern
5. PR description must reference this doc and identify which Category + which endpoint the PR depends on

Reviewer is instructed (in .github/claude-review-prompt.md) to flag any payment-adjacent PR that doesn't reference KASSE_ENGINE_BOUNDARY.md.
