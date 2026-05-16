"use client";

import { ArrowDown, ArrowUp, Check, Minus, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BigButton } from "@/components/ui/big-button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { applyProgressionToSession, type ProgressionDiff } from "@/lib/progression/apply";
import { useSession } from "@/lib/db/session-queries";

/**
 * Post-session screen. We re-run progression in read-only mode here for
 * display — applyProgressionToSession is idempotent because it always
 * computes from the snapshot, and re-writing the same target_weight_kg is fine.
 *
 * In practice this page is reached after the algorithm already ran during
 * "Terminar sesión", so the diffs returned here mirror what's already persisted.
 */
export default function FinishPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession(params.id);
  const [diffs, setDiffs] = useState<ProgressionDiff[] | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;
    void applyProgressionToSession(params.id).then((d) => {
      if (!cancelled) setDiffs(d);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (session === undefined || diffs === null) {
    return (
      <AppShell title="Sesión terminada">
        <Skeleton className="h-48" />
      </AppShell>
    );
  }
  if (session === null) {
    return (
      <AppShell title="Sesión terminada">
        <p className="text-fg-muted">No se encontró la sesión.</p>
      </AppShell>
    );
  }

  const progressed = diffs.filter((d) => d.reason === "progressed");
  const maintained = diffs.filter((d) => d.reason === "maintained");
  const deloaded = diffs.filter((d) => d.reason === "deload");

  return (
    <AppShell title="Sesión terminada">
      <div className="flex flex-col gap-5">
        <Card padding="lg" className="flex items-center gap-3">
          <div className="bg-accent/15 text-accent flex h-12 w-12 items-center justify-center rounded-control">
            <PartyPopper className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-accent text-xl font-semibold tracking-[-0.02em]">¡Listo!</p>
            <p className="text-fg-muted text-xs">{session.session.training_day_name}</p>
          </div>
        </Card>

        {diffs.length === 0 ? (
          <Card padding="md" className="text-fg-muted text-sm">
            No registraste series, así que no hay ajustes que aplicar.
          </Card>
        ) : (
          <section className="flex flex-col gap-3">
            <h2 className="text-fg-muted text-xs font-semibold uppercase tracking-wide">
              Próximos pesos
            </h2>
            <ul className="flex flex-col gap-2">
              {progressed.map((d) => (
                <DiffRow key={d.exercise_id} diff={d} />
              ))}
              {deloaded.map((d) => (
                <DiffRow key={d.exercise_id} diff={d} />
              ))}
              {maintained.map((d) => (
                <DiffRow key={d.exercise_id} diff={d} />
              ))}
            </ul>
          </section>
        )}

        <BigButton onClick={() => router.replace("/")}>
          <Check className="h-5 w-5" />
          Volver al inicio
        </BigButton>
        <Link href="/history">
          <BigButton variant="ghost" size="md" className="w-full">
            Ver historial
          </BigButton>
        </Link>
      </div>
    </AppShell>
  );
}

function DiffRow({ diff }: { diff: ProgressionDiff }) {
  const icon =
    diff.reason === "progressed" ? (
      <ArrowUp className="text-accent h-4 w-4" />
    ) : diff.reason === "deload" ? (
      <ArrowDown className="text-danger h-4 w-4" />
    ) : (
      <Minus className="text-fg-muted h-4 w-4" />
    );
  const label =
    diff.reason === "progressed"
      ? `+${(diff.next_weight_kg - diff.previous_weight_kg).toFixed(1)} kg`
      : diff.reason === "deload"
        ? "Deload"
        : "Mantiene";
  return (
    <li>
      <Card padding="sm" className="flex items-center justify-between">
        <span>
          <span className="block font-medium">{diff.exercise_name}</span>
          <span className="text-fg-muted font-mono text-xs tabular-nums">
            {diff.previous_weight_kg} kg → {diff.next_weight_kg} kg
          </span>
        </span>
        <span className="flex items-center gap-1 font-mono text-sm font-medium tabular-nums">
          {icon}
          {label}
        </span>
      </Card>
    </li>
  );
}
