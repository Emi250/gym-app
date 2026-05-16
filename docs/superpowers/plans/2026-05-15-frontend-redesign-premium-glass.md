# Premium Glass Frontend Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Gym Tracker PWA with a Premium Glass / amber visual language — OLED-dark translucent surfaces, refined Geist typography, subtle motion — without changing any functionality.

**Architecture:** Token-first. The design tokens in the `@theme` block of `app/globals.css` drive every component through semantic Tailwind classes (`bg-bg-elevated`, `border-border`, `bg-accent`). Rewriting tokens transforms the app globally; per-primitive tasks add the glass details tokens cannot carry (backdrop-blur, inset highlight, gradient CTA); the screen sweep verifies and applies targeted tweaks.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (`@theme`), `class-variance-authority`, Vitest + Testing Library, pnpm.

**Conventions for every task:**
- This is a visual re-skin. Existing tests guard component APIs/behavior — they must keep passing, not be rewritten. No new tests unless a task says so.
- Verification commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`. Visual checks use `pnpm dev` (http://localhost:3000).
- Reference spec: `docs/superpowers/specs/2026-05-15-frontend-redesign-premium-glass-design.md`.
- Commit after each task.

---

## Task 1: Redesign tokens

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Rewrite the `@theme` block and `html`/`body` rules**

Replace the `@theme { ... }` block and the `html` and `body` rules in `app/globals.css` with:

```css
@theme {
  --color-bg: #070707;
  --color-bg-elevated: rgb(255 255 255 / 0.04);
  --color-bg-elevated-2: rgb(255 255 255 / 0.08);
  --color-border: rgb(255 255 255 / 0.08);
  --color-fg: #f5f5f5;
  --color-fg-muted: #a1a1aa;
  --color-accent: #f59e0b;
  --color-accent-fg: #2a1c08;
  --color-danger: #ef4444;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --shadow-card: inset 0 1px 0 rgb(255 255 255 / 0.05);
  --shadow-overlay: 0 16px 48px rgb(0 0 0 / 0.7);
  --radius-control: 0.75rem;
  --radius-card: 1.25rem;
  --animate-fade-in: fade-in 0.18s ease-out;
}
```

```css
html {
  background: #070707;
  color: var(--color-fg);
  color-scheme: dark;
}

body {
  background:
    radial-gradient(ellipse 80% 50% at 82% 0%, rgb(245 158 11 / 0.07), transparent 60%),
    #070707;
  background-attachment: fixed;
  color: var(--color-fg);
  font-family: var(--font-sans), system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: contain;
}
```

Leave the `@keyframes fade-in`, `@utility pt-safe`, `@utility pb-safe`, the `@media (pointer: coarse)` block, and the number-input rules unchanged.

- [ ] **Step 2: Update the PWA theme color**

In `app/layout.tsx`, change `viewport.themeColor` from `"#0a0a0a"` to `"#070707"`.

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass (token rename is transparent to component classes).

- [ ] **Step 4: Visual check**

Run `pnpm dev`, open http://localhost:3000. Expected: app is darker, surfaces are translucent, a faint amber glow sits in the top-right, buttons/active states are amber.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "Redesign theme tokens for Premium Glass language"
```

---

## Task 2: Card primitive

**Files:**
- Modify: `components/ui/card.tsx`
- Test: `components/ui/card.test.tsx` (must keep passing)

- [ ] **Step 1: Update the card styles**

Replace the `cardStyles` cva definition in `components/ui/card.tsx` with:

```tsx
const cardStyles = cva(
  "bg-bg-elevated border-border rounded-card border shadow-card backdrop-blur-sm",
  {
    variants: {
      padding: { none: "", sm: "p-3", md: "p-4", lg: "p-5" },
      interactive: {
        true: "transition-colors hover:bg-bg-elevated-2 active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: { padding: "md", interactive: false },
  },
);
```

