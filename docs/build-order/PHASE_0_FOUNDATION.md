# PHASE 0 — FOUNDATION

**Status:** In progress (P0.A–P0.D complete, P0.G–P0.J remaining)
**Total PRs shipped:** 32 (P0.A: 21, P0.B: 4, P0.C: 3, Security: 1, P0.D: 3)
**Remaining PRs estimate:** ~18–22 across P0.G/H/I/J
**Authority:** KASSE_STRATEGIC_DECISIONS.md v2.0 — every architectural decision
referenced here is locked.

This is the foundation that the next ~250 product PRs depend on. After P0 merges,
no PR ever again hardcodes a role string, a vertical-specific term, a plan-tier
check, a theme color, or an engine endpoint.

---

## P0.A — Role + Permission System (21 PRs) ✅ COMPLETE

**Goal:** Replace `User.role` string with a `Role` enum at the database level. Build
the permission key infrastructure that all role-gated UI and API use. Enable custom
roles, multi-location hierarchy, per-resource permission overrides, and audit logging.

**Status:** All 21 PRs shipped. Permission engine fully operational.

**Delivered:**
- `Role` enum with 9 values (SUPERADMIN, OWNER, MANAGER, STAFF, STAFF_VIEW_ONLY, CLIENT, FRANCHISE_OWNER, ACCOUNTANT, BUSINESS_PARTNER)
- 90 PermissionKeys across 14 categories
- `can()` / `requirePermission()` check engine
- Role default permission sets (`lib/permissions/defaults.ts`)
- `PermissionSet` table + CRUD API + UI for custom roles
- Middleware route-tree guards
- Login redirect by role
- `usePermissions()` hook + `<PermissionGate>` component
- `OrganizationGroup` table (REGION/BRAND/CONCEPT levels) — supports multi-level hierarchy and franchise sub-tenants per SD-K-040
- `AuditLog` table + audit trigger for permission changes
- `app_set_tenant` / `app_set_actor` / audit trigger PG functions with `SET search_path = ''` and `REVOKE EXECUTE ... FROM PUBLIC` on mutating functions

**Reference docs:** KASSE_PORTALS.md, KASSE_PORTAL_ARCHITECTURE.md, SD-K-001 (superseded by SD-K-017), SD-K-040

---

## P0.B — Theme System (4 PRs) ✅ COMPLETE

**Goal:** Per-org theme overrides via CSS variables. Foundation for white-label deployments.

**Status:** All 4 PRs shipped. Theme system live.

