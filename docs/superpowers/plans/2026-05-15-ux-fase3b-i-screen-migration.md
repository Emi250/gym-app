# UX Fase 3b-i — High-Debt Screen Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the four highest-debt screens (Train live, Routine editor, Home, Stats) to the Fase 2 UI primitives and resolve their P1 audit findings.

**Architecture:** Each task is one screen. The repeated `bg-bg-elevated border-border rounded-2xl border p-X` markup becomes `<Card>`; native checkboxes become `<Switch>`; the local duplicated `Field` becomes the shared `Field`/`Input`/`Select`; ad-hoc empty states become `<EmptyState>`; loading blocks become `<Skeleton>`; `window.confirm()` becomes `<ConfirmDialog>`; ad-hoc pills become `<Chip>`. P1 design fixes (Train-live progress bar, Home Stats card) are folded into the relevant screen.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, the `components/ui/` primitives from Fase 2 (`Card`, `Skeleton`, `IconButton`, `Chip`, `Switch`, `EmptyState`, `Field`/`Input`/`Select`, `ConfirmDialog`), Vitest.

---

## Conventions (read before starting)

- Branch off `main` (which already has Fase 2 primitives + Fase 3a P0 fixes).
- Vitest has `globals: false` — import test helpers explicitly from `vitest`.
- Run a test file: `npm test -- <path>`. Full suite: `npm test`. Also `npm run typecheck`, `npm run lint`, `npm run build`.
- Do NOT run `npm install` — the worktree resolves `node_modules` from the parent repo (running it creates a stray `package-lock.json`; the repo uses pnpm).
- Primitive APIs (from `components/ui/`):
  - `<Card padding="none|sm|md|lg">` (default `md`) — renders a `div`.
  - `<Skeleton className="h-32" />` — sized via className.
  - `<EmptyState icon={LucideIcon} title description? action? />`.
  - `<Chip active? onClick>` — pill toggle.
  - `<Switch checked onCheckedChange id? disabled? />`.
  - `<Field label hint? htmlFor?>{control}</Field>`, `<Input />`, `<Select>{options}</Select>` (Select renders its own chevron).
  - `<ConfirmDialog open title description? confirmLabel? cancelLabel? destructive? onConfirm onCancel />` — controlled.
  - `<IconButton aria-label size="sm|md">{icon}</IconButton>`.

## Verification approach

Same as Fase 3a: the repo has no screen-test harness. The one genuinely unit-testable new unit — `computeSessionProgress` (Task 1) — gets **TDD**. All other changes are presentational and verified by **typecheck + lint + build passing** plus a behavioral description for manual confirmation.

## Scope

**In scope:** the 4 screens below + their P1 findings. **Out of scope:** the other 8 screens (Fase 3b-ii — a separate plan), all P2 polish (Fase 4), any data-layer change.

## File Structure

| File | Change |
|------|--------|
| `app/train/[id]/page.tsx` | Migrate to `Card`/`Skeleton`/`EmptyState`/`ConfirmDialog`; add `computeSessionProgress` helper + progress bar; remove dead `expectedPerExercise` |
| `app/train/[id]/page.test.tsx` (create) | TDD test for `computeSessionProgress` |
| `app/routines/[id]/page.tsx` | Migrate to `Card`/`Field`/`Switch`/`ConfirmDialog`; chevron toggle; delete local `Field` |
| `app/page.tsx` | Migrate to `Card`/`EmptyState`/`IconButton`; fix Stats card |
| `app/stats/page.tsx` | Migrate to `Card`/`Field`+`Select`/`Chip` |

---

## Task 1: Train live screen

**Files:**
- Modify: `app/train/[id]/page.tsx`
- Create: `app/train/[id]/page.test.tsx`

