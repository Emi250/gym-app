"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback } from "react";
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
 * Large touch-friendly number input with +/- steppers on each side.
 * Designed for gym use — minimum 56px tall, big targets, no native arrows.
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
      let out = n;
      if (typeof min === "number") out = Math.max(min, out);
      if (typeof max === "number") out = Math.min(max, out);
      // Avoid float dust from repeated 0.5 increments
      return Number(out.toFixed(decimals === 0 ? 0 : Math.max(decimals, 2)));
    },
    [min, max, decimals],
  );

  const inc = () => onChange(clamp(value + step));
  const dec = () => onChange(clamp(value - step));

  const formatted = decimals === 0 ? value.toString() : value.toFixed(decimals);

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
        <div className="flex flex-1 items-center justify-center gap-1 text-center">
          <span className="text-2xl font-bold tabular-nums">{formatted}</span>
          {suffix ? <span className="text-fg-muted text-sm">{suffix}</span> : null}
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