Add `interactive` to the destructured props and pass it into `cardStyles({ padding, interactive })`. `CardProps` already extends `VariantProps<typeof cardStyles>`, so the new prop is typed automatically.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test -- card`
Expected: pass. If `card.test.tsx` asserts the exact class string `rounded-2xl`, update that assertion to `rounded-card` — this is the one allowed test edit.

- [ ] **Step 3: Commit**

```bash
git add components/ui/card.tsx components/ui/card.test.tsx
git commit -m "Apply glass surface and interactive variant to Card"
```

---

## Task 3: BigButton primitive

**Files:**
- Modify: `components/ui/big-button.tsx`

- [ ] **Step 1: Update button variants**

In `components/ui/big-button.tsx`, replace the `variants.variant` block with:

```tsx
variant: {
  primary:
    "bg-[linear-gradient(135deg,#f59e0b,#d97706)] text-accent-fg shadow-card",
  secondary: "bg-bg-elevated text-fg border border-border backdrop-blur-sm",
  ghost: "text-fg hover:bg-bg-elevated",
  danger: "bg-danger text-fg",
},
```

In the base class string, change `rounded-2xl` to `rounded-card` and `transition-colors` to `transition-[transform,background-color,opacity] duration-150 ease-out`.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`, the Home "Empezar a entrenar" button shows the amber gradient; press feedback is quick.

- [ ] **Step 4: Commit**

```bash
git add components/ui/big-button.tsx
git commit -m "Apply amber gradient and refined motion to BigButton"
```

---

## Task 4: IconButton primitive

**Files:**
- Modify: `components/ui/icon-button.tsx`

- [ ] **Step 1: Update icon button styles**

In `components/ui/icon-button.tsx`, replace the base class string in `iconButtonStyles` with:

```tsx
"flex shrink-0 items-center justify-center rounded-full text-fg-muted " +
  "bg-bg-elevated border border-border backdrop-blur-sm " +
  "transition-[transform,background-color,color] duration-150 ease-out " +
  "hover:text-fg hover:bg-bg-elevated-2 active:scale-95 disabled:opacity-30 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/icon-button.tsx
git commit -m "Apply glass surface to IconButton"
```

---

## Task 5: Field, Input, Select primitives

**Files:**
- Modify: `components/ui/field.tsx`

- [ ] **Step 1: Update the control surface and focus ring**

In `components/ui/field.tsx`, replace the `controlStyles` constant with:

```tsx
const controlStyles =
  "bg-bg-elevated border-border h-14 w-full rounded-control border px-4 text-base " +
  "backdrop-blur-sm outline-none transition-colors " +
  "focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/40";
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/field.tsx
git commit -m "Apply glass surface and amber focus ring to Field controls"
```

---

## Task 6: NumberStepper primitive

**Files:**
- Modify: `components/ui/number-stepper.tsx`

- [ ] **Step 1: Update the stepper surface and focus ring**

In `components/ui/number-stepper.tsx`, in the wrapper `div` that currently has classes starting `bg-bg-elevated border-border focus-within:ring-2 focus-within:ring-fg/40 ...`, change `focus-within:ring-fg/40` to `focus-within:ring-accent/40`, change `rounded-2xl` to `rounded-control`, and append `backdrop-blur-sm`.

The central `<input>` already uses `tabular-nums` and `font-bold` — leave it. Change its `selection:bg-accent/30` — leave as is (already amber-aware).

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test -- number-stepper`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/number-stepper.tsx
git commit -m "Apply glass surface to NumberStepper"
```

---

## Task 7: Switch primitive

**Files:**
- Modify: `components/ui/switch.tsx`

- [ ] **Step 1: Refine the toggle motion**

In `components/ui/switch.tsx`, on the thumb `<span>`, change `transition-transform` to `transition-transform duration-150 ease-out`. The track already uses `bg-accent` when checked and `bg-bg-elevated-2` when off — leave those (now glass + amber via tokens).

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test -- switch`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/switch.tsx
git commit -m "Refine Switch toggle motion"
```

---

## Task 8: Chip primitive

**Files:**
- Modify: `components/ui/chip.tsx`

- [ ] **Step 1: Add a hairline border to the inactive state**

In `components/ui/chip.tsx`, change the conditional class expression from:

```tsx
active ? "bg-accent text-accent-fg" : "bg-bg-elevated text-fg-muted",
```

to:

