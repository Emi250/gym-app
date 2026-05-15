"use client";

import { ChevronRight, Dumbbell, Play, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  // If there's a session in progress, the entire screen offers to resume or discard.
  if (activeSession) {
    return (
      <AppShell title="Sesión en curso">
        <div className="flex flex-col gap-4">
          <Card padding="lg">
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
          </Card>

          <BigButton onClick={() => router.push(`/train/${activeSession.id}`)}>
            <Play className="h-5 w-5" />
            Continuar sesión
          </BigButton>
          <BigButton variant="ghost" size="md" onClick={() => setConfirmDiscardOpen(true)}>
            <X className="h-5 w-5" />
            Descartar
          </BigButton>
        </div>
        <ConfirmDialog
          open={confirmDiscardOpen}
          title="Descartar sesión"
          description="Se descarta la sesión sin guardar los datos."
          confirmLabel="Descartar"
          destructive
          onConfirm={() => {
            setConfirmDiscardOpen(false);
            void discardSession(activeSession.id);
          }}
          onCancel={() => setConfirmDiscardOpen(false)}
        />
      </AppShell>
    );
  }

  if (routines === undefined) {
    return (
      <AppShell title="Entrenar">
        <Skeleton className="h-32" />
      </AppShell>
    );
  }

  if (!activeRoutine) {
    return (
      <AppShell title="Entrenar">
        <EmptyState
          icon={Dumbbell}
          title="No hay rutina activa"
          description="Creá o activá una rutina para empezar a entrenar."
          action={
            <Link href="/routines" className="w-full">
              <BigButton size="md" className="w-full">
                Ir a Rutinas
              </BigButton>
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Elegí el día">
      {!routineData ? (
        <Skeleton className="h-32" />
      ) : routineData.days.length === 0 ? (
        <Card padding="lg">
          <p className="font-semibold">{activeRoutine.name}</p>
          <p className="text-fg-muted mt-1 text-sm">Esta rutina aún no tiene días.</p>
          <Link href={`/routines/${activeRoutine.id}`} className="mt-3 block">
            <BigButton size="md" className="w-full">
              Editar rutina
            </BigButton>
          </Link>
        </Card>
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
                  className="bg-bg-elevated border-border flex w-full items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
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
