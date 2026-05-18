# KASSE DOCUMENTATION INDEX
## Master Reference for the Kasse Platform

**Version:** 1.0 | **Owner:** Robert Reyna, CEO — Reyna Tech LLC
**Last Updated:** April 2026

---

## DOCUMENTS IN THIS FOLDER

| File | Description | Status |
|------|-------------|--------|
| KASSE_VISION.md | Three-layer architecture, competitive moat, north star metrics | LOCKED |
| KASSE_FEATURES.md | Complete feature bible — every feature the platform will have | LIVING |
| KASSE_ROADMAP.md | Phase-by-phase roadmap with commits, acceptance criteria | LIVING |
| KASSE_ARCHITECTURE.md | Repos, Vercel setup, database, third-party APIs, infra (single-region us-east-2) | LIVING |
| KASSE_STRATEGIC_DECISIONS.md | SD-K-001 through SD-K-040 — locked decisions, supersede pattern preserves history | LOCKED (v2.0) |
| KASSE_ENGINE_BOUNDARY.md | Layer 1 (Kasse) to Layer 0 (Reyna Pay) API contract | LOCKED |
| KASSE_HCM.md | HCM spec — profile, time clock, PTO, license verification, compensation models | PLANNING |
| KASSE_COMPLIANCE.md | 50-state employment, PCI scope, TDPSA/CCPA, HIPAA, WCAG, security | PLANNING |
| KASSE_TIERS.md | Per-location pricing — FREE / PLUS / PREMIUM / ENTERPRISE (rewritten 2026-05-17) | LIVING |
| KASSE_ONBOARDING.md | Branched wizard, save+resume, employment agreements, e-sign, concierge fallback | PLANNING |
| KASSE_SIDEBAR_GAP.md | Audit of current Sidebar.tsx vs locked PORTAL_ARCHITECTURE spec | LIVING |
| KASSE_OPEN_QUESTIONS.md | OQ-001 through OQ-012 — decisions needed before shipping | LIVING |
| KASSE_EXIT_THESIS.md | Acquirer analysis, moat analysis, 5-year exit plan | LIVING |
| KASSE_UI_PRINCIPLES.md | Design system, typography, colors, component standards | LOCKED |
| KASSE_VERTICAL_SPECS.md | Per-vertical feature config (salon, barbershop, nail, med spa, gym, restaurant, auto) | LIVING |
| KASSE_VERTICALS_EXPANDED.md | Extended vertical specifications | PLANNING |
| KASSE_API_SPEC.md | Full API capability matrix, endpoints, webhooks, agent commerce design | LIVING |
| REYNA_PAY_API_SPEC.md | Payment rails contract for Kasse, SalonBacked, RunMySalon, and developer consumers | LIVING |
| KASSE_WHITE_LABEL_GUIDE.md | Reseller setup, theme config, deployment steps | LIVING |
| KASSE_FRANCHISE_SYSTEM.md | Franchise management + Franchise Creator portal spec | LIVING |
| KASSE_FRANCHISE_ALL.md | Comprehensive franchise spec — v1 foundation, v2 UI workflow | PLANNING |
| KASSE_PAYROLL_BILLPAY.md | HCM foundations v1 + future payroll/banking/bill-pay v2 | PLANNING |
| KASSE_MARKETPLACE.md | Stylist marketplace, supply marketplace, hiring board, gift cards | LIVING |
| KASSE_INTEGRATIONS.md | Third-party integrations catalog | PLANNING |
| KASSE_INCUBATOR.md | Incubator program design | PLANNING |
| KASSE_MIGRATION.md | Data migration from Square/Vagaro/Mindbody/Excel | PLANNING |
| KASSE_DAYOPS.md | Day-to-day operations workflows | PLANNING |
| KASSE_RETENTION.md | Customer retention features | PLANNING |
| KASSE_SUPPORT.md | Help center, AI agent, support workflows | PLANNING |
| KASSE_PORTALS.md | 4-portal architecture (Owner / Stylist / Client / Admin) | LIVING |
| KASSE_PORTAL_ARCHITECTURE.md | Detailed portal architecture, role hierarchy | LIVING |
| KASSE_DESIGN_SYSTEM.md | Complete design system specification | LIVING |
| KASSE_COLOR.md | Kasse Color Studio specification | PLANNING |
| KASSE_MARKETING_SITE.md | Public marketing site spec | LIVING |
| SALONBACKED.md | HCM layer + 50-state compliance priority | PLANNING |
| RUNMYSALON.md | White-label version of Kasse | PLANNING |
| AI_STRATEGY.md | AI feature catalog + guardrails section | LOCKED |
| COMMAND_CENTER.md | CEO-side command center spec | LOCKED |
| EMPIRE_ARCHITECTURE.md | Reyna Tech LLC product portfolio architecture | LOCKED |
| RLS_AUDIT.md | Row-Level Security audit (every route classified) | LIVING |
| blind-spots.md | Architectural blind spots and resolutions | LIVING |
| ui-feedback.md | UI/UX feedback log (P12 polish queue) | LIVING |
| architecture/CONVERSATION_VS_DOCS_CONTRADICTIONS.md | Contradictions report from doc reconciliation | REFERENCE |
| KASSE_MASTER_BUILDPLAN.md | Original 12-phase build plan — superseded by build-order/ | ARCHIVED |
| build-order/ | Detailed phase-by-phase build specs (22 phase docs) | LIVING |
| build-order/PHASE_0_FOUNDATION.md | Foundation phase (rewritten 2026-05-17 to match actual delivery) | LIVING |

