"use client";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SortableItemRenderProps {
  /** Spread on the drag handle element. */
  handleProps: React.HTMLAttributes<HTMLElement>;
  /** True while this item is being dragged. */
  isDragging: boolean;
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  /** Render the item; place {handle} where the drag handle should go. */
  render: (item: T, helpers: SortableItemRenderProps) => ReactNode;
  className?: string;
}

/**
 * Vertical, touch-friendly drag-to-reorder list. Wraps `@dnd-kit/sortable`
 * with sensible defaults: small drag distance activator so taps don't
 * accidentally start a drag, restricted to vertical axis.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  render,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    onReorder(next.map((i) => i.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className={cn("flex flex-col gap-2", className)}>
          {items.map((item) => (
            <SortableItem key={item.id} item={item} render={render} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem<T extends { id: string }>({
  item,
  render,
}: {
  item: T;
  render: SortableListProps<T>["render"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    touchAction: "manipulation",
  };
  return (
    <li ref={setNodeRef} style={style} className={cn(isDragging && "z-10")}>
      {render(item, {
        handleProps: { ...attributes, ...listeners, role: undefined },
        isDragging,
      })}
    </li>
  );
}

/** Convenience: a default Grip handle styled for the dark theme. */
export function DragHandle({ handleProps }: { handleProps: SortableItemRenderProps["handleProps"] }) {
  return (
    <button
      type="button"
      aria-label="Reordenar"
      {...handleProps}
      className="text-fg-muted hover:text-fg flex h-10 w-8 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
