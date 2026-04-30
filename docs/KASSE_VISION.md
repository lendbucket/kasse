# KASSE VISION
## The Operating System for Modern Service Businesses

**Version:** 1.0
**Author:** Robert Reyna, CEO — Reyna Tech LLC
**Date:** April 2026
**Status:** LOCKED

---

## THE ONE-SENTENCE THESIS

Kasse is a vertical intelligence platform that owns the transaction, the booking, the client relationship, the workforce, and the financial infrastructure for service businesses — and makes all of it API-accessible to developers and AI agents.

---

## THE THREE-LAYER ARCHITECTURE

### Layer 1 — The Engine (Reyna Pay / SalonTransact)
The proprietary payment and data processing core. Never visible to end customers. Consumed by vertical apps and external developers.

- Payments via Payroc (locked — SD-001)
- Tokenization (Hosted Fields + secure tokens)
- Customer intelligence (LTV, frequency, churn)
- Multi-location support
- Webhooks + audit logging
- AI-agent-native API (OpenAPI 3.1, semantic endpoints, idempotency everywhere)

### Layer 2 — Vertical SaaS Apps (Kasse, RestaurantTransact, TireShopTransact, GymTransact)
Industry-specific applications that wrap the engine in native UI. Each vertical has its own brand, its own feature set, and its own go-to-market. Kasse is the salon vertical and the first to ship.

**Kasse is composed of four surfaces:**
1. Kasse iPad App — Front-of-house POS
2. Kasse iPhone App — Stylist mobile app
3. Kasse Merchant Portal — Owner/operator web backend
4. Kasse Kiosk — Self-service check-in and checkout

### Layer 3 — Reseller White-Label Network
Other operators take the engine + a vertical app and put their brand on it. They sell into niches where they have distribution. All merchants remain Reyna Pay merchants. "Powered by Reyna Pay" is permanent in footer.

---

## THE FULL PLATFORM STACK

```
┌─────────────────────────────────────────────────────────────────┐
│                    KASSE INTELLIGENCE LAYER                      │
│  Customer Intelligence │ Business Intelligence │ AI Engine       │
│  LTV, churn, sentiment │ Forecasting, patterns │ Claude, GPT-4o  │
└─────────────────────────────────────────────────────────────────┘
                              ↑ feeds into
┌─────────────────────────────────────────────────────────────────┐
│                      REYNA PAY ENGINE                            │
│  /api/v1/charges  /api/v1/customers  /api/v1/bookings           │
│  /api/v1/reports  /api/v1/webhooks   /api/v1/stylists           │
└─────────────────────────────────────────────────────────────────┘
                              ↑ consumed by
┌──────────────┬──────────────┬──────────────┬────────────────────┐
│   Kasse      │ Restaurant   │  TireShop    │   GymTransact      │
│  (Salon POS) │  Transact    │  Transact    │   (Fitness POS)    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
                              ↑ white-labeled as
┌─────────────────────────────────────────────────────────────────┐
│              RESELLER WHITE-LABEL NETWORK                        │
│  Any brand with any name — Powered by Reyna Pay (permanent)     │
└─────────────────────────────────────────────────────────────────┘
                              ↑ accessed by
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER ECOSYSTEM                           │
│  API marketplace │ Plugins │ Chrome extensions │ AI Agents      │
│  "Built on Kasse" program — like "Built on Stripe"             │
└─────────────────────────────────────────────────────────────────┘

                  HORIZONTAL: SALONBACKED HCM LAYER
┌─────────────────────────────────────────────────────────────────┐
│  Tax (TurboTax) │ Insurance │ Telehealth │ HR │ Payroll         │
│  Benefits Admin │ Compliance │ Financial Wellness               │
└─────────────────────────────────────────────────────────────────┘
```

---

## THE COMPETITIVE MOAT

**Square** owns the POS market. Brilliant at acquisition, weak at data depth, no AI, no workforce layer.

**Vagaro** owns booking for mid-market salons. No payment innovation, no AI, no white-label, no franchise tools.

**Zenoti** owns enterprise salon chains. Best AI in the category (voice receptionist). No developer platform, no white-label network, no HCM layer.

**Mindbody** owns fitness. No salon depth.

**Our moat:**
1. Cross-vertical data layer (transaction + booking + client across ALL verticals)
2. AI receptionist built in-house (we own the model, the training data, the improvement curve)
3. Agent-native API (when AI agents need to book a haircut, they call our API)
4. White-label engine at scale (50 resellers × 200 merchants = 10,000 locations)
5. SalonBacked HCM (no competitor touches workforce — this is the lock-in layer)
6. Franchise Creator (we help businesses franchise themselves, and their franchise system IS Kasse)
7. Stylist Marketplace (two-sided network effect — can't be replicated once at scale)

---

## WHAT WE ARE BUILDING FOR AGENTS

"We must build platforms designed for agents to buy from, not humans."

Every Kasse endpoint is designed to be consumed by AI agents:
- Semantic endpoint names (POST /bookings, not POST /create-record)
- HATEOAS links in responses (agent knows what to do next without reading docs)
- OpenAPI 3.1 spec (auto-discoverable)
- Consistent error format (agents can handle errors predictably)
- Idempotency on every POST (agents can retry safely)
- Agent-specific rate limiting and audit logging
- "Kasse for Agents" documentation (how to plug Kasse into LangChain, AutoGPT, Claude Tools)

When an AI agent is given the task "Book Sarah a haircut at her favorite salon Saturday afternoon" — it will call our API. That's distribution that money cannot buy.

---

## THE EXIT THESIS

**Who acquires Kasse and why:**

| Acquirer | Reason | Range |
|----------|--------|-------|
| Payroc | You're their best merchant. They want to own the software layer. | $50-150M |
| Toast | You crack restaurant vertical. They acquire to neutralize. | $150-300M |
| Zenoti | Your AI + multi-vertical + white-label network is their gap. | $200-500M |
| Mindbody | Your gym vertical threatens their core. They buy to absorb. | $100-250M |
| Stripe | AI-native API design becomes the model for service business payments. | $500M-1B |
| Private Equity | $10M ARR, strong retention, multi-vertical expansion story. | 8-12x revenue |

**What makes the exit irreplaceable:**
The data. Client LTV across years. Stylist attribution. Cross-vertical customer identity. AI model training data (1M calls = proprietary trained model). Churn prediction accuracy. None of this can be replicated by a competitor starting today.

---

## NORTH STAR METRICS

- Merchants on platform
- Gross payment volume (GPV) through SalonTransact
- Stylist marketplace listings
- AI receptionist calls handled
- Developer API keys issued
- White-label brands deployed
- Franchise organizations managed through Franchise Creator
- SalonBacked enrolled professionals
