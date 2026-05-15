# UX Fase 4 — Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the remaining P2 polish from the UX audit — microcopy, emoji→icon, tokenised colors, subtle animations, and two UX niceties.

**Architecture:** Six independent tasks. Microcopy/icon fixes are small text edits. Hardcoded chart/timer hex colors become `var(--color-*)` references. Animation keyframes are added to `app/globals.css` as Tailwind v4 `@theme` tokens and applied to overlays/toasts. Finished exercises in the live session collapse; the routine-editor name inputs debounce their writes via a new `useDebouncedCallback` hook.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Recharts, Vitest.

---

## Conventions

- Branch off `main` (has all of Fase 2/3).
- Do NOT run `npm install` (creates a stray `package-lock.json`; repo uses pnpm). The worktree resolves `node_modules` from the parent repo.
- Tests: `npx vitest run --exclude "**/.claude/**"` (the `--exclude` skips sibling worktree copies). Also `npm run typecheck`, `npm run lint`, `npm run build`.
- Vitest has `globals: false` — import test helpers explicitly from `vitest`.

## Verification approach

Tasks 1–4 are presentational — verified by `typecheck` + `lint` + `build` passing. Task 5 adds a real hook (`useDebouncedCallback`) with a **TDD** unit test using fake timers.

## Scope

**In scope:** the P2 audit items in the 4 groups the user selected. **Out of scope:** anything not in the audit; new features.

## File Structure

| File | Change |
|------|--------|
| `components/rest-timer.tsx` | "rest" text → icon; tokenise the 2 SVG hex colors |
| `app/train/page.tsx` | "Sin terminar" → "En curso" |
| `app/stats/page.tsx` | "Δ inicio" → "Cambio" |
| `app/login/page.tsx` | 🏋️ emoji → Lucide `Dumbbell` icon |
| `app/train/[id]/finish/page.tsx` | "Ver historial" underline link → ghost `BigButton` |
| `app/train/[id]/page.tsx` | rename `fmtRelativeDate` → `fmtShortDate`; collapse finished exercises |
| `components/progress-chart.tsx` | hardcoded hex → `var(--color-*)` |
| `app/globals.css` | add animation keyframes + `@theme` animation tokens |
| `components/toast-container.tsx` | apply `animate-fade-in` |
| `components/ui/confirm-dialog.tsx` | apply `animate-fade-in` to the overlay |
| `lib/hooks/use-debounced-callback.ts` (create) | debounce hook |
| `lib/hooks/use-debounced-callback.test.ts` (create) | hook test |
| `app/routines/[id]/page.tsx` | debounce routine-name & day-name writes |

---

## Task 1: Microcopy & emoji fixes

**Files:** `components/rest-timer.tsx`, `app/train/page.tsx`, `app/stats/page.tsx`, `app/login/page.tsx`, `app/train/[id]/finish/page.tsx`, `app/train/[id]/page.tsx`.

FIRST read each file before editing.

- [ ] **Step 1: `rest-timer.tsx` — replace the English "rest" text with an icon**

The countdown circle has a centred `<div ...>{done ? "✓" : "rest"}</div>`. Add `Check` and `Timer` to the lucide import (currently `import { Pause, Play, X } from "lucide-react";` → `import { Check, Pause, Play, Timer, X } from "lucide-react";`). Replace the circle's inner content `{done ? "✓" : "rest"}` with `{done ? <Check className="h-4 w-4" /> : <Timer className="h-4 w-4" />}`.

- [ ] **Step 2: `app/train/page.tsx` — unify the in-progress wording**

In the active-session branch, the Card has a label `<p className="text-fg-muted text-xs uppercase tracking-wide">Sin terminar</p>`. Change the text `Sin terminar` to `En curso` (consistent with the screen title "Sesión en curso").

- [ ] **Step 3: `app/stats/page.tsx` — clarify the delta label**

In the `SummaryStrip` component, the third `<Stat label="Δ inicio" .../>` — change `label="Δ inicio"` to `label="Cambio"`.