---

## THE ONE-SENTENCE SUMMARY

Kasse is a vertical intelligence platform — the POS is the Trojan horse, the data layer is the moat, the AI is the differentiator, and the developer ecosystem is the exit.

---

## CURRENT BUILD STATUS

### What Exists (portal.kasseapp.com)
- Auth (email/password + email verification)
- 9-step business onboarding wizard
- Dashboard (Square-style layout)
- POS terminal (UI complete, needs engine wiring)
- Appointments (UI complete, needs full CRUD wiring)
- Clients (UI complete, needs full CRUD wiring)
- Staff (UI complete, needs full CRUD wiring)
- Services (UI complete, needs full CRUD wiring)
- Reports (UI complete, needs real data)
- Marketing (campaigns, automations — UI complete)
- Reputation management (UI complete)
- Messages / HyperConnect (UI complete)
- Waitlist (UI complete)
- AI Receptionist config (UI complete, needs Twilio + OpenAI wiring)
- Settings (Square-level, UI complete, needs full save/load wiring)
- Admin portal (superadmin at /admin — UI complete)
- Data import (UI complete, CSV processing wired)

### What Needs to Be Built Next (Phase 0 → Phase 1)
1. Wire all pages to real database data
2. Inter font throughout
3. SalonTransact engine client
4. Real payments end-to-end

---

## HOW TO START A NEW CLAUDE CODE SESSION

When starting a fresh Claude Code session for building:

Read these docs **IN THIS ORDER** before doing anything:

1. `docs/KASSE_STRATEGIC_DECISIONS.md` (v2.0 — all locked decisions)
2. `docs/architecture/CONVERSATION_VS_DOCS_CONTRADICTIONS.md` (reconciliation report)
3. `docs/build-order/PHASE_0_FOUNDATION.md` (current build state)
4. The specific build-order phase doc for the work being done

After reading, acknowledge each doc by name. Then wait for build instruction.

```
Current working directory: C:\Users\Salon\Downloads\kasse
Deploy: git add -A && git commit -m "description" && git push
Schema changes: npx prisma db push or apply migration via Supabase MCP
PR review workflow: Claude Code Review GitHub Action runs automatically on PR open
```

---

## KEY CONTACTS & CREDENTIALS

| Item | Value |
|------|-------|
| CEO | Robert Reyna (ceo@36west.org) |
| GitHub Org | lendbucket |
| Portal Repo | lendbucket/kasse |
| Live URL | portal.kasseapp.com |
| Vercel Project | kasse |
| Supabase Project | nknuonxznhshrgfseeqc |
| Superadmin Login | ceo@36west.org |
| Engine URL | app.salontransact.com/api/v1 |
| Entity | Reyna Tech LLC (Wyoming) |

---

## NAMING CONVENTIONS

| Brand | Entity | Use Case |
|-------|--------|---------|
| Kasse | Reyna Tech LLC | The salon POS + booking platform |
| SalonTransact | Reyna Pay LLC | Payment processing brand |
| Reyna Pay | Reyna Pay LLC | Merchant portal + payment platform |
| SalonBacked | Reyna Insure LLC | HCM + benefits platform |
| RunMySalon | Reyna Tech LLC | White-label version of Kasse |
| Salon Envy | Salon Envy USA LLC | The anchor franchise (proof of concept) |