- [ ] **Step 1: Write the failing test** for the progress helper — create `app/train/[id]/page.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { computeSessionProgress } from "./page";

describe("computeSessionProgress", () => {
  it("sums expected sets from each exercise's target_sets", () => {
    const sExercises = [
      { id: "a", target_sets: 3 },
      { id: "b", target_sets: 4 },
    ];
    const sets = [
      { session_exercise_id: "a", set_number: 1 },
      { session_exercise_id: "a", set_number: 2 },
    ];
    expect(computeSessionProgress(sExercises, sets)).toEqual({ done: 2, expected: 7 });
  });

  it("expands expected when extra sets are logged beyond target", () => {
    const sExercises = [{ id: "a", target_sets: 3 }];
    const sets = [
      { session_exercise_id: "a", set_number: 1 },
      { session_exercise_id: "a", set_number: 2 },
      { session_exercise_id: "a", set_number: 3 },
      { session_exercise_id: "a", set_number: 4 },
    ];
    // 4 sets logged > target 3 → expected grows to 4 so the bar never exceeds 100%
    expect(computeSessionProgress(sExercises, sets)).toEqual({ done: 4, expected: 4 });
  });

  it("returns zero expected for an empty session", () => {
    expect(computeSessionProgress([], [])).toEqual({ done: 0, expected: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/train/[id]/page.test.tsx`
Expected: FAIL — `computeSessionProgress` is not exported.

- [ ] **Step 3: Add the `computeSessionProgress` helper**

In `app/train/[id]/page.tsx`, add this exported helper just below the imports (before `export default function LiveSessionPage`):

```tsx
/** Pure progress math for a live session: sets logged vs. sets expected.
 *  `expected` per exercise is the configured `target_sets`, expanded if the
 *  user logged extra sets so the progress bar never exceeds 100%. */
export function computeSessionProgress(
  sExercises: { id: string; target_sets: number }[],
  sets: { session_exercise_id: string; set_number: number }[],
): { done: number; expected: number } {
  let expected = 0;
  for (const se of sExercises) {
    const performedForSe = sets.filter((s) => s.session_exercise_id === se.id).length;
    expected += Math.max(se.target_sets, performedForSe);
  }
  return { done: sets.length, expected };
}
```

- [ ] **Step 4: Replace the `totals` useMemo**

In `LiveSessionPage`, replace the entire `totals` `useMemo` block (the one computing `expectedPerExercise`) with:

```tsx
  const totals = useMemo(
    () => (data ? computeSessionProgress(data.sExercises, data.sets) : null),
    [data],
  );
```

This removes the dead `expectedPerExercise` Map and the now-stale comment about `target_sets`.

- [ ] **Step 5: Replace the loading skeleton and not-found/empty markup**

Add `Card`, `Skeleton`, `EmptyState` and the `Dumbbell` icon to the imports:

```tsx
import { Check, Dumbbell, Flag, Trash2 } from "lucide-react";
```
```tsx
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
```

Replace the `data === undefined` loading block's inner div:

```tsx
  if (data === undefined) {
    return (
      <AppShell title="Cargando…">
        <Skeleton className="h-32" />
      </AppShell>
    );
  }
```

Replace the `sExercises.length === 0` paragraph with an `EmptyState`:

```tsx
        {sExercises.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Sin ejercicios"
            description="Esta sesión no tenía ejercicios planificados."
          />
        ) : (
```

- [ ] **Step 6: Render the progress bar**

Replace the progress card block (the `{totals ? (<div className="bg-bg-elevated...">...) : null}`) with:

```tsx
        {totals ? (
          <Card padding="md">
            <div className="flex items-baseline justify-between">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Progreso</p>
              <p className="text-fg-muted text-xs tabular-nums">
                {totals.done} / {totals.expected} series
              </p>
            </div>
            <div className="bg-bg-elevated-2 mt-2 h-2 overflow-hidden rounded-full">
              <div
                className="bg-accent h-full rounded-full transition-[width]"
                style={{
                  width: `${totals.expected > 0 ? Math.round((totals.done / totals.expected) * 100) : 0}%`,
                }}
              />
            </div>
          </Card>
        ) : null}
```

- [ ] **Step 7: Migrate `ExerciseBlock`'s container to `Card`**

In `ExerciseBlock`, replace the `<section className="bg-bg-elevated border-border rounded-2xl border p-4">` opening tag with `<Card padding="md">` and its closing `</section>` with `</Card>`. (`Card` renders a `div` — the `<section>` element is dropped in favour of the shared surface.)

- [ ] **Step 8: Replace the two `confirm()` calls with `ConfirmDialog`**

Add the import:

