# scripts/

Operational scripts for the Kasse portal.

## smoke.ts

Discovers all routes in `app/` and pings each one. Validates HTTP status codes.
Run from a repo root with the dev server running:

    npm run dev          # in one terminal
    npm run smoke        # in another

Expected: 46/46 PASS, 0 failed, 9 skipped (dynamic).

## audit-verify.ts

End-to-end verification that the audit log pipeline produces complete rows on
real authenticated writes. Requires a session cookie from a logged-in browser.

### How to run

1. Start the dev server:

       npm run dev

2. Open `http://localhost:3000` in your browser. Log in.

3. Open dev tools (F12) → **Application** tab → **Cookies** →
   `http://localhost:3000` → click `next-auth.session-token`.
   Copy the **entire Value** (long base64 string, may include dots).

4. In a fresh terminal:

       $env:SMOKE_SESSION_COOKIE = "next-auth.session-token=<paste-value-here>"
       npm run audit:verify

5. Read the output. Every line should say PASS. Failures indicate a real
   gap in the audit pipeline — fix before merging.

### Expected output

    Kasse audit log end-to-end verification
    Base URL: http://localhost:3000
    Auth cookie: provided

    Step 1: discovering location...
      PASS  location discovery — using <Location Name>

    Step 2: POST /api/clients to create test client...
      PASS  create client — id=<cuid>

    Step 3: querying AuditLog for the create event...
      PASS  audit row exists — id=<cuid>

    Step 4: validating every audit column...
      PASS  userId set — <user cuid>
      PASS  organizationId set — <org cuid>
      PASS  entity = Client
      PASS  entityId matches
      PASS  action = CREATE
      PASS  ipAddress captured — ::1   (or null on some configs)
      PASS  userAgent captured — node ...
      PASS  route captured — /api/clients
      PASS  requestId captured — <null on localhost — expected>
      PASS  after state populated — id+name match
      PASS  before is null on CREATE
      PASS  changedFields present — array(0)

    Step 5: cleanup — deleting test client...
      PASS  cleanup delete
      PASS  DELETE audit row exists

    Summary: 15/15 ok, 0 failed.

### What "PASS with null on localhost" means

Some HTTP context fields like `requestId` (sourced from `x-vercel-id`) won't
populate on a local dev server. The script accepts this and reports it. On
Vercel production, all fields populate.
