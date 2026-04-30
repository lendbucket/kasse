# COMMAND CENTER
## Universal Master Admin Portal Specification

**Version:** 1.0 | **Owner:** Robert Reyna, CEO — Reyna Tech LLC
**Status:** LOCKED SPEC — Use this prompt for every product's admin build

---

## WHAT THIS IS

Every software product in the Reyna Tech empire (Kasse, SalonBacked, Reyna Pay, RunMySalon) gets its own Command Center — a superadmin portal that Robert uses to manage every aspect of that product.

**Key principles:**
- Every Command Center has identical structure, navigation, and layout
- Only the data and product-specific sections differ
- Design system inherits from the product it belongs to (no separate color spec here)
- Dark theme is used for the command center to signal "you are in the control room"
- Desktop only — no mobile layout needed
- Accessible only to users with role === "superadmin"

---

## THE EMPIRE ARCHITECTURE CONTEXT

```
REYNA PAY (payment rails)
    +
KASSE (booking + POS + CRM + AI)  ← the foundation
    +
SALONBACKED (HCM + tax + insurance + payroll)
    =
RUNMYSALON (distribution layer — packages all three for any vertical)
```

Each product has its own Command Center at admin.[domain]:
- admin.kasseapp.com → Kasse Command Center
- admin.salonbacked.com → SalonBacked Command Center
- admin.salontransact.com → Reyna Pay Command Center
- admin.runmysalon.com → RunMySalon Command Center

---

## UNIVERSAL SIDEBAR NAVIGATION

Identical across ALL products. Same order. Same icons. Same labels.

```
[COMMAND CENTER]
[Product Name]

OVERVIEW
  1. Overview          (LayoutDashboard)

MERCHANTS
  2. Merchants         (Building2)
  3. Users             (Users)

MONEY
  4. Revenue           (DollarSign)

ENGINEERING
  5. Operations        (Terminal)
  6. AI Console        (Bot)

PEOPLE
  7. Communications    (MessageSquare)

SYSTEM
  8. Platform Config   (Settings2)
  9. Analytics         (BarChart2)
  10. Alerts           (Bell)
  11. Security         (Shield)

[PRODUCT-SPECIFIC SECTIONS]
  12+ (product-specific nav items below the universal ones)
```

Nav item styles:
- Height: 38px
- Display: flex, align-items center, gap 10px
- Font: 14px, weight 500
- Icons: lucide-react, 18px, strokeWidth 1.5
- Active: product accent color + accent light background + 2px left border
- Inactive: muted text, transparent background
- Hover: subtle background tint, brighter text

Section labels:
- 10px, uppercase, letter-spacing 0.1em, muted color
- Padding: 12px 20px 4px

---

## SECTION 1 — OVERVIEW (War Room Dashboard)

**Route:** `app/admin/page.tsx`

**TOP KPI ROW (4 cards):**
- Total MRR (sum of all active subscriptions)
- Active Merchants (count of orgs with active plan)
- GPV This Month (total payment volume — product-specific)
- Platform Health (% uptime across all services)

Each KPI card uses the product's established card design system with:
- Label: 11px uppercase letter-spacing 0.08em muted color
- Value: 32px font-weight 700 primary text color tabular-nums
- Trend badge below (green up or red down vs last period)

**LIVE ACTIVITY FEED (right side panel, 320px):**
- Real-time stream of platform events
- Each event: colored dot + description + time ago
- Color codes: success=payment/signup, warning=alert, error=error, accent=AI action
- Auto-scrolling, newest at top
- Pause button

**REVENUE CHART (main content area):**
- Daily revenue for last 30 days
- Stacked by revenue type (subscriptions, processing, API fees, etc.)
- Toggle: 7D / 30D / 90D / 1Y
- CSS bar chart (no external chart library required)

**PLATFORM STATUS GRID:**
- One row per deployed product/service
- Columns: Name | Status (● Live / ● Degraded / ● Down) | Uptime % | Last Deploy | Action
- Action buttons: [Redeploy] [View Logs] [Rollback]
- Calls Vercel API to get real deployment status

---

## SECTION 2 — MERCHANTS (Master CRM)

**Routes:**
- `app/admin/merchants/page.tsx` — merchant list
- `app/admin/merchants/[orgId]/page.tsx` — merchant detail

**MERCHANT LIST TABLE:**

Columns: Business Name | Product | Plan | MRR | GPV/mo | Health Score | Status | Actions

