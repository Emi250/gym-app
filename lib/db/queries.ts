import { useLiveQuery } from "dexie-react-hooks";
import { useCurrentUserId } from "@/lib/auth/current-user";
import { getDb } from "./schema";
import { nowIso, uuid } from "./ids";
import type {
  LocalExercise,
  LocalPlannedExercise,
  LocalRoutine,
  LocalTrainingDay,
} from "./types";

/* ------------------------------ Exercises ------------------------------- */

export function useExercises() {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    const db = getDb();
    const rows = await db.exercises
      .filter((e) => !e.deleted_at && (e.user_id === null || e.user_id === userId))
      .toArray();
    return rows.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [userId]);
}

export async function createCustomExercise(
  input: Omit<
    LocalExercise,
    "id" | "created_at" | "updated_at" | "deleted_at" | "_dirty" | "_lastSyncedAt"
  >,
): Promise<string> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();
  await db.exercises.add({
    ...input,
    id,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    _dirty: 1,
    _lastSyncedAt: null,
  });
  return id;
}

/* ------------------------------ Routines -------------------------------- */

export function useRoutines() {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!userId) return { active: null, inactive: [], archived: [] };
    const db = getDb();
    const all = await db.routines
      .filter((r) => !r.deleted_at && r.user_id === userId)
      .toArray();
    const active = all.find((r) => r.is_active && !r.is_archived) ?? null;
    const inactive = all
      .filter((r) => !r.is_active && !r.is_archived)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const archived = all
      .filter((r) => r.is_archived)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return { active, inactive, archived };
  }, [userId]);
}

export function useRoutine(id: string | undefined) {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!id || !userId) return null;
    const db = getDb();
    const routine = await db.routines.get(id);
    if (!routine || routine.deleted_at || routine.user_id !== userId) return null;
    const days = (await db.training_days.where({ routine_id: id }).toArray())
      .filter((d) => !d.deleted_at)
      .sort((a, b) => a.position - b.position);
    const dayIds = days.map((d) => d.id);
    const plannedRows =
      dayIds.length === 0
        ? []
        : await db.planned_exercises.where("training_day_id").anyOf(dayIds).toArray();
    const planned = plannedRows.filter((p) => !p.deleted_at);
    return { routine, days, planned };
  }, [id, userId]);
}

export interface CreateRoutineInput {
  user_id: string;
  name: string;
  started_at: string | null;
  activate: boolean;
}

export async function createRoutine(input: CreateRoutineInput): Promise<string> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();
  await db.transaction("rw", db.routines, async () => {
    if (input.activate) {
      const all = await db.routines.filter((r) => !r.deleted_at && r.is_active).toArray();
      for (const r of all) {
        await db.routines.update(r.id, {
          is_active: false,
          updated_at: now,
          _dirty: 1,
        });
      }
    }
    const row: LocalRoutine = {
      id,
      user_id: input.user_id,
      name: input.name,
      is_active: input.activate,
      is_archived: false,
      started_at: input.started_at,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 1,
      _lastSyncedAt: null,
    };
    await db.routines.add(row);
  });
  return id;
}

export async function updateRoutine(
  id: string,
  patch: Partial<Pick<LocalRoutine, "name" | "started_at" | "is_archived">>,
): Promise<void> {
  const db = getDb();
  await db.routines.update(id, { ...patch, updated_at: nowIso(), _dirty: 1 });
}

export async function activateRoutine(id: string): Promise<void> {
  const db = getDb();
  const now = nowIso();
  await db.transaction("rw", db.routines, async () => {
    const currentActive = await db.routines.filter((r) => !r.deleted_at && r.is_active).toArray();
    for (const r of currentActive) {
      if (r.id !== id) {
        await db.routines.update(r.id, { is_active: false, updated_at: now, _dirty: 1 });
      }
    }
    await db.routines.update(id, {
      is_active: true,
      is_archived: false,
      updated_at: now,
      _dirty: 1,
    });
  });
}