```tsx
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
```

Add two dialog-state hooks at the top of `LiveSessionPage` (next to `const [finishing, setFinishing] = useState(false);`):

```tsx
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
```

Extract the finish logic into a function inside `LiveSessionPage` (place it after the early returns, where `session` is in scope):

```tsx
  async function runFinish() {
    setConfirmFinishOpen(false);
    setFinishing(true);
    try {
      await applyProgressionToSession(session.id);
      await markSessionFinished(session.id);
      router.replace(`/train/${session.id}/finish`);
    } catch {
      showToast("No se pudo terminar la sesión", "error");
    } finally {
      setFinishing(false);
    }
  }
```

Change the "Terminar sesión" `BigButton`'s `onClick` to:

```tsx
            onClick={() => {
              if (sets.length === 0) {
                setConfirmFinishOpen(true);
              } else {
                void runFinish();
              }
            }}
```

Change the "Descartar sesión" `BigButton`'s `onClick` to:

```tsx
            onClick={() => setConfirmDiscardOpen(true)}
```

Add the two dialogs just before the closing `</AppShell>`:

```tsx
        <ConfirmDialog
          open={confirmFinishOpen}
          title="Terminar sin series"
          description="No registraste ninguna serie. ¿Terminar la sesión igual?"
          confirmLabel="Terminar"
          onConfirm={() => void runFinish()}
          onCancel={() => setConfirmFinishOpen(false)}
        />
        <ConfirmDialog
          open={confirmDiscardOpen}
          title="Descartar sesión"
          description="Se descarta la sesión sin guardar los datos."
          confirmLabel="Descartar"
          destructive
          onConfirm={() => {
            setConfirmDiscardOpen(false);
            void discardSession(session.id).then(() => router.replace("/train"));
          }}
          onCancel={() => setConfirmDiscardOpen(false)}
        />
```

- [ ] **Step 9: Run the test and verify gates**

Run: `npm test -- app/train/[id]/page.test.tsx` → PASS (3 tests).
Run: `npm run typecheck` → no errors. `npm run lint` → no errors. `npm run build` → succeeds.

- [ ] **Step 10: Commit**

```bash
git add "app/train/[id]/page.tsx" "app/train/[id]/page.test.tsx"
git commit -m "Migrate Train-live screen to primitives; add progress bar"
```

**Behavioral check (user, post-merge):** the progress card shows a bar filling toward `done / expected`; finishing with no sets and discarding both open an in-app modal instead of a browser `confirm()`.

---

## Task 2: Routine editor screen

**Files:**
- Modify: `app/routines/[id]/page.tsx`

- [ ] **Step 1: Update imports**

Add the primitive imports and the `ChevronDown`/`ChevronUp` icons:

```tsx
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
```
```tsx
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
```

- [ ] **Step 2: Delete the local `Field` component**

Remove the entire local `function Field({ label, children }: ...) { ... }` definition at the bottom of the file — the shared `Field` from `@/components/ui/field` replaces it. The shared `Field` signature is `Field({ label, hint?, htmlFor?, children, className? })`, compatible with the existing call sites (`<Field label="Nombre">` / `<Field label="Fecha de inicio">`).

- [ ] **Step 3: Migrate the name & date inputs**

Replace the two top-level `<input>` controls (routine name, start date) so they use `Input` and lose the hardcoded `focus:ring-white/20`:

```tsx
        <Field label="Nombre">
          <Input
            value={routine.name}
            onChange={(e) => void updateRoutine(routine.id, { name: e.target.value })}
          />
        </Field>

        <Field label="Fecha de inicio">
          <Input
            type="date"
            value={startedAtInput}
            onChange={(e) =>
              void updateRoutine(routine.id, {
                started_at: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        </Field>
```

(`Input` already carries `bg-bg-elevated border-border h-14 ... focus-visible:ring-2 focus-visible:ring-fg/40` — the old inline classes are dropped.)

- [ ] **Step 4: Migrate the loading skeleton and not-found state**

Add `import { Skeleton } from "@/components/ui/skeleton";`. Replace the `data === undefined` inner `<div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />` with `<Skeleton className="h-32" />`.

- [ ] **Step 5: Migrate `DayEditor` and `PlannedExerciseRow` containers to `Card`**

