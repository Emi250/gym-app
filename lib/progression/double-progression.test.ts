import { describe, expect, it } from "vitest";
import {
  DELOAD_FACTOR,
  calculateNextLoad,
  type ProgressionInput,
  type SetResult,
} from "./double-progression";

const base = (overrides: Partial<ProgressionInput> = {}): ProgressionInput => ({
  current_target_weight_kg: 60,
  target_reps_min: 8,
  target_reps_max: 12,
  default_increment_kg: 2.5,
  sets_performed: [],
  recent_sessions_for_exercise: [],
  ...overrides,
});

const sets = (...reps: number[]): SetResult[] =>
  reps.map((r) => ({ weight_kg: 60, reps: r }));

describe("calculateNextLoad", () => {
  it("progresses when every set hits the top of the range", () => {
    const out = calculateNextLoad(base({ sets_performed: sets(12, 12, 12) }));
    expect(out.reason).toBe("progressed");
    expect(out.next_target_weight_kg).toBe(62.5);
  });

  it("progresses when every set exceeds the top of the range", () => {
    const out = calculateNextLoad(base({ sets_performed: sets(13, 14, 12) }));
    expect(out.reason).toBe("progressed");
    expect(out.next_target_weight_kg).toBe(62.5);
  });

  it("maintains weight when not every set hit the max", () => {
    const out = calculateNextLoad(base({ sets_performed: sets(12, 11, 12) }));
    expect(out.reason).toBe("maintained");
    expect(out.next_target_weight_kg).toBe(60);
  });

  it("maintains weight when there is one failed session but not enough history", () => {
    const out = calculateNextLoad(
      base({
        sets_performed: sets(7, 8, 8),
        recent_sessions_for_exercise: [{ sets: sets(8, 8, 8) }],
      }),
    );
    expect(out.reason).toBe("maintained");
  });

  it("deloads after 3 consecutive failed-to-reach-min sessions", () => {
    const out = calculateNextLoad(
      base({
        sets_performed: sets(7, 7, 7),
        recent_sessions_for_exercise: [
          { sets: sets(7, 8, 7) },
          { sets: sets(6, 7, 7) },
        ],
      }),
    );
    expect(out.reason).toBe("deload");
    expect(out.next_target_weight_kg).toBe(54); // 60 * 0.9 = 54
    expect(out.next_target_weight_kg).toBeCloseTo(60 * DELOAD_FACTOR);
  });

  it("does not deload twice in a row (skip recent deload sessions)", () => {
    const out = calculateNextLoad(
      base({
        sets_performed: sets(7, 7, 7),
        recent_sessions_for_exercise: [
          { sets: sets(7, 7, 7), was_deload: true }, // previous deload doesn't count
          { sets: sets(7, 8, 7) },
        ],
      }),
    );
    expect(out.reason).toBe("maintained");
  });

  it("handles zero sets (treats as no data → maintain)", () => {
    const out = calculateNextLoad(base({ sets_performed: [] }));
    expect(out.reason).toBe("maintained");
    expect(out.next_target_weight_kg).toBe(60);
  });

  it("isolation exercise with 1kg increment", () => {
    const out = calculateNextLoad(
      base({
        current_target_weight_kg: 12,
        target_reps_min: 10,
        target_reps_max: 15,
        default_increment_kg: 1,
        sets_performed: sets(15, 15, 15),
      }),
    );
    expect(out.reason).toBe("progressed");
    expect(out.next_target_weight_kg).toBe(13);
  });

  it("deload rounds to 0.5 kg step", () => {
    const out = calculateNextLoad(
      base({
        current_target_weight_kg: 27.5,
        sets_performed: sets(7, 7, 7),
        recent_sessions_for_exercise: [
          { sets: sets(7, 7, 7) },
          { sets: sets(7, 7, 7) },
        ],
      }),
    );
    expect(out.reason).toBe("deload");
    // 27.5 * 0.9 = 24.75 → rounds to 25 (0.5 step)
    expect(out.next_target_weight_kg).toBe(25);
  });
});
