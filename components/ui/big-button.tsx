import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const bigButtonStyles = cva(
  "flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors " +
    "active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg",
        secondary: "bg-bg-elevated text-fg border border-border",
        ghost: "text-fg hover:bg-bg-elevated",
        danger: "bg-danger text-fg",
      },
      size: {
        lg: "h-14 px-6 text-lg w-full",
        md: "h-12 px-5 text-base",
        sm: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  },
);

export interface BigButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bigButtonStyles> {}

export const BigButton = forwardRef<HTMLButtonElement, BigButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(bigButtonStyles({ variant, size }), className)} {...props} />
  ),
);
BigButton.displayName = "BigButton";