- [ ] **Step 4: `app/login/page.tsx` — emoji logo → Lucide icon**

Add `import { Dumbbell } from "lucide-react";`. Replace the logo `<div className="bg-accent/15 text-accent flex h-16 w-16 items-center justify-center rounded-2xl text-3xl">🏋️</div>` with:

```tsx
        <div className="bg-accent/15 text-accent flex h-16 w-16 items-center justify-center rounded-2xl">
          <Dumbbell className="h-8 w-8" />
        </div>
```

- [ ] **Step 5: `app/train/[id]/finish/page.tsx` — link → ghost button**

The "Ver historial" link is `<Link href="/history" className="text-accent text-center text-sm underline">Ver historial</Link>`. Replace it with:

```tsx
        <Link href="/history">
          <BigButton variant="ghost" size="md" className="w-full">
            Ver historial
          </BigButton>
        </Link>
```

(`BigButton` and `Link` are already imported in this file.)

- [ ] **Step 6: `app/train/[id]/page.tsx` — rename the misnamed helper**

The file has `function fmtRelativeDate(iso: string): string` whose comment notes it actually returns an absolute short date. Rename the function to `fmtShortDate` and update its single call site (inside `ExerciseBlock`, `Última vez ({fmtRelativeDate(last.finished_at)})`) to `fmtShortDate`.

- [ ] **Step 7: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add components/rest-timer.tsx app/train/page.tsx app/stats/page.tsx app/login/page.tsx "app/train/[id]/finish/page.tsx" "app/train/[id]/page.tsx"
git commit -m "Polish microcopy and replace the login emoji with an icon"
```

---

## Task 2: Tokenise hardcoded colors

**Files:** `components/progress-chart.tsx`, `components/rest-timer.tsx`.

Recharts and the SVG accept CSS variables in `stroke`/`fill` attributes — `var(--color-border)` resolves the same token Tailwind uses. FIRST read both files.

- [ ] **Step 1: `progress-chart.tsx` — replace hex with CSS vars**

Replace every hardcoded hex string in the Recharts props with the matching token:
- `#2a2a2a` → `var(--color-border)` (in `CartesianGrid stroke`, `XAxis`/`YAxis` `tickLine.stroke` and `axisLine.stroke`, and the tooltip `contentStyle.border`).
- `#a1a1aa` → `var(--color-fg-muted)` (in `XAxis`/`YAxis` `tick.fill` and the tooltip `labelStyle.color`).
- `#22c55e` → `var(--color-accent)` (the `Line` `stroke` and its `dot.fill`).
- `#141414` → `var(--color-bg-elevated)` (the tooltip `contentStyle.background`).

For the empty-state branch and container, no change (they already use Tailwind classes).

- [ ] **Step 2: `rest-timer.tsx` — replace the SVG ring hex**

In the countdown ring `<svg>`, the two `<circle>` elements have `stroke="#2a2a2a"` and `stroke="#22c55e"`. Change them to `stroke="var(--color-border)"` and `stroke="var(--color-accent)"` respectively.

- [ ] **Step 3: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add components/progress-chart.tsx components/rest-timer.tsx
git commit -m "Use design tokens instead of hardcoded hex in chart and timer"
```

---

## Task 3: Animation tokens & subtle entry animations

**Files:** `app/globals.css`, `components/toast-container.tsx`, `components/ui/confirm-dialog.tsx`.

- [ ] **Step 1: Add keyframes + animation tokens to `app/globals.css`**

Add a `fade-in` animation token to the `@theme` block (alongside the existing `--shadow-*`/`--radius-*` tokens):

```css
  --animate-fade-in: fade-in 0.18s ease-out;
```

Then add the keyframes after the `@theme` block (next to the `@utility` rules):

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

This makes the `animate-fade-in` utility available.

- [ ] **Step 2: Apply `animate-fade-in` to toasts**

In `components/toast-container.tsx`, each toast is a `<div key={t.id} role="status" className={cn("pointer-events-auto flex w-full max-w-md ...", TONE[t.kind])}>`. Add `animate-fade-in` to that `cn(...)` class list (as a literal string in the first argument).

- [ ] **Step 3: Apply `animate-fade-in` to the ConfirmDialog overlay**

In `components/ui/confirm-dialog.tsx`, the overlay `<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" ...>` — append `animate-fade-in` to that className string.

