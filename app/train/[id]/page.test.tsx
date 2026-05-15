import { describe, it, expect } from "vitest";
import { computeSessionProgress } from "./page";

describe("computeSessionProgress", () => {
  it("sums expected sets from each exercise's target_sets", () => {
    const sExercises = [
      { id: "a", target_sets: 3 },
      { id: "b", target_sets: 4 },
    ];
    const sets = [
      { session_exercise_id: "a", set_number: 1 },
      { session_exercise_id: "a", set_number: 2 },
    ];
    expect(computeSessionProgress(sExercises, sets)).toEqual({ done: 2, expected: 7 });
  });

  it("expands expected when extra sets are logged beyond target", () => {
    const sExercises = [{ id: "a", target_sets: 3 }];
    const sets = [
      { session_exercise_id: "a", set_number: 1 },
      { session_exercise_id: "a", set_number: 2 },
      { session_exercise_id: "a", set_number: 3 },
      { session_exercise_id: "a", set_number: 4 },
    ];
    expect(computeSessionProgress(sExercises, sets)).toEqual({ done: 4, expected: 4 });
  });

  it("returns zero expected for an empty session", () => {
    expect(computeSessionProgress([], [])).toEqual({ done: 0, expected: 0 });
  });
});
