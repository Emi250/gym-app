"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useSessionDetail } from "@/lib/db/history-queries";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const data = useSessionDetail(params.id);

  if (data === undefined) {
    return (
      <AppShell title="Sesión">
        <div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />
      </AppShell>
    );
  }
  if (data === null) {
    return (
      <AppShell title="Sesión no encontrada">
        <p className="text-fg-muted">Esta sesión no existe o fue eliminada.</p>
      </AppShell>
    );
  }

  const { session, sExercises, sets } = data;

  return (
    <AppShell title={session.training_day_name} back="/history">
      <div className="flex flex-col gap-5">
        <div className="bg-bg-elevated border-border rounded-2xl border p-4">
          <p className="text-fg-muted text-xs uppercase tracking-wide">Fecha</p>
          <p className="mt-1 font-medium">{fmtDate(session.started_at)}</p>
        </div>

        {sExercises.length === 0 ? (
          <p className="text-fg-muted text-sm">No había ejercicios en esta sesión.</p>
        ) : (
          sExercises.map((se) => {
            const seSets = sets.filter((s) => s.session_exercise_id === se.id);
            return (
              <section key={se.id} className="bg-bg-elevated border-border rounded-2xl border p-4">
                <h3 className="font-semibold">{se.exercise_name}</h3>
                <p className="text-fg-muted text-xs">
                  Objetivo: {se.target_reps_min}–{se.target_reps_max} reps @ {se.target_weight_kg} kg
                  {se.target_rir != null ? ` · RIR ${se.target_rir}` : ""}
                </p>
                {seSets.length === 0 ? (
                  <p className="text-fg-muted mt-3 text-sm">Sin series registradas.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {seSets.map((s) => (
                      <li
                        key={s.id}
                        className="bg-bg border-border flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                      >
                        <span className="text-fg-muted">Serie {s.set_number}</span>
                        <span className="font-medium tabular-nums">
                          {s.weight_kg} kg × {s.reps}
                          {s.rir != null ? <span className="text-fg-muted"> · RIR {s.rir}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
