# KASSE_DESIGN_SYSTEM.md
## UI Design System & Principles — Complete Specification
### Version 1.0 | Kasse Platform | 36 West Holdings

---

## CORE PHILOSOPHY

Kasse is the operating system for service businesses. The design must feel like what it is: calm authority. Not a startup tool, not a bloated enterprise app. A well-designed professional environment that a stylist, barber, or gym owner reaches for first thing in the morning and trusts completely.

**Three words that govern every design decision:**
1. **Warm** — this is a people business. Salons, barbershops, spas. The UI must feel human and approachable, not cold and corporate.
2. **Confident** — every action should feel decisive. No ambiguity about what a button does, what a number means, what happens when you tap it.
3. **Fast** — service businesses move fast. The front desk can't wait. Every interaction — checkout, check-in, schedule lookup — must be instant and require as few taps as possible.

**The Apple of Service Business Software.** Premium. Opinionated. No clutter. Every element earns its place or it's removed.

---

## COLOR SYSTEM

### Primary Palette

```
PRIMARY BRAND:      #2F5061   Deep Teal Blue
  — Used for: sidebar active state, primary buttons, key data points, links
  — This is the anchor. Everything else balances against it.

ACCENT 1 (Blush):  #E57F84   Warm Rose
  — Used for: CTAs on light backgrounds, notifications, alerts that need warmth,
    promotional banners, "new" badges, celebration states (first booking, milestone)
  — Never use as background for large areas. Always accent.

ACCENT 2 (Cream):  #F4EAE6   Warm Off-White
  — Used for: page backgrounds (light mode), card hover states, notification backgrounds,
    empty state backgrounds, onboarding sections
  — The warmth that makes this feel like a beauty brand, not a bank.

ACCENT 3 (Teal):   #4297A0   Medium Teal
  — Used for: secondary actions, progress indicators, links inside content,
    chart lines, integration badges, success states
  — Lighter sibling of the primary. Creates depth in the color system.
```

### Full Color Token System

```scss
// === BACKGROUNDS ===
--bg-page:          #FAF8F6   // Warm off-white (not #F4EAE6 — slightly cooler for long sessions)
--bg-card:          #FFFFFF   // Pure white cards against the warm page
--bg-input:         #F5F3F1   // Warm light gray for inputs
--bg-hover:         #F0EDE9   // Slightly darker warm gray for hover
--bg-active:        #EAF1F4   // Light teal tint for active/selected states
--bg-sidebar:       #2F5061   // Primary brand — sidebar is always dark
--bg-sidebar-hover: #3A6274   // Slightly lighter for sidebar item hover
--bg-accent-light:  #F4EAE6   // Cream — onboarding, banners, promo areas

// === TEXT ===
--text-primary:     #1C2B33   // Deep navy-tinted black (not pure black)
--text-body:        #3D4F58   // Slightly lighter for body text
--text-muted:       #7A8F96   // Muted — labels, captions, secondary info
--text-placeholder: #AEBFC6   // Placeholders, disabled text
--text-inverse:     #FFFFFF   // On dark backgrounds (sidebar, primary buttons)
--text-accent:      #2F5061   // Primary brand for links, active labels
--text-blush:       #C45A5F   // Darker blush for text (readable contrast)
--text-teal:        #2E7A82   // Darker teal for text (readable contrast)

// === BORDERS ===
--border-default:   #E4DDD7   // Default cards and dividers — warm gray
--border-input:     #D4CCC6   // Input borders
--border-focus:     #2F5061   // Primary brand on focus
--border-subtle:    #EDE8E4   // Very subtle — table row dividers
--border-brand:     #4297A0   // Teal accent borders (selected state, integrations)

// === BRAND COLORS ===
--brand-primary:    #2F5061
--brand-primary-hover: #243E4E   // Darker on hover
--brand-primary-pressed: #1C3040 // Even darker on press
--brand-accent:     #E57F84
--brand-accent-hover: #D96E73
--brand-teal:       #4297A0
--brand-teal-hover: #368590
--brand-cream:      #F4EAE6

// === SEMANTIC ===
--success:          #2D9B6F   // Green — warmer, not neon
--success-bg:       #E8F7F1
--success-border:   #A8DFC8
--success-text:     #1A6B4A

--warning:          #D97706
--warning-bg:       #FEF3C7
--warning-border:   #FCD34D
--warning-text:     #92400E

--danger:           #DC3545
--danger-bg:        #FEF2F2
--danger-border:    #FCA5A5
--danger-text:      #B91C1C

--info:             #4297A0   // Use brand teal for info (not blue — that's competitor color)
--info-bg:          #EAF4F6
--info-border:      #A8D4D8
--info-text:        #2F5061

// === SIDEBAR ===
--sidebar-bg:           #2F5061
--sidebar-text:         rgba(255,255,255,0.75)
--sidebar-text-active:  #FFFFFF
--sidebar-icon:         rgba(255,255,255,0.55)
--sidebar-icon-active:  #FFFFFF
--sidebar-item-hover:   rgba(255,255,255,0.08)
--sidebar-item-active:  rgba(255,255,255,0.15)
--sidebar-border:       rgba(255,255,255,0.10)
--sidebar-section-label: rgba(255,255,255,0.40)
```

### Dark Mode Token Extensions (Phase 2 — plan now, build later)

```scss
@media (prefers-color-scheme: dark) {
  --bg-page:       #1A2830
  --bg-card:       #1F3240
  --bg-input:      #243A49
  --text-primary:  #F0EDE9
  --text-body:     #C4B8B0
  --border-default:#2F4555
}
```

---

## TYPOGRAPHY

**Font: Inter only.** No exceptions. No system fonts in UI components.

```css
/* Import in _app.tsx or layout.tsx */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { font-family: 'Inter', -apple-system, sans-serif; }
```

### Type Scale

