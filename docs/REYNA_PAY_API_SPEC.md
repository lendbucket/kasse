# REYNA PAY ENGINE API SPECIFICATION
## The payment rails contract for Kasse, SalonBacked, RunMySalon, white-label brands, developer API consumers, and AI agents

**Version:** 1.0 — Tier 1 (Foundation)
**Status:** LIVING (Tier 2 and Tier 3+4 to follow in subsequent PRs)
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

- **Tier 1 — Foundation (this PR, Phase 0.9-a):** Cross-cutting conventions — versioning, auth, idempotency, errors, pagination, rate limits, webhooks, HATEOAS, OpenAPI commitment, common patterns.
- **Tier 2 — Resource Definitions (Phase 0.9-b, future PR):** Charges, Refunds, Voids, Bank Tokens, Cards, Customers, Merchants, Payouts, Disputes, Checkout Sessions, Transactions (aggregate read), Reports. One section per resource with full request/response schemas.
- **Tier 3+4 — Non-Functional + Agent-Native (Phase 0.9-c, future PR):** SLA, latency budgets, data residency, compliance posture (PCI, SOC 2), audit log retention, sandbox/test environment, deprecation policy, agent-native semantics, MCP server commitment.

The complete specification when all three tiers are merged will define an enterprise-grade API contract that the SalonTransact engineering team implements.

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

Exception: a future Tier 2 will define "platform tokens" issued to Kasse, SalonBacked, RunMySalon, and white-label brands. Platform tokens allow operations on behalf of any merchant boarded under that platform, with an additional `X-Reyna-Pay-On-Behalf-Of: org_abc123` header that names the target merchant. The engine verifies the target merchant is boarded under the platform that owns the token before authorizing.

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

### Error code catalog (Tier 1 — extensible in Tier 2 per resource)

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

Tier 2 will extend this catalog with resource-specific codes (e.g., `CHARGE_AMOUNT_TOO_LOW`, `BANK_TOKEN_NOT_FOUND`, `MERCHANT_BOARDING_FAILED`).

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

Tier 2 will define stricter per-endpoint limits for sensitive operations (e.g., bank token detokenization may be limited to 10/minute regardless of overall tier). These compose with the overall tier limits — both are enforced.

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

Tier 2 will document the `data` payload for each event type.

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

Tier 4 will expand on agent-native design. For Tier 1, the principle is: every response is self-describing. An AI agent receiving a charge object knows it can refund, void, or fetch the receipt without reading any documentation.

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
- SDKs and client libraries (Tier 3 will list) SHALL be auto-generated from the OpenAPI spec.

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

- Tier 1: English error messages only.
- Tier 3 will define multi-language support if/when international merchants are onboarded.

---

## SANDBOX / TEST MODE

Detailed sandbox specification is Tier 3. Tier 1 lays the principle:

- Test mode uses a parallel set of credentials (`rpsk_test_*` tokens) and a separate data store.
- Test mode operations do not affect production data.
- Test mode is available before production merchant boarding completes.
- Tier 3 will document test card numbers, test bank account numbers, simulated failure modes (decline, network error, fraud rule trigger), and webhook delivery in test mode.

---

## REQUEST ID

Every request to Reyna Pay generates a unique request ID. This is included:

- In the response header: `Reyna-Pay-Request-Id: req_xyz789`
- In every error body's `error.request_id` field
- In the engine's audit log for that request

Consumers SHALL include the request ID when contacting support. Logs without request IDs are extremely difficult to correlate to engine-side state.

---

## CHANGE LOG

Tier 1 establishes the foundation. Subsequent changes within v1 will be appended to a CHANGE LOG section in the final consolidated doc. For Tier 1, no changes yet.

---

## OUT OF SCOPE FOR TIER 1

The following are deliberately deferred to later tiers and SHALL NOT be addressed in implementation work that uses this Tier 1 doc:

- Resource definitions (charges, refunds, voids, bank tokens, cards, customers, merchants, payouts, disputes, checkout sessions, transactions, reports) — Tier 2
- SLA, latency budgets, uptime commitments — Tier 3
- Data residency, compliance posture (PCI, SOC 2 roadmap), audit log retention — Tier 3
- Sandbox test card numbers and failure simulation — Tier 3
- Migration guides and deprecation procedures — Tier 3
- Localization, multi-language support — Tier 3
- Agent-native deep design (MCP server commitment, agent audit logs, per-agent rate limits, semantic enhancement) — Tier 4
- SDKs, client libraries, OpenAPI-derived code generation — Tier 3

The SalonTransact engineering team SHOULD NOT implement endpoints in Tier 2 areas until Tier 2 is published. Tier 1 supports building the common infrastructure (auth middleware, idempotency store, error formatter, rate limiter, webhook signer, OpenAPI generator) that all Tier 2 endpoints will use.
