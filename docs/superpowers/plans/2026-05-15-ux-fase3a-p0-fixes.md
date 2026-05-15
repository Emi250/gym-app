# UX Fase 3a — P0 Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three remaining P0 findings from the UX audit — the Train-live `target_sets` bug, missing error feedback on user-facing mutations, and an unlabelled day-name input.

**Architecture:** Three independent fixes. (1) `target_sets` is snapshotted from `planned_exercises` into `session_exercises` — a new Supabase column, a type field, and a copy in `startSession`. (2) Mutation handlers gain `catch` blocks that surface an error toast via the existing `showToast`. (3) The day-name input gets an `aria-label`.

**Tech Stack:** Next.js 16, React 19, Dexie (offline store) + Supabase (sync), Vitest + `fake-indexeddb`, `lucide-react`.

---

## Conventions (read before starting)

- **Vitest has `globals: false`.** Test files import helpers explicitly: `import { describe, it, expect, beforeEach } from "vitest";`
- Dexie test pattern (see `lib/sync/engine.test.ts`): `tests/setup.ts` loads `fake-indexeddb/auto`; `getDb()` works in the jsdom environment; clear tables in `beforeEach`.
- Run one test file: `npm test -- lib/db/session-queries.test.ts`
- Run all: `npm test`. Typecheck: `npm run typecheck`. Lint: `npm run lint`. Build: `npm run build`.
- Toast API: `import { showToast } from "@/lib/toast/toast-store";` — `showToast(message: string, kind: "success" | "info" | "error")`.

## Verification approach — read this

The repo has **no page/screen test harness** — only `components/ui/*` and `lib/*` have tests. Building a screen-testing harness is out of scope for this P0 hotfix plan (it is its own effort, better placed in Fase 3b or later).

