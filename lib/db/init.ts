import { SEED_EXERCISES, defaultIncrementFor } from "../seed/exercises";
import { getDb } from "./schema";
import { nowIso, uuid } from "./ids";
import type { LocalExercise } from "./types";

const SEED_FLAG_KEY = "gym-app:catalog-seeded:v1";

/**
 * Seeds the local Dexie store with the global exercise catalog the first time
 * the app runs. Idempotent — uses a localStorage flag so we don't re-seed.
 * The catalog rows have `user_id = null` to match Supabase semantics.
 */
export async function ensureLocalCatalogSeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG_KEY) === "1") return;

  const db = getDb();
  const existing = await db.exercises.count();
  if (existing > 0) {
    window.localStorage.setItem(SEED_FLAG_KEY, "1");
    return;
  }

  const now = nowIso();
  const rows: LocalExercise[] = SEED_EXERCISES.map((seed) => ({
    id: uuid(),
    user_id: null,
    name: seed.name,
    muscle_group: seed.muscle_group,
    category: seed.category,
    default_increment_kg: defaultIncrementFor(seed.category),
    created_at: now,
    updated_at: now,
    deleted_at: null,
    _dirty: 0,
    _lastSyncedAt: null,
  }));

  await db.exercises.bulkAdd(rows);
  window.localStorage.setItem(SEED_FLAG_KEY, "1");
}