In `DayEditor`, replace `<div className="bg-bg-elevated border-border rounded-2xl border p-4">` with `<Card padding="md">` and its matching closing `</div>` with `</Card>`.

In `PlannedExerciseRow`, the outer `<div className="bg-bg border-border rounded-xl border">` stays as-is (it is a nested row, not a card surface) — do NOT change it.

- [ ] **Step 6: Replace the three checkboxes with `Switch`**

Each of the three `<input type="checkbox" ... className="h-5 w-5 accent-green-500" />` controls (in `PlannedExerciseRow` "Peso corporal", `RestField`, `RirField`) becomes a `Switch`. For the "Peso corporal" one:

```tsx
            <Switch
              checked={planned.is_bodyweight}
              onCheckedChange={(checked) =>
                void updatePlannedExercise(planned.id, {
                  is_bodyweight: checked,
                  target_weight_kg: checked ? 0 : planned.target_weight_kg,
                })
              }
            />
```

For `RestField`:

```tsx
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            void updatePlannedExercise(planned.id, {
              rest_seconds: checked ? 90 : null,
            })
          }
        />
```

For `RirField`:

```tsx
        <Switch
          checked={enabled}
          onCheckedChange={(checked) =>
            void updatePlannedExercise(planned.id, {
              target_rir: checked ? 2 : null,
            })
          }
        />
```

The surrounding `<label className="bg-bg-elevated border-border flex h-12 ...">` stays — `Switch` sits where the `<input>` was. (A `<label>` wrapping a `role="switch"` button still works as a click target.)

- [ ] **Step 7: Replace the expand toggle text with a chevron**

In `PlannedExerciseRow`, the toggle button shows `{expanded ? "−" : "Editar"}`. Replace that span with a chevron icon:

```tsx
          <span className="text-fg-muted">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
```

- [ ] **Step 8: Replace the three `confirm()` calls with `ConfirmDialog`**

There are three `confirm()` sites: delete routine (`EditRoutinePage`), delete day (`DayEditor`), remove planned exercise (`PlannedExerciseRow`). Each becomes a controlled dialog local to its component.

In `EditRoutinePage`, add `const [confirmDeleteRoutine, setConfirmDeleteRoutine] = useState(false);`. Change the "Eliminar rutina" `BigButton` `onClick` to `() => setConfirmDeleteRoutine(true)`. Before `</AppShell>` add:

```tsx
        <ConfirmDialog
          open={confirmDeleteRoutine}
          title="Eliminar rutina"
          description="La rutina se elimina permanentemente."
          confirmLabel="Eliminar"
          destructive
          onConfirm={() => {
            setConfirmDeleteRoutine(false);
            void softDeleteRoutine(routine.id).then(() => router.replace("/routines"));
          }}
          onCancel={() => setConfirmDeleteRoutine(false)}
        />
```

In `DayEditor`, add `const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);`. Change the day Trash button `onClick` to `() => setConfirmDeleteDay(true)`. At the end of the `DayEditor` return (inside the outer `Card`, after `<ExercisePicker .../>`), add:

```tsx
      <ConfirmDialog
        open={confirmDeleteDay}
        title={`Eliminar "${day.name}"`}
        description="Se elimina el día y sus ejercicios."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          setConfirmDeleteDay(false);
          void softDeleteTrainingDay(day.id);
        }}
        onCancel={() => setConfirmDeleteDay(false)}
      />
```

In `PlannedExerciseRow`, add `const [confirmRemove, setConfirmRemove] = useState(false);`. Change the "Quitar ejercicio" button `onClick` to `() => setConfirmRemove(true)`. At the end of the component's returned JSX add:

```tsx
      <ConfirmDialog
        open={confirmRemove}
        title="Quitar ejercicio"
        description="Se quita este ejercicio del día."
        confirmLabel="Quitar"
        destructive
        onConfirm={() => {
          setConfirmRemove(false);
          void softDeletePlannedExercise(planned.id);
        }}
        onCancel={() => setConfirmRemove(false)}
      />
```

- [ ] **Step 9: Verify gates**

Run: `npm run typecheck` → no errors. `npm run lint` → no errors. `npm run build` → succeeds.