**Delivered:**
- `ThemeConfig` TypeScript interface
- Default themes for Kasse, SalonTransact, SalonBacked
- `Organization.themeOverride` JSONB column
- `<ThemeProvider>` component wrapping app
- `useTheme()` hook
- Defensive `useSession()?.data ?? null` pattern (cycle 2 fix)
- Replaced hardcoded colors in `globals.css` and `tailwind.config.ts` with CSS variables
- Salon Envy color palette correctly captured (#faf8f6 cream, #2f5061 teal-navy, #4297a0, #e57f84)

**Reference:** SD-K-006 (locked), SD-K-018 (Capacitor v1, RN v2)

---

## P0.C — VerticalConfig System (3 PRs) ✅ COMPLETE

**Goal:** All vertical-specific behavior in TypeScript config files. Switching verticals = config swap, not UI rewrite.

**Status:** All 3 PRs shipped.

**Delivered:**
- `VerticalConfig` TypeScript interface
- `Organization.verticalId` enum field (36 values, default 'salon')
- Salon config (FULL — every field populated)
- Barbershop, nail_salon, med_spa stub configs
- General fallback config
- `getVerticalConfig()` registry function
- `useVerticalConfig()` hook
- `<VerticalTerm name="...">` component
- Backfill migration (all existing orgs → 'salon')

**Reference:** SD-K-003 (locked)

---

## Security Hardening (1 PR) ✅ COMPLETE

**Goal:** Zero security advisor findings before continuing P0.

**Status:** Shipped. `get_advisors(type='security')` returns zero.

**Delivered:**
- Fixed 9 functions with mutable search_path (added `SET search_path = ''`)
- Revoked PUBLIC EXECUTE on 5 mutating SECURITY DEFINER functions (`app_set_tenant`, `app_clear_tenant`, `app_set_actor`, `app_clear_actor`, `app_audit_trigger`)
- Fixed audit trigger schema-qualification bug (changed bare `"AuditLog"` → `"public"."AuditLog"`, `gen_random_uuid()` → `pg_catalog.gen_random_uuid()`)

---

## P0.D — Plan Tier System (3 PRs) ✅ COMPLETE

**Goal:** Per-location pricing enforcement aligned with Square model.

**Status:** All 3 PRs shipped.

**Delivered:**
- `PlanTier` enum (FREE, PLUS, PREMIUM, ENTERPRISE)
- `Organization.planTier` + `enabledAddons: String[]` + `planEffectiveAt`
- `lib/plans/types.ts` and `lib/plans/limits.ts`
- `usePlan()` hook + `<PlanGate>` component
- `tierMeetsMinimum()` helper
- Server-side: `getServerPlanContext()`, `assertCanAddLocation()`, `assertCanAddStaff()`, `PlanLimitError`, `planLimitErrorResponse()`
- POST /api/locations with 3-layer gating (tenant context → SETTINGS.EDIT_LOCATIONS permission → assertCanAddLocation) returning 402 PAYMENT_REQUIRED with structured upgrade body
- Production org cleanup: 4 orgs final (2 PREMIUM, 2 FREE for hard-block testing)

**Reference:** SD-K-020 (locked — per-location, Square-aligned)

---

## P0.E — Reyna Pay Engine Client ⏸ DEFERRED

**Status:** Gated. Code lands when Reyna Pay engine ships. Schema and types prepared
but no client built yet.

**Reason for deferral:** Reyna Pay engine is not yet built. Building Kasse's engine
client against a non-existent backend introduces risk. Will activate as P0.E.1+ once
engine endpoints are deployed by Christopher / Matt.

**Reference:** REYNA_PAY_API_SPEC.md (2457 lines, locked), KASSE_ENGINE_BOUNDARY.md, SD-K-017

---

## P0.F — Reyna Pay Application Embedding ⏸ DEFERRED

**Status:** Gated with P0.E. Will ship when engine is live.

---

## P0.G — Schema Foundations (4 PRs) — IN PROGRESS

**Goal:** Add the schema needed by P1-P12. Includes onboarding, services, scheduling, 
clients, formula tracking, devices, carts, POS, commission, inventory, geolocation, 
multi-location, HCM, and more.

**Status:** PRs 1-2 of 4 shipped. PRs 3-4 remaining.

**Architectural decisions locked for P0.G:**
- SD-K-016: Dual-iPad POS architecture (Stylist iPad + Customer iPad + Payroc terminal)
- SD-K-017: Kasse owns non-payment domain backend
- SD-K-019: HCM foundations v1 (profile, documents, time clock, PTO — no payroll processing)
- SD-K-020: Per-location plan tier already enforced
- SD-K-021: 50-state employment compliance v1 (top 5 priority: TX, CA, FL, NY, IL)
- SD-K-025: Booth rental classification v1 (no sub-merchant)
- SD-K-026: AI scope and content tone guardrails
- SD-K-027: Salon Centric inventory partnership (PDF reorder)
- SD-K-028: Cart starts at appointment creation; walk-in auto-creates shell
- SD-K-029: SMS/email card-capture portal for phone bookings
- SD-K-030: Geolocation enforcement for time clock
- SD-K-031: Per-org client ownership (privacy-first)
- SD-K-035: Custom loyalty/referral per salon
- SD-K-036: Marketing automation full lifecycle v1
- SD-K-040: Multi-location hierarchy (flat/tiered/brand-mode)

**PR breakdown (4 atomic PRs):**

### P0.G PR 1 — Service Catalog + Client + Stylist Scheduling ✅ SHIPPED

New tables/fields:
- `Service`: extend existing with `productCost`, `consumableCost`, `targetMarginPct`, `processingMinutes` (for color services), `addOnVisibleOnBookingMenu` (boolean)
- `ServiceLocation`: per-location pricing/duration overrides (location, service, priceOverrideCents, durationOverrideMinutes, isAvailable)
- `ServiceStaffOverride`: per-stylist pricing/duration overrides (service, staff, priceCents, durationMinutes)
- `Client`: extend with structured `allergies` JSONB, free-text `preferences`, `marketingConsent` boolean, `vipStatus` boolean, `relationshipScore` integer
- `ColorFormula`: per-client formula history (client, appointment, formulaIngredients JSONB array, processingMinutes, resultNotes, beforePhotoUrl, afterPhotoUrl, createdAt)
- `StylistSchedule`: weekly recurring (staff, location, dayOfWeek, startTime, endTime, isWorking)
- `StylistScheduleException`: date-specific overrides (staff, date, startTime, endTime, isWorking, reason)
- `BufferTime`: per-service default + per-stylist override (service, defaultMinutes; staff override stored on `Staff.bufferOverrideMinutes` JSONB)

Estimated: 8-10 atomic commits within this PR.

### P0.G PR 2 — Appointment + Recurring + Booking Constraints ✅ SHIPPED

New tables/fields:
- `Appointment`: extend existing with `seriesId` (cuid, links recurring appointments), `appointmentItems` relation
- `AppointmentItem`: service-level attachment per appointment (appointment, service, staff, scheduledStart, scheduledEnd, actualStart, actualEnd, priceAtBookingCents)
- `RecurringSeries`: parent record (frequency, dayOfWeek, occurrencesGenerated, lastGeneratedThrough)
- `CancellationPolicy`: per-service (service, windowHours, feeFixedCents, feePercentage, noShowFeeCents)
- `BookingWindow`: per-location (location, maxDaysAhead default 60, slotGranularityMinutes default 15)
- `Location`: extend with `geofenceRadiusFeet` (integer, default 100)

Estimated: 6-8 commits.

### P0.G PR 3 — Cart + Device + Order + Payment

New tables/fields:
- `Device`: register iPads/terminals (organization, location, name, role enum [STYLIST_DEVICE / CUSTOMER_DISPLAY / MANAGER_DEVICE / STANDALONE_POS], payrocTerminalId, pairedChairId, lastHeartbeat)
- `Cart`: pre-payment shopping cart (appointment, location, customerId, realtimeChannelId, status enum [OPEN / FINALIZED / CANCELLED], totalCents, createdAt)
- `CartItem`: line items (cart, service|product, staffId, quantity, priceCents, taxableFlag, tipCents)
- `Order`: finalized cart (cart, customer, totalCents, taxCents, tipCents, paymentMethod, payrocTransactionId)
- `Payment`: charge record (order, payrocChargeId, amountCents, status, refundedCents)
- `OfflineQueue`: stores cart actions when offline (cart, action JSONB, queuedAt, syncedAt)
- `GeolocationLog`: every checkout location-stamped (cart, deviceId, lat, lng, distanceFromLocationFeet, withinGeofence boolean, override boolean, managerId nullable)

Estimated: 10-12 commits.

### P0.G PR 4 — Commission + Tips + Tax + Inventory + Marketing Hooks

New tables/fields:
- `Compensation`: per-stylist compensation models (staff, modelType enum [W2_COMMISSION / W2_HOURLY / W2_SALARY / CONTRACTOR_1099 / BOOTH_RENTAL / HYBRID], hourlyRateCents, salaryCentsMonthly, baseCommissionPct, perServiceOverrides JSONB array, tieredCommissionConfig JSONB, boothRentCents, boothRentFrequency)
- `TipSplit`: tip distribution config per salon (organization, splitMethod enum [PRIMARY_ONLY / TIME_BASED / REVENUE_RATIO / EXPLICIT_PERCENT], explicitPercents JSONB)
- `TipDistribution`: actual tip distribution per appointment (appointment, staff, amountCents, methodUsed)
- `ProductCategory`, `Product`, `ProductVariant`: inventory catalog
- `InventoryLevel`: per-location stock (location, productVariant, quantityOnHand, reorderThreshold, autoReorderEnabled)
- `InventoryDeduction`: track usage (appointment OR manual entry, productVariant, quantityUsed, valueCents, source enum [MANUAL / AUTO_FROM_FORMULA / AUTO_FROM_SERVICE])
- `TaxRate`: per-location (location, ratePercent, applicableToServices boolean, applicableToProducts boolean)
- `EmploymentAgreement`: per-staff (staff, templateId nullable, customDocumentUrl nullable, signedDocumentUrl, signedAt, ipAddress)
- `PtoRequest`: leave requests (staff, startDate, endDate, type enum [PTO / SICK / UNPAID], hours, status enum, approvedBy nullable, notes)
- `BackgroundCheck`: Checkr integration (staff, checkrCandidateId, checkrReportId, status, completedAt, adverseFlags JSONB nullable)
- `LicenseVerification`: TDLR + state equivalents (staff, state, licenseType, licenseNumber, issuedAt, expiresAt, lastVerifiedAt)
- `EmailTemplate`: marketing automation (organization, templateKey, subject, bodyHtml, variables JSONB)
- `MarketingAutomation`: drip/win-back/birthday rules (organization, trigger enum, conditions JSONB, templateId, channel enum [SMS / EMAIL / PUSH / IN_APP], isActive)
- `MarketingExecution`: tracking (automation, recipientClientId, sentAt, openedAt, clickedAt, convertedAt)

Estimated: 12-15 commits.

---

## P0.H — Observability + Feature Flags + i18n (3 PRs)

**Status:** Not started. Lands after P0.G.

**Reference:** SD-K-032 (Spanish customer surfaces v1), SD-K-026 (AI bug detection reactive v1)

### P0.H PR 1 — Sentry + Structured Logging + Request ID

- Sentry client/server/edge configs with per-org tagging
- Pino-based structured logger
- Request ID middleware (UUID per request, set in X-Request-Id response header)
- Vercel + Supabase log shipping

### P0.H PR 2 — Feature Flags

- `FeatureFlag` table (id, description, defaultValue, rolloutPct, overrides JSONB)
- `evaluate(flagKey, context)` with stable hash percentage rollout
- Per-org overrides
- `useFlag(key)` hook
- Admin UI for SUPERADMIN to manage flags
- Note: `Organization.enabledAddons` already shipped in P0.D handles addon-level gating; FeatureFlag is for experiment-level rollout

### P0.H PR 3 — i18n Scaffolding (Spanish for Customer Surfaces)

- next-i18next setup
- Locale detection: User.locale → Organization.defaultLocale → Accept-Language → "en-US"
- English (en-US) translations for all P0-P12 strings (created as keys exist)
- Spanish (es-MX, es-US) translation files seeded empty (content populated per phase)
- `<T id="key">` wrapper component
- `useTranslation()` hook
- `formatDate`/`formatCurrency`/`formatNumber`/`formatRelativeTime` using Intl API

---

## P0.I — Custom Fields + Tags + Audit Extension (2-3 PRs)

**Status:** Not started. Lands after P0.H.

### P0.I PR 1 — Custom Fields

- `CustomField` table (org, entityType, name, type enum, options JSONB, required, order)
- `CustomFieldValue` table (customField, entityId, value JSONB)
- Builder UI in Settings → Custom Fields (OWNER only)
- Rendering in entity create/edit forms
- Filtering in list views
- Reporting/segmentation by custom field value

### P0.I PR 2 — Tags (Polymorphic)

- `Tag` table (org, name, color)
- `TagAssignment` table (tag, entityType, entityId)
- Tag picker on entity detail views
- Tag-based filtering in list views
- Tag-based marketing segmentation

### P0.I PR 3 — Audit Extension (if needed)

P0.A.14 already shipped audit log. This PR extends if needed:
- Audit log viewer (SUPERADMIN, in admin portal)
- CSV export
- Saved searches
- 18-month hot retention + cold storage archive

---

## P0.J — Status Page (1-2 PRs)

**Status:** Not started. Lands last in P0.

**Components on status page:**
- Web Portal (portal.kasseapp.com)
- API (api.kasseapp.com once shipped)
- Webhooks
- Mobile Apps (iOS + Android)
- AI Receptionist (Twilio + OpenAI Realtime)
- Email/SMS Delivery (Resend + Twilio)
- Payment Processing (linked from SalonTransact)

**Provider options:** BetterStack ($29/mo for 10 components, supports email subscribers, custom domain, branded). Alternative: build minimal page in Next.js as a side route.

**Recommended:** BetterStack v1 for speed; migrate to own infrastructure as part of v2 trust/scale work.

---

## PHASE 0 COMPLETION CRITERIA

- ✅ P0.A complete
- ✅ P0.B complete
- ✅ P0.C complete  
- ✅ Security hardening complete (zero advisor findings)
- ✅ P0.D complete
- ⏳ P0.G — services, scheduling, clients, formulas, devices, cart, POS, commission, inventory, HCM, geolocation, marketing
- ⏳ P0.H — observability, feature flags, i18n scaffolding
- ⏳ P0.I — custom fields, tags
- ⏳ P0.J — status page
- ⏸ P0.E + P0.F — gated until Reyna Pay engine ships

**After P0:** Phase 1 (Onboarding) starts. Foundation is locked. ~250 product PRs to v1 launch.

---

## REFERENCES

- Strategic decisions: `docs/KASSE_STRATEGIC_DECISIONS.md` v2.0
- Domain docs: `docs/KASSE_HCM.md`, `docs/KASSE_COMPLIANCE.md`, `docs/KASSE_FEATURES.md`, etc.
- Feature bible: `docs/KASSE_FEATURES.md`
- Contradictions resolved: `docs/architecture/CONVERSATION_VS_DOCS_CONTRADICTIONS.md`
