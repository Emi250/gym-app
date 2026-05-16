import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Highlights the chip with the accent color. */
  active?: boolean;
}

/** Pill-shaped toggle button used for filters and metric selectors. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ active = false, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40",
        active
          ? "bg-accent text-accent-fg"
          : "bg-bg-elevated text-fg-muted border border-border",
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = "Chip";
