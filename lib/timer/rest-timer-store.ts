"use client";

import { useSyncExternalStore } from "react";

/**
 * Module-level store for the rest timer. Survives navigation because it lives
 * outside the React tree — the visual `<RestTimer />` is mounted once in the
 * root layout and reads its snapshot from here.
 */

export interface RestTimerState {
  total: number;
  /** Wall-clock timestamp when the timer hits zero. */
  endsAt: number;
  paused: boolean;
  /** Captured ms remaining at pause time. */
  remainingWhenPaused: number;
}

let state: RestTimerState | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = (): RestTimerState | null => state;
const getServerSnapshot = (): RestTimerState | null => null;

export function useRestTimerState(): RestTimerState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function startRestTimer(seconds: number): void {
  if (seconds <= 0) return;
  state = {
    total: seconds,
    endsAt: Date.now() + seconds * 1000,
    paused: false,
    remainingWhenPaused: seconds * 1000,
  };
  emit();
}

export function cancelRestTimer(): void {
  if (state === null) return;
  state = null;
  emit();
}

export function toggleRestTimerPause(): void {
  if (!state) return;
  if (state.paused) {
    state = {
      ...state,
      paused: false,
      endsAt: Date.now() + state.remainingWhenPaused,
    };
  } else {
    state = {
      ...state,
      paused: true,
      remainingWhenPaused: Math.max(0, state.endsAt - Date.now()),
    };
  }
  emit();
}
