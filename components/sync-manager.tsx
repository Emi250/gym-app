"use client";

import { useEffect } from "react";
import { useAuthState } from "@/lib/auth/current-user";
import { migrateLocalDataToAuthenticatedUser } from "@/lib/auth/migrate-local-data";
import { syncOnce } from "@/lib/sync/engine";
import { syncStore } from "@/lib/sync/sync-store";

const POLL_MS = 30_000;

/**
 * Drives the sync engine. Runs once on login, periodically while online, and
 * whenever the browser goes back online. Writes status into `syncStore` —
 * the UI reads it via `useSyncSnapshot()`.
 */
export function SyncManager() {
  const { user } = useAuthState();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let migrated = false;

    const tick = async () => {
      if (cancelled) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        syncStore.set({ status: "offline" });
        return;
      }
      syncStore.set({ status: "syncing", errorMessage: null });
      try {
        if (!migrated) {
          await migrateLocalDataToAuthenticatedUser(userId);
          migrated = true;
        }
        await syncOnce();
        if (!cancelled) {
          syncStore.set({ status: "idle", lastSyncedAt: new Date().toISOString() });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error("Sync failed", err);
        syncStore.set({ status: "error", errorMessage: message });
      }
    };

    void tick();
    timer = setInterval(() => void tick(), POLL_MS);

    const onOnline = () => void tick();
    const onOffline = () => syncStore.set({ status: "offline" });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [userId]);

  return null;
}
