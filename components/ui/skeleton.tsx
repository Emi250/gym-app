import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Loading placeholder. Size it with a `className` (e.g. `h-32`). */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("bg-bg-elevated animate-pulse rounded-2xl", className)}
      {...props}
    />
  );
}
