/**
 * Double Progression algorithm.
 *
 * Pure function — no side effects. Run after each session is finished to compute
 * the suggested target weight for the next session of the same planned exercise.
 *
 * Rules:
 *  1. If every set hit at least `target_reps_max` → progress (+ increment).
 *  2. Otherwise, if the last `DELOAD_TRIGGER_SESSIONS` sessions all failed to reach
 *     `target_reps_min` in at least one set → deload 10%.
 *  3. Otherwise, maintain the current weight.
 *
 * Deload only fires once per stall window (recent history must contain failures, not
 * a previous deload), so callers should rely on the returned `reason` to drive UI.
 */

import type { ProgressionReason } from "../db/types";

export const DELOAD_TRIGGER_SESSIONS = 3;
export const DELOAD_FACTOR = 0.9;

export interface SetResult {
  weight_kg: number;
  reps: number;
}

export interface SessionSummary {
  /** All sets recorded for the same planned_exercise in a past session, in order. */
  sets: SetResult[];
  /** Was this session itself a deload (so we don't trigger another consecutive one). */
  was_deload?: boolean;
}

export interface ProgressionInput {
  current_target_weight_kg: number;
  target_reps_min: number;
  target_reps_max: number;
  default_increment_kg: number;
  sets_performed: SetResult[];
  /** Most recent N sessions for the same planned_exercise, newest first. Excludes the session just completed. */
  recent_sessions_for_exercise: SessionSummary[];
}

export interface ProgressionOutput {
  next_target_weight_kg: number;
  reason: ProgressionReason;
}

const STEP = 0.5;

function roundToStep(value: number, step: number = STEP): number {
  return Math.max(0, Math.round(value / step) * step);
}

function reachedMaxReps(sets: SetResult[], target_reps_max: number): boolean {
  if (sets.length === 0) return false;
  return sets.every((s) => s.reps >= target_reps_max);
}

function failedToReachMin(sets: SetResult[], target_reps_min: number): boolean {
  if (sets.length === 0) return true;
  return sets.some((s) => s.reps < target_reps_min);
}

export function calculateNextLoad(input: ProgressionInput): ProgressionOutput {
  const {
    current_target_weight_kg,
    target_reps_min,
    target_reps_max,
    default_increment_kg,
    sets_performed,
    recent_sessions_for_exercise,
  } = input;

  if (reachedMaxReps(sets_performed, target_reps_max)) {
    return {
      next_target_weight_kg: roundToStep(current_target_weight_kg + default_increment_kg),
      reason: "progressed",
    };
  }

  const currentFailed = failedToReachMin(sets_performed, target_reps_min);
  const recentFailures = recent_sessions_for_exercise
    .slice(0, DELOAD_TRIGGER_SESSIONS - 1)
    .filter((s) => !s.was_deload && failedToReachMin(s.sets, target_reps_min));

  if (currentFailed && recentFailures.length >= DELOAD_TRIGGER_SESSIONS - 1) {
    return {
      next_target_weight_kg: roundToStep(current_target_weight_kg * DELOAD_FACTOR),
      reason: "deload",
    };
  }

  return {
    next_target_weight_kg: current_target_weight_kg,
    reason: "maintained",
  };
}
