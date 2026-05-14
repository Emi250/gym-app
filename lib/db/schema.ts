import Dexie, { type EntityTable } from "dexie";
import type {
  LocalExercise,
  LocalPlannedExercise,
  LocalRoutine,
  LocalSession,
  LocalSessionExercise,
  LocalSessionSet,
  LocalTrainingDay,
} from "./types";

export class GymDB extends Dexie {
  exercises!: EntityTable<LocalExercise, "id">;
  routines!: EntityTable<LocalRoutine, "id">;
  training_days!: EntityTable<LocalTrainingDay, "id">;
  planned_exercises!: EntityTable<LocalPlannedExercise, "id">;
  sessions!: EntityTable<LocalSession, "id">;
  session_exercises!: EntityTable<LocalSessionExercise, "id">;
  session_sets!: EntityTable<LocalSessionSet, "id">;

  constructor() {
    super("gym-app");
    this.version(1).stores({
      exercises: "id, user_id, name, muscle_group, category, _dirty, updated_at, deleted_at",
      routines: "id, user_id, name, is_active, is_archived, _dirty, updated_at, deleted_at",
      training_days: "id, routine_id, position, _dirty, updated_at, deleted_at",
      planned_exercises:
        "id, training_day_id, exercise_id, position, _dirty, updated_at, deleted_at",
      sessions:
        "id, user_id, routine_id, training_day_id, started_at, finished_at, _dirty, updated_at, deleted_at",
      session_exercises: "id, session_id, exercise_id, position, _dirty, updated_at, deleted_at",
      session_sets: "id, session_exercise_id, set_number, _dirty, updated_at, deleted_at",
    });
  }
}

let _db: GymDB | null = null;

export function getDb(): GymDB {
  if (typeof window === "undefined") {
    throw new Error("getDb() can only be called in the browser");
  }
  if (!_db) _db = new GymDB();
  return _db;
}