export async function softDeleteRoutine(id: string): Promise<void> {
  const db = getDb();
  const now = nowIso();
  await db.routines.update(id, {
    deleted_at: now,
    is_active: false,
    updated_at: now,
    _dirty: 1,
  });
}

/* --------------------------- Training Days ------------------------------ */

export async function addTrainingDay(routine_id: string, name: string): Promise<string> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();
  const existing = await db.training_days.where({ routine_id }).toArray();
  const maxPos = existing
    .filter((d) => !d.deleted_at)
    .reduce((acc, d) => Math.max(acc, d.position), -1);
  const row: LocalTrainingDay = {
    id,
    routine_id,
    name,
    position: maxPos + 1,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    _dirty: 1,
    _lastSyncedAt: null,
  };
  await db.training_days.add(row);
  await db.routines.update(routine_id, { updated_at: now, _dirty: 1 });
  return id;
}

export async function renameTrainingDay(id: string, name: string): Promise<void> {
  const db = getDb();
  await db.training_days.update(id, { name, updated_at: nowIso(), _dirty: 1 });
}

export async function softDeleteTrainingDay(id: string): Promise<void> {
  const db = getDb();
  await db.training_days.update(id, { deleted_at: nowIso(), updated_at: nowIso(), _dirty: 1 });
}

/** Rewrites `position` to match the supplied order. Skips no-op writes. */
export async function reorderTrainingDays(orderedIds: string[]): Promise<void> {
  const db = getDb();
  const now = nowIso();
  await db.transaction("rw", db.training_days, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const row = await db.training_days.get(id);
      if (!row || row.position === i) continue;
      await db.training_days.update(id, { position: i, updated_at: now, _dirty: 1 });
    }
  });
}

/* ------------------------- Planned Exercises ---------------------------- */

export interface AddPlannedExerciseInput {
  training_day_id: string;
  exercise_id: string;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_weight_kg: number;
  target_rir: number | null;
}

export async function addPlannedExercise(input: AddPlannedExerciseInput): Promise<string> {
  const db = getDb();
  const now = nowIso();
  const id = uuid();
  const existing = await db.planned_exercises
    .where({ training_day_id: input.training_day_id })
    .toArray();
  const maxPos = existing
    .filter((p) => !p.deleted_at)
    .reduce((acc, p) => Math.max(acc, p.position), -1);
  const row: LocalPlannedExercise = {
    id,
    training_day_id: input.training_day_id,
    exercise_id: input.exercise_id,
    position: maxPos + 1,
    target_sets: input.target_sets,
    target_reps_min: input.target_reps_min,
    target_reps_max: input.target_reps_max,
    target_weight_kg: input.target_weight_kg,
    target_rir: input.target_rir,
    rest_seconds: null,
    notes: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    _dirty: 1,
    _lastSyncedAt: null,
  };
  await db.planned_exercises.add(row);
  return id;
}

export async function updatePlannedExercise(
  id: string,
  patch: Partial<
    Pick<
      LocalPlannedExercise,
      | "target_sets"
      | "target_reps_min"
      | "target_reps_max"
      | "target_weight_kg"
      | "target_rir"
      | "rest_seconds"
      | "notes"
    >
  >,
): Promise<void> {
  const db = getDb();
  await db.planned_exercises.update(id, { ...patch, updated_at: nowIso(), _dirty: 1 });
}

export async function softDeletePlannedExercise(id: string): Promise<void> {
  const db = getDb();
  await db.planned_exercises.update(id, {
    deleted_at: nowIso(),
    updated_at: nowIso(),
    _dirty: 1,
  });
}

export async function reorderPlannedExercises(orderedIds: string[]): Promise<void> {
  const db = getDb();
  const now = nowIso();
  await db.transaction("rw", db.planned_exercises, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const row = await db.planned_exercises.get(id);
      if (!row || row.position === i) continue;
      await db.planned_exercises.update(id, { position: i, updated_at: now, _dirty: 1 });
    }
  });
}
