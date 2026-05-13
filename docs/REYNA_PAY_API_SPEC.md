# REYNA PAY ENGINE API SPECIFICATION
## The payment rails contract for Kasse, SalonBacked, RunMySalon, white-label brands, developer API consumers, and AI agents

**Version:** 1.0 — Complete (Tiers 1+2+3+4)
**Status:** LIVING (errata and clarifications will be appended; substantive changes follow VERSIONING policy)
**Owner:** Robert Reyna, CEO Reyna Pay LLC
**Entity:** Reyna Pay LLC (Wyoming)
**Brand:** SalonTransact (current consumer-facing brand; engine is brand-agnostic)
**Base URL:** https://app.salontransact.com/api/v1 [PENDING-MIGRATION: will move to https://api.reynapay.com/v1 once api.reynapay.com is provisioned and DNS is set up. Remove this PENDING-MIGRATION marker and update the URL when the migration completes.]
**Read in conjunction with:** KASSE_ENGINE_BOUNDARY.md (Kasse's consumer contract), KASSE_API_SPEC.md (Kasse's outward-facing API, downstream consumer of this engine)

---

## BRAND AND ENTITY RELATIONSHIP

The Reyna Pay engine and the SalonTransact brand have a specific relationship that affects how this spec maps to current and future production reality. This section locks the relationship so consumers and engineers reading this spec have an unambiguous reference.

**Reyna Pay LLC** (Wyoming entity, owned by Robert Reyna) owns the engine. The engine is the payment rails, the database of merchants/charges/payouts/disputes, the integration with Payroc, and the API contract described in this document.

**SalonTransact** is the consumer-facing brand for that engine. Until 2026-Q3, SalonTransact is also the brand consumed by the salon-vertical merchant portal. The engine API is currently hosted at `app.salontransact.com/api/v1` because that domain is already provisioned and live. As the engine matures into a multi-vertical payment rails layer (consumed by Kasse for salons, future RestaurantTransact-as-SaaS for restaurants, future GymTransact-as-SaaS for gyms, plus SalonBacked, RunMySalon, and developer API consumers), the engine will rebrand to its parent-entity identity: Reyna Pay.

**Migration plan:**
- Current: engine reachable at `app.salontransact.com/api/v1`
- Target: engine reachable at `api.reynapay.com/v1`
- During migration: both URLs serve identical responses, with `Reyna-Pay-Engine-Url` response header on both pointing to the canonical URL
- Post-migration: `app.salontransact.com/api/v1` returns `301 Moved Permanently` with `Location: api.reynapay.com/v1/...` for at least 18 months

**Implication for consumers reading this spec:**
- The SalonTransact Claude chat (the AI engineer maintaining the engine codebase) implements against this contract, hosted at whichever URL is currently primary.
- The Kasse codebase calls the engine via the `SALONTRANSACT_API_URL` environment variable. The variable name will be renamed to `REYNA_PAY_API_URL` (with a backward-compatible fallback to `SALONTRANSACT_API_URL` for at least one Kasse release) when the URL migration completes. Until then, the env var name remains `SALONTRANSACT_API_URL`.
- The base URL field in this spec's header carries a `[PENDING-MIGRATION]` marker to make the migration state explicit. When migration completes, the marker is removed and the line updated to `api.reynapay.com/v1`.

**Implication for `KASSE_ENGINE_BOUNDARY.md`:**
KASSE_ENGINE_BOUNDARY.md (Phase 0.8-a) currently describes "Kasse calls Reyna Pay's engine, hosted at the SalonTransact API URL during the migration window." That doc carries the migration plan in its own section so Kasse-side reviewers don't need to read this spec to understand the engine identity.

**Why the brand exists at all:**
SalonTransact is preserved as a consumer-facing brand because the existing salon-vertical merchant ecosystem (SalonTransact merchants, the SalonTransact portal at `app.salontransact.com`, the SalonTransact marketing site, the SalonTransact Slack channels with Payroc) is already established. Renaming the brand outright would break inertia. The strategy is: SalonTransact remains the salon-vertical brand wrapper; Reyna Pay becomes the engine identity that all vertical brand wrappers consume.

---

## DOCUMENT STATUS

This document is delivered in three tiers:

- **Tier 1 — Foundation (Phase 0.9-a, PR #36, merged):** Cross-cutting conventions — versioning, auth, idempotency, errors, pagination, rate limits, webhooks, HATEOAS, OpenAPI commitment, common patterns.
- **Tier 2 — Resource Definitions (Phase 0.9-b, PR #37, merged):** Merchants, Customers, Cards, Bank Tokens, Charges, Refunds, Voids, Payouts, Disputes, Checkout Sessions, Transactions (aggregate read), Reports, API Keys, Webhooks. One section per resource with full request/response schemas. Platform-token mechanism. Resource-specific error codes.
- **Tier 3+4 — Non-Functional + Agent-Native (Phase 0.9-c, this PR):** SLA, latency budgets, data residency, compliance posture (PCI, SOC 2), audit log retention, sandbox/test environment, deprecation policy, monitoring, SDKs, agent-native semantics, MCP server commitment, agent audit logging, per-agent-type rate limits, semantic enhancements, multi-step transaction patterns.

All four tiers are now complete. The SalonTransact engineering team can implement against the full contract.

---

## PURPOSE AND AUDIENCE

Reyna Pay is the payment rails for the 36 West Holdings ecosystem. It exposes a unified API consumed by:

1. **Kasse** (Reyna Tech LLC) — the primary vertical SaaS consumer. Salons, eventually restaurants, gyms, retail, and other service businesses. Booking, POS, CRM, marketing.
2. **SalonBacked** (Reyna Insure LLC) — the HCM layer consuming transaction data for tax filing, payroll, insurance underwriting.
3. **RunMySalon** — distribution layer for non-technical businesses, Chrome extension consumers.
4. **White-label brands** — resellers who deploy Kasse, SalonBacked, or RunMySalon under their own brand. They consume the engine indirectly through these vertical products.
5. **Developer API consumers** — third-party developers building payment-dependent applications on top of Reyna Pay's API directly. Includes future RestaurantTransact-as-SaaS, GymTransact-as-SaaS (these are also vertical products but Robert may choose to build them as developer-API consumers rather than embedded products).
6. **AI agents** — agentic systems booking services, processing payments, managing customers. Future-state primary consumer per SD-K-005 ("Agent-Native API Design").

This spec defines the contract. Every consumer above reads this document to understand what is and isn't possible against the engine. Every change to this contract is a versioned breaking change for all consumers — see VERSIONING below.

This document is written primarily for the SalonTransact Claude chat (the AI engineering assistant maintaining the Reyna Pay codebase). Secondary audiences are future human engineers, AI agents discovering the API, and Robert as the spec owner.

---

## DESIGN PRINCIPLES

These principles govern every endpoint defined in Tier 2 and every behavior defined in Tier 1.

1. **PCI Level 1 inherited from Payroc.** Reyna Pay's underlying processor is Payroc. Payroc holds PCI Level 1 certification. Reyna Pay's role is to expose Payroc's capabilities to consumers in a clean, versioned, vertical-agnostic shape. Reyna Pay never stores raw PAN, raw CVV, or raw bank account numbers in its own database — those go to Payroc's vault and Reyna Pay stores opaque tokens.

2. **Tenant isolation is non-negotiable.** Every endpoint that returns data SHALL filter by the authenticated merchant. Cross-tenant data exposure is the worst-class bug. The auth model below (BEARER tokens scoped per-merchant) is the enforcement mechanism. Tier 2 endpoint implementations MUST verify the requested resource's organization matches the authenticated org before responding.

3. **Idempotency on every mutating operation.** Network retries are not optional in payments — they happen constantly. Every POST and PATCH MUST accept an Idempotency-Key header and SHALL produce the same response when called with the same key + same body. DELETE is inherently idempotent per HTTP semantics. See IDEMPOTENCY below.

4. **No surprises in errors.** Errors follow a single format defined below. No endpoint returns a different error shape. Consumers can write one error handler.

5. **Versioned URI path, not header.** `/v1/charges` not `Accept: application/vnd.reyna-pay.v1+json`. Easier for consumers, easier for humans to read, easier for AI agents to discover. Tier 1 lays down v1. Future v2 will be a parallel `/v2/` path. See VERSIONING below.

6. **OpenAPI 3.1 is the source of truth.** Every endpoint defined in Tier 2 SHALL have a corresponding entry in the OpenAPI document. The OpenAPI document is published at /v1/openapi.json (machine-readable) and rendered at docs.reynapay.com (human-readable, generated from the OpenAPI). Consumers and AI agents discover the API through the OpenAPI document.

7. **Agent-discoverable.** Every response includes HATEOAS _links pointing to next legitimate actions. AI agents do not need to read prose documentation to know what to do next — the response itself tells them. See HATEOAS below.

8. **Webhook-first for asynchronous state.** Reyna Pay does not require consumers to poll. State changes (payment completed, refund processed, payout completed, dispute opened, merchant boarded) are pushed to consumer-registered webhook endpoints. See WEBHOOKS below.

9. **Backward compatibility within a version.** Within v1, the engine adds fields and endpoints freely. Removing fields, renaming fields, changing field types, or removing endpoints is a v2 change. See VERSIONING below.

10. **No partial responses.** When a resource is returned, it is returned complete. If a consumer wants only certain fields, they use the OpenAPI-defined projection parameters (e.g., `?fields=id,status,amount`) but the default is the complete resource. This simplifies the consumer model and makes caching predictable.

---

## VERSIONING

### Scheme

- Major version in URI path: `/v1/`, `/v2/`, etc.
- Multiple major versions run in parallel during deprecation windows.
- Backward compatibility within a major version. Additive changes only.

### Backward-compatible changes (always allowed within v1)

- Adding new endpoints
- Adding new optional request fields
- Adding new fields to responses
- Adding new optional query parameters
- Adding new HATEOAS _links
- Adding new webhook event types
- Adding new error codes (but never removing or renaming existing ones)
- Adding new enum values to fields, IF the field's documentation already states "this list will grow"

### Breaking changes (require new major version)

- Removing endpoints
- Removing or renaming request fields
- Removing or renaming response fields
- Changing field types
- Removing enum values
- Changing HTTP methods or status codes
- Changing authentication mechanisms
- Changing the error format shape
- Changing the pagination shape

### Version lifecycle

Each major version has four phases:
- **Beta** — Pre-release. Breaking changes allowed without notice. NOT for production use.
- **GA (General Availability)** — Stable. Backward-compatible changes only. SLA applies (defined in Tier 3).
- **Deprecated** — Replacement version is GA. Existing consumers receive `Deprecation: <date>` and `Sunset: <date>` headers in every response per RFC 8594. Migration guide published.
- **Sunset** — Endpoint returns 410 Gone. Consumers must have migrated.

Reyna Pay commits to a minimum of 18 months between Deprecated and Sunset for any major version. This is the migration window for consumers.

### Current state

v1 is currently in Beta. GA target: post-Payroc-production launch (after the 2026-07-21 Payroc integration deadline). Beta consumers (Kasse, SalonBacked, RunMySalon) operate under the understanding that breaking changes may occur during Beta with at minimum 14 days notice.

---

## AUTHENTICATION

### Scheme

All API requests authenticate via Bearer token in the Authorization header:

    Authorization: Bearer rpsk_live_<token>

### Token format

- Prefix indicates environment: `rpsk_live_*` for production, `rpsk_test_*` for sandbox
- Note: the `rpsk_live_` and `rpsk_test_` prefixes are always exactly 10 characters total — 4 chars for `rpsk` + underscore + 4 chars for the environment label (`live` or `test`) + underscore. Both environment labels happen to be 4 characters, so the prefix length is constant regardless of environment. Consumers performing prefix-based validation can rely on this exact 10-character length. The token body following the prefix is opaque.
- Token body is opaque, minimum 32 chars after prefix
- Tokens are issued per-merchant, scoped to that merchant's data
- Tokens are revocable from the merchant's dashboard or via DELETE /v1/api-keys/:id (Tier 2 endpoint)

### Token scopes

Tokens are scoped at issuance. Reyna Pay enforces scope on every endpoint.

| Scope | Permissions |
|-------|-------------|
| `read` | GET on all resources |
| `write` | GET + POST + PATCH on most resources |
| `admin` | Full access including DELETE and sensitive operations (bank token detokenization, merchant boarding) |
| `webhooks` | Read-only access to webhook delivery history; ability to manage webhook subscriptions |
| `reports` | Read-only access to reports endpoints only — for BI tool integrations that should not see individual records |

Multiple scopes can be assigned to one token: `scope=read,write` means GET + POST + PATCH.

### Token lifecycle

- Tokens have no automatic expiration in Tier 1. Future Tier 3 may introduce a 1-year max age with rotation reminders.
- Tokens are stored hashed in the Reyna Pay database. The plaintext token is only shown once at issuance.
- Rotation: a new token can be issued before the old one is revoked, allowing zero-downtime rotation.

### Per-merchant context

Every authenticated request executes in the context of the merchant whose token was used. The engine has NO concept of "calling org" separate from "owning org" for the token. This simplifies the auth model: if you have the token, you have access to that merchant's data and nothing else.

Exception: "platform tokens" are issued to Kasse, SalonBacked, RunMySalon, and white-label brands. Platform tokens allow operations on behalf of any merchant boarded under that platform, with an additional `X-Reyna-Pay-On-Behalf-Of: org_abc123` header that names the target merchant. The engine verifies the target merchant is boarded under the platform that owns the token before authorizing. See PLATFORM TOKENS in Part II for full details.

### Error responses

- Missing token: `401 Unauthorized`, error code `MISSING_AUTH`
- Invalid token: `401 Unauthorized`, error code `INVALID_AUTH`
- Token lacks required scope: `403 Forbidden`, error code `INSUFFICIENT_SCOPE`
- Token revoked: `401 Unauthorized`, error code `TOKEN_REVOKED`
- Platform token attempting operation on non-boarded merchant: `403 Forbidden`, error code `MERCHANT_NOT_OWNED`

---

## IDEMPOTENCY

### Requirement

Every POST and PATCH request to Reyna Pay MUST include an `Idempotency-Key` header. Requests without this header receive `400 Bad Request` with error code `MISSING_IDEMPOTENCY_KEY`.

GET requests do not require an idempotency key — they are inherently safe to retry.

DELETE requests do not require an idempotency key because HTTP semantics define DELETE as idempotent at the protocol level: a second DELETE of an already-deleted resource returns `404 Not Found`, not a cached `204 No Content`.

Consumer retry guidance for DELETE: consumers SHOULD treat `404 Not Found` on a retry of a DELETE call as a SUCCESS case, NOT as a failure. The 404 indicates the resource is already in the desired state (deleted). This is the idempotency convention for DELETE in Reyna Pay.

Concrete pattern:

    // Consumer-side pseudocode — correct DELETE retry handling
    let response;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        response = await fetch(`/v1/api-keys/${keyId}`, { method: "DELETE", ... });
        if (response.status === 204) break;             // success on first delete
        if (response.status === 404) break;             // already deleted — also success
        if (response.status >= 500) {
          attempt++;
          await sleep(backoff(attempt));
          continue;
        }
        throw new Error(`Unexpected status ${response.status}`);
      } catch (networkError) {
        attempt++;
        await sleep(backoff(attempt));
      }
    }