Health Score (0-100 AI-calculated from usage + payments + engagement + growth):
- 80-100: ●●●●● (success color)
- 60-79:  ●●●●○ (accent color)
- 40-59:  ●●●○○ (warning color)
- 20-39:  ●●○○○ (orange)
- 0-19:   ●○○○○ (error color)

Actions per row: [View] [Impersonate] [Message]

Search and filters:
- Search by name, email, domain
- Filter: Product | Plan | Status | Health | Location | Date joined

Bulk actions:
- Select multiple → Send announcement | Export | Apply credit | Change plan

**MERCHANT DETAIL PAGE (`/admin/merchants/[orgId]`):**

Tabs: Overview | Revenue | Usage | Support | Activity | Settings

Overview tab:
- Business info (editable inline — click field to edit, save on blur)
- Owner contact info
- Plan + billing status
- Health score breakdown
- AI-generated risk flags ("This merchant hasn't logged in for 14 days")
- Quick stats: total revenue, total transactions, total clients, member since

Revenue tab:
- All subscription payments (invoice history)
- All processing revenue
- MRR trend chart
- Lifetime value calculation

Usage tab:
- Feature adoption (which features they use + frequency)
- Last active timestamp per feature
- Pages visited most
- Features never touched (opportunity to educate)

Support tab:
- All support tickets (open + closed)
- Message thread with merchant
- Internal notes (superadmin-only — never visible to merchant)

Activity tab:
- Full audit log of everything in their portal
- Login events (who, when, from where)
- Every significant action

Settings tab (admin overrides):
- Change plan (reason required, logged)
- Apply credit (reason required, logged)
- Reset password
- Enable/disable specific features for this merchant only
- Suspend account (requires confirmation + reason)
- Delete account (requires typing business name + auto-triggers data export)

**ACTION BUTTONS ON DETAIL PAGE:**
- [Impersonate] — logs you in as their account. Banner shows "Impersonating [Name] — Click to exit"
- [Send Direct Message] — message appears in their portal notifications
- [Export All Data] — triggers full data export ZIP download
- [Generate Invoice] — create manual invoice
- [View in Vercel] — opens their deployment in Vercel dashboard

---

## SECTION 3 — USERS

**Route:** `app/admin/users/page.tsx`

All individual users across all orgs.

Table columns: Name | Email | Role | Organization | Plan | Last Login | Status | Actions

Filters: Role | Organization | Plan | Active/Inactive | Date registered

User detail (modal or slide-over):
- Profile info
- Organizations they belong to
- Login history (IP, device, location, timestamp)
- Reset password button
- Force logout all sessions button
- Disable/enable account toggle
- Change role dropdown

---

## SECTION 4 — REVENUE

**Route:** `app/admin/revenue/page.tsx`

**MRR DASHBOARD:**
```
Total MRR breakdown:
  Subscription Revenue    $XX,XXX/mo
    ├── [Product A]         $XX,XXX
    ├── [Product B]         $XX,XXX
    └── [Product C]         $XX,XXX

  Processing Revenue      $XX,XXX/mo
  API Revenue             $X,XXX/mo
  Other                   $X,XXX/mo
  ─────────────────────────────────
  TOTAL MRR               $XX,XXX/mo
```

MRR waterfall: New MRR + Expansion MRR - Contraction MRR - Churned MRR = Net New MRR

**TRANSACTION MONITOR:**
- Every payment processed across all merchants
- Real-time feed
- Filters: merchant, date range, amount, status, payment method
- Click transaction → full detail
- Manual refund button (reason required, logged)
- Flag as suspicious button

**BILLING MANAGEMENT:**
- All active subscriptions with status
- Failed payments (with retry button + failure reason)
- Upcoming renewals (next 7 days)
- Invoice list (all invoices, all merchants, downloadable)

---

## SECTION 5 — OPERATIONS (Engineering Console)

**Route:** `app/admin/operations/page.tsx`

**DEPLOYMENT DASHBOARD:**
One row per GitHub repo.
Columns: Repo | Branch | Last Commit Message | Last Deploy Time | Status | Actions

Actions:
- [Redeploy] → calls Vercel API to trigger redeployment
- [Rollback] → shows list of last 10 deployments, select to rollback
- [View Logs] → opens deployment logs inline
- [View Errors] → shows recent runtime errors

Status indicators: ● Building (warning) | ● Live (success) | ● Failed (error)

