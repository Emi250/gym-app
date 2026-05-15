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
