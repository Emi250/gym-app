import { getDb } from "@/lib/db/schema";
import { nowIso } from "@/lib/db/ids";
import type { LocalPlannedExercise, LocalSessionExercise } from "@/lib/db/types";
import {
  DELOAD_TRIGGER_SESSIONS,
  calculateNextLoad,
  type ProgressionOutput,
  type SessionSummary,
  type SetResult,
} from "./double-progression";

export interface ProgressionDiff {
  exercise_id: string;
  exercise_name: string;
  previous_weight_kg: number;
  next_weight_kg: number;
  reason: ProgressionOutput["reason"];
}

/**
 * Walks every exercise in a finished session, computes the next target weight
 * via Double Progression, persists it to the corresponding `planned_exercises`
 * row, and returns the list of diffs for UI display.
 *
 * If the planned exercise has been deleted/edited away in the meantime, the
 * diff is still reported but no write is performed.
 */
export async function applyProgressionToSession(
  sessionId: string,
): Promise<ProgressionDiff[]> {
  const db = getDb();
  const session = await db.sessions.get(sessionId);
  if (!session) return [];

  const sExercises = (await db.session_exercises.where({ session_id: sessionId }).toArray())
    .filter((se) => !se.deleted_at)
    .sort((a, b) => a.position - b.position);
  if (sExercises.length === 0) return [];

  const seIds = sExercises.map((se) => se.id);
  const allSets = await db.session_sets.where("session_exercise_id").anyOf(seIds).toArray();
  const setsBySE = new Map<string, SetResult[]>();
  for (const s of allSets) {
    if (s.deleted_at) continue;
    const arr = setsBySE.get(s.session_exercise_id) ?? [];
    arr.push({ weight_kg: s.weight_kg, reps: s.reps });
    setsBySE.set(s.session_exercise_id, arr);
  }
  // Find the planned_exercises rows that match each (training_day_id, exercise_id).
  // We look up the planned exercises currently in the same training day; if the
  // user edited the day in the meantime and the planned exercise is gone, skip.
  const planned = (
    await db.planned_exercises
      .where({ training_day_id: session.training_day_id })
      .toArray()
  ).filter((p) => !p.deleted_at);
  const plannedByExerciseId = new Map<string, LocalPlannedExercise>();
  for (const p of planned) plannedByExerciseId.set(p.exercise_id, p);

  // Build history per exercise from prior finished sessions for this routine.
  const priorSessions = (
    await db.sessions.where({ routine_id: session.routine_id }).toArray()
  )
    .filter((s) => s.id !== sessionId && !!s.finished_at && !s.deleted_at)
    .sort((a, b) => b.finished_at!.localeCompare(a.finished_at!))
    .slice(0, DELOAD_TRIGGER_SESSIONS * 2);

  const priorSEByExercise = new Map<string, SessionSummary[]>();
  for (const ps of priorSessions) {
    const ses = (await db.session_exercises.where({ session_id: ps.id }).toArray()).filter(
      (se) => !se.deleted_at,
    );
    for (const se of ses) {
      const sets = (
        await db.session_sets.where({ session_exercise_id: se.id }).toArray()
      )
        .filter((s) => !s.deleted_at)
        .map((s) => ({ weight_kg: s.weight_kg, reps: s.reps }));
      const list = priorSEByExercise.get(se.exercise_id) ?? [];
      list.push({ sets });
      priorSEByExercise.set(se.exercise_id, list);
    }
  }

  const diffs: ProgressionDiff[] = [];
  const now = nowIso();
  for (const se of sExercises) {
    const sets = setsBySE.get(se.id) ?? [];
    if (sets.length === 0) continue; // nothing logged for this exercise → no progression signal
    const plannedRow = plannedByExerciseId.get(se.exercise_id);
    const currentTarget = plannedRow?.target_weight_kg ?? se.target_weight_kg;
    const increment = await defaultIncrementFromCatalog(se.exercise_id);

    const out = calculateNextLoad({
      current_target_weight_kg: currentTarget,
      target_reps_min: se.target_reps_min,
      target_reps_max: se.target_reps_max,
      default_increment_kg: increment,
      sets_performed: sets,
      recent_sessions_for_exercise: priorSEByExercise.get(se.exercise_id) ?? [],
    });

    diffs.push({
      exercise_id: se.exercise_id,
      exercise_name: se.exercise_name,
      previous_weight_kg: currentTarget,
      next_weight_kg: out.next_target_weight_kg,
      reason: out.reason,
    });

    if (plannedRow && out.next_target_weight_kg !== currentTarget) {
      await db.planned_exercises.update(plannedRow.id, {
        target_weight_kg: out.next_target_weight_kg,
        updated_at: now,
        _dirty: 1,
      });
    }
  }

  return diffs;
}

async function defaultIncrementFromCatalog(exerciseId: string): Promise<number> {
  const db = getDb();
  const ex = await db.exercises.get(exerciseId);
  return ex?.default_increment_kg ?? 2.5;
}

/** Helper used by the live registration page to know if a session is "done enough". */
export function setsCompletedFor(
  sExercise: LocalSessionExercise,
  sets: { session_exercise_id: string }[],
): number {
  return sets.filter((s) => s.session_exercise_id === sExercise.id).length;
}
