"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExerciseHistoryPoint } from "@/lib/db/stats-queries";

interface ProgressChartProps {
  data: ExerciseHistoryPoint[];
  /** Which metric to plot. */
  metric: "max_weight_kg" | "total_volume" | "estimated_1rm";
}

const METRIC_LABEL: Record<ProgressChartProps["metric"], string> = {
  max_weight_kg: "Peso máximo (kg)",
  total_volume: "Volumen (kg·reps)",
  estimated_1rm: "1RM estimado (kg)",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" });

export function ProgressChart({ data, metric }: ProgressChartProps) {
  const chartData = useMemo(
    () =>
      data.map((p) => ({
        label: fmtDate(p.finished_at),
        finished_at: p.finished_at,
        value: p[metric],
      })),
    [data, metric],
  );

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-elevated border-border text-fg-muted flex h-56 items-center justify-center rounded-2xl border text-sm">
        Sin datos todavía
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated border-border h-56 rounded-2xl border p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }}
            tickLine={{ stroke: "var(--color-border)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            minTickGap={20}
          />
          <YAxis
            tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }}
            tickLine={{ stroke: "var(--color-border)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--color-fg-muted)" }}
            formatter={(value) => [value as number, METRIC_LABEL[metric]]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--color-accent)" }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
