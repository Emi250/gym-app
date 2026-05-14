"use client";

import { Check, Flag, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SetRow } from "@/components/set-row";
import { BigButton } from "@/components/ui/big-button";
import {
  discardSession,
  markSessionFinished,
  useLastPerformance,
  useSession,
} from "@/lib/db/session-queries";
import { applyProgressionToSession } from "@/lib/progression/apply";

export default function LiveSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useSession(params.id);
  const [finishing, setFinishing] = useState(false);

  const totals = useMemo(() => {
    if (!data) return null;
    const expectedPerExercise = new Map<string, number>();
    let expected = 0;
    for (const se of data.sExercises) {
      // The target_sets count lives on planned_exercises, not on session_exercises.
      // For the bar we use the maximum set_number seen + planned default of 3 if zero.
      const setsForSe = data.sets.filter((s) => s.session_exercise_id === se.id);
      const maxSet = setsForSe.reduce((m, s) => Math.max(m, s.set_number), 0);
      const exp = Math.max(maxSet, 3); // assume 3 unless more were performed
      expectedPerExercise.set(se.id, exp);
      expected += exp;
    }
    const done = data.sets.length;
    return { done, expected, expectedPerExercise };
  }, [data]);

  if (data === undefined) {
    return (
      <AppShell title="Cargando…">
        <div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />
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

  return (
    <AppShell title={session.training_day_name} back="/train">
      <div className="flex flex-col gap-5">
        {totals ? (
          <div className="bg-bg-elevated border-border rounded-2xl border p-4">
            <p className="text-fg-muted text-xs uppercase tracking-wide">Progreso</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {totals.done} <span className="text-fg-muted text-base font-medium">series</span>
            </p>
          </div>
        ) : null}

        {sExercises.length === 0 ? (
          <p className="bg-bg-elevated border-border text-fg-muted rounded-2xl border p-4 text-sm">
            Esta sesión no tenía ejercicios planificados.
          </p>
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
            onClick={async () => {
              if (sets.length === 0) {
                if (!confirm("No registraste ninguna serie. ¿Terminar igual?")) return;
              }
              setFinishing(true);
              try {
                await applyProgressionToSession(session.id);
                await markSessionFinished(session.id);
                router.replace(`/train/${session.id}/finish`);
              } finally {
                setFinishing(false);
              }
            }}
          >
            <Flag className="h-5 w-5" />
            {finishing ? "Terminando…" : "Terminar sesión"}
          </BigButton>

          <BigButton
            variant="ghost"
            size="md"
            onClick={() => {
              if (confirm("¿Descartar la sesión sin guardar?")) {
                void discardSession(session.id).then(() => router.replace("/train"));
              }
            }}
            className="text-fg-muted"
          >
            <Trash2 className="h-4 w-4" />
            Descartar sesión
          </BigButton>
        </div>
      </div>
    </AppShell>
  );
}

function formatWeight(weight_kg: number, bodyweight: boolean): string {
  if (!bodyweight) return `${weight_kg} kg`;
  if (weight_kg === 0) return "Peso corporal";
  return `Peso corporal + ${weight_kg} kg`;
}

function fmtRelativeDate(iso: string): string {
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
  // We don't know exactly target_sets for this session_exercise; mirror the spec
  // and default to 3 unless the user logged more (allow extra sets organically).
  const performed = sets.length;
  const planned = 3;
  const totalToShow = Math.max(planned, performed + 1);
  const allDone = performed >= planned;
  const last = useLastPerformance(session_exercise.exercise_id, session_id);

  return (
    <section className="bg-bg-elevated border-border rounded-2xl border p-4">
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
            Última vez ({fmtRelativeDate(last.finished_at)}):{" "}
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
    </section>
  );
}
