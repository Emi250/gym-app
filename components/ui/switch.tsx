import { cn } from "@/lib/utils/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Associates the switch with an external `<label htmlFor>`. */
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name when there is no associated `<label>`. */
  "aria-label"?: string;
  /** Id of an element that labels the switch. */
  "aria-labelledby"?: string;
}

/** Accessible on/off toggle. Controlled — pass `checked` and `onCheckedChange`. */
export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40 " +
          "disabled:opacity-40",
        checked ? "bg-accent" : "bg-bg-elevated-2",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-fg transition-transform duration-150 ease-out",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}