```tsx
active
  ? "bg-accent text-accent-fg"
  : "bg-bg-elevated text-fg-muted border border-border",
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test -- chip`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/chip.tsx
git commit -m "Add hairline border to inactive Chip"
```

---

## Task 9: Skeleton primitive

**Files:**
- Modify: `components/ui/skeleton.tsx`

- [ ] **Step 1: Align skeleton radius with cards**

In `components/ui/skeleton.tsx`, change `rounded-2xl` to `rounded-card`. The `bg-bg-elevated animate-pulse` already matches the glass surface.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/skeleton.tsx
git commit -m "Align Skeleton radius with card radius"
```

---

## Task 10: EmptyState primitive

**Files:**
- Modify: `components/ui/empty-state.tsx`

- [ ] **Step 1: Apply glass surface**

In `components/ui/empty-state.tsx`, in the wrapper `div` class string, change `rounded-2xl` to `rounded-card` and append `shadow-card backdrop-blur-sm`.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test -- empty-state`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/empty-state.tsx
git commit -m "Apply glass surface to EmptyState"
```

---

## Task 11: ConfirmDialog primitive

**Files:**
- Modify: `components/ui/confirm-dialog.tsx`

- [ ] **Step 1: Strengthen the overlay and dialog surface**

In `components/ui/confirm-dialog.tsx`:
- On the backdrop `div`, change `bg-black/60 ... backdrop-blur-sm` to `bg-black/70 ... backdrop-blur-md`.
- On the dialog `div`, change `rounded-3xl` to `rounded-card` and append `backdrop-blur-lg`. It already has `bg-bg-elevated border-border` and `shadow-overlay` — leave those.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test -- confirm-dialog`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add components/ui/confirm-dialog.tsx
git commit -m "Strengthen ConfirmDialog glass overlay"
```

---

## Task 12: AppShell

**Files:**
- Modify: `components/app-shell.tsx`

- [ ] **Step 1: Refine the translucent header**

In `components/app-shell.tsx`:
- On the `<header>`, change `bg-bg/85 border-border ... backdrop-blur` to `bg-bg/70 border-border ... backdrop-blur-lg`.
- On the `<h1>`, change `text-lg font-semibold tracking-tight` to `text-lg font-semibold tracking-[-0.02em]`.
- On the `BackButton` class string `cls`, append ` border border-border bg-bg-elevated backdrop-blur-sm` and add `transition-colors` so it reads as a glass control.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`, scroll any screen — the header stays frosted and separates from content.

- [ ] **Step 4: Commit**

```bash
git add components/app-shell.tsx
git commit -m "Refine AppShell header glass treatment"
```

---

## Task 13: BottomNav

**Files:**
- Modify: `components/bottom-nav.tsx`

- [ ] **Step 1: Make the nav a floating glass bar**

In `components/bottom-nav.tsx`, on the `<nav>` element, replace the class string `bg-bg-elevated/95 border-border fixed bottom-0 left-0 right-0 z-20 border-t backdrop-blur` with:

```tsx
"bg-bg/70 border-border fixed bottom-0 left-0 right-0 z-20 border-t backdrop-blur-lg"
```

The active item already uses `text-accent` — that is now amber via tokens. Leave the icon/label markup.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`, the bottom nav is frosted; the active tab icon/label is amber.

- [ ] **Step 4: Commit**

```bash
git add components/bottom-nav.tsx
git commit -m "Apply floating glass treatment to BottomNav"
```

---

## Task 14: RestTimer, SyncBadge, Toast

**Files:**
- Modify: `components/rest-timer.tsx`
- Modify: `components/sync-badge.tsx`
- Modify: `components/toast-container.tsx`

- [ ] **Step 1: Apply glass surfaces**

