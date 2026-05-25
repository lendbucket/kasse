---
# UI feedback log

Running log of UI/UX feedback collected during the build. These items are
**intentionally deferred** until the design polish phase (P12) to keep the
foundation phases focused. Adding items here is the right move when something
feels off — fixing them piecemeal during P0–P9 derails the build.

Each entry should capture: where the issue was observed, what specifically
felt wrong, and any thoughts on the right fix. Don't pre-judge severity — the
P12 designer will triage.

---

## 2026-05-16 — Kasse Admin Portal feels generic / monochrome

**Where:** `/admin` (Kasse Admin Overview), and likely all `/admin/*` sub-pages.

**What felt wrong:**
- Whole dashboard is roughly the same dark-slate value top to bottom — no visual hierarchy. Eye doesn't know where to land first.
- Metric cards (Total Merchants, Active Trials, MRR, Total Locations) have a lot of internal padding for the amount of content shown. Numbers are huge but isolated — no trend indicators, no period context, no comparison to prior period.
- "Recent signups" header floats in negative space — no surrounding context or section treatment.
- Table rows are flat — no hover state, no per-row actions, no visual differentiation between trial vs starter beyond a small badge.
- Sidebar items are bland stock-icon + text labels. No grouping, no active-state polish beyond a fill color.
- Color usage is timid — green/blue/yellow icon backgrounds are the only accents, and they don't reinforce hierarchy (every metric gets equal visual weight even though MRR is the most important metric to a CEO).

**Thoughts on direction (for P12 designer):**
- Make MRR the dominant metric. Larger card, top-left or full-width banner.
- Add period-over-period change indicators (▲ +12% vs last month) on all metric cards.
- Table rows: subtle hover lift, per-row actions menu, status colors beyond badges.
- Sidebar: section headers ("Platform", "Operations", "Settings"), better active-state, possibly a "Quick switch" CMD+K affordance for power users.
- Consider a more distinctive accent color than the current teal-slate to give Kasse a signature feel. Reyna Pay green and Kasse's stay-distinct branding matters as the empire scales.

**Status:** Deferred to P12 (UI polish phase).

---

## How to add an entry

Append a new dated section above. Format:
YYYY-MM-DD — Short title
Where: Page or feature.
What felt wrong: Specifics.
Thoughts on direction: Optional notes for the designer.
Status: Deferred to P12.

Keep entries factual and concrete. "The dashboard feels bad" is not actionable; "the four metric cards have equal visual weight even though MRR matters most" is actionable.

---

## 2026-05-18 — Admin / Feature Flags

**Where:** `/admin/feature-flags/[id]` flag detail page

**What felt wrong:** The reason text field is shared state between the main
"Save changes" form and the "Add override" form. If a user types a reason for
a flag-level change, then switches to add a per-org override, the reason gets
attached to the override action instead. Functional but fragile UX.

**Thoughts on direction:** Split into separate `flagReason` and `overrideReason`
fields. Or, when toggling between forms, clear the reason. Tooltip explaining
which action each field applies to.

**Status:** Deferred to P12 (UI polish phase).

---

## 2026-05-25 — Onboarding wizard ProgressBar — ARIA + interactive children

**Where:** `components/onboarding/ProgressBar.tsx` (shipped in PR #120,
P1.B.1 wizard shell)

**What felt wrong:** The progress bar uses `role="progressbar"` on a
`<div>` whose children are interactive `<button>` elements (for tap-to-
jump-back on completed steps). The `progressbar` role implies a non-
interactive status widget, so nesting interactive controls inside it
is semantically odd — axe and similar a11y tools will likely flag this.
Reviewer of PR #120 cycle 1 raised the concern with the explicit framing
"works and is better than no ARIA at all... will need revisiting before
a11y sign-off."

**Thoughts on direction (for P12 designer + a11y reviewer):**
- Consider an `<ol>` (or `<nav>` containing an `<ol>`) instead of a
  `<div role="progressbar">`. The "ordered list of steps, some
  navigable" model fits better.
- Each step segment becomes an `<li>` with either a `<button>` (for
  navigable completed steps) or a plain element with `aria-current="step"`
  for the active step and `aria-disabled` for future steps.
- Drop the `aria-valuemin`/`valuemax`/`valuenow` attributes — those are
  for continuous-value progress bars (e.g., file upload %), not for
  discrete wizard steps.
- Add an `aria-label` on the outer container like "Onboarding step 3 of
  8" or use a visually-hidden `<h2>` for screen readers.
- Keep the visual design unchanged — this is a semantic markup migration
  only, not a redesign.

**Status:** Deferred to P12 (UI polish phase).
