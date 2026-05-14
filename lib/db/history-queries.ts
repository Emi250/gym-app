import { useLiveQuery } from "dexie-react-hooks";
import { useCurrentUserId } from "@/lib/auth/current-user";
import { getDb } from "./schema";

/** All finished sessions for the current user, sorted by started_at desc. */
export function useFinishedSessions() {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!userId) return [];
    const db = getDb();
    const all = await db.sessions
      .filter((s) => !s.deleted_at && !!s.finished_at && s.user_id === userId)
      .toArray();
    return all.sort((a, b) => b.started_at.localeCompare(a.started_at));
  }, [userId]);
}

/** A finished session with snapshot exercises and sets, for the detail view. */
export function useSessionDetail(id: string | undefined) {
  const userId = useCurrentUserId();
  return useLiveQuery(async () => {
    if (!id || !userId) return null;
    const db = getDb();
    const session = await db.sessions.get(id);
    if (!session || session.deleted_at || session.user_id !== userId) return null;
    const sExercises = (await db.session_exercises.where({ session_id: id }).toArray())
      .filter((se) => !se.deleted_at)
      .sort((a, b) => a.position - b.position);
    const seIds = sExercises.map((se) => se.id);
    const setsRows =
      seIds.length === 0
        ? []
        : await db.session_sets.where("session_exercise_id").anyOf(seIds).toArray();
    const sets = setsRows
      .filter((s) => !s.deleted_at)
      .sort((a, b) => a.set_number - b.set_number);
    return { session, sExercises, sets };
  }, [id, userId]);
}
