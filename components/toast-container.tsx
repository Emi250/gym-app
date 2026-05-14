"use client";

import { AlertCircle, Check, Info, X } from "lucide-react";
import { dismissToast, useToasts, type ToastKind } from "@/lib/toast/toast-store";
import { cn } from "@/lib/utils/cn";

const ICON: Record<ToastKind, React.ComponentType<{ className?: string }>> = {
  success: Check,
  info: Info,
  error: AlertCircle,
};

const TONE: Record<ToastKind, string> = {
  success: "bg-accent/15 text-accent border-accent/30",
  info: "bg-bg-elevated text-fg border-border",
  error: "bg-danger/15 text-danger border-danger/30",
};

/**
 * Stacked top-of-screen toasts. Mounted once globally; reads from `toastStore`.
 */
export function ToastContainer() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col items-center gap-2 px-4 pt-2"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
    >
      {toasts.map((t) => {
        const Icon = ICON[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur",
              TONE[t.kind],
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Cerrar"
              className="text-fg-muted hover:text-fg shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
