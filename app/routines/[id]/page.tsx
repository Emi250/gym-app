"use client";

import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DragHandle, SortableList } from "@/components/sortable-list";
import { BigButton } from "@/components/ui/big-button";
import { ExercisePicker } from "@/components/ui/exercise-picker";
import { NumberStepper } from "@/components/ui/number-stepper";
import {
  addPlannedExercise,
  addTrainingDay,
  renameTrainingDay,
  reorderPlannedExercises,
  reorderTrainingDays,
  softDeletePlannedExercise,
  softDeleteRoutine,
  softDeleteTrainingDay,
  updatePlannedExercise,
  updateRoutine,
  useExercises,
  useRoutine,
} from "@/lib/db/queries";
import { showToast } from "@/lib/toast/toast-store";
import type { LocalExercise, LocalPlannedExercise, LocalTrainingDay } from "@/lib/db/types";

export default function EditRoutinePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useRoutine(params.id);
  const exercises = useExercises();

  if (data === undefined) {
    return (
      <AppShell title="Cargando…">
        <div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />
      </AppShell>
    );
  }
  if (data === null) {
    return (
      <AppShell title="Rutina no encontrada">
        <p className="text-fg-muted">Esta rutina no existe o fue eliminada.</p>
        <Link href="/routines" className="text-accent mt-4 block underline">
          ← Volver a rutinas
        </Link>
      </AppShell>
    );
  }

  const { routine, days, planned } = data;
  const startedAtInput = routine.started_at ? routine.started_at.slice(0, 10) : "";

  return (
    <AppShell title="Editar rutina" back="/routines">
      <div className="flex flex-col gap-6">
        <Field label="Nombre">
          <input
            value={routine.name}
            onChange={(e) => void updateRoutine(routine.id, { name: e.target.value })}
            className="bg-bg-elevated border-border h-14 w-full rounded-2xl border px-4 text-base outline-none focus:ring-2 focus:ring-white/20"
          />
        </Field>

        <Field label="Fecha de inicio">
          <input
            type="date"
            value={startedAtInput}
            onChange={(e) =>
              void updateRoutine(routine.id, {
                started_at: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
            className="bg-bg-elevated border-border h-14 w-full rounded-2xl border px-4 text-base outline-none focus:ring-2 focus:ring-white/20"
          />
        </Field>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide">Días de entrenamiento</h2>
            <button
              type="button"
              onClick={async () => {
                await addTrainingDay(routine.id, defaultDayName(days.length));
                showToast("Día agregado", "success");
              }}
              className="text-accent flex items-center gap-1 text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Agregar día
            </button>
          </div>
          {days.length === 0 ? (
            <p className="bg-bg-elevated border-border text-fg-muted rounded-2xl border p-4 text-sm">
              Todavía no hay días. Agregá uno para empezar.
            </p>
          ) : (
            <SortableList
              className="flex-col gap-3"
              items={days}
              onReorder={(ids) => void reorderTrainingDays(ids)}
              render={(day, { handleProps }) => (
                <DayEditor
                  day={day}
                  planned={planned.filter((p) => p.training_day_id === day.id)}
                  exercises={exercises ?? []}
                  dragHandle={<DragHandle handleProps={handleProps} />}
                />
              )}
            />
          )}
        </section>

        <BigButton
          variant="danger"
          size="md"
          onClick={() => {
            if (confirm("¿Eliminar esta rutina?")) {
              void softDeleteRoutine(routine.id).then(() => router.replace("/routines"));
            }
          }}
        >
          Eliminar rutina
        </BigButton>
      </div>
    </AppShell>
  );
}

function formatWeightLabel(weight_kg: number, bodyweight: boolean): string {
  if (!bodyweight) return `${weight_kg} kg`;
  if (weight_kg === 0) return "Peso corporal";
  return `Peso corporal + ${weight_kg} kg`;
}

function defaultDayName(count: number): string {
  const letters = ["A", "B", "C", "D", "E", "F", "G"];
  return `Día ${letters[count] ?? count + 1}`;
}

function DayEditor({
  day,
  planned,
  exercises,
  dragHandle,
}: {
  day: LocalTrainingDay;
  planned: LocalPlannedExercise[];
  exercises: LocalExercise[];
  dragHandle?: React.ReactNode;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const exerciseById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );
  const sortedPlanned = useMemo(
    () => planned.slice().sort((a, b) => a.position - b.position),
    [planned],
  );

  return (
    <div className="bg-bg-elevated border-border rounded-2xl border p-4">
      <div className="flex items-center gap-2">
        {dragHandle}
        <input
          value={day.name}
          onChange={(e) => void renameTrainingDay(day.id, e.target.value)}
          className="flex-1 bg-transparent text-lg font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => {
            if (confirm(`¿Eliminar "${day.name}"?`)) void softDeleteTrainingDay(day.id);
          }}
          className="text-fg-muted hover:text-danger p-1"
          aria-label="Eliminar día"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {sortedPlanned.length > 0 ? (
        <div className="mt-3">
          <SortableList
            items={sortedPlanned}
            onReorder={(ids) => void reorderPlannedExercises(ids)}
            render={(p, { handleProps }) => {
              const ex = exerciseById.get(p.exercise_id);
              return (
                <PlannedExerciseRow
                  planned={p}
                  exerciseName={ex?.name ?? "Ejercicio eliminado"}
                  dragHandle={<DragHandle handleProps={handleProps} />}
                />
              );
            }}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="border-border text-fg-muted hover:text-fg mt-3 flex h-12 w-full items-center justify-center gap-1 rounded-xl border border-dashed text-sm font-medium"
      >
        <Plus className="h-4 w-4" /> Agregar ejercicio
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (ex) => {
          await addPlannedExercise({
            training_day_id: day.id,
            exercise_id: ex.id,
            target_sets: 3,
            target_reps_min: 8,
            target_reps_max: 12,
            target_weight_kg: 20,
            target_rir: null,
          });
          showToast(`${ex.name} agregado`, "success");
        }}
      />
    </div>
  );
}

function PlannedExerciseRow({
  planned,
  exerciseName,
  dragHandle,
}: {
  planned: LocalPlannedExercise;
  exerciseName: string;
  dragHandle?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-bg border-border rounded-xl border">
      <div className="flex items-center">
        {dragHandle}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center justify-between gap-3 px-3 py-3 text-left"
        >
          <span className="flex-1">
            <span className="block font-medium">{exerciseName}</span>
            <span className="text-fg-muted text-xs">
              {planned.target_sets}×{planned.target_reps_min}–{planned.target_reps_max} reps ·{" "}
              {formatWeightLabel(planned.target_weight_kg, planned.is_bodyweight)}
              {planned.target_rir != null ? ` · RIR ${planned.target_rir}` : ""}
            </span>
          </span>
          <span className="text-fg-muted text-xs">{expanded ? "−" : "Editar"}</span>
        </button>
      </div>

      {expanded ? (
        <div className="border-border space-y-4 border-t p-4">
          <label className="bg-bg-elevated border-border flex h-12 items-center justify-between rounded-xl border px-3">
            <span className="text-sm font-medium">
              Peso corporal
              <span className="text-fg-muted ml-2 text-xs font-normal">
                (dominadas, fondos, etc)
              </span>
            </span>
            <input
              type="checkbox"
              checked={planned.is_bodyweight}
              onChange={(e) =>
                void updatePlannedExercise(planned.id, {
                  is_bodyweight: e.target.checked,
                  // When switching to bodyweight, reset extra weight to 0.
                  target_weight_kg: e.target.checked ? 0 : planned.target_weight_kg,
                })
              }
              className="h-5 w-5 accent-green-500"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <NumberStepper
              label="Series"
              value={planned.target_sets}
              onChange={(v) => void updatePlannedExercise(planned.id, { target_sets: v })}
              min={1}
              max={10}
            />
            <NumberStepper
              label={planned.is_bodyweight ? "Peso extra" : "Peso"}
              value={planned.target_weight_kg}
              onChange={(v) => void updatePlannedExercise(planned.id, { target_weight_kg: v })}
              step={0.5}
              min={0}
              decimals={1}
              suffix="kg"
            />
            <NumberStepper
              label="Reps mín"
              value={planned.target_reps_min}
              onChange={(v) =>
                void updatePlannedExercise(planned.id, {
                  target_reps_min: v,
                  target_reps_max: Math.max(v, planned.target_reps_max),
                })
              }
              min={1}
              max={30}
            />
            <NumberStepper
              label="Reps máx"
              value={planned.target_reps_max}
              onChange={(v) =>
                void updatePlannedExercise(planned.id, {
                  target_reps_max: Math.max(v, planned.target_reps_min),
                })
              }
              min={planned.target_reps_min}
              max={30}
            />
          </div>

          <RirField planned={planned} />
          <RestField planned={planned} />

          <button
            type="button"
            onClick={() => {
              if (confirm("¿Quitar este ejercicio del día?"))
                void softDeletePlannedExercise(planned.id);
            }}
            className="text-danger flex h-10 items-center gap-1 text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" /> Quitar ejercicio
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RestField({ planned }: { planned: LocalPlannedExercise }) {
  const enabled = planned.rest_seconds != null;
  const seconds = planned.rest_seconds ?? 90;
  const display =
    seconds >= 60
      ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
      : `${seconds}s`;
  return (
    <div className="flex flex-col gap-2">
      <label className="bg-bg-elevated border-border flex h-12 items-center justify-between rounded-xl border px-3">
        <span className="text-sm font-medium">Timer de descanso (opcional)</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            void updatePlannedExercise(planned.id, {
              rest_seconds: e.target.checked ? 90 : null,
            })
          }
          className="h-5 w-5 accent-green-500"
        />
      </label>
      {enabled ? (
        <div className="flex items-end gap-3">
          <div className="bg-bg-elevated border-border flex h-14 flex-1 items-center justify-center rounded-2xl border text-xl font-bold tabular-nums">
            {display}
          </div>
          <NumberStepper
            value={seconds}
            onChange={(v) => void updatePlannedExercise(planned.id, { rest_seconds: v })}
            step={15}
            min={15}
            max={600}
            suffix="s"
            className="w-40"
          />
        </div>
      ) : null}
    </div>
  );
}

function RirField({ planned }: { planned: LocalPlannedExercise }) {
  const enabled = planned.target_rir != null;
  return (
    <div className="flex items-end gap-3">
      <label className="bg-bg-elevated border-border flex h-12 flex-1 items-center justify-between rounded-xl border px-3">
        <span className="text-sm font-medium">RIR objetivo (opcional)</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) =>
            void updatePlannedExercise(planned.id, {
              target_rir: e.target.checked ? 2 : null,
            })
          }
          className="h-5 w-5 accent-green-500"
        />
      </label>
      {enabled ? (
        <NumberStepper
          value={planned.target_rir ?? 2}
          onChange={(v) => void updatePlannedExercise(planned.id, { target_rir: v })}
          min={0}
          max={5}
          className="w-32"
        />
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fg-muted text-xs font-medium uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}