Read each file. Apply consistently:
- Any floating/elevated container: `bg-bg-elevated` (or `bg-bg/70` if it overlays scrolling content) + `border border-border` + `rounded-card` + `backdrop-blur-lg` + `shadow-card`.
- Replace any literal `rounded-2xl`/`rounded-3xl` on surfaces with `rounded-card`.
- Replace any literal dark hex backgrounds (e.g. `#141414`, `#1f1f1f`) with the token classes `bg-bg-elevated` / `bg-bg-elevated-2`.
- Numbers shown in `RestTimer` (the countdown) get `font-mono tabular-nums`.
- State colors in `SyncBadge`/`Toast`: success/active uses `text-accent`; error keeps `text-danger`.
- Do not change timing logic, store usage, or props.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`: trigger a toast, start a rest timer mid-session, observe the sync badge. All read as glass with amber accents.

- [ ] **Step 4: Commit**

```bash
git add components/rest-timer.tsx components/sync-badge.tsx components/toast-container.tsx
git commit -m "Apply glass surfaces to RestTimer, SyncBadge, Toast"
```

---

## Task 15: SetRow and ProgressChart

**Files:**
- Modify: `components/set-row.tsx`
- Modify: `components/progress-chart.tsx`

- [ ] **Step 1: Refine SetRow**

Read `components/set-row.tsx`. Apply:
- Wrap surface: token classes, `rounded-control`, hairline border if it is a card-like row.
- All numeric values (weight, reps, set index) get `font-mono tabular-nums`.
- The completed-set check/indicator uses the accent (`text-accent` / `bg-accent`).
- Do not change set-completion logic or props.

- [ ] **Step 2: Refine ProgressChart**

Read `components/progress-chart.tsx` (uses `recharts`). Apply:
- Line/area stroke and fill use `#f59e0b` (area fill at low opacity, e.g. `fillOpacity={0.15}`).
- Grid lines / axis lines use `rgb(255 255 255 / 0.08)`.
- Axis tick text uses `fill="#a1a1aa"` and a monospace font family if the chart sets one.
- Tooltip container, if styled, uses the glass surface.

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 4: Visual check**

In `pnpm dev`, open `/stats` and a live session. Chart is amber on a hairline grid; set rows show mono numbers.

- [ ] **Step 5: Commit**

```bash
git add components/set-row.tsx components/progress-chart.tsx
git commit -m "Apply amber accent and mono numerals to SetRow and ProgressChart"
```

---

## Task 16: Screen sweep — Home and Auth

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/auth/callback/page.tsx`

- [ ] **Step 1: Sweep each screen**

For each file: read it, then verify it composes the updated primitives correctly and apply targeted fixes:
- Replace any literal hex colors or `rounded-2xl`/`rounded-3xl` with token classes / `rounded-card`.
- Large headings: add `tracking-[-0.02em]`.
- Uppercase micro-labels: ensure `text-xs uppercase tracking-wide` (already the pattern on Home).
- Any displayed number (counts, stats) gets `tabular-nums`.
- `login` and `auth/callback`: center the content in a glass `Card`; the login action uses `BigButton` `primary` (amber gradient).
- Do not change data hooks, routing, or auth logic.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`: Home matches the approved mockup (`.superpowers/brainstorm/.../home-final.html`). Login looks composed and premium.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/login/page.tsx app/auth/callback/page.tsx
git commit -m "Sweep Home and Auth screens for Premium Glass language"
```

---

## Task 17: Screen sweep — Routines

**Files:**
- Modify: `app/routines/page.tsx`
- Modify: `app/routines/new/page.tsx`
- Modify: `app/routines/[id]/page.tsx`
- Modify: `components/sortable-list.tsx`

- [ ] **Step 1: Sweep each screen**

For each file: read it, verify primitive usage, apply the same targeted fixes as Task 16 Step 1 (token classes, `rounded-card`, heading tracking, `tabular-nums` on numbers). Additionally:
- Routines list: the active routine card uses `Card` with an amber hairline — add `border-accent/40` to that card only; other cards stay neutral.
- Editor: drag handles in `sortable-list.tsx` use `text-fg-muted` and a glass grip; the dragging item gets `shadow-overlay`.
- Do not change routine CRUD, dnd-kit wiring, or the debounced-write logic.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`: create a routine, reorder exercises, edit names. The active routine stands out via the amber hairline.

- [ ] **Step 4: Commit**

```bash
git add app/routines components/sortable-list.tsx
git commit -m "Sweep Routines screens for Premium Glass language"
```

---