**GITHUB INTEGRATION:**
- Latest 10 commits per repo (message, author, time ago)
- Open pull requests with [Merge] button
- Failed CI checks with error details

**AI DEV CONSOLE:**

An embedded terminal that lets you control your codebase via natural language from anywhere in the world.

UI:
- Full-width terminal panel
- Repository selector dropdown
- Plain English instruction input
- Streaming output (real-time character by character)
- Copy output button
- Command history

How it works:
- POST /api/admin/ai-console with { repo, instruction }
- Server validates superadmin session
- Server calls Anthropic API (claude-sonnet-4-20250514) with instruction + repo context
- Streams response back via Server-Sent Events
- Code changes → automatic GitHub commit + Vercel deploy
- ALL actions logged to AuditLog with action="ai_console_command"

Example instructions it handles:
- "Fix the bug where [describe bug]"
- "Add [feature] to the [page] page"
- "Show me all the API routes"
- "What's the current database schema?"
- "Why is the dashboard showing wrong numbers?"
- "Deploy to production"
- "Roll back to 3 commits ago"
- "Show me all merchants with failed payments in the last 7 days"

CRITICAL: Every command, every file changed, every commit — full immutable audit trail.

**ERROR MONITORING:**
- All Vercel runtime errors across all deployments
- Grouped by error message + frequency
- Click error → full stack trace + file + line number
- [Fix with AI] button → sends error to AI Console with context
- [Mark as Known] button → suppresses repeated alerts for same error
- Error trend chart

**DATABASE CONSOLE:**
- Select which database to query
- Run read-only queries (SELECT only — no DELETE or DROP)
- View table contents with pagination
- Export results as CSV
- All queries logged

**SYSTEM HEALTH:**
- API response times (p50, p95, p99 by endpoint)
- Database connection pool status
- Third-party service status (live ping to Twilio, Resend, Anthropic, Payroc, etc.)
- Memory and CPU from Vercel metrics

---

## SECTION 6 — COMMUNICATIONS

**Route:** `app/admin/communications/page.tsx`

**BROADCAST COMPOSER:**
- Write announcement
- Choose audience: All merchants | By product | By plan | By location | Custom segment
- Choose channel: In-portal notification | Email | Both
- Schedule or send now
- Preview
- Broadcast history

**SUPPORT INBOX:**
All support tickets from all products in one view.
Columns: Merchant | Subject | Product | Priority | Status | Assigned | Created
- Click → full ticket thread
- Reply from command center
- AI-suggested response button
- Escalation flag
- Close/reopen

**DIRECT MESSAGES:**
- Search any merchant
- Full message thread
- Messages appear in merchant's portal as notifications
- Read receipts

**CHANGELOG MANAGER:**
- Write product updates
- Tag which product(s) it applies to
- Publish → appears in merchant's "What's New" feed
- Schedule future entries

**EMAIL TEMPLATES:**
- All transactional email templates
- Edit HTML inline
- Preview before saving
- Version history with rollback

---

## SECTION 7 — AI CONSOLE

**Route:** `app/admin/ai/page.tsx`

**REYNA AI — EMPIRE INTELLIGENCE:**
Chat interface powered by Claude API (claude-sonnet-4-20250514).
System prompt gives full context of the empire — all metrics, all merchants, all products.

Example queries:
- "Which merchants are most likely to churn this month?"
- "What's my projected MRR in 6 months at current growth rate?"
- "Show me all merchants who haven't logged in for 30 days"
- "Generate a win-back campaign for merchants who churned in the last 90 days"
- "Why did transaction volume drop last Tuesday?"
- "Summarize this week's performance across all products"
- "Draft an announcement about the new [feature]"

**AI PERFORMANCE MONITOR (product-specific):**
- All AI-generated actions across the platform
- Quality scoring
- Flagged content needing review
- Token usage and cost by product and by merchant

**MODEL COST DASHBOARD:**
- API costs by product
- Cost per merchant (who uses the most AI?)
- Cost trend over time
- Budget alerts

---

## SECTION 8 — PLATFORM CONFIG

**Route:** `app/admin/config/page.tsx`

**FEATURE FLAGS:**
- All feature flags across the product
- Toggle on/off globally, per merchant, or per plan
- Percentage rollout (enable for 10% of merchants first)
- Scheduled flags (turn on at specific date/time)
- A/B test flags (two variants, measure conversion)

