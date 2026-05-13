# PHASE 2 & 3 — PORTAL SHELL + MARKETING SITE v1

**Scope:** Portal shell + vertical-aware sidebar (P2, 40 PRs), Marketing site v1 (P3, 40 PRs).
**Total PRs:** 80
**Depends on:** P0, P1
**Parallelizable:** Yes — P2 and P3 can run in parallel after P1 is solid.

**Reference docs:** KASSE_PORTAL_ARCHITECTURE.md (sidebar architecture), KASSE_VISION.md, KASSE_TIERS.md (pricing page), KASSE_VERTICALS_EXPANDED.md (per-vertical landing pages).

---

# P2 — PORTAL SHELL + VERTICAL-AWARE SIDEBAR (40 PRs)

## P2.A — Vertical-Aware Sidebar (15 PRs)

This replaces the existing `components/layout/Sidebar.tsx` + `nav-items.ts` from PR #32/#40. Sidebar now renders from VerticalConfig.navigation. Plan-gated. Addon-gated. Role-gated. Three-layer filtering.

### P2.A.1 — `components/layout/SidebarV2.tsx`: core component
### P2.A.2 — Render from VerticalConfig.navigation
### P2.A.3 — Plan tier filter (hide if Plan < required)
### P2.A.4 — Addon filter (hide if addon not active)
### P2.A.5 — Role filter (hide if permission missing)
### P2.A.6 — Active route highlighting
### P2.A.7 — Sub-items expand/collapse
### P2.A.8 — Mobile drawer mode (<768px)
### P2.A.9 — Sidebar collapse to icon-only mode
### P2.A.10 — Keyboard navigation (arrow keys + enter)
### P2.A.11 — Replace existing Sidebar import sites
### P2.A.12 — Delete old `nav-items.ts` (cleanup)
### P2.A.13 — Snapshot tests per vertical
### P2.A.14 — Snapshot tests per role
### P2.A.15 — Sidebar version flag (rollback safety)

## P2.B — Top Bar (10 PRs)

### P2.B.1 — `components/layout/TopBar.tsx`: layout
### P2.B.2 — Global search bar (cmd+K opens modal)
### P2.B.3 — Notification bell + badge count
### P2.B.4 — Location switcher (multi-location orgs)
### P2.B.5 — User menu (profile, settings, logout)
### P2.B.6 — Help menu (docs, restart tour, contact support)
### P2.B.7 — Org switcher (for users in multiple orgs)
### P2.B.8 — Plan tier badge ("Pro Plan")
### P2.B.9 — Trial countdown (if trialEndsAt set)
### P2.B.10 — Responsive: mobile collapses to hamburger

## P2.C — Global Search (8 PRs)

### P2.C.1 — `components/search/CommandPalette.tsx`: cmd+K modal
### P2.C.2 — Search across Clients, Appointments, Staff, Transactions, Services
### P2.C.3 — Recent searches (per user, localStorage)
### P2.C.4 — Keyboard-only navigation (arrows + enter)
### P2.C.5 — Result grouping by entity type
### P2.C.6 — Server endpoint: `/api/search` (org-scoped)
### P2.C.7 — Postgres full-text search index
### P2.C.8 — Search analytics (which queries return nothing → product opportunities)

## P2.D — Notification Center (7 PRs)

### P2.D.1 — `components/notifications/NotificationCenter.tsx`: dropdown panel
### P2.D.2 — Mark as read (single + all)
### P2.D.3 — Notification categories (booking, payment, system, marketing)
### P2.D.4 — Push notification opt-in (Web Push API)
### P2.D.5 — Email digest preferences
### P2.D.6 — Browser push delivery
### P2.D.7 — Notification API endpoints (list, mark-read, preferences)

---

# P3 — MARKETING SITE v1 (40 PRs)

The public marketing site at kasseapp.com. Separate route tree `app/(marketing)/*`. Public. SEO-optimized. Different layout (no portal sidebar).

## P3.A — Marketing Layout + Foundation (8 PRs)

### P3.A.1 — `app/(marketing)/layout.tsx`: dedicated layout
### P3.A.2 — Marketing header (logo, nav, login/signup CTAs)
### P3.A.3 — Marketing footer (links, social, legal)
### P3.A.4 — Mobile-responsive navigation
### P3.A.5 — Theme provider for marketing site
### P3.A.6 — Cookie consent banner
### P3.A.7 — Privacy policy compliance (GDPR-ready though US-first)
### P3.A.8 — Marketing site sitemap.xml + robots.txt

## P3.B — Home Page + Value Props (5 PRs)

### P3.B.1 — Hero section (headline, sub-headline, CTA, hero image/video)
### P3.B.2 — "How it works" 3-step section
### P3.B.3 — Featured verticals carousel (with vertical landing page links)
### P3.B.4 — Customer logos + social proof
### P3.B.5 — Signup CTA bottom section

## P3.C — Pricing Page (5 PRs)

### P3.C.1 — `app/(marketing)/pricing/page.tsx`: 5-tier comparison
### P3.C.2 — Monthly/Annual toggle (save 15% on annual)
### P3.C.3 — Feature comparison matrix (per KASSE_TIERS.md)
### P3.C.4 — Addon catalog (40+ addons grouped by category)
### P3.C.5 — FAQ section

## P3.D — Per-Vertical Landing Pages (12 PRs)

Each page: `app/(marketing)/for/{vertical}/page.tsx`. Hero specific to vertical, day-in-the-life snippet from KASSE_VERTICALS_EXPANDED.md, vertical-specific killer features, vertical-specific pricing recommendation, testimonials, CTA.

### P3.D.1 — Salon landing page
### P3.D.2 — Barbershop landing page
### P3.D.3 — Nail salon landing page
### P3.D.4 — Restaurant landing page
### P3.D.5 — Gym landing page
### P3.D.6 — Med spa landing page
### P3.D.7 — Massage landing page
### P3.D.8 — Yoga landing page
### P3.D.9 — Auto detailing landing page
### P3.D.10 — Pet grooming landing page
### P3.D.11 — Tattoo landing page
### P3.D.12 — Retail landing page

## P3.E — Compare Pages v1 (3 PRs)

### P3.E.1 — Kasse vs Square (`/compare/square`)
### P3.E.2 — Kasse vs Vagaro (`/compare/vagaro`)
### P3.E.3 — Compare table component (reusable)

## P3.F — Legal Pages (4 PRs)

### P3.F.1 — Privacy Policy (`/privacy`)
### P3.F.2 — Terms of Service (`/terms`)
### P3.F.3 — Data Processing Agreement (`/dpa`)
### P3.F.4 — Cookie Policy (`/cookies`)

## P3.G — Blog Scaffold (3 PRs)

### P3.G.1 — Blog index + post template (MDX-driven)
### P3.G.2 — Blog SEO metadata + Open Graph
### P3.G.3 — Newsletter signup form (Resend audience)

---

## PHASE 2 & 3 COMPLETION CRITERIA

- All 80 PRs merged
- Sidebar tested across 5+ verticals × 4+ roles
- Marketing site live at kasseapp.com root
- 12 vertical landing pages indexed by Google
- KASSE_REAL_BUILD_ORDER.md updated

**After P2/P3:** P4 (POS, gated on Reyna Pay) or P6 (Owner Portal Core) can begin.
