"use client";

import { ChevronRight, Dumbbell } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
        <Skeleton className="h-24" />
      </AppShell>
    );
  }
  if (sessions.length === 0) {
    return (
      <AppShell title="Historial">
        <EmptyState
          icon={Dumbbell}
          title="Sin sesiones todavía"
          description="Cuando termines una sesión va a aparecer acá."
        />
      </AppShell>
    );
  }
  return (
    <AppShell title="Historial">
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link href={`/history/${s.id}`}>
              <Card padding="md" className="flex items-center gap-3">
                <div className="bg-accent/15 text-accent flex h-12 w-12 items-center justify-center rounded-xl">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{s.training_day_name}</p>
                  <p className="text-fg-muted text-xs">{fmtDate(s.started_at)}</p>
                </div>
                <ChevronRight className="text-fg-muted h-5 w-5" />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
