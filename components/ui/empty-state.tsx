import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA rendered below the text (e.g. a button or link). */
  action?: ReactNode;
  className?: string;
}

/** Centered icon + title + description block for empty/zero-data screens. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-bg-elevated border-border flex flex-col items-center gap-3 rounded-card border p-6 text-center shadow-card backdrop-blur-sm",
        className,
      )}
    >
      <Icon className="text-fg-muted h-10 w-10" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        {description ? <p className="text-fg-muted mt-1 text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
