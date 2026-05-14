"use client";

import { ChevronRight, Dumbbell, Play, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { useCurrentUserId } from "@/lib/auth/current-user";
import { useRoutine, useRoutines } from "@/lib/db/queries";
import { discardSession, startSession, useActiveSession } from "@/lib/db/session-queries";

export default function TrainPage() {
  const router = useRouter();
  const userId = useCurrentUserId();
  const routines = useRoutines();
  const activeSession = useActiveSession();
  const activeRoutine = routines?.active ?? null;
  const routineData = useRoutine(activeRoutine?.id);

  // If there's a session in progress, the entire screen offers to resume or discard.
  if (activeSession) {
    return (
      <AppShell title="Sesión en curso">
        <div className="flex flex-col gap-4">
          <div className="bg-bg-elevated border-border rounded-2xl border p-5">
            <p className="text-fg-muted text-xs uppercase tracking-wide">Sin terminar</p>
            <p className="mt-2 text-xl font-semibold">{activeSession.training_day_name}</p>
            <p className="text-fg-muted mt-1 text-sm">
              Empezada{" "}
              {new Date(activeSession.started_at).toLocaleString("es", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>

          <BigButton onClick={() => router.push(`/train/${activeSession.id}`)}>
            <Play className="h-5 w-5" />
            Continuar sesión
          </BigButton>
          <BigButton
            variant="ghost"
            size="md"
            onClick={() => {
              if (confirm("¿Descartar la sesión sin guardar?")) void discardSession(activeSession.id);
            }}
          >
            <X className="h-5 w-5" />
            Descartar
          </BigButton>
        </div>
      </AppShell>
    );
  }

  if (routines === undefined) {
    return (
      <AppShell title="Entrenar">
        <div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />
      </AppShell>
    );
  }

  if (!activeRoutine) {
    return (
      <AppShell title="Entrenar">
        <div className="bg-bg-elevated border-border flex flex-col items-center gap-3 rounded-2xl border p-6 text-center">
          <Dumbbell className="text-fg-muted h-10 w-10" />
          <p className="font-semibold">No hay rutina activa</p>
          <p className="text-fg-muted text-sm">Creá o activá una rutina para empezar a entrenar.</p>
          <Link href="/routines" className="mt-2 w-full">
            <BigButton size="md" className="w-full">
              Ir a Rutinas
            </BigButton>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Elegí el día">
      {!routineData ? (
        <div className="bg-bg-elevated h-32 animate-pulse rounded-2xl" />
      ) : routineData.days.length === 0 ? (
        <div className="bg-bg-elevated border-border rounded-2xl border p-5">
          <p className="font-semibold">{activeRoutine.name}</p>
          <p className="text-fg-muted mt-1 text-sm">Esta rutina aún no tiene días.</p>
          <Link href={`/routines/${activeRoutine.id}`} className="mt-3 block">
            <BigButton size="md" className="w-full">
              Editar rutina
            </BigButton>
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {routineData.days.map((day) => {
            const plannedCount = routineData.planned.filter(
              (p) => p.training_day_id === day.id,
            ).length;
            return (
              <li key={day.id}>
                <button
                  type="button"
                  className="bg-bg-elevated border-border flex w-full items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.99]"
                  onClick={async () => {
                    if (!userId) return;
                    const id = await startSession({
                      user_id: userId,
                      routine_id: activeRoutine.id,
                      training_day_id: day.id,
                    });
                    router.push(`/train/${id}`);
                  }}
                >
                  <div className="bg-accent/15 text-accent flex h-12 w-12 items-center justify-center rounded-xl">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold">{day.name}</p>
                    <p className="text-fg-muted text-xs">
                      {plannedCount} {plannedCount === 1 ? "ejercicio" : "ejercicios"}
                    </p>
                  </div>
                  <ChevronRight className="text-fg-muted h-5 w-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
