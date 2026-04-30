# KASSE UI PRINCIPLES
## Design System and Visual Language

**Version:** 1.0 | **Status:** LOCKED

---

## DESIGN PHILOSOPHY

Kasse must feel like the Apple of POS software. Not the most feature-rich. Not the cheapest. The most premium, the most intuitive, and the most beautiful. Every pixel must communicate trust, professionalism, and power.

**Three design mandates:**
1. **Clarity over cleverness** — The front desk is processing payments with a line of clients waiting. Every action must be obvious in under 1 second.
2. **Data density without overwhelm** — Show everything an owner needs, hide everything they don't. Progressive disclosure.
3. **Premium at every touchpoint** — Login screen, email template, receipt, error message — all must feel like a $500/month product.

---

## COLOR SYSTEM

### Light Theme (Portal — Default)
```
Page background:    #f7f8fa   (Square's off-white — not pure white, slightly warm)
Card/Panel:         #ffffff   (Pure white — pops against page bg)
Card hover:         #f9fafb   (Subtle hover on table rows)
Input background:   #ffffff

Border default:     #e5e7eb   (One border color for everything — Square's approach)
Border strong:      #d1d5db   (Focused states, modal edges)
Border accent:      #606E74   (Brand accent borders)

Text primary:       #111827   (Near black — not pure black, softer)
Text secondary:     #6b7280   (Labels, descriptions, captions)
Text muted:         #9ca3af   (Placeholders, timestamps, metadata)
Text accent:        #606E74   (Links, interactive hints)

Brand primary:      #606E74   (Kasse slate teal — the signature color)
Brand hover:        #4d5c62   (Darker on light backgrounds)
Brand light:        rgba(96,110,116,0.08)  (Tinted backgrounds)

Success:            #16a34a   bg: rgba(22,163,74,0.08)
Warning:            #d97706   bg: rgba(217,119,6,0.08)
Error:              #dc2626   bg: rgba(220,38,38,0.08)
Info:               #2563eb   bg: rgba(37,99,235,0.08)
```

### Dark Theme (Admin Portal + AI Receptionist panels)
```
Base:               #06080d
Surface 1:          #0d1117
Surface 2:          #111920
Border:             rgba(255,255,255,0.07)
Text primary:       #f0f4f8
Text secondary:     #8896a0
Text muted:         #4a5568
```

### Shadow System
```css
/* Standard card — light theme */
.shadow-card {
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.06),
    0 1px 2px rgba(0,0,0,0.06),
    0 4px 8px rgba(0,0,0,0.04);
}

/* Elevated — modals, dropdowns */
.shadow-elevated {
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.08),
    0 4px 8px rgba(0,0,0,0.08),
    0 16px 32px rgba(0,0,0,0.10);
}

/* Dark theme card */
.shadow-card-dark {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.03),
    0 0 0 1px rgba(0,0,0,0.4),
    0 4px 8px rgba(0,0,0,0.2);
}
```

---

## TYPOGRAPHY

### Font Stack
```
Primary:  "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Mono:     "Inter" (same font, tabular numbers feature)
```

**Why Inter:** Same font as Stripe, Linear, Vercel. Industry standard for premium SaaS. Excellent at small sizes. Excellent number rendering with tabular-nums feature.

### Type Scale
```
10px  — Legal, badges, chips
11px  — Timestamps, metadata, table sort indicators
12px  — Table headers (uppercase, tracked), secondary badges
13px  — Secondary labels, captions, sidebar nav section labels
14px  — Body text, form labels, nav items (base)
15px  — Emphasized body, modal body copy
16px  — All form inputs (minimum — prevents iOS zoom)
18px  — Card titles, section headers
22px  — Page headings
28px  — Display headings, onboarding titles
32px  — KPI numbers on dashboard
36px  — Hero KPI numbers
```

### Font Weights
```
400 — Regular body copy
500 — Medium labels, secondary navigation
600 — Semibold headings, buttons, important labels
700 — Bold KPI numbers, page titles, logo only
```
**Rule:** Never use 800 or 900 weights. Never use 300 (too thin at small sizes).

### Letter Spacing
```
Body text:     -0.31px  (slight tightening — feels premium, less airy)
Headings:      -0.5px   (tighter for display text)
Uppercase:     +0.06em  (loosen uppercase labels — e.g., table headers "REVENUE")
Logo/brand:    +0.15em  (wide tracking for wordmarks)
```

### Number Rendering
```css
/* All financial figures, timestamps, counts */
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum";
```
This makes numbers align in columns properly without a separate monospace font.

---

## SPACING SYSTEM

```
Base unit: 4px

--space-1:   4px   (tight inline spacing)
--space-2:   8px   (icon gap, tight padding)
--space-3:   12px  (button padding, small gap)
--space-4:   16px  (standard gap)
--space-5:   20px  (card padding mobile)
--space-6:   24px  (card padding, section gap)
--space-8:   32px  (page padding, large section gap)
--space-10:  40px  (hero section spacing)
--space-12:  48px  (onboarding padding)
--space-16:  64px  (max content padding)
```

---

## BORDER RADIUS

```
--radius-xs:   3px    (badges, small chips)
--radius-sm:   4px    (legacy badge style)
--radius-md:   6px    (buttons, inputs)
--radius-lg:   8px    (cards, panels)
--radius-xl:   12px   (modals, larger cards)
--radius-2xl:  16px   (onboarding cards)
--radius-full: 9999px (pills, avatars, toggles)
```

---

## COMPONENT STANDARDS