```
SCALE         SIZE   WEIGHT   TRACKING        USE CASE
─────────────────────────────────────────────────────────────────
hero-number   48px   700      -0.5px          Dashboard hero stats (revenue, bookings)
page-title    28px   600      -0.4px          Page titles (h1)
section-title 20px   600      -0.3px          Section headers, modal titles
card-title    16px   600      -0.2px          Card titles, widget headers
body-large    15px   500      -0.2px          Form input values, important labels
body          14px   400      -0.2px          Primary body text
body-medium   14px   500      -0.2px          Emphasized body, button text
label         13px   500      -0.1px          Form labels, table cells, captions
small         12px   400       0px            Helper text, timestamps, metadata
badge         11px   600      +0.3px UPPER    Badges, status labels, table headers
micro         10px   600      +0.4px UPPER    Plan tags, category chips (min size)
```

**Rules:**
- Letter-spacing: always `-0.31px` on Inter ≥ 14px (Inter needs it — default tracking is too loose)
- Weight 700+ reserved for numbers ≥ 32px only (hero stats)
- UPPERCASE only at 11px+ — never uppercase at smaller sizes (illegible)
- Line-height: 1.5 for body text, 1.2 for headings, 1.0 for single-line labels

---

## BUTTONS

### Primary Button
```css
.btn-primary {
  height: 38px;
  padding: 0 18px;
  background: linear-gradient(180deg, #3A6878 0%, #2F5061 100%);
  border: 1px solid #243E4E;
  border-radius: 8px;
  color: #FFFFFF;
  font: 500 14px/1 Inter;
  letter-spacing: -0.2px;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.10);
  transition: all 150ms ease;
  cursor: pointer;
}
.btn-primary:hover {
  background: linear-gradient(180deg, #426878 0%, #3A5F72 100%);
  transform: translateY(-1px);
  box-shadow:
    0 3px 8px rgba(47,80,97,0.30),
    inset 0 1px 0 rgba(255,255,255,0.12);
}
.btn-primary:active { transform: translateY(0); }
.btn-primary:focus-visible {
  outline: 2px solid #4297A0;
  outline-offset: 2px;
}
```

### Primary CTA (Large — checkout, onboarding)
```css
/* Same as primary but: */
height: 52px;
padding: 0 28px;
font: 500 16px/1 Inter;
border-radius: 10px;
```

### Accent Button (Blush — promotions, celebrations)
```css
.btn-accent {
  background: linear-gradient(180deg, #E98A8F 0%, #E57F84 100%);
  border: 1px solid #D96E73;
  color: #FFFFFF;
  /* same shape as primary */
}
.btn-accent:hover {
  background: linear-gradient(180deg, #ED9298 0%, #E98A8F 100%);
}
```

### Secondary Button
```css
.btn-secondary {
  height: 38px;
  padding: 0 16px;
  background: #FFFFFF;
  border: 1px solid #D4CCC6;
  border-radius: 8px;
  color: #1C2B33;
  font: 500 14px/1 Inter;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  transition: all 150ms ease;
}
.btn-secondary:hover { background: #F5F3F1; }
```

### Ghost Button
```css
.btn-ghost {
  background: transparent;
  border: none;
  color: #3D4F58;
  padding: 0 12px;
}
.btn-ghost:hover { background: #F0EDE9; border-radius: 8px; }
```

### Danger Button
```css
.btn-danger {
  background: #FFFFFF;
  border: 1px solid #FCA5A5;
  color: #DC3545;
}
.btn-danger:hover { background: #FEF2F2; }
```

### Icon Button
```css
.btn-icon {
  width: 34px; height: 34px;
  border-radius: 6px;
  background: transparent;
  border: none;
  display: flex; align-items: center; justify-content: center;
  color: #7A8F96;
  transition: all 100ms ease;
}
.btn-icon:hover { background: #F0EDE9; color: #3D4F58; }
```

---

## INPUTS & FORMS

```css
.input {
  height: 42px;
  padding: 0 14px;
  background: #F5F3F1;
  border: 1px solid #D4CCC6;
  border-radius: 8px;
  font: 400 14px/1 Inter;
  color: #1C2B33;
  letter-spacing: -0.2px;
  transition: all 150ms ease;
  width: 100%;
}
.input::placeholder { color: #AEBFC6; }
.input:focus {
  background: #FFFFFF;
  border-color: #2F5061;
  box-shadow: 0 0 0 3px rgba(47,80,97,0.12);
  outline: none;
}
.input:invalid { border-color: #FCA5A5; }
.input:invalid:focus { box-shadow: 0 0 0 3px rgba(220,53,69,0.10); }

/* Label */
.input-label {
  font: 500 13px/1 Inter;
  color: #1C2B33;
  margin-bottom: 6px;
  display: block;
}

/* Helper text */
.input-helper { font: 400 12px/1.4 Inter; color: #7A8F96; margin-top: 4px; }
.input-error  { font: 400 12px/1.4 Inter; color: #DC3545; margin-top: 4px; }

/* Mobile override */
@media (max-width: 768px) {
  .input { height: 50px; font-size: 16px; } /* Prevents iOS zoom */
}
```

### Select / Dropdown
Same as input + chevron icon right. Custom dropdown component (not native `<select>`) for design consistency. Uses popover with filter/search for long lists.

### Textarea
Same as input but `min-height: 100px`, `padding: 12px 14px`, `resize: vertical`.

### Search Input
```css
.input-search {
  padding-left: 40px; /* room for search icon */
  background-image: url("search-icon.svg");
  background-repeat: no-repeat;
  background-position: 14px center;
}
```

---

## CARDS

