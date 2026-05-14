"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useExercises } from "@/lib/db/queries";
import { cn } from "@/lib/utils/cn";
import type { LocalExercise, MuscleGroup } from "@/lib/db/types";

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: "Pecho",
  back: "Espalda",
  legs: "Piernas",
  shoulders: "Hombros",
  arms: "Brazos",
  core: "Core",
  other: "Otro",
};

const MUSCLE_ORDER: MuscleGroup[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "other",
];

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: LocalExercise) => void;
}

export function ExercisePicker({ open, onClose, onPick }: ExercisePickerProps) {
  const exercises = useExercises();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MuscleGroup | null>(null);

  const visible = useMemo(() => {
    if (!exercises) return [];
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (filter && e.muscle_group !== filter) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q);
    });
  }, [exercises, query, filter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black/50 backdrop-blur-sm">
      <div className="bg-bg border-border mt-auto flex max-h-[85vh] flex-col rounded-t-3xl border-t">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Elegir ejercicio</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted hover:text-fg p-2"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4">
          <div className="bg-bg-elevated border-border flex h-12 items-center gap-2 rounded-2xl border px-3">
            <Search className="text-fg-muted h-4 w-4" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="flex-1 bg-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          <Chip active={filter === null} onClick={() => setFilter(null)}>
            Todos
          </Chip>
          {MUSCLE_ORDER.map((m) => (
            <Chip key={m} active={filter === m} onClick={() => setFilter(m)}>
              {MUSCLE_LABEL[m]}
            </Chip>
          ))}
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-6">
          {visible.length === 0 ? (
            <li className="text-fg-muted px-4 py-8 text-center text-sm">Sin resultados</li>
          ) : (
            visible.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(e);
                    onClose();
                  }}
                  className="hover:bg-bg-elevated flex w-full items-center justify-between rounded-xl px-3 py-3 text-left"
                >
                  <span>
                    <span className="block font-medium">{e.name}</span>
                    <span className="text-fg-muted text-xs">{MUSCLE_LABEL[e.muscle_group]}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-fg" : "bg-bg-elevated text-fg-muted",
      )}
    >
      {children}
    </button>
  );
}
