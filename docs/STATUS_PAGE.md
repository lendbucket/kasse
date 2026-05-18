# Status Page

Last updated: 2026-05-18

## Architecture

Kasse uses BetterStack for public uptime monitoring + incident communication.
We expose an internal health endpoint that BetterStack pings every minute.

## Components

- **BetterStack** (external, $29/mo) -- synthetic monitors, public status page
  at status.kasseapp.com (subdomain configured separately), incident
  management, email/SMS alerts.
- **/api/health** (internal route) -- JSON snapshot of platform health. Polled
  by BetterStack. Public/unauthenticated.
- **/status** (public page) -- thin server-rendered page showing current health
  + link to BetterStack page. Lives on main kasseapp.com until
  status.kasseapp.com subdomain is configured.

## Health checks

`/api/health` runs 5 checks in parallel and returns 200 ok or 503 fail:

| Check | What it verifies |
|---|---|
| `database` | Supabase connection (prismaAdmin runs SELECT 1) |
| `sentry` | SENTRY_DSN env var is present and well-formed |
| `resend` | RESEND_API_KEY env var is present and starts with re_ |
| `storage` | NEXT_PUBLIC_SUPABASE_URL + ANON_KEY env vars are present |
| `cron_heartbeat` | Last audit_retention.completed audit log entry is < 26h old |

Checks like `sentry`, `resend`, `storage` verify env-var presence, not real
upstream availability -- actual upstream pings cost API calls and quota.
Sentry's, Resend's, and Supabase's own status pages cover their availability.

`cron_heartbeat` becomes meaningful AFTER the audit-retention cron is
registered in vercel.json (a later deployment PR). Until then, the check
returns ok=true with no audit_retention.completed entry yet -- no false
alarms during foundation phase.

## BetterStack setup

(One-time setup by Robert in BetterStack dashboard)

1. Create monitor:
   - **Name:** Kasse Production Health
   - **URL:** `https://portal.kasseapp.com/api/health`
   - **Method:** GET
   - **Check frequency:** 60 seconds
   - **Expected status:** 200
   - **Expected response body contains:** `"ok":true`
   - **Alert on:** Status code change OR response body mismatch

2. Create status page:
   - **Subdomain:** status.kasseapp.com (configure DNS CNAME to BetterStack)
   - **Page title:** Kasse Status
   - **Logo:** upload Kasse logo
   - **Subscribe:** allow email + SMS subscriptions

3. Configure alerts:
   - **Primary on-call:** Robert (ceo@36west.org)
   - **Escalation policy:** none yet, single-on-call until team grows
   - **Notification channels:** Email + SMS

4. Once status page is live, set the Vercel env var:
   - `NEXT_PUBLIC_BETTERSTACK_STATUS_URL=https://status.kasseapp.com`

## DNS setup

To point status.kasseapp.com at BetterStack:

1. In Cloudflare (kasseapp.com DNS), add a CNAME:
   - **Type:** CNAME
   - **Name:** status
   - **Target:** [provided by BetterStack]
   - **Proxy:** OFF (BetterStack handles TLS)

2. In BetterStack, add status.kasseapp.com as a custom domain.

3. Wait for DNS propagation + BetterStack TLS issuance (usually < 1 hour).

## Security notes

- /api/health is unauthenticated by design (synthetic monitors don't carry
  sessions). Add IP allowlisting if abuse becomes a problem.
- /api/health response is informationally minimal -- no version strings, no
  internal IPs, no stack traces. Just per-check ok flags + timestamp.
- /api/health has `X-Robots-Tag: noindex` to prevent search indexing.
- Cache-Control: no-store prevents stale cache from masking real failures.

## Future enhancements (not in this PR)

- Add Salon Envy + SalonTransact monitors to BetterStack (separate URLs)
- Real Resend ping check (low-frequency, cached) once email is mission-critical
- Real Supabase Storage bucket reachability ping when storage is consumer-facing
- /admin/health dashboard with Sentry incident overlay
- BetterStack incident notification to Slack integration
