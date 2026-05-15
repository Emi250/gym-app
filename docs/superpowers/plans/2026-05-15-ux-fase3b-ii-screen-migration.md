# UX Fase 3b-ii — Remaining Screen Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the remaining screens and shared components to the Fase 2 UI primitives, completing the screen-migration effort.

**Architecture:** Mechanical migration — duplicated `bg-bg-elevated border-border rounded-2xl border p-X` markup becomes `<Card>`; ad-hoc loading blocks become `<Skeleton>`; ad-hoc empty states become `<EmptyState>`; the last `window.confirm()` calls become `<ConfirmDialog>`; the locally-defined `Chip` in `exercise-picker.tsx` is replaced by the shared one; bare interactive elements gain a `focus-visible` ring.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, the `components/ui/` primitives, Vitest.

---

## Conventions (read before starting)

- Branch off `main` (which has Fase 2 + Fase 3a + Fase 3b-i).
- Do NOT run `npm install` — the worktree resolves `node_modules` from the parent repo (running it creates a stray `package-lock.json`; the repo uses pnpm).
- Verification per task: `npm run typecheck`, `npm run lint`, `npm run build` — all must pass. To run the test suite use `npx vitest run --exclude "**/.claude/**"` (the `--exclude` avoids scanning sibling worktree copies).
- Primitive APIs (from `components/ui/`):
  - `<Card padding="none|sm|md|lg">` (default `md`) — renders a `div`.
  - `<Skeleton className="h-32" />` — sized via className.
  - `<EmptyState icon={LucideIcon} title description? action? />`.
  - `<Chip active? onClick>` — pill toggle (`<button aria-pressed>`).
  - `<ConfirmDialog open title description? confirmLabel? cancelLabel? destructive? onConfirm onCancel />` — controlled.
- Standard focus-ring classes for bare interactive elements: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40`.

## Verification approach

All changes are presentational — no new logic, no new tests. Each task is verified by `typecheck` + `lint` + `build` passing (the repo has no screen-test harness). The existing test suite must stay green.

## Scope

**In scope:** Train selector, Train finish, Routines list, History, History detail, Settings screens; `components/set-row.tsx` and `components/ui/exercise-picker.tsx`. **Out of scope:** the Login screen (its only P1 — the error toast — was done in Fase 3a; its emoji logo is a P2 for Fase 4); all P2 polish (Fase 4); the 4 screens already migrated in Fase 3b-i.

## File Structure

| File | Change |
|------|--------|
| `app/train/page.tsx` | `Card`/`Skeleton`/`EmptyState`; focus ring on day buttons; `confirm()` → `ConfirmDialog` |
| `app/train/[id]/finish/page.tsx` | `Card`/`Skeleton` |
| `app/routines/page.tsx` | `Card`/`Skeleton`; focus ring on the activate button |
| `app/history/page.tsx` | `Card`/`Skeleton`/`EmptyState` |
| `app/history/[id]/page.tsx` | `Card`/`Skeleton` |
| `app/settings/page.tsx` | `Card` |
| `components/set-row.tsx` | `confirm()` → `ConfirmDialog` |
| `components/ui/exercise-picker.tsx` | local `Chip` → shared `Chip` |

---

## Task 1: Train selector screen

**Files:** Modify `app/train/page.tsx`.

FIRST read the file. It has three render branches: an active-session view, a no-active-routine view, and the day-list view.

- [ ] **Step 1: Imports**

Add: `import { Card } from "@/components/ui/card";`, `import { ConfirmDialog } from "@/components/ui/confirm-dialog";`, `import { EmptyState } from "@/components/ui/empty-state";`, `import { Skeleton } from "@/components/ui/skeleton";`.

- [ ] **Step 2: Active-session card → `Card`**

In the `activeSession` branch, replace `<div className="bg-bg-elevated border-border rounded-2xl border p-5">` with `<Card padding="lg">` and its closing `</div>` with `</Card>`.

- [ ] **Step 3: Loading skeleton → `Skeleton`**

Both `<div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />` occurrences become `<Skeleton className="h-32" />`.

- [ ] **Step 4: No-active-routine block → `EmptyState`**

Replace the `!activeRoutine` branch's `<div className="bg-bg-elevated border-border flex flex-col items-center gap-3 rounded-2xl border p-6 text-center">...</div>` with:

```tsx
        <EmptyState
          icon={Dumbbell}
          title="No hay rutina activa"
          description="Creá o activá una rutina para empezar a entrenar."
          action={
            <Link href="/routines" className="w-full">
              <BigButton size="md" className="w-full">
                Ir a Rutinas
              </BigButton>
            </Link>
          }
        />
