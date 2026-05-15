"use client";

import { Check, Dumbbell, Flag, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SetRow } from "@/components/set-row";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  discardSession,
  markSessionFinished,
  useLastPerformance,
  useSession,
} from "@/lib/db/session-queries";
import { applyProgressionToSession } from "@/lib/progression/apply";
import { showToast } from "@/lib/toast/toast-store";

/** Pure progress math for a live session: sets logged vs. sets expected.
 *  `expected` per exercise is the configured `target_sets`, expanded if the
 *  user logged extra sets so the progress bar never exceeds 100%. */
export function computeSessionProgress(
  sExercises: { id: string; target_sets: number }[],
  sets: { session_exercise_id: string; set_number: number }[],
): { done: number; expected: number } {
  let expected = 0;
  for (const se of sExercises) {
    const performedForSe = sets.filter((s) => s.session_exercise_id === se.id).length;
    expected += Math.max(se.target_sets, performedForSe);
  }
  return { done: sets.length, expected };
}

export default function LiveSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useSession(params.id);
  const [finishing, setFinishing] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const totals = useMemo(
    () => (data ? computeSessionProgress(data.sExercises, data.sets) : null),
    [data],
  );

  if (data === undefined) {
    return (
      <AppShell title="Cargando…">
        <Skeleton className="h-32" />
      </AppShell>
    );
  }
  if (data === null) {
    return (
      <AppShell title="Sesión no encontrada">
        <p className="text-fg-muted">Esta sesión no existe o fue descartada.</p>
        <button
          type="button"
          className="text-accent mt-4 underline"
          onClick={() => router.replace("/train")}
        >
          ← Volver a Entrenar
        </button>
      </AppShell>
    );
  }
  const { session, sExercises, sets } = data;

  if (session.finished_at) {
    // Defensive: if user navigates back into a finished session, send them to history detail.
    router.replace(`/history/${session.id}`);
    return null;
  }

  async function runFinish() {
    setConfirmFinishOpen(false);
    setFinishing(true);
    try {
      await applyProgressionToSession(session.id);
      await markSessionFinished(session.id);
      router.replace(`/train/${session.id}/finish`);
    } catch {
      showToast("No se pudo terminar la sesión", "error");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <AppShell title={session.training_day_name} back="/train">
      <div className="flex flex-col gap-5">
        {totals ? (
          <Card padding="md">
            <div className="flex items-baseline justify-between">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Progreso</p>
              <p className="text-fg-muted text-xs tabular-nums">
                {totals.done} / {totals.expected} series
              </p>
            </div>
            <div className="bg-bg-elevated-2 mt-2 h-2 overflow-hidden rounded-full">
              <div
                className="bg-accent h-full rounded-full transition-[width]"
                style={{
                  width: `${totals.expected > 0 ? Math.round((totals.done / totals.expected) * 100) : 0}%`,
                }}
              />
            </div>
          </Card>
        ) : null}

        {sExercises.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Sin ejercicios"
            description="Esta sesión no tenía ejercicios planificados."
          />
        ) : (
          sExercises.map((se) => (
            <ExerciseBlock
              key={se.id}
              session_exercise={se}
              sets={sets.filter((s) => s.session_exercise_id === se.id)}
              session_id={session.id}
            />
          ))
        )}

        <div className="flex flex-col gap-2">
          <BigButton
            disabled={finishing}
            onClick={() => {
              if (sets.length === 0) {
                setConfirmFinishOpen(true);
              } else {
                void runFinish();
              }
            }}
          >
            <Flag className="h-5 w-5" />
            {finishing ? "Terminando…" : "Terminar sesión"}
          </BigButton>

          <BigButton
            variant="ghost"
            size="md"
            onClick={() => setConfirmDiscardOpen(true)}
            className="text-fg-muted"
          >
            <Trash2 className="h-4 w-4" />
            Descartar sesión
          </BigButton>
        </div>
      </div>

      <ConfirmDialog
        open={confirmFinishOpen}
        title="Terminar sin series"
        description="No registraste ninguna serie. ¿Terminar la sesión igual?"
        confirmLabel="Terminar"
        onConfirm={() => void runFinish()}
        onCancel={() => setConfirmFinishOpen(false)}
      />
      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Descartar sesión"
        description="Se descarta la sesión sin guardar los datos."
        confirmLabel="Descartar"
        destructive
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          void discardSession(session.id).then(() => router.replace("/train"));
        }}
        onCancel={() => setConfirmDiscardOpen(false)}
      />
    </AppShell>
  );
}

function formatWeight(weight_kg: number, bodyweight: boolean): string {
  if (!bodyweight) return `${weight_kg} kg`;
  if (weight_kg === 0) return "Peso corporal";
  return `Peso corporal + ${weight_kg} kg`;
}

function fmtShortDate(iso: string): string {
  // Display absolute short date; avoids Date.now() during render (React 19 purity lint).
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" });
}

function ExerciseBlock({
  session_exercise,
  sets,
  session_id,
}: {
  session_exercise: import("@/lib/db/types").LocalSessionExercise;
  sets: import("@/lib/db/types").LocalSessionSet[];
  session_id: string;
}) {
  const setsBySetNumber = new Map(sets.map((s) => [s.set_number, s]));
  const performed = sets.length;
  const planned = session_exercise.target_sets;
  const totalToShow = Math.max(planned, performed + 1);
  const allDone = performed >= planned;
  const last = useLastPerformance(session_exercise.exercise_id, session_id);

  return (
    <Card padding="md">
      <header className="mb-3">
        <h3 className="text-base font-semibold">
          {session_exercise.exercise_name}
          {session_exercise.is_bodyweight ? (
            <span className="bg-accent/15 text-accent ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
              BW
            </span>
          ) : null}
        </h3>
        <p className="text-fg-muted text-xs">
          Objetivo: {session_exercise.target_reps_min}–{session_exercise.target_reps_max} reps ·{" "}
          {formatWeight(session_exercise.target_weight_kg, session_exercise.is_bodyweight)}
          {session_exercise.target_rir != null ? ` · RIR ${session_exercise.target_rir}` : ""}
        </p>
        {last ? (
          <p className="text-fg-muted mt-1 text-xs">
            Última vez ({fmtShortDate(last.finished_at)}):{" "}
            <span className="text-fg/80 tabular-nums">
              {last.sets
                .map((s) => `${s.weight_kg}×${s.reps}`)
                .join(", ")}
            </span>
          </p>
        ) : null}
      </header>

      <ul className="flex flex-col gap-2">
        {Array.from({ length: totalToShow }, (_, i) => i + 1).map((n) => {
          const existing = setsBySetNumber.get(n);
          return (
            <li key={n}>
              <SetRow
                session_exercise_id={session_exercise.id}
                set_number={n}
                target_weight_kg={session_exercise.target_weight_kg}
                target_reps_max={session_exercise.target_reps_max}
                target_rir={session_exercise.target_rir}
                rest_seconds={session_exercise.rest_seconds}
                existing={
                  existing
                    ? {
                        id: existing.id,
                        weight_kg: existing.weight_kg,
                        reps: existing.reps,
                        rir: existing.rir,
                      }
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>

      {allDone ? (
        <p className="text-accent mt-3 inline-flex items-center gap-1 text-xs font-medium">
          <Check className="h-3.5 w-3.5" /> {performed} series registradas
        </p>
      ) : null}
    </Card>
  );
}
