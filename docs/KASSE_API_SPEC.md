# KASSE API SPEC
## Full API Capability Matrix

**Version:** 1.0 | **Base URL:** https://portal.kasseapp.com/api/v1

---

## AUTHENTICATION

All API requests require an API key in the header:
```
Authorization: Bearer kasse_live_xxxxxxxxxxxxxxxxxxxx
```

API keys are scoped. Scopes:
- `read` — GET endpoints only
- `write` — GET + POST + PATCH
- `admin` — Full access including DELETE and sensitive operations
- `webhooks` — Webhook management only
- `reports` — Reports endpoints only (for BI tool integrations)

---

## IDEMPOTENCY

All POST requests must include:
```
Idempotency-Key: <UUID v4>
```

Same key + same body = same response (deduplication).
Same key + different body = 409 Conflict.
Keys expire after 7 days.

---

## ERROR FORMAT

All errors follow this format:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The client with ID cuid123 was not found",
    "param": "clientId",
    "docs": "https://docs.kasseapp.com/errors/RESOURCE_NOT_FOUND"
  }
}
```

Error codes: `UNAUTHORIZED`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `VALIDATION_ERROR`, `DUPLICATE_REQUEST`, `RATE_LIMITED`, `INTERNAL_ERROR`

---

## ENDPOINTS

### Clients
```
GET    /v1/clients                    List clients (paginated, searchable)
POST   /v1/clients                    Create client
GET    /v1/clients/:id                Get client profile + history
PATCH  /v1/clients/:id                Update client
DELETE /v1/clients/:id                Deactivate client (soft delete)
GET    /v1/clients/:id/appointments   Client appointment history
GET    /v1/clients/:id/transactions   Client transaction history
GET    /v1/clients/:id/loyalty        Client loyalty points + history
GET    /v1/clients/lookup             Lookup by email or phone
POST   /v1/clients/:id/tags           Add tag
DELETE /v1/clients/:id/tags/:tag      Remove tag
GET    /v1/clients/:id/family         List family members
POST   /v1/clients/:id/family         Add family member
```

### Appointments
```
GET    /v1/appointments               List appointments (date range, status, location, staff)
POST   /v1/appointments               Create appointment
GET    /v1/appointments/:id           Get appointment detail
PATCH  /v1/appointments/:id           Update appointment (reschedule, notes, status)
DELETE /v1/appointments/:id           Cancel appointment
GET    /v1/appointments/availability  Check availability (staff, date, duration)
POST   /v1/appointments/:id/checkin   Mark client arrived
POST   /v1/appointments/:id/complete  Mark service complete
POST   /v1/appointments/:id/noshow    Mark no-show (triggers fee if configured)
GET    /v1/appointments/:id/addons    List add-ons on appointment
POST   /v1/appointments/:id/addons    Add add-on service
```

### Transactions (Payments)
```
GET    /v1/transactions               List transactions (date range, location, staff)
POST   /v1/transactions               Create transaction (charge)
GET    /v1/transactions/:id           Get transaction detail
POST   /v1/transactions/:id/refund    Refund transaction (full or partial)
POST   /v1/transactions/:id/void      Void transaction (same-day only)
GET    /v1/transactions/:id/receipt   Get receipt data
POST   /v1/transactions/:id/receipt/send  Send receipt via SMS or email
```

### Staff
```
GET    /v1/staff                      List staff (location, role, active)
POST   /v1/staff                      Create staff member
GET    /v1/staff/:id                  Get staff profile
PATCH  /v1/staff/:id                  Update staff member
GET    /v1/staff/:id/schedule         Get staff schedule
GET    /v1/staff/:id/performance      Get performance stats (period required)
GET    /v1/staff/:id/commission       Get commission breakdown (period required)
POST   /v1/staff/:id/clock-in         Clock in (with GPS coordinates)
POST   /v1/staff/:id/clock-out        Clock out
GET    /v1/staff/:id/clock-events     List clock events
```

### Services
```
GET    /v1/services                   List services (category, location, active)
POST   /v1/services                   Create service
GET    /v1/services/:id               Get service detail
PATCH  /v1/services/:id               Update service
DELETE /v1/services/:id               Deactivate service
GET    /v1/services/categories        List categories
```

### Locations
```
GET    /v1/locations                  List locations
POST   /v1/locations                  Create location
GET    /v1/locations/:id              Get location detail
PATCH  /v1/locations/:id              Update location
GET    /v1/locations/:id/hours        Get business hours
PATCH  /v1/locations/:id/hours        Update business hours
GET    /v1/locations/:id/availability Get location availability (date range)
```

### Gift Cards
```
GET    /v1/gift-cards                 List gift cards
POST   /v1/gift-cards                 Create/sell gift card
GET    /v1/gift-cards/:code           Lookup gift card by code
POST   /v1/gift-cards/:code/redeem    Redeem gift card (amount)
POST   /v1/gift-cards/:code/reload    Add balance to gift card
```

### Loyalty
```
GET    /v1/loyalty                    Get loyalty program config
PATCH  /v1/loyalty                    Update loyalty config
GET    /v1/loyalty/clients/:id        Get client loyalty balance + history
POST   /v1/loyalty/clients/:id/earn   Add points
POST   /v1/loyalty/clients/:id/redeem Redeem points
```

### Waitlist
```
GET    /v1/waitlist                   List waitlist entries
POST   /v1/waitlist                   Add to waitlist
GET    /v1/waitlist/:id               Get waitlist entry
PATCH  /v1/waitlist/:id               Update status
POST   /v1/waitlist/:id/notify        Send notification to client
DELETE /v1/waitlist/:id               Remove from waitlist
```

### Reports
```
GET    /v1/reports/revenue            Revenue summary (date range, location, staff)
GET    /v1/reports/transactions       Transaction detail (all filters)
GET    /v1/reports/staff-performance  Per-stylist performance (date range)
GET    /v1/reports/client-retention   Rebook rate, new vs returning
GET    /v1/reports/services           Revenue by service category
GET    /v1/reports/payroll            Commission + tips for payroll export
GET    /v1/reports/gift-cards         Gift card liability report
GET    /v1/reports/inventory          Product usage report
```

### Marketing
```
GET    /v1/campaigns                  List campaigns
POST   /v1/campaigns                  Create campaign
GET    /v1/campaigns/:id              Get campaign
PATCH  /v1/campaigns/:id              Update campaign
POST   /v1/campaigns/:id/send         Trigger send
GET    /v1/campaigns/:id/analytics    Campaign performance
GET    /v1/segments                   List segments
POST   /v1/segments                   Create segment
GET    /v1/automations                List automations
PATCH  /v1/automations/:id            Enable/disable automation
```

### Webhooks
```
GET    /v1/webhooks                   List configured webhooks
POST   /v1/webhooks                   Create webhook subscription
GET    /v1/webhooks/:id               Get webhook
PATCH  /v1/webhooks/:id               Update webhook
DELETE /v1/webhooks/:id               Delete webhook
GET    /v1/webhooks/:id/deliveries    Delivery history
POST   /v1/webhooks/:id/deliveries/:did/replay  Replay delivery
```

### Organization / Settings
```
GET    /v1/organization               Get org details
PATCH  /v1/organization               Update org details
GET    /v1/organization/settings      Get business settings
PATCH  /v1/organization/settings      Update settings
GET    /v1/organization/permissions   Get permission sets
PATCH  /v1/organization/permissions/:role  Update role permissions
```

---

## WEBHOOK EVENTS

All events follow this envelope:
```json
{
  "id": "evt_01234567",
  "type": "appointment.created",
  "created": 1714500000,
  "organizationId": "org_abc123",
  "data": { /* event-specific payload */ }
}
```

### Available Events
```
appointment.created
appointment.updated
appointment.cancelled
appointment.completed
appointment.noshow
appointment.checkin

