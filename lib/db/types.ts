/**
 * Shared types for the local Dexie store and Supabase tables.
 * Local-only sync fields (_dirty, _lastSyncedAt) live in the Dexie row types.
 */

export type Iso = string;
export type Uuid = string;

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "other";

export type ExerciseCategory =
  | "compound_heavy"
  | "compound_light"
  | "isolation";

export type ProgressionReason = "progressed" | "maintained" | "deload";

interface SyncFields {
  updated_at: Iso;
  deleted_at: Iso | null;
}

interface LocalSyncFields {
  _dirty: 0 | 1;
  _lastSyncedAt: Iso | null;
}

export interface Exercise extends SyncFields {
  id: Uuid;
  user_id: Uuid | null;
  name: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  default_increment_kg: number;
  created_at: Iso;
}

export interface Routine extends SyncFields {
  id: Uuid;
  user_id: Uuid;
  name: string;
  is_active: boolean;
  is_archived: boolean;
  started_at: Iso | null;
  created_at: Iso;
}

export interface TrainingDay extends SyncFields {
  id: Uuid;
  routine_id: Uuid;
  name: string;
  position: number;
  created_at: Iso;
}

export interface PlannedExercise extends SyncFields {
  id: Uuid;
  training_day_id: Uuid;
  exercise_id: Uuid;
  position: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  /** When `is_bodyweight = true`, this represents EXTRA weight (e.g. dip belt). */
  target_weight_kg: number;
  target_rir: number | null;
  /** Seconds the timer counts down between sets. Null = no auto timer. */
  rest_seconds: number | null;
  /** True for exercises trained against the user's own bodyweight. */
  is_bodyweight: boolean;
  notes: string | null;
  created_at: Iso;
}

export interface Session extends SyncFields {
  id: Uuid;
  user_id: Uuid;
  routine_id: Uuid;
  training_day_id: Uuid;
  training_day_name: string;
  started_at: Iso;
  finished_at: Iso | null;
  notes: string | null;
  created_at: Iso;
}

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

export interface SessionSet extends SyncFields {
  id: Uuid;
  session_exercise_id: Uuid;
  set_number: number;
  weight_kg: number;
  reps: number;
  rir: number | null;
  created_at: Iso;
}

/** Local Dexie row types — extend remote types with sync flags. */
export type LocalExercise = Exercise & LocalSyncFields;
export type LocalRoutine = Routine & LocalSyncFields;
export type LocalTrainingDay = TrainingDay & LocalSyncFields;
export type LocalPlannedExercise = PlannedExercise & LocalSyncFields;
export type LocalSession = Session & LocalSyncFields;
export type LocalSessionExercise = SessionExercise & LocalSyncFields;
export type LocalSessionSet = SessionSet & LocalSyncFields;
