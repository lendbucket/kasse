# KASSE ARCHITECTURE
## Infrastructure, Repositories, APIs, and Technical Foundation

**Version:** 1.0 | **Status:** LIVING DOCUMENT

---

## REPOSITORY STRUCTURE

```
lendbucket/
├── kasse/                         # Merchant web portal (Next.js 15)
│   ├── app/
│   │   ├── (auth)/                # Login, register, verify email
│   │   ├── onboarding/            # 9-step wizard
│   │   ├── dashboard/             # Main portal
│   │   │   ├── pos/               # POS terminal
│   │   │   ├── appointments/      # Calendar + booking
│   │   │   ├── clients/           # CRM
│   │   │   ├── staff/             # Team management
│   │   │   ├── services/          # Service catalog
│   │   │   ├── reports/           # Analytics
│   │   │   ├── marketing/         # Campaigns + automations
│   │   │   ├── reputation/        # Reviews
│   │   │   ├── messages/          # HyperConnect messaging
│   │   │   ├── waitlist/          # Waitlist management
│   │   │   ├── ai-receptionist/   # AI voice config
│   │   │   ├── inventory/         # Products + stock
│   │   │   ├── loyalty/           # Loyalty + gift cards
│   │   │   ├── franchise/         # Franchise creator + management
│   │   │   └── settings/          # All settings
│   │   ├── admin/                 # Robert's superadmin portal
│   │   ├── book/[slug]/           # Public booking page
│   │   ├── kiosk/                 # Kiosk mode
│   │   └── api/                   # Next.js API routes
│   ├── lib/
│   │   ├── engine/                # Typed SalonTransact API client
│   │   ├── theme/                 # White-label theme system
│   │   ├── validation/            # Form validation
│   │   ├── emails/                # Email templates
│   │   └── ai/                    # AI utility functions
│   └── prisma/                    # Schema + seed files
│
├── kasse-native/                  # React Native (iPad + iPhone) — Phase 2
│   ├── apps/
│   │   ├── kasse-ipad/            # Front-of-house POS
│   │   └── kasse-iphone/          # Stylist app
│   └── packages/
│       ├── ui/                    # Shared components
│       ├── engine-client/         # Shared API client
│       └── theme/                 # Shared theme tokens
│
└── salontransact/                 # The Reyna Pay engine (separate repo)
```

---

## VERCEL PROJECTS

| Project | Domain | Repo | Notes |
|---------|--------|------|-------|
| kasse | portal.kasseapp.com | lendbucket/kasse | Main portal |
| kasse-admin | admin.kasseapp.com | lendbucket/kasse | Same repo, /admin route |
| kasse-marketplace | kassestylists.com | lendbucket/kasse | /marketplace route |
| kasse-booking | book.kasseapp.com | lendbucket/kasse | /book/[slug] public pages |
| salontransact | app.salontransact.com | lendbucket/salontransact | Engine (existing) |

---

## ENVIRONMENT VARIABLES (COMPLETE LIST)

```env
# Database
DATABASE_URL=                       # Supabase PostgreSQL (session pooler)
DIRECT_URL=                         # Supabase direct connection

# Auth
NEXTAUTH_SECRET=                    # 32-char random string
NEXTAUTH_URL=                       # https://portal.kasseapp.com

# Email
RESEND_API_KEY=                     # Transactional email
EMAIL_FROM=                         # onboarding@kasseapp.com

# AI
ANTHROPIC_API_KEY=                  # Claude (in-portal AI assistant)
OPENAI_API_KEY=                     # GPT-4o (AI voice receptionist)

# Voice / SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=                # The salon's AI receptionist number

# Payments Engine
SALONTRANSACT_API_KEY=              # Calls to Reyna Pay engine
SALONTRANSACT_API_URL=              # https://app.salontransact.com/api/v1

# Google
GOOGLE_PLACES_API_KEY=              # Reputation management
GOOGLE_MAPS_API_KEY=                # Territory mapping, location features
GOOGLE_MY_BUSINESS_CLIENT_ID=       # Review management OAuth
GOOGLE_MY_BUSINESS_CLIENT_SECRET=

# Subscriptions (Kasse's own billing — NOT payments)
STRIPE_SECRET_KEY=                  # For Kasse subscription billing only
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Storage
AWS_ACCESS_KEY_ID=                  # S3 for photos, documents
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=

# Feature Flags
FEATURE_AI_RECEPTIONIST=            # true/false
FEATURE_MARKETPLACE=                # true/false
FEATURE_FRANCHISE_CREATOR=         # true/false
FEATURE_KASSE_CAPITAL=              # true/false
```

---

## DATABASE ARCHITECTURE (SUPABASE)

