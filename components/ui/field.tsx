import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

/** Shared control surface for text inputs and selects. */
const controlStyles =
  "bg-bg-elevated border-border h-14 w-full rounded-2xl border px-4 text-base " +
  "outline-none focus-visible:ring-2 focus-visible:ring-fg/40";

export interface FieldProps {
  label: string;
  hint?: string;
  /** Should match the `id` of the control rendered as a child. */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + optional hint, stacked vertically. */
export function Field({ label, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-fg-muted text-xs font-medium uppercase tracking-wide"
      >
        {label}
      </label>
      {children}
      {hint ? <span className="text-fg-muted text-xs">{hint}</span> : null}
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Styled text input. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlStyles, className)} {...props} />
  ),
);
Input.displayName = "Input";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Styled select with a visible chevron indicator. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlStyles, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-fg-muted pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2"
      />
    </div>
  ),
);
Select.displayName = "Select";