```

(`Dumbbell` and `Link` are already imported.)

- [ ] **Step 5: "Esta rutina aún no tiene días" block → `Card`**

Replace that `<div className="bg-bg-elevated border-border rounded-2xl border p-5">` with `<Card padding="lg">` / `</Card>`.

- [ ] **Step 6: Focus ring on the day buttons**

The day `<button className="bg-bg-elevated border-border flex w-full items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.99]">` — append the focus classes so it ends with `... active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40`.

- [ ] **Step 7: `confirm()` → `ConfirmDialog`**

The active-session "Descartar" `BigButton` uses `confirm("¿Descartar la sesión sin guardar?")`. Add `const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);` at the top of `TrainPage` (`useState` is already imported). Change that button's `onClick` to `() => setConfirmDiscardOpen(true)`. Add inside the `activeSession` branch's `AppShell`, after the buttons:

```tsx
          <ConfirmDialog
            open={confirmDiscardOpen}
            title="Descartar sesión"
            description="Se descarta la sesión sin guardar los datos."
            confirmLabel="Descartar"
            destructive
            onConfirm={() => {
              setConfirmDiscardOpen(false);
              void discardSession(activeSession.id);
            }}
            onCancel={() => setConfirmDiscardOpen(false)}
          />
```

- [ ] **Step 8: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add app/train/page.tsx
git commit -m "Migrate Train selector screen to primitives"
```

---

## Task 2: Train finish screen

**Files:** Modify `app/train/[id]/finish/page.tsx`.

FIRST read the file.

- [ ] **Step 1: Imports**

Add `import { Card } from "@/components/ui/card";` and `import { Skeleton } from "@/components/ui/skeleton";`.

- [ ] **Step 2: Loading skeleton → `Skeleton`**

Replace `<div className="bg-bg-elevated h-48 animate-pulse rounded-2xl" />` with `<Skeleton className="h-48" />`.

- [ ] **Step 3: Celebration card → `Card`**

Replace the `<div className="bg-bg-elevated border-border flex items-center gap-3 rounded-2xl border p-5">` (the "¡Listo!" header) with `<Card padding="lg" className="flex items-center gap-3">` and its closing `</div>` with `</Card>`.

- [ ] **Step 4: "No registraste series" block → `Card`**

Replace the `diffs.length === 0` paragraph `<p className="bg-bg-elevated border-border text-fg-muted rounded-2xl border p-4 text-sm">` with `<Card padding="md" className="text-fg-muted text-sm">` and its closing `</p>` with `</Card>`.

- [ ] **Step 5: `DiffRow` container → `Card`**

In the `DiffRow` component, replace `<li className="bg-bg-elevated border-border flex items-center justify-between rounded-2xl border p-3">` with `<li>` wrapping a `<Card padding="sm" className="flex items-center justify-between">`, closing with `</Card></li>`.

