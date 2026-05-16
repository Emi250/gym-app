"use client";

import { Dumbbell, LineChart, Settings } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SyncBadge } from "@/components/sync-badge";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
        <div className="flex items-center gap-1">
          <SyncBadge />
          <Link
            href="/settings"
            aria-label="Ajustes"
            className="text-fg-muted hover:bg-bg-elevated flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {active ? (
          <Card padding="lg">
            <p className="text-fg-muted text-xs uppercase tracking-wide">Rutina activa</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.02em]">{active.name}</p>
            <p className="text-fg-muted mt-1 text-sm">
              {routineDurationLabel(active.started_at) ?? "Sin fecha de inicio"}
            </p>
            <Link href="/train" className="mt-4 block">
              <BigButton size="md" className="w-full">
                Empezar a entrenar
              </BigButton>
            </Link>
          </Card>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No tenés rutina activa"
            description="Creá tu primera rutina personalizada para empezar a entrenar."
            action={
              <Link href="/routines/new" className="w-full">
                <BigButton size="md" className="w-full">
                  Crear rutina
                </BigButton>
              </Link>
            }
          />
        )}

        <section className="grid grid-cols-2 gap-3">
          <Link href="/history">
            <Card padding="md" interactive className="h-24">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Historial</p>
              <p className="mt-2 text-xl font-bold tabular-nums">{sessionCount}</p>
              <p className="text-fg-muted text-xs">
                {sessionCount === 1 ? "sesión" : "sesiones"}
              </p>
            </Card>
          </Link>
          <Link href="/stats">
            <Card padding="md" interactive className="flex h-24 flex-col justify-between">
              <p className="text-fg-muted text-xs uppercase tracking-wide">Stats</p>
              <div className="flex items-center gap-2">
                <LineChart className="text-accent h-5 w-5" />
                <p className="text-sm font-medium">Ver progreso</p>
              </div>
            </Card>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
