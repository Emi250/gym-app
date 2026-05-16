"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DragHandle, SortableList } from "@/components/sortable-list";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExercisePicker } from "@/components/ui/exercise-picker";
import { Field, Input } from "@/components/ui/field";
import { NumberStepper } from "@/components/ui/number-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { showToast } from "@/lib/toast/toast-store";
import type { LocalExercise, LocalPlannedExercise, LocalTrainingDay } from "@/lib/db/types";

export default function EditRoutinePage() {
  const params = useParams<{ id: string }>();
  const data = useRoutine(params.id);
  const exercises = useExercises();

  if (data === undefined) {
    return (
      <AppShell title="Cargando…">
        <Skeleton className="h-32" />
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

  return <RoutineEditor data={data} exercises={exercises} />;
}

function RoutineEditor({
  data,
  exercises,
}: {
  data: NonNullable<ReturnType<typeof useRoutine>>;
  exercises: LocalExercise[] | undefined;
}) {
  const router = useRouter();
  const [confirmDeleteRoutine, setConfirmDeleteRoutine] = useState(false);
  const { routine, days, planned } = data;
  const startedAtInput = routine.started_at ? routine.started_at.slice(0, 10) : "";
  const [nameDraft, setNameDraft] = useState(routine.name);
  const persistName = useDebouncedCallback(
    (value: string) => void updateRoutine(routine.id, { name: value }),
    400,
  );

  return (
    <AppShell title="Editar rutina" back="/routines">
      <div className="flex flex-col gap-6">
        <Field label="Nombre">
          <Input
            value={nameDraft}
            onChange={(e) => {
              setNameDraft(e.target.value);
              persistName(e.target.value);
            }}
          />
        </Field>

        <Field label="Fecha de inicio">
          <Input
            type="date"
            value={startedAtInput}
            onChange={(e) =>
              void updateRoutine(routine.id, {
                started_at: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        </Field>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-fg-muted text-xs font-semibold uppercase tracking-wide">
              Días de entrenamiento
            </h2>
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
            <p className="bg-bg-elevated border-border text-fg-muted rounded-card border p-4 text-sm">
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
          onClick={() => setConfirmDeleteRoutine(true)}
        >
          Eliminar rutina
        </BigButton>
      </div>
      <ConfirmDialog
        open={confirmDeleteRoutine}
        title="Eliminar rutina"
        description="La rutina se elimina permanentemente."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          setConfirmDeleteRoutine(false);
          void softDeleteRoutine(routine.id).then(() => router.replace("/routines"));
        }}
        onCancel={() => setConfirmDeleteRoutine(false)}
      />
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
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);
  const [dayNameDraft, setDayNameDraft] = useState(day.name);
  const persistDayName = useDebouncedCallback(
    (value: string) => void renameTrainingDay(day.id, value),
    400,
  );
  const exerciseById = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  );
  const sortedPlanned = useMemo(
    () => planned.slice().sort((a, b) => a.position - b.position),
    [planned],
  );

  return (
    <Card padding="md">
      <div className="flex items-center gap-2">
        {dragHandle}
        <input
          value={dayNameDraft}
          onChange={(e) => {
            setDayNameDraft(e.target.value);
            persistDayName(e.target.value);
          }}
          aria-label="Nombre del día"
          className="flex-1 bg-transparent text-lg font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => setConfirmDeleteDay(true)}
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

      <ConfirmDialog
        open={confirmDeleteDay}
        title={`Eliminar "${day.name}"`}
        description="Se elimina el día y sus ejercicios."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          setConfirmDeleteDay(false);
          void softDeleteTrainingDay(day.id);
        }}
        onCancel={() => setConfirmDeleteDay(false)}
      />
    </Card>
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
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <>
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
          <span className="text-fg-muted">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
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
            <Switch
              aria-label="Peso corporal"
              checked={planned.is_bodyweight}
              onCheckedChange={(checked) =>
                void updatePlannedExercise(planned.id, {
                  is_bodyweight: checked,
                  target_weight_kg: checked ? 0 : planned.target_weight_kg,
                })
              }
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
            onClick={() => setConfirmRemove(true)}
            className="text-danger flex h-10 items-center gap-1 text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" /> Quitar ejercicio
          </button>
        </div>
      ) : null}
    </div>
      <ConfirmDialog
        open={confirmRemove}
        title="Quitar ejercicio"
        description="Se quita este ejercicio del día."
        confirmLabel="Quitar"
        destructive
        onConfirm={() => {
          setConfirmRemove(false);
          void softDeletePlannedExercise(planned.id);
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
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
        <Switch
          aria-label="Timer de descanso"
          checked={enabled}
          onCheckedChange={(checked) =>
            void updatePlannedExercise(planned.id, {
              rest_seconds: checked ? 90 : null,
            })
          }
        />
      </label>
      {enabled ? (
        <div className="flex items-end gap-3">
          <div className="bg-bg-elevated border-border flex h-14 w-20 shrink-0 items-center justify-center rounded-control border text-xl font-bold tabular-nums">
            {display}
          </div>
          <div className="min-w-0 flex-1">
            <NumberStepper
              value={seconds}
              onChange={(v) => void updatePlannedExercise(planned.id, { rest_seconds: v })}
              step={15}
              min={15}
              max={600}
              suffix="s"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RirField({ planned }: { planned: LocalPlannedExercise }) {
  const enabled = planned.target_rir != null;
  return (
    <div className="flex flex-col gap-2">
      <label className="bg-bg-elevated border-border flex h-12 items-center justify-between rounded-xl border px-3">
        <span className="text-sm font-medium">RIR objetivo (opcional)</span>
        <Switch
          aria-label="RIR objetivo"
          checked={enabled}
          onCheckedChange={(checked) =>
            void updatePlannedExercise(planned.id, {
              target_rir: checked ? 2 : null,
            })
          }
        />
      </label>
      {enabled ? (
        <NumberStepper
          value={planned.target_rir ?? 2}
          onChange={(v) => void updatePlannedExercise(planned.id, { target_rir: v })}
          min={0}
          max={5}
        />
      ) : null}
    </div>
  );
}