- [ ] **Step 6: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add "app/train/[id]/finish/page.tsx"
git commit -m "Migrate Train finish screen to primitives"
```

---

## Task 3: Routines list screen

**Files:** Modify `app/routines/page.tsx`.

FIRST read the file.

- [ ] **Step 1: Imports**

Add `import { Card } from "@/components/ui/card";` and `import { Skeleton } from "@/components/ui/skeleton";`.

- [ ] **Step 2: Delete the local `Skeleton` function**

Remove the local `function Skeleton() { return (<div className="flex flex-col gap-3">...</div>); }` definition. Replace its single call site `<Skeleton />` with:

```tsx
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
```

(The imported `Skeleton` shadows the removed local one.)

- [ ] **Step 3: `EmptyHint` → `Card`**

The `EmptyHint` helper renders `<p className="bg-bg-elevated border-border text-fg-muted rounded-2xl border p-4 text-sm">{children}</p>`. Change it to:

```tsx
function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <Card padding="md" className="text-fg-muted text-sm">
      {children}
    </Card>
  );
}
```

- [ ] **Step 4: `RoutineCard` container → `Card`**

In `RoutineCard`, replace `<div className="bg-bg-elevated border-border flex items-center gap-3 rounded-2xl border p-4">` with `<Card padding="md" className="flex items-center gap-3">` and its closing `</div>` with `</Card>`.

- [ ] **Step 5: Focus ring on `ActivateButton`**

The `ActivateButton`'s `<button className="text-fg-muted disabled:opacity-30">` — change the className to `text-fg-muted disabled:opacity-30 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40`.

- [ ] **Step 6: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add app/routines/page.tsx
git commit -m "Migrate Routines list screen to primitives"
```

---

## Task 4: History and History detail screens

**Files:** Modify `app/history/page.tsx` and `app/history/[id]/page.tsx`.

FIRST read both files.

- [ ] **Step 1: `app/history/page.tsx` — imports**

Add `import { Card } from "@/components/ui/card";`, `import { EmptyState } from "@/components/ui/empty-state";`, `import { Skeleton } from "@/components/ui/skeleton";`.

- [ ] **Step 2: `app/history/page.tsx` — loading skeleton**

Replace `<div className="bg-bg-elevated h-24 animate-pulse rounded-2xl" />` with `<Skeleton className="h-24" />`.

- [ ] **Step 3: `app/history/page.tsx` — empty state**

Replace the `sessions.length === 0` block's `<div className="bg-bg-elevated border-border rounded-2xl border p-5 text-center">...</div>` with:

```tsx
        <EmptyState
          icon={Dumbbell}
          title="Sin sesiones todavía"
          description="Cuando termines una sesión va a aparecer acá."
        />
```

(`Dumbbell` is already imported.)

- [ ] **Step 4: `app/history/page.tsx` — session rows → `Card`**

Each session `<Link href={...} className="bg-bg-elevated border-border flex items-center gap-3 rounded-2xl border p-4">` becomes a `<Link>` wrapping a `<Card>`:

```tsx
            <Link href={`/history/${s.id}`}>
              <Card padding="md" className="flex items-center gap-3">
```

with a matching `</Card>` before `</Link>`.

- [ ] **Step 5: `app/history/[id]/page.tsx` — imports**

Add `import { Card } from "@/components/ui/card";` and `import { Skeleton } from "@/components/ui/skeleton";`.

- [ ] **Step 6: `app/history/[id]/page.tsx` — loading skeleton**

Replace `<div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />` with `<Skeleton className="h-32" />`.

- [ ] **Step 7: `app/history/[id]/page.tsx` — date card and exercise sections → `Card`**

Replace the date `<div className="bg-bg-elevated border-border rounded-2xl border p-4">` with `<Card padding="md">` / `</Card>`.

Each exercise `<section key={se.id} className="bg-bg-elevated border-border rounded-2xl border p-4">` becomes `<Card key={se.id} padding="md">` / `</Card>`.

Leave the nested set-row `<li className="bg-bg border-border ...">` items unchanged — they are nested rows, not card surfaces.

