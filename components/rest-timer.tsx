"use client";

import { Check, Pause, Play, Timer, X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import {
  cancelRestTimer,
  toggleRestTimerPause,
  useRestTimerState,
} from "@/lib/timer/rest-timer-store";
import { cn } from "@/lib/utils/cn";

// Re-export the imperative API so existing callers don't need to update imports.
export { startRestTimer, cancelRestTimer } from "@/lib/timer/rest-timer-store";

/**
 * Ticking "now" external store. Refreshes every 250ms while at least one
 * component is subscribed. Read via `useNow()` so calling Date.now() doesn't
 * happen during render (React 19 purity lint).
 */
const nowListeners = new Set<() => void>();
let nowInterval: ReturnType<typeof setInterval> | null = null;
function subscribeNow(cb: () => void) {
  nowListeners.add(cb);
  if (nowInterval === null) {
    nowInterval = setInterval(() => {
      for (const l of nowListeners) l();
    }, 250);
  }
  return () => {
    nowListeners.delete(cb);
    if (nowListeners.size === 0 && nowInterval !== null) {
      clearInterval(nowInterval);
      nowInterval = null;
    }
  };
}
const getNow = (): number => Date.now();
const getServerNow = (): number => 0;

function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, getServerNow);
}

/**
 * Floating bottom overlay that counts down once `startRestTimer(s)` fires.
 * Mounted once in the root layout so the timer survives navigation between
 * pages. Shows remaining seconds in `m:ss`, pause/resume, skip controls.
 * Vibrates briefly on completion where supported (Android Chrome).
 */
export function RestTimer() {
  const state = useRestTimerState();
  const now = useNow();

  if (!state) return null;

  const remainingMs = state.paused
    ? state.remainingWhenPaused
    : Math.max(0, state.endsAt - now);
  const done = remainingMs <= 0 && !state.paused;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const m = Math.floor(remainingSec / 60);
  const s = remainingSec % 60;
  const progress = state.total > 0 ? 1 - remainingMs / (state.total * 1000) : 1;

  return (
    <>
      <DoneEffect done={done} />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className={cn(
            "bg-bg-elevated border-border shadow-card pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-card border p-3 backdrop-blur-lg",
            done && "ring-accent ring-2",
          )}
        >
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeDasharray={`${Math.min(progress, 1) * 100.5}, 100.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
              {done ? <Check className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
            </div>
          </div>

          <div className="flex-1">
            <p className="text-fg-muted text-[10px] uppercase tracking-wide">
              {done ? "Listo" : "Descanso"}
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums">
              {m}:{s.toString().padStart(2, "0")}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleRestTimerPause}
            aria-label={state.paused ? "Reanudar" : "Pausar"}
            className="text-fg-muted hover:text-fg flex h-10 w-10 items-center justify-center"
          >
            {state.paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={cancelRestTimer}
            aria-label="Saltar descanso"
            className="text-fg-muted hover:text-fg flex h-10 w-10 items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

/** Side effect on completion: vibrate + auto-dismiss after 2s. */
function DoneEffect({ done }: { done: boolean }) {
  useEffect(() => {
    if (!done) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        /* ignore */
      }
    }
    const t = setTimeout(cancelRestTimer, 2000);
    return () => clearTimeout(t);
  }, [done]);
  return null;
}