```css
.card {
  background: #FFFFFF;
  border: 1px solid #E4DDD7;
  border-radius: 12px;
  padding: 24px;
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.03),
    0 1px 1px rgba(0,0,0,0.04),
    0 2px 4px rgba(0,0,0,0.04),
    0 4px 8px rgba(0,0,0,0.03),
    0 8px 16px rgba(0,0,0,0.02);
}

/* Compact card — tighter padding for data-dense areas */
.card-compact { padding: 16px; }

/* Hover card — for clickable cards */
.card-hover {
  cursor: pointer;
  transition: all 200ms ease;
}
.card-hover:hover {
  border-color: #4297A0;
  box-shadow:
    0 0 0 1px rgba(66,151,160,0.15),
    0 4px 12px rgba(47,80,97,0.12),
    0 8px 24px rgba(47,80,97,0.08);
  transform: translateY(-2px);
}

/* Active/selected card */
.card-active {
  border-color: #4297A0;
  background: #EAF4F6;
}

/* Mobile */
@media (max-width: 768px) {
  .card { border-radius: 10px; padding: 16px; }
}
```

### Stat Card (Dashboard)
```css
.stat-card {
  /* inherits .card */
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-card__label  { font: 600 11px Inter; color: #7A8F96; text-transform: uppercase; letter-spacing: 0.4px; }
.stat-card__value  { font: 700 32px Inter; color: #1C2B33; letter-spacing: -0.5px; }
.stat-card__change { font: 500 13px Inter; }
.stat-card__change.positive { color: #2D9B6F; }
.stat-card__change.negative { color: #DC3545; }
```

---

## LAYOUT

### Desktop Portal Layout
```
┌──────────────────────────────────────────────────────┐
│  TOPBAR (56px sticky)                                │
│  [kasse. logo]        [Search]    [Notif] [Avatar]   │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │  CONTENT AREA                            │
│ 240px    │  max-width: 1280px                       │
│ fixed    │  padding: 32px                           │
│          │                                           │
│          │  ┌────────────────────────────────────┐  │
│          │  │  Page title + actions bar           │  │
│          │  └────────────────────────────────────┘  │
│          │                                           │
│          │  [content grid]                          │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────┐
│  TOPBAR (56px sticky)   │
│  [☰]  [logo]  [notif]  │
├─────────────────────────┤
│                         │
│  CONTENT                │
│  padding: 16px          │
│                         │
│                         │
│                         │
├─────────────────────────┤
│  BOTTOM NAV (64px)      │
│  [Home][Book][POS][More]│
└─────────────────────────┘
```

### Sidebar Structure
```css
.sidebar {
  width: 240px;
  height: 100vh;
  background: #2F5061;
  position: fixed;
  left: 0; top: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 100;
}

/* Logo area */
.sidebar__logo {
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.10);
}
/* "kasse." wordmark — bold serif, white */

/* Nav section label */
.sidebar__section-label {
  padding: 16px 20px 6px;
  font: 600 10px Inter;
  color: rgba(255,255,255,0.40);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Nav item */
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font: 500 14px Inter;
  color: rgba(255,255,255,0.70);
  cursor: pointer;
  transition: all 100ms ease;
  border-radius: 0; /* full width items */
  margin: 1px 8px;
  border-radius: 8px;
}
.sidebar__item:hover {
  background: rgba(255,255,255,0.08);
  color: #FFFFFF;
}
.sidebar__item.active {
  background: rgba(255,255,255,0.15);
  color: #FFFFFF;
  font-weight: 600;
}
.sidebar__item.active::before {
  content: '';
  position: absolute;
  left: 0;
  width: 3px;
  height: 100%;
  background: #E57F84; /* Blush accent — the active marker */
  border-radius: 0 3px 3px 0;
}

/* Icon in sidebar item */
.sidebar__item svg {
  width: 16px; height: 16px;
  opacity: 0.70;
  flex-shrink: 0;
}
.sidebar__item.active svg,
.sidebar__item:hover svg { opacity: 1.0; }

/* Bottom of sidebar */
.sidebar__footer {
  margin-top: auto;
  padding: 16px 8px;
  border-top: 1px solid rgba(255,255,255,0.10);
}
```

---

## TABLES

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

/* Header */
.table thead th {
  background: #F5F3F1;
  font: 600 11px Inter;
  color: #7A8F96;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid #E4DDD7;
  white-space: nowrap;
}

