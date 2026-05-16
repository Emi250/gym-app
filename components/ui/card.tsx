import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const cardStyles = cva(
  "bg-bg-elevated border-border rounded-card border shadow-card backdrop-blur-sm",
  {
    variants: {
      padding: { none: "", sm: "p-3", md: "p-4", lg: "p-5" },
      interactive: {
        true: "transition-colors hover:bg-bg-elevated-2 active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: { padding: "md", interactive: false },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardStyles> {}

/** Elevated, bordered container. The universal surface for content blocks. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, interactive, ...props }, ref) => (
    <div ref={ref} className={cn(cardStyles({ padding, interactive }), className)} {...props} />
  ),
);
Card.displayName = "Card";