- [ ] **Step 4: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add app/globals.css components/toast-container.tsx components/ui/confirm-dialog.tsx
git commit -m "Add fade-in animation token and apply to toasts and dialogs"
```

---

## Task 4: Collapse finished exercises in the live session

**Files:** `app/train/[id]/page.tsx`.

When all of an exercise's planned sets are logged, `ExerciseBlock` should collapse to a compact summary (tap to re-expand) so the list does not grow unmanageably.

FIRST read `ExerciseBlock` in `app/train/[id]/page.tsx`.

- [ ] **Step 1: Add collapse state to `ExerciseBlock`**

`ExerciseBlock` already computes `allDone` (`performed >= planned`). Add a state hook at the top of `ExerciseBlock` (`useState` is already imported in the file):

```tsx
  const [expanded, setExpanded] = useState(false);
  const collapsed = allDone && !expanded;
```

- [ ] **Step 2: Render a collapsed summary when `collapsed`**

`ExerciseBlock` currently always renders the `<header>`, the `<ul>` of `SetRow`s, and the `allDone` footer inside a `<Card padding="md">`. Change the body so that when `collapsed` is true it renders a compact tappable summary instead of the set list. Replace the `<ul>...</ul>` and the trailing `{allDone ? (...) : null}` block with:

```tsx
      {collapsed ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-accent mt-3 flex w-full items-center justify-between text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
        >
          <span className="inline-flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> {performed} series registradas
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {Array.from({ length: totalToShow }, (_, i) => i + 1).map((n) => {
              const existing = setsBySetNumber.get(n);
              return (
                <li key={n}>
                  <SetRow
                    session_exercise_id={session_exercise.id}
                    set_number={n}
                    target_weight_kg={session_exercise.target_weight_kg}
                    target_reps_max={session_exercise.target_reps_max}
                    target_rir={session_exercise.target_rir}
                    rest_seconds={session_exercise.rest_seconds}
                    existing={
                      existing
                        ? {
                            id: existing.id,
                            weight_kg: existing.weight_kg,
                            reps: existing.reps,
                            rir: existing.rir,
                          }
                        : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
          {allDone ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-fg-muted mt-3 flex items-center gap-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
            >
              <Check className="text-accent h-3.5 w-3.5" /> {performed} series registradas · contraer
            </button>
          ) : null}
        </>
      )}
```

- [ ] **Step 3: Add the `ChevronDown` import**

The file's lucide import (currently `import { Check, Dumbbell, Flag, Trash2 } from "lucide-react";`) gains `ChevronDown`: `import { Check, ChevronDown, Dumbbell, Flag, Trash2 } from "lucide-react";`.

- [ ] **Step 4: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add "app/train/[id]/page.tsx"
git commit -m "Collapse finished exercises in the live session screen"
```

**Behavioral check (user):** once all planned sets of an exercise are logged, its block collapses to a one-line summary; tapping it re-expands the set list.

---

## Task 5: Debounce the routine-editor name inputs

**Files:** Create `lib/hooks/use-debounced-callback.ts` and `lib/hooks/use-debounced-callback.test.ts`; modify `app/routines/[id]/page.tsx`.

Today the routine-name and day-name `<Input>`s call `updateRoutine`/`renameTrainingDay` on every keystroke — each one a Dexie write + a sync-queue entry. Debounce the persist.

- [ ] **Step 1: Write the failing test** — create `lib/hooks/use-debounced-callback.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDebouncedCallback } from "./use-debounced-callback";

describe("useDebouncedCallback", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("invokes the callback once, with the latest args, after the delay", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 300));
    result.current("a");
    result.current("b");
    result.current("c");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("restarts the timer on each call", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 300));
    result.current("x");
    vi.advanceTimersByTime(200);
    result.current("y");
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledExactlyOnceWith("y");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run --exclude "**/.claude/**" lib/hooks/use-debounced-callback.test.ts`
Expected: FAIL — `Cannot find module './use-debounced-callback'`.

- [ ] **Step 3: Write the hook** — create `lib/hooks/use-debounced-callback.ts`:

```ts
import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable debounced wrapper around `callback`. Each call resets the
 * timer; the callback fires once, with the most recent arguments, `delay` ms
 * after the last call. The pending timer is cleared on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(
    (...args: Args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run --exclude "**/.claude/**" lib/hooks/use-debounced-callback.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Use the hook for the routine-name input**

In `app/routines/[id]/page.tsx`, add `import { useState } from "react";` if not present (the file already imports `useState`), and `import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";`.

In `EditRoutinePage`, the routine-name `<Input>` is currently `<Input value={routine.name} onChange={(e) => void updateRoutine(routine.id, { name: e.target.value })} />`. Replace it with a locally-controlled input that debounces the persist. Add near the top of `EditRoutinePage` (after `routine` is available):

```tsx
  const [nameDraft, setNameDraft] = useState(routine.name);
  const persistName = useDebouncedCallback(
    (value: string) => void updateRoutine(routine.id, { name: value }),
    400,
  );
```

And the input becomes:

```tsx
          <Input
            value={nameDraft}
            onChange={(e) => {
              setNameDraft(e.target.value);
              persistName(e.target.value);
            }}
          />
```

- [ ] **Step 6: Use the hook for the day-name input**

In the `DayEditor` component, the day-name `<input aria-label="Nombre del día" value={day.name} onChange={(e) => void renameTrainingDay(day.id, e.target.value)} ... />`. Add at the top of `DayEditor`:

```tsx
  const [dayNameDraft, setDayNameDraft] = useState(day.name);
  const persistDayName = useDebouncedCallback(
    (value: string) => void renameTrainingDay(day.id, value),
    400,
  );
```

And the input's `value`/`onChange` become:

```tsx
          value={dayNameDraft}
          onChange={(e) => {
            setDayNameDraft(e.target.value);
            persistDayName(e.target.value);
          }}
```

- [ ] **Step 7: Verify & commit**

`npx vitest run --exclude "**/.claude/**" lib/hooks/use-debounced-callback.test.ts` → PASS. Then `npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add lib/hooks/use-debounced-callback.ts lib/hooks/use-debounced-callback.test.ts "app/routines/[id]/page.tsx"
git commit -m "Debounce routine and day name writes in the editor"
```

**Behavioral check (user):** typing in a routine/day name feels instant but only writes to the store ~400ms after you stop typing.

---

## Task 6: Final verification

- [ ] **Step 1: Full test suite** — `npx vitest run --exclude "**/.claude/**"` → all pass (the suite + the new `use-debounced-callback` test).
- [ ] **Step 2: Typecheck** — `npm run typecheck` → no errors.
- [ ] **Step 3: Lint** — `npm run lint` → no errors.
- [ ] **Step 4: Build** — `npm run build` → succeeds.
- [ ] **Step 5: Commit any lint/format fixes** (skip if none):

```bash
git add -A
git commit -m "Fix lint/format issues in Fase 4"
```

---

## Done criteria

- No English "rest" text, no `🏋️` emoji, no `Δ inicio` label; "Ver historial" is a button; the misnamed `fmtRelativeDate` is renamed.
- `progress-chart.tsx` and `rest-timer.tsx` use `var(--color-*)` instead of hardcoded hex.
- A `fade-in` animation token exists; toasts and the confirm dialog fade in.
- Finished exercises in the live session collapse to a tappable summary.
- Routine/day name inputs debounce their writes via the tested `useDebouncedCallback` hook.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass.

## Follow-up

This completes the UX audit's P0/P1/P2 backlog. Remaining audit notes not addressed are deliberate product decisions (dark-only theme, no light mode) or were already resolved in earlier phases.
