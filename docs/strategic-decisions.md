# Strategic decisions

Running log of architectural decisions that shape future product work. Each entry
captures the question, the decision, the rationale, and any deferred follow-ups.

---

## SD-010 — iPad POS architecture (dual-device checkout)

**Date:** 2026-05-16  
**Phase:** captured during P0.D, implemented in P0.G + P8

**Question:** How does the Kasse checkout work on physical hardware? Specifically,
how does a stylist running Kasse Appointments on their iPad trigger a card swipe
on a Payroc terminal, while showing the customer their itemized cart on a separate
customer-facing iPad?

**Decision:** Dual-iPad architecture. Three devices in play:

1. **Stylist iPad** (merchant device) — runs Kasse Appointments + POS. Owns the
   cart, lets the stylist add/remove services, calculates totals, triggers payment.
2. **Customer iPad** (customer-facing display) — shows itemized cart in real-time
   as the stylist edits. Customer picks tip, signs, picks receipt destination.
3. **Payroc PAX A920 Pro (or similar)** — card reader only. Receives final amount,
   handles swipe/dip/tap, returns success/failure. Does NOT show tip prompts,
   print receipts, or display itemization.

**Communication pattern:** Server-mediated via Supabase Realtime channels keyed
by `locationId + activeCartId`. Both iPads subscribe; server is source of truth.
This is what Toast and Square Customer Display do.

**Payroc mode:** Semi-Integrated or Cloud Terminal mode. Server POSTs intent to
terminal, terminal returns transaction ID, server pairs with cart and finalizes.

**Rationale:** Industry-standard pattern. Reduces PCI scope (we never touch card
data; Payroc does). Allows tip flexibility (UI-controlled, not terminal-controlled).
Works across rooms and supports stylist-to-cart-to-display mappings that aren't
one-to-one. Matches what merchants already expect from prior systems.

**Schema implications (lands in P0.G):**
- `Device` model — registers each iPad/terminal with name, role (StylistDevice / CustomerDisplay / ManagerDevice / StandalonePOS), location pairing, and Payroc terminalId where applicable.
- `Cart` model — in-progress, pre-payment shopping cart with realtime channel ID. Distinct from `Order`/`Payment` (which represent finalized transactions).
- `Settings → Devices` admin UI surface for adding/naming/pairing devices.

**Deferred questions:**
- **Offline mode:** What happens when WiFi drops mid-checkout? Options: (a) hard-fail and queue for retry, (b) cache cart but require online for charge, (c) full offline-first like Square's 3-day mode. Decision needed in P0.G.
- **Tip-out splits:** If multiple stylists work on one ticket (color + cut), how does tip get split? Decision lives with the commission system in P0.G.
- **Multi-cart per stylist:** Can one stylist have multiple active carts at once (e.g., one in chair, one waiting)? Likely yes, but UX needs design.
