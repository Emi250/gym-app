"use client";

import Link from "next/link";
import { Archive, CheckCircle2, Circle, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { activateRoutine, useRoutines } from "@/lib/db/queries";
import { showToast } from "@/lib/toast/toast-store";
import { routineDurationLabel } from "@/lib/utils/routine-time";
import type { LocalRoutine } from "@/lib/db/types";

export default function RoutinesPage() {
  const data = useRoutines();
  return (
    <AppShell title="Rutinas">
      <div className="flex flex-col gap-6">
        <Link href="/routines/new" className="block">
          <BigButton size="lg" className="w-full">
            <Plus className="h-5 w-5" />
            Nueva rutina
          </BigButton>
        </Link>

        {!data ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <>
            <Section title="Activa">
              {data.active ? (
                <RoutineCard routine={data.active} state="active" />
              ) : (
                <EmptyHint>No tenés una rutina activa. Creá una o activá una existente.</EmptyHint>
              )}
            </Section>

            {data.inactive.length > 0 ? (
              <Section title="Inactivas">
                <ul className="flex flex-col gap-2">
                  {data.inactive.map((r) => (
                    <li key={r.id}>
                      <RoutineCard routine={r} state="inactive" />
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {data.archived.length > 0 ? (
              <Section title="Archivadas">
                <ul className="flex flex-col gap-2">
                  {data.archived.map((r) => (
                    <li key={r.id}>
                      <RoutineCard routine={r} state="archived" />
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-fg-muted text-xs font-semibold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <Card padding="md" className="text-fg-muted text-sm">
      {children}
    </Card>
  );
}

function RoutineCard({
  routine,
  state,
}: {
  routine: LocalRoutine;
  state: "active" | "inactive" | "archived";
}) {
  const duration = routineDurationLabel(routine.started_at);
  return (
    <Card padding="md" className="flex items-center gap-3">
      <ActivateButton routineId={routine.id} active={state === "active"} disabled={state === "archived"} />
      <Link href={`/routines/${routine.id}`} className="flex-1">
        <p className="text-base font-semibold">{routine.name}</p>
        <p className="text-fg-muted text-xs">
          {state === "archived" ? (
            <span className="inline-flex items-center gap-1">
              <Archive className="h-3 w-3" /> Archivada
            </span>
          ) : duration ? (
            duration
          ) : routine.started_at == null ? (
            "Sin fecha de inicio"
          ) : null}
        </p>
      </Link>
    </Card>
  );
}

function ActivateButton({
  routineId,
  active,
  disabled,
}: {
  routineId: string;
  active: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={active ? "Rutina activa" : "Activar rutina"}
      disabled={disabled}
      onClick={async () => {
        if (active || disabled) return;
        await activateRoutine(routineId);
        showToast("Rutina activada", "success");
      }}
      className="text-fg-muted disabled:opacity-30 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
    >
      {active ? (
        <CheckCircle2 className="text-accent h-7 w-7" />
      ) : (
        <Circle className="h-7 w-7" />
      )}
    </button>
  );
}
