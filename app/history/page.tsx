"use client";

import { ChevronRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useFinishedSessions } from "@/lib/db/history-queries";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function HistoryPage() {
  const sessions = useFinishedSessions();
  if (sessions === undefined) {
    return (
      <AppShell title="Historial">
        <div className="bg-bg-elevated h-24 animate-pulse rounded-2xl" />
      </AppShell>
    );
  }
  if (sessions.length === 0) {
    return (
      <AppShell title="Historial">
        <div className="bg-bg-elevated border-border rounded-2xl border p-5 text-center">
          <Dumbbell className="text-fg-muted mx-auto h-8 w-8" />
          <p className="mt-2 font-semibold">Sin sesiones todavía</p>
          <p className="text-fg-muted mt-1 text-sm">
            Cuando termines una sesión va a aparecer acá.
          </p>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell title="Historial">
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/history/${s.id}`}
              className="bg-bg-elevated border-border flex items-center gap-3 rounded-2xl border p-4"
            >
              <div className="bg-accent/15 text-accent flex h-12 w-12 items-center justify-center rounded-xl">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{s.training_day_name}</p>
                <p className="text-fg-muted text-xs">{fmtDate(s.started_at)}</p>
              </div>
              <ChevronRight className="text-fg-muted h-5 w-5" />
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
