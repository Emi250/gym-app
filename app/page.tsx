"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { useRoutines } from "@/lib/db/queries";
import { useFinishedSessions } from "@/lib/db/history-queries";
import { routineDurationLabel } from "@/lib/utils/routine-time";

export default function Home() {
  const data = useRoutines();
  const active = data?.active ?? null;
  const sessions = useFinishedSessions();
  const sessionCount = sessions?.length ?? 0;

  return (
    <AppShell
      title="Gym Tracker"
      topRight={
        <Link href="/settings" aria-label="Ajustes" className="text-fg-muted hover:text-fg p-2">
          <Settings className="h-5 w-5" />
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="bg-bg-elevated border-border rounded-2xl border p-5">
          <p className="text-fg-muted text-xs uppercase tracking-wide">Rutina activa</p>
          {active ? (
            <>
              <p className="mt-2 text-xl font-semibold">{active.name}</p>
              <p className="text-fg-muted mt-1 text-sm">
                {routineDurationLabel(active.started_at) ?? "Sin fecha de inicio"}
              </p>
              <Link href="/train" className="mt-4 block">
                <BigButton size="md" className="w-full">
                  Empezar a entrenar
                </BigButton>
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-xl font-semibold">No tenés rutina activa todavía</p>
              <p className="text-fg-muted mt-1 text-sm">
                Creá tu primera rutina personalizada para empezar a entrenar.
              </p>
              <Link href="/routines/new" className="mt-4 block">
                <BigButton size="md" className="w-full">
                  Crear rutina
                </BigButton>
              </Link>
            </>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link href="/history">
            <div className="bg-bg-elevated border-border h-24 rounded-2xl border p-4">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Historial</p>
              <p className="mt-2 text-xl font-bold tabular-nums">{sessionCount}</p>
              <p className="text-fg-muted text-xs">
                {sessionCount === 1 ? "sesión" : "sesiones"}
              </p>
            </div>
          </Link>
          <Link href="/stats">
            <div className="bg-bg-elevated border-border h-24 rounded-2xl border p-4">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Stats</p>
              <p className="mt-2 text-xl font-bold">📈</p>
              <p className="text-fg-muted text-xs">progreso</p>
            </div>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