- [ ] **Step 10: Commit**

```bash
git add "app/routines/[id]/page.tsx"
git commit -m "Migrate Routine editor to primitives (Card, Field, Switch, ConfirmDialog)"
```

**Behavioral check (user, post-merge):** the bodyweight/rest/RIR toggles render as sliding switches; the expand control is a chevron; deleting a routine/day/exercise opens an in-app modal.

---

## Task 3: Home screen

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update imports**

```tsx
import { LineChart, Settings } from "lucide-react";
```
```tsx
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
```

- [ ] **Step 2: Migrate the settings link to `IconButton`**

In the `topRight` prop, the settings `<Link>` keeps being a link but adopts the `IconButton` look — wrap the icon. Since `IconButton` renders a `<button>`, use a `Link` with the icon-button classes is cleaner: replace the settings `<Link>` with:

```tsx
          <Link
            href="/settings"
            aria-label="Ajustes"
            className="text-fg-muted hover:bg-bg-elevated flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
          >
            <Settings className="h-4 w-4" />
          </Link>
```

(A `Link` cannot be an `IconButton` — `IconButton` is a `<button>`. Keep it a `Link`; the only change vs. today is adding the `focus-visible` ring.)

- [ ] **Step 3: Migrate the "rutina activa" section to `Card`**

The active-routine `<section>` becomes a `<Card padding="lg">` (a `div`). When there is no active routine, an `EmptyState` is rendered instead of the Card. Replace the whole `{active ? (...) : (...)}` block with:

```tsx
        {active ? (
          <Card padding="lg">
            <p className="text-fg-muted text-xs uppercase tracking-wide">Rutina activa</p>
            <p className="mt-2 text-xl font-semibold">{active.name}</p>
            <p className="text-fg-muted mt-1 text-sm">
              {routineDurationLabel(active.started_at) ?? "Sin fecha de inicio"}
            </p>
            <Link href="/train" className="mt-4 block">
              <BigButton size="md" className="w-full">
                Empezar a entrenar
              </BigButton>
            </Link>
          </Card>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No tenés rutina activa"
            description="Creá tu primera rutina personalizada para empezar a entrenar."
            action={
              <Link href="/routines/new" className="w-full">
                <BigButton size="md" className="w-full">
                  Crear rutina
                </BigButton>
              </Link>
            }
          />
        )}
```

Add `Dumbbell` to the lucide import: `import { Dumbbell, LineChart, Settings } from "lucide-react";`.

- [ ] **Step 4: Migrate the two stat cards and fix the Stats card content**

Replace the History/Stats `grid` section. The History card keeps its count; the Stats card gets a real icon instead of the `📈` emoji:

```tsx
        <section className="grid grid-cols-2 gap-3">
          <Link href="/history">
            <Card padding="md" className="h-24">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Historial</p>
              <p className="mt-2 text-xl font-bold tabular-nums">{sessionCount}</p>
              <p className="text-fg-muted text-xs">
                {sessionCount === 1 ? "sesión" : "sesiones"}
              </p>
            </Card>
          </Link>
          <Link href="/stats">
            <Card padding="md" className="flex h-24 flex-col justify-between">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Stats</p>
              <div className="flex items-center gap-2">
                <LineChart className="text-accent h-5 w-5" />
                <p className="text-sm font-medium">Ver progreso</p>
              </div>
            </Card>
          </Link>
        </section>
```

- [ ] **Step 5: Verify gates**

Run: `npm run typecheck` → no errors. `npm run lint` → no errors. `npm run build` → succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "Migrate Home screen to primitives; fix Stats card"
```

**Behavioral check (user, post-merge):** Home cards use the shared Card surface; the Stats shortcut shows a Lucide chart icon instead of an emoji; the no-routine state is a proper empty state.

---

## Task 4: Stats screen

**Files:**
- Modify: `app/stats/page.tsx`

- [ ] **Step 1: Update imports**

```tsx
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
```

`cn` is no longer needed once the metric buttons become `Chip` — remove the `import { cn } from "@/lib/utils/cn";` line ONLY if no other `cn` usage remains (check first; the `Stat` helper uses `cn` — so keep the import).

- [ ] **Step 2: Migrate loading and empty states**

Replace the `trained === undefined` inner `<div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />` with `<Skeleton className="h-32" />`.

Replace the `trained.length === 0` block with:

```tsx
  if (trained.length === 0) {
    return (
      <AppShell title="Stats">
        <EmptyState
          icon={LineChart}
          title="Sin datos todavía"
          description="Registrá al menos una sesión para ver tu progreso por ejercicio."
        />
      </AppShell>
    );
  }
