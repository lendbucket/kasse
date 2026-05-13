# KASSE SIDEBAR GAP AUDIT
## Current code vs locked KASSE_PORTAL_ARCHITECTURE.md spec

**Version:** 1.0
**Status:** LIVING (audit refreshed as gaps are closed)
**Owner:** Robert Reyna, CEO Reyna Tech LLC
**Read in conjunction with:** KASSE_PORTAL_ARCHITECTURE.md (the locked IA spec)

---

## WHY THIS DOC EXISTS

PR #32 (Phase 0.7-a) brought components/layout/Sidebar.tsx visual styling into compliance with the locked design system in KASSE_UI_PRINCIPLES.md. That PR fixed colors only — it did not change nav structure.

However, the locked sidebar IA in KASSE_PORTAL_ARCHITECTURE.md is substantially more comprehensive than what's currently in nav-items.ts. The current code ships approximately 12 nav items across 6 sections; the locked spec defines 25+ nav items across 7 sections, with role-based visibility, vertical-conditional sections, notification badging, location switching, and franchise/payroll/banking features that don't exist in code at all.

This document enumerates every gap, assigns each a priority, estimates implementation scope, and provides the gap-closure roadmap. Each gap is a candidate for a future PR (Phase 0.8-c onward).

This document is LIVING. As gaps are closed, the corresponding rows are updated from PENDING to COMPLETE with a PR reference.

---

## METHODOLOGY

This audit is grounded in three sources of truth:
- The CURRENT CODE: components/layout/Sidebar.tsx, components/layout/BottomNav.tsx, components/layout/nav-items.ts as of the merge of PR #34 (Phase 0.8-a — KASSE_ENGINE_BOUNDARY.md). The specific commit hash at the time of this audit is not pinned to avoid staleness; any future refresh of this audit should re-baseline against the then-current main branch and update this line.
- The LOCKED SPEC: docs/KASSE_PORTAL_ARCHITECTURE.md "SIDEBAR NAVIGATION — FULL STRUCTURE" section + the entire "PAGE-BY-PAGE SPECIFICATION" section
- The CROSS-CUTTING SPECS: docs/KASSE_PORTALS.md (VerticalConfig system), docs/KASSE_FRANCHISE_SYSTEM.md (franchise nav), docs/KASSE_TIERS.md (plan gating)

Where the locked spec contradicts another doc, the locked spec wins. Where the locked spec is silent on something the cross-cutting docs cover, the cross-cutting doc governs.

---

## GAP CATEGORY 1 — MISSING NAV SECTIONS

The locked spec defines 7 nav sections. The current code implements 6 sections with 15 nav items (12 items in nav-items.ts + superadmin "Admin Portal" hardcoded in Sidebar.tsx + "Take payment" CTA + utility buttons). The locked spec defines ~25 nav items across 7 sections.

| Section | Items per spec | Current status | Priority | Implementation scope |
|---------|---------------|----------------|----------|---------------------|
| OVERVIEW | Home, Reports | PRESENT — both items exist in nav-items.ts (Home → /dashboard, Reports → /dashboard/reports) | — | — |
| OPERATIONS | Payments & Invoices, Appointments, Clients, Waitlist (conditional), Messages | PRESENT — all 5 items exist in nav-items.ts. Waitlist is unconditionally visible (spec says conditional on vertical config). "Payments & invoices" label matches spec. | P2 (waitlist conditionality) | XS (add vertical-conditional hide for Waitlist) |
| TEAM | Staff, Payroll (owner only), Time & Attendance | PARTIAL — Staff exists. "Services & items" is in this section but belongs in OPERATIONS per spec. Payroll and Time & Attendance are MISSING. | P0 (Payroll), P1 (Time & Attendance) | M (Payroll requires schema + route + role gate; Time & Attendance requires clock-event UI) |
| GROWTH | Marketing, Reputation, Gift Cards & Loyalty | PARTIAL — Marketing and Reputation exist. Gift Cards & Loyalty is MISSING. | P1 | S (nav item + stub route page; GiftCard/Loyalty models exist in schema) |
| FINANCIAL (owner only) | Banking, Bill Pay, Profit & Loss | MISSING — entire section absent from nav-items.ts | P0 | M (3 nav items + route shells + owner-only role gate — this is the first section that requires role-based visibility, so it bootstraps the mechanism for all other role-gated items) |
| TOOLS | AI Receptionist, Forms & Waivers (conditional), Color Studio (salon/nail only), Incubator (if enrolled) | PARTIAL — AI Receptionist exists. Forms & Waivers, Color Studio, and Incubator are MISSING. | P2 (Forms/Color Studio), P3 (Incubator) | S per item (each is a nav item + stub route + vertical/enrollment conditional) |
| SETTINGS | Settings | PRESENT — exists in nav-items.ts | — | — |