The consumer's retry loop treats 204 and 404 as equivalent terminal success states. Network errors and 5xx errors trigger retries. Any other 4xx is a programming error.

This consumer-side convention means Reyna Pay does NOT need to maintain a delete-replay cache to support safe retries — the natural 404 semantics already provide the guarantee, as long as consumers handle 404 correctly. Consumers that want richer audit trails on destructive operations (e.g., distinguishing "I deleted this" from "this was already gone") should soft-delete and record the delete with a `deleted_at` timestamp on the resource, then GET the resource after a DELETE to confirm state. The engine supports soft-deletes for resources where appropriate; per-resource soft-delete behavior is defined in Tier 2.

### Key format

- UUID v4 (recommended), or any string of 16 to 64 characters. The minimum of 16 characters provides reasonable entropy to avoid accidental collisions in the consumer's own ID generation. UUID v4 is 36 characters and is the recommended default.
- Generated by the consumer, NOT by the engine
- Should be unique per logical operation. Reusing the same key for a "different" operation is a programming error.

### Consumer responsibility for key generation

The engine's idempotency contract describes what happens when a key is received. It says nothing about how the consumer should generate keys, but key generation strategy is the single most important factor in whether idempotency actually protects consumers from duplicate operations.

CORRECT pattern: generate ONE key per logical business operation. The same key is reused on EVERY retry of that same operation.

    // Consumer-side pseudocode — correct
    const idempotencyKey = uuidv4();  // Generated ONCE per business operation
    let response;
    while (retries < maxRetries) {
      try {
        response = await fetch("/v1/charges", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey, ... },
          body: JSON.stringify(charge),
        });
        break;
      } catch (networkError) {
        retries++;
        await sleep(backoff(retries));
      }
    }

INCORRECT pattern: generating a new key per HTTP attempt. This defeats idempotency entirely — every retry looks like a brand-new operation to the engine, and a duplicate charge will execute.

    // Consumer-side pseudocode — WRONG
    while (retries < maxRetries) {
      try {
        const idempotencyKey = uuidv4();  // ← generated INSIDE the retry loop = bug
        response = await fetch("/v1/charges", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey, ... },
          ...
        });
        break;
      } catch (networkError) {
        retries++;
      }
    }

Key generation strategies by use case:

- **One-shot user action** (e.g., user clicks Pay): generate the key when the action is initiated, before the first HTTP call. Persist it (in component state, in a job queue, in a database row) so retries use the same key.
- **Background job**: the job's database row should store the idempotency key. Job retries read it from the row.
- **Webhook retries / consumer-side replay**: the original consumer code should have produced an idempotency key derived from a stable property of the triggering event (e.g., webhook event ID + operation name hashed together).

Consumer implementations of this spec MUST document their key-generation strategy in their own implementation docs. Kasse's strategy is documented in KASSE_ENGINE_BOUNDARY.md (cross-reference).

### Behavior

- **Same key + same request body** within the TTL window: engine returns the cached response. No side effect (the original operation already executed). Body equality is determined by canonical JSON comparison: the engine canonicalizes both the cached and new request bodies per RFC 8785 (JSON Canonicalization Scheme — order keys lexicographically, normalize whitespace, normalize number representation) and compares the resulting byte sequences. This means that JSON serializers producing keys in different orders (which is common across languages — Python's `json.dumps` is order-preserving but Go's `encoding/json` sorts struct fields, while JavaScript's `JSON.stringify` depends on insertion order) do NOT cause false `IDEMPOTENCY_KEY_REUSED` errors. Whitespace differences, key ordering differences, and equivalent number representations (`1` vs `1.0` vs `1e0`) are all treated as the same body.
- **Same key + different request body** within the TTL window: engine returns `409 Conflict` with error code `IDEMPOTENCY_KEY_REUSED`. "Different" is determined AFTER canonicalization per the rule above — semantic differences in the request, not serialization differences. This indicates a consumer bug — either the consumer accidentally reused a key for a different logical operation, or the consumer's request includes a field whose value legitimately differs between retries (e.g., a timestamp generated at retry time). The fix is to generate a new key for the new operation OR to keep the timestamp stable across retries.
- **Same key after TTL expires**: treated as a new request.
- **No key, or empty key**: `400 Bad Request`, error code `MISSING_IDEMPOTENCY_KEY`.

### TTL

- Idempotency keys are retained for 7 days from first use.
- Within those 7 days, replaying the same key returns the cached response.
- After 7 days, the key may be reused for a new operation.

### Response headers

Every response to an idempotent operation includes:

    X-Idempotency-Status: hit | miss | new
    X-Idempotency-Key-Echo: <the key the client sent>

- `hit` — same key + same body, returning cached response
- `miss` — same key, different body, returning 409
- `new` — first time we've seen this key, operation executed

### Scope of idempotency

Idempotency keys are scoped per API key. Two different merchants using the same idempotency key value (unlikely but possible since clients generate the keys) do NOT collide.

### What idempotency does NOT do

- It does not retry the original operation. The original side effect happens once, on the first request. Subsequent requests with the same key return the cached response WITHOUT re-executing the operation.
- It does not provide ordering guarantees. If a consumer fires two operations in parallel with different keys, they execute in arbitrary order.
- It does not survive engine database loss. If the engine's idempotency store is wiped, replays after that point may double-execute. Consumers should not rely on idempotency surviving catastrophic engine state loss.

---

## ERROR FORMAT

### Single shape for all errors

Every error response, regardless of which endpoint produced it, follows this exact JSON shape:

    {
      "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "The charge with ID ch_abc123 was not found",
        "type": "invalid_request_error",
        "param": "charge_id",
        "request_id": "req_xyz789",
        "docs": "https://docs.reynapay.com/errors/RESOURCE_NOT_FOUND"
      }
    }

Fields:

- `code` (string, required) — Machine-readable error code. SHALL be one of the codes defined below.
- `message` (string, required) — Human-readable description. SHALL include enough detail to debug without exposing sensitive data.
- `type` (string, required) — High-level error category, one of `invalid_request_error`, `authentication_error`, `authorization_error`, `idempotency_error`, `rate_limit_error`, `api_error`, `integration_error`.
- `param` (string, optional) — When the error is parameter-related, identifies the specific parameter.
- `request_id` (string, required) — Unique request ID for support and debugging. Echo this when contacting Reyna Pay support.
- `docs` (string, required) — URL to the human-readable error documentation.

### HTTP status codes

| Status | Type | When |
|--------|------|------|
| 200 | — | Success (GET) |
| 201 | — | Success (POST creates) |
| 202 | — | Accepted (long-running operation, check webhook for completion) |
| 204 | — | Success with no body (PATCH, DELETE) |
| 400 | invalid_request_error | Validation error, missing required field, malformed JSON |
| 401 | authentication_error | Missing or invalid token |
| 403 | authorization_error | Token lacks scope or accessing forbidden resource |
| 404 | invalid_request_error | Resource not found |
| 409 | invalid_request_error or idempotency_error | Conflict (state transition not allowed, idempotency key collision) |
| 410 | invalid_request_error | Endpoint deprecated and sunset |
| 422 | invalid_request_error | Business rule violation (e.g., refund exceeds original charge amount) |
| 429 | rate_limit_error | Rate limit exceeded |
| 500 | api_error | Internal engine error |
| 502 | integration_error | Upstream Payroc error |
| 503 | api_error | Engine maintenance mode |
| 504 | integration_error | Upstream Payroc timeout |

### Error code catalog

Authentication / Authorization:
- `MISSING_AUTH` — Authorization header absent
- `INVALID_AUTH` — token cannot be parsed or recognized
- `TOKEN_REVOKED` — token was revoked
- `INSUFFICIENT_SCOPE` — token does not have required scope for this endpoint
- `MERCHANT_NOT_OWNED` — platform token attempting access to non-owned merchant

Request:
- `RESOURCE_NOT_FOUND` — resource does not exist or is not accessible to caller
- `VALIDATION_ERROR` — request body fails schema validation
- `MISSING_REQUIRED_FIELD` — required field omitted
- `INVALID_FIELD_VALUE` — field value out of range or invalid format
- `MALFORMED_JSON` — request body is not valid JSON

Idempotency:
- `MISSING_IDEMPOTENCY_KEY` — POST/PATCH without Idempotency-Key header
- `IDEMPOTENCY_KEY_REUSED` — same key, different body

Rate limit:
- `RATE_LIMITED` — request rate exceeds tier allowance
- `DAILY_QUOTA_EXCEEDED` — daily request budget exhausted

Engine / integration:
- `INTERNAL_ERROR` — unexpected engine error (with request_id for support)
- `PAYROC_UPSTREAM_ERROR` — Payroc returned an error
- `PAYROC_TIMEOUT` — Payroc did not respond within timeout window
- `MAINTENANCE_MODE` — engine is in scheduled maintenance

Resource-specific error codes are defined in Part II under each resource's "Special considerations" section and consolidated below.

### Resource-specific error codes (Tier 2)

Authentication / Authorization (additions):
- `PLATFORM_TOKEN_REQUIRED` — operation is platform-scope-only, regular token used
- `ON_BEHALF_OF_REQUIRED` — operation requires X-Reyna-Pay-On-Behalf-Of header on platform token
- `ON_BEHALF_OF_NOT_ALLOWED` — header provided on non-platform token
- `MERCHANT_NOT_OWNED` — platform token attempting operation on a merchant not boarded under this platform

Merchant-related:
- `MERCHANT_NOT_BOARDED` — operation requires boarded merchant, current status is not `boarded`
- `MERCHANT_SUSPENDED` — operation blocked due to suspension
- `MERCHANT_FIELD_NOT_WRITABLE` — attempting to PATCH a write-once field (ein, owner_ssn_last4, owner_dob)

Charge-related:
- `CHARGE_AMOUNT_TOO_LOW` — amount below merchant's per-currency minimum
- `CHARGE_AMOUNT_TOO_HIGH` — amount exceeds merchant's per-currency maximum or daily volume limit
- `CHARGE_PAYMENT_METHOD_NOT_ACCEPTED` — merchant does not accept the requested payment method
- `CHARGE_ALREADY_SETTLED` — void attempted after settlement window closed
- `CHARGE_ALREADY_REFUNDED` — refund attempted on fully-refunded charge
- `CHARGE_RISK_DECLINED` — engine-side risk rule blocked the charge
- `AUTHORIZATION_EXPIRED` — auth-only charge passed expiration window without capture; held funds released by issuing bank

Refund-related:
- `REFUND_AMOUNT_EXCEEDS_CHARGE` — refund amount exceeds available refundable balance

Card-related:
- `CARD_EXPIRED` — saved card past expiration date
- `CARD_DECLINED` — issuing bank declined the charge

Bank token-related:
- `BANK_TOKEN_NOT_FOUND` — referenced token does not exist or does not belong to this merchant
- `BANK_TOKEN_VAULT_ERROR` — Payroc vault rejected the bank account info

Dispute-related:
- `DISPUTE_EVIDENCE_TOO_LARGE` — evidence file exceeds engine size limit (50MB per file)
- `DISPUTE_DEADLINE_PASSED` — evidence submission after deadline

Webhook-related:
- `WEBHOOK_URL_INSECURE` — HTTP URL provided (HTTPS required)
- `WEBHOOK_EVENT_TYPE_UNKNOWN` — subscribed event type not in catalog
- `WEBHOOK_ROTATION_IN_PROGRESS` — rotate-secret called while previous rotation grace period active

Checkout session:
- `CHECKOUT_SESSION_EXPIRED` — session past expires_at
- `CHECKOUT_SESSION_ALREADY_USED` — session_token already consumed
- `CHECKOUT_SESSION_REDIRECT_URL_NOT_ALLOWED` — return_url or cancel_url scheme is not https, OR host is not in merchant's redirect_domains allowlist
- `CHECKOUT_SESSION_REDIRECT_URL_MALFORMED` — URL cannot be parsed as a valid URL
- `CHECKOUT_SESSION_NO_REDIRECT_DOMAINS_CONFIGURED` — POST /v1/checkout-sessions called for a merchant whose redirect_domains field is empty or null

### Error message guidelines

- NEVER include raw card numbers, bank account numbers, or other sensitive data in error messages
- NEVER include stack traces in production error messages
- DO include enough information to identify which resource or parameter caused the error
- DO include request_id for support escalation

---

## PAGINATION

### Single shape for all list responses

Every list endpoint returns this exact shape:

    {
      "data": [/* array of resources */],
      "pagination": {
        "total_count": 1234,
        "page_size": 20,
        "has_more": true,
        "next_cursor": "eyJpZCI6ImNoX2FiYzEyMyJ9",
        "prev_cursor": null
      }
    }

### Pagination methods

Two methods supported. Consumer picks one per request.

**Cursor-based (recommended for production):**

    GET /v1/charges?cursor=eyJpZCI6ImNoX2FiYzEyMyJ9&page_size=20

- `cursor` parameter is an opaque string returned in the previous response's `next_cursor`.
- `page_size` defaults to 20, maximum 100.
- `next_cursor` is null when there are no more results.
- Cursors are stable: a cursor returned today will return the same page tomorrow even if records are added or removed.

**Offset-based (acceptable for simple integrations, lower performance):**

    GET /v1/charges?page=3&page_size=20

- `page` is 1-indexed.
- `page_size` defaults to 20, maximum 100.
- NOT stable: if records are added/removed between requests, pages may skip or duplicate records. Consumers concerned about consistency should use cursor-based.

Mixing `cursor` and `page` in the same request: `400 Bad Request`, error code `INVALID_FIELD_VALUE`.

### Sorting

Default sort: most recent first (descending by `created` timestamp).

Override with `sort` parameter:

    GET /v1/charges?sort=amount.desc
    GET /v1/charges?sort=created.asc

Per-resource sort fields are defined in Tier 2.

### Filtering

Filter parameters are defined per-resource in Tier 2. Common patterns:

- Date range: `created_after=2026-01-01T00:00:00Z&created_before=2026-12-31T23:59:59Z`
- Status: `status=succeeded` or `status=succeeded,refunded` (comma-separated for OR)
- Foreign key: `customer_id=cust_abc123`

Invalid filter values: `400 Bad Request`, error code `INVALID_FIELD_VALUE`.

---

## RATE LIMITS

### Tiers

