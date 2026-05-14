import type { Table } from "dexie";
import { getDb } from "@/lib/db/schema";
import { nowIso } from "@/lib/db/ids";
import { getSupabaseBrowserClient } from "./supabase";

/**
 * Tables that participate in sync, in dependency order so referential integrity
 * holds during the push phase (parents before children).
 */
const TABLE_NAMES = [
  "exercises",
  "routines",
  "training_days",
  "planned_exercises",
  "sessions",
  "session_exercises",
  "session_sets",
] as const;
type TableName = (typeof TABLE_NAMES)[number];

const LAST_PULLED_KEY = (table: TableName) => `gym-app:last-pulled-at:${table}`;
const EPOCH = "1970-01-01T00:00:00.000Z";

interface SyncFieldRow {
  id: string;
  updated_at: string;
  deleted_at: string | null;
}
interface LocalRow extends SyncFieldRow {
  _dirty?: 0 | 1;
  _lastSyncedAt?: string | null;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/** One pass: push everything dirty, then pull everything new. */
export async function syncOnce(): Promise<SyncResult> {
  const pushed = await pushDirty();
  const pulled = await pullSince();
  return { pushed, pulled };
}

async function pushDirty(): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  const db = getDb();
  let total = 0;

  for (const tableName of TABLE_NAMES) {
    const table = db.table(tableName) as Table<LocalRow, string>;
    const dirty = await table.where("_dirty").equals(1).toArray();
    if (dirty.length === 0) continue;

    const rows = dirty.map((row) => {
      // Strip the Dexie-only sync flags before upserting to Supabase.
      const { _dirty, _lastSyncedAt, ...rest } = row;
      void _dirty;
      void _lastSyncedAt;
      return rest;
    });

    const { error } = await supabase.from(tableName).upsert(rows);
    if (error) throw error;

    const syncedAt = nowIso();
    await db.transaction("rw", table, async () => {
      for (const row of dirty) {
        await table.update(row.id, { _dirty: 0, _lastSyncedAt: syncedAt });
      }
    });
    total += dirty.length;
  }
  return total;
}

async function pullSince(): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  const db = getDb();
  let total = 0;

  for (const tableName of TABLE_NAMES) {
    const lastPulled =
      typeof window === "undefined"
        ? EPOCH
        : (window.localStorage.getItem(LAST_PULLED_KEY(tableName)) ?? EPOCH);

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .gt("updated_at", lastPulled)
      .order("updated_at", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) continue;

    const table = db.table(tableName) as Table<LocalRow, string>;
    const syncedAt = nowIso();
    await db.transaction("rw", table, async () => {
      for (const remote of data as LocalRow[]) {
        const local = await table.get(remote.id);
        if (!local || remote.updated_at > local.updated_at) {
          await table.put({ ...remote, _dirty: 0, _lastSyncedAt: syncedAt });
        }
      }
    });

    const rows = data as LocalRow[];
    let maxUpdated: string = lastPulled;
    for (const r of rows) {
      if (r.updated_at > maxUpdated) maxUpdated = r.updated_at;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_PULLED_KEY(tableName), maxUpdated);
    }
    total += data.length;
  }
  return total;
}
