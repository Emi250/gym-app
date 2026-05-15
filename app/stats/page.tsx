"use client";

import { LineChart, TrendingUp } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProgressChart } from "@/components/progress-chart";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useExerciseHistory, useTrainedExercises } from "@/lib/db/stats-queries";
import { cn } from "@/lib/utils/cn";

type Metric = "max_weight_kg" | "total_volume" | "estimated_1rm";

const METRICS: { id: Metric; label: string }[] = [
  { id: "max_weight_kg", label: "Peso máx." },
  { id: "estimated_1rm", label: "1RM est." },
  { id: "total_volume", label: "Volumen" },
];

const fmtFullDate = (iso: string) =>
  new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function StatsPage() {
  const trained = useTrainedExercises();
  const [explicitId, setExplicitId] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("max_weight_kg");

  // Default-select the first trained exercise unless the user picked one.
  // Derived inline so we don't need a setState-in-effect dance.
  const selectedId =
    explicitId && trained?.some((e) => e.id === explicitId)
      ? explicitId
      : (trained?.[0]?.id ?? null);

  const history = useExerciseHistory(selectedId);

  if (trained === undefined) {
    return (
      <AppShell title="Stats">
        <Skeleton className="h-32" />
      </AppShell>
    );
  }
  if (trained.length === 0) {
    return (
      <AppShell title="Stats">
        <EmptyState
          icon={LineChart}
          title="Sin datos todavía"
          description="Registrá al menos una sesión para ver tu progreso por ejercicio."
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Stats">
      <div className="flex flex-col gap-5">
        <Field label="Ejercicio" htmlFor="stats-exercise">
          <Select
            id="stats-exercise"
            value={selectedId ?? ""}
            onChange={(e) => setExplicitId(e.target.value || null)}
          >
            {trained.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex gap-2 overflow-x-auto">
          {METRICS.map((m) => (
            <Chip key={m.id} active={metric === m.id} onClick={() => setMetric(m.id)}>
              {m.label}
            </Chip>
          ))}
        </div>

        <ProgressChart data={history ?? []} metric={metric} />

        {history && history.length > 0 ? <SummaryStrip points={history} /> : null}

        <section className="flex flex-col gap-2">
          <h2 className="text-fg-muted text-xs font-semibold uppercase tracking-wide">
            Historial de este ejercicio
          </h2>
          {!history || history.length === 0 ? (
            <Card padding="md" className="text-fg-muted text-sm">
              Sin sesiones registradas.
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {[...history].reverse().map((p) => (
                <li key={p.session_id}>
                  <Card padding="sm">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium">{fmtFullDate(p.finished_at)}</p>
                      <p className="text-fg-muted text-xs tabular-nums">
                        máx {p.max_weight_kg} kg · vol {p.total_volume.toFixed(0)}
                      </p>
                    </div>
                    <ul className="text-fg-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {p.sets.map((s) => (
                        <li key={s.set_number} className="tabular-nums">
                          {s.weight_kg}×{s.reps}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryStrip({ points }: { points: import("@/lib/db/stats-queries").ExerciseHistoryPoint[] }) {
  const last = points[points.length - 1];
  const first = points[0];
  const delta = points.length >= 2 ? last.max_weight_kg - first.max_weight_kg : 0;
  const bestEver = points.reduce((m, p) => Math.max(m, p.max_weight_kg), 0);
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Sesiones" value={points.length.toString()} />
      <Stat label="Mejor peso" value={`${bestEver} kg`} />
      <Stat
        label="Δ inicio"
        value={`${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg`}
        accent={delta > 0}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card padding="sm">
      <p className="text-fg-muted text-[10px] uppercase tracking-wide">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-bold tabular-nums",
          accent ? "text-accent" : "",
        )}
      >
        <span className="inline-flex items-center gap-1">
          {accent ? <TrendingUp className="h-4 w-4" /> : null}
          {value}
        </span>
      </p>
    </Card>
  );
}