**PLAN MANAGEMENT:**
- Create, edit, delete subscription plans
- Set price, features, limits
- Grandfather existing merchants at old pricing
- Trial period settings

**INTEGRATION HEALTH:**
- All third-party integrations with live status
- API key management (rotate without downtime)
- Usage and cost per integration
- Rate limit monitoring

**WHITE-LABEL MANAGEMENT:**
- All active white-label deployments
- Per-brand settings: logo URL, primary color, domain
- Per-brand feature flags
- Revenue attribution per brand
- [Deploy New Brand] wizard

**ENVIRONMENT VARIABLES:**
- View all env vars across all Vercel projects (values masked)
- Add variable to one or multiple projects simultaneously
- Rotate secrets
- Variable change history (when changed, by whom)

---

## SECTION 9 — ANALYTICS

**Route:** `app/admin/analytics/page.tsx`

**GROWTH METRICS:**
- MRR waterfall (new, expansion, contraction, churn)
- Net Revenue Retention (NRR) — target >120%
- Quick Ratio: (new + expansion) / (contraction + churn)
- DAU/MAU ratio

**COHORT ANALYSIS:**
- Retention by signup cohort (by month)
- Revenue by cohort
- Churn patterns by cohort
- Expansion patterns by cohort

**PRODUCT ANALYTICS:**
- Feature adoption heatmap
- Time-to-activate (signup → first value action)
- Power users vs casual vs at-risk
- Session depth and duration trends

**FUNNEL ANALYTICS:**
- Onboarding funnel with drop-off at each step
- A/B test results

**GEOGRAPHIC ANALYTICS:**
- Merchants by city/state
- Revenue by geography
- Growth by region

---

## SECTION 10 — ALERTS

**Route:** `app/admin/alerts/page.tsx`

All alerts from all products in one inbox.
Priority: Critical (error color) | High (warning color) | Medium (yellow) | Info (accent)

**Auto-generated alert types:**
- Merchant payment failed (Critical)
- Merchant hasn't logged in 30+ days (High)
- Merchant churn risk score > 80 (High)
- Platform error rate spike (Critical)
- Payment dispute opened (High)
- New merchant onboarding stalled (Medium)
- AI quality drop (Medium)
- Integration service degraded (High)
- API rate limit approaching (Medium)
- Database near capacity (Critical)
- New merchant signed up (Info)

Each alert:
- Description + context
- Affected merchant/system
- Recommended action
- [Dismiss] [Assign to me] [Auto-fix with AI] buttons
- Resolution history

**Alert rules editor:**
- Create custom rules
- Example: "Alert me when MRR drops more than 10% in a single day"
- Notification channels: in-portal + email + SMS

---

## SECTION 11 — SECURITY

**Route:** `app/admin/security/page.tsx`

**ACCESS LOG:**
- Every login to every portal
- IP address, device, location, timestamp, success/fail
- Suspicious login detection (impossible travel, new country, multiple fails)
- Block IP address

**ADMIN AUDIT TRAIL:**
- Every action taken in the command center
- Who did what, when, what changed
- Immutable — cannot be deleted
- Export as CSV

**SUPERADMIN ACCESS MANAGEMENT:**
- Who has command center access
- Roles: superadmin | admin | support | read-only
- Invite new admin
- Revoke access
- Require 2FA

**SECURITY SETTINGS:**
- Session timeout duration
- 2FA enforcement
- IP allowlist for command center
- Webhook signature verification status

---

## PRODUCT-SPECIFIC SECTIONS

These go BELOW the universal sections in the sidebar for each product:

### KASSE COMMAND CENTER adds:
- **Booking Monitor** — all appointments across all merchants real-time
- **POS Transactions** — all sales across all merchants
- **AI Receptionist** — all voice calls, transcripts, quality scores
- **Franchise Network** — all franchise systems, their locations, royalties
- **Marketplace** — stylist listings, bookings, marketplace revenue

### SALONBACKED COMMAND CENTER adds:
- **Insurance Dashboard** — all policies, premiums, claims
- **Tax Filing Queue** — all returns in CPA review queue, EFIN status
- **SEPA Membership** — all members, dues collected, CE credits issued
- **Payroll Monitor** — all payroll runs, amounts, status, errors
- **Benefits Enrollment** — all health enrollments, insurance status per member

