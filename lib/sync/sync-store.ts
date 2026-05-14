"use client";

import { useSyncExternalStore } from "react";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

export interface SyncSnapshot {
  status: SyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

const SERVER_SNAPSHOT: SyncSnapshot = {
  status: "idle",
  lastSyncedAt: null,
  errorMessage: null,
};

class SyncStore {
  private state: SyncSnapshot = SERVER_SNAPSHOT;
  private listeners = new Set<() => void>();

  getSnapshot = (): SyncSnapshot => this.state;
  getServerSnapshot = (): SyncSnapshot => SERVER_SNAPSHOT;
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  set(next: Partial<SyncSnapshot>) {
    const merged = { ...this.state, ...next };
    if (
      merged.status === this.state.status &&
      merged.lastSyncedAt === this.state.lastSyncedAt &&
      merged.errorMessage === this.state.errorMessage
    ) {
      return;
    }
    this.state = merged;
    for (const l of this.listeners) l();
  }
}

export const syncStore = new SyncStore();

export function useSyncSnapshot(): SyncSnapshot {
  return useSyncExternalStore(syncStore.subscribe, syncStore.getSnapshot, syncStore.getServerSnapshot);
}
