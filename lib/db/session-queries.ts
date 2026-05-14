import { useLiveQuery } from "dexie-react-hooks";
import { useCurrentUserId } from "@/lib/auth/current-user";
import { getDb } from "./schema";
import { nowIso, uuid } from "./ids";
import type {
  LocalPlannedExercise,
  LocalSession,
  LocalSessionExercise,
  LocalSessionSet,
  LocalTrainingDay,
} from "./types";

/**
 * Live hook: the currently-open session (started but not finished, not deleted).
 * If multiple exist (shouldn't happen, but defensively), returns the most recent.
 */
export function useActiveSession() {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!userId) return null;
    const db = getDb();
    const all = await db.sessions
      .filter((s) => !s.deleted_at && !s.finished_at && s.user_id === userId)
      .toArray();
    if (all.length === 0) return null;
    return all.sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  }, [userId]);
}

export function useSession(id: string | undefined) {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!id || !userId) return null;
    const db = getDb();
    const session = await db.sessions.get(id);
    if (!session || session.deleted_at || session.user_id !== userId) return null;
    const sExercises = (await db.session_exercises.where({ session_id: id }).toArray())
      .filter((se) => !se.deleted_at)
      .sort((a, b) => a.position - b.position);
    const seIds = sExercises.map((se) => se.id);
    const setsRows =
      seIds.length === 0
        ? []
        : await db.session_sets.where("session_exercise_id").anyOf(seIds).toArray();
    const sets = setsRows
      .filter((s) => !s.deleted_at)
      .sort((a, b) => a.set_number - b.set_number);
    return { session, sExercises, sets };
  }, [id, userId]);
}

export interface StartSessionInput {
  user_id: string;
  routine_id: string;
  training_day_id: string;
}

/**
 * Creates a session by snapshotting the planned exercises of the chosen day.
 * Returns the new session id.
 */
export async function startSession(input: StartSessionInput): Promise<string> {
  const db = getDb();
  const now = nowIso();
  const sessionId = uuid();

  const day = (await db.training_days.get(input.training_day_id)) as LocalTrainingDay | undefined;
  if (!day || day.deleted_at) {
    throw new Error("Training day not found");
  }
  const planned = (
    await db.planned_exercises.where({ training_day_id: input.training_day_id }).toArray()
  )
    .filter((p: LocalPlannedExercise) => !p.deleted_at)
    .sort((a, b) => a.position - b.position);

  const exerciseIds = planned.map((p) => p.exercise_id);
  const exerciseRows =
    exerciseIds.length === 0
      ? []
      : await db.exercises.where("id").anyOf(exerciseIds).toArray();
  const exerciseNameById = new Map(exerciseRows.map((e) => [e.id, e.name]));

  await db.transaction("rw", db.sessions, db.session_exercises, async () => {
    const sessionRow: LocalSession = {
      id: sessionId,
      user_id: input.user_id,
      routine_id: input.routine_id,
      training_day_id: input.training_day_id,
      training_day_name: day.name,
      started_at: now,
      finished_at: null,
      notes: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 1,
      _lastSyncedAt: null,
    };
    await db.sessions.add(sessionRow);

    const sExercises: LocalSessionExercise[] = planned.map((p) => ({
      id: uuid(),
      session_id: sessionId,
      exercise_id: p.exercise_id,
      exercise_name: exerciseNameById.get(p.exercise_id) ?? "Ejercicio",
      position: p.position,
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
    if (sExercises.length > 0) await db.session_exercises.bulkAdd(sExercises);
  });

  return sessionId;
}

export interface UpsertSetInput {
  session_exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rir: number | null;
  /** When updating an existing set, pass its id. */
  id?: string;
}

/** Insert or update a single set. */
export async function upsertSet(input: UpsertSetInput): Promise<string> {
  const db = getDb();
  const now = nowIso();
  const id = input.id ?? uuid();
  const existing = input.id ? await db.session_sets.get(input.id) : undefined;
  if (existing) {
    await db.session_sets.update(id, {
      weight_kg: input.weight_kg,
      reps: input.reps,
      rir: input.rir,
      updated_at: now,
      _dirty: 1,
    });
  } else {
    const row: LocalSessionSet = {
      id,
      session_exercise_id: input.session_exercise_id,
      set_number: input.set_number,
      weight_kg: input.weight_kg,
      reps: input.reps,
      rir: input.rir,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 1,
      _lastSyncedAt: null,
    };
    await db.session_sets.add(row);
  }
  return id;
}

export async function softDeleteSet(id: string): Promise<void> {
  const db = getDb();
  const now = nowIso();
  await db.session_sets.update(id, { deleted_at: now, updated_at: now, _dirty: 1 });
}

export async function discardSession(id: string): Promise<void> {
  const db = getDb();
  const now = nowIso();
  await db.sessions.update(id, { deleted_at: now, updated_at: now, _dirty: 1 });
}

/** Marks the session as finished. Caller is responsible for running progression. */
export async function markSessionFinished(id: string): Promise<void> {
  const db = getDb();
  const now = nowIso();
  await db.sessions.update(id, { finished_at: now, updated_at: now, _dirty: 1 });
}

export interface LastPerformance {
  finished_at: string;
  sets: { set_number: number; weight_kg: number; reps: number; rir: number | null }[];
}

/**
 * Live hook: the most recent finished session in which the user trained
 * `exerciseId`, excluding `excludeSessionId` (the session currently in
 * progress). Used in the registration UI to show "última vez" inline.
 */
export function useLastPerformance(
  exerciseId: string | undefined,
  excludeSessionId: string | undefined,
) {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!exerciseId || !userId) return null;
    const db = getDb();
    const ses = (await db.session_exercises.where({ exercise_id: exerciseId }).toArray()).filter(
      (se) => !se.deleted_at && se.session_id !== excludeSessionId,
    );
    if (ses.length === 0) return null;
    const sessionIds = Array.from(new Set(ses.map((se) => se.session_id)));
    const finishedSessions = (await db.sessions.where("id").anyOf(sessionIds).toArray())
      .filter((s) => !!s.finished_at && !s.deleted_at && s.user_id === userId)
      .sort((a, b) => b.finished_at!.localeCompare(a.finished_at!));
    if (finishedSessions.length === 0) return null;
    const latest = finishedSessions[0];
    const seForLatest = ses.find((se) => se.session_id === latest.id);
    if (!seForLatest) return null;
    const sets = (
      await db.session_sets.where({ session_exercise_id: seForLatest.id }).toArray()
    )
      .filter((s) => !s.deleted_at)
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({ set_number: s.set_number, weight_kg: s.weight_kg, reps: s.reps, rir: s.rir }));
    if (sets.length === 0) return null;
    return { finished_at: latest.finished_at!, sets } satisfies LastPerformance;
  }, [exerciseId, excludeSessionId, userId]);
}