### Core Tables
```
Organization        # Tenant (one per business)
User                # Auth users (linked to org)
Location            # Physical locations (one org, many locations)
Staff               # Stylists and staff (linked to org + location)
Client              # Customer CRM (linked to org)
Service             # Service catalog (linked to org)
```

### Booking Tables
```
Appointment         # Bookings (linked to org, location, staff, client)
AppointmentAddon    # Add-on services per appointment
WaitlistEntry       # Waitlist entries
```

### Payment Tables
```
Transaction         # Completed payments (linked to org, location)
TransactionItem     # Line items per transaction
GiftCard            # Gift card records
GiftCardRedemption  # Redemption events
```

### Loyalty + Memberships
```
LoyaltyProgram      # Org-level loyalty config
LoyaltyEvent        # Points earned/redeemed per client
Membership          # Membership plans
ClientMembership    # Client enrollment in membership
```

### Marketing + Messaging
```
Campaign            # Marketing campaigns
CampaignRecipient   # Per-client send record
ReviewRequest       # Review requests sent
Message             # HyperConnect messages
SavedResponse       # Message templates
```

### Compliance + HR
```
AuditLog            # All significant actions logged
FormTemplate        # Intake forms + waivers
FormSubmission      # Client form completions
ClockEvent          # Staff clock in/out with GPS
PerformanceStat     # Per-stylist per-period stats
```

### System Tables
```
Notification        # In-app notifications
ImportJob           # CSV import tracking
Device              # Registered iPads/kiosks
ApiKey              # Developer API keys
Webhook             # Configured webhooks
BusinessSettings    # Per-org settings
PermissionSet       # Role-based access config
```

### AI Tables
```
AiReceptionistConfig    # Per-org AI receptionist settings
AiReceptionistCall      # Call log with transcripts
```

### Franchise Tables
```
FranchiseSystem         # Franchise creator records
FranchiseTerritory      # Geographic territories
FranchiseeApplication   # Prospective franchisee applications
FranchiseFee            # Fee configuration per franchise system
RoyaltyPayment          # Fee collection records
```

### Marketplace Tables
```
StylistProfile          # Public marketplace profile
MarketplaceBooking      # Bookings originated from marketplace
FeaturedPlacement       # Paid featured listing records
```

---

## THIRD-PARTY API DEPENDENCIES

| Service | Purpose | Priority | Notes |
|---------|---------|----------|-------|
| Reyna Pay / SalonTransact | All payments | P0 | Engine — locked SD-001 |
| Twilio | SMS + Voice AI | P0 | A2P 10DLC registration required |
| Resend | Transactional email | P0 | Already configured |
| Supabase | Database + storage | P0 | Already configured |
| Anthropic (Claude) | In-portal AI | P1 | Already have key |
| OpenAI (GPT-4o) | AI voice receptionist | P1 | Separate from Anthropic |
| Google Places API | Reputation + locations | P1 | |
| Google My Business API | Review management | P2 | Requires OAuth setup |
| AWS S3 | Photo storage | P1 | Before/after photos |
| Stripe | Kasse subscription billing ONLY | P1 | NOT for salon payments |
| ElevenLabs | Custom AI voice | P3 | Phase 9+ |
| Zapier | Automation integrations | P2 | Phase 10 |
| Gusto API | Payroll integration (SalonBacked) | P2 | |
| Salon Centric API | Supply marketplace | P3 | Phase 12 |

---

## TECHNICAL PRINCIPLES

### Kasse is a Thin Client (SD-K-001)
Kasse has no payments backend. All payment operations call the Reyna Pay engine at `/api/v1/*`. This keeps Kasse deployable by resellers in hours, not weeks.

### Theme System First
Every color, logo, copy string, and email template lives in `lib/theme/theme.config.ts`. Changing one file re-themes the entire product. This is required before any reseller can go live.

### Agent-Native API Design (SD-K-005)
Every endpoint designed to be consumed by AI agents:
- Semantic names (POST /bookings, not POST /create-record)
- HATEOAS `_links` in responses
- OpenAPI 3.1 spec auto-generated
- Consistent error format
- Idempotency on every POST

### Offline Mode (SD-K-009)
iPad POS must work without internet. Architecture:
- Cache last 24 hours of customers/stylists/services to local storage
- Charges queue locally when offline
- Payroc terminal has local approval mode (card-present works offline)
- Queue flushes with idempotent keys when connectivity returns

### Row-Level Security
All database queries scoped by `organizationId`. Supabase RLS policies enforce this at database level. No org can ever see another org's data.

### Audit Everything
Every significant action logged to AuditLog with userId, orgId, action, before/after state, IP, timestamp. Non-deletable. Required for franchise compliance and dispute resolution.
