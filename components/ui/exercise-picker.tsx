"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { useExercises } from "@/lib/db/queries";
import { stripDiacritics } from "@/lib/utils/text";
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
    // Deduplicate by normalized name. When the catalog was seeded locally before
    // auth and then again pulled from Supabase, the same exercise can show up
    // twice with different ids. Prefer the global catalog (user_id === null)
    // because those are stable across devices.
    const byKey = new Map<string, LocalExercise>();
    for (const e of exercises) {
      const key = `${e.muscle_group}::${stripDiacritics(e.name)}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, e);
      } else if (existing.user_id !== null && e.user_id === null) {
        byKey.set(key, e);
      }
    }
    const deduped = Array.from(byKey.values());
    const q = stripDiacritics(query.trim());
    return deduped.filter((e) => {
      if (filter && e.muscle_group !== filter) return false;
      if (!q) return true;
      return stripDiacritics(e.name).includes(q);
    });
  }, [exercises, query, filter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black/70 backdrop-blur-md">
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
          <div className="bg-bg-elevated border-border flex h-12 items-center gap-2 rounded-control border px-3 backdrop-blur-sm">
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
                  className="hover:bg-bg-elevated flex w-full items-center justify-between rounded-control px-3 py-3 text-left transition-colors"
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
