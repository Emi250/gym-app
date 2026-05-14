import { getDb } from "@/lib/db/schema";
import { nowIso } from "@/lib/db/ids";

const LEGACY_LOCAL_USER_KEY = "gym-app:local-user-id";
const MIGRATED_FLAG_KEY = "gym-app:migrated-to-auth:v1";

/**
 * One-time migration: before auth was wired up, the app stored a placeholder
 * UUID in localStorage and used it as `user_id` for routines/sessions/custom
 * exercises. When the user logs in for the first time we rewrite those rows
 * to use the real Supabase auth user id and mark them dirty so the sync engine
 * pushes them.
 *
 * Idempotent: keyed by the real user id, so it only runs once per account.
 */
export async function migrateLocalDataToAuthenticatedUser(realUserId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_FLAG_KEY) === realUserId) return;

  const legacyUserId = window.localStorage.getItem(LEGACY_LOCAL_USER_KEY);
  if (!legacyUserId || legacyUserId === realUserId) {
    window.localStorage.setItem(MIGRATED_FLAG_KEY, realUserId);
    window.localStorage.removeItem(LEGACY_LOCAL_USER_KEY);
    return;
  }

  const db = getDb();
  const now = nowIso();

  await db.transaction("rw", db.routines, db.sessions, db.exercises, async () => {
    const routines = await db.routines.where({ user_id: legacyUserId }).toArray();
    for (const r of routines) {
      await db.routines.update(r.id, { user_id: realUserId, updated_at: now, _dirty: 1 });
    }
    const sessions = await db.sessions.where({ user_id: legacyUserId }).toArray();
    for (const s of sessions) {
      await db.sessions.update(s.id, { user_id: realUserId, updated_at: now, _dirty: 1 });
    }
    const customExercises = await db.exercises.where({ user_id: legacyUserId }).toArray();
    for (const e of customExercises) {
      await db.exercises.update(e.id, { user_id: realUserId, updated_at: now, _dirty: 1 });
    }
  });

  window.localStorage.removeItem(LEGACY_LOCAL_USER_KEY);
  window.localStorage.setItem(MIGRATED_FLAG_KEY, realUserId);
}
