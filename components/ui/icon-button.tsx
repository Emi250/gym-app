import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const iconButtonStyles = cva(
  "flex shrink-0 items-center justify-center rounded-full text-fg-muted " +
    "bg-bg-elevated border border-border backdrop-blur-sm " +
    "transition-[transform,background-color,color] duration-150 ease-out " +
    "hover:text-fg hover:bg-bg-elevated-2 active:scale-95 disabled:opacity-30 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40",
  {
    variants: {
      size: { sm: "h-9 w-9", md: "h-10 w-10" },
    },
    defaultVariants: { size: "md" },
  },
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonStyles> {
  /** Required: icon-only buttons must have an accessible name. */
  "aria-label": string;
}

/** Round icon-only button. Always pass `aria-label`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonStyles({ size }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