client.created
client.updated
client.merged

transaction.completed
transaction.refunded
transaction.voided
transaction.failed

staff.created
staff.updated
staff.clocked_in
staff.clocked_out

waitlist.added
waitlist.notified
waitlist.booked

review.received
review.responded

campaign.sent
campaign.opened
campaign.clicked

gift_card.sold
gift_card.redeemed

membership.created
membership.cancelled
membership.renewed
```

---

## RATE LIMITS

| Tier | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Starter | 60 | 10,000 |
| Growth | 300 | 100,000 |
| Enterprise | 1,000 | Unlimited |
| Internal (Kasse itself) | Unlimited | Unlimited |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1714500060
```

---

## PAGINATION

All list endpoints return:
```json
{
  "data": [...],
  "pagination": {
    "total": 1234,
    "page": 1,
    "perPage": 20,
    "hasMore": true,
    "nextCursor": "cursor_abc123"
  }
}
```

Use `cursor` parameter for cursor-based pagination (more efficient at scale).
Use `page` + `perPage` for offset pagination (easier for simple integrations).

---

## AGENT COMMERCE DESIGN

Every response includes `_links` (HATEOAS) so AI agents know what actions are available:

```json
{
  "id": "apt_123",
  "status": "scheduled",
  "clientName": "Sarah Johnson",
  "_links": {
    "self": { "href": "/v1/appointments/apt_123", "method": "GET" },
    "cancel": { "href": "/v1/appointments/apt_123", "method": "DELETE" },
    "complete": { "href": "/v1/appointments/apt_123/complete", "method": "POST" },
    "checkin": { "href": "/v1/appointments/apt_123/checkin", "method": "POST" },
    "client": { "href": "/v1/clients/clt_456", "method": "GET" }
  }
}
```

Agent audit log: every action taken by an API key tagged as `agent_type` is logged separately with full request/response for accountability.
