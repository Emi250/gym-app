"use client";

import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { startRestTimer } from "@/components/rest-timer";
import { NumberStepper } from "@/components/ui/number-stepper";
import { softDeleteSet, upsertSet } from "@/lib/db/session-queries";
import { showToast } from "@/lib/toast/toast-store";
import { cn } from "@/lib/utils/cn";

interface ExistingSet {
  id: string;
  weight_kg: number;
  reps: number;
  rir: number | null;
}

export interface SetRowProps {
  session_exercise_id: string;
  set_number: number;
  target_weight_kg: number;
  target_reps_max: number;
  target_rir: number | null;
  /** If set, starts the rest timer after a NEW set is saved. */
  rest_seconds: number | null;
  existing: ExistingSet | undefined;
}

/**
 * One row per set. Either shows compact "60 kg × 12 ✓" if a set is already
 * logged, or a editable form (steppers + Save button) for pending sets.
 * Tapping a saved row re-opens it for editing.
 */
export function SetRow({
  session_exercise_id,
  set_number,
  target_weight_kg,
  target_reps_max,
  target_rir,
  rest_seconds,
  existing,
}: SetRowProps) {
  const [editing, setEditing] = useState(!existing);
  const [weight, setWeight] = useState(existing?.weight_kg ?? target_weight_kg);
  const [reps, setReps] = useState(existing?.reps ?? target_reps_max);
  const [rir, setRir] = useState<number | null>(existing?.rir ?? target_rir);
  const [saving, setSaving] = useState(false);

  if (!editing && existing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="bg-bg border-border flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="bg-accent/20 text-accent flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
            {set_number}
          </span>
          <span className="font-medium tabular-nums">
            {existing.weight_kg} kg × {existing.reps}
            {existing.rir != null ? <span className="text-fg-muted"> · RIR {existing.rir}</span> : null}
          </span>
        </span>
        <Check className="text-accent h-5 w-5" />
      </button>
    );
  }

  return (
    <div className={cn("bg-bg border-border rounded-xl border p-3", editing && "ring-accent/30 ring-1")}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-fg-muted text-xs font-semibold uppercase tracking-wide">
          Serie {set_number}
        </span>
        {existing ? (
          <button
            type="button"
            onClick={() => {
              if (confirm("¿Borrar esta serie?")) void softDeleteSet(existing.id);
            }}
            className="text-fg-muted hover:text-danger p-1"
            aria-label="Borrar serie"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberStepper
          label="Peso"
          value={weight}
          onChange={setWeight}
          step={0.5}
          min={0}
          decimals={1}
          suffix="kg"
        />
        <NumberStepper label="Reps" value={reps} onChange={setReps} min={0} max={50} />
      </div>
      {target_rir != null || rir != null ? (
        <div className="mt-3">
          <NumberStepper
            label="RIR (opcional)"
            value={rir ?? target_rir ?? 2}
            onChange={(v) => setRir(v)}
            min={0}
            max={5}
          />
        </div>
      ) : null}
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          const isNew = !existing;
          try {
            await upsertSet({
              id: existing?.id,
              session_exercise_id,
              set_number,
              weight_kg: weight,
              reps,
              rir,
            });
            setEditing(false);
            showToast(isNew ? `Serie ${set_number} guardada` : "Cambios guardados", "success");
            // Only start the timer for a freshly logged set, not an edit.
            if (isNew && rest_seconds && rest_seconds > 0) {
              startRestTimer(rest_seconds);
            }
          } catch {
            showToast("No se pudo guardar la serie", "error");
          } finally {
            setSaving(false);
          }
        }}
        className="bg-accent text-accent-fg mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-50"
      >
        <Check className="h-5 w-5" />
        {existing ? "Guardar cambios" : "Guardar serie"}
      </button>
    </div>
  );
}