### Buttons
```
Height:         36px (compact), 40px (standard), 44px (prominent), 52px (hero CTA)
Border radius:  6px (all buttons)
Font:           14px, weight 600
Transition:     all 140ms cubic-bezier(0.4, 0, 0.2, 1)

Primary:        bg #606E74, white text, hover #4d5c62, active scale(0.98)
Secondary:      bg white, text #111827, border #e5e7eb, hover bg #f9fafb
Ghost:          bg transparent, text #6b7280, hover bg #f9fafb
Danger:         bg #dc2626, white text, hover #b91c1c
Link:           bg transparent, text #606E74, no border, hover underline

Disabled state: opacity 0.5, cursor not-allowed
Loading state:  spinner inside button, text "Loading..."
```

### Inputs
```
Height:         44px (all inputs — prevents iOS zoom)
Border radius:  6px
Font size:      16px (minimum — prevents iOS zoom)
Border:         1px solid #e5e7eb
Background:     white
Text:           #111827
Placeholder:    #9ca3af

Focus:          border #606E74
                box-shadow 0 0 0 3px rgba(96,110,116,0.12)
                transition 150ms

Error state:    border #fca5a5
                background #fff5f5
                error message below: 12px, #dc2626, AlertCircle icon

Label:          13px, weight 600, #374151
                margin-bottom 6px
Required mark:  <span style="color: #ef4444">*</span>
```

### Cards
```
Background:     white
Border:         1px solid #e5e7eb
Border radius:  8px
Shadow:         shadow-card class
Padding:        24px (standard), 20px (compact), 32px (spacious)
```

### Tables
```
Header:         13px, weight 600, #6b7280, uppercase, letter-spacing 0.06em
                padding 10px 16px, border-bottom 1px #e5e7eb
Row:            14px, #111827, padding 12px 16px
                border-bottom 1px #f3f4f6
                hover: background #f9fafb, transition 120ms
Last row:       no border-bottom
Sort indicators: ChevronUp/Down icons, 12px, #9ca3af
```

### Status Badges
```
Padding:        2px 8px (small), 3px 10px (standard)
Border radius:  4px
Font:           11px, weight 600, letter-spacing 0.04em, uppercase
Border:         1px solid (matching color at 20% opacity)

Colors follow semantic system: success/warning/error/info
Custom neutral: bg rgba(0,0,0,0.04), color #6b7280
```

### Modals
```
Overlay:        rgba(0,0,0,0.4), backdrop-filter blur(4px)
Card:           white, border-radius 12px, shadow-elevated
Width:          480px (standard), 600px (large), full-screen (drawer)
Header:         18px title, font-weight 700, X close button top-right
Body:           24px padding
Footer:         display flex, justify flex-end, gap 8px
Animation:      translateY(8px) → 0, opacity 0 → 1, 200ms ease-out
```

### Toggle Switches
```
Width: 44px, height: 24px, border-radius: 999px
Off:   bg #e5e7eb
On:    bg #606E74
Knob:  18px circle, white, shadow, transitions left 150ms
```

---

## LAYOUT PRINCIPLES

### Sidebar Navigation (Desktop)
- Width: 220px (Square-standard)
- Background: white
- Border-right: 1px solid #e5e7eb
- Nav items: 40px height, flat list (no nested folders)
- Active: bg rgba(96,110,116,0.08), color #606E74, weight 600
- Icons: lucide-react, 18px, strokeWidth 1.5
- Bottom: "Take payment" primary button + icon row

### Page Structure
```
Page header:    white bg, border-bottom 1px #e5e7eb, padding 28px 32px
                section label (11px uppercase #9ca3af) + page title (22px bold) + primary CTA
Content area:   padding 24px 32px, max-width 1200px
```

### Content Width
```
Narrow (forms):     480px max
Standard (pages):   800px max
Wide (tables):      1200px max
Full (calendar):    no max-width
```

---

## ICONS

**Library:** lucide-react exclusively.
**Default size:** 18px
**StrokeWidth:** 1.5 (never 2, never 1)
**Color:** Inherit from parent or explicitly #9ca3af (muted), #606E74 (accent), #111827 (active)

**No emojis anywhere in the portal.** Ever.

---

## ANIMATION PRINCIPLES

```css
/* Standard transition */
transition: all 140ms cubic-bezier(0.4, 0, 0.2, 1);

/* Page element entrance */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Modal entrance */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
```

**Rules:**
- No animation longer than 300ms for interactions
- No animation longer than 500ms for page loads
- Always respect `prefers-reduced-motion`
- Loading spinners: 16px, border-style, #606E74 color

---

## MOBILE PRINCIPLES

- Minimum touch target: 44px × 44px (all buttons, nav items, toggles)
- Minimum font size on inputs: 16px (prevents iOS zoom)
- Safe area insets: `env(safe-area-inset-*)` on bottom nav, fixed elements
- Bottom nav on mobile (5 items max)
- Tables → cards on mobile (hide table, show card list)
- Modals → full-screen drawers on mobile
- No horizontal scroll on any page

---

## EMAIL DESIGN

- Max width: 560px, centered
- Header: dark bg (#0a0c0e), kasse. wordmark centered, white
- Body: white bg, 40px padding
- Body font: system sans-serif (not web font — email clients don't load them reliably)
- CTA button: #606E74 bg, white text, inline style (not CSS class)
- Footer: #f9fafb bg, business address (CAN-SPAM), unsubscribe link
- "Powered by SalonTransact" in footer
- Table-based layout (Outlook compatible)
- Preheader text (hidden — improves spam score)
- X-Entity-Ref-ID header on every send (prevents duplicate detection)
