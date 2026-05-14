import { useLiveQuery } from "dexie-react-hooks";
import { useCurrentUserId } from "@/lib/auth/current-user";
import { getDb } from "./schema";

export interface ExerciseHistoryPoint {
  /** Session id, useful for keys and drill-down. */
  session_id: string;
  /** ISO timestamp when the session was finished. */
  finished_at: string;
  /** Heaviest weight used in any set for this exercise in this session. */
  max_weight_kg: number;
  /** Sum of weight × reps across all sets. */
  total_volume: number;
  /** Best estimated 1RM via Epley: `weight * (1 + reps/30)` of the best set. */
  estimated_1rm: number;
  /** All sets registered for this exercise in this session, in order. */
  sets: { set_number: number; weight_kg: number; reps: number; rir: number | null }[];
}

/** Returns the exercises that have appeared in any finished session of the current user. */
export function useTrainedExercises() {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!userId) return [];
    const db = getDb();
    const sExercises = (await db.session_exercises.toArray()).filter((se) => !se.deleted_at);
    const sessionIds = Array.from(new Set(sExercises.map((se) => se.session_id)));
    const finishedSessionIds = new Set(
      (await db.sessions.where("id").anyOf(sessionIds).toArray())
        .filter((s) => !!s.finished_at && !s.deleted_at && s.user_id === userId)
        .map((s) => s.id),
    );
    const seen = new Map<string, string>(); // exercise_id → name
    for (const se of sExercises) {
      if (!finishedSessionIds.has(se.session_id)) continue;
      if (!seen.has(se.exercise_id)) seen.set(se.exercise_id, se.exercise_name);
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [userId]);
}

/** Returns the chronological history for a single exercise (current user). */
export function useExerciseHistory(exerciseId: string | null) {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!exerciseId || !userId) return [] as ExerciseHistoryPoint[];
    const db = getDb();
    const sExercises = (
      await db.session_exercises.where({ exercise_id: exerciseId }).toArray()
    ).filter((se) => !se.deleted_at);
    if (sExercises.length === 0) return [];

    const sessionIds = Array.from(new Set(sExercises.map((se) => se.session_id)));
    const sessions = (await db.sessions.where("id").anyOf(sessionIds).toArray()).filter(
      (s) => !!s.finished_at && !s.deleted_at && s.user_id === userId,
    );

    const seIds = sExercises.map((se) => se.id);
    const allSets = (
      await db.session_sets.where("session_exercise_id").anyOf(seIds).toArray()
    ).filter((s) => !s.deleted_at);

    const setsBySE = new Map<string, typeof allSets>();
    for (const s of allSets) {
      const arr = setsBySE.get(s.session_exercise_id) ?? [];
      arr.push(s);
      setsBySE.set(s.session_exercise_id, arr);
    }
    for (const arr of setsBySE.values()) arr.sort((a, b) => a.set_number - b.set_number);

    const seBySessionId = new Map(sExercises.map((se) => [se.session_id, se]));

    const points: ExerciseHistoryPoint[] = sessions
      .map((session) => {
        const se = seBySessionId.get(session.id);
        if (!se) return null;
        const sets = setsBySE.get(se.id) ?? [];
        if (sets.length === 0) return null;
        const maxWeight = sets.reduce((m, s) => Math.max(m, s.weight_kg), 0);
        const totalVolume = sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
        const best1rm = sets.reduce(
          (m, s) => Math.max(m, s.weight_kg * (1 + s.reps / 30)),
          0,
        );
        return {
          session_id: session.id,
          finished_at: session.finished_at!,
          max_weight_kg: maxWeight,
          total_volume: totalVolume,
          estimated_1rm: Math.round(best1rm * 10) / 10,
          sets: sets.map((s) => ({
            set_number: s.set_number,
            weight_kg: s.weight_kg,
            reps: s.reps,
            rir: s.rir,
          })),
        } satisfies ExerciseHistoryPoint;
      })
      .filter((p): p is ExerciseHistoryPoint => p !== null)
      .sort((a, b) => a.finished_at.localeCompare(b.finished_at));

    return points;
  }, [exerciseId, userId]);
}
