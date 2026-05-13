# KASSE DOCUMENTATION INDEX
## Master Reference for the Kasse Platform

**Version:** 1.0 | **Owner:** Robert Reyna, CEO — Reyna Tech LLC
**Last Updated:** April 2026

---

## DOCUMENTS IN THIS FOLDER

| File | Description | Status |
|------|-------------|--------|
| [KASSE_VISION.md](./KASSE_VISION.md) | Three-layer architecture, competitive moat, north star metrics | LOCKED |
| [KASSE_FEATURES.md](./KASSE_FEATURES.md) | Complete feature bible — every feature the platform will have | LIVING |
| [KASSE_ROADMAP.md](./KASSE_ROADMAP.md) | Phase 0-12 with commits, acceptance criteria, sequencing | LIVING |
| [KASSE_ARCHITECTURE.md](./KASSE_ARCHITECTURE.md) | Repos, Vercel setup, database, third-party APIs | LIVING |
| [KASSE_STRATEGIC_DECISIONS.md](./KASSE_STRATEGIC_DECISIONS.md) | SD-K-001 through SD-K-015 — locked decisions, no revisiting without CEO | LOCKED |
| [KASSE_OPEN_QUESTIONS.md](./KASSE_OPEN_QUESTIONS.md) | OQ-001 through OQ-012 — decisions needed before shipping | LIVING |
| [KASSE_EXIT_THESIS.md](./KASSE_EXIT_THESIS.md) | Acquirer analysis, moat analysis, 5-year exit plan | LIVING |
| [KASSE_UI_PRINCIPLES.md](./KASSE_UI_PRINCIPLES.md) | Design system, typography, colors, component standards | LOCKED |
| [KASSE_VERTICAL_SPECS.md](./KASSE_VERTICAL_SPECS.md) | Per-vertical feature config (salon, barbershop, nail, med spa, gym, restaurant, auto) | LIVING |
| [KASSE_API_SPEC.md](./KASSE_API_SPEC.md) | Full API capability matrix, endpoints, webhooks, agent commerce design | LIVING |
| [KASSE_WHITE_LABEL_GUIDE.md](./KASSE_WHITE_LABEL_GUIDE.md) | Reseller setup, theme config, deployment steps | LIVING |
| [KASSE_FRANCHISE_SYSTEM.md](./KASSE_FRANCHISE_SYSTEM.md) | Franchise management + Franchise Creator portal spec | LIVING |
| [KASSE_MARKETPLACE.md](./KASSE_MARKETPLACE.md) | Stylist marketplace, supply marketplace, hiring board, gift cards | LIVING |
| [SALONBACKED.md](./SALONBACKED.md) | HCM layer — tax, insurance, telehealth, HR, payroll, benefits | PLANNING |
| [KASSE_ENGINE_BOUNDARY.md](./KASSE_ENGINE_BOUNDARY.md) | Layer 1 (Kasse) to Layer 0 (Reyna Pay) API contract. Read before any payment-adjacent PR. | LOCKED |

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

```
Read all files in /docs/ completely before doing anything.
These are the strategic foundation documents for Kasse.
After reading, acknowledge each doc by name.
Then wait for my first build instruction.
Current working directory: C:\Users\Salon\Downloads\kasse
Deploy: git add -A && git commit -m "description" && git push
Schema changes: npx dotenv-cli -e .env.local -- npx prisma db push
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