```

- [ ] **Step 3: Migrate the exercise selector to `Field` + `Select`**

Replace the `<label className="flex flex-col gap-1.5">...<select ...></label>` block with:

```tsx
        <Field label="Ejercicio" htmlFor="stats-exercise">
          <Select
            id="stats-exercise"
            value={selectedId ?? ""}
            onChange={(e) => setExplicitId(e.target.value || null)}
          >
            {trained.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </Field>
```

(`Select` supplies the chevron and `focus-visible` ring; the old `appearance-none ... focus:ring-white/20` markup is gone.)

- [ ] **Step 4: Migrate the metric buttons to `Chip`**

Replace the metric `<button>` map with `Chip`:

```tsx
        <div className="flex gap-2 overflow-x-auto">
          {METRICS.map((m) => (
            <Chip key={m.id} active={metric === m.id} onClick={() => setMetric(m.id)}>
              {m.label}
            </Chip>
          ))}
        </div>
```

- [ ] **Step 5: Migrate the history-list rows and "sin sesiones" hint to `Card`**

Replace the `<p className="bg-bg-elevated border-border text-fg-muted rounded-2xl border p-4 text-sm">Sin sesiones registradas.</p>` with:

```tsx
            <Card padding="md" className="text-fg-muted text-sm">
              Sin sesiones registradas.
            </Card>
```

In the history `<li>`, replace `<li key={p.session_id} className="bg-bg-elevated border-border rounded-2xl border p-3">` with `<li key={p.session_id}>` wrapping a `<Card padding="sm">`, and close with `</Card></li>`.

In `SummaryStrip`'s `Stat` helper, replace `<div className="bg-bg-elevated border-border rounded-2xl border p-3">` with `<Card padding="sm">` and the closing `</div>` with `</Card>`.

- [ ] **Step 6: Verify gates**

Run: `npm run typecheck` → no errors. `npm run lint` → no errors. `npm run build` → succeeds.

- [ ] **Step 7: Commit**

```bash
git add app/stats/page.tsx
git commit -m "Migrate Stats screen to primitives (Card, Field+Select, Chip)"
```

**Behavioral check (user, post-merge):** the exercise selector shows a visible chevron; metric pills are the shared Chip; cards use the shared surface.

---

## Task 5: Final verification

- [ ] **Step 1: Full test suite** — `npm test` → all pass (suite + the new `app/train/[id]/page.test.tsx`).
- [ ] **Step 2: Typecheck** — `npm run typecheck` → no errors.
- [ ] **Step 3: Lint** — `npm run lint` → no errors.
- [ ] **Step 4: Build** — `npm run build` → succeeds.
- [ ] **Step 5: Commit any lint/format fixes** (skip if none):

```bash
git add -A
git commit -m "Fix lint/format issues in Fase 3b-i"
```

---

## Done criteria

- Train live, Routine editor, Home and Stats screens use the Fase 2 primitives instead of duplicated markup.
- Train live shows a `done / expected` progress bar; the dead `expectedPerExercise` code and stale comment are gone; `computeSessionProgress` is covered by a passing test.
- All `window.confirm()` calls in these four screens are replaced by `ConfirmDialog`.
- Routine editor uses `Switch` (no `accent-green-500`), the shared `Field`, and a chevron toggle.
- Home's Stats card uses a Lucide icon, not an emoji.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass.

## Follow-up

Fase 3b-ii (separate plan) migrates the remaining 7 screens: Train selector, Train finish, Routines list, History, History detail, Settings, Login — mostly mechanical `Card`/`Skeleton`/`EmptyState`/`IconButton`/`Chip` swaps plus the `set-row.tsx` / `exercise-picker.tsx` `confirm()` and pill cleanups.
