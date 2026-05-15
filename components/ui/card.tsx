import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const cardStyles = cva("bg-bg-elevated border-border rounded-2xl border", {
  variants: {
    padding: { none: "", sm: "p-3", md: "p-4", lg: "p-5" },
  },
  defaultVariants: { padding: "md" },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardStyles> {}

/** Elevated, bordered container. The universal surface for content blocks. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardStyles({ padding }), className)} {...props} />
  ),
);
Card.displayName = "Card";