Therefore:
- **Task 1** (data layer) is genuinely unit-testable and uses **TDD**.
- **Tasks 2–4** are presentational/page edits. They are verified by **typecheck + lint + build passing** plus an explicit **behavioral description** the user confirms manually (the screens sit behind Google OAuth, which can't be exercised headlessly — same constraint noted in the audit). Each task states exactly what to check.

## Scope

**In scope:** the 3 P0 findings only. **Out of scope:** the `totals`/`expectedPerExercise` dead code and progress-bar redesign in Train-live (P1 — Fase 3b), migrating screens to the new primitives (Fase 3b), all P2 polish (Fase 4).

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `supabase/migrations/0005_session_target_sets.sql` | Adds `target_sets` column to the `session_exercises` table | Create |
| `lib/db/types.ts` | Shared row types | Modify — add `target_sets` to `SessionExercise` |
| `lib/db/session-queries.ts` | Session CRUD incl. `startSession` snapshot | Modify — copy `target_sets` |
| `lib/db/session-queries.test.ts` | Tests for session queries | Create |
| `app/train/[id]/page.tsx` | Live session screen | Modify — `ExerciseBlock` reads `target_sets` |
| `components/set-row.tsx` | Set logging row | Modify — error toast on save failure |
| `app/routines/new/page.tsx` | New-routine form | Modify — error toast on create failure |
| `app/login/page.tsx` | Login screen | Modify — error toast on sign-in failure |
| `app/routines/[id]/page.tsx` | Routine editor | Modify — error toast on finish; `aria-label` on day input |

> Note on Dexie: `target_sets` is a non-indexed field, so **no Dexie schema version bump is needed** — Dexie stores non-indexed fields freely. Only the TypeScript type and the Supabase column change.

---

## Task 1: Snapshot `target_sets` into the data layer

**Bug:** `startSession` copies planned-exercise fields into `session_exercises` but omits `target_sets`. The live screen then hardcodes 3 sets, ignoring the routine's configured count.

**Files:**
- Create: `supabase/migrations/0005_session_target_sets.sql`
- Modify: `lib/db/types.ts`
- Modify: `lib/db/session-queries.ts`
- Create: `lib/db/session-queries.test.ts`

- [ ] **Step 1: Write the failing test** — create `lib/db/session-queries.test.ts`:

```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/schema";
import { nowIso, uuid } from "@/lib/db/ids";
import { startSession } from "./session-queries";
import type { LocalExercise, LocalPlannedExercise, LocalTrainingDay } from "./types";

async function reset() {
  const db = getDb();
  await Promise.all([
    db.exercises.clear(),
    db.training_days.clear(),
    db.planned_exercises.clear(),
    db.sessions.clear(),
    db.session_exercises.clear(),
  ]);
}

describe("startSession", () => {
  beforeEach(reset);

  it("snapshots target_sets from the planned exercise into the session exercise", async () => {
    const db = getDb();
    const now = nowIso();
    const dayId = uuid();
    const exerciseId = uuid();
    const routineId = uuid();

    const exercise: LocalExercise = {
      id: exerciseId,
      user_id: null,
      name: "Sentadilla",
      muscle_group: "legs",
      category: "compound_heavy",
      default_increment_kg: 2.5,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 0,
      _lastSyncedAt: null,
    };
    const day: LocalTrainingDay = {
      id: dayId,
      routine_id: routineId,
      name: "Día A",
      position: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 0,
      _lastSyncedAt: null,
    };
    const planned: LocalPlannedExercise = {
      id: uuid(),
      training_day_id: dayId,
      exercise_id: exerciseId,
      position: 0,
      target_sets: 5,
      target_reps_min: 8,
      target_reps_max: 12,
      target_weight_kg: 60,
      target_rir: 2,
      rest_seconds: 90,
      is_bodyweight: false,
      notes: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 0,
      _lastSyncedAt: null,
    };

    await db.exercises.add(exercise);
    await db.training_days.add(day);
    await db.planned_exercises.add(planned);

    const sessionId = await startSession({
      user_id: uuid(),
      routine_id: routineId,
      training_day_id: dayId,
    });

    const sExercises = await db.session_exercises
      .where({ session_id: sessionId })
      .toArray();
    expect(sExercises).toHaveLength(1);
    expect(sExercises[0].target_sets).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/db/session-queries.test.ts`
Expected: FAIL — `expected undefined to be 5` (`startSession` does not copy `target_sets`).

- [ ] **Step 3: Add `target_sets` to the `SessionExercise` type**

In `lib/db/types.ts`, in the `SessionExercise` interface, add `target_sets` right after `position`:

```ts
export interface SessionExercise extends SyncFields {
  id: Uuid;
  session_id: Uuid;
  exercise_id: Uuid;
  exercise_name: string;
  position: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_weight_kg: number;
  target_rir: number | null;
  rest_seconds: number | null;
  is_bodyweight: boolean;
  created_at: Iso;
}
```

- [ ] **Step 4: Copy `target_sets` in `startSession`**

In `lib/db/session-queries.ts`, inside `startSession`, the `sExercises` map (currently starting `const sExercises: LocalSessionExercise[] = planned.map((p) => ({`) builds each session-exercise row. Add `target_sets: p.target_sets,` immediately after the `position: p.position,` line:

```ts
    const sExercises: LocalSessionExercise[] = planned.map((p) => ({
      id: uuid(),
      session_id: sessionId,
      exercise_id: p.exercise_id,
      exercise_name: exerciseNameById.get(p.exercise_id) ?? "Ejercicio",
      position: p.position,
      target_sets: p.target_sets,
      target_reps_min: p.target_reps_min,
      target_reps_max: p.target_reps_max,
      target_weight_kg: p.target_weight_kg,
      target_rir: p.target_rir,
      rest_seconds: p.rest_seconds,
      is_bodyweight: p.is_bodyweight,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 1,
      _lastSyncedAt: null,
    }));
```

- [ ] **Step 5: Create the Supabase migration**

The sync engine (`lib/sync/engine.ts`) pushes every row field to Supabase, so the remote `session_exercises` table needs the column or the upsert will error. Create `supabase/migrations/0005_session_target_sets.sql` (mirrors the column-add style of `0003`/`0004`):

```sql
-- 0005_session_target_sets.sql — Snapshot target_sets into session_exercises.
-- planned_exercises already carries target_sets; sessions snapshot planned data,
-- so session_exercises needs its own copy. Existing rows default to 3 (the value
-- the live-session UI previously assumed).

alter table session_exercises
  add column if not exists target_sets int not null default 3 check (target_sets > 0);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- lib/db/session-queries.test.ts`
Expected: PASS (1 test).

- [ ] **Step 7: Run typecheck**

Run: `npm run typecheck`
Expected: no errors. (If `app/train/[id]/page.tsx` errors because it does not yet read `target_sets` — that is fine, it has no type error from this change; the field is additive. If any error appears, report it.)

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/0005_session_target_sets.sql lib/db/types.ts lib/db/session-queries.ts lib/db/session-queries.test.ts
git commit -m "Snapshot target_sets into session_exercises"
```

> **Deployment note for the user:** migration `0005` must be applied to the Supabase project (`supabase db push` or the SQL editor) before the synced app is used. Until then, sessions still work offline; sync of `session_exercises` would fail against an un-migrated remote.

---

## Task 2: `ExerciseBlock` reads the real `target_sets`

**Bug:** `ExerciseBlock` in the live-session screen hardcodes `const planned = 3`.

**Files:**
- Modify: `app/train/[id]/page.tsx`

- [ ] **Step 1: Replace the hardcoded set count**

In `app/train/[id]/page.tsx`, inside the `ExerciseBlock` function, find:

```tsx
  const performed = sets.length;
  const planned = 3;
  const totalToShow = Math.max(planned, performed + 1);
```

Replace the middle line so `planned` comes from the session exercise:

```tsx
  const performed = sets.length;
  const planned = session_exercise.target_sets;
  const totalToShow = Math.max(planned, performed + 1);
```

That is the only change. (`session_exercise` is already a parameter of `ExerciseBlock`, typed `LocalSessionExercise`, which now has `target_sets` from Task 1. Leave the `totals`/`expectedPerExercise` code in the parent component untouched — that dead code is a Fase 3b concern.)

- [ ] **Step 2: Verify typecheck, lint, build**

Run: `npm run typecheck` → no errors.
Run: `npm run lint` → no errors.
Run: `npm run build` → build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/train/[id]/page.tsx
git commit -m "Use configured target_sets in live session screen"
```

**Behavioral check (for the user, post-merge):** create a routine whose exercise has `target_sets` ≠ 3 (e.g. 5), start a session for that day — the live screen should render 5 set rows for that exercise (plus one extra empty row), not 3.

---

## Task 3: Error toasts on user-facing mutations

**Bug:** several mutations have `try/finally` with no `catch`; a failure (offline write rejected, sign-in error, etc.) leaves the user with no feedback. The `ToastContainer` already supports `kind="error"`; it is just unused.

**Files:**
- Modify: `components/set-row.tsx`
- Modify: `app/routines/new/page.tsx`
- Modify: `app/train/[id]/page.tsx`
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Add a catch to the set-save handler**

In `components/set-row.tsx`, the save button's `onClick` currently has `try { ... } finally { setSaving(false); }`. Add a `catch` between them:

```tsx
          try {
            await upsertSet({
              id: existing?.id,
              session_exercise_id,
              set_number,
              weight_kg: weight,
              reps,
              rir,
            });
            setEditing(false);
            showToast(isNew ? `Serie ${set_number} guardada` : "Cambios guardados", "success");
            // Only start the timer for a freshly logged set, not an edit.
            if (isNew && rest_seconds && rest_seconds > 0) {
              startRestTimer(rest_seconds);
            }
          } catch {
            showToast("No se pudo guardar la serie", "error");
          } finally {
            setSaving(false);
          }
```

(`showToast` is already imported in `set-row.tsx`.)

- [ ] **Step 2: Add a catch to the new-routine save**

In `app/routines/new/page.tsx`, the `handleSave` function has `try { ... } finally { setSaving(false); }`. Add a `catch`:

```tsx
    try {
      const id = await createRoutine({
        user_id: userId,
        name: name.trim(),
        started_at: startedAt ? new Date(startedAt).toISOString() : null,
        activate,
      });
      showToast(`Rutina "${name.trim()}" creada`, "success");
      router.replace(`/routines/${id}`);
    } catch {
      showToast("No se pudo crear la rutina", "error");
    } finally {
      setSaving(false);
    }
```

(`showToast` is already imported in `app/routines/new/page.tsx`.)

- [ ] **Step 3: Add a catch to the finish-session handler**

In `app/train/[id]/page.tsx`, first add the toast import. The existing import block near the top includes lines like `import { applyProgressionToSession } from "@/lib/progression/apply";`. Add this line alongside the other `@/lib` imports:

```tsx
import { showToast } from "@/lib/toast/toast-store";
```

Then the "Terminar sesión" button's `onClick` has `try { ... } finally { setFinishing(false); }`. Add a `catch`:

```tsx
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
```

- [ ] **Step 4: Surface a toast on sign-in failure**

In `app/login/page.tsx`, add the toast import alongside the existing import (`import { signInWithGoogle } from "@/lib/auth/current-user";`):

```tsx
import { showToast } from "@/lib/toast/toast-store";
```

Then the sign-in button's `onClick` currently has `catch (err) { console.error(err); setBusy(false); }`. Add a toast:

```tsx
        onClick={async () => {
          setBusy(true);
          try {
            await signInWithGoogle();
          } catch (err) {
            console.error(err);
            showToast("No se pudo iniciar sesión. Reintentá.", "error");
            setBusy(false);
          }
        }}
```

- [ ] **Step 5: Verify typecheck, lint, build**

Run: `npm run typecheck` → no errors.
Run: `npm run lint` → no errors.
Run: `npm run build` → build succeeds.

- [ ] **Step 6: Commit**

```bash
git add components/set-row.tsx app/routines/new/page.tsx app/train/[id]/page.tsx app/login/page.tsx
git commit -m "Show error toasts when user-facing mutations fail"
```

**Behavioral check (for the user, post-merge):** trigger a failure (e.g. block network and attempt sign-in, or force a write error) and confirm a red error toast appears instead of a silent no-op.

---

## Task 4: Accessible label on the day-name input

**Bug:** in the routine editor, the day-name `<input>` is a bare control styled as a heading, with no accessible name — a screen reader announces it without context.

**Files:**
- Modify: `app/routines/[id]/page.tsx`

- [ ] **Step 1: Add `aria-label` to the day-name input**

In `app/routines/[id]/page.tsx`, inside the `DayEditor` function, find the day-name input:

```tsx
        <input
          value={day.name}
          onChange={(e) => void renameTrainingDay(day.id, e.target.value)}
          className="flex-1 bg-transparent text-lg font-semibold outline-none"
        />
```

Add an `aria-label`:

```tsx
        <input
          value={day.name}
          onChange={(e) => void renameTrainingDay(day.id, e.target.value)}
          aria-label="Nombre del día"
          className="flex-1 bg-transparent text-lg font-semibold outline-none"
        />
```

- [ ] **Step 2: Verify typecheck, lint, build**

Run: `npm run typecheck` → no errors.
Run: `npm run lint` → no errors.
Run: `npm run build` → build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/routines/[id]/page.tsx
git commit -m "Add accessible label to the day-name input"
```

---

## Task 5: Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass (the pre-existing suite + the new `session-queries.test.ts`).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck` → no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint` → no errors.

- [ ] **Step 4: Build**

Run: `npm run build` → build succeeds.

- [ ] **Step 5: Commit any lint/format fixes**

```bash
git add -A
git commit -m "Fix lint/format issues in Fase 3a"
```

(Skip if Steps 1–4 produced no changes.)

---

## Done criteria

- `session_exercises` carries `target_sets`; `startSession` snapshots it (covered by a passing test); migration `0005` exists.
- The live-session screen renders the configured number of set rows, not a hardcoded 3.
- Set-save, routine-create, finish-session and sign-in failures all surface a red error toast.
- The day-name input has an accessible label.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass.
- **User action required:** apply Supabase migration `0005` to the project before relying on sync.