## Task 18: Screen sweep — Training

**Files:**
- Modify: `app/train/page.tsx`
- Modify: `app/train/[id]/page.tsx`
- Modify: `app/train/[id]/finish/page.tsx`

- [ ] **Step 1: Sweep each screen**

For each file: read it, verify primitive usage, apply the Task 16 Step 1 fixes. Additionally:
- Live session (`train/[id]`): the current exercise card is visually primary — full glass `Card`, slightly more padding; finished/collapsed exercises stay lower-contrast (keep the existing collapse behavior untouched).
- Finish screen: session summary stats are large, `font-mono tabular-nums`; the headline uses the accent for a sense of achievement.
- Do not change session state, timers, set logging, or the collapse logic.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass. `app/train/[id]/page.test.tsx` must still pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`: run a full session — log sets, complete exercises, finish. Current exercise is clearly primary; finish screen feels rewarding.

- [ ] **Step 4: Commit**

```bash
git add app/train
git commit -m "Sweep Training screens for Premium Glass language"
```

---

## Task 19: Screen sweep — History, Stats, Settings

**Files:**
- Modify: `app/history/page.tsx`
- Modify: `app/history/[id]/page.tsx`
- Modify: `app/stats/page.tsx`
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Sweep each screen**

For each file: read it, verify primitive usage, apply the Task 16 Step 1 fixes. Additionally:
- History list and detail: session/exercise rows as glass cards; dates in `text-fg-muted`; duration and volume in `font-mono tabular-nums`.
- Stats: metric cards show large `font-mono tabular-nums` numbers; charts already handled in Task 15.
- Settings: group rows into glass sections; section headers are uppercase micro-labels (`text-xs uppercase tracking-wide text-fg-muted`); toggles use the updated `Switch`.
- Do not change history queries, stats computations, or settings persistence.

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 3: Visual check**

In `pnpm dev`: browse history, open a session detail, check stats, toggle settings. All consistent with the new language.

- [ ] **Step 4: Commit**

```bash
git add app/history app/stats app/settings
git commit -m "Sweep History, Stats and Settings screens for Premium Glass language"
```

---

## Task 20: Final polish pass

**Files:**
- Modify: any file needing a fix found during review.

- [ ] **Step 1: Full-app visual review**

Run `pnpm dev` and walk every screen on a mobile viewport (DevTools device toolbar, ~390px). Check:
- Safe areas: `pt-safe` / `pb-safe` respected; header and bottom nav clear the notch/home indicator.
- Focus states: tab through interactive elements — every one shows an amber focus ring.
- Motion: presses give the quick scale/opacity feedback; no janky or slow transitions.
- Consistency: no leftover literal hex colors, no `rounded-2xl`/`rounded-3xl` on surfaces, no harsh `0 1px 2px` shadows. Grep to confirm:
  `git grep -nE "#0a0a0a|#141414|#1f1f1f|#2a2a2a|rounded-2xl|rounded-3xl" -- "*.tsx" "*.css"`
  Expected: no matches in `app/` or `components/` (the brainstorm `.superpowers/` folder is gitignored and irrelevant).
- Edge cases: empty states (no routine, no history), active-session vs. no-session Home, a sync-error badge.

- [ ] **Step 2: Fix any issues found**

Apply fixes inline. Keep changes purely visual.

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Final polish pass for Premium Glass redesign"
```

---

## Self-review notes

- **Spec coverage:** tokens (Task 1), all 11 `components/ui/` primitives (Tasks 2-11), all app-level components — AppShell/BottomNav/RestTimer/SyncBadge/Toast/SetRow/ProgressChart/Skeleton (Tasks 9, 12-15), all 13 screens (Tasks 16-19), polish/safe-areas/focus/motion (Task 20).
- **Out of scope honored:** no functional, navigation, data-logic, or dependency changes; no light mode; lucide icons kept (not in spec scope).
- **Radius:** `--radius-card` (1.25rem) and `--radius-control` (0.75rem) are applied via `rounded-card` / `rounded-control`, replacing literal `rounded-2xl`/`rounded-3xl` on surfaces — Task 20 grep confirms none remain.
