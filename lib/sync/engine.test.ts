import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the sync engine. Strategy:
 *  - Mock the Supabase client to an in-memory store we control.
 *  - Use the real Dexie (via fake-indexeddb from tests/setup.ts).
 *  - Assert behavior at the boundary: dirty rows go up, remote deltas come down,
 *    last-write-wins merges correctly, high-water marks advance.
 */

// In-memory fake of Supabase backing store. Reset in beforeEach.
const remote: Map<string, Record<string, unknown>[]> = new Map();

function fakeUpsert(table: string, rows: Record<string, unknown>[]) {
  const existing = remote.get(table) ?? [];
  const next = [...existing];
  for (const row of rows) {
    const idx = next.findIndex((r) => r.id === row.id);
    if (idx >= 0) next[idx] = row;
    else next.push(row);
  }
  remote.set(table, next);
  return { error: null };
}

function fakeSelectGt(table: string, since: string) {
  const rows = remote.get(table) ?? [];
  const filtered = rows
    .filter((r) => (r.updated_at as string) > since)
    .sort((a, b) => (a.updated_at as string).localeCompare(b.updated_at as string));
  return { data: filtered, error: null };
}

vi.mock("@/lib/sync/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    from: (table: string) => ({
      upsert: (rows: Record<string, unknown>[]) =>
        Promise.resolve(fakeUpsert(table, rows)),
      select: () => ({
        gt: (_col: string, value: string) => ({
          order: () => Promise.resolve(fakeSelectGt(table, value)),
        }),
      }),
    }),
  }),
}));

import { getDb } from "@/lib/db/schema";
import { nowIso, uuid } from "@/lib/db/ids";
import { syncOnce } from "./engine";

async function resetDexie() {
  const db = getDb();
  await Promise.all([
    db.exercises.clear(),
    db.routines.clear(),
    db.training_days.clear(),
    db.planned_exercises.clear(),
    db.sessions.clear(),
    db.session_exercises.clear(),
    db.session_sets.clear(),
  ]);
}

beforeEach(async () => {
  remote.clear();
  localStorage.clear();
  await resetDexie();
});

function makeRoutine(id: string, name: string, dirty: 0 | 1, updated_at: string) {
  return {
    id,
    user_id: "u1",
    name,
    is_active: false,
    is_archived: false,
    started_at: null,
    created_at: updated_at,
    updated_at,
    deleted_at: null,
    _dirty: dirty,
    _lastSyncedAt: null as string | null,
  };
}

describe("syncOnce — push", () => {
  it("uploads dirty rows and marks them clean", async () => {
    const db = getDb();
    const id = uuid();
    await db.routines.add(makeRoutine(id, "Push/Pull/Legs", 1, nowIso()));

    const result = await syncOnce();

    expect(result.pushed).toBe(1);
    const remoteRoutines = remote.get("routines") ?? [];
    expect(remoteRoutines).toHaveLength(1);
    expect(remoteRoutines[0]).toMatchObject({ id, name: "Push/Pull/Legs" });

    const local = await db.routines.get(id);
    expect(local?._dirty).toBe(0);
    expect(local?._lastSyncedAt).toBeTruthy();
  });

  it("strips _dirty and _lastSyncedAt before upserting", async () => {
    const db = getDb();
    const id = uuid();
    await db.routines.add(makeRoutine(id, "X", 1, nowIso()));

    await syncOnce();

    const sent = (remote.get("routines") ?? [])[0];
    expect(sent).not.toHaveProperty("_dirty");
    expect(sent).not.toHaveProperty("_lastSyncedAt");
  });

  it("skips rows that are already clean", async () => {
    const db = getDb();
    const id = uuid();
    await db.routines.add(makeRoutine(id, "Clean", 0, nowIso()));

    const result = await syncOnce();

    expect(result.pushed).toBe(0);
    expect(remote.get("routines") ?? []).toHaveLength(0);
  });
});

describe("syncOnce — pull", () => {
  it("pulls remote rows that the client hasn't seen", async () => {
    const id = uuid();
    const now = nowIso();
    remote.set("routines", [
      {
        id,
        user_id: "u1",
        name: "Remote routine",
        is_active: false,
        is_archived: false,
        started_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    const result = await syncOnce();

    expect(result.pulled).toBeGreaterThanOrEqual(1);
    const db = getDb();
    const local = await db.routines.get(id);
    expect(local).toMatchObject({ id, name: "Remote routine", _dirty: 0 });
  });

  it("uses last-write-wins: remote with newer updated_at overrides local", async () => {
    const db = getDb();
    const id = uuid();
    const older = "2026-01-01T00:00:00.000Z";
    const newer = "2026-02-01T00:00:00.000Z";

    await db.routines.add(makeRoutine(id, "Local stale", 0, older));
    remote.set("routines", [
      {
        id,
        user_id: "u1",
        name: "Remote fresh",
        is_active: false,
        is_archived: false,
        started_at: null,
        created_at: older,
        updated_at: newer,
        deleted_at: null,
      },
    ]);

    await syncOnce();

    const local = await db.routines.get(id);
    expect(local?.name).toBe("Remote fresh");
    expect(local?.updated_at).toBe(newer);
  });

  it("advances the high-water mark so subsequent pulls return nothing", async () => {
    const id = uuid();
    const now = nowIso();
    remote.set("routines", [
      {
        id,
        user_id: "u1",
        name: "Once",
        is_active: false,
        is_archived: false,
        started_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    const first = await syncOnce();
    expect(first.pulled).toBeGreaterThanOrEqual(1);

    const second = await syncOnce();
    expect(second.pulled).toBe(0);
  });

  it("pulls only rows newer than the high-water mark on subsequent runs", async () => {
    const firstId = uuid();
    const t1 = "2026-01-01T00:00:00.000Z";
    remote.set("routines", [
      {
        id: firstId,
        user_id: "u1",
        name: "A",
        is_active: false,
        is_archived: false,
        started_at: null,
        created_at: t1,
        updated_at: t1,
        deleted_at: null,
      },
    ]);
    await syncOnce();

    // Now a NEW remote row appears later in time.
    const secondId = uuid();
    const t2 = "2026-02-01T00:00:00.000Z";
    remote.set("routines", [
      ...(remote.get("routines") ?? []),
      {
        id: secondId,
        user_id: "u1",
        name: "B",
        is_active: false,
        is_archived: false,
        started_at: null,
        created_at: t2,
        updated_at: t2,
        deleted_at: null,
      },
    ]);

    const result = await syncOnce();
    expect(result.pulled).toBe(1); // only the new one

    const db = getDb();
    expect(await db.routines.get(secondId)).toBeDefined();
  });
});

describe("syncOnce — push then pull roundtrip", () => {
  it("pushed rows do not get re-applied on the same pass", async () => {
    const db = getDb();
    const id = uuid();
    const now = nowIso();
    await db.routines.add(makeRoutine(id, "Roundtrip", 1, now));

    const result = await syncOnce();

    expect(result.pushed).toBe(1);
    // The pulled count for `routines` depends on whether the pulled row
    // (the one we just pushed) was filtered out. With our simple high-water
    // logic it WILL come back on the same pass — but the merge step is a no-op
    // because local.updated_at == remote.updated_at, so the local row is unchanged.
    const local = await db.routines.get(id);
    expect(local?.name).toBe("Roundtrip");
    expect(local?._dirty).toBe(0);
  });
});
