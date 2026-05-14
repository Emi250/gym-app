"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Optional suffix shown next to the value (e.g. "kg", "reps"). */
  suffix?: string;
  label?: string;
  className?: string;
  decimals?: number;
}

/**
 * Large touch-friendly number input with +/- steppers on each side and a
 * tappable centre. Tapping the centre opens the OS numeric keyboard so the
 * user can type a value directly instead of stepping it up many times.
 */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min,
  max,
  suffix,
  label,
  className,
  decimals = 0,
}: NumberStepperProps) {
  const clamp = useCallback(
    (n: number) => {
      let out = Number.isFinite(n) ? n : 0;
      if (typeof min === "number") out = Math.max(min, out);
      if (typeof max === "number") out = Math.min(max, out);
      return Number(out.toFixed(decimals === 0 ? 0 : Math.max(decimals, 2)));
    },
    [min, max, decimals],
  );

  const formatted = decimals === 0 ? value.toString() : value.toFixed(decimals);
  // While editing, we render `draft` (the user's typed text). When not editing,
  // we render the external `formatted` value directly — no effect needed.
  const [draft, setDraft] = useState<string>(formatted);
  const [editing, setEditing] = useState(false);
  const displayValue = editing ? draft : formatted;

  const commit = () => {
    setEditing(false);
    if (draft.trim() === "") return;
    const parsed = Number(draft.replace(",", "."));
    if (!Number.isFinite(parsed)) return;
    onChange(clamp(parsed));
  };

  const inc = () => onChange(clamp(value + step));
  const dec = () => onChange(clamp(value - step));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-fg-muted text-xs font-medium uppercase tracking-wide">{label}</span>
      ) : null}
      <div className="bg-bg-elevated border-border flex h-16 items-stretch overflow-hidden rounded-2xl border">
        <button
          type="button"
          onClick={dec}
          aria-label={`Restar ${step}`}
          className="text-fg-muted hover:text-fg active:bg-bg-elevated-2 flex w-16 items-center justify-center"
        >
          <Minus className="h-6 w-6" />
        </button>
        <div className="relative flex flex-1 items-center justify-center gap-1 text-center">
          <input
            type="text"
            inputMode={decimals === 0 ? "numeric" : "decimal"}
            pattern={decimals === 0 ? "[0-9]*" : "[0-9.,]*"}
            value={displayValue}
            onFocus={(e) => {
              setDraft(formatted);
              setEditing(true);
              e.currentTarget.select();
            }}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                setEditing(false);
                e.currentTarget.blur();
              }
            }}
            aria-label={label ?? "Valor"}
            className="w-full bg-transparent text-center text-2xl font-bold tabular-nums outline-none focus:ring-0"
          />
          {suffix ? (
            <span className="text-fg-muted pointer-events-none absolute right-2 text-sm">
              {suffix}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={inc}
          aria-label={`Sumar ${step}`}
          className="text-fg-muted hover:text-fg active:bg-bg-elevated-2 flex w-16 items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