**Additional finding — misplaced item:** "Services & items" is currently in the TEAM section in nav-items.ts. Per the locked spec, there is no "Services & items" nav item in the sidebar at all — services are accessed via Settings or via the POS flow. However, the current build status in docs/README.md lists "Services (UI complete)" as a dashboard page at /dashboard/services, so the nav item has operational value today. Recommendation: keep it in TEAM for now (it's adjacent to Staff which manages service assignments), flag for relocation or removal when the full spec is implemented.

Priority key:
- P0 — blocking merchant onboarding (cannot ship merchant #1 without this)
- P1 — required for pre-launch demos / investor conversations / reseller pitches
- P2 — required before opening to a second merchant or a different vertical
- P3 — polish / nice-to-have / can wait for Phase 2+

Implementation scope key:
- XS (~1 PR, <2 hours): adding a single nav item with stub route page
- S (~1 PR, half-day): adding a section with 2-3 nav items, basic page shells
- M (~2-3 PRs, 1-2 days): full section with role gating, route handlers, basic UI
- L (~5+ PRs, 1+ week): complex section requiring schema additions, integrations, data flow

---

## GAP CATEGORY 2 — MISSING ROLE-BASED VISIBILITY

The locked spec defines role-based visibility rules:
- Payroll, Financial section: Owner only
- Time & Attendance: hidden for booth rent staff
- Color Studio: salon/nail verticals only
- Forms & Waivers: only if vertical has intake forms enabled
- Incubator: only if org is enrolled in a cohort
- Each item has a role-permission check that hides it for users without permission

**Current code audit of Sidebar.tsx:**
- Does Sidebar.tsx receive the user's role? **YES** — via `SidebarProps.user.role` (string, optional). Currently only used for `user.role === "superadmin"` check to show Admin Portal link (line 125).
- Does it filter nav items by role? **NO** — `NAV_SECTIONS` is rendered unconditionally. No owner/manager/staff filtering exists.
- Does it filter by vertical? **NO** — no verticalId, businessType, or VerticalConfig is referenced anywhere in Sidebar.tsx or nav-items.ts.
- Does it filter by plan tier? **NO** — no plan/tier check exists.
- Does it filter by addon/feature flag? **NO** — no feature flag checks exist.

| Visibility rule | Spec requirement | Current code support | Gap | Priority |
|-----------------|-------------------|---------------------|-----|----------|
| Owner-only items | Hide Payroll/Banking/Bill Pay/P&L from Manager and Staff | No filtering — `user.role` exists as prop but only checked for superadmin | Full gap: need role-based nav filtering. The `user.role` prop exists, so the plumbing is partially there — need to extend NavItem type with a `roles` array and filter in the render loop. | P0 |
| Vertical conditional | Show Color Studio for salon/nail only; show Forms & Waivers for verticals with intake forms; show Waitlist conditionally | No vertical awareness anywhere in sidebar code | Full gap: need organizationId → vertical lookup, then filter nav items by vertical feature flags. Depends on VerticalConfig infrastructure (Phase 4) or a simpler interim check on Organization.businessType. | P2 |
| Plan-tier gating | Hide Pro+ features from Starter plans per KASSE_TIERS.md (e.g., AI Receptionist is Pro+, Marketing automations are Growth+) | No plan check exists | Full gap: need plan tier on the session/context, then gate nav items. KASSE_TIERS.md defines which features are in which tier but there is no tier enforcement in the codebase yet. | P2 |
| Addon gating | Show "upgrade" indicator on addon-required items (e.g., lock icon or "Pro" badge next to nav label) | No addon awareness | Full gap: no addon/upsell mechanism in nav. This is a Growth-tier monetization concern, not a P0. | P3 |
| Enrollment-based | Show Incubator only if org is enrolled in a cohort | No enrollment check | Full gap: Incubator page exists in spec only. Need enrollment model + nav conditional. | P3 |
| Employment-type gating | Hide Time & Attendance for booth rent staff (independent contractors) | No employment-type check | Full gap: need staff employment type on session context. Booth rent vs W-2 distinction does not yet exist in schema (PermissionSet model exists but no employment-type field). | P2 |

---

## GAP CATEGORY 3 — MISSING VERTICAL-AWARENESS (VerticalConfig)

Per KASSE_PORTALS.md, the sidebar must render from a VerticalConfig that contains:
- terminology overrides (e.g., "Stylists" → "Bartenders" for bar vertical)
- navigation array per vertical (different items appear)
- feature flags per vertical (formulas: true for salon, false for restaurant)
- default view (calendar vs floor vs queue)

**Current code audit:**
- Does Sidebar.tsx read a VerticalConfig anywhere? **NO** — no VerticalConfig import, no vertical context, no config-driven rendering.
- Are nav labels hardcoded or driven by config? **HARDCODED** — all labels in nav-items.ts are string literals ("Staff", "Clients", "Appointments", etc.).
- Does the nav array come from a vertical-specific source? **NO** — `NAV_SECTIONS` is a single static array exported from nav-items.ts, identical for all verticals.

| VerticalConfig dependency | Spec requirement | Current code support | Gap | Priority |
|---------------------------|-------------------|---------------------|-----|----------|
| Terminology overrides | "Stylists" → "Bartenders" etc. via config.terminology | No support — all labels hardcoded in nav-items.ts | Full gap: need VerticalConfig lookup + dynamic label rendering. This is Phase 4 work per KASSE_PORTALS.md. For the salon-first launch, hardcoded labels are acceptable since the first vertical IS salon. | P2 |
| Per-vertical nav array | Different sidebar for salon vs restaurant vs gym | No support — single static NAV_SECTIONS array | Full gap: need config.navigation to drive sidebar items. Same Phase 4 dependency. Acceptable for salon-first launch. | P2 |
| Default view | Calendar vs floor vs queue based on vertical | No support — no default view concept in sidebar | Full gap: sidebar doesn't control default view today. This is a dashboard-level concern more than a sidebar concern. | P3 |
| Vertical icon in header | Per-vertical accent icon in sidebar header | No support — sidebar header shows "kasse." wordmark only, no vertical icon | Full gap: minor visual addition. Low priority. | P3 |

---

## GAP CATEGORY 4 — MISSING INFRASTRUCTURE (location switcher, notifications, badges)

The locked spec defines additional sidebar infrastructure beyond just nav items.

| Infrastructure element | Spec requirement | Current code support | Gap | Priority |
|------------------------|-------------------|---------------------|-----|----------|
| Location switcher | Dropdown at top for multi-location merchants. Spec shows "All Locations ▾" next to wordmark. | MISSING — no location switcher anywhere in Sidebar.tsx. The Organization model supports multiple Locations (schema has Location table with organizationId FK), but there is no UI for switching between them. | Need: location dropdown component + context for selected location + filtering all queries by locationId. Multi-location is a Phase 1+ concern but the UI hook should exist early. | P1 |
| Notification badge counts | Numeric or alert badges on nav items (unread messages, pending appointments). Spec "Notification center" section: "Bell icon in topbar with unread count badge." | PARTIAL — Bell icon exists in bottom utility row (line 169) but has no count badge and no notification dropdown. No badge counts on individual nav items (Messages, Appointments). | Need: unread count query for Messages + pending count for Appointments + badge rendering on nav items. Bell icon needs notification dropdown panel. | P1 |
| Powered by SalonTransact footer | Non-removable footer label per SD-K-010 (KASSE_STRATEGIC_DECISIONS.md). Per KASSE_ENGINE_BOUNDARY.md, required on all payment-adjacent screens. | MISSING — no "Powered by SalonTransact" text anywhere in Sidebar.tsx. The sidebar is visible on all dashboard pages including payment-adjacent ones (POS, Banking when added). | P0 — contractually required on every payment-adjacent screen per SD-K-010 (KASSE_STRATEGIC_DECISIONS.md) and reaffirmed in KASSE_ENGINE_BOUNDARY.md. The sidebar is rendered on every dashboard page including payment-adjacent ones (POS, Banking when added, Payments & Invoices). Merchant #1 cannot be onboarded without this label present. Implementation scope is XS (single component addition to the bottom of Sidebar.tsx) so there is no engineering cost to front-loading it. | P0 |
| Sidebar collapse/expand | Icons-only mode for narrow viewports. Standard SaaS pattern — sidebar collapses to ~56px width showing only icons. | MISSING — sidebar is fixed 220px width with no collapse mechanism. On mobile, sidebar is hidden entirely and BottomNav.tsx takes over. No intermediate "icons-only" state for tablet-sized viewports. | Need: collapse state + toggle button + icon-only rendering mode. Nice-to-have. | P3 |
| Current user identification | Bottom-of-sidebar avatar + role dropdown. Spec "Profile avatar" section: "Owner avatar in topbar → dropdown: My Profile, Settings, Sign Out." | PARTIAL — Sign Out button exists in bottom utility row. No avatar, no user name display, no role indicator, no dropdown menu. The `user` prop has name/email/image but they are not rendered. | Need: avatar component + name display + role badge + dropdown with profile/settings/sign-out. | P2 |
| Search input | Top-of-sidebar search field anchor. Spec "Search (global)": "cmd+K / ctrl+K opens search from anywhere." | PRESENT — search input exists at top of sidebar (lines 76-88). However, it is a static `<input>` with no functionality — no cmd+K binding, no search logic, no results dropdown. The input is visual-only. | Need: wire search input to global search. cmd+K shortcut. Results panel. This is a substantial feature (M scope) beyond just the sidebar. | P2 |
| Take payment CTA | Bottom CTA opening POS. | PRESENT — "Take payment" button exists linking to /dashboard/pos (lines 156-164). Styled with brand color, CreditCard icon. Matches spec intent. | — | — |

Authority note: The "Powered by SalonTransact" footer is authoritatively required by SD-K-010 (the strategic decision lock in KASSE_STRATEGIC_DECISIONS.md) AND by KASSE_ENGINE_BOUNDARY.md (the implementation contract that carries the requirement forward to all payment-adjacent screens). Both are authoritative; they do not contradict. SD-K-010 establishes WHY the label exists (reseller contract obligation, non-removable). KASSE_ENGINE_BOUNDARY.md establishes WHERE the label must appear (every payment-adjacent screen, including the sidebar visible across all dashboard pages).

---

## GAP CATEGORY 5 — MISSING ENTIRE FEATURE AREAS

The current sidebar is missing entire areas of the platform that have their own docs and locked specs.

| Feature area | Spec doc | Current code status | Priority | Implementation scope |
|--------------|----------|---------------------|----------|---------------------|
| Franchise management | KASSE_FRANCHISE_SYSTEM.md | MISSING — no franchise nav items, no franchise routes, no franchise schema beyond the basic Organization/Location hierarchy. The franchise system is Phase 7 per KASSE_FRANCHISE_SYSTEM.md. | P3 (Phase 7) | L (8+ features: dashboard, locations, fee config, fee collection, royalty reports, brand standards, franchise creator, territory mapping. Major schema additions required.) |
| Incubator | KASSE_PORTAL_ARCHITECTURE.md "PAGE: INCUBATOR" | MISSING — no incubator nav item, no /incubator route, no cohort/enrollment schema. Spec defines a full page with modules, progress tracking, cohort members, graduation requirements. | P3 | M (nav item + route + cohort schema + module content system) |
| Marketplace management | KASSE_MARKETPLACE.md | MISSING — no marketplace nav items, no marketplace routes. The marketplace (kassestylists.com) is a separate product surface per the doc. Sidebar link would be a cross-product navigation to an external URL. | P3 | XS (external link in sidebar) to L (full embedded marketplace management) |
| Command Center (admin) | KASSE_ARCHITECTURE.md "Command Center" | PARTIAL — superadmin "Admin Portal" link exists in Sidebar.tsx (lines 125-148), gated on `user.role === "superadmin"`. Routes exist at /admin/*. This IS the command center, just named differently. The naming gap is cosmetic. | — (functional parity exists) | XS (rename label if needed) |
| Developer Portal | EMPIRE_ARCHITECTURE.md "Developer tier" | MISSING — no developer portal nav items, no API key management UI, no webhook configuration UI. The ApiKey and Webhook models exist in the Prisma schema, but no UI surfaces them. Developer Portal is a Phase 8+ concern per the roadmap. | P3 | L (API key management, webhook config, API docs viewer, usage dashboard) |
| SalonBacked cross-link | SALONBACKED.md | MISSING — no cross-product navigation to SalonBacked (HCM/payroll/benefits platform). SalonBacked is a separate entity (Reyna Insure LLC) and a separate product. Cross-link would be an external navigation item visible to orgs that have SalonBacked enabled. | P3 | XS (conditional external link) |

---

## GAP CATEGORY 6 — MOBILE PARITY

The locked spec has a "Mobile bottom navigation (5 tabs)" subsection in KASSE_PORTAL_ARCHITECTURE.md MICRO-COMPONENTS section. BottomNav.tsx exists in the current code.

**Current code audit of BottomNav.tsx + nav-items.ts BOTTOM_NAV_ITEMS:**

Current 5 tabs: Home (/dashboard), POS (/dashboard/pos), Appointments (/dashboard/appointments), Clients (/dashboard/clients), More (/dashboard/settings).

Spec 5 tabs: Home, Appointments, Clients, POS/Checkout, More.

| Mobile element | Spec requirement | Current code support | Gap | Priority |
|----------------|-------------------|---------------------|-----|----------|
| 5 primary tabs | Home, Appointments, Clients, POS/Checkout, More | PRESENT — all 5 exist. Tab order differs from spec (code: Home, POS, Appointments, Clients, More; spec: Home, Appointments, Clients, POS/Checkout, More). Tab order is a minor UX concern. | Minor: reorder tabs to match spec (Appointments and Clients before POS). | P1 |
| "More" drawer | Opens full menu of remaining nav items | MISSING — "More" tab links to /dashboard/settings (a direct page navigation), not a drawer/menu. This means mobile users cannot access Marketing, Reputation, AI Receptionist, Messages, Waitlist, Staff, Services, or Reports from the bottom nav. | Full gap: need a drawer/sheet component that opens on "More" tap, showing the rest of NAV_SECTIONS items. | P1 |
| Active tab styling | Brand teal icon + label. Spec says teal (#4297A0). | PRESENT — active tab uses #606E74 (Kasse brand slate teal per KASSE_UI_PRINCIPLES.md locked spec). The spec's #4297A0 color predates the locked design system. Current code is correct per the locked UI spec. | No gap — current code follows the locked UI spec which supersedes the portal architecture doc's color. | — |
| Tab badges | Unread messages, pending appointments shown as badges on tabs | MISSING — no badge rendering on any bottom nav tab. | Full gap: need badge count component on relevant tabs (same data source as desktop sidebar badges from Category 4). | P1 |
| Safe-area-inset support | iOS notch handling (bottom safe area for home indicator) | PRESENT — BottomNav.tsx uses `paddingBottom: "env(safe-area-inset-bottom)"` (line 14). Correct implementation. | No gap. | — |

---

## GAP CLOSURE ROADMAP

Based on the priority ratings above, propose a sequenced roadmap. Each row in the roadmap below is a candidate PR.

Each PR in the roadmap should be:
- Small enough to ship in 1-3 commits
- Independently mergeable (no cross-dependencies on other roadmap PRs except where noted)
- Verifiable via smoke tests + visual check

---

STANDING REMINDER FOR ALL IMPLEMENTATION PRs IN THIS ROADMAP

Most rows in this roadmap will create new route shells in `app/dashboard/*` and corresponding API routes in `app/api/*`. Per the tenant-scoping policy documented in docs/RLS_AUDIT.md, every new route added to `app/api/*` MUST be classified in RLS_AUDIT.md (as TENANT_SCOPED, BYPASS_NEEDED, or PRE_SESSION) in the same PR that creates the route. Reviewer will flag any PR that adds an API route without updating RLS_AUDIT.md.

This standing reminder is in effect for every PR in this roadmap. Implementing engineers should not need to be reminded individually per PR — the reminder is here as the canonical reference.

---

Roadmap (proposed sequencing):

| PR # | Phase ID | What | Depends on | Priority | Estimate |
|------|----------|------|------------|----------|----------|
| 1 | 0.8-c | Add "Powered by SalonTransact" footer to sidebar per SD-K-010 + KASSE_ENGINE_BOUNDARY.md | none | P0 | XS |
| 2 | 0.8-d | Add FINANCIAL section (Banking, Bill Pay, P&L) — owner-only with empty-state route shells. This PR bootstraps the role-based nav filtering mechanism (extend NavItem with `roles` array, filter in Sidebar.tsx render loop). | none | P0 | M |
| 3 | 0.8-e | Add Payroll + Time & Attendance to TEAM section — owner-only with empty-state route shells | 0.8-d (role-gating mechanism) | P0 | M |
| 4 | 0.8-f | Add notification badge counts to existing nav items (unread messages count from Message table) | none | P1 | S |
| 5 | 0.8-g | Add location switcher dropdown for multi-location merchants | none | P1 | S |
| 6 | 0.8-h | Add Gift Cards & Loyalty nav item to GROWTH section with empty-state route | none | P1 | XS |
| 7 | 0.8-i | Mobile BottomNav: reorder tabs to match spec + implement "More" drawer with full nav | none | P1 | S |
| 8 | 0.8-j | Mobile BottomNav: add badge counts to tabs (unread messages, pending appointments) | 0.8-f (badge count data source) | P1 | XS |
| 9 | 0.8-k | Add Color Studio nav item (salon/nail conditional) with empty-state route | requires vertical-conditional mechanism (can use simple Organization.businessType check as interim) | P2 | S |
| 10 | 0.8-l | Add Forms & Waivers nav item (vertical-conditional) with empty-state route | requires vertical-conditional mechanism | P2 | S |
| 11 | 0.8-m | Add user avatar + name + role display to sidebar bottom area | none | P2 | S |
| 12 | 0.8-n | Wire search input to global search with cmd+K shortcut | none | P2 | M |
| 13 | 0.8-o | Migrate hardcoded nav-items.ts to VerticalConfig-driven rendering (start of Phase 4 work) | depends on Phase 4 schema work | P2 | L |
| 14 | 0.8-p | Add Incubator nav item (enrollment-conditional) with empty-state route | requires enrollment-check mechanism | P3 | S |
| 15 | 0.8-q | Add sidebar collapse/expand state for narrow viewports | none | P3 | S |
| 16 | 0.8-r | Add Franchise section (entire feature area — likely multiple sub-PRs) | major schema additions per KASSE_FRANCHISE_SYSTEM.md | P3 (Phase 7) | L |

This roadmap is a RECOMMENDATION, not a commitment. Robert may re-order based on actual business priorities.

---

## WHAT THIS DOC IS NOT

- This doc is NOT a re-design of the sidebar IA. The IA is locked in KASSE_PORTAL_ARCHITECTURE.md. This doc only catalogs the gap between that spec and the code.
- This doc is NOT an implementation plan with code or schema. Each row in the roadmap will spawn its own implementation PR with its own scope.
- This doc is NOT a freeze on sidebar changes. Future PRs to Sidebar.tsx are still possible as long as they reference both this gap audit and the locked IA spec.

---

## MAINTENANCE

When a gap is closed:
1. Update the row in the relevant table from PENDING to "Closed by PR #N (YYYY-MM-DD)"
2. Move the corresponding roadmap row to a "Completed" subsection at the bottom of the doc

Refresh this audit fully every 3 months OR whenever a substantial sidebar refactor lands (whichever is sooner).