| Tier | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Starter | 60 | 10,000 |
| Growth | 300 | 100,000 |
| Enterprise | 1,000 | Unlimited |
| Platform (Kasse, SalonBacked, RunMySalon, certified white-label) | 5,000 | Unlimited |
| Internal (Reyna Pay's own ops) | Unlimited | Unlimited |

*Note: Platform tier enforcement depends on the platform-token mechanism (the `X-Reyna-Pay-On-Behalf-Of` header and per-platform-merchant authorization model) which is defined in Tier 2 of this spec. Until Tier 2 ships, the rate limiter implementation MUST treat Platform tier as a STUB classification. Implementation guidance: assign Platform tier limits only after the API key's `tier` field returns `platform` — until the platform-token system is built, no key will have that classification, so this row is documentary until activated. The rate limiter SHOULD include the Platform row in its tier lookup table from day one so adding the classification later is a database-update operation, not a code change.*

Tier is determined by the API key's subscription level, not by the requesting IP.

### Headers on every response

Every response (including errors) includes:

    X-RateLimit-Limit-Minute: 300
    X-RateLimit-Remaining-Minute: 245
    X-RateLimit-Reset-Minute: 1714500060

    X-RateLimit-Limit-Day: 100000
    X-RateLimit-Remaining-Day: 89432
    X-RateLimit-Reset-Day: 1714521600

Reset values are Unix timestamps (seconds since epoch).

### 429 behavior

When rate limited:
- Status: `429 Too Many Requests`
- Error code: `RATE_LIMITED` (minute exceeded) or `DAILY_QUOTA_EXCEEDED` (daily exceeded)
- `Retry-After` header indicates seconds until the next minute-window opens

### Burst behavior

Reyna Pay uses a token bucket per API key. The bucket refills at the per-minute rate. Bursts up to the full per-minute allowance are accepted instantly. Sustained traffic above the per-minute rate is shaped at the per-minute rate.

### Per-endpoint limits

Per-endpoint limits for sensitive operations (e.g., bank token detokenization: 10/minute, reports: 10/minute regardless of overall tier). These compose with the overall tier limits — both are enforced. See each resource's "Special considerations" in Part II for per-endpoint rate limit details.

---

## WEBHOOKS

### Concept

When state changes in Reyna Pay (a charge completes, a refund is processed, a payout settles, a dispute opens, a merchant is boarded), Reyna Pay sends an HTTP POST to consumer-registered webhook URLs with an event envelope.

Consumers do NOT need to poll. Webhook delivery is at-least-once: consumers MUST handle duplicate deliveries.

### Envelope shape

Every webhook delivery POST body is this exact shape:

    {
      "id": "evt_01234567abc",
      "type": "charge.completed",
      "created": "2026-05-13T14:30:00Z",
      "api_version": "v1",
      "livemode": true,
      "organization_id": "org_abc123",
      "data": {
        /* event-specific payload, defined per event type in Tier 2 */
      }
    }

Fields:
- `id` — Unique event ID. Use this for deduplication.
- `type` — Dot-namespaced event type (e.g., `charge.completed`).
- `created` — ISO 8601 timestamp of when the event was generated.
- `api_version` — Engine API version that produced the event payload.
- `livemode` — `true` for production events, `false` for sandbox events.
- `organization_id` — The merchant this event pertains to.
- `data` — Event-specific payload, defined per event type in Tier 2.

### Webhook subscription management

Consumers register webhook endpoints via Tier 2 endpoints (`POST /v1/webhooks`). Each subscription specifies:
- Target URL (HTTPS only — HTTP rejected at creation)
- Subscribed event types (or wildcard `*`)
- Active status (can be paused without deletion)
- Optional description

### Signing

Every webhook POST includes a signature header:

    Reyna-Pay-Signature: t=1714500000,v1=hex_hmac_sha256

Where:
- `t` — Unix timestamp of when the engine sent the request
- `v1=` — HMAC-SHA256 of `<t>.<request body>` using the webhook subscription's signing secret

### Verification process (consumer side)

1. Extract the timestamp `t` from the header
2. Check that `t` is within the last 5 minutes — reject if older (replay attack protection). Consumers SHOULD account for up to 60 seconds of forward clock skew when implementing this check — i.e., accept events with timestamps up to 60 seconds in the future relative to the consumer's clock, since the engine's clock and the consumer's clock may drift independently. NTP-synchronized infrastructure typically stays within 100ms but consumers on stale infrastructure may drift further. The 5-minute backward window plus 60-second forward tolerance handles the vast majority of legitimate cases without weakening replay protection materially.
3. Compute HMAC-SHA256 of `<t>.<raw request body>` using the webhook's signing secret
4. Constant-time compare against `v1=` value in the header
5. If match: trust the payload as coming from Reyna Pay. Process the event.
6. If no match: reject with 400 — do not process the payload.

Reference implementation snippets will be provided in Tier 2.

### Delivery semantics

- At-least-once: a single state change may produce multiple deliveries. Consumer dedupes by event `id`.
- Order not guaranteed: a `refund.created` for the same charge may arrive before its `charge.completed`. Consumer should handle out-of-order events by using event `created` timestamps for ordering when ordering matters.
- Retry policy: if the consumer's endpoint returns non-2xx or times out (10s default), Reyna Pay retries with exponential backoff for 72 hours. After 72 hours of failures, the event is moved to a "failed" state and the webhook subscription receives a `webhook.delivery_failed_persistent` notification.
- Replay: consumers can request manual replay of any past event via `POST /v1/webhooks/:id/deliveries/:delivery_id/replay` (Tier 2 endpoint).

### Event type catalog (Tier 1 — names only, payload shapes in Tier 2)

Charges and refunds:
- `charge.created`
- `charge.completed`
- `charge.failed`
- `charge.authorization_expired`
- `refund.created`
- `refund.completed`
- `refund.failed`
- `void.completed`

Bank tokens and payouts:
- `bank_token.created`
- `bank_token.deleted`
- `payout.created`
- `payout.completed`
- `payout.failed`

Disputes:
- `dispute.created`
- `dispute.updated`
- `dispute.closed`

Merchants:
- `merchant.boarding_started`
- `merchant.boarded`
- `merchant.boarding_failed`
- `merchant.settings_updated`
- `merchant.suspended`
- `merchant.reinstated`

Checkout sessions:
- `checkout_session.created`
- `checkout_session.completed`
- `checkout_session.expired`

Webhook system events:
- `webhook.delivery_succeeded` (the meta-webhook)
- `webhook.delivery_failed_persistent`
- `webhook.secret_rotated`

Each event type's `data` payload is documented in the corresponding RESOURCE section in PART II (e.g., `charge.completed` payload is documented under RESOURCE: CHARGES → Webhook events). The webhook envelope structure (id, type, created, api_version, livemode, organization_id, data) is constant; only the `data` field's shape varies by event type.

---

## HATEOAS — HYPERMEDIA LINKS

### Concept

Every response that returns a resource includes a `_links` object listing legitimate next actions. This is the agent-discoverability mechanism — AI agents do not need to read prose documentation to know what they can do; the response itself tells them.

### Shape

Example for a charge:

    {
      "id": "ch_abc123",
      "status": "completed",
      "amount": 25000,        // integer cents — $250.00 USD per COMMON CONVENTIONS
      "currency": "usd",
      "customer_id": "cust_xyz789",
      "_links": {
        "self": {
          "href": "/v1/charges/ch_abc123",
          "method": "GET"
        },
        "refund": {
          "href": "/v1/charges/ch_abc123/refunds",
          "method": "POST"
        },
        "void": {
          "href": "/v1/charges/ch_abc123/void",
          "method": "POST",
          "description": "Same-day void; not available after settlement"
        },
        "customer": {
          "href": "/v1/customers/cust_xyz789",
          "method": "GET"
        },
        "receipt": {
          "href": "/v1/charges/ch_abc123/receipt",
          "method": "GET"
        }
      }
    }

### Conventions

- Every resource response includes `_links.self` pointing to the canonical GET URL.
- When an action is conditionally available (e.g., void only for same-day charges), the `_links` object includes the action only when the action is currently possible. If void is no longer possible because the charge has settled, `_links.void` is omitted.
- When an action requires additional context, the link entry includes a `description` field.
- List endpoints return `_links` at the top level for pagination (next, prev) and on each item in `data`.

### Why this matters

Part IV (Agent-Native Design) expands on agent-native semantics. For the HATEOAS layer, the principle is: every response is self-describing. An AI agent receiving a charge object knows it can refund, void, or fetch the receipt without reading any documentation.

---

## OPENAPI 3.1 COMMITMENT

### Single source of truth

The OpenAPI 3.1 specification document is the authoritative description of every endpoint. Prose documentation (this doc and docs.reynapay.com) is derived from the OpenAPI document. When prose and OpenAPI disagree, OpenAPI wins.

### Publishing

- Machine-readable: `GET /v1/openapi.json` (no authentication required for the spec itself; the endpoints described in the spec require authentication)
- Human-readable: `https://docs.reynapay.com/v1/` (rendered from the OpenAPI document via a tool like Stoplight, Redoc, or Swagger UI)
- Versioned: `GET /v1/openapi.json` returns the v1 spec; future `GET /v2/openapi.json` returns v2

### Generation

Reyna Pay's implementation SHALL generate the OpenAPI document from the source code (decorator-based or annotation-based generation). Manually maintaining a separate OpenAPI document is forbidden — it drifts and creates two sources of truth.

Recommended tools (engine team to evaluate in Tier 2):
- For Next.js/TypeScript: `@asteasolutions/zod-to-openapi`, `next-openapi-gen`, `tsoa`
- For other stacks: native OpenAPI generators for the chosen language/framework

### Validation

- The published OpenAPI spec SHALL be validated against the OpenAPI 3.1 schema at CI time.
- SDKs and client libraries (see Part III — SDKs AND CLIENT LIBRARIES) SHALL be auto-generated from the OpenAPI spec.

---

## COMMON CONVENTIONS

### Identifiers

- All resource IDs are prefixed by resource type: `ch_*` (charge), `re_*` (refund), `cust_*` (customer), `org_*` (organization), `bt_*` (bank token), `po_*` (payout), `dp_*` (dispute), `cs_*` (checkout session), `evt_*` (webhook event), `req_*` (request).
- Prefix is followed by a high-entropy alphanumeric string (recommended: base62-encoded UUID or KSUID for sortability).
- IDs are opaque to consumers. Consumers SHALL NOT parse or assume structure beyond the prefix.

### Timestamps

- All timestamps are ISO 8601 with timezone, in UTC: `2026-05-13T14:30:00Z`
- All durations are integer seconds.

### Money

- All amounts are integer cents (or smallest unit of the currency). Example: $25.00 is represented as `2500`, never as `25.00` or `25`.
- All money fields are accompanied by a `currency` field with the ISO 4217 code (lowercase): `usd`, `cad`, `eur`.
- Currency is per-merchant-default but may be overridden per-charge in Tier 2.

### Boolean fields

- Boolean fields use `_at` suffix for timestamp-or-null pattern when applicable: `paid_at: "2026-05-13T14:30:00Z" | null` instead of `is_paid: boolean`. This convention captures WHEN the state was reached, not just whether it was reached.
- When a pure boolean is needed, the field is named with `is_` prefix: `is_test_mode: true`.

### Field naming

- `snake_case` for all field names (matches Stripe, Plaid; easier to read in JSON than camelCase).
- Plural for collection fields: `addons: [...]`, `tags: [...]`.
- Singular for foreign-key fields: `customer_id`, NOT `customer`.

### Foreign keys vs embeds

- Default: return the foreign key ID (e.g., `customer_id: "cust_abc123"`).
- When the consumer needs the full related resource, they fetch it separately or use the `expand` parameter (Tier 2 per-endpoint).
- Example expansion: `GET /v1/charges/ch_abc123?expand=customer` returns the charge with a full `customer` object instead of just `customer_id`.

### Request and response content type

- All request bodies: `Content-Type: application/json`
- All response bodies: `Content-Type: application/json`
- No support for `application/x-www-form-urlencoded` or `multipart/form-data` except where explicitly documented per endpoint (e.g., file uploads in Tier 2).

### Locales and languages

- English error messages only in v1. International localization is deferred to v2 (see Part III — Cross-border data transfer).

---

## SANDBOX / TEST MODE

Detailed sandbox specification is Tier 3. Tier 1 lays the principle:

- Test mode uses a parallel set of credentials (`rpsk_test_*` tokens) and a separate data store.
- Test mode operations do not affect production data.
- Test mode is available before production merchant boarding completes.
- Test card numbers, test bank account numbers, simulated failure modes, and test webhook delivery are documented in Part III — SANDBOX AND TEST MODE.

---

## REQUEST ID

Every request to Reyna Pay generates a unique request ID. This is included:

- In the response header: `Reyna-Pay-Request-Id: req_xyz789`
- In every error body's `error.request_id` field
- In the engine's audit log for that request

Consumers SHALL include the request ID when contacting support. Logs without request IDs are extremely difficult to correlate to engine-side state.

---

# PART II — RESOURCE DEFINITIONS

Tier 2 of this specification. Each section below defines one resource: the schema fields, the operations available on it, the query parameters for list endpoints, and the webhook events associated with the resource.

Every resource definition follows an identical template for consistency. The template is:

- **Resource name and identifier prefix** (e.g., Charges, prefix `ch_`)
- **Description and use cases**
- **Schema** — every field, with the following columns:
    - **Type** — string, integer, boolean, timestamp, enum, array, object
    - **Nullable** — `yes` if the field can be null in responses, `no` if it is always present
    - **Writable** — one of:
      - `yes` — consumer can set this field via POST or PATCH
      - `no` — read-only, consumer cannot set
      - `server-assigned` — the engine assigns this field on create; consumer cannot override
      - `server-managed` — the engine maintains this field over time (e.g., `updated_at`)
      - `yes (write-once)` — consumer can set on POST, but PATCH attempts to change it return `MERCHANT_FIELD_NOT_WRITABLE` (or the equivalent per-resource error)
    - **Notes** — anything special about the field (e.g., format constraints, encryption-at-rest requirements, special validation rules)
- **Operations** — list, retrieve, create, update, delete, and resource-specific actions
- **Filtering and sorting** — for list endpoints
- **Expansion** — which related resources can be inlined via the `expand` parameter
- **HATEOAS _links** — the action links included in responses
- **Webhook events** — with full data payload definitions
- **Special considerations** — anything resource-specific (PCI implications, async behavior, rate limit exceptions)

Resources are presented in implementation priority order: foundational resources first (Merchants, Customers), then payment instruments (Cards, Bank Tokens), then payment lifecycle (Charges, Refunds, Voids, Payouts, Disputes), then specialized (Checkout Sessions, Transactions, Reports), then meta-resources (API Keys, Webhooks).

---

## PLATFORM TOKENS (closes Tier 1 deferred item)

Platform tokens are a distinct token type issued to consumers that operate on behalf of multiple merchants:
- Kasse, SalonBacked, RunMySalon
- Certified white-label brands consuming Kasse or SalonBacked

Platform tokens have a different prefix:
- `rpsp_live_*` for production platform tokens
- `rpsp_test_*` for sandbox platform tokens

Platform tokens carry the same scope concepts (read, write, admin, webhooks, reports) but additionally require an `X-Reyna-Pay-On-Behalf-Of` header naming the target merchant on every request that operates on a specific merchant's data.

Example platform-token request:

    POST /v1/charges
    Authorization: Bearer rpsp_live_<token>
    X-Reyna-Pay-On-Behalf-Of: org_abc123
    Idempotency-Key: <uuid>
    Content-Type: application/json

    { "amount": 25000, "currency": "usd", ... }

Engine behavior on platform-token requests:
1. Authenticate the platform token (lookup in api_keys table, verify not revoked, verify scope)
2. Read the `X-Reyna-Pay-On-Behalf-Of` header to determine target merchant
3. Verify the platform owns (is the boarding platform for) the target merchant — if not, return 403 with code `MERCHANT_NOT_OWNED`
4. Execute the operation in the context of the target merchant
5. Charge rate limits to the platform's quota, NOT the merchant's quota

Operations that do not involve a specific merchant (e.g., listing all merchants under the platform, fetching platform-level reports) can be called without `X-Reyna-Pay-On-Behalf-Of`. The engine inspects the endpoint definition (per the OpenAPI spec) to determine whether the header is required.

Platform-token-related error codes (extending the Tier 1 catalog):
- `PLATFORM_TOKEN_REQUIRED` — operation is platform-scope-only, regular token used
- `ON_BEHALF_OF_REQUIRED` — operation requires X-Reyna-Pay-On-Behalf-Of header on platform token, not provided
- `ON_BEHALF_OF_NOT_ALLOWED` — header provided on non-platform token (regular tokens never set this)
- `MERCHANT_NOT_OWNED` — platform attempting operation on merchant not boarded under this platform

Issuance: platform tokens are issued by Reyna Pay LLC (Robert) through an admin process. They cannot be self-served. Each platform token includes the platform's identifier in its metadata so the engine can resolve the platform-merchant relationship at auth time.

---

## RESOURCE: MERCHANTS

### Identity

- Resource name: Merchant
- Identifier prefix: `org_*` (organization, since merchants are organizations in the engine's data model)
- Plural endpoint: `/v1/merchants`

### Description

A merchant is a business that processes payments through Reyna Pay. Every charge, refund, payout, dispute, and bank token belongs to exactly one merchant. The merchant resource is the root tenant boundary — Tier 1's tenant isolation rule (every endpoint filters by authenticated merchant) means every other resource is scoped to a merchant.

Merchants are boarded through a multi-step process:
1. Application submission (via POST /v1/merchants) with business info, owner info, banking info (bank token), payment volume estimates
2. KYC/KYB review by Reyna Pay LLC (currently manual; Payroc Boarding API integration is Phase 10+ on the engine side)
3. Payroc terminal provisioning (currently manual via ERF)
4. Merchant marked as `boarded`, can begin processing charges

Until step 4 completes, the merchant cannot process charges. Webhook events fire at each step.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `org_<base62>` |
| `legal_name` | string | no | yes | Business legal name as registered with state |
| `dba_name` | string | yes | yes | Doing-business-as name; defaults to legal_name |
| `business_type` | enum | no | yes | One of: `sole_proprietorship`, `single_member_llc`, `multi_member_llc`, `c_corp`, `s_corp`, `partnership`, `nonprofit` |
| `ein` | string | yes | yes (write-once) | Encrypted at rest in engine database. Returned only as last-4 in API responses (`ein_last4`). Full value never returned. |
| `mcc` | string | no | yes | 4-digit Merchant Category Code |
| `vertical` | string | no | yes | High-level vertical: `salon`, `restaurant`, `gym`, `retail`, `service`, `other` |
| `email` | string | no | yes | Primary business contact email |
| `phone` | string | no | yes | E.164 format business phone |
| `address` | object | no | yes | `{ line1, line2, city, state, postal_code, country }` |
| `owner_first_name` | string | no | yes | Beneficial owner (>25% ownership) first name |
| `owner_last_name` | string | no | yes | Beneficial owner last name |
| `owner_ssn_last4` | string | no | yes (write-once) | Encrypted at rest. Returned as `••••` in API responses; full value never returned. |
| `owner_dob` | string | no | yes (write-once) | ISO 8601 date. Encrypted at rest. Returned as year-only (`1985`) in API responses. |
| `owner_email` | string | no | yes | Owner personal email |
| `owner_phone` | string | no | yes | Owner personal phone |
| `bank_token_id` | string | yes | yes | Reference to the merchant's primary bank account, a `bt_*` token from the Bank Tokens resource |
| `payment_volume_monthly_estimate` | integer | no | yes | Estimated monthly volume in cents |
| `avg_transaction_estimate` | integer | no | yes | Estimated average transaction in cents |
| `accepts_payment_methods` | array | no | yes | List of methods: `card_present`, `card_not_present`, `ach`, `cash`, `gift_card` |
| `redirect_domains` | array of string | no | yes | Allowlist of fully-qualified domain names that Checkout Sessions can redirect to. Max 10 entries. Exact host match only (no wildcards). Each entry is a hostname like `app.kasseapp.com`. Required to use Checkout Sessions resource. |
| `boarding_status` | enum | no | server-managed | One of: `submitted`, `under_review`, `approved`, `boarded`, `rejected`, `suspended` |
| `boarding_status_reason` | string | yes | server-managed | Human-readable explanation when status is `rejected` or `suspended` |
| `boarded_at` | timestamp | yes | server-managed | When merchant became `boarded` |
| `created_at` | timestamp | no | server-managed | When application was submitted |
| `updated_at` | timestamp | no | server-managed | When any field last changed |
| `payroc_merchant_id` | string | yes | server-managed | Underlying Payroc MID; populated when boarded; opaque to consumers |
| `metadata` | object | yes | yes | Free-form key/value object for consumer-side reference data |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/merchants` | List merchants (platform-scoped only — regular merchant tokens can only see their own merchant via GET on the singular endpoint) |
| GET | `/v1/merchants/:id` | Retrieve a merchant |
| POST | `/v1/merchants` | Submit a merchant boarding application |
| PATCH | `/v1/merchants/:id` | Update mutable merchant fields (legal_name, dba_name, email, phone, address, metadata; restricted fields like ein and owner_ssn_last4 are write-once and cannot be patched) |
| POST | `/v1/merchants/:id/suspend` | Suspend a merchant (admin-scope only, halts new charges, preserves history) |
| POST | `/v1/merchants/:id/reinstate` | Reinstate a suspended merchant (admin-scope only) |

### Filtering and sorting (list endpoint)

Available query parameters:
- `boarding_status` — filter by status (single value or comma-separated for OR)
- `vertical` — filter by vertical
- `created_after`, `created_before` — date range
- `boarded_after`, `boarded_before` — date range on `boarded_at`
- `sort` — `created.desc` (default), `created.asc`, `legal_name.asc`

### Expansion

Available `expand` values:
- `bank_token` — inline the merchant's primary bank token object instead of just the `bank_token_id`

### HATEOAS _links

Examples by boarding_status:

Status `submitted`: `self` (GET), `update` (PATCH)

Status `boarded`: `self`, `update`, `charges` (GET /v1/charges), `payouts` (GET /v1/payouts), `disputes` (GET /v1/disputes), `suspend` (POST — admin-only)

Status `suspended`: `self`, `reinstate` (POST — admin-only)

### Webhook events

- `merchant.boarding_started` — fired when POST /v1/merchants succeeds. Data: full merchant object with boarding_status=submitted.
- `merchant.boarded` — fired when boarding completes. Data: full merchant object with boarding_status=boarded and boarded_at populated.
- `merchant.boarding_failed` — fired when boarding fails. Data: full merchant object with boarding_status=rejected and boarding_status_reason populated.
- `merchant.settings_updated` — fired on any PATCH that changes any field. Data: full merchant object plus a `changes` array listing the field paths that changed.
- `merchant.suspended` — fired on suspend. Data: full merchant object with boarding_status=suspended and boarding_status_reason populated.
- `merchant.reinstated` — fired on reinstate. Data: full merchant object with boarding_status=boarded.

### Special considerations

- **PII encryption at rest:** `ein`, `owner_ssn_last4`, `owner_dob` are encrypted at the database level. The engine MUST never store these in plaintext, even temporarily. AWS KMS envelope encryption is the required pattern per KASSE_PII_ENCRYPTION.md.
- **PCI scope:** Merchants do NOT carry card-storage scope; that lives on Customers and Cards resources. Merchant boarding does include bank account info but only via a `bank_token_id` reference — the engine vaults the underlying bank account in Bank Tokens, never on the Merchant directly.
- **Tenant isolation:** A merchant can NEVER see another merchant's data. Platform-token consumers (Kasse, etc.) can see all merchants under their platform via the list endpoint or `X-Reyna-Pay-On-Behalf-Of` per-merchant on singular endpoints.
- **redirect_domains allowlist:** Required if the merchant intends to use Checkout Sessions. The engine validates Checkout Session `return_url` and `cancel_url` against this list. See Checkout Sessions Special considerations for the validation rules.

---

## RESOURCE: CUSTOMERS

### Identity

- Resource name: Customer
- Identifier prefix: `cust_*`
- Plural endpoint: `/v1/customers`

### Description

A customer is a person who makes purchases at a merchant. The Reyna Pay Customer is the Payroc-customer-of-merchant concept — distinct from Kasse's Client model. Kasse maps its Client to the engine's Customer when making charges on behalf of a saved customer.

Customers can have saved cards and bank tokens attached for repeat purchases. The customer resource stores contact info and references to payment instruments; it never stores raw card or bank data.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `cust_<base62>` |
| `merchant_id` | string | no | server-assigned | The merchant this customer belongs to |
| `email` | string | yes | yes | Customer email |
| `phone` | string | yes | yes | E.164 format |
| `name` | string | yes | yes | Full name |
| `address` | object | yes | yes | `{ line1, line2, city, state, postal_code, country }` |
| `default_card_id` | string | yes | yes | Default saved card (`card_*`) for charges |
| `default_bank_token_id` | string | yes | yes | Default bank token (`bt_*`) for ACH |
| `metadata` | object | yes | yes | Free-form key/value |
| `deleted_at` | timestamp | yes | server-managed | Soft-delete marker |
| `created_at` | timestamp | no | server-managed | |
| `updated_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/customers` | List customers for the authenticated merchant |
| GET | `/v1/customers/:id` | Retrieve a customer |
| POST | `/v1/customers` | Create a customer |
| PATCH | `/v1/customers/:id` | Update customer fields |
| DELETE | `/v1/customers/:id` | Soft-delete (sets deleted_at; customer data retained for charge history) |

### Filtering and sorting

- `email` — exact match or prefix search
- `name` — partial match
- `created_after`, `created_before` — date range
- `sort` — `created.desc` (default), `name.asc`

### Expansion

- `default_card` — inline the default card object
- `cards` — inline all cards for this customer

### HATEOAS _links

Standard: `self`, `update`, `delete`, `cards` (GET /v1/customers/:id/cards), `charges` (GET /v1/charges?customer_id=:id)

### Webhook events

- `customer.created` — Data: full customer object.
- `customer.updated` — Data: full customer object plus `changes` array.
- `customer.deleted` — Data: full customer object with deleted_at populated.

### Special considerations

- **Soft-delete:** DELETE sets `deleted_at` rather than removing the row. Soft-deleted customers do not appear in list results by default; add `include_deleted=true` to see them. Charges referencing a deleted customer still resolve the customer data for historical reporting.

---

## RESOURCE: CARDS

### Identity

- Resource name: Card
- Identifier prefix: `card_*`
- Plural endpoint: `/v1/customers/:customer_id/cards` (nested under customer)

### Description

A saved card token for repeat purchases. Cards are tokenized via Payroc Hosted Fields — the engine never stores raw PAN. The card object stores brand, last4, expiration, and an opaque Payroc token reference.

Cards are immutable. To "update" a card (new expiration, new number), create a new card and optionally set it as default on the customer.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `card_<base62>` |
| `customer_id` | string | no | server-assigned | The customer who owns this card |
| `merchant_id` | string | no | server-assigned | The merchant context |
| `brand` | string | no | server-managed | `visa`, `mastercard`, `amex`, `discover`, `other` |
| `last4` | string | no | server-managed | Last 4 digits of card number |
| `exp_month` | integer | no | server-managed | 1-12 |
| `exp_year` | integer | no | server-managed | 4-digit year |
| `billing_address` | object | yes | server-managed | Address provided during tokenization |
| `is_default` | boolean | no | yes | Whether this is the customer's default card |
| `created_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/customers/:customer_id/cards` | List cards for a customer |
| GET | `/v1/customers/:customer_id/cards/:id` | Retrieve a card |
| POST | `/v1/customers/:customer_id/cards` | Create a card (requires a completed checkout session token from Hosted Fields) |
| DELETE | `/v1/customers/:customer_id/cards/:id` | Delete a card (permanent — removes the token from Payroc) |

No PATCH — cards are immutable.

### Webhook events

- `card.created` — Data: full card object.
- `card.deleted` — Data: full card object (snapshot at time of deletion).

### Special considerations

- **PCI scope:** The engine NEVER stores raw PAN, CVV, or full card number. The `card` resource stores brand + last4 + exp + an opaque Payroc token reference. All PCI-scoped data lives in Payroc's vault.
- **Immutability:** Cards cannot be updated. This matches Payroc's underlying model — a token is bound to a specific card number.

---

## RESOURCE: BANK TOKENS

### Identity

- Resource name: Bank Token
- Identifier prefix: `bt_*`
- Plural endpoint: `/v1/bank-tokens`

### Description

A tokenized bank account for ACH push (merchant payouts) and future merchant-to-customer ACH disbursements. The create operation vaults a routing number + account number in Payroc's secure vault and returns an opaque token. The engine stores only the token, never the raw bank data.

This is the engine endpoint that closes Kasse Phase 0.6-c — Kasse calls `POST /v1/bank-tokens` through the engine instead of calling Payroc directly.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `bt_<base62>` |
| `merchant_id` | string | no | server-assigned | The merchant this token belongs to |
| `customer_id` | string | yes | yes | Null when bank account belongs to merchant; populated for customer-owned accounts |
| `account_holder_name` | string | no | yes | Name on the bank account |
| `account_type` | enum | no | yes | `checking` or `savings` |
| `bank_name` | string | yes | server-managed | Resolved from routing number when available |
| `routing_number_last4` | string | no | server-managed | Last 4 digits of routing number |
| `account_number_last4` | string | no | server-managed | Last 4 digits of account number |
| `is_default_for_merchant_payout` | boolean | no | yes | Whether this is the merchant's primary payout destination |
| `created_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/bank-tokens` | List bank tokens for the authenticated merchant |
| GET | `/v1/bank-tokens/:id` | Retrieve a bank token |
| POST | `/v1/bank-tokens` | Vault a bank account (accepts routing_number + account_number + account_holder_name + account_type; returns token with last4 values only) |
| DELETE | `/v1/bank-tokens/:id` | Delete a bank token (removes from Payroc vault) |
| POST | `/v1/bank-tokens/:id/detokenize` | Detokenize — admin-scope only, returns the full routing + account numbers. Audit-logged. For legitimate operational use only (compliance, legal, audit). |

### Webhook events

- `bank_token.created` — Data: full bank token object (last4 values only, never raw numbers).
- `bank_token.deleted` — Data: full bank token object (snapshot at deletion).

### Special considerations

- **Detokenization rate limit:** POST /v1/bank-tokens/:id/detokenize is limited to 10 requests/minute regardless of overall tier. Every detokenization request is audit-logged with the requesting API key, timestamp, and IP address.
- **Raw data never stored:** The engine passes routing_number and account_number to Payroc's vault API on create, receives an opaque token, stores only the token + last4 values. The raw numbers never touch the engine's database.
- **Kasse Phase 0.6-c dependency:** This is the endpoint Kasse's onboarding flow calls (via the feature-flag pattern documented in KASSE_ENGINE_BOUNDARY.md) to vault merchant bank accounts.

---

## RESOURCE: CHARGES

### Identity

- Resource name: Charge
- Identifier prefix: `ch_*`
- Plural endpoint: `/v1/charges`

### Description

A charge is a payment processed through Reyna Pay. This is the core payment-processing resource — the highest-volume, most latency-sensitive endpoint in the engine.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `ch_<base62>` |
| `merchant_id` | string | no | server-assigned | |
| `customer_id` | string | yes | yes | If charging a saved customer |
| `amount` | integer | no | yes | The total amount charged to the cardholder's payment method, in integer cents. This is the gross amount Payroc receives. If `tip_amount` is provided, it is ALREADY INCLUDED in `amount` — `amount` is the post-tip total, not the base service fee. Consumer responsibility: compute `amount = base_service_amount + tip_amount + tax_amount` on the consumer side before submitting the charge. The engine does not derive `amount` from other fields. |
| `currency` | string | no | yes | ISO 4217 lowercase (default: merchant's default currency) |
| `status` | enum | no | server-managed | `pending`, `succeeded`, `failed`, `refunded`, `partially_refunded`, `disputed` |
| `payment_method` | enum | no | yes | `card`, `ach`, `cash` |
| `card_id` | string | yes | yes | If paid via saved card |
| `card_brand` | string | yes | server-managed | Populated from card or Hosted Fields result |
| `card_last4` | string | yes | server-managed | |
| `description` | string | yes | yes | Internal description |
| `statement_descriptor` | string | yes | yes | What appears on cardholder's statement (max 22 chars) |
| `application_fee` | integer | yes | yes | Engine-charged fee in cents (for platform tokens taking a cut) |
| `tip_amount` | integer | yes | yes | The tip portion already included in `amount`, in integer cents. Documentary only — used for reporting and commission calculations (e.g., stylists earn commission on services but not tips). The engine does NOT add this to `amount` at processing time; it is already part of `amount`. If `tip_amount` is null or absent, the engine assumes the charge has no tip component. |
| `receipt_email` | string | yes | yes | Email to send receipt to |
| `receipt_phone` | string | yes | yes | Phone to send receipt SMS to |
| `capture` | boolean | no | yes | Default `true`. Set `false` for authorize-only. |
| `captured_at` | timestamp | yes | server-managed | When the charge was captured (null for auth-only until captured) |
| `failure_code` | string | yes | server-managed | Payroc decline code when status=failed |
| `failure_message` | string | yes | server-managed | Human-readable failure description |
| `risk_score` | integer | yes | server-managed | 0-100, engine-computed fraud risk estimate |
| `refunded_amount` | integer | no | server-managed | Running total of refunds in cents |
| `metadata` | object | yes | yes | Free-form key/value |
| `created_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/charges` | List charges |
| GET | `/v1/charges/:id` | Retrieve a charge |
| POST | `/v1/charges` | Create a charge (process a payment) |
| POST | `/v1/charges/:id/capture` | Capture an authorized charge (when original was created with capture=false) |
| POST | `/v1/charges/:id/void` | Void a same-day charge before settlement. See RESOURCE: VOIDS for the full Void resource spec. This endpoint and the Voids resource's POST endpoint are the same implementation — referenced in two places for discoverability. |
| POST | `/v1/charges/:id/refunds` | Create a refund against this charge (convenience alias for POST /v1/refunds) |

### Filtering and sorting

- `status` — single or comma-separated
- `customer_id` — exact match
- `card_id` — exact match
- `payment_method` — exact match
- `amount_gte`, `amount_lte` — amount range
- `created_after`, `created_before` — date range
- `sort` — `created.desc` (default), `created.asc`, `amount.desc`, `amount.asc`

### Expansion

- `customer` — inline the customer object
- `refunds` — inline the list of refunds against this charge

### HATEOAS _links

Status `succeeded`: `self`, `refund` (POST /v1/charges/:id/refunds), `void` (POST — only if same-day, before settlement), `customer` (GET — if customer_id present), `receipt` (GET /v1/charges/:id/receipt)

Status `pending` (auth-only): `self`, `capture` (POST /v1/charges/:id/capture), `void` (POST)

Status `failed`: `self`, `customer` (GET — if present)

Status `refunded`: `self`, `customer`, `refunds` (GET)

### Webhook events

- `charge.created` — fired immediately on POST. Data: full charge object with status=pending.
- `charge.completed` — fired when status transitions to succeeded. Data: full charge object.
- `charge.failed` — fired when status transitions to failed. Data: full charge object with failure_code and failure_message populated.
- `charge.authorization_expired` — fired when an auth-only charge (created with `capture: false`) reaches its expiration without being captured. Data: the full charge object with `status=failed` and `failure_code=AUTHORIZATION_EXPIRED`. This event is critical for consumers running auth-and-capture flows (e.g., salon pre-auth holds for chemical services) where forgetting to capture before expiration would result in silent loss of the hold. Consumers SHOULD subscribe to this event and trigger a notification or recapture flow when it fires.

### Special considerations

- **Amount and tip semantics:** The `amount` field is the gross total charged to the cardholder. The `tip_amount` field is the tip portion ALREADY INCLUDED in `amount`. Consumers are responsible for computing the total before submitting — the engine does NOT compute `amount = base + tip + tax` from constituent fields. This convention matches Stripe and Square: `amount` is what the cardholder is charged, `tip_amount` is metadata identifying which portion of that total was a tip. If `tip_amount` exceeds `amount` (i.e., the tip is larger than the total), the engine returns `400 Bad Request` with error code `INVALID_FIELD_VALUE` and `param: "tip_amount"`.
- **Throughput:** Charges are the highest-volume resource. The idempotency store, rate limiter, and webhook delivery infrastructure must handle this resource's throughput.
- **Authorization hold window:** The authorization hold window is issuer-set, not engine-set: typically 7 days for card-present transactions, up to 30 days for card-not-present, varying by card brand (Visa, Mastercard, Amex, Discover) and issuing bank policy. The engine cannot extend the hold beyond what the issuer permits. Per-merchant configuration of the hold window is NOT guaranteed by Payroc's underlying API — consumers should treat 7 days as the safe upper bound for planning purposes and capture authorizations as quickly as practical. The engine fires `charge.authorization_expired` when an uncaptured authorization reaches its actual expiration, regardless of the nominal window. Consumers running auth-and-capture flows (e.g., salon pre-auth holds for chemical services) SHOULD subscribe to this event and implement a capture-deadline reminder in their consumer-side scheduling system rather than relying solely on the webhook.
- **Auto void vs refund:** The engine SHOULD detect when a refund is requested against an unsettled charge and execute as void instead (faster, lower fee). From the consumer's perspective, they always POST to /refunds — the engine decides the optimal mechanism.
- **Consumer-layer metadata convention (informational):** The engine's `metadata` field is a free-form key/value object. Consumers MAY use it to tag charges with consumer-domain context that the engine does not understand or enforce. Kasse, as the salon-vertical consumer, MUST include the following keys in `metadata` on every charge it creates:
    - `kasse.booking_id` — the Kasse Appointment ID this charge corresponds to (or null for walk-in / non-appointment charges)
    - `kasse.location_id` — the Kasse Location ID where the charge originated
    - `kasse.stylist_id` — the Kasse Staff ID who performed the service (for commission attribution)
  
  Other consumers (SalonBacked, RunMySalon, white-label brands, future RestaurantTransact, future GymTransact) MAY define their own metadata key namespaces. The engine treats all metadata as opaque — it stores it, returns it, and includes it in webhook payloads but does not parse or enforce structure. Reviewer guidance: any Kasse PR that creates a Reyna Pay charge MUST include all three keys above in the metadata. PRs missing these keys should be flagged.

---

## RESOURCE: REFUNDS

### Identity

- Resource name: Refund
- Identifier prefix: `re_*`
- Plural endpoint: `/v1/refunds`

### Description

A refund returns funds from a previously completed charge back to the customer. Refunds can be full or partial. Multiple partial refunds can be issued against a single charge until the total refunded equals the original charge amount.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `re_<base62>` |
| `charge_id` | string | no | yes | The charge being refunded |
| `merchant_id` | string | no | server-assigned | |
| `amount` | integer | no | yes | Refund amount in cents (must be ≤ charge.amount - charge.refunded_amount) |
| `currency` | string | no | server-assigned | Matches the charge's currency |
| `status` | enum | no | server-managed | `pending`, `succeeded`, `failed` |
| `reason` | enum | yes | yes | `duplicate`, `fraudulent`, `requested_by_customer`, `other` |
| `failure_code` | string | yes | server-managed | |
| `failure_message` | string | yes | server-managed | |
| `void_id` | string | yes | server-managed | When this refund was executed as a void (auto-void path for unsettled charges), this references the resulting Void resource. Null for refunds against settled charges. |
| `metadata` | object | yes | yes | |
| `created_at` | timestamp | no | server-managed | |
| `updated_at` | timestamp | no | server-managed | When any field on this refund last changed (status transitions, failure reasons populated, metadata updates) |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/refunds` | List refunds |
| GET | `/v1/refunds/:id` | Retrieve a refund |
| POST | `/v1/refunds` | Create a refund (requires charge_id in body) |
| POST | `/v1/charges/:id/refunds` | Create a refund (convenience — charge_id from URL) |

### Filtering and sorting

- `charge_id` — exact match
- `status` — single or comma-separated
- `created_after`, `created_before` — date range
- `sort` — `created.desc` (default)

### Expansion

- `charge` — inline the original charge object

### HATEOAS _links

Standard: `self`, `charge` (GET the original charge)

### Webhook events

- `refund.created` — Data: full refund object with status=pending.
- `refund.completed` — Data: full refund object with status=succeeded.
- `refund.failed` — Data: full refund object with failure_code populated.

### Special considerations

- **Partial refunds:** Multiple partial refunds are supported. The engine tracks `charge.refunded_amount` as a running total. When `charge.refunded_amount == charge.amount`, the charge status transitions to `refunded`.
- **Concurrent partial refund atomicity:** Two distinct partial refund requests with distinct idempotency keys against the same charge can race. The engine MUST acquire a row-level write lock (or use optimistic concurrency control via a version column) on the Charge record when processing each refund, to prevent the sum of refund amounts from exceeding the original charge amount. Implementation pattern: SELECT FOR UPDATE on the charge row at the start of refund processing, validate `charge.amount - charge.refunded_amount >= refund.amount`, increment `charge.refunded_amount`, commit. Without this, two parallel partial refunds for amounts that individually fit but jointly exceed `charge.amount - charge.refunded_amount` will both succeed and result in over-refunding. The engine MUST return `422 Unprocessable Entity` with error code `REFUND_AMOUNT_EXCEEDS_CHARGE` if the second of two racing refunds would exceed the remaining refundable balance.
- **Auto-void on unsettled charges:** Refunds against settled charges go through ACH return rails. Refunds against unsettled (same-day) charges are voids at the underlying Payroc level — the engine SHOULD auto-detect this and execute as a void rather than a refund (faster, lower fee). Consumers always POST /refunds; the engine decides void vs refund internally. When the auto-void path is taken, the engine creates BOTH a Refund resource AND a Void resource with cross-reference linkage: the Refund has `void_id` populated, the Void has `refund_id` populated. This preserves the consumer's expectation (they requested a refund, they get a Refund object back) while accurately reflecting the underlying Payroc semantics (a Void was the actual operation).

---

## RESOURCE: VOIDS

### Identity

- Resource name: Void
- Identifier prefix: `vd_*`
- Endpoint: `/v1/charges/:charge_id/void`

### Description

A void cancels an authorization before settlement. Voids are only possible before the charge's settlement window closes (typically end-of-day in the merchant's timezone, depending on Payroc batch close time).

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `vd_<base62>` |
| `charge_id` | string | no | server-assigned | |
| `merchant_id` | string | no | server-assigned | |
| `status` | enum | no | server-managed | `succeeded`, `failed` |
| `failure_code` | string | yes | server-managed | |
| `failure_message` | string | yes | server-managed | |
| `refund_id` | string | yes | server-managed | When this void was created as the implementation of a Refund (auto-void path), this references the originating Refund resource. Null for direct voids initiated via POST /v1/charges/:id/void. |
| `metadata` | object | yes | yes | |
| `created_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/charges/:charge_id/void` | Retrieve the void for a charge, if one exists. Returns 404 if the charge has not been voided. |
| POST | `/v1/charges/:charge_id/void` | Create a void. The endpoint defined here is the same endpoint listed under RESOURCE: CHARGES → Operations. There is one implementation; two spec references for discoverability (consumers may approach this via "I want to void a charge" or via "I want to create a Void resource" — both arrive at the same endpoint). |

### Webhook events

- `void.completed` — Data: full void object with status=succeeded.
- `void.failed` — Data: full void object with failure_code populated.

### Special considerations

- **Settlement window:** After settlement, voids are impossible. The engine returns `422 Unprocessable Entity` with error code `CHARGE_ALREADY_SETTLED`. Consumer should use refund instead.
- **Relationship to refunds:** When a consumer POSTs to /refunds for an unsettled charge, the engine MAY auto-execute as a void. The void object is created and linked to the charge. The refund object is also created and points to the void.

---

## RESOURCE: PAYOUTS

### Identity

- Resource name: Payout
- Identifier prefix: `po_*`
- Plural endpoint: `/v1/payouts`

### Description

A payout moves settled funds from Reyna Pay's reserve to the merchant's bank account via ACH push. Payouts can be automatic (engine-initiated per the merchant's schedule) or manual (ad-hoc disbursements triggered by a platform or admin).

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `po_<base62>` |
| `merchant_id` | string | no | server-assigned | |
| `bank_token_id` | string | no | yes | The destination bank account (`bt_*`) |
| `amount` | integer | no | yes | Payout amount in cents |
| `currency` | string | no | server-assigned | |
| `status` | enum | no | server-managed | One of: `pending`, `in_transit`, `paid`, `failed`, `canceled`. The `canceled` status is the terminal state after a successful POST /v1/payouts/:id/cancel call (cancel is only possible while status is `pending`; once `in_transit`, cancel returns 422). |
| `arrival_date` | string | yes | server-managed | Estimated ACH arrival date (ISO 8601 date) |
| `failure_code` | string | yes | server-managed | |
| `failure_message` | string | yes | server-managed | |
| `automatic` | boolean | no | server-managed | true if engine-initiated per schedule, false if manual |
| `metadata` | object | yes | yes | |
| `created_at` | timestamp | no | server-managed | |
| `paid_at` | timestamp | yes | server-managed | When funds arrived at merchant's bank |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/payouts` | List payouts |
| GET | `/v1/payouts/:id` | Retrieve a payout |
| POST | `/v1/payouts` | Create a manual payout (admin or platform scope) |
| POST | `/v1/payouts/:id/cancel` | Cancel a pending payout (before in_transit) |

### Filtering and sorting

- `status` — single or comma-separated
- `automatic` — boolean
- `created_after`, `created_before` — date range
- `sort` — `created.desc` (default)

### Expansion

- `bank_token` — inline the destination bank token

### HATEOAS _links

Status `pending`: `self`, `cancel` (POST)
Status `in_transit`: `self`
Status `paid`: `self`, `bank_token` (GET)

### Webhook events

- `payout.created` — Data: full payout object with status=pending.
- `payout.completed` — Data: full payout object with status=paid and paid_at populated.
- `payout.failed` — Data: full payout object with failure_code populated.

---

## RESOURCE: DISPUTES

### Identity

- Resource name: Dispute
- Identifier prefix: `dp_*`
- Plural endpoint: `/v1/disputes`

### Description

A dispute (chargeback) is initiated by the cardholder against a charge. The merchant must respond with evidence within a deadline, or the dispute is auto-lost.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `dp_<base62>` |
| `charge_id` | string | no | server-assigned | The disputed charge |
| `merchant_id` | string | no | server-assigned | |
| `amount` | integer | no | server-managed | Disputed amount in cents |
| `currency` | string | no | server-managed | |
| `status` | enum | no | server-managed | One of: `warning_needs_response`, `needs_response`, `under_review`, `won`, `lost`, `refunded`. The `refunded` status means the merchant accepted the dispute (via POST /v1/disputes/:id/close) and the disputed amount was refunded to the cardholder. This is distinct from the Charges resource's `refunded` status — a Dispute is `refunded` when the merchant gave up, a Charge is `refunded` when any refund was issued (with or without a dispute). |
| `reason` | enum | no | server-managed | `fraudulent`, `duplicate`, `credit_not_processed`, `general`, `other` |
| `evidence_due_by` | timestamp | no | server-managed | Hard deadline for evidence submission |
| `evidence` | object | yes | yes | See evidence fields below |
| `metadata` | object | yes | yes | |
| `created_at` | timestamp | no | server-managed | |
| `resolved_at` | timestamp | yes | server-managed | When dispute reached terminal status |

Evidence object fields: `customer_email_address`, `customer_purchase_ip`, `customer_signature` (URL), `receipt` (URL), `service_documentation` (URL), `shipping_documentation` (URL), `refund_policy` (URL), `customer_communication` (URL), `uncategorized_text` (free text), `uncategorized_file` (URL).

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/disputes` | List disputes |
| GET | `/v1/disputes/:id` | Retrieve a dispute |
| PATCH | `/v1/disputes/:id` | Update evidence |
| POST | `/v1/disputes/:id/close` | Accept the dispute (merchant concedes, customer refunded) |

### Webhook events

- `dispute.created` — Data: full dispute object.
- `dispute.updated` — Data: full dispute object. Also fired 72 hours before evidence_due_by as a reminder.
- `dispute.closed` — Data: full dispute object with resolved_at and terminal status.

### Special considerations

- **Evidence deadline:** Once `evidence_due_by` passes, the dispute is auto-lost. The engine fires `dispute.updated` 72 hours before the deadline as a reminder.
- **Evidence file size:** Each evidence file must be ≤ 50MB. Error code `DISPUTE_EVIDENCE_TOO_LARGE` if exceeded.

---

## RESOURCE: CHECKOUT SESSIONS

### Identity

- Resource name: Checkout Session
- Identifier prefix: `cs_*`
- Plural endpoint: `/v1/checkout-sessions`

### Description

A checkout session is a temporary token issued to the consumer's frontend for initiating a Payroc Hosted Fields iframe. The session binds an expected charge amount to a tokenization flow.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `cs_<base62>` |
| `merchant_id` | string | no | server-assigned | |
| `amount` | integer | no | yes | Expected charge amount in cents |
| `currency` | string | no | yes | |
| `customer_id` | string | yes | yes | If charging a saved customer |
| `customer_email` | string | yes | yes | For receipt |
| `customer_phone` | string | yes | yes | For receipt SMS |
| `return_url` | string | no | yes | Where to redirect after completion. MUST be HTTPS. MUST match the merchant's registered redirect_domains allowlist (see Merchants resource). |
| `cancel_url` | string | yes | yes | Where to redirect on cancel. MUST be HTTPS. MUST match the merchant's registered redirect_domains allowlist. |
| `status` | enum | no | server-managed | `open`, `completed`, `expired` |
| `session_token` | string | no | server-managed | Opaque token to pass to Hosted Fields — single-use |
| `expires_at` | timestamp | no | server-managed | 30 minutes after creation by default |
| `completed_at` | timestamp | yes | server-managed | |
| `charge_id` | string | yes | server-managed | Populated when session completes successfully |
| `created_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/checkout-sessions` | List sessions |
| GET | `/v1/checkout-sessions/:id` | Retrieve a session |
| POST | `/v1/checkout-sessions` | Create a session |
| POST | `/v1/checkout-sessions/:id/expire` | Manually expire a session (idempotent) |

### Webhook events

- `checkout_session.created` — Data: full session object with status=open.
- `checkout_session.completed` — Data: full session object with status=completed and charge_id populated.
- `checkout_session.expired` — Data: full session object with status=expired.

### Special considerations

- **Redirect URL allowlisting (security):** The `return_url` and `cancel_url` fields MUST be validated against the merchant's registered `redirect_domains` allowlist (a field on the Merchant resource — see Merchants schema). The engine MUST reject any URL whose scheme is not `https` or whose host component does not exactly match one of the entries in the allowlist. Without this validation, the Checkout Session redirect mechanism becomes an open-redirect vector that attackers can exploit for phishing — particularly dangerous because the redirect follows a payment flow, placing the victim in a maximum-trust context immediately after legitimate authentication. Error codes: `CHECKOUT_SESSION_REDIRECT_URL_NOT_ALLOWED` (scheme not https or host not in allowlist), `CHECKOUT_SESSION_REDIRECT_URL_MALFORMED` (URL cannot be parsed). The merchant configures their allowlist via the Merchants resource's `redirect_domains` field (a string array, max 10 entries, each a fully-qualified domain name like `app.kasseapp.com`). Wildcards are NOT supported — exact host match only. Subdomains MUST be explicitly listed.
- **Pre-creation prerequisite — merchant redirect_domains MUST be populated:** Before any Checkout Session can be created for a merchant, that merchant's `redirect_domains` field MUST contain at least one entry. Attempting POST /v1/checkout-sessions for a merchant with empty or null `redirect_domains` returns `400 Bad Request` with error code `CHECKOUT_SESSION_NO_REDIRECT_DOMAINS_CONFIGURED`. Consumer integration guidance: configure redirect_domains during merchant onboarding (Phase 0.9 in Kasse, the merchant boarding flow). Do not defer this configuration until first checkout attempt — that creates a confusing error during the first user-facing payment flow.
- **Session expiry:** Sessions expire 30 minutes after creation. The `session_token` is single-use — once Hosted Fields tokenizes a card with it, the token is invalidated.
- **Error codes:** `CHECKOUT_SESSION_EXPIRED` if attempting to use an expired session. `CHECKOUT_SESSION_ALREADY_USED` if the session_token was already consumed.

---

## RESOURCE: TRANSACTIONS (read-only aggregate view)

### Identity

- Resource name: Transaction
- No dedicated identifier prefix — transactions reference the underlying resource ID (ch_*, re_*, po_*)
- Plural endpoint: `/v1/transactions`

### Description

A unified read view combining charges, refunds, and payouts for reporting and ledger purposes. This resource exists so consumers can build a transaction ledger without making three separate API calls.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | — | The underlying resource ID (ch_*, re_*, po_*) |
| `merchant_id` | string | no | — | |
| `type` | enum | no | — | `charge`, `refund`, `payout` |
| `amount` | integer | no | — | Signed: positive for charges, negative for refunds and payouts |
| `currency` | string | no | — | |
| `status` | string | no | — | Status of the underlying resource |
| `customer_id` | string | yes | — | If applicable |
| `description` | string | yes | — | From the underlying resource |
| `created_at` | timestamp | no | — | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/transactions` | List transactions (the only operation) |
| GET | `/v1/transactions/:id` | Retrieve — returns the underlying resource in its native shape |

### Filtering and sorting

- `type` — `charge`, `refund`, `payout` (single or comma-separated)
- `status` — single or comma-separated
- `customer_id` — exact match
- `amount_gte`, `amount_lte` — amount range (applies to absolute value)
- `created_after`, `created_before` — date range
- `sort` — `created.desc` (only supported sort order; see Special considerations for the cursor-integrity reason)

### Special considerations

- **Read-only:** No create, update, or delete operations. The underlying resources fire their own webhooks.
- **Unified cursor:** Pagination uses a single cursor across the three underlying tables, sorted by created_at descending.
- **Sort restricted to `created.desc`:** Transactions is a multi-table cursor view (joining charges + refunds + payouts). Maintaining cursor integrity across three underlying tables with potentially different sort keys is impractical at scale — the cursor would have to encode positions in all three tables and the relative offsets between them. Sort is therefore limited to `created.desc` (the natural insertion order across all three tables). Consumers needing different sorts (e.g., by amount) should query the specific resource directly (Charges/Refunds/Payouts) rather than the Transactions aggregate view.

---

## RESOURCE: REPORTS (engine-side aggregations)

### Identity

- Resource name: Report
- No identifier prefix — reports are computed views, not stored entities
- Base endpoint: `/v1/reports`

### Description

Pre-computed aggregations the engine produces for consumer convenience. Reports endpoints return structured objects with computed aggregations. They are stateless computations on every request.

### Available reports

| Endpoint | Description |
|----------|-------------|
| `GET /v1/reports/revenue` | Revenue summary by period |
| `GET /v1/reports/fees` | Engine fees collected by period |
| `GET /v1/reports/settlements` | Daily settlement summaries per merchant |
| `GET /v1/reports/disputes` | Dispute volumes and outcomes by period |
| `GET /v1/reports/payouts` | Payout summaries by period |

### Common query parameters

- `period` — `daily`, `weekly`, `monthly`, `yearly`
- `date_after`, `date_before` — date range

### Special considerations

- **Rate limit:** Reports endpoints are limited to 10 requests/minute per merchant, regardless of overall tier. The engine MAY cache report results for up to 60 seconds — consumers SHOULD treat responses as eventually-consistent.
- **No webhooks:** Reports are stateless computations. No webhook events.

---

## RESOURCE: API KEYS

### Identity

- Resource name: API Key
- Identifier prefix: `ak_*`
- Plural endpoint: `/v1/api-keys`

### Description

Management of the API keys consumers use to authenticate. API keys are either merchant-scoped (regular tokens, prefix `rpsk_*`) or platform-scoped (platform tokens, prefix `rpsp_*`).

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `ak_<base62>` |
| `merchant_id` | string | yes | server-assigned | Null for platform tokens |
| `platform_id` | string | yes | server-assigned | Null for regular tokens |
| `prefix` | string | no | server-managed | `rpsk_live`, `rpsk_test`, `rpsp_live`, `rpsp_test` |
| `scope` | array | no | yes | Array of: `read`, `write`, `admin`, `webhooks`, `reports` |
| `description` | string | yes | yes | Human-readable description |
| `last_used_at` | timestamp | yes | server-managed | |
| `last_used_ip` | string | yes | server-managed | |
| `revoked_at` | timestamp | yes | server-managed | Set on DELETE |
| `created_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/api-keys` | List API keys (metadata only — never returns the token value) |
| GET | `/v1/api-keys/:id` | Retrieve an API key's metadata |
| POST | `/v1/api-keys` | Create an API key — returns the plaintext token ONCE, never again |
| DELETE | `/v1/api-keys/:id` | Revoke an API key (sets revoked_at; the key immediately stops working) |

### Special considerations

- **Plaintext shown once:** The plaintext token is returned ONLY on creation in the response body's `token` field. After that, only the metadata is accessible. Lost tokens cannot be recovered — they must be revoked and replaced.
- **Two distinct identifier namespaces:** The API Keys resource has two prefixes that serve different purposes:
    - `ak_*` is the resource identifier — used in API responses, audit logs, and the URL path (e.g., `GET /v1/api-keys/ak_abc123`). This is the metadata-object ID, NOT the secret token.
    - `rpsk_live_*`, `rpsk_test_*`, `rpsp_live_*`, `rpsp_test_*` are the plaintext token values — the secret credential the consumer sends in the `Authorization: Bearer` header.
    
    These are not interchangeable. The `ak_*` identifier is safe to log, store in plaintext, and pass between systems. The `rpsk_*` / `rpsp_*` token values are credentials and MUST be treated as secrets — never logged in plaintext, never stored unhashed in databases, never passed in URLs.
- **No webhooks:** API key management is a meta-resource; no consumer webhook subscription needed.

---

## RESOURCE: WEBHOOKS

### Identity

- Resource name: Webhook
- Identifier prefix: `wh_*`
- Plural endpoint: `/v1/webhooks`

### Description

Consumer-managed webhook endpoint subscriptions. Consumers register HTTPS endpoints to receive event notifications from the engine.

### Schema

| Field | Type | Nullable | Writable | Notes |
|-------|------|----------|----------|-------|
| `id` | string | no | server-assigned | Format `wh_<base62>` |
| `merchant_id` | string | yes | server-assigned | Null for platform-scoped subscriptions |
| `platform_id` | string | yes | server-assigned | Null for merchant-scoped subscriptions |
| `url` | string | no | yes (create-only) | HTTPS URL — HTTP rejected with `WEBHOOK_URL_INSECURE` |
| `event_types` | array | no | yes | Array of event type strings, or `["*"]` for all events |
| `active` | boolean | no | yes | Can be toggled without deletion |
| `description` | string | yes | yes | |
| `signing_secret_last4` | string | no | server-managed | Last 4 chars of signing secret (full secret shown once at creation) |
| `last_delivery_at` | timestamp | yes | server-managed | |
| `last_delivery_status` | string | yes | server-managed | HTTP status code of last delivery attempt |
| `created_at` | timestamp | no | server-managed | |

### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/webhooks` | List webhook subscriptions |
| GET | `/v1/webhooks/:id` | Retrieve a subscription |
| POST | `/v1/webhooks` | Create a subscription (returns signing_secret once) |
| PATCH | `/v1/webhooks/:id` | Update (toggle active, change event_types — URL cannot be changed; create a new subscription) |
| DELETE | `/v1/webhooks/:id` | Delete a subscription |
| GET | `/v1/webhooks/:id/deliveries` | Delivery history (last 30 days) |
| POST | `/v1/webhooks/:id/deliveries/:delivery_id/replay` | Manual replay of a past delivery |

### Special considerations

- **URL immutability:** The `url` field cannot be PATCHed after creation. To change the URL, create a new subscription and delete the old one. This prevents accidental routing changes on active webhook pipelines.
- **Signing secret:** Shown once at creation. Last 4 chars available in `signing_secret_last4` for identification. Rotatable via the dual-secret grace period pattern below.
- **No meta-webhooks:** Webhook management does not itself fire webhooks (except the system events `webhook.delivery_succeeded`, `webhook.delivery_failed_persistent`, and `webhook.secret_rotated` defined in Tier 1).

### Signing secret rotation

Signing secrets can be rotated without dropping deliveries, using a dual-secret grace period pattern. This matches the operational model used by Stripe, Svix, and other production webhook infrastructure.

Rotation operation:

    POST /v1/webhooks/:id/rotate-secret

Response includes:
- `new_signing_secret` — the new secret, returned in plaintext ONCE (as with API key creation)
- `new_signing_secret_last4` — last 4 chars for identification (replaces `signing_secret_last4` on the webhook resource)
- `previous_signing_secret_expires_at` — timestamp when the previous secret stops being honored (default 24 hours after rotation)

Engine behavior during the grace period:
- All outgoing webhook deliveries are signed with BOTH secrets — the header includes two `v1=` values:
  
      Reyna-Pay-Signature: t=1714500000,v1=<new_hex>,v1=<previous_hex>

- Consumers verifying the signature SHOULD attempt verification against each `v1=` value in turn. A match against either value is a valid signature.
- After `previous_signing_secret_expires_at` passes, the engine drops the previous secret. Deliveries are then signed with the new secret only:
  
      Reyna-Pay-Signature: t=1714500000,v1=<new_hex>

Rotation timing recommendations:
- Default grace period: 24 hours. Configurable via the optional `grace_period_seconds` field in the rotation request body (min 300 seconds, max 7 days).
- Consumers SHOULD initiate rotation when their signing secret leaks or quarterly as routine hygiene.
- The consumer is responsible for deploying the new secret to all their verification code before `previous_signing_secret_expires_at`. After expiration, deliveries will fail verification against the old secret.

Rotation-related fields added to the Webhook resource schema:
- `previous_signing_secret_last4` — nullable; populated only during the grace period
- `previous_signing_secret_expires_at` — nullable timestamp; populated only during the grace period

Rotation-related error code (extending the Tier 2 catalog):
- `WEBHOOK_ROTATION_IN_PROGRESS` — attempting to call `/rotate-secret` while a previous rotation's grace period has not expired. Consumers MUST wait for the previous rotation to complete (or pass `force: true` in the request body to overwrite the in-progress rotation, dropping the previous secret immediately — only the most recent secret remains valid).

Webhook event for rotation:
- `webhook.secret_rotated` — fired on the rotating subscription itself (delivered using BOTH the new and previous secrets during the grace period). Data: the webhook resource with the rotation metadata populated. This event helps consumers detect rotation initiated through other channels (e.g., the engine dashboard) so their automation can track when a rotation is in progress.

---

---

# PART III — NON-FUNCTIONAL REQUIREMENTS

Part III of this specification (Tier 3 of the iterative-delivery sequence). Defines what the engine guarantees in production beyond the API surface itself: uptime, latency, data residency, compliance posture, sandbox/test environment, deprecation policy, monitoring, and SDKs.

---

## SLA AND UPTIME COMMITMENTS

### Target SLA by environment

- **Production (live)**: 99.95% monthly uptime SLA after GA. Excludes scheduled maintenance windows announced ≥7 days in advance.
- **UAT/sandbox**: 99.5% monthly uptime, no SLA credits, best-effort restoration.

### Maintenance windows

Scheduled maintenance occurs in a fixed weekly window: Sundays 02:00–04:00 ET. Most maintenance is rolling/zero-downtime (deploy with health checks, drain connections, deploy new version). Disruptive maintenance (database migrations requiring downtime, major version cuts) is rare and is announced ≥7 days in advance via status.reynapay.com and email to all merchant primary contacts.

### SLA credits

If monthly uptime falls below 99.95%, merchants receive a service credit on the next invoice. Credit schedule:

| Monthly uptime | Service credit |
|----------------|----------------|
| ≥99.95% | 0% (SLA met) |
| ≥99.0% and <99.95% | 10% of monthly subscription |
| ≥95.0% and <99.0% | 25% of monthly subscription |
| Below 95.0% | 100% of monthly subscription |

Credits apply only to the engine subscription fee, not to transaction processing fees (those follow Payroc's underlying SLA). Credits are not cash refundable — they roll forward against future invoices.

### Status page

Live engine status at status.reynapay.com. Includes:
- Uptime metrics for the last 90 days
- Active incidents with timestamps and remediation status
- Scheduled maintenance announcements
- Historical postmortems for incidents lasting >15 minutes
- RSS feed and email subscription for status changes

---

## LATENCY BUDGETS

### Per-endpoint-class latency targets (p95, measured from engine ingress to response complete)

| Endpoint class | p95 target | p99 target | Notes |
|----------------|-----------|-----------|-------|
| Authentication validation | 10ms | 25ms | Token lookup + scope check |
| Read endpoints (GET resource by id) | 100ms | 250ms | Single-record fetches |
| List endpoints (paginated GET) | 200ms | 500ms | Cursor-based queries |
| Charge creation (`POST /v1/charges`) | 800ms | 2000ms | Includes Payroc round-trip |
| Refund creation (`POST /v1/refunds`) | 1000ms | 2500ms | Includes Payroc round-trip |
| Bank token vault (`POST /v1/bank-tokens`) | 1500ms | 3000ms | Includes Payroc vault round-trip |
| Merchant boarding (`POST /v1/merchants`) | 5000ms | 15000ms | Async — completion via webhook |
| Reports (`GET /v1/reports/*`) | 2000ms | 5000ms | Aggregations, may be cached |
| OpenAPI spec fetch (`GET /v1/openapi.json`) | 50ms | 100ms | Static asset |

### Why these numbers

Charge creation latency is dominated by the Payroc round-trip. The engine adds approximately 100–200ms of overhead (auth, idempotency check, database write, webhook fan-out scheduling). Payroc's own p95 for authorization is approximately 500–700ms. Total p95 of 800ms reflects this.

Report endpoints are slower because they run aggregations across charges/refunds/payouts tables. The engine caches report results for 60 seconds (Tier 2) to keep p95 under 2 seconds. Consumers requesting a freshly-computed report each time will see p95 closer to 5 seconds for large date ranges.

### Latency monitoring

The engine exports p50/p95/p99 latency metrics per endpoint to the status page. If p95 latency for any endpoint class exceeds the target for more than 10 minutes, an incident is auto-opened and merchants subscribed to status updates are notified.

### Timeout recommendations for consumers

Consumers SHOULD set HTTP request timeouts to 2x the published p99 budget for the endpoint they're calling. Example timeouts:
- Charge creation: 4–5 seconds
- Refund creation: 5–6 seconds
- Bank token vault: 6 seconds
- Merchant boarding: 30 seconds (then poll status or wait for webhook)

---

## DATA RESIDENCY

### Geographic location

All Reyna Pay engine data is stored in AWS us-east-2 (Ohio). This matches the Kasse database location to minimize cross-region latency and avoid cross-region data transfer costs.

### Backup and disaster recovery

- **Daily automated backups** retained for 35 days
- **Cross-region replication** to AWS us-west-2 (Oregon) for disaster recovery
- **Recovery time objective (RTO)**: 4 hours for complete region failure
- **Recovery point objective (RPO)**: 15 minutes (worst-case data loss window)

### Cross-border data transfer

Tier 3 of this spec covers US-only operations. International expansion (Canada, EU, UK) would require additional residency commitments (Canada: residency in Canadian regions; EU/UK: GDPR + local residency). When the engine adds international support, this section will be amended via a versioned addendum.

---

## COMPLIANCE POSTURE

### PCI DSS

Reyna Pay inherits PCI Level 1 certification from Payroc, which holds Level 1 directly. Reyna Pay's role is limited to:

- Vaulting cards via Payroc Hosted Fields (PAN never touches the engine)
- Vaulting bank accounts via Payroc's tokenization endpoint (account numbers stored only as tokens)
- Processing charges, refunds, voids, payouts through Payroc's processing infrastructure
- Storing transaction metadata (no cardholder data)

Reyna Pay's PCI scope is therefore SAQ A-EP (e-commerce, payment data handled exclusively by PCI-validated third party). Annual SAQ A-EP submission to acquiring bank (Payroc).

### SOC 2 Type II — Roadmap

Target: SOC 2 Type II audit complete within 18 months of GA. Audit covers:
- Security (access controls, encryption, vulnerability management)
- Availability (uptime, backup, disaster recovery)
- Confidentiality (data segregation, retention, deletion)
- Processing integrity (idempotency, audit logging, error handling)

Pre-audit period (months 1–12 post-GA): SOC 2 Type I (point-in-time assessment) to validate controls are designed correctly. Post-Type-I and through month 18: continuous monitoring and Type II audit period.

Until SOC 2 Type II is achieved, enterprise consumers requiring SOC 2 evidence receive a security questionnaire response packet covering equivalent controls.

### Audit logging

Every authenticated request to the engine produces an audit log entry. Each entry includes:
- `request_id` (Tier 1)
- Authenticated API key ID (`ak_*`)
- Merchant ID and (if applicable) platform ID
- Endpoint called, HTTP method, query parameters
- Response status code
- Latency (engine-side processing time)
- IP address of caller
- User agent
- Timestamp (UTC, microsecond precision)

Audit logs are retained for 7 years (matches typical financial recordkeeping requirements). Cross-tenant access is impossible — merchants see only their own audit log.

### Data deletion and right-to-be-forgotten

Merchants can request full data deletion via support (admin-scope process). Deletion process:
1. Merchant is suspended immediately (no new charges)
2. 30-day grace period (allows merchant to download data, contest deletion)
3. After grace period, all merchant data is purged from primary database
4. Backups are purged on their normal rotation (35 days)
5. Transaction records required for regulatory recordkeeping (7 years) are retained in a sealed audit archive with no merchant-portal access — only accessible via court order or regulatory request

Note: deletion is irreversible. There is no undo.

### Encryption at rest

All sensitive data encrypted at rest:
- **Identity fields** (EIN, owner SSN last-4, owner DOB): AES-256 via AWS KMS envelope encryption
- **Bank account tokens**: stored as opaque tokens (the underlying account number is in Payroc's vault, not the engine)
- **Card tokens**: stored as opaque tokens (PAN is in Payroc's vault)
- **Webhook signing secrets**: AES-256 via AWS KMS envelope encryption
- **API key hashes**: bcrypt hashed (the plaintext token is never stored)
- **Audit logs**: encrypted at the storage layer

### Encryption in transit

All API traffic requires TLS 1.2 or higher. TLS 1.1 and lower are rejected at the load balancer. HSTS is enforced with `max-age=63072000; includeSubDomains; preload`.

---

## SANDBOX AND TEST MODE

### Environment separation

- **Production**: `https://api.reynapay.com/v1` (or `https://app.salontransact.com/api/v1` during migration). Real money, real card networks, real settlement.
- **Sandbox**: `https://api-sandbox.reynapay.com/v1`. No real money, no card networks, simulated responses.

Production and sandbox are separate environments with separate databases. Test mode data does NOT exist in production and vice versa.

### Sandbox credentials

Sandbox uses test-prefixed tokens: `rpsk_test_*` and `rpsp_test_*`. These tokens are issued separately from production tokens. Merchants get one set of sandbox credentials at account creation, regardless of production boarding status.

### Test card numbers

The engine recognizes specific card numbers in sandbox to simulate outcomes:

| Card number | Brand | Behavior |
|-------------|-------|----------|
| 4242424242424242 | Visa | Always succeeds |
| 4000000000000002 | Visa | Always declined (`CARD_DECLINED`) |
| 4000000000000119 | Visa | Always returns processing error (`PAYROC_UPSTREAM_ERROR`) |
| 4000000000000259 | Visa | Always disputed (auto-creates a dispute 5 minutes after charge) |
| 4000000000009995 | Visa | Insufficient funds (`CARD_DECLINED`) |
| 5555555555554444 | Mastercard | Always succeeds |
| 5200828282828210 | Mastercard | Always declined |
| 378282246310005 | Amex | Always succeeds |
| 6011111111111117 | Discover | Always succeeds |

All test cards accept any future expiration date, any CVV (3 digits for non-Amex, 4 for Amex), any ZIP code.

### Test bank accounts

For ACH/payout testing:

| Routing | Account | Behavior |
|---------|---------|----------|
| 110000000 | 000123456789 | Always succeeds |
| 110000000 | 000222222227 | Always returns invalid routing |
| 110000000 | 000333333333 | Returns invalid account |
| 110000000 | 000444444444 | Account closed |

### Test webhooks

Sandbox webhooks are delivered to the consumer's registered URL just like production. The `livemode` field in the event envelope is `false` for sandbox events.

### Simulated failure modes

Sandbox supports query parameter overrides to simulate edge cases:
- `?simulate=rate_limit` — returns 429 even if rate limit not exceeded
- `?simulate=timeout` — engine deliberately delays the response by 10 seconds
- `?simulate=internal_error` — returns 500 INTERNAL_ERROR
- `?simulate=payroc_outage` — returns 502 PAYROC_UPSTREAM_ERROR
- `?simulate=maintenance` — returns 503 MAINTENANCE_MODE

These overrides are sandbox-only. In production, the `simulate` query parameter is silently stripped from the request before processing — the request is then processed normally as if the parameter had never been sent. The charge (or other operation) executes against real card networks and real money. This means a developer who accidentally hits production with a `?simulate=internal_error` query parameter still processes a real charge. There is no warning, no rejection, and no logging of the stripped parameter. Developers SHOULD distinguish production and sandbox by base URL (`api.reynapay.com` vs `api-sandbox.reynapay.com`) and by token prefix (`rpsk_live_` vs `rpsk_test_`), NOT by the presence or absence of simulate parameters.

### Sandbox lifecycle

Sandbox data is retained for 90 days after last activity. Inactive sandbox accounts have data purged after 90 days. This avoids unbounded growth of sandbox database storage.

---

## DEPRECATION POLICY

### Deprecation lifecycle

Per Tier 1's VERSIONING section, each major version has four phases (Beta, GA, Deprecated, Sunset). This section operationalizes those phases.

### Deprecation notice mechanism

When a major version enters Deprecated phase, the engine returns these headers on every response from the deprecated version:

    Deprecation: true
    Sunset: <date-when-sunset-occurs>
    Link: <https://api.reynapay.com/v2>; rel="successor-version"

These headers follow RFC 8594 (Sunset HTTP Header).

### Notice period

Minimum 18 months between Deprecated and Sunset. Consumers have at least 18 months to migrate. Engineering and operational teams should plan migration projects within 12 months of Deprecated announcement to leave 6 months of buffer.

### Migration support

When v2 is announced, the engine publishes:
- A migration guide at `docs.reynapay.com/migrate/v1-to-v2`
- A compatibility shim (for breaking changes that have a mechanical translation) at `docs.reynapay.com/v2/compatibility`
- Office hours / migration support sessions during the deprecation window

### Sunset behavior

After sunset, deprecated version endpoints return:

    HTTP/1.1 410 Gone
    Content-Type: application/json

    {
      "error": {
        "code": "VERSION_SUNSET",
        "message": "The v1 API has been sunset. Please migrate to v2.",
        "type": "invalid_request_error",
        "request_id": "req_..."
      }
    }

No automatic redirect to v2 (paths and shapes may differ). Migration is the consumer's responsibility.

---

## MONITORING AND OBSERVABILITY

### Engine-side monitoring

The engine emits the following telemetry to its observability infrastructure:
- Per-endpoint latency (p50/p95/p99)
- Per-endpoint error rate
- Per-endpoint throughput
- Database connection pool utilization
- Payroc upstream latency and error rate
- Webhook delivery success rate
- Idempotency cache hit rate

### Consumer-visible metrics

Each merchant's dashboard surfaces:
- Current month's API usage (request count, by endpoint)
- Rate limit utilization
- Webhook delivery success rate
- Charge success rate
- Average processing latency

### Incident communication

Incidents are communicated via:
- status.reynapay.com (always-on status page)
- Email to affected merchants' primary contacts (for incidents impacting >5% of merchants)
- Webhook event `system.incident_started` and `system.incident_resolved` (for merchants subscribed to system events)

### Postmortems

For incidents lasting >15 minutes, a postmortem is published within 5 business days. Postmortems are public on status.reynapay.com and include:
- Timeline of the incident
- Impact (which merchants, which endpoints, what behavior)
- Root cause
- Remediation actions
- Prevention measures going forward

---

## SDKs AND CLIENT LIBRARIES

### Officially supported SDKs

Reyna Pay commits to maintaining officially supported SDKs for:
- **TypeScript / JavaScript** — `@reyna-pay/node` (also works in Deno, Bun)
- **Python** — `reyna-pay` (PyPI)
- **Ruby** — `reyna_pay` (RubyGems)
- **Go** — `github.com/reyna-pay/reyna-pay-go`

### Generation source

All SDKs are auto-generated from the OpenAPI 3.1 spec. Manual changes to generated code are forbidden — the SDK is regenerated on every spec change.

Generation tooling: OpenAPI Generator (`openapi-generator-cli`) with custom templates for idempotency-key handling, retry logic, and HATEOAS link traversal.

### Versioning

SDK major version aligns with API major version: `@reyna-pay/node@1.x.x` targets `/v1`; `@reyna-pay/node@2.x.x` will target `/v2`. SDK minor and patch versions are independent of API minor changes — SDK 1.5.0 may support all 1.x API features.

### Update cadence

- **Patch releases**: as needed for SDK bugs, weekly cadence maximum
- **Minor releases**: when the API adds new endpoints or fields (backward-compatible per VERSIONING)
- **Major releases**: when the API major version increments

### Community SDKs

Community SDKs in other languages (PHP, Java, C#, Rust, etc.) are encouraged but not officially supported. The OpenAPI spec is the canonical source; community SDKs SHOULD be generated from it.

---

# PART IV — AGENT-NATIVE DESIGN

Part IV of this specification (Tier 4 of the iterative-delivery sequence). Reyna Pay is designed from the ground up to be consumed by AI agents (autonomous and semi-autonomous systems that take actions on behalf of users without per-action human approval). This section defines what makes the API agent-friendly beyond standard HATEOAS.

---

## MCP SERVER COMMITMENT

Reyna Pay commits to maintaining a Model Context Protocol (MCP) server at `mcp.reynapay.com` that exposes the engine's capabilities as MCP tools.

### MCP tools exposed

The MCP server exposes one tool per significant API action. Tools are named in `verb_resource` format matching the underlying API operation:

- `create_charge` (wraps POST /v1/charges)
- `refund_charge` (wraps POST /v1/refunds)
- `void_charge` (wraps POST /v1/charges/:id/void)
- `lookup_customer` (wraps GET /v1/customers/:id)
- `list_charges` (wraps GET /v1/charges)
- `get_payout` (wraps GET /v1/payouts/:id)
- `respond_to_dispute` (wraps PATCH /v1/disputes/:id)
- `create_checkout_session` (wraps POST /v1/checkout-sessions)
- ...and one tool per remaining resource operation

Each MCP tool has:
- Semantic description (agent-readable purpose statement)
- Input schema (matches the API endpoint's request body, with constraints and examples)
- Output schema (matches the API endpoint's response, including HATEOAS _links)
- Error semantics (which error codes are expected, what they mean for the agent)

### MCP authentication

MCP server authenticates the agent's call via the agent's Reyna Pay API key in the MCP request metadata. The engine treats MCP-originated requests identically to direct API requests — same rate limits, same audit logging, same scope enforcement.

### MCP server lifecycle

The MCP server is auto-generated from the OpenAPI spec (the same source as the SDKs). When the spec adds a new endpoint, the MCP server gains a corresponding tool on the next deploy.

---

## AGENT AUDIT LOGGING

### Identifying agent traffic

API keys carry an optional `agent_type` tag at creation:

    POST /v1/api-keys
    {
      "scope": ["read", "write"],
      "agent_type": "anthropic_claude" | "openai_gpt" | "custom",
      "description": "Booking agent for Salon Envy"
    }

When set, every request authenticated by that key is logged with the `agent_type` field for downstream analysis.

### Agent-specific audit log

In addition to the standard audit log (Tier 3), agent-originated requests are logged to a separate agent-audit table with extended fields:
- Full request body (regular audit log stores only metadata)
- Full response body
- Agent-claimed context (when present in the request as `X-Agent-Context` header — e.g., "user requested refund for order #1234")
- Agent reasoning trace (when present as `X-Agent-Reasoning` header — short text explaining why the agent took this action)

Agent audit logs are retained for 2 years (shorter than the 7-year standard audit log because of the higher storage cost from logging full bodies).

### Why this matters

When an agent does something a human disagrees with, "the agent decided to refund this charge" is not a satisfying explanation. The agent audit log captures the context the agent had and the reasoning the agent provided, allowing post-hoc evaluation of whether the action was reasonable.

### PCI scope guardrail

The agent audit log retention of full request and response bodies creates a potential PCI scope expansion if not handled carefully. Card vaulting endpoints (`POST /v1/cards`, `POST /v1/checkout-sessions`, anything that involves Payroc Hosted Fields tokenization) and bank account vaulting (`POST /v1/bank-tokens`) MAY have request bodies that include cardholder-facing or account-holder-facing field values (billing address, name on card, account holder name).

To preserve the engine's PCI SAQ A-EP scope (Tier 3), the agent audit log for these endpoints SHALL log ONLY:

- The endpoint called and HTTP method
- The resulting token reference (e.g., `card_abc123`, `bt_xyz789`)
- The HTTP status code and response timestamps
- The agent_type and agent context headers (X-Agent-Context, X-Agent-Reasoning)

The agent audit log for these endpoints SHALL NOT log:

- The plaintext request body (any field values)
- The plaintext response body beyond the token reference (e.g., do not log billing_address even if Payroc returns it)

Non-card-vaulting endpoints (charges, refunds, voids, payouts, disputes, etc.) log full request and response bodies per the standard agent audit log pattern. The card/bank-token guardrail applies ONLY to the specific endpoints that touch cardholder or account-holder data.

Implementation requirement: the engine MUST identify card and bank-token creation endpoints by an explicit allowlist at audit-log-write time. New endpoints added to those resource categories MUST be added to the allowlist before the endpoint goes live. Reviewer guidance: any PR adding a route to `app/api/cards/*`, `app/api/checkout-sessions/*`, or `app/api/bank-tokens/*` (engine-side) MUST update the audit-log endpoint allowlist in the same PR.

---

## PER-AGENT-TYPE RATE LIMITS

Agents can run hot. A single rogue agent in a retry loop could exhaust a merchant's entire rate budget. Reyna Pay applies additional rate limits scoped to agent traffic:

### Per-API-key agent limits

When an API key has `agent_type` set (any non-null value), additional limits apply on top of the regular tier limits:
- **Maximum 30 requests/minute per individual API key**, regardless of the merchant's tier
- **Maximum 1,000 requests/day per individual API key**
- These limits stack with merchant-tier limits — the more restrictive applies

### Per-merchant agent aggregate limits

Across all agent-tagged API keys for a single merchant:
- **Maximum 50% of the merchant's tier rate limit** can be consumed by agent traffic
- Non-agent traffic is unconstrained by this rule

### Override

A merchant can request elevated agent rate limits by contacting Reyna Pay support. Approval requires evidence that the agent traffic is well-behaved (e.g., the agent uses idempotency keys correctly, handles 429s with appropriate backoff, doesn't retry on 4xx errors).

---

## SEMANTIC ENHANCEMENTS BEYOND HATEOAS

Tier 1 introduced HATEOAS `_links`. Tier 4 extends this with additional semantic affordances designed for agent consumption.

### Action descriptions in _links

Every `_links` entry that represents an action (not just a resource fetch) includes a `description` field:

    "_links": {
      "refund": {
        "href": "/v1/charges/ch_abc123/refunds",
        "method": "POST",
        "description": "Refund this charge in full or in part. Refunds against settled charges go through ACH return (3-5 business days). Refunds against same-day charges are processed as voids and complete within minutes.",
        "preconditions": ["charge.status == 'completed'", "charge.refunded_amount < charge.amount"]
      }
    }

Description fields are short prose statements that an agent's reasoning model can read to decide whether the action is appropriate. Precondition expressions are machine-readable constraints the agent can verify before attempting the action.

### Resource state predicates

In addition to `status`, agent-relevant boolean predicates are surfaced on resources:

    {
      "id": "ch_abc123",
      "status": "completed",
      "predicates": {
        "is_refundable": true,
        "is_voidable": false,
        "is_disputed": false,
        "can_be_captured": false,
        "is_settled": true,
        "is_test_mode": false
      }
    }

Agents can evaluate predicates without consulting the full state machine. The engine guarantees predicates are consistent with the resource's full state at the time of read.

### Suggested next actions

For resources in transient states, the engine includes a `suggested_next_actions` array sorted by likely usefulness:

    {
      "id": "dp_xyz789",
      "status": "needs_response",
      "evidence_due_by": "2026-06-13T00:00:00Z",
      "suggested_next_actions": [
        {
          "action": "submit_evidence",
          "href": "/v1/disputes/dp_xyz789",
          "method": "PATCH",
          "rationale": "Evidence is due in 3 days. Failure to respond results in automatic loss of the dispute."
        },
        {
          "action": "accept_dispute",
          "href": "/v1/disputes/dp_xyz789/close",
          "method": "POST",
          "rationale": "If the dispute is legitimate, accepting it immediately refunds the customer and avoids further legal action."
        }
      ]
    }

Suggested actions are advisory. An agent may choose actions outside this list.

---

## MULTI-STEP TRANSACTION PATTERNS

Some agent workflows span multiple API calls that must succeed as a unit (or fail without partial state). Reyna Pay does not natively support multi-statement transactions, but provides patterns for compensating action.

### The book-and-pay flow (canonical example)

Agent books an appointment and processes payment as a single user-facing operation:

1. Agent calls `POST /v1/charges` with the payment details
2. Charge succeeds with `status=completed`
3. Agent calls into the consumer's booking system (Kasse) to record the appointment
4. If step 3 fails, the agent MUST call `POST /v1/refunds` to compensate for the now-orphaned charge

Pattern: the agent treats the charge as a "pre-authorization of intent" and refunds if the corresponding business action fails.

Tier 1's idempotency rules apply across all steps. Each step in a multi-step workflow gets its OWN idempotency key — the pseudocode below derives distinct keys (chargeKey, bookingKey, refundKey) from a shared workflow ID. Retries of any individual step reuse that step's key (so retries are idempotent at the step level), but the charge and the compensating refund are different operations with different idempotency keys. Reusing the charge's idempotency key on the refund POST would either fail (the engine binds keys to endpoint paths) or, worse, return the cached charge response and silently skip the refund. The pseudocode below shows the correct pattern.

### Auth-and-capture for held authorizations

When the agent doesn't yet know the final amount (e.g., a service-business hold for a chemical service before final scope is determined):

1. Agent calls `POST /v1/charges` with `capture: false` for the maximum estimated amount
2. Charge succeeds with `status=authorized`
3. Service is performed; final scope determined
4. Agent calls `POST /v1/charges/:id/capture` with the actual amount (must be ≤ authorized amount)
5. Captured amount is settled; any remaining authorized-but-not-captured amount is released back to the cardholder

Tier 2 documented capture; Tier 4 explicitly recommends this pattern for agent workflows where the final amount is uncertain at authorization time.

### Idempotency for multi-step

When an agent's workflow spans multiple endpoints, each endpoint requires its own idempotency key. The agent should derive related keys from a single workflow ID:

    // Pseudocode — workflow keys derived deterministically
    const workflowId = `wf_${uuidv4()}`;
    const chargeKey = `${workflowId}:charge`;
    const bookingKey = `${workflowId}:booking`;
    const refundKey = `${workflowId}:refund`;

This pattern lets the agent retry any individual step without breaking idempotency, and lets the engine's audit trail correlate steps belonging to one workflow.

---

## AGENT IDENTITY AND AUTHORIZATION

### Establishing agent identity

An agent operates with one of two identity models:

**1. Agent owns its own API key.** The agent is a first-class consumer. Its API key is issued at agent registration. Examples: a Claude-based booking agent operating across many merchants; an enterprise-tier custom agent.

**2. Agent acts on behalf of a merchant via platform token.** The agent uses a platform token (rpsp_*) with `X-Reyna-Pay-On-Behalf-Of: org_xxx`. The platform's relationship with the merchant is the basis of authorization. Examples: Kasse's AI receptionist booking on behalf of a salon.

Both models support agent identity tagging via the `agent_type` field at API key creation (Tier 4 Per-Agent-Type Rate Limits section).

### Authorization scope for agents

Agent API keys should be issued with minimum-necessary scope. For an agent that only processes payments and refunds:

    POST /v1/api-keys
    {
      "scope": ["write"],
      "agent_type": "claude_booking_agent",
      "endpoint_allowlist": ["/v1/charges", "/v1/refunds", "/v1/customers"]
    }

The optional `endpoint_allowlist` further restricts the agent to specific endpoints regardless of scope. This is a defense-in-depth measure for agent traffic — an agent that needs to create charges should NOT be able to delete merchants even if its scope is `admin`.

### Agent revocation

When an agent misbehaves, revoke the API key immediately via `DELETE /v1/api-keys/:id`. The token is invalidated at the next auth-cache refresh (under 60 seconds). All in-flight requests with that token continue to completion; new requests fail with `TOKEN_REVOKED`.

---

## CONCLUSION

This concludes the Reyna Pay engine API specification, v1, Tiers 1 through 4. The complete document defines:

- **Tier 1 (Foundation):** versioning, authentication, idempotency, error format, pagination, rate limits, webhook envelope, HATEOAS, OpenAPI commitment, common conventions
- **Tier 2 (Resources):** 14 resources (Merchants, Customers, Cards, Bank Tokens, Charges, Refunds, Voids, Payouts, Disputes, Checkout Sessions, Transactions, Reports, API Keys, Webhooks) with full schemas, operations, filtering, expansion, HATEOAS, and webhook events
- **Tier 3 (Non-functional):** SLA, latency budgets, data residency, compliance posture (PCI inheritance, SOC 2 roadmap, audit logging, encryption, retention, deletion), sandbox/test mode, deprecation policy, monitoring, SDKs
- **Tier 4 (Agent-native):** MCP server commitment, agent audit logging, per-agent-type rate limits, semantic enhancements (action descriptions, predicates, suggested next actions), multi-step transaction patterns, agent identity and authorization

The SalonTransact engineering team is now unblocked to implement the engine against this contract. Implementation work happens in the separate `lendbucket/salontransact` repo and follows the engineering work queue maintained in the appendix of KASSE_ENGINE_BOUNDARY.md (which references the endpoint shapes defined throughout this document).

Future amendments to this spec follow the CHANGE LOG convention and the VERSIONING policy (Tier 1).

---

## SPECIFICATION COMPLETE

Tiers 1 through 4 of this specification are now defined. Future changes to the v1 API surface follow the VERSIONING policy (Tier 1). Breaking changes require v2. Backward-compatible additions can be made within v1. The CHANGE LOG below tracks all amendments.

---

## CHANGE LOG

| Tier | Change |
|------|--------|
| Tier 1 (Phase 0.9-a, PR #36) | Foundation established: versioning, auth, idempotency, errors, pagination, rate limits, webhooks, HATEOAS, OpenAPI, common conventions. |
| Tier 2 (Phase 0.9-b, PR #37) | Resource definitions added: Merchants, Customers, Cards, Bank Tokens, Charges, Refunds, Voids, Payouts, Disputes, Checkout Sessions, Transactions, Reports, API Keys, Webhooks. Platform-token mechanism defined. Resource-specific error codes added. |
| Tier 3+4 (Phase 0.9-c, this PR) | Non-functional requirements added: SLA, latency budgets, data residency, compliance posture, sandbox/test mode, deprecation policy, monitoring, SDKs. Agent-native design added: MCP server commitment, agent audit logging, per-agent-type rate limits, semantic enhancements, multi-step transaction patterns, agent identity and authorization. Specification complete. |