### REYNA PAY COMMAND CENTER adds:
- **Transaction Monitor** — every payment, every merchant, real-time
- **Dispute Center** — all chargebacks, evidence upload, Payroc status
- **Risk Dashboard** — flagged transactions, velocity alerts, fraud scores
- **Merchant Underwriting** — new merchant applications, approval queue
- **Payout Management** — all payouts pending / failed / completed
- **Payroc Health** — API status, terminal connectivity, SDK version

### RUNMYSALON COMMAND CENTER adds:
- **Integration Monitor** — all OAuth connections (Square, Vagaro, Mindbody) status
- **Chrome Extension** — installs, DAU, feature usage, version distribution
- **White-Label Brands** — all deployed brands, merchants, revenue per brand
- **API Usage** — all API keys, calls per endpoint, error rates, cost
- **Vertical Performance** — which vertical is growing fastest, revenue by vertical

---

## TECHNICAL REQUIREMENTS

### Authentication
```typescript
// Every admin route must check:
const session = await getServerSession(authOptions)
if (!session || session.user.role !== "superadmin") {
  redirect("/login")
}
```

### Audit Logging
```typescript
// Every significant action:
await prisma.auditLog.create({
  data: {
    userId: session.user.id,
    action: "ACTION_NAME",
    entity: "entity_type",
    entityId: "affected_id",
    before: previousState,
    after: newState,
    ipAddress: request.ip,
  }
})
```

### Required API Routes
```
GET    /api/admin/stats
GET    /api/admin/merchants
GET    /api/admin/merchants/[orgId]
PATCH  /api/admin/merchants/[orgId]
POST   /api/admin/merchants/[orgId]/impersonate
POST   /api/admin/merchants/[orgId]/suspend
GET    /api/admin/users
PATCH  /api/admin/users/[userId]
GET    /api/admin/revenue
GET    /api/admin/transactions
POST   /api/admin/transactions/[id]/refund
GET    /api/admin/deployments         (calls Vercel API)
POST   /api/admin/deployments/[project]/redeploy
POST   /api/admin/deployments/[project]/rollback
POST   /api/admin/ai-console          (streams via SSE)
GET    /api/admin/errors
POST   /api/admin/broadcast
GET    /api/admin/support
GET    /api/admin/alerts
GET    /api/admin/security/logs
GET    /api/admin/analytics/growth
GET    /api/admin/analytics/cohorts
GET    /api/admin/config/flags
PATCH  /api/admin/config/flags/[id]
```

---

## THE UNIVERSAL BUILD PROMPT

Paste this into any product's Claude Code session to build its Command Center:

---

**READ ALL FILES IN /docs/ BEFORE DOING ANYTHING.**

You are building the [PRODUCT NAME] Master Command Center — the superadmin portal that Robert Reyna uses to manage every aspect of the [PRODUCT NAME] platform. It lives at /admin/* routes and is accessible only to users with role "superadmin".

This command center is part of a unified empire of products (Kasse, SalonBacked, Reyna Pay, RunMySalon). Every command center has IDENTICAL structure and navigation — only the data and product-specific sections differ. Read COMMAND_CENTER.md in /docs/ for the complete spec.

**Design:** Use this product's existing design system exactly. Dark variant of the same design tokens. The command center feels like "the control room version" of the existing product — same fonts, same component patterns, same spacing — just in dark mode.

**Build order:**
1. app/admin/layout.tsx (superadmin auth guard + dark sidebar with universal nav)
2. app/admin/page.tsx (Overview / War Room)
3. app/admin/merchants/page.tsx + app/admin/merchants/[orgId]/page.tsx
4. app/admin/users/page.tsx
5. app/admin/revenue/page.tsx
6. app/admin/operations/page.tsx (including AI Dev Console with Anthropic API streaming)
7. app/admin/communications/page.tsx
8. app/admin/ai/page.tsx
9. app/admin/config/page.tsx
10. app/admin/analytics/page.tsx
11. app/admin/alerts/page.tsx
12. app/admin/security/page.tsx
13. All product-specific sections for [PRODUCT NAME] (see COMMAND_CENTER.md)
14. All /api/admin/* routes

After every 3 pages: npm run build — zero TypeScript errors before continuing.

After everything is built:
```
git add -A
git commit -m "admin: complete [PRODUCT NAME] command center — all sections"
git push
```

Report every file created, confirm clean build, give commit hash.

ZERO SHORTCUTS. THIS IS THE OWNER'S WAR ROOM. DO NOT STOP UNTIL COMPLETE.
