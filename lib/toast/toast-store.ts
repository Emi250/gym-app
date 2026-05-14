"use client";

import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "info" | "error";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Auto-dismiss after N ms. 0 disables auto-dismiss. */
  durationMs: number;
}

let nextId = 1;
let toasts: Toast[] = [];
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
const getSnapshot = (): Toast[] => toasts;
const getServerSnapshot = (): Toast[] => [];

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function showToast(message: string, kind: ToastKind = "success", durationMs = 1800) {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message, durationMs }];
  emit();
  if (durationMs > 0) {
    setTimeout(() => dismissToast(id), durationMs);
  }
}

export function dismissToast(id: number) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}