/* Row */
.table tbody tr {
  border-bottom: 1px solid #EDE8E4;
  transition: background 100ms ease;
}
.table tbody tr:hover { background: #F5F3F1; cursor: pointer; }
.table tbody tr:last-child { border-bottom: none; }

/* Cell */
.table tbody td {
  padding: 14px 16px;
  font: 400 13px Inter;
  color: #1C2B33;
  vertical-align: middle;
}

/* Mobile: tables become stacked cards */
@media (max-width: 768px) {
  .table, .table tbody, .table tr, .table td {
    display: block;
  }
  .table thead { display: none; }
  .table tbody tr {
    background: #FFFFFF;
    border: 1px solid #E4DDD7;
    border-radius: 10px;
    margin-bottom: 8px;
    padding: 12px 16px;
  }
  .table tbody td {
    padding: 4px 0;
    display: flex;
    justify-content: space-between;
  }
  .table tbody td::before {
    content: attr(data-label);
    font: 600 11px Inter;
    color: #7A8F96;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}
```

---

## STATUS PILLS

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 11px;
  font: 600 11px Inter;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.pill::before {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Appointment statuses */
.pill--confirmed   { background: #E8F7F1; color: #1A6B4A; } .pill--confirmed::before   { background: #2D9B6F; }
.pill--pending     { background: #FEF3C7; color: #92400E; } .pill--pending::before     { background: #D97706; }
.pill--cancelled   { background: #FEF2F2; color: #B91C1C; } .pill--cancelled::before   { background: #DC3545; }
.pill--in-progress { background: #EAF4F6; color: #2F5061; } .pill--in-progress::before { background: #4297A0; }
.pill--completed   { background: #F5F3F1; color: #3D4F58; } .pill--completed::before   { background: #7A8F96; }
.pill--no-show     { background: #FEF2F2; color: #B91C1C; } .pill--no-show::before     { background: #E57F84; }

/* Payment statuses */
.pill--paid       { background: #E8F7F1; color: #1A6B4A; } .pill--paid::before       { background: #2D9B6F; }
.pill--refunded   { background: #F5F3F1; color: #3D4F58; } .pill--refunded::before   { background: #7A8F96; }
.pill--disputed   { background: #FFF7ED; color: #C2410C; } .pill--disputed::before   { background: #F97316; }
.pill--failed     { background: #FEF2F2; color: #B91C1C; } .pill--failed::before     { background: #DC3545; }

/* Plan badges */
.pill--free       { background: #F5F3F1; color: #3D4F58; }
.pill--starter    { background: #EAF4F6; color: #2F5061; }
.pill--growth     { background: #E8F7F1; color: #1A6B4A; }
.pill--pro        { background: rgba(229,127,132,0.12); color: #C45A5F; }
.pill--enterprise { background: rgba(47,80,97,0.12); color: #2F5061; }
```

---

## SPACING & GRID

**8px base grid. Never break it.**

```
4px   — micro gaps (icon to text, badge internals)
8px   — tight spacing (label to input, related items)
12px  — small gap (between form fields in a row)
16px  — standard gap (card padding compact, list items)
20px  — medium gap (between sections within a card)
24px  — card padding default, between cards in a grid
32px  — page content padding, between major sections
40px  — between page sections (mobile: 24px)
48px  — generous section separation
64px  — hero areas
96px  — marketing/onboarding sections
```

### Content Grid
```css
.content-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

/* Stat row — 4 cards across */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px)  { .stats-row { grid-template-columns: 1fr; } }
```

---

## MODALS & OVERLAYS

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(28,43,51,0.50);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  animation: fadeIn 250ms ease;
}
.modal {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 24px 64px rgba(28,43,51,0.24);
  animation: scaleIn 250ms ease;
  max-height: 90vh;
  overflow-y: auto;
}
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.modal__title { font: 600 20px Inter; color: #1C2B33; letter-spacing: -0.3px; }
.modal__footer {
  display: flex; justify-content: flex-end; gap: 8px;
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid #E4DDD7;
}

/* Mobile: full-screen sheet */
@media (max-width: 640px) {
  .modal-overlay { align-items: flex-end; }
  .modal {
    border-radius: 16px 16px 0 0;
    max-height: 92vh;
    animation: slideUp 250ms ease;
  }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
```

---

## LOADING STATES

### Skeleton
```css
.skeleton {
  background: linear-gradient(90deg, #F0EDE9 25%, #E4DDD7 50%, #F0EDE9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 6px;
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
.skeleton--text   { height: 14px; }
.skeleton--title  { height: 20px; width: 60%; }
.skeleton--avatar { width: 40px; height: 40px; border-radius: 50%; }
.skeleton--button { height: 38px; width: 120px; border-radius: 8px; }
```

### Spinner
```tsx
// Use Loader2 from lucide-react with spin animation
<Loader2 className="animate-spin" size={16} color="#7A8F96" />
```

---

## TOAST / NOTIFICATIONS

```css
.toast {
  position: fixed; bottom: 24px; right: 24px;
  background: #1C2B33;
  color: #FFFFFF;
  border-radius: 10px;
  padding: 14px 18px;
  font: 500 14px Inter;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 8px 24px rgba(28,43,51,0.24);
  animation: slideInRight 250ms ease;
  z-index: 9999;
  max-width: 380px;
}
.toast--success { border-left: 3px solid #2D9B6F; }
.toast--error   { border-left: 3px solid #DC3545; }
.toast--warning { border-left: 3px solid #D97706; }
.toast--info    { border-left: 3px solid #4297A0; }

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Mobile: full-width at bottom */
@media (max-width: 640px) {
  .toast { left: 16px; right: 16px; bottom: 80px; } /* above bottom nav */
}
```

---

## EMPTY STATES

```tsx
// Every list/table page has this when empty
<div className="empty-state">
  <div className="empty-state__icon-wrap">
    <IconComponent size={48} color="#AEBFC6" />
  </div>
  <h3 className="empty-state__title">{title}</h3>
  <p className="empty-state__subtitle">{subtitle}</p>
  {action && <Button variant="primary">{action}</Button>}
</div>
```

```css
.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
.empty-state__icon-wrap {
  width: 88px; height: 88px;
  background: #F0EDE9;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.empty-state__title    { font: 600 16px Inter; color: #1C2B33; margin-bottom: 8px; }
.empty-state__subtitle { font: 400 14px Inter; color: #7A8F96; max-width: 300px; line-height: 1.5; margin-bottom: 24px; }
```

---

## MICRO-INTERACTIONS

All must respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Standard interactions:**
- Buttons: `translateY(-1px)` on hover, back on active — 150ms ease
- Cards (hover): `translateY(-2px)` + border color shift — 200ms ease
- Inputs: border color + background transition — 150ms ease
- Status badges: smooth fade when status changes — 200ms ease
- Numbers on dashboard load: count-up animation (0 → final value over 800ms) — only on first load
- Modal enter: scale(0.96)+fade → scale(1) — 250ms ease
- Toasts: slide from right, auto-dismiss after 4s with fade
- Copy to clipboard: icon swaps to checkmark for 1.5 seconds
- Error states: subtle horizontal shake (3 quick oscillations, 8px) — 300ms
- Success checkmark: SVG stroke draws in — 400ms
- Sidebar: collapses to icon-only at 1024px — 250ms ease

---

## ACCESSIBILITY

- WCAG AA minimum: 4.5:1 contrast for body text, 3:1 for large text and UI components
- Focus indicator: `2px solid #4297A0`, `outline-offset: 2px` — always visible
- Touch targets: minimum 44×44px on all interactive elements (48px on mobile)
- `aria-label` on all icon-only buttons
- `aria-live="polite"` on async-loading content and form errors
- `aria-busy="true"` on loading states
- All modals trap focus and restore on close
- Keyboard navigation: Tab order matches visual order
- Color never used as the ONLY indicator (always pair with text or icon)

---

## DO-NOTS (ABSOLUTE — SAME RULES AS SALONTRANSACT)

```
❌ Pure black #000000 — use #1C2B33
❌ Pure white page background — use #FAF8F6
❌ Emojis anywhere in the portal UI
❌ font-weight 700+ except numbers ≥ 32px
❌ border-radius > 16px except avatars and pills
❌ Uppercase text below 11px (illegible)
❌ Single-layer shadows (always the layered Shadow 2 pattern)
❌ Linear transitions (always ease)
❌ Breaking the 8px spacing grid
❌ Text below 11px
❌ Modifying existing UI files when only a data fix is needed
❌ Pure white card on pure white page (cards must have border)
❌ Generic blue (#3B82F6) as accent — use brand teal (#4297A0) for info states
❌ Tailwind classes that conflict with Payroc Hosted Fields class names
   (card-number, card-cvv, card-expiry, card-holder — these are reserved)
```

---

## VERTICAL-SPECIFIC UI ADAPTATIONS

The sidebar, dashboard, and terminology adapt per vertical via `VerticalConfig`. The design tokens never change — only content and layout priorities shift.

### Salon — Layout Priority
- **Primary action:** Book Appointment (top of sidebar, prominent)
- **Dashboard hero:** Today's revenue + chair utilization side by side
- **Secondary dashboard:** Stylist performance strip (horizontal scroll of stylist cards)
- **Accent color usage:** Blush (#E57F84) used liberally — it matches the beauty industry aesthetic
- **Color Studio link** elevated in sidebar (not buried in a submenu)

### Barbershop — Layout Priority
- **Primary action:** QUEUE (replaces calendar as primary view entirely)
- **Dashboard hero:** Live queue status — current wait time as the hero number
- **Queue board** is a full-page view with large text (designed for TV display)
- Blush accent is toned down — more masculine palette weights toward the primary teal

### Restaurant — Layout Priority
- **Primary action:** Floor Plan (live table status)
- **Dashboard hero:** Covers tonight + revenue + active tables
- KDS is a separate full-screen mode (dark background, optimized for kitchen environment)
- No blush accent in restaurant — teal is primary throughout

### Gym — Layout Priority
- **Primary action:** Check In / Front Desk
- **Dashboard hero:** Active members in building + today's class capacity
- Member health metrics use progress bars prominently
- Membership revenue is the primary financial metric (not per-transaction)

### Med Spa — Layout Priority
- **Primary action:** Today's Treatments
- **Color**: Most restrained use of blush — clinical contexts need calm, not promotional
- Patient records get a distinct visual treatment (slightly different card style) to signal "this is medical data"
- HIPAA indicators visible on any screen that shows protected health information

---

# KASSE_STAFF_APP.md (Embedded Section)
## Staff Mobile App — Native iOS/Android
### The Square Appointments Equivalent — And Then Some

---

## WHY THIS EXISTS

Square cracked the code on this. They understood that a salon owner and a stylist have completely different needs. The owner needs the big picture. The stylist needs their schedule, their client's info, and a way to take payment — and they need it on their phone because they're at a station, not at a desk.

Square's three-app approach (Teams, Appointments, Checkout) proves the concept. Kasse does it better: **one app, role-aware.**

When a stylist logs into the Kasse Staff App, they see their view. When the owner logs in, they see their view. Same app, same codebase, different experience based on role.

---

## THE KASSE STAFF APP — FEATURE SPECIFICATION

### App Architecture

**Tech Stack:** React Native (Expo) — single codebase for iOS and Android
**Auth:** Same NextAuth session as web portal (JWT, shared auth system)
**Offline:** Appointment schedule caches locally. View works offline. Actions queue and sync when connected.
**Permissions:** Role-based UI rendering — same roles as web portal (Owner, Manager, Staff)

### Role-Based Home Screens

**OWNER HOME SCREEN:**
```
┌─────────────────────────────────┐
│  Good morning, Robert.          │
│  Tuesday, May 3                 │
├─────────────────────────────────┤
│  TODAY AT LUXE HAIR STUDIO      │
│  ┌───────────┐  ┌───────────┐   │
│  │  $2,840   │  │    41     │   │
│  │ Revenue   │  │Appts Left │   │
│  └───────────┘  └───────────┘   │
│  ┌───────────┐  ┌───────────┐   │
│  │   6/8     │  │   72%     │   │
│  │Stylists In│  │  Chair    │   │
│  │           │  │   Util    │   │
│  └───────────┘  └───────────┘   │
├─────────────────────────────────┤
│  ALERTS                         │
│  ⚠️ Wella Blondor low stock     │
│  ⚠️ 2 unconfirmed appointments  │
│  ✓ 3 new online bookings        │
├─────────────────────────────────┤
│  STYLIST STATUS                 │
│  Jennifer ● With client (85min) │
│  Marcus   ● Available now       │
│  Lisa     ● Break (15min)       │
│  Ashley   ● Next: 2:30pm        │
├─────────────────────────────────┤
│  [View Full Schedule]           │
│  [Run Today's Report]           │
└─────────────────────────────────┘
```

**STYLIST HOME SCREEN:**
```
┌─────────────────────────────────┐
│  Hey Jennifer 👋                │
│  Tuesday, May 3                 │
├─────────────────────────────────┤
│  YOUR DAY                       │
│  8 appointments · $1,240 est.   │
├─────────────────────────────────┤
│  NEXT UP — 9:00 AM              │
│  ┌─────────────────────────────┐│
│  │ Sarah Johnson               ││
│  │ Balayage + Toner · 2.5 hr  ││
│  │ ⚠️ Ammonia allergy on file  ││
│  │ Last visit: 8 weeks ago     ││
│  │ [View Client] [Check In]    ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  TODAY'S SCHEDULE               │
│  9:00  Sarah J. — Balayage      │
│  12:00 Maria G. — Root touch-up │
│  1:30  BLOCKED (lunch)          │
│  2:30  Amanda K. — Cut+color    │
│  4:00  New client — Consult     │
│  5:30  Lisa T. — Blowout        │
├─────────────────────────────────┤
│  YOUR EARNINGS TODAY            │
│  $0 so far · Est. $420 today    │
└─────────────────────────────────┘
```

---

### FEATURE 1 — SCHEDULE VIEW

The master view of the day. Inspired by Square Appointments but deeper.

**Day View (default):**
- Vertical timeline (30-min slots)
- Each appointment is a card with:
  - Client name (large)
  - Service + duration
  - Status indicator (confirmed / pending / checked in / in-service / done)
  - Alert badge if any flags (allergy, notes, no-show history, new client)
- Tap appointment → full client detail
- Long press → quick actions (check in, call client, reschedule, cancel)
- "Now" indicator — red line on current time
- Blocked time shows as gray (lunch, personal time)

**Week View (Owner/Manager):**
- Horizontal scroll — one column per stylist
- Color coded by stylist
- Tap any slot → create appointment
- Drag to reschedule (within same day — cross-day from web only)

**Availability toggle:**
- Stylists can toggle "Available for walk-ins" directly from app
- Instant broadcast to front desk view and online booking

---

### FEATURE 2 — CLIENT DETAIL (In-App)

When Jennifer taps "View Client" on Sarah's appointment:

```
┌─────────────────────────────────┐
│  ← Back    Sarah Johnson        │
│            Client since 2022    │
├─────────────────────────────────┤
│  📸  [photo]                    │
│  Sarah Johnson                  │
│  (361) 555-8821                 │
│  sarah@email.com                │
│  Relationship Score: 87/100 🟢  │
├─────────────────────────────────┤
│  ALERTS                         │
│  🚨 Ammonia allergy — always    │
│     use ammonia-free developer  │
│  💬 "Wants to go lighter"       │
│     (note from last visit)      │
├─────────────────────────────────┤
│  TODAY'S SERVICE                │
│  Balayage · Est. 2.5 hours      │
│  Deposit paid: $50              │
├─────────────────────────────────┤
│  FORMULA HISTORY                │
│  Mar 15 → Balayage              │
│  Wella Blondor 30vol            │
│  Target: level 9. Result: ⭐⭐⭐⭐ │
│  Jan 22 → Root touch-up         │
│  Koleston 7/0 + 20vol           │
│  [View All Formulas]            │
├─────────────────────────────────┤
│  VISIT HISTORY                  │
│  Mar 15 — Balayage + Toner $225 │
│  Jan 22 — Root touch-up   $95  │
│  Nov 30 — Cut + Blowout   $85  │
│  [View All Visits]              │
├─────────────────────────────────┤
│  [Call] [Text] [Check In] [POS] │
└─────────────────────────────────┘
```

**Key features:**
- Allergy alerts shown in RED at top — can't miss them
- Formula history directly accessible — stylist doesn't need to walk to a computer
- Quick call/text buttons (opens native phone/SMS app)
- Relationship score visible — gamifies client care

---

### FEATURE 3 — CHECK-IN FLOW

Stylist taps "Check In" on Sarah's appointment card.

```
Step 1: Confirm
┌─────────────────────────────────┐
│  Check In Sarah Johnson?        │
│  9:00 AM · Balayage · 2.5 hr   │
│                                 │
│  ALERTS:                        │
│  ⚠️ Ammonia allergy on file     │
│  ✓ Consent waiver on file       │
│  ✓ Card on file (ending 4242)   │
│                                 │
│  [Confirm Check-In]             │
│  [Cancel]                       │
└─────────────────────────────────┘

Step 2: Checked In
┌─────────────────────────────────┐
│  ✓ Sarah Johnson is checked in  │
│  9:03 AM                        │
│                                 │
│  NEXT:                          │
│  [Start Formula Card]           │
│  [View Client Profile]          │
│  [Skip — Start Service]         │
└─────────────────────────────────┘
```

---

### FEATURE 4 — FORMULA CARD (In-App)

The stylist builds the formula card on their phone while working. This is the killer feature Square doesn't have.

```
┌─────────────────────────────────┐
│  ← Formula Card                 │
│  Sarah Johnson · Today          │
├─────────────────────────────────┤
│  SERVICE: Balayage              │
├─────────────────────────────────┤
│  BEFORE PHOTO                   │
│  [📷 Take Photo]  [From Camera] │
├─────────────────────────────────┤
│  FORMULA BUILDER                │
│                                 │
│  Target level: [9 ▼]            │
│  Starting level: [6 ▼]          │
│                                 │
│  PRODUCTS USED                  │
│  + Add product                  │
│  ┌─────────────────────────────┐│
│  │ Wella Blondor Plex          ││
│  │ 60g + 30vol developer       ││
│  │ [Edit] [Remove]             ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Wella Koleston 8/1          ││
│  │ 60g + 20vol developer       ││
│  └─────────────────────────────┘│
│                                 │
│  PROCESSING TIME                │
│  [⏱️ 45 min] [Set Timer]        │
│                                 │
│  NOTES                          │
│  [Applied to mid-lengths and    │
│   ends only. Avoided roots.]    │
│                                 │
│  AFTER PHOTO                    │
│  [📷 Take Photo]                │
│                                 │
│  RESULT RATING                  │
│  ⭐⭐⭐⭐⭐ (tap to rate)           │
│                                 │
│  [Save Formula Card]            │
└─────────────────────────────────┘
```

**Processing Timer:**
- When stylist sets processing time (45 min), timer runs in background
- Notification fires at T-5 minutes: "Sarah's color is ready in 5 minutes"
- Tracks multiple timers simultaneously (multiple clients in-process)
- Timer shows on lock screen via iOS/Android notification

---

### FEATURE 5 — POS / CHECKOUT (In-App)

Full Square Appointments-parity checkout, plus more.

```
STEP 1 — Review Services
┌─────────────────────────────────┐
│  Checkout — Sarah Johnson       │
├─────────────────────────────────┤
│  SERVICES                       │
│  Balayage                $180   │
│  Toner                    $45   │
│  Blowdry                  $35   │
│  ─────────────────────────────  │
│  RETAIL                         │
│  + Add retail product           │
│  Olaplex No.3 ($28)      $28   │
│  ─────────────────────────────  │
│  Subtotal               $288   │
│                                 │
│  [Add item] [Add discount]      │
│  [Next: Tip →]                  │
└─────────────────────────────────┘

STEP 2 — Tip
┌─────────────────────────────────┐
│  Tip for Jennifer               │
│                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │  15% │  │  20% │  │  25% │  │
│  │ $43  │  │ $58  │  │ $72  │  │
│  └──────┘  └──────┘  └──────┘  │
│  [No tip]  [Custom amount]      │
│                                 │
│  Selected: 20% · $58            │
│  [Next: Payment →]              │
└─────────────────────────────────┘

STEP 3 — Payment
┌─────────────────────────────────┐
│  Total: $346                    │
│  (Services $288 + Tip $58)      │
│                                 │
│  PAYMENT METHOD                 │
│  ● Card on file (Visa ····4242) │
│    Charge $346                  │
│  ○ New card                     │
│  ○ Cash                         │
│  ○ Split payment                │
│                                 │
│  Deposit already paid: -$50     │
│  Amount to charge:   $296       │
│                                 │
│  [Charge $296]                  │
└─────────────────────────────────┘

STEP 4 — Success + Rebook
┌─────────────────────────────────┐
│  ✓ Payment Successful           │
│  $296 charged to Visa ····4242  │
│                                 │
│  Receipt sent to:               │
│  sarah@email.com ✓              │
│                                 │
│  ─────────────────────────────  │
│  REBOOK SARAH                   │
│  Jennifer is next available:    │
│  Thu May 15 · 9:30 AM           │
│  Thu May 15 · 2:00 PM           │
│  Fri May 16 · 11:00 AM          │
│  Mon May 19 · 10:00 AM          │
│                                 │
│  [Book May 15 @ 9:30]           │
│  [Show more times]              │
│  [Skip — Done]                  │
└─────────────────────────────────┘
```

**Beyond Square:**
- Deposit deducted automatically from total
- Card on file charged in one tap (no reader needed)
- Rebook prompt with Jennifer's specific availability — not generic "book again"
- Commission calculated instantly in background
- Formula card auto-attached to this transaction record

---

### FEATURE 6 — NOTIFICATIONS

Real-time notifications on the stylist's phone:

- "Your 9:00 AM (Sarah Johnson) has checked in"
- "Sarah's color timer — 5 minutes remaining"
- "New booking: Amanda K. tomorrow at 2:30 PM"
- "Amanda K. has cancelled her 2:30 PM"
- "Marcus wants to swap his 3:00 PM slot with you — [Accept/Decline]"
- "You've made $680 today 🎉" (end of day milestone)
- "Review from Sarah Johnson: ⭐⭐⭐⭐⭐" (instant review notification)
- "Low stock: Wella Blondor — you have 2 appointments using it tomorrow"

**Owner-specific notifications:**
- "No-show: Amanda K. didn't show for 2:30 PM. $50 deposit charged automatically."
- "New 5-star review: [preview]"
- "Today's revenue milestone: $3,000 🎉"
- "Inventory alert: 5 items below reorder threshold"
- "Marcus clocked out without completing his commission report"

---

### FEATURE 7 — COMMISSIONS & EARNINGS (Stylist View)

Stylists see their own earnings in real-time:

```
┌─────────────────────────────────┐
│  My Earnings — Jennifer         │
├─────────────────────────────────┤
│  TODAY                          │
│  Services:        $612          │
│  Retail sold:      $84          │
│  Commission (45%): $315         │
│  Tip:             $148          │
│  Total earned:    $463          │
│  Appointments:       6          │
├─────────────────────────────────┤
│  THIS WEEK (Mon–today)          │
│  Services:      $2,840          │
│  Commission:    $1,278          │
│  Tips:            $620          │
│  Total:         $1,898          │
├─────────────────────────────────┤
│  THIS MONTH                     │
│  Commission:    $4,920          │
│  Tips:          $2,340          │
│  Total:         $7,260          │
│  [View Full Report]             │
└─────────────────────────────────┘
```

**What this means:** A stylist knows exactly what they're making, in real time, without asking the owner. This eliminates one of the most common sources of friction between salon owners and stylists — "when does my paycheck show up and is it right?"

---

### FEATURE 8 — SCHEDULE MANAGEMENT (Stylists Set Their Own)

Beyond Square: stylists manage their own availability from the app.

```
┌─────────────────────────────────┐
│  My Availability — Jennifer     │
├─────────────────────────────────┤
│  REGULAR HOURS                  │
│  Mon  9:00 AM – 6:00 PM  ●      │
│  Tue  9:00 AM – 6:00 PM  ●      │
│  Wed  OFF                 ○     │
│  Thu  10:00 AM – 7:00 PM ●      │
│  Fri  9:00 AM – 5:00 PM  ●      │
│  Sat  9:00 AM – 4:00 PM  ●      │
│  Sun  OFF                 ○     │
│                                 │
│  [Edit Regular Hours]           │
├─────────────────────────────────┤
│  TIME OFF REQUESTS              │
│  May 20–24 · Vacation           │
│  Status: ✓ Approved             │
│                                 │
│  [Request Time Off]             │
├─────────────────────────────────┤
│  BLOCKED TIMES (this week)      │
│  Tue 1:00 – 2:00 PM (lunch)     │
│  Thu 3:00 PM (school pickup)    │
│                                 │
│  [Add Block]                    │
└─────────────────────────────────┘
```

**Owner sees:** All requested time off in a single approval queue. Approve/deny with one tap. Approved time-off auto-blocks the stylist's calendar and stops new bookings in that window.

---

### FEATURE 9 — WALK-IN QUEUE (Barbershop Mode)

For barbershop vertical, the app transforms:

**Barber App — Queue View:**
```
┌─────────────────────────────────┐
│  Marcus's Queue — Tuesday       │
├─────────────────────────────────┤
│  IN CHAIR NOW                   │
│  John D. · Fade + lineup        │
│  ⏱️ 18 min in chair             │
│  [Mark Done]                    │
├─────────────────────────────────┤
│  YOUR QUEUE (3 waiting)         │
│  1. Mike R.  · Haircut  ~15min  │
│  2. Carlos P.· Fade     ~20min  │
│  3. James T. · Cut+Beard ~25min │
├─────────────────────────────────┤
│  WALK-IN QUEUE (ALL BARBERS)    │
│  Total waiting: 7               │
│  Est. wait: 35 min              │
│                                 │
│  [Pull Next Walk-In]            │
└─────────────────────────────────┘
```

One tap on "Mark Done" → queue advances → next client auto-texted "You're up!"

---

### FEATURE 10 — STAFF SCHEDULE SWAP (Beyond Square)

Square doesn't have this. Kasse does.

When Jennifer can't make a shift:
1. Opens app → Today's Schedule → tap "I can't make this appointment"
2. Kasse checks which other stylists are available and can perform the service
3. Shows: "Marcus is available at 2:30 PM and can do this service. Request swap?"
4. Tap send → Marcus gets notification: "Jennifer is requesting you cover her 2:30 PM. Client: Sarah J, Service: Cut + Color. [Accept] [Decline]"
5. Marcus accepts → appointment moves to Marcus's schedule → Sarah gets SMS: "Your appointment at 2:30 PM is confirmed with Marcus"
6. Owner notified: "Jennifer's 2:30 PM shifted to Marcus (accepted)"

No phone calls. No group texts. No owner mediation required.

---

### FEATURE 11 — CLIENT INTAKE ON ARRIVAL (New Client Flow)

New client walks in. Stylist or front desk taps "New Client":

```
┌─────────────────────────────────┐
│  New Client Intake              │
│  Hand phone to client to fill   │
├─────────────────────────────────┤
│  CONTACT INFO                   │
│  Full name: [                 ] │
│  Phone:     [                 ] │
│  Email:     [                 ] │
│  Birthday:  [     ] (optional)  │
├─────────────────────────────────┤
│  SERVICE TODAY                  │
│  [Select service...]            │
├─────────────────────────────────┤
│  HEALTH NOTES                   │
│  Any allergies or               │
│  sensitivities?                 │
│  [                            ] │
│                                 │
│  Scalp conditions?              │
│  [ ] Sensitive  [ ] Psoriasis   │
│  [ ] Dandruff   [ ] None        │
├─────────────────────────────────┤
│  CHEMICAL SERVICE WAIVER        │
│  [Waiver text displayed here]   │
│                                 │
│  [✓ I agree to the terms]       │
│                                 │
│  Signature: [                 ] │
│  (draw on screen)               │
├─────────────────────────────────┤
│  [Submit →]                     │
└─────────────────────────────────┘
```

Client fills this out on the stylist's phone. When submitted:
- Client profile created in Kasse
- Waiver stored with timestamp and device signature
- Allergies added as permanent alert on profile
- Stylist notified: "New client [Name] is ready for you"

Total time: 2 minutes. Completely paperless.

---

### APP NAVIGATION — ROLE BASED

**Stylist Bottom Nav (4 tabs):**
```
[Schedule] [Clients] [Checkout] [Earnings]
```

**Manager Bottom Nav (4 tabs):**
```
[Overview] [Schedule] [Clients] [Reports]
```

**Owner Bottom Nav (5 tabs):**
```
[Dashboard] [Schedule] [Clients] [Reports] [More]
```

"More" expands to: Staff, Inventory, Marketing, Settings, AI Receptionist log

---

### HOW THIS BEATS SQUARE APPOINTMENTS

| Feature | Square Appointments | Kasse Staff App |
|---------|-------------------|-----------------|
| Schedule view | ✓ Yes | ✓ Yes (+ week view by stylist) |
| Client details | ✓ Basic | ✓ Full history + relationship score + formula history |
| Checkout + tips | ✓ Yes | ✓ Yes + deposit deduction auto |
| Card on file | ✓ Yes | ✓ Yes + one-tap charge |
| Rebook at checkout | ✓ Basic | ✓ With specific stylist availability |
| Commission view | ✓ Limited | ✓ Real-time, per service, weekly/monthly |
| Formula cards | ✗ No | ✓ Full formula builder with timer |
| Before/after photos | ✗ No | ✓ Stored to client profile, Instagram-ready |
| Processing timer | ✗ No | ✓ Runs in background, lock screen notification |
| Allergy alerts | ✗ No | ✓ Prominently displayed at check-in |
| Schedule swap | ✗ No | ✓ Peer-to-peer shift swap with owner approval |
| Walk-in queue | ✗ No | ✓ Digital queue with TV board |
| Earnings real-time | ✗ No | ✓ Live earnings dashboard |
| Staff availability mgmt | ✓ Limited | ✓ Self-managed availability + time-off requests |
| New client intake | ✗ No | ✓ Full digital intake + waiver on device |
| Role-aware UI | ✗ (separate apps) | ✓ One app, adapts by role |

---

## BUILD PHASE FOR STAFF APP

**Phase 3 — MVP Staff App:**
- Schedule view (stylist own schedule)
- Client detail view (basic info + history)
- Check-in flow
- Checkout flow (card on file + tip)
- Push notifications (appointment reminders, check-in alert)

**Phase 3.5 — Formula + Intake:**
- Formula card builder (full)
- Processing timer
- Before/after photo capture
- New client intake on-device

**Phase 5 — Full Parity + Beyond:**
- Real-time earnings dashboard
- Schedule management (availability, time-off requests)
- Staff swap feature
- Owner dashboard view
- Queue mode (barbershop)

**Phase 6 — Polish + Platform:**
- Offline mode (full local caching)
- Android optimization
- App Store and Play Store submission
- In-app onboarding tour (for new staff members)

---

*Document version 1.0 — For internal use only. Last updated: May 2026.*
*Owner: Robert Reyna, CEO, 36 West Holdings*
*Design tokens are the source of truth — all component code must reference these variables, never hardcode hex values.*
