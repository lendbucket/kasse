# Observability

Last updated: 2026-05-18

## Stack

- **Error tracking:** Sentry v10 (`@sentry/nextjs`)
- **Structured logging:** Pino (always JSON to stdout)
- **Request correlation:** UUID v4 per request via `x-request-id` header
- **Log shipping:** Vercel built-in (JSON to stdout → Vercel log drain)
- **Performance monitoring:** Sentry Performance (10% sample in production)

## File layout (Sentry v10 + Next.js 16)

Sentry v10 uses the Next.js instrumentation hook pattern:

| File | Purpose |
|------|---------|
| `instrumentation-client.ts` | Client-side Sentry init (replaces old `sentry.client.config.ts`) |
| `instrumentation.ts` | Server/edge Sentry init via `register()` + `onRequestError` export |
| `sentry.server.config.ts` | Server-side `Sentry.init()` — loaded by `instrumentation.ts` |
| `sentry.edge.config.ts` | Edge-side `Sentry.init()` — loaded by `instrumentation.ts` |

## Initialization gating

Sentry initializes ONLY in production by default. Local dev and preview do
NOT send to Sentry to preserve quota and feedback loop speed.

Preview can be enabled per-deployment by setting:
- `NEXT_PUBLIC_SENTRY_PREVIEW_ENABLED=true` (client)
- `SENTRY_PREVIEW_ENABLED=true` (server + edge)

## Local dev pretty output

The logger always emits JSON to stdout. To get pretty colored output in dev,
pipe through pino-pretty:

```bash
npm run dev | npx pino-pretty
```

The `transport: { target: 'pino-pretty' }` pattern is NOT used in the logger
because it has known issues with Turbopack + Vercel (thread-stream worker
errors). Always-JSON is more portable and works in every environment.

## Required environment variables

Production:
- `NEXT_PUBLIC_SENTRY_DSN` — client-side DSN
- `SENTRY_DSN` — server + edge DSN
- `SENTRY_ORG` — Sentry org slug (for source map upload)
- `SENTRY_PROJECT` — Sentry project slug (for source map upload)
- `SENTRY_AUTH_TOKEN` — auth token with `project:releases` scope

## Usage

### In API routes

Every API route should set the tenant context early:

```typescript
import { getRequestLogger } from '@/lib/observability/logger';
import { setSentryTenantContext } from '@/lib/observability/sentry-helpers';
import { getRequestId, REQUEST_ID_HEADER } from '@/lib/observability/request-id';

export async function POST(req: Request) {
  const requestId = req.headers.get(REQUEST_ID_HEADER) ?? getRequestId(req);

  // ... auth check, get session.user, get organization context ...

  setSentryTenantContext({
    organizationId: session.organizationId,
    userId: session.userId,
    requestId,
  });

  const log = getRequestLogger({
    requestId,
    organizationId: session.organizationId,
    userId: session.userId,
    path: '/api/example',
    method: 'POST',
  });

  log.info('processing request');

  try {
    // ... handler logic ...
  } catch (err) {
    log.error({ err }, 'handler failed');
    throw err; // Sentry will capture via global handler
  }
}
```

### In server actions

Same pattern but request ID comes from the headers helper:

```typescript
import { headers } from 'next/headers';
import { REQUEST_ID_HEADER } from '@/lib/observability/request-id';

export async function myAction() {
  const requestId = (await headers()).get(REQUEST_ID_HEADER) ?? 'no-request-id';
  // ... use requestId in logs and Sentry tags ...
}
```

## Redacted log paths

The following paths are automatically redacted from logs (replaced with
`[REDACTED]`):

- `password`, `*.password`
- `token`, `*.token`
- `authorization`, `*.authorization`, `req.headers.authorization`
- `cookie`, `set-cookie`, `req.headers.cookie`, `res.headers["set-cookie"]`
- `card_number`, `cvv`, `ssn`

If you find yourself logging a sensitive field not in this list, ADD IT to
the redact paths in `lib/observability/logger.ts` rather than working around
it.

## Verifying capture

To verify Sentry is working in production:

1. Deploy to production
2. Trigger a deliberate error in a test endpoint
3. Check Sentry dashboard within 60 seconds
4. Verify the event includes `organizationId` and `requestId` tags
5. Delete the test endpoint

## SLA budget

- Free tier: 5,000 errors/month
- Performance: 10% trace sample rate in production
- Session replay: 1% session sample, 100% error replay
- If we approach 80% of quota, upgrade to Team plan ($26/mo for 50K errors)

This budget is appropriate for foundation + initial launch. After P1+ launches,
monitor and adjust based on actual rate.