- [ ] **Step 8: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add app/history/page.tsx "app/history/[id]/page.tsx"
git commit -m "Migrate History screens to primitives"
```

---

## Task 5: Settings screen

**Files:** Modify `app/settings/page.tsx`.

FIRST read the file.

- [ ] **Step 1: Imports**

Add `import { Card } from "@/components/ui/card";`.

- [ ] **Step 2: `Section` helper → `Card`**

The `Section` helper renders `<div className="bg-bg-elevated border-border rounded-2xl border p-4">`. Change it to:

```tsx
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card padding="md">
      <p className="text-fg-muted text-xs uppercase tracking-wide">{label}</p>
      <div className="mt-1">{children}</div>
    </Card>
  );
}
```

- [ ] **Step 3: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add app/settings/page.tsx
git commit -m "Migrate Settings screen to Card primitive"
```

---

## Task 6: Shared component cleanups (`set-row`, `exercise-picker`)

**Files:** Modify `components/set-row.tsx` and `components/ui/exercise-picker.tsx`.

FIRST read both files.

- [ ] **Step 1: `set-row.tsx` — `confirm()` → `ConfirmDialog`**

Add `import { ConfirmDialog } from "@/components/ui/confirm-dialog";`.

Add a state hook near the other `useState` calls in `SetRow`: `const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);`.

The delete `<button>` (the Trash button, only rendered when `existing`) currently has `onClick={() => { if (confirm("¿Borrar esta serie?")) void softDeleteSet(existing.id); }}`. Change it to `onClick={() => setConfirmDeleteOpen(true)}`.

The editing branch of `SetRow` returns a single `<div className="bg-bg border-border rounded-xl border ...">`. Wrap that returned `<div>` in a React fragment `<>...</>` and add the dialog as a sibling:

```tsx
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Borrar serie"
        description="Se elimina esta serie registrada."
        confirmLabel="Borrar"
        destructive
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          if (existing) void softDeleteSet(existing.id);
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
```

- [ ] **Step 2: `exercise-picker.tsx` — local `Chip` → shared `Chip`**

Add `import { Chip } from "@/components/ui/chip";`.

Delete the local `function Chip({ active, onClick, children }: ...) { ... }` definition at the bottom of the file. The shared `Chip` has the signature `<Chip active? onClick>{children}</Chip>` — the existing call sites (`<Chip active={filter === null} onClick={() => setFilter(null)}>Todos</Chip>` and the `MUSCLE_ORDER.map` ones) are already compatible and need no change.

- [ ] **Step 3: Verify & commit**

`npm run typecheck`, `npm run lint`, `npm run build` → all pass. Then:

```bash
git add components/set-row.tsx components/ui/exercise-picker.tsx
git commit -m "Replace confirm() in set-row and dedupe exercise-picker Chip"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full test suite** — `npx vitest run --exclude "**/.claude/**"` → all pass (unchanged count vs. baseline; this plan adds no tests).
- [ ] **Step 2: Typecheck** — `npm run typecheck` → no errors.
- [ ] **Step 3: Lint** — `npm run lint` → no errors.
- [ ] **Step 4: Build** — `npm run build` → succeeds.
- [ ] **Step 5: Commit any lint/format fixes** (skip if none):

```bash
git add -A
git commit -m "Fix lint/format issues in Fase 3b-ii"
```

---

## Done criteria

- Train selector, Train finish, Routines list, History, History detail and Settings screens use the Fase 2 primitives instead of duplicated markup.
- The last `window.confirm()` calls (Train selector discard, set-row delete) are replaced by `ConfirmDialog`.
- `exercise-picker.tsx` uses the shared `Chip`; its local duplicate is deleted.
- Day buttons and the activate button have a visible focus ring.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass.

## Follow-up

After this, the screen-migration effort is complete. Fase 4 (polish) remains: emoji→Lucide on Login, microcopy, entry/feedback animations, `Switch` accessible names, and the other P2 audit items.
